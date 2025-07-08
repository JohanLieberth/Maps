document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración ---
    const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'; // URL base de tu API Django
    const DEFAULT_LAT = 4.60971; // Bogotá, Colombia (Latitud)
    const DEFAULT_LON = -74.08175; // Bogotá, Colombia (Longitud)
    const DEFAULT_ZOOM = 12;

    // --- Inicialización del Mapa Leaflet ---
    const map = L.map('map').setView([DEFAULT_LAT, DEFAULT_LON], DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Layer group para los marcadores de puntos
    const pointsLayer = L.layerGroup().addTo(map);

    // --- Funciones ---

    /**
     * Carga los puntos desde la API y los muestra en el mapa.
     */
    async function loadPoints() {
        pointsLayer.clearLayers(); // Limpiar marcadores existentes
        try {
            const response = await fetch(`${API_BASE_URL}/puntos/`);
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }
            const geojsonData = await response.json(); // DRF-GIS devuelve GeoJSON directamente para GeoFeatureModelSerializer

            // DRF-GIS envuelve la colección GeoJSON en un objeto con una clave "features"
            // o si es una lista directa de features, se ajusta.
            // Para ModelViewSet list, es una lista de features bajo la clave "features"
            // si se usa paginación, o un objeto GeoJSON FeatureCollection.
            // Si es un FeatureCollection, geojsonData.features es el array.
            // Si es una lista de features (sin paginación o serializer sin GeoFeatureModelSerializer), sería geojsonData directamente.
            // Asumimos que es un FeatureCollection o un array de features.

            let features = [];
            if (geojsonData.type === "FeatureCollection") {
                features = geojsonData.features;
            } else if (Array.isArray(geojsonData)) { // Podría ser una lista de features directamente
                features = geojsonData;
            } else if (Array.isArray(geojsonData.results) && geojsonData.results[0]?.type === "Feature") {
                // Caso común con paginación por defecto de DRF
                features = geojsonData.results;
            } else {
                console.warn("Formato de GeoJSON no esperado:", geojsonData);
            }


            if (features.length > 0) {
                L.geoJSON(features, {
                    onEachFeature: (feature, layer) => {
                        // Mostrar información en un popup
                        let popupContent = `<b>${feature.properties.nombre || 'Punto'}</b>`;
                        if (feature.properties.descripcion) {
                            popupContent += `<br>${feature.properties.descripcion}`;
                        }
                         if (feature.properties.creador_username) {
                            popupContent += `<br><small>Creador: ${feature.properties.creador_username}</small>`;
                        }
                        layer.bindPopup(popupContent);
                    }
                }).addTo(pointsLayer);
                console.log(`${features.length} puntos cargados.`);
            } else {
                console.log('No se encontraron puntos o el formato no es el esperado.');
            }

        } catch (error) {
            console.error('Error al cargar los puntos:', error);
            alert(`Error al cargar puntos: ${error.message}`);
        }
    }

    /**
     * Crea un nuevo punto en la API.
     * @param {object} latlng - Objeto LatLng de Leaflet con las coordenadas.
     */
    async function createPoint(latlng) {
        const pointName = prompt("Introduce un nombre para el nuevo punto:", "Nuevo Punto");
        if (!pointName) return; // Usuario canceló

        const pointDescription = prompt("Introduce una descripción (opcional):", "");

        const geoJsonData = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [latlng.lng, latlng.lat] // GeoJSON es [longitud, latitud]
            },
            properties: {
                nombre: pointName,
                descripcion: pointDescription || ""
                // creador_id se asignará en el backend si el usuario está autenticado
            }
        };

        try {
            // Nota: Para POST con SessionAuthentication, Django espera CSRF token si el frontend
            // no está en el mismo dominio exacto o si no se configura adecuadamente.
            // Para simplificar en este ejemplo local, asumimos que el backend no fuerza CSRF para API
            // o que se maneja si es necesario (ej. obteniendo token de cookie y enviándolo en header).
            // Si la API es IsAuthenticatedOrReadOnly, y no hay sesión, el creador será null.
            // Si hay sesión, el backend asignará request.user a 'creador'.

            const response = await fetch(`${API_BASE_URL}/puntos/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // DRF-GIS espera application/json para GeoJSON
                    // 'X-CSRFToken': csrftoken, // Si se necesita CSRF y se obtiene de una cookie
                },
                body: JSON.stringify(geoJsonData.geometry) // Enviamos solo la geometría si el serializer espera eso
                                                          // o el feature completo si el serializer es GeoFeatureModelSerializer
                                                          // El PuntoSerializer espera un Feature completo.
                                                          // No, PuntoSerializer de DRF-GIS espera la geometría en el campo 'geometria'
                                                          // y las propiedades por separado.
                                                          // { "nombre": "test", "geometria": {"type": "Point", ...}}
            });

            // Corrección para enviar datos al PuntoSerializer:
            const payload = {
                nombre: geoJsonData.properties.nombre,
                descripcion: geoJsonData.properties.descripcion,
                geometria: geoJsonData.geometry // El GeoFeatureModelSerializer espera la geometría aquí
            };

            const correctedResponse = await fetch(`${API_BASE_URL}/puntos/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });


            if (!correctedResponse.ok) {
                const errorData = await correctedResponse.json().catch(() => ({ detail: correctedResponse.statusText }));
                console.error("Error response data:", errorData);
                throw new Error(`Error HTTP ${correctedResponse.status}: ${JSON.stringify(errorData.detail || errorData)}`);
            }

            const newPoint = await correctedResponse.json();
            console.log('Punto creado:', newPoint);

            // Añadir el nuevo punto al mapa (usando los datos de la respuesta)
            L.geoJSON(newPoint, { // newPoint ya debería ser un GeoJSON Feature
                 onEachFeature: (feature, layer) => {
                    let popupContent = `<b>${feature.properties.nombre || 'Punto'}</b>`;
                    if (feature.properties.descripcion) {
                        popupContent += `<br>${feature.properties.descripcion}`;
                    }
                    if (feature.properties.creador_username) {
                        popupContent += `<br><small>Creador: ${feature.properties.creador_username}</small>`;
                    }
                    layer.bindPopup(popupContent);
                }
            }).addTo(pointsLayer);
            alert('Punto creado exitosamente!');

        } catch (error) {
            console.error('Error al crear el punto:', error);
            alert(`Error al crear punto: ${error.message}`);
        }
    }

    // --- Event Listeners ---
    // Cargar puntos al hacer clic en el botón
    document.getElementById('loadPointsBtn').addEventListener('click', loadPoints);

    // Crear un nuevo punto al hacer clic en el mapa
    map.on('click', (e) => {
        if (confirm(`¿Deseas añadir un punto en ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}?`)) {
            createPoint(e.latlng);
        }
    });

    // --- Carga Inicial ---
    // loadPoints(); // Opcional: Cargar puntos al iniciar la página
    alert("Mapa inicializado. Haz clic en 'Cargar Puntos Existentes' o clic en el mapa para añadir uno nuevo.");

});
