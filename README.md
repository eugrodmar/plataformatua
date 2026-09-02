# Plataforma TUA

Herramienta web para montar, paso a paso, la escaleta del programa de radio **Toda una amalgama** de **NEO FM**: entrevista, minisecciones y secciones, con previsualización reordenable y generación del PDF final con horario incluido.

## Qué hace

1. **Preguntas iniciales**: si hay entrevista (con su texto, duración y observaciones) y si hay minisecciones (nombre y duración de cada una, sacados de una lista predefinida).
2. **Secciones del programa**: se define cuántas hay y se rellena cada una con locutor/a, duración, tipo de sección, tema, cama y observaciones.
3. **Previsualización**: todos los bloques (entrevista, minisecciones y secciones) aparecen como tarjetas individuales que se pueden arrastrar y reordenar (con ratón o con el dedo) antes de generar el documento final.
4. **Generación del PDF**: se calcula el horario de cada bloque a partir de una hora de inicio fija, sumando las duraciones en cascada, y se genera un PDF en horizontal con una tabla (Horario, Contenido, Encargado, Tiempo, Cama, Observaciones).
5. **Buscador de temas ya tratados**: desde la bienvenida, permite comprobar si un tema ya se ha tratado en algún episodio anterior, buscando por palabra clave en el nombre y la descripción de los episodios publicados en Spotify y en iVoox.

El acceso a la aplicación está protegido: solo pueden entrar las cuentas de usuario dadas de alta manualmente para el equipo.

## Tecnologías y librerías

- **Frontend**: HTML, CSS y JavaScript sin frameworks ni pasos de compilación (todo directamente en el navegador).
- **[Supabase](https://supabase.com/)**: hace de backend — base de datos Postgres para las opciones (locutores, secciones, minisecciones, duraciones) y autenticación de usuarios, con Row Level Security para que solo cuentas autenticadas puedan leer los datos.
- **[jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)**: generación del PDF final en formato de tabla.
- **[SortableJS](https://github.com/SortableJS/Sortable)**: arrastrar y reordenar las tarjetas de la previsualización, con soporte tanto de ratón como de pantallas táctiles.
- **[Netlify](https://www.netlify.com/)**: hosting y despliegue continuo del frontend, conectado directamente al repositorio de GitHub.
- **Netlify Functions**: función serverless que hace de intermediaria con Spotify e iVoox para el buscador de temas, evitando exponer credenciales en el navegador.
  - **[Spotify Web API](https://developer.spotify.com/documentation/web-api)**: descarga los episodios del show autenticándose con Client Credentials Flow.
  - **iVoox**: no tiene API pública, así que se lee directamente el feed RSS del programa (público, sin credenciales).

## Estructura de carpetas

```
frontend/       Toda la aplicación web (lo que se despliega en Netlify)
  index.html
  index.js
  index.CSS
  config.js      URL y clave pública de Supabase
  favicon/
  netlify/functions/
    buscar-episodios.js   Descarga episodios de Spotify e iVoox para el buscador

supabase/       Definición de la base de datos
  schema.sql      Tabla, políticas de seguridad (RLS) y permisos
  seed-data.sql   Datos reales (locutores, secciones...) — no se sube a git
```
