// Referencias a los elementos del HTML que se usan en todo el archivo
const desplegablesContainer = document.getElementById('desplegable-container');
const cantidadSelect = document.getElementById('cantidad');
const miniSelect = document.getElementById('mini');
const interviewSelect = document.getElementById('interview');
const pregunta1 = document.getElementById('pregunta-1');
const pregunta2 = document.getElementById('pregunta-2');
const pregunta3 = document.getElementById('pregunta-3');
const bttnVistaPrevia = document.getElementById('btn-vista-previa');
const bttnVolver = document.getElementById('btn-volver');
const continuar3 = document.getElementById('continuar-3');
const previsualizacion = document.getElementById('previsualizacion');
const listaBloques = document.getElementById('lista-bloques');

const entrevistaExtra = document.getElementById('entrevista-extra');
const entrevistaTexto = document.getElementById('entrevista-texto');
const entrevistaDuracionSelect = document.getElementById('entrevista-duracion');
const entrevistaObservaciones = document.getElementById('entrevista-observaciones');
const continuar1 = document.getElementById('continuar-1');

const miniExtra = document.getElementById('mini-extra');
const miniCantidadSelect = document.getElementById('mini-cantidad');
const miniNombresContainer = document.getElementById('mini-nombres-container');
const continuar2 = document.getElementById('continuar-2');

const loginName = document.getElementById('login-name');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

const buscador = document.getElementById('buscador');
const buscadorInput = document.getElementById('buscador-input');
const buscadorResultados = document.getElementById('buscador-resultados');

// Hora a la que empieza el programa; a partir de aquí se calcula el horario de cada bloque
const HORA_INICIO_PROGRAMA = '22:05';

// Supabase Auth solo admite login por email, así que cada usuario se identifica como
// "nombre@plataformatua.local" (un email falso que nunca se usa para enviar nada)
const DOMINIO_USUARIOS = 'plataformatua.local';

// Cliente de Supabase: mismo objeto para hacer login y para leer la tabla "opciones"
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Episodios de Spotify ya descargados, para no volver a pedirlos en cada
// búsqueda (se rellena la primera vez que se abre el buscador)
let episodiosCache = null;

// Estado de la escaleta que se está montando
let seccionesArray = [];
let miniSeccionesArray = [];
let entrevistaData = { texto: '', duracion: '', observaciones: '' };
let escaletaFinal = [];

// Listas de opciones cargadas desde Supabase (locutores, duraciones, tipos de sección...)
let locutores, duracion, seccion, minisecciones;

// Paso actual del flujo (0 = login, 1 = pregunta entrevista, 2 = minisección,
// 3 = número de secciones, 4 = editando secciones, 5 = previsualización).
// Lo usa retroceder() para saber a qué pantalla volver.
let currentStep = 0;

// Ocultar elementos al inicio
bttnVistaPrevia.style.display = 'none';

comprobarSesion();

// Si el usuario ya había iniciado sesión antes, se salta la pantalla de login
async function comprobarSesion() {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
        entrarAlaApp();
    }
}

// Envía el formulario de login: convierte el nombre de usuario en el email falso
// que espera Supabase y comprueba usuario/contraseña
async function iniciarSesion() {
    loginError.textContent = '';

    const email = `${loginName.value.trim()}@${DOMINIO_USUARIOS}`;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password: loginPassword.value
    });

    if (error) {
        loginError.textContent = 'Usuario o contraseña incorrectos';
        return;
    }

    entrarAlaApp();
}

// Se llama tras un login correcto (o si ya había sesión): oculta el login,
// muestra la bienvenida y carga los datos necesarios para empezar
function entrarAlaApp() {
    document.getElementById('login').style.display = 'none';
    document.getElementById('bienvenida').style.display = 'block';
    cargarOpciones();
}

