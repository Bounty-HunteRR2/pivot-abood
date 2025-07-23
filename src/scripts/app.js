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