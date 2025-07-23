// KML export functionality

// Export all elements to KML
function exportToKML() {
    let kmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    kmlContent += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
    kmlContent += '  <Document>\n';
    kmlContent += '    <name>Center Pivot Irrigation Plan</name>\n';
    
    // Add styles
    kmlContent += generateKMLStyles();
    
    // Add land polygon if exists
    if (landPolygon) {
        kmlContent += generateLandPolygonKML();
    }
    
    // Add all pivots
    pivotLayers.forEach(pivot => {
        kmlContent += generatePivotKML(pivot);
    });
    
    kmlContent += '  </Document>\n';
    kmlContent += '</kml>';
    
    // Download the file
    downloadKML(kmlContent);
}

// Generate KML styles
function generateKMLStyles() {
    let styles = '';
    
    // Land polygon style
    styles += '    <Style id="landStyle">\n';
    styles += '      <LineStyle>\n';
    styles += '        <color>ff60ae27</color>\n'; // KML uses AABBGGRR format
    styles += '        <width>3</width>\n';
    styles += '      </LineStyle>\n';
    styles += '      <PolyStyle>\n';
    styles += '        <color>1a60ae27</color>\n';
    styles += '      </PolyStyle>\n';
    styles += '    </Style>\n';
    
    // Pivot circle style
    styles += '    <Style id="pivotStyle">\n';
    styles += '      <LineStyle>\n';
    styles += '        <color>ffdb9834</color>\n';
    styles += '        <width>2</width>\n';
    styles += '      </LineStyle>\n';
    styles += '      <PolyStyle>\n';
    styles += '        <color>33db9834</color>\n';
    styles += '      </PolyStyle>\n';
    styles += '    </Style>\n';
    
    // Label style
    styles += '    <Style id="labelStyle">\n';
    styles += '      <IconStyle>\n';
    styles += '        <scale>0</scale>\n'; // Hide icon
    styles += '      </IconStyle>\n';
    styles += '      <LabelStyle>\n';
    styles += '        <scale>1.2</scale>\n';
    styles += '      </LabelStyle>\n';
    styles += '    </Style>\n';
    
    // Tower style
    styles += '    <Style id="towerStyle">\n';
    styles += '      <LineStyle>\n';
    styles += '        <color>ff8d7f8c</color>\n'; // Gray color with transparency
    styles += '        <width>1</width>\n';
    styles += '      </LineStyle>\n';
    styles += '    </Style>\n';
    
    return styles;
}

// Generate KML for land polygon
function generateLandPolygonKML() {
    let kml = '    <Placemark>\n';
    kml += '      <name>Land Boundary</name>\n';
    kml += '      <styleUrl>#landStyle</styleUrl>\n';
    kml += '      <Polygon>\n';
    kml += '        <outerBoundaryIs>\n';
    kml += '          <LinearRing>\n';
    kml += '            <coordinates>\n';
    
    // Get coordinates from GeoJSON
    const coords = landPolygon.getLayers()[0].getLatLngs()[0];
    coords.forEach(coord => {
        kml += `              ${coord.lng},${coord.lat},0\n`;
    });
    
    kml += '            </coordinates>\n';
    kml += '          </LinearRing>\n';
    kml += '        </outerBoundaryIs>\n';
    kml += '      </Polygon>\n';
    kml += '    </Placemark>\n';
    
    return kml;
}

