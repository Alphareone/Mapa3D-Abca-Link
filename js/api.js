// js/api.js - Gestión de Peticiones Públicas (REST Countries + Wikipedia)

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

// 2. Datos Demográficos (REST Countries API - Pública y Gratuita)
async function apiDatosPais(isoCode) {
    try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${isoCode}`);
        if (!response.ok) throw new Error("REST Countries no disponible o código inválido");
        const data = await response.json();
        return data[0]; 
    } catch (error) {
        console.error(`Error al obtener datos demográficos para ISO: ${isoCode}`, error);
        return null;
    }
}

// 3. Resumen Histórico y General (Wikipedia API - Pública y Gratuita)
async function apiHistoriaPais(nombrePais) {
    try {
        // Buscamos el extracto resumido directamente de la Wikipedia en español
        const response = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nombrePais)}`);
        if (!response.ok) throw new Error("No se encontró el artículo en Wikipedia");
        return await response.json();
    } catch (error) {
        console.error(`Error al obtener historia de Wikipedia para: ${nombrePais}`, error);
        return { extract: "Información general en proceso de actualización." };
    }
}
