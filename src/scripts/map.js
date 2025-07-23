// Map initialization and management
let map;
let landPolygon = null;
let pivotLayers = [];
let selectedPivot = null;

// Initialize the map
function initializeMap() {
    // Create map centered on a default agricultural area
    map = L.map('map').setView([31.0, 35.0], 10);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add scale control
    L.control.scale({
        position: 'bottomright',
        metric: true,
        imperial: false
    }).addTo(map);
    
    // Initialize drawing controls (but don't add to map yet)
    initializeDrawingControls();
}

// Initialize drawing controls
function initializeDrawingControls() {
    // Custom drawing will be handled separately
    map.on('click', handleMapClick);
}

// Handle map clicks for drawing
function handleMapClick(e) {
    // This will be used for placing pivots
    if (window.currentDrawingMode) {
        if (window.currentDrawingMode === 'circle') {
            createCirclePivot(e.latlng);
        } else if (window.currentDrawingMode === 'semicircle') {
            createSemiCirclePivot(e.latlng);
        }
    }
}

// Import land polygon from file
function importLandPolygon(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let geojson;
            
            if (file.name.toLowerCase().endsWith('.kml')) {
                // Parse KML to GeoJSON
                const kml = new DOMParser().parseFromString(e.target.result, 'text/xml');
                geojson = toGeoJSON.kml(kml);
            } else if (file.name.toLowerCase().endsWith('.geojson') || file.name.toLowerCase().endsWith('.json')) {
                // Parse GeoJSON
                geojson = JSON.parse(e.target.result);
            } else {
                throw new Error('Unsupported file format');
            }
            
            // Remove existing land polygon
            if (landPolygon) {
                map.removeLayer(landPolygon);
            }
            
            // Add new land polygon
            landPolygon = L.geoJSON(geojson, {
                style: {
                    color: '#27ae60',
                    weight: 3,
                    opacity: 0.8,
                    fillColor: '#27ae60',
                    fillOpacity: 0.1
                }
            }).addTo(map);
            
            // Fit map to polygon bounds
            map.fitBounds(landPolygon.getBounds());
            
            // Enable export buttons
            document.getElementById('exportBtn').disabled = false;
            document.getElementById('exportPdfBtn').disabled = false;
            
            showNotification('Land polygon imported successfully', 'success');
            
        } catch (error) {
            console.error('Error importing file:', error);
            showNotification('Error importing file: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple console log for now, can be enhanced with UI notifications
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Clear all pivots from the map
function clearAllPivots() {
    pivotLayers.forEach(layer => {
        map.removeLayer(layer.group);
    });
    pivotLayers = [];
    selectedPivot = null;
    updatePivotInfo(null);
}

// Update selected pivot
function selectPivot(pivotData) {
    // Deselect previous pivot
    if (selectedPivot) {
        selectedPivot.circle.setStyle({ color: '#3498db' });
    }
    
    // Select new pivot
    selectedPivot = pivotData;
    if (selectedPivot) {
        selectedPivot.circle.setStyle({ color: '#e74c3c' });
        updatePivotInfo(selectedPivot);
        showSpecificationForm(selectedPivot);
        showTowerConfiguration(selectedPivot);
        showSizeAdjustment(selectedPivot);
    } else {
        updatePivotInfo(null);
        hideSpecificationForm();
        showTowerConfiguration(null);
        showSizeAdjustment(null);
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeMap);