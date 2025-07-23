// PDF export functionality - Clean visual design

async function exportToPDF() {
    try {
        showNotification('Generating PDF...', 'info');
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        // Page dimensions for landscape A4
        const pageWidth = 297;
        const pageHeight = 210;
        
        // Hide UI elements
        const sidebar = document.querySelector('.sidebar');
        const header = document.querySelector('.header');
        const mapControls = document.querySelectorAll('.leaflet-control');
        const originalSidebarDisplay = sidebar.style.display;
        const originalHeaderDisplay = header.style.display;
        
        sidebar.style.display = 'none';
        header.style.display = 'none';
        mapControls.forEach(control => control.style.display = 'none');
        
        // Store original map state
        const originalCenter = map.getCenter();
        const originalZoom = map.getZoom();
        
        // Calculate bounds to include all content
        let bounds;
        if (landPolygon && pivotLayers.length > 0) {
            // Include both land polygon and all pivots
            const group = new L.featureGroup([landPolygon, ...pivotLayers.map(p => p.circle)]);
            bounds = group.getBounds();
        } else if (landPolygon) {
            bounds = landPolygon.getBounds();
        } else if (pivotLayers.length > 0) {
            const group = new L.featureGroup(pivotLayers.map(p => p.circle));
            bounds = group.getBounds();
        } else {
            // No content to export
            showNotification('No content to export', 'error');
            sidebar.style.display = originalSidebarDisplay;
            header.style.display = originalHeaderDisplay;
            mapControls.forEach(control => control.style.display = '');
            return;
        }
        
        // Add padding to bounds
        const latPadding = (bounds.getNorth() - bounds.getSouth()) * 0.1;
        const lngPadding = (bounds.getEast() - bounds.getWest()) * 0.1;
        bounds = L.latLngBounds(
            [bounds.getSouth() - latPadding, bounds.getWest() - lngPadding],
            [bounds.getNorth() + latPadding, bounds.getEast() + lngPadding]
        );
        
        // Fit map to bounds
        map.fitBounds(bounds);
        
        // Wait for map to render
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Capture the map
        const mapContainer = document.getElementById('map');
        const canvas = await html2canvas(mapContainer, {
            scale: 3, // High quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            ignoreElements: (element) => {
                return element.classList.contains('leaflet-control') || 
                       element.classList.contains('leaflet-control-container');
            }
        });
        
        // Restore UI elements
        sidebar.style.display = originalSidebarDisplay;
        header.style.display = originalHeaderDisplay;
        mapControls.forEach(control => control.style.display = '');
        map.setView(originalCenter, originalZoom);
        
        // Add map image to PDF
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calculate dimensions to fit the page
        const margin = 10;
        const maxWidth = pageWidth - (2 * margin);
        const maxHeight = pageHeight - (2 * margin);
        
        let imgWidth = maxWidth;
        let imgHeight = (canvas.height / canvas.width) * imgWidth;
        
        if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = (canvas.width / canvas.height) * imgHeight;
        }
        
        // Center the image
        const xOffset = (pageWidth - imgWidth) / 2;
        const yOffset = (pageHeight - imgHeight) / 2;
        
        // Add white background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Add the map image
        doc.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
        
        // Add pivot information overlays
        const scale = imgWidth / canvas.width;
        
        pivotLayers.forEach((pivot, index) => {
            // Get pivot position on the map
            const point = map.latLngToContainerPoint(pivot.center);
            
            // Convert to PDF coordinates
            const pdfX = xOffset + (point.x * scale);
            const pdfY = yOffset + (point.y * scale);
            
            // Prepare pivot info text
            const info = [];
            info.push(`R: ${pivot.radius}m`);
            info.push(`A: ${pivot.area ? pivot.area.toFixed(1) : '0.0'} ha`);
            
            if (pivot.specifications.flowRate > 0) {
                info.push(`${pivot.specifications.flowRate} m³/h`);
            }
            if (pivot.specifications.power > 0) {
                info.push(`${pivot.specifications.power} kW`);
            }
            
            // Calculate text box dimensions
            doc.setFontSize(10);
            const lineHeight = 4;
            const padding = 2;
            const textWidth = Math.max(...info.map(line => doc.getTextWidth(line))) + (2 * padding);
            const textHeight = (info.length * lineHeight) + (2 * padding);
            
            // Position text box (offset to avoid overlapping with pivot)
            let textX = pdfX + (pivot.radius * scale * 0.7);
            let textY = pdfY - (textHeight / 2);
            
            // Adjust position to keep text within page bounds
            if (textX + textWidth > pageWidth - margin) {
                textX = pdfX - textWidth - (pivot.radius * scale * 0.7);
            }
            if (textY < margin) {
                textY = margin;
            }
            if (textY + textHeight > pageHeight - margin) {
                textY = pageHeight - margin - textHeight;
            }
            
            // Draw text background
            doc.setFillColor(255, 255, 255, 0.9);
            doc.setDrawColor(100, 100, 100);
            doc.roundedRect(textX, textY, textWidth, textHeight, 1, 1, 'FD');
            
            // Draw text
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(9);
            info.forEach((line, i) => {
                doc.text(line, textX + padding, textY + padding + ((i + 1) * lineHeight));
            });
            
            // Add tower count if applicable
            if (pivot.towers && pivot.towers.length > 0) {
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text(`${pivot.towerCount} towers`, textX + padding, textY + textHeight - 1);
            }
        });
        
        // Add title and date in corner
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text('Center Pivot Irrigation Plan', margin, margin + 5);
        
        doc.setFontSize(10);
        const today = new Date().toLocaleDateString();
        doc.text(today, margin, margin + 10);
        
        // Add total area in bottom corner
        if (pivotLayers.length > 0) {
            const totalArea = calculateTotalArea();
            doc.setFontSize(10);
            doc.text(`Total Area: ${totalArea.toFixed(2)} ha (${pivotLayers.length} pivot${pivotLayers.length !== 1 ? 's' : ''})`, 
                     margin, pageHeight - margin);
        }
        
        // Save the PDF
        const filename = `irrigation_plan_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        
        showNotification('PDF exported successfully', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Error generating PDF: ' + error.message, 'error');
        
        // Restore UI in case of error
        document.querySelector('.sidebar').style.display = '';
        document.querySelector('.header').style.display = '';
        document.querySelectorAll('.leaflet-control').forEach(control => control.style.display = '');
    }
}

// Add PDF export button handler
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportPdfBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToPDF);
        
        // Enable/disable button based on content
        const updateExportButton = () => {
            exportBtn.disabled = pivotLayers.length === 0;
        };
        
        // Initial state
        updateExportButton();
        
        // Update when pivots change
        const originalSelectPivot = window.selectPivot;
        window.selectPivot = function(pivotData) {
            originalSelectPivot(pivotData);
            updateExportButton();
        };
    }
});