// Lee la tabla "opciones" de Supabase y la reparte en las cuatro listas
// (locutores, duracion, seccion, minisecciones) que usa el resto de la app
async function cargarOpciones() {
    const { data, error } = await supabaseClient
        .from('opciones')
        .select('categoria, valor')
        .order('orden');

    if (error) {
        console.error('Error al cargar opciones', error);
        return;
    }

    locutores = data.filter(o => o.categoria === 'locutor').map(o => o.valor);
    duracion = data.filter(o => o.categoria === 'duracion').map(o => o.valor);
    seccion = data.filter(o => o.categoria === 'seccion').map(o => o.valor);
    minisecciones = data.filter(o => o.categoria === 'minisección').map(o => o.valor);

    poblarSelect(entrevistaDuracionSelect, duracion);
    iniciarEscaleta();
}

// Botón "Crear escaleta": oculta la bienvenida y muestra la primera pregunta
function escaleta() {
    document.getElementById('bienvenida').style.display = 'none';
    pregunta1.classList.add('visible');
    currentStep = 1;
}

// Botón "Buscar temas ya tratados": abre el buscador y, la primera vez,
// descarga los episodios de Spotify a través de la Netlify Function
async function mostrarBuscador() {
    document.getElementById('bienvenida').style.display = 'none';
    buscador.style.display = 'block';
    buscadorInput.value = '';
    buscadorResultados.innerHTML = '';

    if (episodiosCache) return;

    buscadorResultados.textContent = 'Cargando episodios...';

    try {
        const respuesta = await fetch('/.netlify/functions/buscar-episodios');
        episodiosCache = await respuesta.json();
        buscadorResultados.textContent = '';
    } catch (error) {
        console.error('Error al cargar episodios', error);
        buscadorResultados.textContent = 'No se han podido cargar los episodios.';
    }
}

// Botón "Volver" del buscador: cierra el buscador y vuelve a la bienvenida
function volverDesdeBuscador() {
    buscador.style.display = 'none';
    document.getElementById('bienvenida').style.display = 'block';
}

// Resultados de la búsqueda actual y cuántos se han pintado ya (se muestran
// de TAMANO_PAGINA en TAMANO_PAGINA con el botón "Ver más resultados")
let resultadosBusquedaActual = [];
let resultadosMostrados = 0;
const TAMANO_PAGINA = 10;

// Filtra episodiosCache por lo escrito, comparando tanto el nombre como la
// descripción del episodio, y pinta la primera tanda de resultados
function buscarEpisodios(texto) {
    buscadorResultados.innerHTML = '';
    resultadosBusquedaActual = [];
    resultadosMostrados = 0;

    if (!episodiosCache) return;

    const termino = texto.trim().toLowerCase();
    if (!termino) return;

    resultadosBusquedaActual = episodiosCache.filter(ep =>
        ep.nombre.toLowerCase().includes(termino) ||
        (ep.descripcion || '').toLowerCase().includes(termino)
    );

    if (resultadosBusquedaActual.length === 0) {
        buscadorResultados.textContent = 'No se ha encontrado ningún episodio con ese tema.';
        return;
    }

    mostrarMasResultados();
}

// Añade la siguiente tanda de tarjetas (10 más) y, si aún quedan resultados
// por mostrar, deja el botón "Ver más resultados" al final de la lista
function mostrarMasResultados() {
    const botonAnterior = document.getElementById('boton-ver-mas');
    if (botonAnterior) botonAnterior.remove();

    const siguienteTanda = resultadosBusquedaActual.slice(resultadosMostrados, resultadosMostrados + TAMANO_PAGINA);
    siguienteTanda.forEach(ep => buscadorResultados.appendChild(crearTarjetaEpisodio(ep)));
    resultadosMostrados += siguienteTanda.length;

    if (resultadosMostrados < resultadosBusquedaActual.length) {
        const boton = document.createElement('button');
        boton.id = 'boton-ver-mas';
        boton.textContent = 'Ver más resultados';
        boton.onclick = mostrarMasResultados;
        buscadorResultados.appendChild(boton);
    }
}

buscadorInput.addEventListener('input', function (e) {
    buscarEpisodios(e.target.value);
});

