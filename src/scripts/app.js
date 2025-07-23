// Main application initialization and event handlers

document.addEventListener('DOMContentLoaded', function() {
    // Initialize event handlers
    initializeEventHandlers();
});

function initializeEventHandlers() {
    // Import button
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    // File input handler
    document.getElementById('fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importLandPolygon(file);
        }
    });
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportToKML);
    
    // Drawing tool buttons
    document.getElementById('drawCircleBtn').addEventListener('click', () => {
        window.currentDrawingMode = window.currentDrawingMode === 'circle' ? null : 'circle';
        updateDrawingButtons();
    });
    
    document.getElementById('drawSemiCircleBtn').addEventListener('click', () => {
        window.currentDrawingMode = window.currentDrawingMode === 'semicircle' ? null : 'semicircle';
        updateDrawingButtons();
    });
    
    // Clear all button
    document.getElementById('clearAllBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all pivots?')) {
            clearAllPivots();
        }
    });
    
    // Specification form
    document.getElementById('specForm').addEventListener('submit', saveSpecifications);
    
    // Dynamic size adjustment
    initializeSizeAdjustment();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to cancel drawing mode
        if (e.key === 'Escape') {
            window.currentDrawingMode = null;
            updateDrawingButtons();
        }
        
        // Delete key to remove selected pivot
        if (e.key === 'Delete' && selectedPivot) {
            removePivot(selectedPivot);
        }
    });
}

// Remove a specific pivot
function removePivot(pivotData) {
    if (!pivotData) return;
    
    // Remove from map
    map.removeLayer(pivotData.group);
    
    // Remove from array
    const index = pivotLayers.findIndex(p => p.id === pivotData.id);
    if (index > -1) {
        pivotLayers.splice(index, 1);
    }
    
    // Clear selection if this was selected
    if (selectedPivot && selectedPivot.id === pivotData.id) {
        selectPivot(null);
    }
    
    // Update total area display
    updatePivotInfo(selectedPivot);
}

// Add some example pivots for testing
function addExamplePivots() {
    // Add a full circle pivot
    const circle1 = createCirclePivot(L.latLng(31.0, 35.0), 400);
    
    // Add another circle
    const circle2 = createCirclePivot(L.latLng(31.005, 35.008), 350);
    
    // Add a semi-circle
    const semi1 = createSemiCirclePivot(L.latLng(30.995, 35.005), 300, 0, 180);
}

// Utility function to show notifications (enhanced)
window.showNotification = function(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
};

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
    @keyframes slideOut {
        from { transform: translateX(0); }
        to { transform: translateX(100%); }
    }
