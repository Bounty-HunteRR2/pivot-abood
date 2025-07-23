# Debug Help for Total Area Issues

If you see unexpected total area values:

1. **Check pivot count**: The display now shows "(X pivots)" to indicate how many pivots contribute to the total.

2. **View breakdown**: When multiple pivots exist, you'll see a breakdown of each pivot's area.

3. **Debug in console**: 
   - Press F12 to open browser console
   - Type: `debugPivotAreas()`
   - This will list all pivots and their areas

4. **Clear all pivots**: Use the "Clear All" button to remove all pivots and start fresh.

5. **Common causes**:
   - Multiple pivots on the map
   - Overlapping pivots at the same location
   - Previous pivots not properly deleted

The total area is the sum of ALL pivots on the map, not just the selected one.