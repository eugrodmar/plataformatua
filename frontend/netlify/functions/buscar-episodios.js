// Netlify Function: descarga la lista completa de episodios del programa desde
// Spotify y se la devuelve al frontend para poder buscarlos por palabra clave.
//
// El Client ID y el Client Secret de Spotify se leen de variables de entorno
// (configuradas en Netlify → Site settings → Environment variables), nunca
// van escritos en el código para no exponer el Client Secret.

const SPOTIFY_SHOW_ID = '0taDRRpna4whaiZhrzIFg4';

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
async function obtenerTodosLosEpisodios(token) {
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
                url: ep.external_urls.spotify
            });
        });

        url = datos.next;
    }

    return episodios;
}

exports.handler = async function () {
    try {
        const token = await obtenerTokenSpotify();
        const episodios = await obtenerTodosLosEpisodios(token);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(episodios)
        };
    } catch (error) {
        console.error('Error al obtener episodios de Spotify', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'No se pudieron cargar los episodios' })
        };
    }
};