// Generate KML for a pivot
function generatePivotKML(pivot) {
    let kml = '';
    
    // Add pivot shape
    kml += '    <Placemark>\n';
    kml += `      <name>${pivot.specifications.label}</name>\n`;
    kml += '      <styleUrl>#pivotStyle</styleUrl>\n';
    
    // Add description with specifications
    kml += '      <description><![CDATA[\n';
    kml += `        Type: ${pivot.type === 'circle' ? 'Full Circle' : 'Semi-Circle'}<br>\n`;
    kml += `        Radius: ${pivot.radius.toFixed(1)} m<br>\n`;
    if (pivot.type === 'circle') {
        kml += `        Area: ${pivot.areaFormatted}<br>\n`;
    } else {
        kml += `        Arc Length: ${pivot.arcLengthFormatted}<br>\n`;
        kml += `        Area: ${pivot.areaFormatted}<br>\n`;
    }
    if (pivot.specifications.flowRate > 0) {
        kml += `        Flow Rate: ${pivot.specifications.flowRate} m³/h<br>\n`;
    }
    if (pivot.specifications.power > 0) {
        kml += `        Power: ${pivot.specifications.power} kW<br>\n`;
    }
    if (pivot.specifications.notes) {
        kml += `        Notes: ${pivot.specifications.notes}<br>\n`;
    }
    if (pivot.towers && pivot.towers.length > 0) {
        kml += `        Towers: ${pivot.towerCount}<br>\n`;
        kml += '        Tower Distances: ';
        pivot.towers.forEach((tower, index) => {
            if (index > 0) kml += ', ';
            kml += `${tower.data.spacing.toFixed(1)}m`;
        });
        kml += '<br>\n';
    }
    kml += '      ]]></description>\n';
    
    if (pivot.type === 'circle') {
        // Generate circle as polygon
        kml += '      <Polygon>\n';
        kml += '        <outerBoundaryIs>\n';
        kml += '          <LinearRing>\n';
        kml += '            <coordinates>\n';
        
        // Generate circle points
        for (let angle = 0; angle <= 360; angle += 10) {
            const radian = angle * Math.PI / 180;
            const lat = pivot.center.lat + (pivot.radius / 111000) * Math.sin(radian);
            const lng = pivot.center.lng + (pivot.radius / (111000 * Math.cos(pivot.center.lat * Math.PI / 180))) * Math.cos(radian);
            kml += `              ${lng},${lat},0\n`;
        }
        
        kml += '            </coordinates>\n';
        kml += '          </LinearRing>\n';
        kml += '        </outerBoundaryIs>\n';
        kml += '      </Polygon>\n';
    } else {
        // Generate semi-circle as polygon
        kml += '      <Polygon>\n';
        kml += '        <outerBoundaryIs>\n';
        kml += '          <LinearRing>\n';
        kml += '            <coordinates>\n';
        
        // Add center point
        kml += `              ${pivot.center.lng},${pivot.center.lat},0\n`;
        
        // Add arc points
        for (let angle = pivot.startAngle; angle <= pivot.endAngle; angle += 5) {
            const radian = angle * Math.PI / 180;
            const lat = pivot.center.lat + (pivot.radius / 111000) * Math.sin(radian);
            const lng = pivot.center.lng + (pivot.radius / (111000 * Math.cos(pivot.center.lat * Math.PI / 180))) * Math.cos(radian);
            kml += `              ${lng},${lat},0\n`;
        }
        
        // Close back to center
        kml += `              ${pivot.center.lng},${pivot.center.lat},0\n`;
        
        kml += '            </coordinates>\n';
        kml += '          </LinearRing>\n';
        kml += '        </outerBoundaryIs>\n';
        kml += '      </Polygon>\n';
    }
    
    kml += '    </Placemark>\n';
    
    // Add label as separate placemark
    kml += '    <Placemark>\n';
    kml += `      <name>${pivot.specifications.label}</name>\n`;
    kml += '      <styleUrl>#labelStyle</styleUrl>\n';
    kml += '      <Point>\n';
    kml += `        <coordinates>${pivot.center.lng},${pivot.center.lat},0</coordinates>\n`;
    kml += '      </Point>\n';
    kml += '    </Placemark>\n';
    
    // Add tower circles if present
    if (pivot.towers && pivot.towers.length > 0 && pivot.type === 'circle') {
        pivot.towers.forEach(tower => {
            kml += '    <Placemark>\n';
            kml += `      <name>Tower ${tower.data.number}</name>\n`;
            kml += '      <styleUrl>#towerStyle</styleUrl>\n';
            kml += '      <LineString>\n';
            kml += '        <coordinates>\n';
            
            // Generate tower circle points
            for (let angle = 0; angle <= 360; angle += 30) {
                const radian = angle * Math.PI / 180;
                const lat = pivot.center.lat + (tower.data.distance / 111000) * Math.sin(radian);
                const lng = pivot.center.lng + (tower.data.distance / (111000 * Math.cos(pivot.center.lat * Math.PI / 180))) * Math.cos(radian);
                kml += `          ${lng},${lat},0\n`;
            }
            
            kml += '        </coordinates>\n';
            kml += '      </LineString>\n';
            kml += '    </Placemark>\n';
        });
    }
    
    return kml;
}

// Download KML file
function downloadKML(content) {
    const blob = new Blob([content], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'irrigation_plan_' + new Date().toISOString().slice(0, 10) + '.kml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('KML file exported successfully', 'success');
}