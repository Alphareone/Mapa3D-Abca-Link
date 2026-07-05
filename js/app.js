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
        
        // 2. Detener la rotación automática
        world.controls().autoRotate = false;

        // 3. Mover la cámara a las coordenadas del clic
        world.pointOfView({ lat: lat, lng: lng, altitude: 1.2 }, 1000);
        
        // 4. EXTRACCIÓN FIEL DE LAS PROPIEDADES REALES DEL GEOJSON
        const props = d.properties || {};
        const iso2 = props.ISO_A2 || props.iso_a2 || "";
        const iso3 = props.ISO_A3 || props.iso_a3 || "";
        const nameAdmin = props.ADMIN || props.name || "";
        const nameEs = props.NAME_ES || props.name_es || "";
        
        // 5. SOLUCIÓN AL INPUT DE BÚSQUEDA: Sincronizar la barra de texto superior
        const inputBusqueda = document.getElementById('search-input');
        if (inputBusqueda) {
            inputBusqueda.value = nameEs || nameAdmin;
        }

        // Enviamos los 4 parámetros ordenados para que la función haga su magia
        cargarInfoPais(iso2, iso3, nameAdmin, nameEs);
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
world.controls().maxDistance = 400; // Bloquea que el usuario se aleje al espacio infinito
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
            
            let isoCode2 = "";
            if (result.address && result.address.country_code) {
                isoCode2 = result.address.country_code.toUpperCase();
                
                if (geojsonData && geojsonData.length > 0) {
                    paisSeleccionado = geojsonData.find(p => p.properties.ISO_A2 === isoCode2 || p.properties.iso_a2 === isoCode2);
                    world.polygonsData([...geojsonData]); 
                }
                
                const nombreOficial = result.address.country || query;
                
                // Mapeo básico para obtener el ISO3 compatible desde el polígono si existe
                const iso3 = paisSeleccionado ? (paisSeleccionado.properties.ISO_A3 || paisSeleccionado.properties.iso_a3 || "") : "";
                cargarInfoPais(isoCode2, iso3, nombreOficial, nombreOficial);
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

// --- FUNCIÓN DEL PANEL LATERAL (TOTALMENTE INTEGRADA CON TU DATA.JS LOCAL) ---
async function cargarInfoPais(iso2, iso3, nameAdmin, nameEs) {
    const panel = document.getElementById('country-info');
    
    const diccionario = {
        "Sweden": "Suecia", "Brazil": "Brasil", "Japan": "Japón", "United States of America": "Estados Unidos",
        "United Kingdom": "Reino Unido", "South Korea": "Corea del Sur", "North Korea": "Corea del Norte",
        "Germany": "Alemania", "France": "Francia", "Italy": "Italia", "Russia": "Rusia",
        "Spain": "España", "New Zealand": "Nueva Zelanda", "Netherlands": "Países Bajos",
        "Antarctica": "Antártida"
    };

    let nombreMostrar = diccionario[nameAdmin] || nameEs || nameAdmin;

    if (panel) panel.classList.remove('hidden');
    
    const elemName = document.getElementById('ci-name');
    if (elemName) elemName.innerText = nombreMostrar; 

    const elemCapital = document.getElementById('ci-capital');
    const elemPop = document.getElementById('ci-pop');
    
    // Captura dinámica compatible con cualquier ID de nacionalidad / gentilicio
    const elemNacionalidad = document.getElementById('ci-nationality') || 
                             document.getElementById('ci-nacionalidad') || 
                             document.getElementById('ci-demonym');
                             
    const elemHistory = document.getElementById('ci-history');

    if (elemCapital) elemCapital.innerText = "Buscando...";
    if (elemPop) elemPop.innerText = "Buscando...";
    if (elemNacionalidad) elemNacionalidad.innerText = "Buscando...";
    if (elemHistory) elemHistory.innerText = "Consultando archivos históricos...";

    // --- CASO ESPECIAL CORREGIDO: ANTÁRTIDA (EVITA PELÍCULAS DE WIKIPEDIA) ---
    if (iso3 === "ATA" || iso2 === "AQ" || nameAdmin.toLowerCase() === "antarctica" || nombreMostrar === "Antártida") {
        if (elemCapital) elemCapital.innerText = "No posee (Regida por el Tratado Antártico)";
        if (elemPop) elemPop.innerText = "0 hab. (Científicos temporales)";
        if (elemNacionalidad) elemNacionalidad.innerText = "Antártico / Antártica";
        if (elemName) elemName.innerText = "Antártida";
        
        const dataWiki = await apiHistoriaPais("Antártida (continente)");
        if (elemHistory) {
            elemHistory.innerText = (dataWiki && dataWiki.extract) ? dataWiki.extract : "Continente cubierto de hielo que rodea el Polo Sur geográfico, destinado a la paz y la ciencia.";
        }
        return; 
    }

    // 1. Intentar resolver de forma instantánea usando tu BD_MUNDIAL_OFICIAL de data.js
    const bdLocal = window.BD_MUNDIAL_OFICIAL || {};
    let registro = null;
    
    if (iso3) registro = bdLocal[iso3.toUpperCase().trim()];
    if (!registro && iso2) registro = bdLocal[iso2.toUpperCase().trim()];

    if (!registro) {
        const llave = Object.keys(bdLocal).find(k => 
            bdLocal[k].nombre.toLowerCase() === nombreMostrar.toLowerCase() ||
            bdLocal[k].nombre.toLowerCase() === nameAdmin.toLowerCase()
        );
        if (llave) registro = bdLocal[llave];
    }

    // 2. Si encontramos el registro local, inyectamos de inmediato (Evita fallos de restcountries)
    if (registro) {
        if (elemCapital) elemCapital.innerText = registro.capital;
        if (elemPop) elemPop.innerText = registro.pob;
        if (elemNacionalidad) elemNacionalidad.innerText = registro.gen;
        if (elemName) elemName.innerText = registro.nombre;
        nombreMostrar = registro.nombre; 
    } else {
        // Fallback dinámico si no estuviera en tu base local principal
        if (elemCapital) elemCapital.innerText = "Información disponible";
        if (elemPop) elemPop.innerText = "No disponible";
        if (elemNacionalidad) elemNacionalidad.innerText = "No registrado";
    }

    // 3. Consulta limpia a Wikipedia usando el nombre en español verificado
    if (nombreMostrar) {
        const dataWiki = await apiHistoriaPais(nombreMostrar);
        if (elemHistory) {
            elemHistory.innerText = (dataWiki && dataWiki.extract) ? dataWiki.extract : "Resumen histórico general no localizado.";
        }
    }
}

// --- FUNCIÓN DEL TEMA (FONDO CON DEGRADADO DINÁMICO) ---
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
        document.getElementById('globeViz').style.background = "linear-gradient(180deg, #bbf2f6 0%, #86e3ce 100%)"; 
        world.globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    } else {
        body.classList.add('dark-mode');
        document.getElementById('theme-text').innerText = 'Claro';
        themeIcon.innerHTML = iconSun;
        document.getElementById('globeViz').style.background = "rgba(0,0,0,0)";
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
