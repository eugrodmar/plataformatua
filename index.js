/*
Declaramos las variables de JS que van a estar relacionadas con el HTML.
cantidadSelect hace referencia al select con id cantidad.
desplegablesContainer hace referencia al div con id desplegable-container
que va a almacernar el número total de secciones que va a tener la escaleta
 */
const cantidadSelect = document.getElementById('cantidad');
const desplegablesContainer = document.getElementById('desplegable-container');
const especialSelect = document.getElementById('especial');
const miniSelect = document.getElementById('mini');
const pregunta1 = document.getElementById('pregunta-1');
const pregunta2 = document.getElementById('pregunta-2');
const pregunta3 = document.getElementById('pregunta-3');

/*
Declaramos esta variable para el JS.
Es un array vacio que va a almacenar N secciones y sus datos
*/
let seccionesArray = [];

/*
Variables para almacenar los datos del JSON
Declaradas aquí para que sean accesibles en todo el archivo
*/
let locutores, duracion, seccion;

/*
Realizamos un fetch al archivo local o a la API para tomar los nombres de los locutores.
Hasta que no se carguen los datos del JSON no se va a iniciar el resto del código que
está dentro de la función iniciarEscaleta(); de tal forma que se evitan errores como que
el select está vacío o undefined.
*/
fetch('/opciones.json')
    .then(res => res.json())
    .then(data => {

        // Validación de datos
        if (!data.locutores || !data.duracion || !data.seccion) {
            console.error('Datos incompletos en JSON');
            return;
        }

        locutores = data.locutores;
        duracion = data.duracion;
        seccion = data.seccion;
        iniciarEscaleta();
    })
    .catch(err => console.error('Error al cargar la lista de locutores', err));

function iniciarEscaleta(){

// Mostrar la primera pregunta al iniciar
pregunta1.classList.add('visible');

// Event listener para mostrar la segunda pregunta cuando se contesta la primera
especialSelect.addEventListener('change', function(){
    pregunta2.classList.add('visible');
});

// Event listener para mostrar la tercera pregunta cuando se contesta la segunda
cantidadSelect.addEventListener('change', function(){
    pregunta3.classList.add('visible');
});

// Event listener para generar secciones cuando se contesta la tercera pregunta
miniSelect.addEventListener('change', function(){
    generarSecciones();
});

}

/*
Crea un campo individual (label + input/select/textarea)
Parámetros:
- config: objeto con la configuración del campo {label, type, campo, opciones?}
- seccionObj: objeto con los datos guardados de la sección
- indice: número de la sección (0, 1, 2...)
Retorna: objeto con {label, input}
*/
function crearCampo(config, seccionObj, indice) {
    // Crear label
    const label = document.createElement('label');
    label.textContent = config.label;
    
    // Crear input según el tipo
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


// Configurar atributos data para identificar el campo
    input.setAttribute('data-campo', config.campo);
    input.setAttribute('data-seccion', indice);

      // Evento para actualizar array cuando cambia el valor
            input.addEventListener('input', function(e) {
                const idx = parseInt(e.target.getAttribute('data-seccion'));
                const campo = e.target.getAttribute('data-campo');
                seccionesArray[idx][campo] = e.target.value;
            });

    return { label, input };
}

/*
Función que genera las secciones según la cantidad seleccionada
Ajusta el array seccionesArray y crea el HTML para cada sección
*/

function generarSecciones(){
    const cantidad = parseInt(cantidadSelect.value);

    // Ajustar el array de secciones según la cantidad nueva
    if (cantidad > seccionesArray.length) {
        // Añadir nuevas secciones vacías si se aumenta
        for (let i = seccionesArray.length; i < cantidad; i++) {

            // push añade nuevos elementos al final del array
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
        
        /* 
        Elimina secciones extra (.slice) si se reduce creando 
        un nuevo array que evita problemas como secciones "fantasma"
        o que el array y el DOM se desincronicen
        */
        seccionesArray = seccionesArray.slice(0, cantidad);
    }

    /* 
    Limpia el contenedor <div id="desplegable-container"> cada vez que el usuario
    elije un número diferente de secciones para que estas no se añadan
    a las elegidas previamente
    */
    desplegablesContainer.innerHTML = '';


    // Describe la estructura de campos una sección pero no crea HTML todavía
    const campos = [
        { label: 'Locutor/locutora', type: 'select', campo: 'locutor', opciones: locutores},
        { label: 'Duración', type: 'select', campo: 'duracion', opciones: duracion },
        { label: 'Sección', type: 'select', campo: 'tipo', opciones: seccion },
        { label: 'Tema', type: 'input', campo: 'tema' },
        { label: 'Cama', type: 'input', campo: 'cama' },
        { label: 'Observaciones', type: 'textarea', campo: 'observaciones' }
        ];


    /* 
    Genera bloques de sección {locutor,duración, tipo sección, etc}
    forEach recorre el array creando una nueva sección (seccionObj)
    tantas como se hayan seleccionado siendo "i" el número de la sección en el array [0,1,2...]
    */
    seccionesArray.forEach((seccionObj, i) => {
        // Crea un <div> vacío en memoria (todavía no está en el HTML)
        const divSeccion = document.createElement('div');
        // Sirve para estilos CSS y para identificar visualmente cada bloque
        divSeccion.className = 'seccion';
        // Guarda qué índice del array representa este bloque 
        // Es la conexión entre DOM y array****************
        divSeccion.setAttribute('data-seccion', i);
    

        // Recorre una sección para crear campo por campo. Usamos crearCampo() para cada campo
        campos.forEach(c => {
            const { label, input } = crearCampo(c, seccionObj, i);
            divSeccion.appendChild(label);
            divSeccion.appendChild(input);
        });
      

        // Inserta la sección dentro de #desplegable-container
        desplegablesContainer.appendChild(divSeccion);
    });
}

function generarPDF(){

    const { jsPDF } = window.jspdf

    const doc = new jsPDF()

    console.log('Datos disponibles para el PDF:', seccionesArray);

}

