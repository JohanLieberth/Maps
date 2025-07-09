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

    // Layer group para los marcadores de puntos y polígonos
    const pointsLayer = L.layerGroup().addTo(map);
    const polygonsLayer = L.layerGroup().addTo(map);
    let drawingPolygonLayer = L.layerGroup().addTo(map); // Para el polígono en proceso de dibujo

    // --- Estado de la Aplicación ---
    let isDrawingPolygon = false;
    let currentPolygonVertices = [];

    // --- Selectores de Elementos DOM ---
    const loadPointsBtn = document.getElementById('loadPointsBtn');
    const loadPolygonsBtn = document.getElementById('loadPolygonsBtn');
    const startPolygonBtn = document.getElementById('startPolygonBtn');
    const finishPolygonBtn = document.getElementById('finishPolygonBtn');
    const cancelPolygonBtn = document.getElementById('cancelPolygonBtn');
    const polygonHelpText = document.getElementById('polygonHelpText');


    // --- Funciones ---

    /**
     * Muestra u oculta el texto de ayuda para dibujar polígonos y habilita/deshabilita botones.
     */
    function updatePolygonDrawingUI() {
        polygonHelpText.style.display = isDrawingPolygon ? 'block' : 'none';
        startPolygonBtn.disabled = isDrawingPolygon;
        finishPolygonBtn.disabled = !isDrawingPolygon || currentPolygonVertices.length < 3;
        cancelPolygonBtn.disabled = !isDrawingPolygon;
    }

    /**
     * Limpia el estado del dibujo de polígono actual.
     */
    function resetPolygonDrawingState() {
        isDrawingPolygon = false;
        currentPolygonVertices = [];
        drawingPolygonLayer.clearLayers();
        updatePolygonDrawingUI();
    }

    /**
     * Dibuja el polígono/polilínea temporal en el mapa a medida que se añaden vértices.
     */
    function redrawTemporaryPolygon() {
        drawingPolygonLayer.clearLayers();
        if (currentPolygonVertices.length > 0) {
            if (currentPolygonVertices.length === 1) { // Solo un punto, dibujar un círculo pequeño
                 L.circleMarker(currentPolygonVertices[0], { radius: 5, color: 'blue', fillOpacity:0.5, opacity:0.8 }).addTo(drawingPolygonLayer);
            } else { // Dos o más puntos, dibujar una polilínea
                L.polyline(currentPolygonVertices, { color: 'blue', dashArray: '5, 5' }).addTo(drawingPolygonLayer);
            }
        }
    }

    /**
     * Carga los puntos desde la API y los muestra en el mapa.
     */
    async function loadPoints() {
        pointsLayer.clearLayers();
        try {
            const response = await fetch(`${API_BASE_URL}/puntos/`);
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }
            const geojsonData = await response.json();

            let features = [];
            if (geojsonData.type === "FeatureCollection") {
                features = geojsonData.features;
            } else if (Array.isArray(geojsonData.results) && geojsonData.results.length > 0 && geojsonData.results[0].type === "Feature") {
                features = geojsonData.results; // Manejo de paginación de DRF
            } else if (Array.isArray(geojsonData)) {
                features = geojsonData;
            } else {
                console.warn("Formato de GeoJSON para puntos no esperado:", geojsonData);
            }

            if (features.length > 0) {
                L.geoJSON(features, {
                    onEachFeature: (feature, layer) => {
                        let popupContent = `<b>${feature.properties.nombre || 'Punto'}</b>`;
                        if (feature.properties.descripcion) popupContent += `<br>${feature.properties.descripcion}`;
                        if (feature.properties.creador_username) popupContent += `<br><small>Creador: ${feature.properties.creador_username}</small>`;
                        layer.bindPopup(popupContent);
                    }
                }).addTo(pointsLayer);
                console.log(`${features.length} puntos cargados.`);
            } else {
                console.log('No se encontraron puntos o el formato no es el esperado.');
                // alert('No se encontraron puntos.'); // Podríamos dar feedback al usuario
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
        if (isDrawingPolygon) {
            alert("Estás dibujando un polígono. Finaliza o cancela el dibujo para añadir un punto.");
            return;
        }
        const pointName = prompt("Introduce un nombre para el nuevo punto:", "Nuevo Punto Creado");
        if (!pointName) return;

        const pointDescription = prompt("Introduce una descripción (opcional):", "");

        const payload = {
            nombre: pointName,
            descripcion: pointDescription || "",
            geometria: {
                type: "Point",
                coordinates: [latlng.lng, latlng.lat]
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}/puntos/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                console.error("Error response data:", errorData);
                throw new Error(`Error HTTP ${response.status}: ${JSON.stringify(errorData.detail || errorData)}`);
            }

            const newPoint = await response.json();
            console.log('Punto creado:', newPoint);

            L.geoJSON(newPoint, {
                 onEachFeature: (feature, layer) => {
                    let popupContent = `<b>${feature.properties.nombre || 'Punto'}</b>`;
                    if (feature.properties.descripcion) popupContent += `<br>${feature.properties.descripcion}`;
                    if (feature.properties.creador_username) popupContent += `<br><small>Creador: ${feature.properties.creador_username}</small>`;
                    layer.bindPopup(popupContent);
                }
            }).addTo(pointsLayer);
            alert('Punto creado exitosamente!');

        } catch (error) {
            console.error('Error al crear el punto:', error);
            alert(`Error al crear punto: ${error.message}`);
        }
    }

    /**
     * Carga los polígonos desde la API y los muestra en el mapa.
     */
    async function loadPolygons() {
        polygonsLayer.clearLayers();
        try {
            const response = await fetch(`${API_BASE_URL}/poligonos/`);
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }
            const geojsonData = await response.json();
            let features = [];
            if (geojsonData.type === "FeatureCollection") {
                features = geojsonData.features;
            } else if (Array.isArray(geojsonData.results) && geojsonData.results.length > 0 && geojsonData.results[0].type === "Feature") {
                features = geojsonData.results; // Manejo de paginación de DRF
            } else if (Array.isArray(geojsonData)) {
                features = geojsonData;
            } else {
                 console.warn("Formato de GeoJSON para polígonos no esperado:", geojsonData);
            }

            if (features.length > 0) {
                L.geoJSON(features, {
                    style: function (feature) {
                        return {color: "#ff7800", weight: 2, opacity: 0.8, fillOpacity: 0.3};
                    },
                    onEachFeature: (feature, layer) => {
                        let popupContent = `<b>${feature.properties.nombre || 'Polígono'}</b>`;
                        if (feature.properties.descripcion) popupContent += `<br>${feature.properties.descripcion}`;
                        if (feature.properties.creador_username) popupContent += `<br><small>Creador: ${feature.properties.creador_username}</small>`;
                        layer.bindPopup(popupContent);
                    }
                }).addTo(polygonsLayer);
                console.log(`${features.length} polígonos cargados.`);
            } else {
                console.log('No se encontraron polígonos o el formato no es el esperado.');
                // alert('No se encontraron polígonos.');
            }
        } catch (error) {
            console.error('Error al cargar polígonos:', error);
            alert(`Error al cargar polígonos: ${error.message}`);
        }
    }

    /**
     * Crea un nuevo polígono en la API a partir de los vértices recolectados.
     */
    async function createPolygonFromVertices() {
        if (currentPolygonVertices.length < 3) {
            // Esta validación también está en updatePolygonDrawingUI para deshabilitar el botón,
            // pero es bueno tenerla aquí como una doble verificación.
            alert("Un polígono necesita al menos 3 vértices.");
            return;
        }

        const polygonName = prompt("Introduce un nombre para el nuevo polígono:", "Nuevo Polígono Creado");
        if (!polygonName) {
            resetPolygonDrawingState();
            return;
        }

        const polygonDescription = prompt("Introduce una descripción (opcional):", "");

        const coordinates = currentPolygonVertices.map(latlng => [latlng.lng, latlng.lat]);
        if (coordinates.length > 0 && (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
            coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
            coordinates.push([...coordinates[0]]);
        }

        const payload = {
            nombre: polygonName,
            descripcion: polygonDescription || "",
            geometria: {
                type: "Polygon",
                coordinates: [coordinates]
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}/poligonos/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(`Error HTTP ${response.status}: ${JSON.stringify(errorData.detail || errorData)}`);
            }

            const newPolygon = await response.json();
            console.log('Polígono creado:', newPolygon);

            L.geoJSON(newPolygon, {
                 style: function (feature) {
                    return {color: "#ff7800", weight: 2, opacity: 0.8, fillOpacity: 0.3};
                },
                onEachFeature: (feature, layer) => {
                    let popupContent = `<b>${feature.properties.nombre || 'Polígono'}</b>`;
                    if (feature.properties.descripcion) popupContent += `<br>${feature.properties.descripcion}`;
                    if (feature.properties.creador_username) popupContent += `<br><small>Creador: ${feature.properties.creador_username}</small>`;
                    layer.bindPopup(popupContent);
                }
            }).addTo(polygonsLayer);
            alert('Polígono creado exitosamente!');
        } catch (error) {
            console.error('Error al crear el polígono:', error);
            alert(`Error al crear polígono: ${error.message}`);
        } finally {
            resetPolygonDrawingState();
        }
    }


    // --- Event Listeners ---
    loadPointsBtn.addEventListener('click', loadPoints);
    loadPolygonsBtn.addEventListener('click', loadPolygons);

    startPolygonBtn.addEventListener('click', () => {
        isDrawingPolygon = true;
        currentPolygonVertices = [];
        drawingPolygonLayer.clearLayers();
        updatePolygonDrawingUI();
        alert("Modo de dibujo de polígono activado. Haz clic en el mapa para añadir vértices.");
    });

    finishPolygonBtn.addEventListener('click', () => {
        createPolygonFromVertices();
    });

    cancelPolygonBtn.addEventListener('click', () => {
        resetPolygonDrawingState();
        alert("Dibujo de polígono cancelado.");
    });

    map.on('click', (e) => {
        if (isDrawingPolygon) {
            currentPolygonVertices.push(e.latlng);
            redrawTemporaryPolygon();
            updatePolygonDrawingUI();
        } else {
            if (confirm(`¿Deseas añadir un punto en ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}?`)) {
                createPoint(e.latlng);
            }
        }
    });

    // --- Carga Inicial ---
    updatePolygonDrawingUI();
    alert("Mapa inicializado. Carga datos existentes o crea nuevos puntos/polígonos.");

});
