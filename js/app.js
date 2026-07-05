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
            <strong>${d.name}</strong>
        </div>
    `)
    .onLabelClick(d => {
        world.pointOfView({ lat: d.lat, lng: d.lng, alt: 2.0 }, 1000);
    });

// --- CARGAR PAÍSES (POLÍGONOS 3D) ---
fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
    .then(res => res.json())
    .then(countries => {
        geojsonData = countries.features;
        actualizarPoligonos();
    })
    .catch(err => console.error("Error al cargar los polígonos del mapa:", err));

function actualizarPoligonos() {
    const esOscuro = document.body.classList.contains('dark-mode');
    
    world.polygonsData(geojsonData)
        .polygonAltitude(d => d === paisSeleccionado ? 0.06 : (d === hoverPais ? 0.03 : 0.01))
        .polygonCapColor(d => {
            if (d === paisSeleccionado) return esOscuro ? 'rgba(0, 255, 204, 0.6)' : 'rgba(46, 204, 113, 0.6)';
            if (d === hoverPais) return esOscuro ? 'rgba(0, 255, 204, 0.3)' : 'rgba(46, 204, 113, 0.3)';
            return esOscuro ? 'rgba(44, 62, 80, 0.5)' : 'rgba(236, 240, 241, 0.7)';
        })
        .polygonSideColor(() => esOscuro ? 'rgba(0, 255, 204, 0.15)' : 'rgba(46, 204, 113, 0.2)')
        .polygonStrokeColor(() => esOscuro ? '#00ffcc' : '#2ecc71')
        .polygonStrokeWidth(d => d === paisSeleccionado || d === hoverPais ? 1.5 : 0.5)
        .onPolygonHover(d => {
            hoverPais = d;
            document.getElementById('globeViz').style.cursor = d ? 'pointer' : 'default';
            actualizarPoligonosAltitudesYColores();
        })
        .onPolygonClick(d => {
            paisSeleccionado = d;
            actualizarPoligonosAltitudesYColores();
            
            // Enfocar cámara suavemente
            const centro = obtenerCentroPoligono(d);
            world.pointOfView({ lat: centro.lat, lng: centro.lng, alt: 1.8 }, 1200);
            
            // Extraer códigos de país identificados por el GeoJSON
            const isoCode = d.properties.ISO_A3 || d.properties.iso_a3 || d.properties.ISO_A2 || d.properties.iso_a2;
            const nombrePais = d.properties.NAME || d.properties.name || d.properties.NAME_LONG;
            
            cargarInfoPais(isoCode, nombrePais);
        });
}

function actualizarPoligonosAltitudesYColores() {
    const esOscuro = document.body.classList.contains('dark-mode');
    world.polygonAltitude(d => d === paisSeleccionado ? 0.06 : (d === hoverPais ? 0.03 : 0.01));
    world.polygonCapColor(d => {
        if (d === paisSeleccionado) return esOscuro ? 'rgba(0, 255, 204, 0.6)' : 'rgba(46, 204, 113, 0.6)';
        if (d === hoverPais) return esOscuro ? 'rgba(0, 255, 204, 0.3)' : 'rgba(46, 204, 113, 0.3)';
        return esOscuro ? 'rgba(44, 62, 80, 0.5)' : 'rgba(236, 240, 241, 0.7)';
    });
    world.polygonStrokeWidth(d => d === paisSeleccionado || d === hoverPais ? 1.5 : 0.5);
}

// Cálculo del centro geométrico aproximado para la animación de cámara
function obtenerCentroPoligono(f) {
    if (f.geometry.type === "Polygon") {
        return calcularCentroCoordenadas(f.geometry.coordinates[0]);
    } else if (f.geometry.type === "MultiPolygon") {
        let maxPuntos = 0;
        let poligonoMasGrande = f.geometry.coordinates[0][0];
        f.geometry.coordinates.forEach(poly => {
            if (poly[0].length > maxPuntos) {
                maxPuntos = poly[0].length;
                poligonoMasGrande = poly[0];
            }
        });
        return calcularCentroCoordenadas(poligonoMasGrande);
    }
    return { lat: 20, lng: 0 };
}

function calcularCentroCoordenadas(coords) {
    let sumLat = 0, sumLng = 0;
    coords.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
    return { lat: sumLat / coords.length, lng: sumLng / coords.length };
}

// --- FUNCIÓN DEL PANEL LATERAL (ESTABILIZADA Y OPTIMIZADA) ---
async function cargarInfoPais(isoCode, nombrePais) {
    const panel = document.getElementById('country-info');
    
    // 1. DICCIONARIO DE TRADUCCIÓN INTERNA PARA WIKIPEDIA
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

    let nombreTraducido = diccionario[nombrePais] || nombrePais;

    // 2. VISUALIZAR PANEL Y CARGADORES TEMPORALES
    if (panel) panel.classList.remove('hidden');
    
    const elemName = document.getElementById('ci-name') || document.getElementById('country-name');
    if (elemName) elemName.innerText = nombreTraducido; 

    const elemCapital = document.getElementById('capital') || document.getElementById('ci-capital');
    const elemPop = document.getElementById('poblacion') || document.getElementById('ci-pop');
    const elemDemonym = document.getElementById('gentilicio') || document.getElementById('ci-demonym') || document.getElementById('nacionalidad');
    const elemHistory = document.getElementById('ci-history') || document.getElementById('historia');

    if (elemCapital) elemCapital.innerText = "Buscando...";
    if (elemPop) elemPop.innerText = "Buscando...";
    if (elemDemonym) elemDemonym.innerText = "Buscando...";
    if (elemHistory) elemHistory.innerText = "Consultando archivos históricos...";

    let dataRest = null;

    // 3. CONSULTAR BASE DE DATOS DE PAÍSES (Estrategia Multi-Intento Inteligente)
    try {
        // Intento 1: Buscar por código Alpha-3 (3 letras), el cual es 100% verídico en este GeoJSON
        if (isoCode && isoCode !== "-99" && isoCode.length === 3) {
            let resAlpha3 = await fetch(`https://restcountries.com/v3.1/alpha/${isoCode}`);
            if (resAlpha3.ok) dataRest = (await resAlpha3.json())[0];
        }
        
        // Intento 2: Si falló, intentar buscar por código de 2 letras si existiera
        if (!dataRest && isoCode && isoCode !== "-99" && isoCode.length === 2) {
            let resAlpha2 = await fetch(`https://restcountries.com/v3.1/alpha/${isoCode}`);
            if (resAlpha2.ok) dataRest = (await resAlpha2.json())[0];
        }

        // Intento 3: Buscar usando el nombre crudo entregado por el mapa
        if (!dataRest && nombrePais) {
            let resName = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(nombrePais)}`);
            if (resName.ok) dataRest = (await resName.json())[0];
        }

        // Intento 4: Buscar usando el nombre mapeado al español
        if (!dataRest && nombreTraducido) {
            let resNameEs = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(nombreTraducido)}`);
            if (resNameEs.ok) dataRest = (await resNameEs.json())[0];
        }
    } catch (e) {
        console.warn("Error crítico de red contactando REST Countries:", e);
    }

    // 4. INYECTAR DATOS EXTRAÍDOS CON EL FORMATO CORRECTO DE LA API V3.1
    if (dataRest) {
        // Procesar Capital (Devuelve Arreglo)
        const capital = dataRest.capital && dataRest.capital.length > 0 ? dataRest.capital[0] : "No declarada";
        if (elemCapital) elemCapital.innerText = capital;
        
        // Procesar Población (Formateado con separadores de miles de español de Chile/España)
        const population = dataRest.population !== undefined ? Number(dataRest.population).toLocaleString('es-ES') : "Desconocida";
        if (elemPop) elemPop.innerText = population + " hab.";
        
        // Procesar Gentilicio (Estructura de Idiomas)
        let gentilicio = "No registrado";
        if (dataRest.demonyms) {
            if (dataRest.demonyms.spa && dataRest.demonyms.spa.m) gentilicio = dataRest.demonyms.spa.m;
            else if (dataRest.demonyms.eng && dataRest.demonyms.eng.m) gentilicio = dataRest.demonyms.eng.m;
        }
        if (elemDemonym) elemDemonym.innerText = gentilicio;
        
        // Sincronizar el título visual del panel con el nombre oficial traducido por la API
        if (dataRest.translations && dataRest.translations.spa) {
            nombreTraducido = dataRest.translations.spa.common;
            if (elemName) elemName.innerText = nombreTraducido;
        }
    } else {
        if (elemCapital) elemCapital.innerText = "No disponible";
        if (elemPop) elemPop.innerText = "No disponible";
        if (elemDemonym) elemDemonym.innerText = "No disponible";
    }

    // 5. CONSULTAR RESUMEN DE WIKIPEDIA EN ESPAÑOL
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

