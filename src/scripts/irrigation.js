// Irrigation pivot drawing and management
let pivotIdCounter = 0;
window.currentDrawingMode = null;

// Create a circle pivot at the specified location
function createCirclePivot(latlng, radius = 400) {
    pivotIdCounter++;
    
    // Create circle
    const circle = L.circle(latlng, {
        radius: radius,
        color: '#27ae60',
        weight: 2,
        opacity: 0.8,
        fillColor: '#27ae60',
        fillOpacity: 0.3,
        className: 'pivot-circle'
    });
    
    // Create center marker (draggable)
    const centerMarker = L.circleMarker(latlng, {
        radius: 8,
        color: '#fff',
        fillColor: '#2c3e50',
        fillOpacity: 1,
        weight: 2,
        className: 'pivot-center-marker'
    });
    
    // Create label
    const label = L.divIcon({
        html: `<div class="pivot-label">Pivot ${pivotIdCounter}</div>`,
        className: 'pivot-label-icon',
        iconSize: [100, 20],
        iconAnchor: [50, -10]
    });
    const labelMarker = L.marker(latlng, { icon: label });
    
    // Create resize handles
    const handles = createResizeHandles(latlng, radius, 'circle', circle);
    
    // Group all elements
    const group = L.layerGroup([circle, centerMarker, labelMarker, ...handles]).addTo(map);
    
    // Create pivot data object
    const pivotData = {
        id: pivotIdCounter,
        type: 'circle',
        center: latlng,
        radius: radius,
        circle: circle,
        centerMarker: centerMarker,
        labelMarker: labelMarker,
        handles: handles,
        group: group,
        specifications: {
            label: `Pivot ${pivotIdCounter}`,
            flowRate: 0,
            power: 0,
            notes: ''
        }
    };
    
    // Add click handler
    circle.on('click', () => selectPivot(pivotData));
    
    // Add drag functionality
    enablePivotDragging(pivotData);
    
    // Add to pivots array
    pivotLayers.push(pivotData);
    
    // Calculate and update area
    updatePivotCalculations(pivotData);
    
    // Reset drawing mode
    window.currentDrawingMode = null;
    updateDrawingButtons();
    
    return pivotData;
}

