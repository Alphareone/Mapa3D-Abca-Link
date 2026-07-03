# 🌍 Globo Terráqueo Interactivo 3D

¡Bienvenido a este explorador geográfico e histórico en tres dimensiones! Este proyecto es una aplicación web interactiva que renderiza un globo terráqueo en 3D directamente en el navegador. Permite a los usuarios seleccionar países haciendo clic sobre el mapa o buscándolos mediante texto para conocer datos clave en tiempo real.

🚀 **Diseñado para ser ligero, responsivo y completamente interactivo.**

---

## ✨ Características Principales

* **Globo 3D Interactivo:** Renderizado fluido utilizando tecnologías web modernas (WebGL) a través de la librería `Globe.gl`.
* **Búsqueda Inteligente:** Barra de navegación integrada conectada a **OpenStreetMap (Nominatim)** para geolocalizar y volar automáticamente hacia cualquier país.
* **Información en Tiempo Real:** Panel lateral/inferior que consulta datos dinámicos mediante APIs públicas:
    * 🏛️ Capital del país.
    * 👥 Población estimada y actualizada.
    * 🗣️ Gentilicio oficial en español.
    * 📜 Resumen histórico automatizado desde **Wikipedia**.
* **Modo Oscuro / Claro:** Selector estético que cambia el aspecto general del sitio y la textura del planeta (de un mapa satelital diurno a una vista nocturna con luces urbanas).
* **Diseño 100% Responsivo:** Interfaz adaptada tanto para pantallas de escritorio como para dispositivos móviles (diseño *bottom-sheet* estilo Google Maps).

---

## 🛠️ Tecnologías Utilizadas

Este proyecto fue construido utilizando únicamente tecnologías *Front-End* puras, lo que facilita su alojamiento sin necesidad de configurar servidores (Serverless).

* **HTML5 & CSS3:** Estructuración y diseño estilizado con transiciones suaves.
* **JavaScript (ES6+):** Lógica del sistema, manejo del DOM y peticiones asíncronas (`fetch`, `async/await`).
* **Librerías Clave:**
    * [Globe.gl](https://github.com/vasturiano/globe.gl) (Visualización del globo basada en Three.js/WebGL).
* **APIs Externas Integradas:**
    * [OpenStreetMap Nominatim](https://nominatim.org/) - Para geocodificación.
    * [RestCountries API](https://restcountries.com/) - Para estadísticas geográficas.
    * [Wikipedia REST API](https://www.wikimedia.org/api/rest_v1/) - Para extractos históricos en español.

---

## 📂 Estructura del Proyecto

```text
├── index.html          # Estructura principal y contenedores de la app
├── css/
│   └── style.css       # Estilos visuales, temas (dark/light) y media queries móviles
└── js/
    ├── app.js          # Lógica del globo, eventos de clic y consultas a las APIs
    └── paises.js       # Base de datos local para marcadores rápidos
