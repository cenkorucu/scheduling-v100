// src/utils/assignResidentData.js
const predefinedVacations = [
    [9, 19], [7, 23], [10, 15], [5, 19], [11, 24], [13, 24], [15, 21], [9, 16],
    [14, 21], [11, 20], [6, 17], [12, 17], [10, 23], [8, 23], [20, 25], [7, 18], [13, 22], [16, 24], [8,18]
  ];
  
  export const assignResidentData = (names, existingResidents = []) => {
    // Track all vacation numbers in use (from existing residents + new ones)
    const vacationCount = {};
    existingResidents.forEach(res => {
      vacationCount[res.vacation1] = (vacationCount[res.vacation1] || 0) + 1;
      vacationCount[res.vacation2] = (vacationCount[res.vacation2] || 0) + 1;
    });
  
    const getAvailableVacationNumber = (min, max, excludeHigher = false) => {
      const available = [];
      for (let i = min; i <= max; i++) {
        if ((vacationCount[i] || 0) < 5) {
          if (!excludeHigher || i < excludeHigher) available.push(i);
        }
      }
      return available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : min; // Fallback to min if no available numbers
    };
  
    const newResidents = names.map((name, index) => {
      const group = Math.floor(index / 4) + 1;
      let vacation1, vacation2;
  
      // Use predefined vacations if available
      if (index < predefinedVacations.length) {
        const pair = predefinedVacations[index];
        vacation1 = pair[0];
        vacation2 = pair[1] || getAvailableVacationNumber(vacation1 + 4, 25); // For the last pair (14, ?)
      } else {
        // Random assignment for additional residents
        vacation1 = getAvailableVacationNumber(3, 25);
        const vacation2Min = Math.min(25, vacation1 + 4);
        vacation2 = getAvailableVacationNumber(vacation2Min, 25, vacation1);
      }
  
      // Update count
      vacationCount[vacation1] = (vacationCount[vacation1] || 0) + 1;
      vacationCount[vacation2] = (vacationCount[vacation2] || 0) + 1;
  
      return { name, group: Math.min(group, 5), vacation1, vacation2 };
    });
  
    return newResidents;
  };