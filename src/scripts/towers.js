// Tower management for irrigation pivots

// Apply towers to selected pivot
function applyTowers(pivotData, towerCount, spacingType = 'equal', customDistances = []) {
    if (!pivotData || pivotData.type !== 'circle') {
        showNotification('Towers can only be applied to full circle pivots', 'error');
        return;
    }
    
    // Remove existing towers
    removeTowers(pivotData);
    
    // Calculate tower positions
    let towerPositions = [];
    
    if (spacingType === 'equal') {
        // Equal spacing
        const spacing = pivotData.radius / towerCount;
        for (let i = 1; i <= towerCount; i++) {
            towerPositions.push({
                number: i,
                distance: i * spacing,
                spacing: spacing
            });
        }
    } else {
        // Custom spacing
        let cumulativeDistance = 0;
        for (let i = 0; i < customDistances.length && i < towerCount; i++) {
            cumulativeDistance += customDistances[i];
            towerPositions.push({
                number: i + 1,
                distance: cumulativeDistance,
                spacing: customDistances[i]
            });
        }
    }
    
    // Create tower visualization
    const towerElements = [];
    
    towerPositions.forEach((tower, index) => {
        // Create tower circle
        const towerCircle = L.circle(pivotData.center, {
            radius: tower.distance,
            color: '#7f8c8d',
            weight: 1,
            opacity: 0.6,
            fillColor: 'transparent',
            fillOpacity: 0,
            className: 'tower-circle',
            interactive: false
        });
        
        // Create distance label
        const angle = 45; // Display labels at 45 degrees for visibility
        const labelPos = calculatePositionAtAngle(pivotData.center, tower.distance, angle);
        
        const distanceLabel = L.divIcon({
            html: `<div class="tower-distance-label">${tower.spacing.toFixed(1)}m</div>`,
            className: 'tower-distance-icon',
            iconSize: [60, 20],
            iconAnchor: [30, 10]
        });
        
        const labelMarker = L.marker(labelPos, { 
            icon: distanceLabel,
            interactive: false 
        });
        
        // Store tower elements
        towerElements.push({
            circle: towerCircle,
            label: labelMarker,
            data: tower
        });
        
        // Add to map
        pivotData.group.addLayer(towerCircle);
        pivotData.group.addLayer(labelMarker);
    });
    
    // Update pivot data
    pivotData.towers = towerElements;
    pivotData.towerCount = towerCount;
    pivotData.towerSpacingType = spacingType;
    
    // Update calculations
    updatePivotCalculations(pivotData);
    
    showNotification(`Applied ${towerCount} towers to ${pivotData.specifications.label}`, 'success');
}

// Remove towers from pivot
function removeTowers(pivotData) {
    if (!pivotData || !pivotData.towers) return;
    
    // Remove tower elements from map
    pivotData.towers.forEach(tower => {
        pivotData.group.removeLayer(tower.circle);
        pivotData.group.removeLayer(tower.label);
    });
    
    // Clear tower data
    delete pivotData.towers;
    delete pivotData.towerCount;
    delete pivotData.towerSpacingType;
    
    updatePivotCalculations(pivotData);
}

// Calculate position at specific angle and distance
function calculatePositionAtAngle(center, radius, angleDegrees) {
    const angleRadians = angleDegrees * Math.PI / 180;
    const lat = center.lat + (radius / 111000) * Math.sin(angleRadians);
    const lng = center.lng + (radius / (111000 * Math.cos(center.lat * Math.PI / 180))) * Math.cos(angleRadians);
    return L.latLng(lat, lng);
}

// Show tower configuration UI
function showTowerConfiguration(pivotData) {
    if (!pivotData || pivotData.type !== 'circle') {
        document.querySelector('.tower-section').style.display = 'none';
        return;
    }
    
    document.querySelector('.tower-section').style.display = 'block';
    
    // Set current values if towers exist
    if (pivotData.towers) {
        document.getElementById('towerCount').value = pivotData.towerCount || 5;
        document.getElementById('spacingType').value = pivotData.towerSpacingType || 'equal';
    }
}

// Handle spacing type change
function handleSpacingTypeChange() {
    const spacingType = document.getElementById('spacingType').value;
    const customInputsDiv = document.getElementById('customSpacingInputs');
    
    if (spacingType === 'custom') {
        const towerCount = parseInt(document.getElementById('towerCount').value) || 5;
        
        // Generate custom spacing inputs
        let inputsHTML = '<label>Tower Distances (meters):</label>';
        for (let i = 1; i <= towerCount; i++) {
            inputsHTML += `
                <label>
                    Tower ${i}:
                    <input type="number" class="tower-distance-input" data-tower="${i}" 
                           placeholder="Distance" min="1" value="${Math.round(selectedPivot.radius / towerCount)}">
                </label>
            `;
        }
        
        customInputsDiv.innerHTML = inputsHTML;
        customInputsDiv.style.display = 'block';
    } else {
        customInputsDiv.style.display = 'none';
    }
}

// Initialize tower event handlers
function initializeTowerHandlers() {
    // Tower count change
    document.getElementById('towerCount').addEventListener('change', () => {
        if (document.getElementById('spacingType').value === 'custom') {
            handleSpacingTypeChange();
        }
    });
    
    // Spacing type change
    document.getElementById('spacingType').addEventListener('change', handleSpacingTypeChange);
    
    // Apply towers button
    document.getElementById('applyTowersBtn').addEventListener('click', () => {
        if (!selectedPivot) return;
        
        const towerCount = parseInt(document.getElementById('towerCount').value) || 5;
        const spacingType = document.getElementById('spacingType').value;
        
        if (spacingType === 'equal') {
            applyTowers(selectedPivot, towerCount, 'equal');
        } else {
            // Get custom distances
            const customDistances = [];
            document.querySelectorAll('.tower-distance-input').forEach(input => {
                customDistances.push(parseFloat(input.value) || 50);
            });
            applyTowers(selectedPivot, towerCount, 'custom', customDistances);
        }
    });
    
    // Remove towers button
    document.getElementById('removeTowersBtn').addEventListener('click', () => {
        if (!selectedPivot) return;
        
        if (confirm('Remove all towers from this pivot?')) {
            removeTowers(selectedPivot);
            showNotification('Towers removed', 'success');
        }
    });
}

// Add tower initialization to app startup
document.addEventListener('DOMContentLoaded', initializeTowerHandlers);