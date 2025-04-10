// src/utils/electiveFill.js (example adjustment)
export const fillElectives = (residents, rotations, currentSchedule, rotationCounts) => {
    const schedule = { ...currentSchedule };
    const updatedRotationCounts = { ...rotationCounts };
  
    residents.forEach((resident) => {
      for (let block = 1; block < 25; block++) { // Blocks 2-25 (1-based indexing adjusted)
        if (schedule[resident.name][block] === '-') {
          schedule[resident.name][block] = 'Elective';
          updatedRotationCounts[resident.name]['Elective'] =
            (updatedRotationCounts[resident.name]['Elective'] || 0) + 1;
        }
      }
    });
  
    return { schedule, rotationCounts: updatedRotationCounts };
  };