// Crea la tarjeta de un episodio encontrado, con enlace directo a Spotify
function crearTarjetaEpisodio(ep) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'episodio-resultado';

    const titulo = document.createElement('h3');
    titulo.textContent = ep.nombre;
    tarjeta.appendChild(titulo);

    const fecha = document.createElement('p');
    fecha.className = 'episodio-fecha';
    fecha.textContent = ep.fecha;
    tarjeta.appendChild(fecha);

    if (ep.descripcion) {
        const descripcion = document.createElement('p');
        descripcion.textContent = ep.descripcion;
        tarjeta.appendChild(descripcion);
    }

    const enlace = document.createElement('a');
    enlace.href = ep.url;
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    enlace.textContent = 'Escuchar en Spotify';
    tarjeta.appendChild(enlace);

    return tarjeta;
}

// Engancha los listeners de las tres preguntas iniciales. Se llama una sola vez,
// cuando ya han llegado los datos de Supabase (locutores, duraciones...)
function iniciarEscaleta() {

    // Pregunta 1: mostrar/ocultar campos de entrevista y habilitar continuar
    interviewSelect.addEventListener('change', function () {
        entrevistaExtra.classList.toggle('mostrar', interviewSelect.value === 'true');
        continuar1.classList.add('mostrar');
    });

    // Pregunta 2: mostrar/ocultar campos de minisección
    miniSelect.addEventListener('change', function () {
        const hayMini = miniSelect.value === 'true';
        miniExtra.classList.toggle('mostrar', hayMini);

        if (hayMini) {
            miniCantidadSelect.value = '';
            miniNombresContainer.innerHTML = '';
            miniSeccionesArray = [];
            continuar2.classList.remove('mostrar');
        } else {
            continuar2.classList.add('mostrar');
        }
    });

    // Elegido el número de minisecciones → generar los selects de nombres
    miniCantidadSelect.addEventListener('change', function () {
        generarMiniSecciones();
        continuar2.classList.add('mostrar');
    });

    // Pregunta 3 → habilitar continuar
    cantidadSelect.addEventListener('change', function () {
        continuar3.classList.add('mostrar');
    });
}

// Botón "Continuar" de la pregunta 3: genera el formulario de secciones y
// pasa al paso 4 (edición de secciones)
function continuarPregunta3() {
    pregunta3.classList.remove('visible');
    generarSecciones();
    bttnVistaPrevia.style.display = 'block';
    currentStep = 4;
}

// Botón "Continuar" de la pregunta 1: guarda los datos de la entrevista
// (si la hay) y pasa a la pregunta 2
function continuarPregunta1() {
    if (interviewSelect.value === 'true') {
        entrevistaData.texto = entrevistaTexto.value;
        entrevistaData.duracion = entrevistaDuracionSelect.value;
        entrevistaData.observaciones = entrevistaObservaciones.value;
    } else {
        entrevistaData = { texto: '', duracion: '', observaciones: '' };
    }

    pregunta1.classList.remove('visible');
    pregunta2.classList.add('visible');
    currentStep = 2;
    bttnVolver.style.display = 'block';
}

// Rellena un <select> con una <option> por cada valor de la lista dada
function poblarSelect(select, opciones) {
    opciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op;
        option.textContent = op;
        select.appendChild(option);
    });
}

// Crea, para cada minisección elegida, un par de selects (nombre y duración)
// y los guarda en miniSeccionesArray
function generarMiniSecciones() {
    const cantidad = parseInt(miniCantidadSelect.value);
    miniSeccionesArray = [];
    miniNombresContainer.innerHTML = '';

    for (let i = 0; i < cantidad; i++) {
        const labelNombre = document.createElement('label');
        labelNombre.textContent = `Minisección ${i + 1}`;

        const selectNombre = document.createElement('select');
        poblarSelect(selectNombre, minisecciones);

        const labelDuracion = document.createElement('label');
        labelDuracion.textContent = 'Duración';

        const selectDuracion = document.createElement('select');
        poblarSelect(selectDuracion, duracion);

        miniSeccionesArray.push({ nombre: selectNombre.value, duracion: selectDuracion.value });

        selectNombre.addEventListener('change', function (e) {
            miniSeccionesArray[i].nombre = e.target.value;
        });

        selectDuracion.addEventListener('change', function (e) {
            miniSeccionesArray[i].duracion = e.target.value;
        });

        miniNombresContainer.appendChild(labelNombre);
        miniNombresContainer.appendChild(selectNombre);
        miniNombresContainer.appendChild(labelDuracion);
        miniNombresContainer.appendChild(selectDuracion);
    }
}

