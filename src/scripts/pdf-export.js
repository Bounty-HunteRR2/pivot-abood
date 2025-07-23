// PDF export functionality - Simplified approach with basic shapes

async function exportToPDF() {
    try {
        showNotification('Generating PDF...', 'info');
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        // Page dimensions for landscape A4
        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 15;
        
        // Check if there's content to export
        if (pivotLayers.length === 0 && !landPolygon) {
            showNotification('No content to export', 'error');
            return;
        }
        
        // Calculate bounds for all content
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;
        
        // Include land polygon bounds
        if (landPolygon) {
            const coords = landPolygon.getLayers()[0].getLatLngs()[0];
            coords.forEach(coord => {
                minLat = Math.min(minLat, coord.lat);
                maxLat = Math.max(maxLat, coord.lat);
                minLng = Math.min(minLng, coord.lng);
                maxLng = Math.max(maxLng, coord.lng);
            });
        }
        
        // Include pivot bounds
        pivotLayers.forEach(pivot => {
            const lat = pivot.center.lat;
            const lng = pivot.center.lng;
            const radiusInDegrees = pivot.radius / 111000; // Approximate conversion
            
            minLat = Math.min(minLat, lat - radiusInDegrees);
            maxLat = Math.max(maxLat, lat + radiusInDegrees);
            minLng = Math.min(minLng, lng - radiusInDegrees);
            maxLng = Math.max(maxLng, lng + radiusInDegrees);
        });
        
        // Add padding
        const latPadding = (maxLat - minLat) * 0.1;
        const lngPadding = (maxLng - minLng) * 0.1;
        minLat -= latPadding;
        maxLat += latPadding;
        minLng -= lngPadding;
        maxLng += lngPadding;
        
        // Calculate scale to fit content
        const contentWidth = pageWidth - (2 * margin);
        const contentHeight = pageHeight - (2 * margin);
        
        const latRange = maxLat - minLat;
        const lngRange = maxLng - minLng;
        
        const scaleX = contentWidth / lngRange;
        const scaleY = contentHeight / latRange;
        const scale = Math.min(scaleX, scaleY);
        
        // Center the content
        const actualWidth = lngRange * scale;
        const actualHeight = latRange * scale;
        const offsetX = margin + (contentWidth - actualWidth) / 2;
        const offsetY = margin + (contentHeight - actualHeight) / 2;
        
        // Coordinate conversion functions
        const latLngToPDF = (lat, lng) => {
            const x = offsetX + (lng - minLng) * scale;
            const y = offsetY + (maxLat - lat) * scale; // Flip Y axis
            return { x, y };
        };
        
        // Set white background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Draw land polygon if exists - using simple lines
        if (landPolygon) {
            const coords = landPolygon.getLayers()[0].getLatLngs()[0];
            doc.setDrawColor(139, 69, 19); // Brown color for land boundary
            doc.setLineWidth(0.5);
            
            // Draw polygon as individual lines
            for (let i = 0; i < coords.length; i++) {
                const start = latLngToPDF(coords[i].lat, coords[i].lng);
                const end = latLngToPDF(coords[(i + 1) % coords.length].lat, coords[(i + 1) % coords.length].lng);
                doc.line(start.x, start.y, end.x, end.y);
            }
        }
        
        // Draw each pivot
        pivotLayers.forEach(pivot => {
            const center = latLngToPDF(pivot.center.lat, pivot.center.lng);
            const radiusInPDF = (pivot.radius / 111000) * scale;
            
            // Set green fill color
            doc.setFillColor(34, 139, 34); // Forest green
            doc.setDrawColor(34, 139, 34);
            doc.setLineWidth(0.3);
            
            if (pivot.type === 'circle') {
                // Draw filled circle with gradient effect
                const gradientSteps = 8;
                for (let i = gradientSteps; i > 0; i--) {
                    const gradientRadius = radiusInPDF * (i / gradientSteps);
                    // Create gradient from dark to light green
                    const greenValue = 139 + (60 * ((gradientSteps - i) / gradientSteps));
                    doc.setFillColor(34, greenValue, 34);
                    doc.circle(center.x, center.y, gradientRadius, 'F');
                }
            } else {
                // Draw semi-circle with gradient effect
                // Fix angle transformation from app coordinates to PDF coordinates
                // App: 0° = North, 90° = East, 180° = South, 270° = West
                // PDF: 0° = East (right), 90° = South (down), 180° = West (left), 270° = North (up)
                // Transform: PDF_angle = App_angle - 90
                const startAnglePDF = pivot.startAngle - 90;
                const endAnglePDF = pivot.endAngle - 90;
                
                // Draw gradient layers
                const gradientSteps = 8;
                for (let g = gradientSteps; g > 0; g--) {
                    const gradientRadius = radiusInPDF * (g / gradientSteps);
                    const greenValue = 139 + (60 * ((gradientSteps - g) / gradientSteps));
                    doc.setFillColor(34, greenValue, 34);
                    
                    // Draw arc using lines method
                    const arcPoints = 60; // More points for smoother arc
                    const arcSpan = calculateArcSpan(pivot.startAngle, pivot.endAngle);
                    
                    // Start from center
                    const path = [[center.x, center.y]];
                    
                    // Add arc points
                    for (let i = 0; i <= arcPoints; i++) {
                        let angle;
                        if (pivot.endAngle < pivot.startAngle) {
                            // Boundary crossing case
                            const progress = i / arcPoints;
                            const totalSpan = (360 - pivot.startAngle) + pivot.endAngle;
                            let angleOffset = progress * totalSpan;
                            angle = pivot.startAngle + angleOffset;
                            if (angle >= 360) angle -= 360;
                        } else {
                            // Normal case
                            angle = pivot.startAngle + (i / arcPoints) * arcSpan;
                        }
                        
                        // Convert to PDF coordinates
                        const pdfAngle = (angle - 90) * Math.PI / 180;
                        const x = center.x + gradientRadius * Math.cos(pdfAngle);
                        const y = center.y + gradientRadius * Math.sin(pdfAngle);
                        path.push([x, y]);
                    }
                    
                    // Close path back to center
                    path.push([center.x, center.y]);
                    
                    // Draw filled polygon
                    doc.setFillColor(34, greenValue, 34);
                    const lineSegments = [];
                    for (let i = 1; i < path.length; i++) {
                        lineSegments.push([path[i][0] - path[i-1][0], path[i][1] - path[i-1][1]]);
                    }
                    doc.lines(lineSegments, path[0][0], path[0][1], [1, 1], 'F');
                }
            }
            
            // Draw towers if present
            if (pivot.towers && pivot.towers.length > 0) {
                doc.setDrawColor(46, 125, 50); // Nice green for tower circles
                doc.setLineWidth(0.3);
                
                pivot.towers.forEach((tower, index) => {
                    const towerRadiusInPDF = (tower.data.distance / 111000) * scale;
                    
                    if (pivot.type === 'circle') {
                        // Draw tower circle
                        doc.circle(center.x, center.y, towerRadiusInPDF, 'S');
                    } else {
                        // Draw tower arc for semi-circle
                        // Use multiple small lines to create arc
                        const arcPoints = 30;
                        const arcSpan = calculateArcSpan(pivot.startAngle, pivot.endAngle);
                        
                        for (let i = 0; i < arcPoints; i++) {
                            // Calculate angles properly handling boundary crossing
                            let angle1, angle2;
                            if (pivot.endAngle < pivot.startAngle) {
                                // Boundary crossing case
                                const progress1 = i / arcPoints;
                                const progress2 = (i + 1) / arcPoints;
                                const totalSpan = (360 - pivot.startAngle) + pivot.endAngle;
                                
                                let angleOffset1 = progress1 * totalSpan;
                                angle1 = pivot.startAngle + angleOffset1;
                                if (angle1 >= 360) angle1 -= 360;
                                
                                let angleOffset2 = progress2 * totalSpan;
                                angle2 = pivot.startAngle + angleOffset2;
                                if (angle2 >= 360) angle2 -= 360;
                            } else {
                                // Normal case
                                angle1 = pivot.startAngle + (i / arcPoints) * arcSpan;
                                angle2 = pivot.startAngle + ((i + 1) / arcPoints) * arcSpan;
                            }
                            
                            // Convert to PDF coordinates
                            const pdfAngle1 = (angle1 - 90) * Math.PI / 180;
                            const pdfAngle2 = (angle2 - 90) * Math.PI / 180;
                            
                            const x1 = center.x + towerRadiusInPDF * Math.cos(pdfAngle1);
                            const y1 = center.y + towerRadiusInPDF * Math.sin(pdfAngle1);
                            const x2 = center.x + towerRadiusInPDF * Math.cos(pdfAngle2);
                            const y2 = center.y + towerRadiusInPDF * Math.sin(pdfAngle2);
                            
                            doc.line(x1, y1, x2, y2);
                        }
                    }
                    
                    // Add tower distance label
                    const labelAngle = pivot.type === 'circle' ? 0 : 
                        calculateMiddleAngle(pivot.startAngle, pivot.endAngle) * Math.PI / 180 - Math.PI/2;
                    
                    const labelRadius = index === 0 ? towerRadiusInPDF / 2 : 
                        towerRadiusInPDF - ((tower.data.spacing / 111000) * scale / 2);
                    
                    const labelX = center.x + labelRadius * Math.cos(labelAngle);
                    const labelY = center.y + labelRadius * Math.sin(labelAngle);
                    
                    // Draw label in black
                    const labelText = `${tower.data.spacing.toFixed(0)}m`;
                    doc.setFontSize(7);
                    doc.setTextColor(0, 0, 0); // Black text
                    doc.text(labelText, labelX, labelY, { align: 'center' });
                });
            }
            
            // Add pivot information directly on pivot
            const info = [];
            info.push(`R: ${pivot.radius}m`);
            info.push(`A: ${pivot.area ? pivot.area.toFixed(1) : '0.0'} ha`);
            
            if (pivot.specifications.flowRate > 0) {
                info.push(`${pivot.specifications.flowRate} m³/h`);
            }
            if (pivot.specifications.power > 0) {
                info.push(`${pivot.specifications.power} kW`);
            }
            
            // Position text
            let textX = center.x;
            let textY = center.y;
            
            // For semi-circles, position in the middle of the arc
            if (pivot.type === 'semicircle') {
                const midAngle = calculateMiddleAngle(pivot.startAngle, pivot.endAngle) * Math.PI / 180 - Math.PI/2;
                textX = center.x + (radiusInPDF * 0.5) * Math.cos(midAngle);
                textY = center.y + (radiusInPDF * 0.5) * Math.sin(midAngle);
            }
            
            // Draw text in black
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0); // Black text
            const lineHeight = 4.5;
            
            info.forEach((line, index) => {
                const y = textY + (index - info.length/2 + 0.5) * lineHeight;
                doc.text(line, textX, y, { align: 'center' });
            });
        });
        
        // Add title
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text('Center Pivot Irrigation Plan', pageWidth / 2, 10, { align: 'center' });
        
        // Add date
        doc.setFontSize(10);
        const today = new Date().toLocaleDateString();
        doc.text(today, pageWidth / 2, 15, { align: 'center' });
        
        // Add total area in bottom
        if (pivotLayers.length > 0) {
            const totalArea = calculateTotalArea();
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            doc.text(`Total Area: ${totalArea.toFixed(2)} ha (${pivotLayers.length} pivot${pivotLayers.length !== 1 ? 's' : ''})`, 
                     pageWidth / 2, pageHeight - 5, { align: 'center' });
        }
        
        // Save the PDF with timestamp to avoid caching
        const timestamp = new Date().getTime();
        const filename = `irrigation_plan_${new Date().toISOString().slice(0, 10)}_${timestamp}.pdf`;
        doc.save(filename);
        
        showNotification('PDF exported successfully', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Error generating PDF: ' + error.message, 'error');
    }
}

