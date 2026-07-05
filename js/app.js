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
        paisSeleccionado = d;
        world.polygonsData([...geojsonData]); 
        
        world.controls().autoRotate = false;
        world.pointOfView({ lat: lat, lng: lng, altitude: 1.2 }, 1000);
        
        let isoCode = d.properties.ISO_A2 || d.properties.iso_a2 || d.properties.ISO_A3 || d.properties.iso_a3;
        if (isoCode && typeof isoCode === 'string') {
            isoCode = isoCode.toUpperCase().trim();
        }

        const nameAdmin = d.properties.ADMIN || d.properties.name;
        const nameEs = d.properties.NAME_ES || d.properties.name;
        
        cargarInfoPais(isoCode, nameAdmin, nameEs);
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
                    paisSeleccionado = geojsonData.find(p => p.properties.ISO_A2 === isoCode || p.properties.iso_a2 === isoCode || p.properties.ISO_A2 === isoCode.toLowerCase() || p.properties.iso_a2 === isoCode.toLowerCase());
                    world.polygonsData([...geojsonData]); 
                }
                
                const nombreOficial = result.address.country || query;
                cargarInfoPais(isoCode, nombreOficial, nombreOficial);
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

// --- FUNCIÓN DEL PANEL LATERAL INTELIGENTE ---
async function cargarInfoPais(isoCode, nameAdmin, nameEs) {
    const panel = document.getElementById('country-info');
    
    // Traducir nombres comunes rápidamente para el encabezado visual
    const traducciónDirecta = {
        "Brazil": "Brasil", "Japan": "Japón", "United States of America": "Estados Unidos",
        "United Kingdom": "Reino Unido", "South Korea": "Corea del Sur", "North Korea": "Corea del Norte",
        "Germany": "Alemania", "France": "Francia", "Italy": "Italia", "Russia": "Rusia",
        "Spain": "España", "New Zealand": "Nueva Zelanda", "Netherlands": "Países Bajos",
        "Antarctica": "Antártida", "Falkland Islands": "Islas Malvinas"
    };

    let nombreMostrar = traducciónDirecta[nameAdmin] || nameEs || nameAdmin;

    if (panel) panel.classList.remove('hidden');
    
    const elemName = document.getElementById('ci-name');
    if (elemName) elemName.innerText = nombreMostrar; 

    const elemCapital = document.getElementById('ci-capital');
    const elemPop = document.getElementById('ci-pop');
    const elemDemonym = document.getElementById('ci-demonym');
    const elemHistory = document.getElementById('ci-history');

    if (elemCapital) elemCapital.innerText = "Buscando...";
    if (elemPop) elemPop.innerText = "Buscando...";
    if (elemDemonym) elemDemonym.innerText = "Buscando...";
    if (elemHistory) elemHistory.innerText = "Consultando registros...";

    // --- INTERCEPCIÓN EXCLUSIVA DE LA ANTÁRTIDA ---
    if (isoCode === "ATA" || nameAdmin.toLowerCase() === "antarctica" || nombreMostrar === "Antártida") {
        if (elemCapital) elemCapital.innerText = "No posee (Regido por Tratado Antártico)";
        if (elemPop) elemPop.innerText = "0 hab. (1.000 - 5.000 científicos según temporada)";
        if (elemDemonym) elemDemonym.innerText = "Antártico / Antártica";
        
        const dataWiki = await apiHistoriaPais("Antártida");
        if (elemHistory) elemHistory.innerText = (dataWiki && dataWiki.extract) ? dataWiki.extract : "Continente helado que rodea el Polo Sur.";
        return; 
    }

    let dataRest = null;

    // --- PIPELINE DE CONSULTA DE TRES NIVELES ---
    try {
        // Nivel 1: Por código ISO estructurado (si es válido)
        if (isoCode && isoCode !== "-99" && isoCode.length <= 3) {
            dataRest = await apiDatosPais(isoCode.toUpperCase().trim());
        }

        // Nivel 2: Por Nombre Administrativo si el código falló o vino vacío
        if (!dataRest && nameAdmin) {
            const resName = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(nameAdmin)}?fullText=true`);
            if (resName.ok) {
                const arr = await resName.json();
                dataRest = arr[0];
            }
        }
    } catch (e) {
        console.warn("REST Countries falló. Activando rescate dinámico por Wikipedia.", e);
    }

    // --- PROCESAMIENTO Y RENDERIZADO DE INFORMACIÓN ---
    if (dataRest) {
        // 1. Capital
        const capital = dataRest.capital && dataRest.capital.length > 0 ? dataRest.capital[0] : "No declarada";
        if (elemCapital) elemCapital.innerText = capital;
        
        // 2. Población
        const poblacion = dataRest.population !== undefined ? Number(dataRest.population).toLocaleString('es-ES') : "Desconocida";
        if (elemPop) elemPop.innerText = poblacion + " hab.";
        
        // 3. Gentilicio
        let gentilicio = "No registrado";
        if (dataRest.demonyms) {
            if (dataRest.demonyms.spa && dataRest.demonyms.spa.m) gentilicio = dataRest.demonyms.spa.m;
            else if (dataRest.demonyms.eng && dataRest.demonyms.eng.m) gentilicio = dataRest.demonyms.eng.m;
        }
        if (elemDemonym) elemDemonym.innerText = gentilicio;
        
        // Traducir el título principal de forma oficial si está la traducción disponible
        if (dataRest.translations && dataRest.translations.spa) {
            nombreMostrar = dataRest.translations.spa.common;
            if (elemName) elemName.innerText = nombreMostrar;
        }
    } 

    // --- CONSULTA A WIKIPEDIA (Y NIVEL 3 DE RESCATE AUTOMÁTICO) ---
    if (nombreMostrar) {
        const dataWiki = await apiHistoriaPais(nombreMostrar);
        if (elemHistory) {
            elemHistory.innerText = (dataWiki && dataWiki.extract) ? dataWiki.extract : "Resumen histórico general no localizado en Wikipedia.";
        }

        // SI REST COUNTRIES SE BLOQUEÓ POR CORS: Usamos los metadatos de Wikipedia para rellenar los vacíos
        if (!dataRest) {
            if (elemCapital) elemCapital.innerText = "Ver texto enciclopédico inferior";
            if (elemPop) elemPop.innerText = "Información disponible en la descripción";
            if (elemDemonym) elemDemonym.innerText = "Región de " + nombreMostrar;
        }
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

window.addEventListener('resize', () => {
    world.width(window.innerWidth);
    world.height(window.innerHeight);
});
