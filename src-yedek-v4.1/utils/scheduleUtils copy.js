// src/utils/scheduleUtils.js
export const generateSchedule = (residents, rotations) => {
    const schedule = {};
    const rotationCounts = {};
  
    // Initialize schedule and counts
    residents.forEach((resident) => {
      schedule[resident.name] = Array(26).fill('-');
      rotationCounts[resident.name] = {};
    });
  
    // Step 1: Assign ambulatory rotations (Blocks 2-25) - Locked
    const ambulatoryRotation = 'Ambulatory';
    const groupCycle = [2, 3, 4, 5, 1];
    for (let block = 1; block < 25; block++) {
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
  
    // Step 2: Apply vacations (Locked)
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
          for (let i = availableBlocks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableBlocks[i], availableBlocks[j]] = [availableBlocks[j], availableBlocks[i]];
          }
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
              schedule[resident.name][block] === '-' &&
              currentCount < (rotation.max || Infinity)
            );
          });
          for (let i = availableResidents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableResidents[i], availableResidents[j]] = [availableResidents[j], availableResidents[i]];
          }
          const remaining = required - currentAssigned;
          const toAssign = availableResidents.slice(0, remaining);
          toAssign.forEach((resident) => {
            schedule[resident.name][block] = rotation.name;
            rotationCounts[resident.name][rotation.name] = (rotationCounts[resident.name][rotation.name] || 0) + 1;
          });
        } else if (currentAssigned > required) {
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
              schedule[resident.name][block] === '-' &&
              currentCount < (rotation.max || Infinity)
            );
          });
          for (let i = availableResidents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableResidents[i], availableResidents[j]] = [availableResidents[j], availableResidents[i]];
          }
          const remaining = required - currentAssigned;
          const toAssign = availableResidents.slice(0, remaining);
          toAssign.forEach((resident) => {
            schedule[resident.name][block] = rotation.name;
            rotationCounts[resident.name][rotation.name] = (rotationCounts[resident.name][rotation.name] || 0) + 1;
          });
        }
      });
    };
  
    // Step 6: Assign Non-Mandatory Rotations with Exact Constraints
    const nonMandatoryExactRotations = rotations.filter((r) => r.included && !r.mandatory && r.type === 'exact' && r.exact !== undefined);
    nonMandatoryExactRotations.forEach((rotation) => {
      const exactRequired = rotation.exact || 0;
      residents.forEach((resident) => {
        let assignmentsNeeded = exactRequired - (rotationCounts[resident.name][rotation.name] || 0);
        if (assignmentsNeeded > 0) {
          let availableBlocks = [];
          for (let block = 0; block < 26; block++) {
            const currentAssigned = residents.filter((r) => schedule[r.name][block] === rotation.name).length;
            if (schedule[resident.name][block] === '-' && currentAssigned === 0) {
              availableBlocks.push(block);
            }
          }
          for (let i = availableBlocks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableBlocks[i], availableBlocks[j]] = [availableBlocks[j], availableBlocks[i]];
          }
          for (let i = 0; i < assignmentsNeeded && i < availableBlocks.length; i++) {
            const block = availableBlocks[i];
            schedule[resident.name][block] = rotation.name;
            rotationCounts[resident.name][rotation.name] = (rotationCounts[resident.name][rotation.name] || 0) + 1;
          }
        }
      });
    });
  
    // Step 7: Apply Consecutive and Night Follow-Up Rules (With Mandatory Priority)
    const unitDayRotations = ['ICU Day', 'CCU Day'];
    const nightRotations = ['NF', 'ICU Night', 'CCU Night'];
    const preferredAfterNight = ['Ambulatory', '-', 'ED', 'ID', 'Elective', 'Geriatrics', 'Vacation'];
  
    residents.forEach((resident) => {
      for (let block = 0; block < 25; block++) {
        const current = schedule[resident.name][block];
        const next = schedule[resident.name][block + 1];
  
        // No consecutive unit day rotations (unless mandatory filling requires it)
        if (unitDayRotations.includes(current) && unitDayRotations.includes(next)) {
          const nextIsMandatory = mandatoryRotations.some((r) => r.name === next && residents.filter((r) => schedule[r.name][block + 1] === next).length < (r.requiredPerBlock || 1));
          if (!nextIsMandatory) {
            for (let swapBlock = block + 2; swapBlock < 26; swapBlock++) {
              const swapCandidate = schedule[resident.name][swapBlock];
              if (
                swapCandidate !== 'Ambulatory' &&
                swapCandidate !== 'Vacation' &&
                !unitDayRotations.includes(swapCandidate)
              ) {
                schedule[resident.name][block + 1] = swapCandidate;
                schedule[resident.name][swapBlock] = next;
                rotationCounts[resident.name][next]--;
                rotationCounts[resident.name][swapCandidate] = (rotationCounts[resident.name][swapCandidate] || 0) + 1;
                break;
              }
            }
          }
        }
  
        // No consecutive night rotations (unless mandatory filling requires it)
        if (nightRotations.includes(current) && nightRotations.includes(next)) {
          const nextIsMandatory = mandatoryRotations.some((r) => r.name === next && residents.filter((r) => schedule[r.name][block + 1] === next).length < (r.requiredPerBlock || 1));
          if (!nextIsMandatory) {
            for (let swapBlock = block + 2; swapBlock < 26; swapBlock++) {
              const swapCandidate = schedule[resident.name][swapBlock];
              if (
                swapCandidate !== 'Ambulatory' &&
                swapCandidate !== 'Vacation' &&
                !nightRotations.includes(swapCandidate)
              ) {
                schedule[resident.name][block + 1] = swapCandidate;
                schedule[resident.name][swapBlock] = next;
                rotationCounts[resident.name][next]--;
                rotationCounts[resident.name][swapCandidate] = (rotationCounts[resident.name][swapCandidate] || 0) + 1;
                break;
              }
            }
          }
        }
  
        // Night rotation follow-up rules (unless mandatory filling requires it)
        if (nightRotations.includes(current) && !preferredAfterNight.includes(next)) {
          const nextIsMandatory = mandatoryRotations.some((r) => r.name === next && residents.filter((r) => schedule[r.name][block + 1] === next).length < (r.requiredPerBlock || 1));
          if (!nextIsMandatory) {
            for (let swapBlock = block + 2; swapBlock < 26; swapBlock++) {
              const swapCandidate = schedule[resident.name][swapBlock];
              if (
                swapCandidate !== 'Ambulatory' &&
                swapCandidate !== 'Vacation' &&
                preferredAfterNight.includes(swapCandidate)
              ) {
                schedule[resident.name][block + 1] = swapCandidate;
                schedule[resident.name][swapBlock] = next;
                rotationCounts[resident.name][next]--;
                rotationCounts[resident.name][swapCandidate] = (rotationCounts[resident.name][swapCandidate] || 0) + 1;
                break;
              }
            }
          }
        }
      }
    });
  
    // Step 8: Fill Underfilled Mandatory Rotations (Override Night Rules if Needed)
    for (let block = 0; block < 26; block++) {
      mandatoryRotations.forEach((rotation) => {
        const required = rotation.requiredPerBlock || 1;
        const currentAssigned = residents.filter((r) => schedule[r.name][block] === rotation.name).length;
  
        if (currentAssigned < required) {
          // First attempt: Strict rules
          let availableResidents = residents.filter((resident) => {
            const currentCount = rotationCounts[resident.name][rotation.name] || 0;
            const prevBlock = block > 0 ? schedule[resident.name][block - 1] : null;
            const isValidBase = schedule[resident.name][block] === '-' && currentCount < (rotation.max || Infinity);
            const isNight = nightRotations.includes(rotation.name);
            const prevIsNight = prevBlock && nightRotations.includes(prevBlock);
            const followsNight = prevBlock && nightRotations.includes(prevBlock);
            const nightFollowUpValid = followsNight ? preferredAfterNight.includes(rotation.name) : true;
            const noConsecutiveUnit = unitDayRotations.includes(rotation.name) ? !unitDayRotations.includes(prevBlock) : true;
            const noConsecutiveNight = isNight ? !prevIsNight : true;
            return isValidBase && nightFollowUpValid && noConsecutiveUnit && noConsecutiveNight;
          });
  
          let remaining = required - currentAssigned;
          let toAssign = [];
  
          if (availableResidents.length < remaining) {
            // Override night follow-up rules if needed
            availableResidents = residents.filter((resident) => {
              const currentCount = rotationCounts[resident.name][rotation.name] || 0;
              const prevBlock = block > 0 ? schedule[resident.name][block - 1] : null;
              const isValidBase = schedule[resident.name][block] === '-' && currentCount < (rotation.max || Infinity);
              const isNight = nightRotations.includes(rotation.name);
              const prevIsNight = prevBlock && nightRotations.includes(prevBlock);
              const noConsecutiveUnit = unitDayRotations.includes(rotation.name) ? !unitDayRotations.includes(prevBlock) : true;
              const noConsecutiveNight = isNight ? !prevIsNight : true;
              return isValidBase && noConsecutiveUnit && noConsecutiveNight;
            });
          }
  
          for (let i = availableResidents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableResidents[i], availableResidents[j]] = [availableResidents[j], availableResidents[i]];
          }
          toAssign = availableResidents.slice(0, remaining);
          toAssign.forEach((resident) => {
            schedule[resident.name][block] = rotation.name;
            rotationCounts[resident.name][rotation.name] = (rotationCounts[resident.name][rotation.name] || 0) + 1;
          });
        }
      });
    };
  
    return schedule;
  };