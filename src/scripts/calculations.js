// Calculation functions for irrigation pivots

// Update pivot calculations based on type
function updatePivotCalculations(pivotData) {
    if (pivotData.type === 'circle') {
        calculateCircleArea(pivotData);
    } else if (pivotData.type === 'semicircle') {
        calculateSemiCircleLength(pivotData);
    }
    
    // Update UI if this pivot is selected
    if (selectedPivot && selectedPivot.id === pivotData.id) {
        updatePivotInfo(pivotData);
    }
}

// Calculate area for circle pivot in hectares
function calculateCircleArea(pivotData) {
    const radiusMeters = pivotData.radius;
    const areaSquareMeters = Math.PI * radiusMeters * radiusMeters;
    const areaHectares = areaSquareMeters / 10000; // Convert to hectares
    
    pivotData.area = areaHectares;
    pivotData.areaFormatted = areaHectares.toFixed(2) + ' ha';
    
    return areaHectares;
}

// Calculate arc length for semi-circle pivot in meters
function calculateSemiCircleLength(pivotData) {
    const radiusMeters = pivotData.radius;
    const angleDegrees = Math.abs(pivotData.endAngle - pivotData.startAngle);
    const angleRadians = angleDegrees * Math.PI / 180;
    const arcLength = radiusMeters * angleRadians;
    
    pivotData.arcLength = arcLength;
    pivotData.arcLengthFormatted = arcLength.toFixed(1) + ' m';
    
    // Also calculate area for semi-circle
    const areaSquareMeters = 0.5 * radiusMeters * radiusMeters * angleRadians;
    const areaHectares = areaSquareMeters / 10000;
    pivotData.area = areaHectares;
    pivotData.areaFormatted = areaHectares.toFixed(2) + ' ha';
    
    return arcLength;
}

// Calculate total irrigated area
function calculateTotalArea() {
    let totalArea = 0;
    
    pivotLayers.forEach(pivot => {
        if (pivot.area) {
            totalArea += pivot.area;
        }
    });
    
    return totalArea;
}

// Update pivot information display
function updatePivotInfo(pivotData) {
    const infoDiv = document.getElementById('pivotInfo');
    
    if (!pivotData) {
        infoDiv.innerHTML = '<p class="info-placeholder">Select a pivot to view details</p>';
        return;
    }
    
    let infoHTML = '<div class="pivot-details">';
    infoHTML += `<div><strong>Type:</strong> <span>${pivotData.type === 'circle' ? 'Full Circle' : 'Semi-Circle'}</span></div>`;
    infoHTML += `<div><strong>Radius:</strong> <span>${pivotData.radius.toFixed(1)} m</span></div>`;
    
    if (pivotData.type === 'circle') {
        infoHTML += `<div><strong>Area:</strong> <span>${pivotData.areaFormatted}</span></div>`;
        infoHTML += `<div><strong>Diameter:</strong> <span>${(pivotData.radius * 2).toFixed(1)} m</span></div>`;
    } else {
        infoHTML += `<div><strong>Arc Length:</strong> <span>${pivotData.arcLengthFormatted}</span></div>`;
        infoHTML += `<div><strong>Area:</strong> <span>${pivotData.areaFormatted}</span></div>`;
        infoHTML += `<div><strong>Angle:</strong> <span>${Math.abs(pivotData.endAngle - pivotData.startAngle).toFixed(0)}°</span></div>`;
    }
    
    // Add specifications if available
    if (pivotData.specifications.flowRate > 0) {
        infoHTML += `<div><strong>Flow Rate:</strong> <span>${pivotData.specifications.flowRate} m³/h</span></div>`;
    }
    if (pivotData.specifications.power > 0) {
        infoHTML += `<div><strong>Power:</strong> <span>${pivotData.specifications.power} kW</span></div>`;
    }
    
    infoHTML += '</div>';
    
    // Add total area summary
    const totalArea = calculateTotalArea();
    infoHTML += `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ecf0f1;">`;
    infoHTML += `<strong>Total Irrigated Area:</strong> ${totalArea.toFixed(2)} ha`;
    infoHTML += '</div>';
    
    infoDiv.innerHTML = infoHTML;
}

// Show specification form for selected pivot
function showSpecificationForm(pivotData) {
    const form = document.getElementById('specForm');
    form.style.display = 'block';
    
    // Populate form with current values
    document.getElementById('pivotLabel').value = pivotData.specifications.label || '';
    document.getElementById('flowRate').value = pivotData.specifications.flowRate || '';
    document.getElementById('power').value = pivotData.specifications.power || '';
    document.getElementById('notes').value = pivotData.specifications.notes || '';
}

// Hide specification form
function hideSpecificationForm() {
    const form = document.getElementById('specForm');
    form.style.display = 'none';
}

// Save specifications for selected pivot
function saveSpecifications(e) {
    e.preventDefault();
    
    if (!selectedPivot) return;
    
    // Update specifications
    selectedPivot.specifications = {
        label: document.getElementById('pivotLabel').value,
        flowRate: parseFloat(document.getElementById('flowRate').value) || 0,
        power: parseFloat(document.getElementById('power').value) || 0,
        notes: document.getElementById('notes').value
    };
    
    // Update label on map
    const labelHtml = `<div class="pivot-label">${selectedPivot.specifications.label}</div>`;
    selectedPivot.labelMarker.setIcon(L.divIcon({
        html: labelHtml,
        className: 'pivot-label-icon',
        iconSize: [100, 20],
        iconAnchor: [50, -10]
    }));
    
    // Update info display
    updatePivotInfo(selectedPivot);
    
    showNotification('Specifications saved', 'success');
}

// Calculate sector/tower information
function calculateSectors(pivotData, numberOfTowers) {
    if (!pivotData || numberOfTowers < 1) return [];
    
    const sectors = [];
    const sectorLength = pivotData.radius / numberOfTowers;
    
    for (let i = 1; i <= numberOfTowers; i++) {
        sectors.push({
            number: i,
            startRadius: (i - 1) * sectorLength,
            endRadius: i * sectorLength,
            length: sectorLength,
            lengthFormatted: sectorLength.toFixed(1) + ' m'
        });
    }
    
    pivotData.sectors = sectors;
    return sectors;
}