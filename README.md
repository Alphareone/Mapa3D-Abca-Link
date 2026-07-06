# 🌍 Globo Terráqueo Interactivo 3D

¡Bienvenido a este explorador geográfico e histórico en tres dimensiones! Este proyecto es una aplicación web interactiva que renderiza un globo terráqueo en 3D directamente en el navegador. Permite a los usuarios seleccionar países haciendo clic sobre el mapa, interactuar con etiquetas flotantes o buscarlos mediante texto para conocer datos clave en tiempo real combinando el poder de APIs externas con un sólido respaldo local.

🚀 **Diseñado para ser ligero, de carga instantánea, responsivo y completamente interactivo.**

---

## ✨ Características Principales

* **Globo 3D Interactivo:** Renderizado fluido utilizando tecnologías web modernas (WebGL) a través de la librería `Globe.gl`, con animaciones de cámara y auto-rotación.
* **Búsqueda Inteligente y Sincronizada:** Barra de navegación integrada conectada a **OpenStreetMap (Nominatim)** para geolocalizar y volar automáticamente hacia cualquier país. El cuadro de búsqueda se sincroniza bidireccionalmente reflejando siempre el nombre del país en español tras hacer clic en polígonos o etiquetas.
* **Arquitectura Híbrida de Datos (Instant Load):** Implementación de un primer escudo de carga instantánea (0ms) a través de una base de datos local (`data.js`) combinada con peticiones asíncronas para garantizar que la app funcione incluso si los servidores externos experimentan caídas.
* **Información en Tiempo Real y Divisas:** Panel lateral/inferior que consulta y formatea datos dinámicos mediante APIs públicas y locales:
    * 🏛️ Capital oficial del país.
    * 👥 Población formateada con separadores locales (`toLocaleString`).
    * 🗣️ Gentilicio oficial en español.
    * 💵 Moneda local con su respectiva sigla y signo (ej. *Peso chileno $ (CLP)*).
    * 📜 Resumen histórico automatizado y curado desde la API de **Wikipedia**.
* **Modo Oscuro / Claro Estético:** Selector integrado en la interfaz (*glassmorphism*) que cambia dinámicamente las texturas del planeta (de un mapa satelital diurno a una vista nocturna con luces urbanas y fronteras de neón).
* **Diseño 100% Responsivo:** Interfaz adaptada tanto para pantallas de escritorio como para dispositivos móviles mediante un diseño *bottom-sheet* deslizante estilo Google Maps.

---

## 🛠️ Tecnologías Utilizadas

Este proyecto fue construido utilizando únicamente tecnologías *Front-End* puras, lo que facilita su alojamiento sin necesidad de configurar servidores ni bases de datos complejas (Serverless).

* **HTML5 & CSS3:** Estructuración semántica y diseño estilizado con efectos avanzados de desenfoque (*backdrop-filter*) y transiciones suaves.
* **JavaScript (ES6+):** Lógica del sistema, manipulación avanzada del DOM, control de flujo y peticiones asíncronas concurrentes (`fetch`, `async/await`, `Promise`).
* **Librerías Clave:**
    * [Globe.gl](https://github.com/vasturiano/globe.gl) - Visualización del globo basada en Three.js/WebGL.
* **APIs Externas Integradas:**
    * [OpenStreetMap Nominatim](https://nominatim.org/) - Para geocodificación y cálculo dinámico de *bounding boxes* de cámara.
    * [RestCountries API](https://restcountries.com/) - Para estadísticas geográficas globales.
    * [Wikipedia REST API](https://www.wikimedia.org/api/rest_v1/) - Para extractos enciclopédicos históricos en español.

---

## 📂 Estructura del Proyecto

```text
├── index.html          # Estructura principal, contenedores de la app e inyección de scripts
├── css/
│   └── style.css       # Estilos visuales, temas (dark/light), glassmorphism y media queries
└── js/
    ├── api.js          # Gestión de endpoints y llamadas asíncronas a APIs externas
    ├── app.js          # Inicialización del globo, control de cámara, eventos de interfaz y fallbacks
    └── data.js         # BD estática de respaldo (BD_MUNDIAL_OFICIAL), monedas y etiquetas locales