`;
document.head.appendChild(style);

// Helper function to update size inputs
function updateSizeInputs(pivotData) {
    if (!pivotData) return;
    
    const radiusInput = document.getElementById('radiusInput');
    const diameterInput = document.getElementById('diameterInput');
    const areaInput = document.getElementById('areaInput');
    
    if (radiusInput) radiusInput.value = pivotData.radius.toFixed(0);
    if (diameterInput) diameterInput.value = (pivotData.radius * 2).toFixed(0);
    if (areaInput) {
        const area = calculatePivotArea(pivotData);
        areaInput.value = area.toFixed(2);
    }
}

// Initialize dynamic size adjustment
function initializeSizeAdjustment() {
    const radiusInput = document.getElementById('radiusInput');
    const diameterInput = document.getElementById('diameterInput');
    const areaInput = document.getElementById('areaInput');
    
    // Radius input handler
    radiusInput.addEventListener('input', (e) => {
        if (!selectedPivot) return;
        
        const radius = parseFloat(e.target.value);
        if (!isNaN(radius) && radius >= 50) {
            updatePivotSize(selectedPivot, radius);
            
            // Update other inputs
            diameterInput.value = (radius * 2).toFixed(0);
            const area = calculatePivotArea(selectedPivot);
            areaInput.value = area.toFixed(2);
        }
    });
    
    // Diameter input handler
    diameterInput.addEventListener('input', (e) => {
        if (!selectedPivot) return;
        
        const diameter = parseFloat(e.target.value);
        if (!isNaN(diameter) && diameter >= 100) {
            const radius = diameter / 2;
            updatePivotSize(selectedPivot, radius);
            
            // Update other inputs
            radiusInput.value = radius.toFixed(0);
            const area = calculatePivotArea(selectedPivot);
            areaInput.value = area.toFixed(2);
        }
    });
    
    // Area input handler
    areaInput.addEventListener('input', (e) => {
        if (!selectedPivot) return;
        
        const area = parseFloat(e.target.value);
        if (!isNaN(area) && area >= 0.1) {
            let radius;
            
            if (selectedPivot.type === 'circle') {
                // For circle: A = πr²
                radius = Math.sqrt((area * 10000) / Math.PI);
            } else {
                // For semi-circle: A = (angle/360) * πr²
                const angleDegrees = calculateArcSpan(selectedPivot.startAngle, selectedPivot.endAngle);
                radius = Math.sqrt((area * 10000 * 360) / (angleDegrees * Math.PI));
            }
            
            updatePivotSize(selectedPivot, radius);
            
            // Update other inputs
            radiusInput.value = radius.toFixed(0);
            diameterInput.value = (radius * 2).toFixed(0);
        }
    });
    
    // Initialize rotation controls
    initializeRotationControls();
    
    // Initialize resize controls
    initializeResizeControls();
}

// Initialize rotation controls for semi-circles
function initializeRotationControls() {
    const startAngleInput = document.getElementById('startAngleInput');
    const endAngleInput = document.getElementById('endAngleInput');
    const orientationButtons = document.querySelectorAll('.orientation-btn');
    
    // Helper function to calculate arc span considering boundary crossing
    function calculateArcSpan(start, end) {
        if (end >= start) {
            return end - start;
        } else {
            // Boundary crossing case (e.g., 270° to 90°)
            return (360 - start) + end;
        }
    }
    
    // Start angle input handler
    startAngleInput.addEventListener('input', (e) => {
        if (!selectedPivot || selectedPivot.type !== 'semicircle') return;
        
        // Allow empty input for deletion
        if (e.target.value === '') return;
        
        const startAngle = parseFloat(e.target.value);
        if (!isNaN(startAngle) && startAngle >= 0 && startAngle <= 360) {
            // Calculate arc span considering boundary crossing
            const arcSpan = calculateArcSpan(startAngle, selectedPivot.endAngle);
            
            // Ensure minimum arc of 20 degrees
            if (arcSpan >= 20 && arcSpan <= 340) {
                selectedPivot.startAngle = startAngle;
                updateSemiCircleRotation(selectedPivot);
                updatePivotCalculations(selectedPivot);
                updatePivotInfo(selectedPivot);
                updateSizeInputs(selectedPivot);
            } else {
                // Revert to previous value
                e.target.value = selectedPivot.startAngle.toFixed(0);
            }
        } else if (!isNaN(startAngle)) {
            // Invalid range, revert
            e.target.value = selectedPivot.startAngle.toFixed(0);
        }
    });
    
    // End angle input handler
    endAngleInput.addEventListener('input', (e) => {
        if (!selectedPivot || selectedPivot.type !== 'semicircle') return;
        
        // Allow empty input for deletion
        if (e.target.value === '') return;
        
        const endAngle = parseFloat(e.target.value);
        if (!isNaN(endAngle) && endAngle >= 0 && endAngle <= 360) {
            // Calculate arc span considering boundary crossing
            const arcSpan = calculateArcSpan(selectedPivot.startAngle, endAngle);
            
            // Ensure minimum arc of 20 degrees
            if (arcSpan >= 20 && arcSpan <= 340) {
                selectedPivot.endAngle = endAngle;
                updateSemiCircleRotation(selectedPivot);
                updatePivotCalculations(selectedPivot);
                updatePivotInfo(selectedPivot);
                updateSizeInputs(selectedPivot);
            } else {
                // Revert to previous value
                e.target.value = selectedPivot.endAngle.toFixed(0);
            }
        } else if (!isNaN(endAngle)) {
            // Invalid range, revert
            e.target.value = selectedPivot.endAngle.toFixed(0);
        }
    });
    
    // Restore values on blur if empty
    startAngleInput.addEventListener('blur', (e) => {
        if (e.target.value === '' && selectedPivot && selectedPivot.type === 'semicircle') {
            e.target.value = selectedPivot.startAngle.toFixed(0);
        }
    });
    
    endAngleInput.addEventListener('blur', (e) => {
        if (e.target.value === '' && selectedPivot && selectedPivot.type === 'semicircle') {
            e.target.value = selectedPivot.endAngle.toFixed(0);
        }
    });
    
    // Orientation preset buttons
    orientationButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!selectedPivot || selectedPivot.type !== 'semicircle') return;
            
            const startAngle = parseFloat(button.dataset.start);
            const endAngle = parseFloat(button.dataset.end);
            
            selectedPivot.startAngle = startAngle;
            selectedPivot.endAngle = endAngle;
            
            // Update inputs
            startAngleInput.value = startAngle;
            endAngleInput.value = endAngle;
            
            // Update the semi-circle
            updateSemiCircleRotation(selectedPivot);
            updatePivotCalculations(selectedPivot);
            updatePivotInfo(selectedPivot);
            updateSizeInputs(selectedPivot);
        });
    });
    
    // Rotation mode button
    const rotationModeBtn = document.getElementById('rotationModeBtn');
    rotationModeBtn.addEventListener('click', () => {
        if (!selectedPivot || selectedPivot.type !== 'semicircle') return;
        
        if (rotationModeBtn.classList.contains('active')) {
            // Disable rotation mode
            window.disableSemiCircleRotation();
            rotationModeBtn.classList.remove('active');
        } else {
            // Enable rotation mode
            window.enableSemiCircleRotation(selectedPivot);
            rotationModeBtn.classList.add('active');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC key to exit rotation mode
        if (e.key === 'Escape') {
            window.disableSemiCircleRotation();
            const btn = document.getElementById('rotationModeBtn');
            if (btn) {
                btn.classList.remove('active');
            }
        }
        
        // R key to toggle rotation mode
        if (e.key === 'r' || e.key === 'R') {
            // Check if we're not in an input field
            if (document.activeElement.tagName !== 'INPUT' && 
                document.activeElement.tagName !== 'TEXTAREA') {
                if (selectedPivot && selectedPivot.type === 'semicircle') {
                    const btn = document.getElementById('rotationModeBtn');
                    if (btn) {
                        btn.click();
                    }
                }
            }
        }
    });
}

// Initialize resize controls
function initializeResizeControls() {
    const resizeModeBtn = document.getElementById('resizeModeBtn');
    
    resizeModeBtn.addEventListener('click', () => {
        if (!selectedPivot) return;
        
        if (resizeModeBtn.classList.contains('active')) {
            // Disable resize mode
            window.disableMouseResize();
            resizeModeBtn.classList.remove('active');
        } else {
            // Enable resize mode
            window.enableMouseResize(selectedPivot);
            resizeModeBtn.classList.add('active');
        }
    });
    
    // Add to keyboard shortcuts handler
    document.addEventListener('keydown', (e) => {
        // S key to toggle resize mode
        if (e.key === 's' || e.key === 'S') {
            // Check if we're not in an input field
            if (document.activeElement.tagName !== 'INPUT' && 
                document.activeElement.tagName !== 'TEXTAREA') {
                if (selectedPivot) {
                    const btn = document.getElementById('resizeModeBtn');
                    if (btn) {
                        btn.click();
                    }
                }
            }
        }
        
        // ESC key to exit resize mode
        if (e.key === 'Escape') {
            window.disableMouseResize();
            const btn = document.getElementById('resizeModeBtn');
            if (btn) {
                btn.classList.remove('active');
            }
        }
    });
}

// Update pivot size
function updatePivotSize(pivotData, newRadius) {
    pivotData.radius = newRadius;
    
    if (pivotData.type === 'circle') {
        pivotData.circle.setRadius(newRadius);
    } else {
        // Recreate semi-circle with new radius
        updateSemiCircle(pivotData.circle, pivotData.center, newRadius);
    }
    
    // Update handles
    updateHandlePositions(pivotData);
    
    // Update towers if present
    if (pivotData.towers) {
        const towerCount = pivotData.towerCount;
        const spacing = newRadius / towerCount;
        
        pivotData.towers.forEach((tower, index) => {
            const newDistance = (index + 1) * spacing;
            tower.data.distance = newDistance;
            tower.data.spacing = spacing;
            
            if (pivotData.type === 'circle') {
                tower.circle.setRadius(newDistance);
            } else {
                // Recreate semi-circle tower arc
                const points = [];
                for (let angle = pivotData.startAngle; angle <= pivotData.endAngle; angle += 2) {
                    const radian = angle * Math.PI / 180;
                    const lat = pivotData.center.lat + (newDistance / 111000) * Math.sin(radian);
                    const lng = pivotData.center.lng + (newDistance / (111000 * Math.cos(pivotData.center.lat * Math.PI / 180))) * Math.cos(radian);
                    points.push([lat, lng]);
                }
                tower.circle.setLatLngs(points);
            }
            
            // Update label
            const labelDistance = index === 0 ? newDistance / 2 : newDistance - (spacing / 2);
            const labelAngle = pivotData.type === 'circle' ? 90 : (pivotData.startAngle + pivotData.endAngle) / 2;
            const labelPos = calculatePositionAtAngle(pivotData.center, labelDistance, labelAngle);
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
    
    // Update calculations and display
    updatePivotCalculations(pivotData);
    updatePivotInfo(pivotData);
}

// Show size adjustment controls
window.showSizeAdjustment = function(pivotData) {
    const sizeAdjustment = document.getElementById('sizeAdjustment');
    const rotationControls = document.getElementById('rotationControls');
    
    if (pivotData) {
        sizeAdjustment.style.display = 'block';
        
        // Set current values
        document.getElementById('radiusInput').value = pivotData.radius.toFixed(0);
        document.getElementById('diameterInput').value = (pivotData.radius * 2).toFixed(0);
        const area = calculatePivotArea(pivotData);
        document.getElementById('areaInput').value = area.toFixed(2);
        
        // Show rotation controls for semi-circles
        if (pivotData.type === 'semicircle') {
            rotationControls.style.display = 'block';
            document.getElementById('startAngleInput').value = pivotData.startAngle.toFixed(0);
            document.getElementById('endAngleInput').value = pivotData.endAngle.toFixed(0);
        } else {
            rotationControls.style.display = 'none';
        }
    } else {
        sizeAdjustment.style.display = 'none';
        rotationControls.style.display = 'none';
    }
};