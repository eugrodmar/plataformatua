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


        // Describe la estructura de una sección pero no crea HTML todavía
        const campos = [
            { label: 'Locutor', type: 'input', campo: 'locutor' },
            { label: 'Duración', type: 'input', campo: 'duracion' },
            { label: 'Tipo de sección', type: 'select', campo: 'tipo', opciones: ['Informativo','Entrevista','Música','Publicidad'] },
            { label: 'Tema', type: 'input', campo: 'tema' },
            { label: 'Cama', type: 'input', campo: 'cama' },
            { label: 'Observaciones', type: 'textarea', campo: 'observaciones' }
        ];

        // Recorre una sección para crear campo por campo
        campos.forEach(c => {
            const label = document.createElement('label');
            label.textContent = c.label;

            // Se declara el input pero sin el tipo ya que eso se asigna después
            let input;
            if (c.type === 'input') {
                input = document.createElement('input');
                input.type = 'text';
                // Lee el dato desde el array. Permite no perder valores al redibujar
                input.value = seccionObj[c.campo]; 
            } else if (c.type === 'textarea') {
                input = document.createElement('textarea');
                input.value = seccionObj[c.campo];
            } else if (c.type === 'select') {
                input = document.createElement('select');
                // Crea cada opción recorriendo una lista de opciones
                c.opciones.forEach(op => {
                    const option = document.createElement('option');
                    option.value = op;
                    option.textContent = op;
                    // Crea una opción visible y seleccionable
                    if (seccionObj[c.campo] === op) option.selected = true;
                    // Marca como seleccionada la opción guardada en el array
                    input.appendChild(option);
                });
            }

            // Identifica a que sección y a que campo pertenece cada input
            input.setAttribute('data-campo', c.campo);
            input.setAttribute('data-seccion', i);

            // Evento para actualizar array
            input.addEventListener('input', function(e) {
                const idx = parseInt(e.target.getAttribute('data-seccion'));
                const campo = e.target.getAttribute('data-campo');
                seccionesArray[idx][campo] = e.target.value;
            });

            // Añade los elementos al DOM
            divSeccion.appendChild(label);
            divSeccion.appendChild(input);
        });

        // Inserta la sección dentro de #desplegable-container
        container.appendChild(divSeccion);
    });
});