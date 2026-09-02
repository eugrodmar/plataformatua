// Netlify Function: descarga la lista completa de episodios del programa,
// tanto de Spotify como de iVoox, y se la devuelve al frontend para poder
// buscarlos por palabra clave.
//
// El Client ID y el Client Secret de Spotify se leen de variables de entorno
// (configuradas en Netlify → Site settings → Environment variables), nunca
// van escritos en el código para no exponer el Client Secret. El feed de
// iVoox, en cambio, es público (como cualquier feed RSS de podcast) y no
// necesita ninguna credencial.

const SPOTIFY_SHOW_ID = '0taDRRpna4whaiZhrzIFg4';
const IVOOX_FEED_URL = 'https://feeds.ivoox.com/feed_fg_f1100524_filtro_1.xml';

// --- Spotify -----------------------------------------------------------

// Pide un token de acceso a Spotify (Client Credentials: no hace falta que
// ningún usuario inicie sesión, solo sirve para leer datos públicos del show)
async function obtenerTokenSpotify() {
    const credenciales = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const respuesta = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credenciales}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const datos = await respuesta.json();

    if (!datos.access_token) {
        throw new Error('No se pudo obtener el token de Spotify');
    }

    return datos.access_token;
}

// Recorre todas las páginas de episodios del show (Spotify los devuelve
// de 50 en 50) hasta tenerlos todos
async function obtenerEpisodiosSpotify() {
    const token = await obtenerTokenSpotify();
    const episodios = [];
    let url = `https://api.spotify.com/v1/shows/${SPOTIFY_SHOW_ID}/episodes?market=ES&limit=50`;

    while (url) {
        const respuesta = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const datos = await respuesta.json();

        if (!datos.items) break;

        datos.items.forEach(ep => {
            episodios.push({
                id: ep.id,
                nombre: ep.name,
                descripcion: ep.description,
                fecha: ep.release_date,
                url: ep.external_urls.spotify,
                fuente: 'Spotify'
            });
        });

        url = datos.next;
    }

    return episodios;
}

// --- iVoox ---------------------------------------------------------------

// Saca el contenido de una etiqueta XML, tanto si viene envuelta en
// <![CDATA[ ... ]]> (lo habitual en RSS) como si va en texto plano
function extraerCampo(bloque, etiqueta) {
    const conCData = bloque.match(new RegExp(`<${etiqueta}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${etiqueta}>`, 'i'));
    if (conCData) return conCData[1].trim();

    const plano = bloque.match(new RegExp(`<${etiqueta}>([\\s\\S]*?)<\\/${etiqueta}>`, 'i'));
    return plano ? plano[1].trim() : '';
}

// Convierte la fecha del RSS (formato "Fri, 12 Apr 2019 19:50:40 +0200")
// al mismo formato "AAAA-MM-DD" que usa Spotify
function formatearFechaRSS(pubDate) {
    const fecha = new Date(pubDate);
    return isNaN(fecha) ? '' : fecha.toISOString().slice(0, 10);
}

// Descarga el feed RSS de iVoox y extrae nombre, descripción, fecha y
// enlace de cada episodio (<item> del XML)
async function obtenerEpisodiosIvoox() {
    const respuesta = await fetch(IVOOX_FEED_URL);
    const xml = await respuesta.text();

    const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    return items.map(item => ({
        id: extraerCampo(item, 'guid'),
        nombre: extraerCampo(item, 'title'),
        descripcion: extraerCampo(item, 'description'),
        fecha: formatearFechaRSS(extraerCampo(item, 'pubDate')),
        url: extraerCampo(item, 'link'),
        fuente: 'iVoox'
    }));
}

// --- Handler ---------------------------------------------------------------

exports.handler = async function () {
    try {
        // Se piden en paralelo; si una de las dos fuentes falla no bloquea a la otra
        const resultados = await Promise.allSettled([
            obtenerEpisodiosSpotify(),
            obtenerEpisodiosIvoox()
        ]);

        const episodios = resultados
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => r.value);

        resultados
            .filter(r => r.status === 'rejected')
            .forEach(r => console.error('Error al obtener episodios', r.reason));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(episodios)
        };
    } catch (error) {
        console.error('Error al obtener episodios', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'No se pudieron cargar los episodios' })
        };
    }
};