// Botón "Continuar" de la pregunta 2: si no hay minisecciones, limpia lo que
// hubiera antes, y pasa a la pregunta 3 (número de secciones)
function continuarPregunta2() {
    if (miniSelect.value !== 'true') {
        miniSeccionesArray = [];
    }

    pregunta2.classList.remove('visible');
    pregunta3.classList.add('visible');
    currentStep = 3;
}

// Botón "← Volver": deshace un paso del flujo según en cuál esté currentStep
function retroceder() {
    if (currentStep === 5) {
        volverAEditar();
    } else if (currentStep === 4) {
        desplegablesContainer.innerHTML = '';
        bttnVistaPrevia.style.display = 'none';
        seccionesArray = [];
        pregunta3.classList.add('visible');
        currentStep = 3;
    } else if (currentStep === 3) {
        pregunta3.classList.remove('visible');
        pregunta2.classList.add('visible');
        currentStep = 2;
    } else if (currentStep === 2) {
        pregunta2.classList.remove('visible');
        pregunta1.classList.add('visible');
        currentStep = 1;
        bttnVolver.style.display = 'none';
    }
}

// Crea un campo (label + input/select/textarea) para una sección concreta,
// y lo conecta con seccionesArray para que se actualice al escribir/elegir
function crearCampo(config, seccionObj, indice) {
    const label = document.createElement('label');
    label.textContent = config.label;

    let input;
    if (config.type === 'input') {
        input = document.createElement('input');
        input.type = 'text';
        input.value = seccionObj[config.campo];
    } else if (config.type === 'textarea') {
        input = document.createElement('textarea');
        input.value = seccionObj[config.campo];
    } else if (config.type === 'select') {
        input = document.createElement('select');
        config.opciones.forEach(op => {
            const option = document.createElement('option');
            option.value = op;
            option.textContent = op;
            if (seccionObj[config.campo] === op) option.selected = true;
            input.appendChild(option);
        });
    }

    // Sincroniza el modelo con el valor que el navegador muestra por defecto
    // (p. ej. la primera opción de un select) aunque el usuario no lo toque
    if (!seccionObj[config.campo]) {
        seccionObj[config.campo] = input.value;
    }

    input.setAttribute('data-campo', config.campo);
    input.setAttribute('data-seccion', indice);

    input.addEventListener('input', function (e) {
        const idx = parseInt(e.target.getAttribute('data-seccion'));
        const campo = e.target.getAttribute('data-campo');
        seccionesArray[idx][campo] = e.target.value;
    });

    return { label, input };
}

// Ajusta seccionesArray al número elegido (añade o recorta) y pinta el
// formulario editable de cada sección (locutor, duración, tema, cama...)
function generarSecciones() {
    const cantidad = parseInt(cantidadSelect.value);

    if (cantidad > seccionesArray.length) {
        for (let i = seccionesArray.length; i < cantidad; i++) {
            seccionesArray.push({
                locutor: '',
                duracion: '',
                tipo: '',
                tema: '',
                cama: '',
                observaciones: ''
            });
        }
    } else if (cantidad < seccionesArray.length) {
        seccionesArray = seccionesArray.slice(0, cantidad);
    }

    desplegablesContainer.innerHTML = '';

    const campos = [
        { label: 'Locutor/locutora', type: 'select', campo: 'locutor', opciones: locutores },
        { label: 'Duración', type: 'select', campo: 'duracion', opciones: duracion },
        { label: 'Sección', type: 'select', campo: 'tipo', opciones: seccion },
        { label: 'Tema', type: 'input', campo: 'tema' },
        { label: 'Cama', type: 'input', campo: 'cama' },
        { label: 'Observaciones', type: 'textarea', campo: 'observaciones' }
    ];

    seccionesArray.forEach((seccionObj, i) => {
        const divSeccion = document.createElement('div');
        divSeccion.className = 'seccion';
        divSeccion.setAttribute('data-seccion', i);

        campos.forEach(c => {
            const { label, input } = crearCampo(c, seccionObj, i);
            divSeccion.appendChild(label);
            divSeccion.appendChild(input);
        });

        desplegablesContainer.appendChild(divSeccion);
    });
}

