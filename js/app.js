// --- VARIABLES GLOBALES ---
let geojsonData = [];
let paisSeleccionado = null;
let hoverPais = null;

// --- INICIALIZACIÓN DEL GLOBO ---
const world = Globe()
    (document.getElementById('globeViz'))
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
    .backgroundColor('rgba(0,0,0,0)')
    .labelsData(todosLosPaises) 
    .labelLat('lat')
    .labelLng('lng')
    .labelText(() => '') 
    .labelDotRadius(0.6)
    .labelColor(() => document.body.classList.contains('dark-mode') ? '#00ffcc' : '#b3ffc6') 
    .labelLabel(d => `
        <div class="pais-tooltip">
            <svg class="icon" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> 
            ${d.name}
        </div>
    `)
    .onLabelClick(d => {
        document.getElementById('search-input').value = d.name;
        buscarDireccion();
    })
    .polygonAltitude(d => (d === paisSeleccionado ? 0.12 : 0.02))
    .polygonCapColor(d => {
        const isDark = document.body.classList.contains('dark-mode');
        if (d === paisSeleccionado) return isDark ? 'rgba(0, 255, 204, 0.7)' : 'rgba(178, 255, 195, 0.8)'; 
        if (d === hoverPais) return isDark ? 'rgba(0, 255, 204, 0.4)' : 'rgba(186, 225, 255, 0.6)'; 
        return isDark ? 'rgba(10, 50, 40, 0.6)' : 'rgba(255, 255, 255, 0.25)'; 
    })
    .polygonSideColor(() => document.body.classList.contains('dark-mode') ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255, 255, 255, 0.4)')
    .polygonStrokeColor(() => document.body.classList.contains('dark-mode') ? '#00ffcc' : '#bae1ff')
    .polygonLabel(({ properties: d }) => `
        <div class="pais-tooltip">
            <strong>${d.NAME_ES || d.ADMIN || d.name || 'Desconocido'}</strong>
        </div>
    `)
    .onPolygonHover(hoverD => {
        hoverPais = hoverD;
        world.polygonsData([...geojsonData]); 
    })
    .onPolygonClick((d, event, { lat, lng }) => {
        // 1. Seleccionar el país y repintar
        paisSeleccionado = d;
        world.polygonsData([...geojsonData]); 
        
        // 2. Detener la rotación automática para que el país no se nos escape
        world.controls().autoRotate = false;

        // 3. ¡EL ENFOQUE! Mover la cámara a las coordenadas donde el usuario hizo clic
        // El último número (1000) es el tiempo que tarda la animación en milisegundos
        world.pointOfView({ lat: lat, lng: lng, altitude: 1.2 }, 1000);
        
        // 4. Extraer datos para el panel lateral
        const isoCode = d.properties.ISO_A2 || d.properties.iso_a2 || d.properties.ISO_A3 || d.properties.iso_a3;
        const name = d.properties.NAME_ES || d.properties.ADMIN || d.properties.name;
        
        if (name) {
            cargarInfoPais(isoCode, name);
        }
    });

// --- CARGAR DATOS DE FRONTERAS ---
fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
    .then(res => res.json())
    .then(countries => {
        geojsonData = countries.features;
        world.polygonsData(geojsonData); 
    });

// --- CONTROLES DE CÁMARA ---
world.controls().autoRotate = true;
world.controls().autoRotateSpeed = 0.5;
world.controls().enableZoom = true;
world.pointOfView({ lat: 20, lng: -40, altitude: 2.5 });

world.onLabelHover(label => {
    document.getElementById('globeViz').style.cursor = label ? 'pointer' : 'grab';
});
document.getElementById('globeViz').addEventListener('mousedown', () => {
    world.controls().autoRotate = false;
});

// --- LÓGICA DE BÚSQUEDA ---
async function buscarDireccion() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    const button = document.getElementById('search-button');
    button.innerText = "...";
    world.controls().autoRotate = false;

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            
            if (result.address && result.address.country_code) {
                const isoCode = result.address.country_code.toUpperCase();
                
                if (geojsonData && geojsonData.length > 0) {
                    paisSeleccionado = geojsonData.find(p => p.properties.ISO_A2 === isoCode || p.properties.iso_a2 === isoCode);
                    world.polygonsData([...geojsonData]); 
                }
                
                const nombreOficial = result.address.country || query;
                cargarInfoPais(isoCode, nombreOficial);
            } else {
                paisSeleccionado = null;
                world.polygonsData([...geojsonData]);
                const panel = document.getElementById('country-info');
                if (panel) panel.classList.add('hidden');
            }

            let zoomAltitud = 0.8; 
            if (result.boundingbox) {
                const latDiff = Math.abs(parseFloat(result.boundingbox[1]) - parseFloat(result.boundingbox[0]));
                const lonDiff = Math.abs(parseFloat(result.boundingbox[3]) - parseFloat(result.boundingbox[2]));
                const maxDim = Math.max(latDiff, lonDiff);
                zoomAltitud = Math.max(0.15, Math.min(maxDim * 0.04, 2.5));   
            }

            world.pointOfView({ lat: lat, lng: lon, altitude: zoomAltitud }, 2000); 
        } else {
            alert("No se encontraron resultados en el mapa.");
        }
    } catch (error) {
        console.error("Error al buscar la dirección:", error);
    } finally {
        button.innerText = "Buscar";
    }
}

document.getElementById('search-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') buscarDireccion();
});

