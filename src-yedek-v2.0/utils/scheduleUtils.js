// src/utils/scheduleUtils.js
export const generateSchedule = (residents, rotations) => {
    const schedule = {};
    const rotationCounts = {}; // Track counts per resident for min/max constraints
  
    // Initialize schedule and counts
    residents.forEach((resident) => {
      schedule[resident.name] = Array(26).fill('-'); // 1-26 blocks
      rotationCounts[resident.name] = {};
    });
  
    // Define ambulatory rotation
    const ambulatoryRotation = rotations.find((r) => r.name === 'Ambulatory') ? 'Ambulatory' : 'Ambulatory';
  
    // Step 1: Assign ambulatory rotations (Blocks 2-25)
    const groupCycle = [2, 3, 4, 5, 1]; // Group order: 2, 3, 4, 5, 1
    for (let block = 1; block < 25; block++) { // Blocks 2-25 (0-based index 1-24)
      const blockNum = block + 1;
      const groupIndex = (block - 1) % 5;
      const assignedGroup = groupCycle[groupIndex];
  
      residents.forEach((resident) => {
        if (resident.group === assignedGroup && blockNum !== resident.vacation1 && blockNum !== resident.vacation2) {
          schedule[resident.name][block] = ambulatoryRotation;
          rotationCounts[resident.name][ambulatoryRotation] = (rotationCounts[resident.name][ambulatoryRotation] || 0) + 1;
        }
      });
    }
  
    // Step 2: Apply vacations (to ensure priority)
    residents.forEach((resident) => {
      if (resident.vacation1 <= 26) {
        schedule[resident.name][resident.vacation1 - 1] = 'Vacation';
      }
      if (resident.vacation2 <= 26) {
        schedule[resident.name][resident.vacation2 - 1] = 'Vacation';
      }
    });
  
    // Step 3: Assign mandatory rotations - First Pass (Minimums)
    const mandatoryRotations = rotations.filter((r) => r.included && r.mandatory);
    mandatoryRotations.forEach((rotation) => {
      const minRequired = rotation.min || 0;
      residents.forEach((resident) => {
        let assignmentsNeeded = minRequired - (rotationCounts[resident.name][rotation.name] || 0);
        if (assignmentsNeeded > 0) {
          let availableBlocks = [];
          for (let block = 0; block < 26; block++) {
            if (schedule[resident.name][block] === '-') {
              availableBlocks.push(block);
            }
          }
          // Shuffle blocks for randomness
          for (let i = availableBlocks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableBlocks[i], availableBlocks[j]] = [availableBlocks[j], availableBlocks[i]];
          }
          // Assign minimum required blocks
          for (let i = 0; i < assignmentsNeeded && i < availableBlocks.length; i++) {
            const block = availableBlocks[i];
            schedule[resident.name][block] = rotation.name;
            rotationCounts[resident.name][rotation.name] = (rotationCounts[resident.name][rotation.name] || 0) + 1;
          }
        }
      });
    });
  
    // Step 4: Assign mandatory rotations - Second Pass (Exact Filling)
    for (let block = 0; block < 26; block++) {
      mandatoryRotations.forEach((rotation) => {
        const required = rotation.requiredPerBlock || 1;
        const currentAssigned = residents.filter((r) => schedule[r.name][block] === rotation.name).length;
  
        if (currentAssigned < required) {
          let availableResidents = residents.filter((resident) => {
            const currentCount = rotationCounts[resident.name][rotation.name] || 0;
            return (
              schedule[resident.name][block] === '-' && // Free block
              currentCount < (rotation.max || Infinity) // Below max limit
            );
          });
  
          // Shuffle for randomness
          for (let i = availableResidents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableResidents[i], availableResidents[j]] = [availableResidents[j], availableResidents[i]];
          }
  
          // Assign exactly the remaining needed
          const remaining = required - currentAssigned;
          const toAssign = availableResidents.slice(0, remaining);
          toAssign.forEach((resident) => {
            schedule[resident.name][block] = rotation.name;
            rotationCounts[resident.name][rotation.name] = (rotationCounts[resident.name][rotation.name] || 0) + 1;
          });
        } else if (currentAssigned > required) {
          // Remove excess assignments
          let assignedResidents = residents.filter((r) => schedule[r.name][block] === rotation.name);
          const excess = currentAssigned - required;
          assignedResidents.slice(0, excess).forEach((resident) => {
            schedule[resident.name][block] = '-';
            rotationCounts[resident.name][rotation.name]--;
          });
        }
      });
    };
  
    // Step 5: Third Pass - Fill Underfilled Mandatory Rotations
    for (let block = 0; block < 26; block++) {
      mandatoryRotations.forEach((rotation) => {
        const required = rotation.requiredPerBlock || 1;
        const currentAssigned = residents.filter((r) => schedule[r.name][block] === rotation.name).length;
  
        if (currentAssigned < required) {
          let availableResidents = residents.filter((resident) => {
            const currentCount = rotationCounts[resident.name][rotation.name] || 0;
            return (
              schedule[resident.name][block] === '-' && // Free block
              currentCount < (rotation.max || Infinity) // Below max limit
            );
          });
  
          // Shuffle for randomness
          for (let i = availableResidents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableResidents[i], availableResidents[j]] = [availableResidents[j], availableResidents[i]];
          }
  
          // Assign exactly the remaining needed
          const remaining = required - currentAssigned;
          const toAssign = availableResidents.slice(0, remaining);
          toAssign.forEach((resident) => {
            schedule[resident.name][block] = rotation.name;
            rotationCounts[resident.name][rotation.name] = (rotationCounts[resident.name][rotation.name] || 0) + 1;
          });
        }
      });
    };
  
    return schedule; // { "Resident Name": ["NF", "Ambulatory", "-", "Vacation", ...] }
  };