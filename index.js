const desplegablesContainer = document.getElementById('desplegable-container');
const cantidadSelect = document.getElementById('cantidad');
const miniSelect = document.getElementById('mini');
const interviewSelect = document.getElementById('interview');
const pregunta1 = document.getElementById('pregunta-1');
const pregunta2 = document.getElementById('pregunta-2');
const pregunta3 = document.getElementById('pregunta-3');
const bttnGenerarPDF = document.getElementById('generar-pdf');
const bttnVolver = document.getElementById('btn-volver');
const continuar3 = document.getElementById('continuar-3');

const entrevistaExtra = document.getElementById('entrevista-extra');
const entrevistaTexto = document.getElementById('entrevista-texto');
const entrevistaObservaciones = document.getElementById('entrevista-observaciones');
const continuar1 = document.getElementById('continuar-1');

const miniExtra = document.getElementById('mini-extra');
const miniCantidadSelect = document.getElementById('mini-cantidad');
const miniNombresContainer = document.getElementById('mini-nombres-container');
const continuar2 = document.getElementById('continuar-2');

let seccionesArray = [];
let miniSeccionesArray = [];
let entrevistaData = { texto: '', observaciones: '' };
let locutores, duracion, seccion, minisecciones;
let currentStep = 0;

// Ocultar elementos al inicio
bttnGenerarPDF.style.display = 'none';

fetch('/opciones.json')
    .then(res => res.json())
    .then(data => {
        if (!data.locutores || !data.duracion || !data.seccion || !data.minisecciones) {
            console.error('Datos incompletos en JSON');
            return;
        }
        locutores = data.locutores;
        duracion = data.duracion;
        seccion = data.seccion;
        minisecciones = data.minisecciones;
        iniciarEscaleta();
    })
    .catch(err => console.error('Error al cargar opciones', err));


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
    bttnGenerarPDF.style.display = 'block';
    currentStep = 4;
}

function continuarPregunta1() {
    if (interviewSelect.value === 'true') {
        entrevistaData.texto = entrevistaTexto.value;
        entrevistaData.observaciones = entrevistaObservaciones.value;
    } else {
        entrevistaData = { texto: '', observaciones: '' };
    }

    pregunta1.classList.remove('visible');
    pregunta2.classList.add('visible');
    currentStep = 2;
    bttnVolver.style.display = 'block';
}

function generarMiniSecciones() {
    const cantidad = parseInt(miniCantidadSelect.value);
    miniSeccionesArray = [];
    miniNombresContainer.innerHTML = '';

    for (let i = 0; i < cantidad; i++) {
        const label = document.createElement('label');
        label.textContent = `Minisección ${i + 1}`;

        const select = document.createElement('select');
        minisecciones.forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            select.appendChild(option);
        });

        select.addEventListener('change', function (e) {
            miniSeccionesArray[i] = e.target.value;
        });

        miniSeccionesArray.push(select.value);

        miniNombresContainer.appendChild(label);
        miniNombresContainer.appendChild(select);
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
    if (currentStep === 4) {
        desplegablesContainer.innerHTML = '';
        bttnGenerarPDF.style.display = 'none';
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


function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    console.log('Datos disponibles para el PDF:', seccionesArray);
}