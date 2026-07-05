// Este archivo SOLAMENTE gestiona las peticiones a internet

// 1. Coordenadas (OpenStreetMap)
async function apiBuscarCoordenadas(query) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`);
        return await response.json();
    } catch (error) {
        console.error("Error conectando con OpenStreetMap:", error);
        return null;
    }
}

// 2. Datos Demográficos (REST Countries)
async function apiDatosPais(isoCode) {
    try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${isoCode}`);
        if (!response.ok) throw new Error("País no encontrado");
        const data = await response.json();
        return data[0]; 
    } catch (error) {
        console.error("Error conectando con REST Countries:", error);
        return null; // El fallback dinámico se gestiona en app.js
    }
}

// 3. Resumen Histórico (Wikipedia)
async function apiHistoriaPais(nombrePais) {
    try {
        const response = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nombrePais)}`);
        if (!response.ok) throw new Error("Artículo no encontrado");
        return await response.json();
    } catch (error) {
        console.error("Error conectando con Wikipedia:", error);
        return { extract: "Resumen histórico general en proceso de sincronización." };
    }
}