// Botón "Vista previa": junta entrevista + minisecciones + secciones en un
// único orden (escaletaFinal) y muestra la pantalla de previsualización
function mostrarPrevisualizacion() {
    escaletaFinal = construirEscaletaFinal();
    desplegablesContainer.style.display = 'none';
    bttnVistaPrevia.style.display = 'none';
    previsualizacion.classList.add('mostrar');
    renderBloques();
    currentStep = 5;
}

// Botón "Volver a editar": cierra la previsualización y vuelve al formulario de secciones
function volverAEditar() {
    previsualizacion.classList.remove('mostrar');
    desplegablesContainer.style.display = 'block';
    bttnVistaPrevia.style.display = 'block';
    currentStep = 4;
}

// Construye la lista ordenada de "bloques" (entrevista, minisecciones y
// secciones) que se muestra en la previsualización y se usa para el PDF
function construirEscaletaFinal() {
    const bloques = [];

    if (interviewSelect.value === 'true') {
        bloques.push({
            tipo: 'entrevista',
            titulo: 'Entrevista',
            texto: entrevistaData.texto,
            duracion: entrevistaData.duracion,
            observaciones: entrevistaData.observaciones
        });
    }

    miniSeccionesArray.forEach(m => {
        bloques.push({ tipo: 'minisección', titulo: `Minisección: ${m.nombre}`, nombre: m.nombre, duracion: m.duracion });
    });

    seccionesArray.forEach((s, i) => {
        bloques.push({
            tipo: 'sección',
            titulo: s.tipo ? `Sección: ${s.tipo}` : `Sección ${i + 1}`,
            nombreSeccion: s.tipo,
            locutor: s.locutor,
            duracion: s.duracion,
            tema: s.tema,
            cama: s.cama,
            observaciones: s.observaciones
        });
    });

    return bloques;
}

// Vacía y vuelve a pintar la lista de tarjetas de la previsualización
// a partir de escaletaFinal (se llama al mostrarla y tras reordenarla)
function renderBloques() {
    listaBloques.innerHTML = '';
    escaletaFinal.forEach(bloque => {
        listaBloques.appendChild(crearTarjetaBloque(bloque));
    });
}

// Añade a una tarjeta una línea "Etiqueta: valor", pero solo si hay valor
// (evita líneas vacías tipo "Cama: " cuando ese campo no se ha rellenado)
function agregarLinea(tarjeta, etiqueta, valor) {
    if (!valor) return;
    const p = document.createElement('p');
    p.textContent = `${etiqueta}: ${valor}`;
    tarjeta.appendChild(p);
}

// Crea la tarjeta de un bloque para la previsualización, con los datos
// que correspondan según sea entrevista, minisección o sección
function crearTarjetaBloque(bloque) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'bloque-preview';

    const titulo = document.createElement('h3');
    titulo.textContent = bloque.titulo;
    tarjeta.appendChild(titulo);

    if (bloque.tipo === 'entrevista') {
        agregarLinea(tarjeta, 'Texto', bloque.texto);
        agregarLinea(tarjeta, 'Duración', bloque.duracion);
        agregarLinea(tarjeta, 'Observaciones', bloque.observaciones);
    } else if (bloque.tipo === 'minisección') {
        agregarLinea(tarjeta, 'Duración', bloque.duracion);
    } else if (bloque.tipo === 'sección') {
        agregarLinea(tarjeta, 'Locutor/a', bloque.locutor);
        agregarLinea(tarjeta, 'Duración', bloque.duracion);
        agregarLinea(tarjeta, 'Tema', bloque.tema);
        agregarLinea(tarjeta, 'Cama', bloque.cama);
        agregarLinea(tarjeta, 'Observaciones', bloque.observaciones);
    }

    return tarjeta;
}

