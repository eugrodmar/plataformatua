/*
Declaramos las variables de JS que van a estar relacionadas con el HTML.
cantidadSelect hace referencia al select con id cantidad.
desplegablesContainer hace referencia al div con id desplegable-container
que va a almacernar el número total de secciones que va a tener la escaleta
 */
const cantidadSelect = document.getElementById('cantidad');
const desplegablesContainer = document.getElementById('desplegable-container');

/*
Declaramos esta variable para el JS.
Es un array vacio que va a almacenar N secciones y sus datos
*/
let seccionesArray = [];
/*
Cada vez que el usuario cambia el número de secciones,
lee el valor seleccionado, lo convierte en número
y lo guarda para saber cuántas secciones tengo que manejar.
El evento change se dispara si el usuario elige otra opción
*/
cantidadSelect.addEventListener('change', function(){
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
    container.innerHTML = '';

    // Generar bloques de sección
    seccionesArray.forEach((seccionObj, i) => {
        const divSeccion = document.createElement('div');
        divSeccion.className = 'seccion';
        divSeccion.setAttribute('data-seccion', i);

        const campos = [
            { label: 'Locutor', type: 'input', campo: 'locutor' },
            { label: 'Duración', type: 'input', campo: 'duracion' },
            { label: 'Tipo de sección', type: 'select', campo: 'tipo', opciones: ['Informativo','Entrevista','Música','Publicidad'] },
            { label: 'Tema', type: 'input', campo: 'tema' },
            { label: 'Cama', type: 'input', campo: 'cama' },
            { label: 'Observaciones', type: 'textarea', campo: 'observaciones' }
        ];

        campos.forEach(c => {
            const label = document.createElement('label');
            label.textContent = c.label;

            let input;
            if (c.type === 'input') {
                input = document.createElement('input');
                input.type = 'text';
                input.value = seccionObj[c.campo]; // Mantener valor previo
            } else if (c.type === 'textarea') {
                input = document.createElement('textarea');
                input.value = seccionObj[c.campo];
            } else if (c.type === 'select') {
                input = document.createElement('select');
                c.opciones.forEach(op => {
                    const option = document.createElement('option');
                    option.value = op;
                    option.textContent = op;
                    if (seccionObj[c.campo] === op) option.selected = true;
                    input.appendChild(option);
                });
            }

            input.setAttribute('data-campo', c.campo);
            input.setAttribute('data-seccion', i);

            // Evento para actualizar array
            input.addEventListener('input', function(e) {
                const idx = parseInt(e.target.getAttribute('data-seccion'));
                const campo = e.target.getAttribute('data-campo');
                seccionesArray[idx][campo] = e.target.value;
            });

            divSeccion.appendChild(label);
            divSeccion.appendChild(input);
        });

        container.appendChild(divSeccion);
    });
});