// src/rules/schedulingRules.js

export const generateSchedule = (residents, rotations, selectedSet) => {
    console.log('Starting generateSchedule');
    console.log('Residents:', residents);
    console.log('Rotations:', rotations);
    console.log('Selected Set:', selectedSet);
  
    try {
      if (!residents || !Array.isArray(residents)) throw new Error('Invalid residents input');
      if (!rotations || !rotations[selectedSet]) throw new Error('Invalid rotations or selectedSet');
  
      console.log('Generating schedule for', residents.length, 'residents');
      const numBlocks = 26;
      const indexedResidents = residents.map((r, i) => ({ ...r, index: i }));
      const schedule = indexedResidents.map(() => Array(numBlocks).fill(null));
      const mandatoryRotations = rotations[selectedSet].filter(r => r.included && r.mandatory);
      const nonMandatoryRotations = rotations[selectedSet].filter(r => r.included && !r.mandatory);
  
      console.log('Mandatory Rotations:', mandatoryRotations);
      console.log('Non-Mandatory Rotations:', nonMandatoryRotations);
  
      const ambulatoryRotation = { name: 'Ambulatory', included: true, mandatory: true, requiredPerBlock: 1, type: 'minMax', min: 1, max: 1 };
      if (!rotations[selectedSet].some(r => r.name === 'Ambulatory')) {
        rotations[selectedSet].push(ambulatoryRotation);
        mandatoryRotations.push(ambulatoryRotation);
      }
  
      // Step 1: Assign Ambulatory
      console.log('Assigning Ambulatory');
      assignAmbulatory(schedule, indexedResidents);
  
      // Step 2: Assign Vacations
      console.log('Assigning Vacations');
      assignVacations(schedule, indexedResidents);
  
      // Step 3: Assign rotations using a structured approach
      console.log('Assigning Rotations');
      return assignRotationsStructured(schedule, indexedResidents, mandatoryRotations, nonMandatoryRotations);
    } catch (error) {
      console.error('Error in generateSchedule:', error);
      throw error;
    }
  };
  
  const assignAmbulatory = (schedule, residents) => {
    const groupCycle = [2, 3, 4, 5, 1]; // Start with group 2
    for (let block = 2; block <= 25; block++) {
      const groupIndex = (block - 2) % 5;
      const group = groupCycle[groupIndex];
      const groupResidents = residents.filter(r => r.group === group);
      groupResidents.forEach(resident => {
        if (!schedule[resident.index][block - 1]) {
          schedule[resident.index][block - 1] = 'Ambulatory';
        }
      });
      console.log(`Block ${block}: Assigned Ambulatory to ${groupResidents.length} Group ${group} residents`);
    }
  };
  
  const assignVacations = (schedule, residents) => {
    residents.forEach((resident, i) => {
      let v1 = resident.vacation1 - 1;
      let v2 = resident.vacation2 - 1;
      if (schedule[i][v1]) v1 = findNextFreeBlock(schedule[i], v1);
      if (schedule[i][v2]) v2 = findNextFreeBlock(schedule[i], v2);
      schedule[i][v1] = 'Vacation';
      schedule[i][v2] = 'Vacation';
    });
  };
  
  const findNextFreeBlock = (row, start) => {
    for (let i = start + 1; i < 26; i++) if (!row[i]) return i;
    for (let i = 0; i < start; i++) if (!row[i]) return i;
    return start;
  };
  
  const assignRotationsStructured = (schedule, residents, mandatoryRotations, nonMandatoryRotations) => {
    console.log('Starting assignRotationsStructured');
    const numBlocks = 26;
    const numResidents = residents.length;
    const vacationRotation = { name: 'Vacation', included: true, mandatory: true, requiredPerBlock: 0, type: 'minMax', min: 2, max: 2 };
    const allRotations = [...mandatoryRotations, ...nonMandatoryRotations, vacationRotation];
    const rotationCounts = schedule.map(() => ({}));
  
    // Initialize rotation counts
    schedule.forEach((row, i) => {
      rotationCounts[i] = {};
      allRotations.forEach(r => {
        rotationCounts[i][r.name] = row.filter(block => block === r.name).length;
      });
    });
  
    // Phase 1: Assign mandatory rotations block by block
    for (let block = 0; block < numBlocks; block++) {
      console.log(`Processing block ${block + 1}`);
      mandatoryRotations.forEach(rotation => {
        if (rotation.name === 'Ambulatory' || rotation.name === 'Vacation') return;
        let assignedInBlock = schedule.reduce((count, row) => count + (row[block] === rotation.name ? 1 : 0), 0);
        console.log(`Block ${block + 1}: Assigning ${rotation.name}, required: ${rotation.requiredPerBlock}, currently assigned: ${assignedInBlock}`);
        
        let residentIndex = 0;
        let attempts = 0;
        const maxAttempts = numResidents * 2; // Safeguard against infinite loops
        while (assignedInBlock < rotation.requiredPerBlock && attempts < maxAttempts) {
          if (!schedule[residentIndex][block] && checkNightAndUnitConstraintsForAssignment(schedule[residentIndex], block, rotation.name)) {
            const tempSchedule = [...schedule[residentIndex]];
            tempSchedule[block] = rotation.name;
            if (checkRotationLimits(tempSchedule, rotation, false)) {
              schedule[residentIndex][block] = rotation.name;
              rotationCounts[residentIndex][rotation.name] = (rotationCounts[residentIndex][rotation.name] || 0) + 1;
              assignedInBlock++;
            }
          }
          residentIndex = (residentIndex + 1) % numResidents;
          attempts++;
        }
  
        if (attempts >= maxAttempts && assignedInBlock < rotation.requiredPerBlock) {
          console.warn(`Block ${block + 1}: Could not assign enough ${rotation.name}, only assigned ${assignedInBlock}/${rotation.requiredPerBlock}`);
          // Force assignment by overwriting non-mandatory slots
          for (let r = 0; r < numResidents && assignedInBlock < rotation.requiredPerBlock; r++) {
            if (schedule[r][block] && schedule[r][block] !== 'Ambulatory' && schedule[r][block] !== 'Vacation' && !mandatoryRotations.some(mr => mr.name === schedule[r][block])) {
              const oldRotation = schedule[r][block];
              schedule[r][block] = rotation.name;
              rotationCounts[r][oldRotation]--;
              rotationCounts[r][rotation.name] = (rotationCounts[r][rotation.name] || 0) + 1;
              assignedInBlock++;
            }
          }
        }
      });
    }
  
    // Phase 2: Ensure minimum mandatory rotations per resident
    console.log('Ensuring minimum mandatory rotations');
    mandatoryRotations.forEach(rotation => {
      if (rotation.type === 'minMax' && rotation.min > 0) {
        residents.forEach((_, r) => {
          let currentCount = rotationCounts[r][rotation.name] || 0;
          if (currentCount < rotation.min) {
            for (let b = 0; b < numBlocks && currentCount < rotation.min; b++) {
              if (schedule[r][b] && schedule[r][b] !== 'Ambulatory' && schedule[r][b] !== 'Vacation' && !mandatoryRotations.some(mr => mr.name === schedule[r][b])) {
                const oldRotation = schedule[r][b];
                schedule[r][b] = rotation.name;
                rotationCounts[r][oldRotation]--;
                rotationCounts[r][rotation.name] = (rotationCounts[r][rotation.name] || 0) + 1;
                currentCount++;
              }
            }
          }
        });
      }
    });
  
    // Phase 3: Assign non-mandatory rotations to meet exact requirements
    console.log('Assigning non-mandatory rotations');
    nonMandatoryRotations.forEach(rotation => {
      if (rotation.type === 'exact') {
        const exactCount = rotation.exact || 0;
        residents.forEach((_, r) => {
          let currentCount = rotationCounts[r][rotation.name] || 0;
          for (let b = 0; b < numBlocks && currentCount < exactCount; b++) {
            if (!schedule[r][b]) {
              schedule[r][b] = rotation.name;
              rotationCounts[r][rotation.name] = (rotationCounts[r][rotation.name] || 0) + 1;
              currentCount++;
            }
          }
        });
      }
    });
  
    // Phase 4: Fill remaining slots with non-mandatory rotations
    console.log('Filling remaining slots');
    for (let r = 0; r < numResidents; r++) {
      for (let b = 0; b < numBlocks; b++) {
        if (!schedule[r][b]) {
          const availableRotations = nonMandatoryRotations.filter(rotation => {
            const tempSchedule = [...schedule[r]];
            tempSchedule[b] = rotation.name;
            return checkRotationLimits(tempSchedule, rotation, false);
          });
          if (availableRotations.length > 0) {
            const rotation = availableRotations[Math.floor(Math.random() * availableRotations.length)];
            schedule[r][b] = rotation.name;
            rotationCounts[r][rotation.name] = (rotationCounts[r][rotation.name] || 0) + 1;
          }
        }
      }
    }
  
    // Phase 5: Validate min/max constraints
    console.log('Validating rotation limits');
    validateRotationLimits(schedule, rotationCounts, allRotations, residents);
  
    // Phase 6: Final balancing
    console.log('Balancing rotations');
    balanceRotations(schedule, rotationCounts);
  
    console.log('Finished assignRotationsStructured');
    return schedule;
  };
  
  const checkNightAndUnitConstraintsForAssignment = (scheduleRow, blockIndex, rotationName) => {
    const nightRotations = ['NF', 'ICU Night', 'CCU Night'];
    const unitRotations = ['ICU Day', 'CCU Day'];
    const allowedAfterNight = ['Elective', 'ID', 'ED', 'Geriatrics', 'Ambulatory', null, 'Vacation'];
  
    const prev = blockIndex > 0 ? scheduleRow[blockIndex - 1] : null;
    const next = blockIndex < 25 ? scheduleRow[blockIndex + 1] : null;
  
    if (nightRotations.includes(rotationName)) {
      if (nightRotations.includes(prev)) return false;
      if (next && !allowedAfterNight.includes(next)) return false;
    }
    if (unitRotations.includes(rotationName) && unitRotations.includes(prev)) return false;
    if (nightRotations.includes(prev) && !allowedAfterNight.includes(rotationName)) return false;
    return true;
  };
  
  const validateRotationLimits = (schedule, rotationCounts, allRotations, residents) => {
    const numBlocks = 26;
    const numResidents = residents.length;
  
    allRotations.forEach(rotation => {
      if (rotation.type === 'minMax') {
        const min = rotation.min || 0;
        const max = rotation.max || Infinity;
        residents.forEach((_, r) => {
          let count = rotationCounts[r][rotation.name] || 0;
          // Fix min
          while (count < min) {
            for (let b = 0; b < numBlocks; b++) {
              if (schedule[r][b] && schedule[r][b] !== 'Ambulatory' && schedule[r][b] !== 'Vacation' && !allRotations.some(rot => rot.mandatory === true && rot.name === schedule[r][b])) {
                const oldRotation = schedule[r][b];
                schedule[r][b] = rotation.name;
                rotationCounts[r][oldRotation]--;
                rotationCounts[r][rotation.name] = (rotationCounts[r][rotation.name] || 0) + 1;
                count++;
                break;
              }
            }
          }
          // Fix max
          while (count > max) {
            for (let b = 0; b < numBlocks; b++) {
              if (schedule[r][b] === rotation.name) {
                schedule[r][b] = null;
                rotationCounts[r][rotation.name]--;
                count--;
                break;
              }
            }
          }
        });
      }
    });
  };
  
  const balanceRotations = (schedule, rotationCounts) => {
    const numBlocks = 26;
    const numResidents = schedule.length;
    const rotationGroups = {
      unitDays: ['ICU Day', 'CCU Day'],
      nights: ['NF', 'ICU Night', 'CCU Night'],
      floors: ['Team A', 'Team B', 'IMP'],
    };
  
    const counts = schedule.map((row, r) => ({
      unitDays: row.filter(block => rotationGroups.unitDays.includes(block)).length,
      nights: row.filter(block => rotationGroups.nights.includes(block)).length,
      floors: row.filter(block => rotationGroups.floors.includes(block)).length,
    }));
  
    let iterations = 0;
    const maxIterations = 1000;
    let improved = true;
  
    while (improved && iterations < maxIterations) {
      improved = false;
      for (let r1 = 0; r1 < numResidents; r1++) {
        for (let r2 = r1 + 1; r2 < numResidents; r2++) {
          for (let b = 0; b < numBlocks; b++) {
            const val1 = schedule[r1][b];
            const val2 = schedule[r2][b];
            if (val1 && val2 && val1 !== 'Ambulatory' && val1 !== 'Vacation' && val2 !== 'Ambulatory' && val2 !== 'Vacation') {
              schedule[r1][b] = val2;
              schedule[r2][b] = val1;
              const newCounts = schedule.map((row, r) => ({
                unitDays: row.filter(block => rotationGroups.unitDays.includes(block)).length,
                nights: row.filter(block => rotationGroups.nights.includes(block)).length,
                floors: row.filter(block => rotationGroups.floors.includes(block)).length,
              }));
              const oldDiff = Math.max(
                Math.max(...counts.map(c => c.unitDays)) - Math.min(...counts.map(c => c.unitDays)),
                Math.max(...counts.map(c => c.nights)) - Math.min(...counts.map(c => c.nights)),
                Math.max(...counts.map(c => c.floors)) - Math.min(...counts.map(c => c.floors))
              );
              const newDiff = Math.max(
                Math.max(...newCounts.map(c => c.unitDays)) - Math.min(...newCounts.map(c => c.unitDays)),
                Math.max(...newCounts.map(c => c.nights)) - Math.min(...newCounts.map(c => c.nights)),
                Math.max(...newCounts.map(c => c.floors)) - Math.min(...newCounts.map(c => c.floors))
              );
              if (newDiff < oldDiff && checkNightAndUnitConstraints(schedule[r1], b) && checkNightAndUnitConstraints(schedule[r2], b)) {
                rotationCounts[r1][val1]--;
                rotationCounts[r1][val2] = (rotationCounts[r1][val2] || 0) + 1;
                rotationCounts[r2][val2]--;
                rotationCounts[r2][val1] = (rotationCounts[r2][val1] || 0) + 1;
                counts[r1] = newCounts[r1];
                counts[r2] = newCounts[r2];
                improved = true;
              } else {
                schedule[r1][b] = val1;
                schedule[r2][b] = val2;
              }
            }
          }
        }
      }
      iterations++;
    }
  };
  
  export const checkRotationLimits = (residentSchedule, rotation, allowExceed = false) => {
    const count = residentSchedule.filter(block => block === rotation.name).length;
    if (rotation.type === 'minMax') {
      const min = rotation.min || 0;
      const max = rotation.max || Infinity;
      return count >= min && (allowExceed || count <= max);
    }
    return count === (rotation.exact || 0);
  };
  
  export const checkNightAndUnitConstraints = (scheduleRow, blockIndex) => {
    const nightRotations = ['NF', 'ICU Night', 'CCU Night'];
    const unitRotations = ['ICU Day', 'CCU Day'];
    const allowedAfterNight = ['Elective', 'ID', 'ED', 'Geriatrics', 'Ambulatory', null, 'Vacation'];
  
    const current = scheduleRow[blockIndex];
    const prev = blockIndex > 0 ? scheduleRow[blockIndex - 1] : null;
    const next = blockIndex < 25 ? scheduleRow[blockIndex + 1] : null;
  
    if (nightRotations.includes(current)) {
      if (nightRotations.includes(prev)) return false;
      if (next && !allowedAfterNight.includes(next)) return false;
    }
    if (unitRotations.includes(current) && unitRotations.includes(prev)) return false;
    return true;
  };