// PDF export functionality

async function exportToPDF() {
    try {
        showNotification('Generating PDF...', 'info');
        
        // Create jsPDF instance (A4 portrait for better layout)
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4');
        
        // Page dimensions
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        
        // Set document properties
        doc.setProperties({
            title: 'Center Pivot Irrigation Plan',
            subject: 'Irrigation System Design',
            author: 'Center Pivot Irrigation Planning Tool',
            keywords: 'irrigation, pivot, agriculture',
            creator: 'Center Pivot Irrigation Planning Tool'
        });
        
        // Add header with border
        doc.setFillColor(44, 62, 80);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text('Center Pivot Irrigation Plan', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(12);
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}`, pageWidth / 2, 30, { align: 'center' });
        
        // Reset text color
        doc.setTextColor(0, 0, 0);
        
        // Capture map image with proper aspect ratio
        const mapContainer = document.getElementById('map');
        const mapRect = mapContainer.getBoundingClientRect();
        const aspectRatio = mapRect.width / mapRect.height;
        
        const canvas = await html2canvas(mapContainer, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: mapRect.width,
            height: mapRect.height
        });
        
        // Calculate map dimensions to fit page
        let imgWidth = contentWidth;
        let imgHeight = imgWidth / aspectRatio;
        
        // If image is too tall, scale based on height
        const maxHeight = 120;
        if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * aspectRatio;
        }
        
        // Center the image
        const imgX = (pageWidth - imgWidth) / 2;
        
        // Add map image
        const imgData = canvas.toDataURL('image/png', 0.8);
        doc.addImage(imgData, 'PNG', imgX, 50, imgWidth, imgHeight);
        
        // Calculate Y position for content
        let yPosition = 50 + imgHeight + 15;
        
        // Add specifications section with better formatting
        if (pivotLayers.length > 0) {
            // Section header
            doc.setFillColor(236, 240, 241);
            doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Pivot Specifications', margin + 5, yPosition);
            yPosition += 15;
            
            // Create table with autoTable-like layout
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            
            // Table headers
            const headers = ['Pivot Name', 'Type', 'Radius', 'Area', 'Towers'];
            const colWidths = [50, 35, 25, 25, 25];
            const startX = margin;
            
            // Header background
            doc.setFillColor(52, 152, 219);
            doc.rect(startX, yPosition - 5, contentWidth, 8, 'F');
            doc.setTextColor(255, 255, 255);
            
            let xPos = startX + 2;
            headers.forEach((header, i) => {
                doc.text(header, xPos, yPosition);
                xPos += colWidths[i];
            });
            
            yPosition += 10;
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            
            // Table rows
            pivotLayers.forEach((pivot, index) => {
                // Check for page break
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = margin;
                }
                
                // Alternate row colors
                if (index % 2 === 0) {
                    doc.setFillColor(248, 249, 250);
                    doc.rect(startX, yPosition - 5, contentWidth, 8, 'F');
                }
                
                // Row data
                xPos = startX + 2;
                const rowData = [
                    pivot.specifications.label,
                    pivot.type === 'circle' ? 'Circle' : 'Semi-Circle',
                    `${pivot.radius.toFixed(0)}m`,
                    `${pivot.area ? pivot.area.toFixed(2) : '0.00'}ha`,
                    pivot.towers ? pivot.towerCount.toString() : '-'
                ];
                
                rowData.forEach((data, i) => {
                    // Truncate long text
                    const maxWidth = colWidths[i] - 4;
                    let text = data.toString();
                    if (doc.getTextWidth(text) > maxWidth) {
                        while (doc.getTextWidth(text + '...') > maxWidth) {
                            text = text.slice(0, -1);
                        }
                        text += '...';
                    }
                    doc.text(text, xPos, yPosition);
                    xPos += colWidths[i];
                });
                
                yPosition += 8;
            });
            
            // Total area summary
            yPosition += 5;
            doc.setDrawColor(200, 200, 200);
            doc.line(startX, yPosition, startX + contentWidth, yPosition);
            yPosition += 8;
            
            const totalArea = calculateTotalArea();
            doc.setFont(undefined, 'bold');
            doc.setFontSize(11);
            doc.text(`Total Irrigated Area: ${totalArea.toFixed(2)} hectares`, startX, yPosition);
            
            // Add flow rate and power if available
            const totalFlow = pivotLayers.reduce((sum, p) => sum + (p.specifications.flowRate || 0), 0);
            const totalPower = pivotLayers.reduce((sum, p) => sum + (p.specifications.power || 0), 0);
            
            if (totalFlow > 0 || totalPower > 0) {
                yPosition += 8;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                if (totalFlow > 0) {
                    doc.text(`Total Flow Rate: ${totalFlow.toFixed(1)} m³/h`, startX, yPosition);
                    yPosition += 6;
                }
                if (totalPower > 0) {
                    doc.text(`Total Power: ${totalPower.toFixed(1)} kW`, startX, yPosition);
                }
            }
        }
        
        // Add tower details on new page if needed
        const pivotsWithTowers = pivotLayers.filter(p => p.towers && p.towers.length > 0);
        if (pivotsWithTowers.length > 0) {
            // Check if we need a new page
            if (yPosition > pageHeight - 80) {
                doc.addPage();
                yPosition = margin;
            } else {
                yPosition += 20;
            }
            
            // Tower section header
            doc.setFillColor(236, 240, 241);
            doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Tower Configuration Details', margin + 5, yPosition);
            yPosition += 15;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            pivotsWithTowers.forEach(pivot => {
                if (yPosition > pageHeight - 30) {
                    doc.addPage();
                    yPosition = margin;
                }
                
                // Pivot name
                doc.setFont(undefined, 'bold');
                doc.text(`${pivot.specifications.label}:`, margin, yPosition);
                yPosition += 6;
                
                // Tower details in grid format
                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                
                let towerLine = '';
                pivot.towers.forEach((tower, index) => {
                    const towerInfo = `T${tower.data.number}: ${tower.data.spacing.toFixed(1)}m`;
                    
                    if (index % 5 === 0 && index > 0) {
                        doc.text(towerLine, margin + 10, yPosition);
                        yPosition += 5;
                        towerLine = towerInfo;
                    } else {
                        towerLine += (index === 0 ? '' : '  |  ') + towerInfo;
                    }
                });
                
                if (towerLine) {
                    doc.text(towerLine, margin + 10, yPosition);
                    yPosition += 8;
                }
            });
        }
        
        // Add footer to all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text('Center Pivot Irrigation Planning Tool', margin, pageHeight - 10);
        }
        
        // Save the PDF
        const filename = `irrigation_plan_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        
        showNotification('PDF exported successfully', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Error generating PDF: ' + error.message, 'error');
    }
}

// Add PDF export button handler
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);
});