// Create a semi-circle pivot at the specified location
function createSemiCirclePivot(latlng, radius = 400, startAngle = 0, endAngle = 180) {
    pivotIdCounter++;
    
    // Create semi-circle polygon
    const points = [];
    const angleStep = 1; // 1 degree for high quality smooth curves
    
    // Add center point
    points.push(latlng);
    
    // Add arc points - handle boundary crossing
    if (endAngle < startAngle) {
        // Boundary crossing case (e.g., 270° to 90°)
        // Draw from start to 360°
        for (let angle = startAngle; angle <= 360; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = latlng.lat + (radius / 111000) * Math.sin(radian);
            const lng = latlng.lng + (radius / (111000 * Math.cos(latlng.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
        // Then from 0° to end
        for (let angle = 0; angle <= endAngle; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = latlng.lat + (radius / 111000) * Math.sin(radian);
            const lng = latlng.lng + (radius / (111000 * Math.cos(latlng.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
    } else {
        // Normal case
        for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = latlng.lat + (radius / 111000) * Math.sin(radian);
            const lng = latlng.lng + (radius / (111000 * Math.cos(latlng.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
    }
    
    // Close the polygon back to center
    points.push(latlng);
    
    const semiCircle = L.polygon(points, {
        color: '#27ae60',
        weight: 2,
        opacity: 0.8,
        fillColor: '#27ae60',
        fillOpacity: 0.3,
        className: 'pivot-circle'
    });
    
    // Create center marker (draggable)
    const centerMarker = L.circleMarker(latlng, {
        radius: 8,
        color: '#fff',
        fillColor: '#2c3e50',
        fillOpacity: 1,
        weight: 2,
        className: 'pivot-center-marker'
    });
    
    // Create label
    const label = L.divIcon({
        html: `<div class="pivot-label">Semi-Pivot ${pivotIdCounter}</div>`,
        className: 'pivot-label-icon',
        iconSize: [100, 20],
        iconAnchor: [50, -10]
    });
    const labelMarker = L.marker(latlng, { icon: label });
    
    // Create resize and rotation handles
    const handles = createResizeHandles(latlng, radius, 'semicircle', semiCircle, startAngle, endAngle);
    
    // Group all elements
    const group = L.layerGroup([semiCircle, centerMarker, labelMarker, ...handles]).addTo(map);
    
    // Create pivot data object
    const pivotData = {
        id: pivotIdCounter,
        type: 'semicircle',
        center: latlng,
        radius: radius,
        startAngle: startAngle,
        endAngle: endAngle,
        circle: semiCircle,
        centerMarker: centerMarker,
        labelMarker: labelMarker,
        handles: handles,
        group: group,
        specifications: {
            label: `Semi-Pivot ${pivotIdCounter}`,
            flowRate: 0,
            power: 0,
            notes: ''
        }
    };
    
    // Add click handler
    semiCircle.on('click', () => selectPivot(pivotData));
    
    // Add drag functionality
    enablePivotDragging(pivotData);
    
    // Add to pivots array
    pivotLayers.push(pivotData);
    
    // Calculate and update arc length
    updatePivotCalculations(pivotData);
    
    // Reset drawing mode
    window.currentDrawingMode = null;
    updateDrawingButtons();
    
    return pivotData;
}

// Create resize handles for pivots
function createResizeHandles(center, radius, type, shape, startAngle = 0, endAngle = 180) {
    const handles = [];
    
    if (type === 'circle') {
        // Create 4 handles at cardinal directions
        const directions = [0, 90, 180, 270];
        
        directions.forEach(angle => {
            const radian = angle * Math.PI / 180;
            const lat = center.lat + (radius / 111000) * Math.sin(radian);
            const lng = center.lng + (radius / (111000 * Math.cos(center.lat * Math.PI / 180))) * Math.cos(radian);
            
            const handle = L.circleMarker([lat, lng], {
                radius: 6,
                color: '#fff',
                fillColor: '#3498db',
                fillOpacity: 1,
                weight: 2
            });
            
            // Make handle draggable
            handle.on('mousedown', (e) => startResizing(e, shape, center, angle, type));
            
            handles.push(handle);
        });
    } else if (type === 'semicircle') {
        // Create only resize handle at middle of arc
        const midAngle = (startAngle + endAngle) / 2;
        const radian = midAngle * Math.PI / 180;
        const lat = center.lat + (radius / 111000) * Math.sin(radian);
        const lng = center.lng + (radius / (111000 * Math.cos(center.lat * Math.PI / 180))) * Math.cos(radian);
        
        const handle = L.circleMarker([lat, lng], {
            radius: 8,
            color: '#fff',
            fillColor: '#3498db',
            fillOpacity: 1,
            weight: 3,
            className: 'resize-handle'
        });
        
        // Make handle draggable for resizing
        handle.on('mousedown', (e) => startResizing(e, shape, center, midAngle, type));
        
        handles.push(handle);
    }
    
    return handles;
}

// Start resizing a pivot
function startResizing(e, shape, center, handleAngle, type) {
    L.DomEvent.stopPropagation(e);
    
    const pivotData = pivotLayers.find(p => p.circle === shape);
    if (!pivotData) return;
    
    const onMouseMove = (e) => {
        const newPoint = map.mouseEventToLatLng(e);
        const newRadius = calculateDistance(pivotData.center, newPoint);
        
        // Limit minimum radius
        const radius = Math.max(50, newRadius);
        pivotData.radius = radius;
        
        if (type === 'circle') {
            shape.setRadius(radius);
        } else {
            // Recreate semi-circle with new radius
            updateSemiCircle(shape, pivotData.center, radius);
        }
        
        // Update handles position
        updateHandlePositions(pivotData);
        
        // Update towers if present
        if (pivotData.towers) {
            // Recalculate tower positions with new radius
            const towerCount = pivotData.towerCount;
            const spacing = radius / towerCount;
            
            pivotData.towers.forEach((tower, index) => {
                const newDistance = (index + 1) * spacing;
                tower.data.distance = newDistance;
                tower.data.spacing = spacing;
                tower.circle.setRadius(newDistance);
                
                // Update label position - place between towers
                const labelDistance = index === 0 ? newDistance / 2 : newDistance - (spacing / 2);
                const labelPos = calculatePositionAtAngle(pivotData.center, labelDistance, 90);
                tower.label.setLatLng(labelPos);
                
                // Update label text
                const labelHtml = `<div class="tower-distance-label">${spacing.toFixed(1)}m</div>`;
                tower.label.setIcon(L.divIcon({
                    html: labelHtml,
                    className: 'tower-distance-icon',
                    iconSize: [60, 20],
                    iconAnchor: [30, 10]
                }));
            });
        }
        
        // Update real-time calculations
        updatePivotCalculations(pivotData);
        updatePivotInfo(pivotData);
    };
    
    const onMouseUp = () => {
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        map.dragging.enable();
        
        // Final update
        updatePivotCalculations(pivotData);
    };
    
    map.dragging.disable();
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
}


// Calculate distance between two points
function calculateDistance(latlng1, latlng2) {
    return map.distance(latlng1, latlng2);
}

// Calculate angle between center and point
function calculateAngle(center, point) {
    const dx = point.lng - center.lng;
    const dy = point.lat - center.lat;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
}

// Helper function to calculate middle angle for arcs that may cross 0°/360°
function calculateMiddleAngle(startAngle, endAngle) {
    if (endAngle >= startAngle) {
        // Normal case
        return (startAngle + endAngle) / 2;
    } else {
        // Boundary crossing case
        const totalAngle = (360 - startAngle) + endAngle;
        let midAngle = startAngle + totalAngle / 2;
        if (midAngle >= 360) {
            midAngle -= 360;
        }
        return midAngle;
    }
}

// Enable mouse rotation for semi-circle
let rotationMode = false;
let rotatingPivot = null;

// Enable mouse resize for any pivot
let resizeMode = false;
let resizingPivot = null;

window.enableSemiCircleRotation = function(pivotData) {
    if (!pivotData || pivotData.type !== 'semicircle') return;
    
    rotationMode = true;
    rotatingPivot = pivotData;
    
    // Change cursor
    document.getElementById('map').style.cursor = 'crosshair';
    
    // Add rotation indicator
    const indicator = document.createElement('div');
    indicator.className = 'rotation-indicator';
    indicator.id = 'rotationIndicator';
    indicator.innerHTML = 'Rotation Mode - Move mouse to rotate, click to finish';
    document.querySelector('.map-container').appendChild(indicator);
    
    // Highlight the semi-circle
    pivotData.circle.setStyle({
        color: '#e74c3c',
        weight: 3,
        opacity: 1
    });
    
    // Add mouse move handler
    map.on('mousemove', handleRotationMouseMove);
    map.on('click', handleRotationClick);
    
    // Disable map dragging during rotation
    map.dragging.disable();
};

window.disableSemiCircleRotation = function() {
    if (!rotationMode || !rotatingPivot) return;
    
    rotationMode = false;
    
    // Restore cursor
    document.getElementById('map').style.cursor = '';
    
    // Remove rotation indicator
    const indicator = document.getElementById('rotationIndicator');
    if (indicator) {
        indicator.remove();
    }
    
    // Restore semi-circle style
    if (rotatingPivot) {
        rotatingPivot.circle.setStyle({
            color: selectedPivot === rotatingPivot ? '#e74c3c' : '#27ae60',
            weight: 2,
            opacity: 0.8
        });
    }
    
    // Remove handlers
    map.off('mousemove', handleRotationMouseMove);
    map.off('click', handleRotationClick);
    
    // Re-enable map dragging
    map.dragging.enable();
    
    rotatingPivot = null;
};

function handleRotationMouseMove(e) {
    if (!rotationMode || !rotatingPivot) return;
    
    const mouseAngle = calculateAngle(rotatingPivot.center, e.latlng);
    
    // Calculate current span considering boundary crossing
    let currentSpan;
    if (rotatingPivot.endAngle >= rotatingPivot.startAngle) {
        currentSpan = rotatingPivot.endAngle - rotatingPivot.startAngle;
    } else {
        // Boundary crossing case
        currentSpan = (360 - rotatingPivot.startAngle) + rotatingPivot.endAngle;
    }
    
    // Calculate new angles while maintaining the span
    let newStartAngle = mouseAngle - currentSpan / 2;
    let newEndAngle = mouseAngle + currentSpan / 2;
    
    // Normalize angles to 0-360 range
    while (newStartAngle < 0) newStartAngle += 360;
    while (newStartAngle >= 360) newStartAngle -= 360;
    while (newEndAngle < 0) newEndAngle += 360;
    while (newEndAngle >= 360) newEndAngle -= 360;
    
    // Update the pivot
    rotatingPivot.startAngle = newStartAngle;
    rotatingPivot.endAngle = newEndAngle;
    
    // Update visual
    updateSemiCircleRotation(rotatingPivot);
    
    // Update input fields
    if (document.getElementById('startAngleInput')) {
        document.getElementById('startAngleInput').value = newStartAngle.toFixed(0);
        document.getElementById('endAngleInput').value = newEndAngle.toFixed(0);
    }
    
    // Update calculations
    updatePivotCalculations(rotatingPivot);
    updatePivotInfo(rotatingPivot);
}

function handleRotationClick(e) {
    // Exit rotation mode on click
    window.disableSemiCircleRotation();
    
    // Update button state
    const btn = document.getElementById('rotationModeBtn');
    if (btn) {
        btn.classList.remove('active');
    }
}

// Enable mouse resize for pivots
window.enableMouseResize = function(pivotData) {
    if (!pivotData) return;
    
    resizeMode = true;
    resizingPivot = pivotData;
    
    // Change cursor
    document.getElementById('map').style.cursor = 'crosshair';
    
    // Add resize indicator
    const indicator = document.createElement('div');
    indicator.className = 'resize-indicator';
    indicator.id = 'resizeIndicator';
    indicator.innerHTML = 'Resize Mode - Move mouse to adjust size, click to finish';
    document.querySelector('.map-container').appendChild(indicator);
    
    // Highlight the pivot
    pivotData.circle.setStyle({
        color: '#e74c3c',
        weight: 3,
        opacity: 1
    });
    
    // Add mouse move handler
    map.on('mousemove', handleResizeMouseMove);
    map.on('click', handleResizeClick);
    
    // Disable map dragging during resize
    map.dragging.disable();
};

window.disableMouseResize = function() {
    if (!resizeMode || !resizingPivot) return;
    
    resizeMode = false;
    
    // Restore cursor
    document.getElementById('map').style.cursor = '';
    
    // Remove resize indicator
    const indicator = document.getElementById('resizeIndicator');
    if (indicator) {
        indicator.remove();
    }
    
    // Restore pivot style
    if (resizingPivot) {
        resizingPivot.circle.setStyle({
            color: selectedPivot === resizingPivot ? '#e74c3c' : '#27ae60',
            weight: 2,
            opacity: 0.8
        });
    }
    
    // Remove handlers
    map.off('mousemove', handleResizeMouseMove);
    map.off('click', handleResizeClick);
    
    // Re-enable map dragging
    map.dragging.enable();
    
    resizingPivot = null;
};

function handleResizeMouseMove(e) {
    if (!resizeMode || !resizingPivot) return;
    
    // Calculate new radius based on distance from center to mouse
    const newRadius = calculateDistance(resizingPivot.center, e.latlng);
    
    // Limit radius
    const radius = Math.max(50, Math.min(1000, newRadius));
    
    // Update pivot radius
    resizingPivot.radius = radius;
    
    // Update visual
    if (resizingPivot.type === 'circle') {
        resizingPivot.circle.setRadius(radius);
    } else {
        updateSemiCircle(resizingPivot.circle, resizingPivot.center, radius);
    }
    
    // Update handles
    updateHandlePositions(resizingPivot);
    
    // Update towers if present
    if (resizingPivot.towers) {
        const towerCount = resizingPivot.towerCount;
        const spacing = radius / towerCount;
        
        resizingPivot.towers.forEach((tower, index) => {
            const newDistance = (index + 1) * spacing;
            tower.data.distance = newDistance;
            tower.data.spacing = spacing;
            
            if (resizingPivot.type === 'circle') {
                tower.circle.setRadius(newDistance);
            } else {
                // Update semi-circle tower arc
                const towerPoints = [];
                if (resizingPivot.endAngle < resizingPivot.startAngle) {
                    // Boundary crossing
                    for (let angle = resizingPivot.startAngle; angle <= 360; angle += 2) {
                        const radian = angle * Math.PI / 180;
                        const lat = resizingPivot.center.lat + (newDistance / 111000) * Math.sin(radian);
                        const lng = resizingPivot.center.lng + (newDistance / (111000 * Math.cos(resizingPivot.center.lat * Math.PI / 180))) * Math.cos(radian);
                        towerPoints.push([lat, lng]);
                    }
                    for (let angle = 0; angle <= resizingPivot.endAngle; angle += 2) {
                        const radian = angle * Math.PI / 180;
                        const lat = resizingPivot.center.lat + (newDistance / 111000) * Math.sin(radian);
                        const lng = resizingPivot.center.lng + (newDistance / (111000 * Math.cos(resizingPivot.center.lat * Math.PI / 180))) * Math.cos(radian);
                        towerPoints.push([lat, lng]);
                    }
                } else {
                    // Normal case
                    for (let angle = resizingPivot.startAngle; angle <= resizingPivot.endAngle; angle += 2) {
                        const radian = angle * Math.PI / 180;
                        const lat = resizingPivot.center.lat + (newDistance / 111000) * Math.sin(radian);
                        const lng = resizingPivot.center.lng + (newDistance / (111000 * Math.cos(resizingPivot.center.lat * Math.PI / 180))) * Math.cos(radian);
                        towerPoints.push([lat, lng]);
                    }
                }
                tower.circle.setLatLngs(towerPoints);
            }
            
            // Update label position
            if (resizingPivot.type === 'circle') {
                const labelDistance = index === 0 ? newDistance / 2 : newDistance - (spacing / 2);
                const labelPos = calculatePositionAtAngle(resizingPivot.center, labelDistance, 90);
                tower.label.setLatLng(labelPos);
            } else {
                const midAngle = calculateMiddleAngle(resizingPivot.startAngle, resizingPivot.endAngle);
                const labelDistance = index === 0 ? newDistance / 2 : newDistance - (spacing / 2);
                const labelPos = calculatePositionAtAngle(resizingPivot.center, labelDistance, midAngle);
                tower.label.setLatLng(labelPos);
            }
            
            // Update label text
            const labelHtml = `<div class="tower-distance-label">${spacing.toFixed(1)}m</div>`;
            tower.label.setIcon(L.divIcon({
                html: labelHtml,
                className: 'tower-distance-icon',
                iconSize: [60, 20],
                iconAnchor: [30, 10]
            }));
        });
    }
    
    // Update input fields
    if (document.getElementById('radiusInput')) {
        document.getElementById('radiusInput').value = radius.toFixed(0);
        document.getElementById('diameterInput').value = (radius * 2).toFixed(0);
        const area = calculatePivotArea(resizingPivot);
        document.getElementById('areaInput').value = area.toFixed(2);
    }
    
    // Update calculations and info
    updatePivotCalculations(resizingPivot);
    updatePivotInfo(resizingPivot);
}

function handleResizeClick(e) {
    // Exit resize mode on click
    window.disableMouseResize();
    
    // Update button state
    const btn = document.getElementById('resizeModeBtn');
    if (btn) {
        btn.classList.remove('active');
    }
}

// Update semi-circle shape
function updateSemiCircle(shape, center, radius) {
    const pivotData = pivotLayers.find(p => p.circle === shape);
    if (!pivotData) return;
    
    const points = [];
    const angleStep = 1; // Even higher resolution for smoother curves
    
    points.push(center);
    
    // Handle boundary crossing
    if (pivotData.endAngle < pivotData.startAngle) {
        // Boundary crossing case (e.g., 270° to 90°)
        // Draw from start to 360°
        for (let angle = pivotData.startAngle; angle <= 360; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = center.lat + (radius / 111000) * Math.sin(radian);
            const lng = center.lng + (radius / (111000 * Math.cos(center.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
        // Then from 0° to end
        for (let angle = 0; angle <= pivotData.endAngle; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = center.lat + (radius / 111000) * Math.sin(radian);
            const lng = center.lng + (radius / (111000 * Math.cos(center.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
    } else {
        // Normal case
        for (let angle = pivotData.startAngle; angle <= pivotData.endAngle; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = center.lat + (radius / 111000) * Math.sin(radian);
            const lng = center.lng + (radius / (111000 * Math.cos(center.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
    }
    
    points.push(center);
    shape.setLatLngs(points);
}

// Update semi-circle rotation
function updateSemiCircleRotation(pivotData) {
    const points = [];
    const angleStep = 1; // 1 degree for high quality smooth curves
    
    points.push(pivotData.center);
    
    // Handle boundary crossing
    if (pivotData.endAngle < pivotData.startAngle) {
        // Boundary crossing case (e.g., 270° to 90°)
        // Draw from start to 360°
        for (let angle = pivotData.startAngle; angle <= 360; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = pivotData.center.lat + (pivotData.radius / 111000) * Math.sin(radian);
            const lng = pivotData.center.lng + (pivotData.radius / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
        // Then from 0° to end
        for (let angle = 0; angle <= pivotData.endAngle; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = pivotData.center.lat + (pivotData.radius / 111000) * Math.sin(radian);
            const lng = pivotData.center.lng + (pivotData.radius / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
    } else {
        // Normal case
        for (let angle = pivotData.startAngle; angle <= pivotData.endAngle; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = pivotData.center.lat + (pivotData.radius / 111000) * Math.sin(radian);
            const lng = pivotData.center.lng + (pivotData.radius / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
    }
    
    points.push(pivotData.center);
    pivotData.circle.setLatLngs(points);
    
    // Update handles
    updateHandlePositions(pivotData);
    
    // Update towers if present
    if (pivotData.towers) {
        pivotData.towers.forEach((tower, index) => {
            // Recreate tower arc with new angles
            const towerPoints = [];
            
            // Handle boundary crossing
            if (pivotData.endAngle < pivotData.startAngle) {
                // Boundary crossing case
                for (let angle = pivotData.startAngle; angle <= 360; angle += 2) {
                    const radian = angle * Math.PI / 180;
                    const lat = pivotData.center.lat + (tower.data.distance / 111000) * Math.sin(radian);
                    const lng = pivotData.center.lng + (tower.data.distance / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
                    towerPoints.push([lat, lng]);
                }
                for (let angle = 0; angle <= pivotData.endAngle; angle += 2) {
                    const radian = angle * Math.PI / 180;
                    const lat = pivotData.center.lat + (tower.data.distance / 111000) * Math.sin(radian);
                    const lng = pivotData.center.lng + (tower.data.distance / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
                    towerPoints.push([lat, lng]);
                }
            } else {
                // Normal case
                for (let angle = pivotData.startAngle; angle <= pivotData.endAngle; angle += 2) {
                    const radian = angle * Math.PI / 180;
                    const lat = pivotData.center.lat + (tower.data.distance / 111000) * Math.sin(radian);
                    const lng = pivotData.center.lng + (tower.data.distance / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
                    towerPoints.push([lat, lng]);
                }
            }
            
            tower.circle.setLatLngs(towerPoints);
            
            // Update label position
            const midAngle = calculateMiddleAngle(pivotData.startAngle, pivotData.endAngle);
            const labelDistance = index === 0 ? tower.data.distance / 2 : tower.data.distance - (tower.data.spacing / 2);
            const labelPos = calculatePositionAtAngle(pivotData.center, labelDistance, midAngle);
            tower.label.setLatLng(labelPos);
        });
    }
}

// Update handle positions when pivot is moved or resized
function updateHandlePositions(pivotData) {
    if (!pivotData.handles) return;
    
    pivotData.handles.forEach((handle, index) => {
        if (pivotData.type === 'circle') {
            const angle = index * 90; // 0, 90, 180, 270 degrees
            const radian = angle * Math.PI / 180;
            const lat = pivotData.center.lat + (pivotData.radius / 111000) * Math.sin(radian);
            const lng = pivotData.center.lng + (pivotData.radius / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
            handle.setLatLng([lat, lng]);
        } else if (pivotData.type === 'semicircle') {
            // Only one handle at the middle of the arc
            const midAngle = (pivotData.startAngle + pivotData.endAngle) / 2;
            const radian = midAngle * Math.PI / 180;
            const lat = pivotData.center.lat + (pivotData.radius / 111000) * Math.sin(radian);
            const lng = pivotData.center.lng + (pivotData.radius / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
            handle.setLatLng([lat, lng]);
        }
    });
}

// Update drawing button states
function updateDrawingButtons() {
    document.getElementById('drawCircleBtn').classList.toggle('active', window.currentDrawingMode === 'circle');
    document.getElementById('drawSemiCircleBtn').classList.toggle('active', window.currentDrawingMode === 'semicircle');
}

// Enable dragging for a pivot
function enablePivotDragging(pivotData) {
    let isDragging = false;
    let currentPivot = pivotData;
    
    // Make the center marker draggable
    pivotData.centerMarker.on('mousedown', function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        
        // Select the pivot first
        selectPivot(currentPivot);
        
        isDragging = true;
        map.dragging.disable();
        document.body.style.cursor = 'move';
        
        // Highlight the pivot being dragged
        currentPivot.circle.setStyle({ 
            color: '#e74c3c',
            weight: 3,
            opacity: 1
        });
        
        // Bind drag events
        const onMouseMove = function(e) {
            if (!isDragging) return;
            
            const newCenter = e.latlng;
            
            // Update circle position
            if (currentPivot.type === 'circle') {
                currentPivot.circle.setLatLng(newCenter);
            } else {
                updateSemiCirclePosition(currentPivot, newCenter);
            }
            currentPivot.center = newCenter;
            
            // Update center marker
            currentPivot.centerMarker.setLatLng(newCenter);
            
            // Update label
            currentPivot.labelMarker.setLatLng(newCenter);
            
            // Update handles
            updateHandlePositions(currentPivot);
            
            // Update towers if present
            if (currentPivot.towers) {
                updateTowerPositions(currentPivot);
            }
        };
        
        const onMouseUp = function() {
            if (isDragging) {
                isDragging = false;
                map.dragging.enable();
                document.body.style.cursor = '';
                
                // Restore normal style
                currentPivot.circle.setStyle({ 
                    color: '#e74c3c',
                    weight: 2,
                    opacity: 0.8
                });
                
                // Update calculations
                updatePivotCalculations(currentPivot);
                
                // Remove temporary event listeners
                map.off('mousemove', onMouseMove);
                map.off('mouseup', onMouseUp);
            }
        };
        
        // Attach temporary event listeners
        map.on('mousemove', onMouseMove);
        map.on('mouseup', onMouseUp);
    });
    
    // Also make the circle itself draggable
    pivotData.circle.on('mousedown', function(e) {
        if (e.originalEvent.target === pivotData.centerMarker._path) return;
        pivotData.centerMarker.fire('mousedown', e);
    });
}

// Update handle positions when pivot is moved
function updateHandlePositions(pivotData) {
    if (!pivotData.handles) return;
    
    pivotData.handles.forEach((handle, index) => {
        if (pivotData.type === 'circle') {
            const angle = index * 90; // 0, 90, 180, 270 degrees
            const radian = angle * Math.PI / 180;
            const lat = pivotData.center.lat + (pivotData.radius / 111000) * Math.sin(radian);
            const lng = pivotData.center.lng + (pivotData.radius / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
            handle.setLatLng([lat, lng]);
        } else if (pivotData.type === 'semicircle') {
            // Only one handle at the middle of the arc
            const midAngle = (pivotData.startAngle + pivotData.endAngle) / 2;
            const radian = midAngle * Math.PI / 180;
            const lat = pivotData.center.lat + (pivotData.radius / 111000) * Math.sin(radian);
            const lng = pivotData.center.lng + (pivotData.radius / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
            handle.setLatLng([lat, lng]);
        }
    });
}

// Update tower positions when pivot is moved
function updateTowerPositions(pivotData) {
    if (!pivotData.towers) return;
    
    pivotData.towers.forEach((tower, index) => {
        if (pivotData.type === 'circle') {
            // Update full circle tower
            tower.circle.setLatLng(pivotData.center);
        } else if (pivotData.type === 'semicircle') {
            // Recreate semi-circle tower arc with new position
            const points = [];
            const angleStep = 2;
            
            for (let angle = pivotData.startAngle; angle <= pivotData.endAngle; angle += angleStep) {
                const radian = angle * Math.PI / 180;
                const lat = pivotData.center.lat + (tower.data.distance / 111000) * Math.sin(radian);
                const lng = pivotData.center.lng + (tower.data.distance / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
                points.push([lat, lng]);
            }
            
            tower.circle.setLatLngs(points);
        }
        
        // Update tower label position
        if (pivotData.type === 'circle') {
            const labelDistance = index === 0 ? tower.data.distance / 2 : tower.data.distance - (tower.data.spacing / 2);
            const labelAngle = 90; // Place at top for visibility
            const labelPos = calculatePositionAtAngle(pivotData.center, labelDistance, labelAngle);
            tower.label.setLatLng(labelPos);
        } else {
            // For semi-circles, place label at middle of arc
            const midAngle = calculateMiddleAngle(pivotData.startAngle, pivotData.endAngle);
            const labelDistance = index === 0 ? tower.data.distance / 2 : tower.data.distance - (tower.data.spacing / 2);
            const labelPos = calculatePositionAtAngle(pivotData.center, labelDistance, midAngle);
            tower.label.setLatLng(labelPos);
        }
    });
}

// Update semi-circle position
function updateSemiCirclePosition(pivotData, newCenter) {
    const points = [];
    const angleStep = 1; // 1 degree for high quality smooth curves
    
    points.push(newCenter);
    
    // Handle boundary crossing
    if (pivotData.endAngle < pivotData.startAngle) {
        // Boundary crossing case
        for (let angle = pivotData.startAngle; angle <= 360; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = newCenter.lat + (pivotData.radius / 111000) * Math.sin(radian);
            const lng = newCenter.lng + (pivotData.radius / (111000 * Math.cos(newCenter.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
        for (let angle = 0; angle <= pivotData.endAngle; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = newCenter.lat + (pivotData.radius / 111000) * Math.sin(radian);
            const lng = newCenter.lng + (pivotData.radius / (111000 * Math.cos(newCenter.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
    } else {
        // Normal case
        for (let angle = pivotData.startAngle; angle <= pivotData.endAngle; angle += angleStep) {
            const radian = angle * Math.PI / 180;
            const lat = newCenter.lat + (pivotData.radius / 111000) * Math.sin(radian);
            const lng = newCenter.lng + (pivotData.radius / (111000 * Math.cos(newCenter.lat * Math.PI / 180))) * Math.cos(radian);
            points.push([lat, lng]);
        }
    }
    
    points.push(newCenter);
    pivotData.circle.setLatLngs(points);
}