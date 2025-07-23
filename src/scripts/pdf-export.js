// PDF export functionality

async function exportToPDF() {
    try {
        showNotification('Generating PDF...', 'info');
        
        // Create jsPDF instance
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        // Set document properties
        doc.setProperties({
            title: 'Center Pivot Irrigation Plan',
            subject: 'Irrigation System Design',
            author: 'Center Pivot Irrigation Planning Tool',
            keywords: 'irrigation, pivot, agriculture',
            creator: 'Center Pivot Irrigation Planning Tool'
        });
        
        // Add header
        doc.setFontSize(20);
        doc.setTextColor(44, 62, 80);
        doc.text('Center Pivot Irrigation Plan', 15, 20);
        
        // Add date
        doc.setFontSize(12);
        doc.setTextColor(127, 140, 141);
        const today = new Date().toLocaleDateString();
        doc.text(`Generated: ${today}`, 15, 30);
        
        // Capture map image
        const mapContainer = document.getElementById('map');
        const canvas = await html2canvas(mapContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // Add map image to PDF
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 267; // A4 landscape width minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 15, 40, imgWidth, Math.min(imgHeight, 120));
        
        // Calculate Y position for specifications table
        let yPosition = Math.min(imgHeight, 120) + 50;
        
        // Add specifications table
        if (pivotLayers.length > 0) {
            doc.setFontSize(16);
            doc.setTextColor(44, 62, 80);
            doc.text('Pivot Specifications', 15, yPosition);
            yPosition += 10;
            
            // Table headers
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            const headers = ['Pivot', 'Type', 'Radius (m)', 'Area (ha)', 'Towers', 'Flow Rate (m³/h)', 'Power (kW)'];
            const columnWidths = [35, 25, 25, 25, 20, 35, 25];
            let xPosition = 15;
            
            headers.forEach((header, index) => {
                doc.text(header, xPosition, yPosition);
                xPosition += columnWidths[index];
            });
            
            yPosition += 5;
            doc.line(15, yPosition, 282, yPosition); // Horizontal line
            yPosition += 5;
            
            // Table data
            doc.setFont(undefined, 'normal');
            pivotLayers.forEach(pivot => {
                xPosition = 15;
                
                // Check if we need a new page
                if (yPosition > 180) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                // Pivot data
                const rowData = [
                    pivot.specifications.label,
                    pivot.type === 'circle' ? 'Full Circle' : 'Semi-Circle',
                    pivot.radius.toFixed(0),
                    pivot.area ? pivot.area.toFixed(2) : '-',
                    pivot.towers ? pivot.towerCount.toString() : '-',
                    pivot.specifications.flowRate || '-',
                    pivot.specifications.power || '-'
                ];
                
                rowData.forEach((data, index) => {
                    doc.text(data.toString(), xPosition, yPosition);
                    xPosition += columnWidths[index];
                });
                
                yPosition += 7;
            });
            
            // Add total area
            yPosition += 5;
            doc.line(15, yPosition, 282, yPosition);
            yPosition += 8;
            
            const totalArea = calculateTotalArea();
            doc.setFont(undefined, 'bold');
            doc.text(`Total Irrigated Area: ${totalArea.toFixed(2)} hectares`, 15, yPosition);
        }
        
        // Add tower details if any pivot has towers
        const pivotsWithTowers = pivotLayers.filter(p => p.towers && p.towers.length > 0);
        if (pivotsWithTowers.length > 0) {
            yPosition += 15;
            
            // Check if we need a new page
            if (yPosition > 160) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.setFontSize(16);
            doc.setTextColor(44, 62, 80);
            doc.text('Tower Configuration', 15, yPosition);
            yPosition += 10;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            pivotsWithTowers.forEach(pivot => {
                if (yPosition > 170) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.setFont(undefined, 'bold');
                doc.text(`${pivot.specifications.label}:`, 15, yPosition);
                yPosition += 5;
                
                doc.setFont(undefined, 'normal');
                let towerText = 'Towers: ';
                pivot.towers.forEach((tower, index) => {
                    if (index > 0) towerText += ', ';
                    towerText += `T${tower.data.number} (${tower.data.spacing.toFixed(1)}m)`;
                });
                doc.text(towerText, 20, yPosition);
                yPosition += 7;
            });
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