// --- BUSCADOR MANUAL DE LA INTERFAZ ---
async function buscarPais() {
    const input = document.getElementById('search-input');
    if (!input || !input.value.trim()) return;
    
    const query = input.value.trim();
    
    // Buscar coincidencia en nuestra base local simplificada de coordenadas
    const encontrado = todosLosPaises.find(p => p.name.toLowerCase().includes(query.toLowerCase()));
    
    if (encontrado) {
        world.pointOfView({ lat: encontrado.lat, lng: encontrado.lng, alt: 1.8 }, 1500);
        
        // Buscar el polígono correspondiente en los datos GeoJSON para seleccionarlo
        const poligono = geojsonData.find(f => {
            const nameF = (f.properties.NAME || f.properties.name || '').toLowerCase();
            const nameLongF = (f.properties.NAME_LONG || '').toLowerCase();
            return nameF.includes(query.toLowerCase()) || nameLongF.includes(query.toLowerCase()) || encontrado.name.toLowerCase().includes(nameF);
        });
        
        if (poligono) {
            paisSeleccionado = poligono;
            actualizarPoligonosAltitudesYColores();
            const iso = poligono.properties.ISO_A3 || poligono.properties.iso_a3 || poligono.properties.ISO_A2;
            cargarInfoPais(iso, encontrado.name);
        } else {
            // Fallback si no hay polígono: Cargar datos directo con el nombre local
            cargarInfoPais(null, encontrado.name);
        }
    } else {
        alert("País no encontrado en el radar geográfico local. Intenta con otro nombre.");
    }
}

// --- CONTROLES DE LA INTERFAZ USUARIO (TEMA OSCURO Y PANELES) ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('.theme-toggle svg path');
    
    if (document.body.classList.contains('dark-mode')) {
        if (icon) icon.setAttribute('d', 'M12 3c.132 0 .263 0 .393.007a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 3z');
        world.globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg');
    } else {
        if (icon) icon.setAttribute('d', 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM2 12h2m16 0h2M12 2v2m0 16v2m-6.36-17.66l1.41 1.41m11.31 11.31l1.41 1.41M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41');
        world.globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    }
    actualizarPoligonosAltitudesYColores();
}

function cerrarPanel() {
    const panel = document.getElementById('country-info');
    if (panel) panel.classList.add('hidden');
    paisSeleccionado = null;
    actualizarPoligonosAltitudesYColores();
}

// Escuchador para la tecla Enter en la barra de búsqueda
document.getElementById('search-input')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') buscarPais();
});
