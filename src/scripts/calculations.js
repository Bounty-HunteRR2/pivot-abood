// Calculation functions for irrigation pivots

// Helper function to calculate arc span considering boundary crossing
function calculateArcSpan(startAngle, endAngle) {
    if (endAngle >= startAngle) {
        return endAngle - startAngle;
    } else {
        // Boundary crossing case (e.g., 270° to 90°)
        return (360 - startAngle) + endAngle;
    }
}

// Calculate area for any pivot type in hectares
function calculatePivotArea(pivotData) {
    const radiusMeters = pivotData.radius;
    
    if (pivotData.type === 'circle') {
        const areaSquareMeters = Math.PI * radiusMeters * radiusMeters;
        return areaSquareMeters / 10000; // hectares
    } else {
        // Semi-circle: calculate based on angle span
        const angleDegrees = calculateArcSpan(pivotData.startAngle, pivotData.endAngle);
        const areaSquareMeters = (angleDegrees / 360) * Math.PI * radiusMeters * radiusMeters;
        return areaSquareMeters / 10000; // hectares
    }
}

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
    const areaHectares = calculatePivotArea(pivotData);
    
    pivotData.area = areaHectares;
    pivotData.areaFormatted = areaHectares.toFixed(2) + ' ha';
    
    return areaHectares;
}

// Calculate arc length for semi-circle pivot in meters
function calculateSemiCircleLength(pivotData) {
    const radiusMeters = pivotData.radius;
    const angleDegrees = calculateArcSpan(pivotData.startAngle, pivotData.endAngle);
    const angleRadians = angleDegrees * Math.PI / 180;
    const arcLength = radiusMeters * angleRadians;
    
    pivotData.arcLength = arcLength;
    pivotData.arcLengthFormatted = arcLength.toFixed(1) + ' m';
    
    // Calculate area using the shared function
    const areaHectares = calculatePivotArea(pivotData);
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

// Debug function to list all pivots
function debugPivotAreas() {
    console.log('=== Pivot Area Debug ===');
    console.log(`Total pivots: ${pivotLayers.length}`);
    
    pivotLayers.forEach((pivot, index) => {
        console.log(`Pivot ${index + 1}:`, {
            id: pivot.id,
            type: pivot.type,
            radius: pivot.radius + 'm',
            area: pivot.area ? pivot.area.toFixed(2) + ' ha' : 'Not calculated',
            angles: pivot.type === 'semicircle' ? `${pivot.startAngle}° to ${pivot.endAngle}°` : 'Full circle'
        });
    });
    
    console.log(`Total Area: ${calculateTotalArea().toFixed(2)} ha`);
    console.log('=====================');
}

// Make debug function globally available
window.debugPivotAreas = debugPivotAreas;

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
        infoHTML += `<div><strong>Angle:</strong> <span>${calculateArcSpan(pivotData.startAngle, pivotData.endAngle).toFixed(0)}°</span></div>`;
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
    const pivotCount = pivotLayers.length;
    infoHTML += `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ecf0f1;">`;
    infoHTML += `<strong>Total Irrigated Area (${pivotCount} pivot${pivotCount !== 1 ? 's' : ''}):</strong> ${totalArea.toFixed(2)} ha`;
    
    // Show breakdown if multiple pivots
    if (pivotCount > 1) {
        infoHTML += '<div style="font-size: 0.85rem; margin-top: 0.5rem; color: #7f8c8d;">';
        pivotLayers.forEach((pivot, index) => {
            const isSelected = pivotData && pivot.id === pivotData.id;
            infoHTML += `<div>${isSelected ? '▸ ' : ''}Pivot ${index + 1}: ${pivot.area ? pivot.area.toFixed(2) : '0.00'} ha</div>`;
        });
        infoHTML += '</div>';
    }
    
    infoHTML += '</div>';
    
    infoDiv.innerHTML = infoHTML;
    
    // Debug log when total area seems incorrect
    if (pivotData && Math.abs(totalArea - pivotData.area) > 0.01 && pivotCount === 1) {
        console.warn('Total area mismatch detected!');
        debugPivotAreas();
    }
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