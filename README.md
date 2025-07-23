# Center Pivot Irrigation Planning Tool

A web-based application for designing and planning center pivot irrigation systems on agricultural land. Users can import land polygons, add irrigation circles/semi-circles, configure specifications, and export designs to Google Earth.

## Features

- **Land Import**: Import polygon files (KML, GeoJSON) to define field boundaries
- **Irrigation Design**: 
  - Add full circle pivot systems with adjustable radius
  - Add semi-circle pivot systems with adjustable radius and rotation
  - Drag and drop positioning
  - Real-time visual feedback
- **Calculations**:
  - Area calculation in hectares for circles
  - Arc length calculation in meters for semi-circles
  - Total irrigated area summary
- **Specifications**:
  - Custom labels for each pivot
  - Flow rate (m³/h)
  - Power consumption (kW)
  - Additional notes
- **Export**: Generate KML files compatible with Google Earth Web

## Usage

1. **Open the Application**: Open `index.html` in a modern web browser
2. **Import Land Boundary**: Click "Import Land Polygon" and select a KML or GeoJSON file
3. **Add Irrigation Systems**:
   - Click "Draw Circle Pivot" to add full circles
   - Click "Draw Semi-Circle Pivot" to add partial circles
   - Click on the map to place pivots
4. **Adjust Pivots**:
   - Click and drag resize handles to change radius
   - For semi-circles, drag the red handles to adjust rotation
5. **Add Specifications**:
   - Click on a pivot to select it
   - Fill in the specification form in the sidebar
   - Click "Save Specifications"
6. **Export Design**: Click "Export to KML" to download your design

## Keyboard Shortcuts

- `ESC`: Cancel current drawing mode
- `Delete`: Remove selected pivot

## Technical Details

- Built with HTML5, CSS3, and JavaScript
- Uses Leaflet.js for mapping functionality
- No server required - runs entirely in the browser
- Compatible with modern web browsers (Chrome, Firefox, Edge, Safari)

## File Structure

```
/
├── index.html              # Main application file
├── src/
│   ├── styles/
│   │   └── main.css       # Application styling
│   └── scripts/
│       ├── map.js         # Map initialization and management
│       ├── irrigation.js  # Pivot drawing and manipulation
│       ├── calculations.js # Area and length calculations
│       ├── export.js      # KML export functionality
│       └── app.js         # Main application logic
└── README.md             # This file
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

This project is provided as-is for agricultural planning purposes.