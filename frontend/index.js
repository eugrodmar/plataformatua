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

const HORA_INICIO_PROGRAMA = '22:05';
const DOMINIO_USUARIOS = 'plataformatua.local';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let seccionesArray = [];
let miniSeccionesArray = [];
let entrevistaData = { texto: '', duracion: '', observaciones: '' };
let escaletaFinal = [];
let locutores, duracion, seccion, minisecciones;
let currentStep = 0;

// Ocultar elementos al inicio
bttnVistaPrevia.style.display = 'none';

comprobarSesion();

async function comprobarSesion() {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
        entrarAlaApp();
    }
}

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

function entrarAlaApp() {
    document.getElementById('login').style.display = 'none';
    document.getElementById('bienvenida').style.display = 'block';
    cargarOpciones();
}

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

function comenzar() {
    document.getElementById('bienvenida').style.display = 'none';
    pregunta1.classList.add('visible');
    currentStep = 1;
}

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

function continuarPregunta3() {
    pregunta3.classList.remove('visible');
    generarSecciones();
    bttnVistaPrevia.style.display = 'block';
    currentStep = 4;
}

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

function poblarSelect(select, opciones) {
    opciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op;
        option.textContent = op;
        select.appendChild(option);
    });
}

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

function continuarPregunta2() {
    if (miniSelect.value !== 'true') {
        miniSeccionesArray = [];
    }

    pregunta2.classList.remove('visible');
    pregunta3.classList.add('visible');
    currentStep = 3;
}

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


function mostrarPrevisualizacion() {
    escaletaFinal = construirEscaletaFinal();
    desplegablesContainer.style.display = 'none';
    bttnVistaPrevia.style.display = 'none';
    previsualizacion.classList.add('mostrar');
    renderBloques();
    currentStep = 5;
}

function volverAEditar() {
    previsualizacion.classList.remove('mostrar');
    desplegablesContainer.style.display = 'block';
    bttnVistaPrevia.style.display = 'block';
    currentStep = 4;
}

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

function renderBloques() {
    listaBloques.innerHTML = '';
    escaletaFinal.forEach(bloque => {
        listaBloques.appendChild(crearTarjetaBloque(bloque));
    });
}

function agregarLinea(tarjeta, etiqueta, valor) {
    if (!valor) return;
    const p = document.createElement('p');
    p.textContent = `${etiqueta}: ${valor}`;
    tarjeta.appendChild(p);
}

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

Sortable.create(listaBloques, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: function (evt) {
        const [movido] = escaletaFinal.splice(evt.oldIndex, 1);
        escaletaFinal.splice(evt.newIndex, 0, movido);
    }
});

function combinarContenido(titulo, subtitulo) {
    if (!titulo && !subtitulo) return '';
    if (!subtitulo) return titulo;
    if (!titulo) return `"${subtitulo}"`;
    return `${titulo}\n"${subtitulo}"`;
}

function parseDuracionAMinutos(duracionStr) {
    if (!duracionStr) return 0;
    const match = duracionStr.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}

function formatearMinutos(totalMinutos) {
    const minutosEnDia = ((totalMinutos % 1440) + 1440) % 1440;
    const horas = Math.floor(minutosEnDia / 60);
    const minutos = minutosEnDia % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

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