// --- FUNCIÓN DEL PANEL LATERAL (CORREGIDA CON LOS IDS DEL HTML) ---
async function cargarInfoPais(isoCode, nombrePais) {
    const panel = document.getElementById('country-info');
    
    // 1. DICCIONARIO DE EMERGENCIA (Traduce los nombres del mapa al español)
    const diccionario = {
        "Brazil": "Brasil",
        "Japan": "Japón",
        "United States of America": "Estados Unidos",
        "United Kingdom": "Reino Unido",
        "South Korea": "Corea del Sur",
        "North Korea": "Corea del Norte",
        "Germany": "Alemania",
        "France": "Francia",
        "Italy": "Italia",
        "Russia": "Rusia",
        "Spain": "España",
        "New Zealand": "Nueva Zelanda",
        "Netherlands": "Países Bajos"
    };

    // Traducimos el nombre si está en la lista para asegurar Wikipedia en español
    let nombreTraducido = diccionario[nombrePais] || nombrePais;

    // 2. MOSTRAR PANEL Y ESTADO DE CARGA
    if (panel) panel.classList.remove('hidden');
    
    // Intentamos rellenar el título (probamos ambos IDs comunes)
    const elemName = document.getElementById('ci-name') || document.getElementById('country-name');
    if (elemName) elemName.innerText = nombreTraducido; 

    // Ponemos estado de carga usando los IDs reales de tu HTML
    const elemCapital = document.getElementById('capital') || document.getElementById('ci-capital');
    const elemPop = document.getElementById('poblacion') || document.getElementById('ci-pop');
    const elemDemonym = document.getElementById('gentilicio') || document.getElementById('ci-demonym');
    const elemHistory = document.getElementById('ci-history') || document.getElementById('historia');

    if (elemCapital) elemCapital.innerText = "Buscando...";
    if (elemPop) elemPop.innerText = "Buscando...";
    if (elemDemonym) elemDemonym.innerText = "Buscando...";
    if (elemHistory) elemHistory.innerText = "Consultando archivos históricos...";

    let dataRest = null;

    // 3. CONSULTAR BASE DE DATOS DE PAÍSES
    try {
        // Intento 1: Por código ISO (si es válido)
        if (isoCode && isoCode !== "-99") {
            let resAlpha = await fetch(`https://restcountries.com/v3.1/alpha/${isoCode}`);
            if (resAlpha.ok) dataRest = (await resAlpha.json())[0];
        }
        
        // Intento 2: Por su nombre original en inglés
        if (!dataRest) {
            let resName = await fetch(`https://restcountries.com/v3.1/name/${nombrePais}`);
            if (resName.ok) dataRest = (await resName.json())[0];
        }
    } catch (e) {
        console.warn("Error de red con la API de países:", e);
    }

    // 4. INYECTAR LOS DATOS EN LAS CAJITAS CORRESPONDIENTES
    if (dataRest) {
        // Extraer Capital
        const capital = dataRest.capital && dataRest.capital.length > 0 ? dataRest.capital[0] : "No declarada";
        if (elemCapital) elemCapital.innerText = capital;
        
        // Extraer Población (Formateada con puntos)
        const poblacion = dataRest.population !== undefined ? Number(dataRest.population).toLocaleString('es-ES') : "Desconocida";
        if (elemPop) elemPop.innerText = poblacion + " hab.";
        
        // Extraer Gentilicio en Español (o Inglés si no hay)
        let gentilicio = "No registrado";
        if (dataRest.demonyms) {
            if (dataRest.demonyms.spa) gentilicio = dataRest.demonyms.spa.m;
            else if (dataRest.demonyms.eng) gentilicio = dataRest.demonyms.eng.m;
        }
        if (elemDemonym) elemDemonym.innerText = gentilicio;
        
        // Si la base de datos nos da el nombre común oficial en español, actualizamos el título
        if (dataRest.translations && dataRest.translations.spa) {
            nombreTraducido = dataRest.translations.spa.common;
            if (elemName) elemName.innerText = nombreTraducido;
        }
    } else {
        // Fallback si la API externa no responde
        if (elemCapital) elemCapital.innerText = "No disponible";
        if (elemPop) elemPop.innerText = "No disponible";
        if (elemDemonym) elemDemonym.innerText = "No disponible";
    }

    // 5. CONSULTAR WIKIPEDIA
    try {
        const resWiki = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nombreTraducido)}`);
        if (resWiki.ok) {
            const dataWiki = await resWiki.json();
            if (elemHistory) elemHistory.innerText = dataWiki.extract || "Resumen histórico no disponible.";
        } else {
            if (elemHistory) elemHistory.innerText = "No se encontró un artículo en Wikipedia para este país.";
        }
    } catch (e) {
        if (elemHistory) elemHistory.innerText = "Error de conexión al consultar Wikipedia.";
    }
}

// --- FUNCIÓN DEL TEMA ---
function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    const themeIcon = document.getElementById('theme-icon');
    
    const iconSun = `<svg class="icon" viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z"/></svg>`;
    const iconMoon = `<svg class="icon" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3z"/></svg>`;

    if (isDark) {
        body.classList.remove('dark-mode');
        document.getElementById('theme-text').innerText = 'Oscuro';
        themeIcon.innerHTML = iconMoon;
        world.globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    } else {
        body.classList.add('dark-mode');
        document.getElementById('theme-text').innerText = 'Claro';
        themeIcon.innerHTML = iconSun;
        world.globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg');
    }
    
    world.labelsData([...todosLosPaises]);
    if (geojsonData.length > 0) world.polygonsData([...geojsonData]);
}
// --- AUTO-AJUSTAR EL TAMAÑO DEL GLOBO EN CELULARES ---
window.addEventListener('resize', () => {
    world.width(window.innerWidth);
    world.height(window.innerHeight);
});