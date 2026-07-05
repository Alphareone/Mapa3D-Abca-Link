// js/api.js - Gestión de Peticiones Públicas Universales (REST Countries + Wikipedia)
// Este archivo SOLAMENTE gestiona las peticiones a internet limpias y sin credenciales de acceso.

// 1. Coordenadas y Búsquedas Geográficas (OpenStreetMap Nominatim)
async function apiBuscarCoordenadas(query) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`);
        return await response.json();
    } catch (error) {
        console.error("Error conectando con OpenStreetMap:", error);
        return null;
    }
}

// 2. Datos Demográficos Oficiales (REST Countries API - Pública y Gratuita)
async function apiDatosPais(isoCode) {
    try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${isoCode}`);
        if (!response.ok) throw new Error("País no encontrado en los registros de REST Countries");
        const data = await response.json();
        return data[0]; 
    } catch (error) {
        console.error(`Error conectando con REST Countries para el código [${isoCode}]:`, error);
        return null;
    }
}

// 3. Resumen Histórico y Enciclopédico (Wikipedia API - Pública y Gratuita)
async function apiHistoriaPais(nombrePais) {
    try {
        // Buscamos el extracto resumido directamente en los servidores de Wikipedia en español
        const response = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nombrePais)}`);
        if (!response.ok) throw new Error("Artículo enciclopédico no localizado");
        return await response.json();
    } catch (error) {
        console.error(`Error conectando con Wikipedia para el término [${nombrePais}]:`, error);
        return { extract: "Información histórica general en proceso de sincronización con los servidores globales." };
    }
}