// Activa el arrastrar-y-soltar (ratón y dedo) sobre el contenedor de tarjetas.
// Al soltar una tarjeta en otra posición, reordena escaletaFinal para que
// coincida con el nuevo orden visual
Sortable.create(listaBloques, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: function (evt) {
        const [movido] = escaletaFinal.splice(evt.oldIndex, 1);
        escaletaFinal.splice(evt.newIndex, 0, movido);
    }
});

// Junta un título y un subtítulo en el formato "TÍTULO\n"subtítulo"" que se
// usa en la columna CONTENIDO del PDF, omitiendo la parte que falte
function combinarContenido(titulo, subtitulo) {
    if (!titulo && !subtitulo) return '';
    if (!subtitulo) return titulo;
    if (!titulo) return `"${subtitulo}"`;
    return `${titulo}\n"${subtitulo}"`;
}

// Extrae el número de minutos de un texto de duración tipo "15 min"
function parseDuracionAMinutos(duracionStr) {
    if (!duracionStr) return 0;
    const match = duracionStr.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}

// Convierte un total de minutos del día en texto "HH:MM"
function formatearMinutos(totalMinutos) {
    const minutosEnDia = ((totalMinutos % 1440) + 1440) % 1440;
    const horas = Math.floor(minutosEnDia / 60);
    const minutos = minutosEnDia % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

// Calcula el horario "inicio-fin" de cada bloque, empezando en
// HORA_INICIO_PROGRAMA y sumando las duraciones una tras otra
function calcularHorarios(bloques) {
    const [horaIni, minIni] = HORA_INICIO_PROGRAMA.split(':').map(Number);
    let minutoActual = horaIni * 60 + minIni;

    return bloques.map(bloque => {
        const duracionMin = parseDuracionAMinutos(bloque.duracion);
        const inicio = minutoActual;
        const fin = minutoActual + duracionMin;
        minutoActual = fin;
        return `${formatearMinutos(inicio)}-${formatearMinutos(fin)}`;
    });
}

// Convierte un bloque (entrevista, minisección o sección) en la fila que
// aparecerá en la tabla del PDF, con sus columnas en el orden correcto
function filaDeBloque(bloque, horario) {
    if (bloque.tipo === 'entrevista') {
        return [
            horario,
            combinarContenido('ENTREVISTA', bloque.texto),
            '',
            bloque.duracion || '',
            '',
            bloque.observaciones || ''
        ];
    }

    if (bloque.tipo === 'minisección') {
        return [
            horario,
            `MINISECCIÓN: ${bloque.nombre || ''}`,
            '',
            bloque.duracion || '',
            '',
            ''
        ];
    }

    return [
        horario,
        combinarContenido((bloque.nombreSeccion || '').toUpperCase(), bloque.tema),
        bloque.locutor || '',
        bloque.duracion || '',
        bloque.cama || '',
        bloque.observaciones || ''
    ];
}

// Botón "Generar PDF": calcula los horarios sobre el orden final de
// escaletaFinal y genera el documento en horizontal como una tabla
function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    const horarios = calcularHorarios(escaletaFinal);

    doc.autoTable({
        head: [['HORARIO', 'CONTENIDO', 'ENCARGADO', 'TIEMPO', 'CAMA', 'OBSERVACIONES']],
        body: escaletaFinal.map((bloque, i) => filaDeBloque(bloque, horarios[i])),
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3,
            valign: 'top',
            lineColor: [0, 0, 0],
            lineWidth: 0.3
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center'
        }
    });

    doc.save('escaleta.pdf');
}
