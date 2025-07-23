// Irrigation pivot drawing and management
let pivotIdCounter = 0;
window.currentDrawingMode = null;

// Create a circle pivot at the specified location
function createCirclePivot(latlng, radius = 400) {
    pivotIdCounter++;
    
    // Create circle
    const circle = L.circle(latlng, {
        radius: radius,
        color: '#3498db',
        weight: 2,
        opacity: 0.8,
        fillColor: '#3498db',
        fillOpacity: 0.2,
        className: 'pivot-circle'
    });
    
    // Create center marker
    const centerMarker = L.circleMarker(latlng, {
        radius: 5,
        color: '#2c3e50',
        fillColor: '#2c3e50',
        fillOpacity: 1
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
    const angleStep = 5; // degrees
    
    // Add center point
    points.push(latlng);
    
    // Add arc points
    for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
        const radian = angle * Math.PI / 180;
        const lat = latlng.lat + (radius / 111000) * Math.sin(radian);
        const lng = latlng.lng + (radius / (111000 * Math.cos(latlng.lat * Math.PI / 180))) * Math.cos(radian);
        points.push([lat, lng]);
    }
    
    // Close the polygon back to center
    points.push(latlng);
    
    const semiCircle = L.polygon(points, {
        color: '#3498db',
        weight: 2,
        opacity: 0.8,
        fillColor: '#3498db',
        fillOpacity: 0.2,
        className: 'pivot-circle'
    });
    
    // Create center marker
    const centerMarker = L.circleMarker(latlng, {
        radius: 5,
        color: '#2c3e50',
        fillColor: '#2c3e50',
        fillOpacity: 1
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
        // Create handles at start, middle, and end of arc
        const angles = [startAngle, (startAngle + endAngle) / 2, endAngle];
        
        angles.forEach((angle, index) => {
            const radian = angle * Math.PI / 180;
            const lat = center.lat + (radius / 111000) * Math.sin(radian);
            const lng = center.lng + (radius / (111000 * Math.cos(center.lat * Math.PI / 180))) * Math.cos(radian);
            
            const handle = L.circleMarker([lat, lng], {
                radius: 6,
                color: '#fff',
                fillColor: index === 1 ? '#3498db' : '#e74c3c', // Different color for rotation handles
                fillOpacity: 1,
                weight: 2
            });
            
            // Make handle draggable
            if (index === 1) {
                handle.on('mousedown', (e) => startResizing(e, shape, center, angle, type));
            } else {
                handle.on('mousedown', (e) => startRotating(e, shape, center, radius, index === 0 ? 'start' : 'end'));
            }
            
            handles.push(handle);
        });
    }
    
    return handles;
}

// Start resizing a pivot
function startResizing(e, shape, center, handleAngle, type) {
    L.DomEvent.stopPropagation(e);
    
    const originalRadius = shape.getRadius ? shape.getRadius() : 
        calculateDistance(center, shape.getLatLngs()[0][1]);
    
    const onMouseMove = (e) => {
        const newPoint = map.mouseEventToLatLng(e);
        const newRadius = calculateDistance(center, newPoint);
        
        if (type === 'circle') {
            shape.setRadius(newRadius);
        } else {
            // Recreate semi-circle with new radius
            updateSemiCircle(shape, center, newRadius);
        }
        
        // Update handles position
        updateHandlePositions(center, newRadius, type);
    };
    
    const onMouseUp = () => {
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        
        // Update calculations
        const pivotData = pivotLayers.find(p => p.circle === shape);
        if (pivotData) {
            pivotData.radius = shape.getRadius ? shape.getRadius() : 
                calculateDistance(center, shape.getLatLngs()[0][1]);
            updatePivotCalculations(pivotData);
        }
    };
    
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
}

// Start rotating a semi-circle
function startRotating(e, shape, center, radius, handle) {
    L.DomEvent.stopPropagation(e);
    
    const onMouseMove = (e) => {
        const newPoint = map.mouseEventToLatLng(e);
        const angle = calculateAngle(center, newPoint);
        
        // Update semi-circle rotation
        const pivotData = pivotLayers.find(p => p.circle === shape);
        if (pivotData) {
            if (handle === 'start') {
                pivotData.startAngle = angle;
            } else {
                pivotData.endAngle = angle;
            }
            updateSemiCircleRotation(pivotData);
        }
    };
    
    const onMouseUp = () => {
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        
        // Update calculations
        const pivotData = pivotLayers.find(p => p.circle === shape);
        if (pivotData) {
            updatePivotCalculations(pivotData);
        }
    };
    
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

// Update semi-circle shape
function updateSemiCircle(shape, center, radius) {
    const pivotData = pivotLayers.find(p => p.circle === shape);
    if (!pivotData) return;
    
    const points = [];
    const angleStep = 5;
    
    points.push(center);
    
    for (let angle = pivotData.startAngle; angle <= pivotData.endAngle; angle += angleStep) {
        const radian = angle * Math.PI / 180;
        const lat = center.lat + (radius / 111000) * Math.sin(radian);
        const lng = center.lng + (radius / (111000 * Math.cos(center.lat * Math.PI / 180))) * Math.cos(radian);
        points.push([lat, lng]);
    }
    
    points.push(center);
    shape.setLatLngs(points);
}

// Update semi-circle rotation
function updateSemiCircleRotation(pivotData) {
    const points = [];
    const angleStep = 5;
    
    points.push(pivotData.center);
    
    for (let angle = pivotData.startAngle; angle <= pivotData.endAngle; angle += angleStep) {
        const radian = angle * Math.PI / 180;
        const lat = pivotData.center.lat + (pivotData.radius / 111000) * Math.sin(radian);
        const lng = pivotData.center.lng + (pivotData.radius / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
        points.push([lat, lng]);
    }
    
    points.push(pivotData.center);
    pivotData.circle.setLatLngs(points);
    
    // Update handles
    updateHandlePositions(pivotData.center, pivotData.radius, 'semicircle', pivotData.startAngle, pivotData.endAngle);
}

// Update handle positions
function updateHandlePositions(center, radius, type, startAngle, endAngle) {
    // This would update all handle positions based on new radius/angles
    // Implementation depends on how handles are stored and managed
}

// Update drawing button states
function updateDrawingButtons() {
    document.getElementById('drawCircleBtn').classList.toggle('active', window.currentDrawingMode === 'circle');
    document.getElementById('drawSemiCircleBtn').classList.toggle('active', window.currentDrawingMode === 'semicircle');
}