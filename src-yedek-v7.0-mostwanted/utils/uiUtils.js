// src/utils/uiUtils.js

// Generate block starting dates (assuming 2-week blocks starting July 1, 2025)
export const getBlockDates = () => {
    const startDate = new Date('2025-07-01');
    const blockDates = [];
    for (let i = 0; i < 26; i++) {
      const blockStart = new Date(startDate);
      blockStart.setDate(startDate.getDate() + i * 14); // 14 days per block
      blockDates.push(blockStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return blockDates; // e.g., ["Jul 1", "Jul 14", "Jul 28", ...]
  };
  
  // Generate a random light color
  const generateLightColor = () => {
    const r = Math.floor(Math.random() * 56) + 200; // 200-255 for light red
    const g = Math.floor(Math.random() * 56) + 200; // 200-255 for light green
    const b = Math.floor(Math.random() * 56) + 200; // 200-255 for light blue
    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`; // e.g., "#e6f3ff"
  };
  
  // Assign random light colors to rotations dynamically
  export const getRotationColors = (rotations) => {
    const colorMap = {
      '-': '#ffffff',         // White for empty
      'Vacation': '#fff0f0',  // Light red for Vacation (fixed)
      'Ambulatory': '#e6f3ff' // Light blue for Ambulatory (fixed)
    };
    // Ensure rotations is an array and has name properties
    if (Array.isArray(rotations)) {
      rotations.forEach((rotation) => {
        if (rotation && typeof rotation === 'object' && rotation.name && !colorMap[rotation.name]) {
          colorMap[rotation.name] = generateLightColor();
        }
      });
    }
    return colorMap;
  };