// Helper function to calculate middle angle for semi-circles
function calculateMiddleAngle(startAngle, endAngle) {
    if (endAngle >= startAngle) {
        return (startAngle + endAngle) / 2;
    } else {
        // Boundary crossing case
        const totalAngle = (360 - startAngle) + endAngle;
        let midAngle = startAngle + totalAngle / 2;
        if (midAngle >= 360) midAngle -= 360;
        return midAngle;
    }
}

// Helper function to calculate arc span
function calculateArcSpan(startAngle, endAngle) {
    if (endAngle >= startAngle) {
        return endAngle - startAngle;
    } else {
        return (360 - startAngle) + endAngle;
    }
}

// Add PDF export button handler
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportPdfBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToPDF);
        
        // Enable/disable button based on content
        const updateExportButton = () => {
            exportBtn.disabled = pivotLayers.length === 0 && !landPolygon;
        };
        
        // Initial state
        updateExportButton();
        
        // Update when pivots change
        const originalSelectPivot = window.selectPivot;
        window.selectPivot = function(pivotData) {
            originalSelectPivot(pivotData);
            updateExportButton();
        };
        
        // Also update when land polygon changes
        const originalImportLandPolygon = window.importLandPolygon;
        window.importLandPolygon = function(file) {
            originalImportLandPolygon(file);
            setTimeout(updateExportButton, 100);
        };
    }
});