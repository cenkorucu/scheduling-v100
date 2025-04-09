// src/utils/scheduleUtils.js
export const generateSchedule = (residents, rotations) => {
  const schedule = {};
  const rotationCounts = {};

  // Step 1: Initialization
  residents.forEach((resident) => {
    schedule[resident.name] = Array(26).fill('-');
    rotationCounts[resident.name] = {};
  });

  // Step 2: Assign Ambulatory Rotations (Locked, Blocks 2-25)
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

  // Step 3: Apply Vacations (Locked)
  residents.forEach((resident) => {
    if (resident.vacation1 <= 26) {
      schedule[resident.name][resident.vacation1 - 1] = 'Vacation';
    }
    if (resident.vacation2 <= 26) {
      schedule[resident.name][resident.vacation2 - 1] = 'Vacation';
    }
  });

  // Step 4: Assign Mandatory Rotations - First Pass (Minimums)
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

  // Step 5: Assign Non-Mandatory Rotations with Exact Constraints
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

  // Step 6: Assign Mandatory Rotations - Second Pass (Exact Filling)
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
        for (let i = assignedResidents.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [assignedResidents[i], assignedResidents[j]] = [assignedResidents[j], assignedResidents[i]];
        }
        const excess = currentAssigned - required;
        assignedResidents.slice(0, excess).forEach((resident) => {
          schedule[resident.name][block] = '-';
          rotationCounts[resident.name][rotation.name]--;
        });
      }
    });
  }

  // Step 7: Apply Consecutive and Night Follow-Up Rules
  const unitDayRotations = ['ICU Day', 'CCU Day'];
  const nightRotations = ['NF', 'ICU Night', 'CCU Night', 'MON'];
  const preferredAfterNight = ['Ambulatory', '-', 'ED', 'ID', 'Elective', 'Geriatrics', 'Vacation'];

  residents.forEach((resident) => {
    for (let block = 0; block < 25; block++) {
      const current = schedule[resident.name][block];
      const next = schedule[resident.name][block + 1];

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

  // Step 8: Third Pass - Fill Underfilled Mandatory Rotations
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
  }

    // Step 9: Limit Mandatory Rotations to Maximum Allowed
    mandatoryRotations.forEach((rotation) => {
    const maxAllowed = rotation.max || Infinity; // Use Infinity if no max is specified
    residents.forEach((resident) => {
      const currentCount = rotationCounts[resident.name][rotation.name] || 0;
      if (currentCount > maxAllowed) {
        let blocksWithRotation = [];
        for (let block = 0; block < 26; block++) {
          if (schedule[resident.name][block] === rotation.name) {
            blocksWithRotation.push(block);
          }
        }
        // Shuffle blocks for random removal
        for (let i = blocksWithRotation.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [blocksWithRotation[i], blocksWithRotation[j]] = [blocksWithRotation[j], blocksWithRotation[i]];
        }
        const excess = currentCount - maxAllowed;
        blocksWithRotation.slice(0, excess).forEach((block) => {
          schedule[resident.name][block] = '-';
          rotationCounts[resident.name][rotation.name]--;
        });
      }
    });
  });

  for (let iteration = 0; iteration < 3; iteration++) {
    mandatoryRotations.forEach((rotation) => {
      const maxAllowed = rotation.max || Infinity;
      residents.forEach((resident) => {
        const currentCount = rotationCounts[resident.name][rotation.name] || 0;
        if (currentCount > maxAllowed) {
          let blocksWithRotation = [];
          for (let block = 0; block < 26; block++) {
            if (schedule[resident.name][block] === rotation.name) {
              blocksWithRotation.push(block);
            }
          }
          for (let i = blocksWithRotation.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [blocksWithRotation[i], blocksWithRotation[j]] = [blocksWithRotation[j], blocksWithRotation[i]];
          }
          const excess = currentCount - maxAllowed;
          blocksWithRotation.slice(0, excess).forEach((block) => {
            schedule[resident.name][block] = '-';
            rotationCounts[resident.name][rotation.name]--;
          });
        }
      });
    });
  }
  
  // Step 10: Resolve Overfilled Mandatory Rotations per Block (Up to 5 Passes)
  for (let attempt = 0; attempt < 20; attempt++) {
    let changesMade = false;
  
    for (let block = 0; block < 26; block++) {
      let overfilledRotations = mandatoryRotations.filter((rotation) => {
        const required = rotation.requiredPerBlock || 1;
        const currentAssigned = residents.filter((r) => schedule[r.name][block] === rotation.name).length;
        return currentAssigned > required;
      });
  
      while (overfilledRotations.length > 0) {
        const rotation = overfilledRotations[0];
        const required = rotation.requiredPerBlock || 1;
        const currentAssigned = residents.filter((r) => schedule[r.name][block] === rotation.name).length;
        const excess = currentAssigned - required;
  
        let assignedResidents = residents.filter((r) => schedule[r.name][block] === rotation.name);
        let residentCounts = assignedResidents.map((resident) => ({
          resident,
          count: rotationCounts[resident.name][rotation.name] || 0,
        }));
  
        const maxCount = Math.max(...residentCounts.map((rc) => rc.count));
        let highestCountResidents = residentCounts.filter((rc) => rc.count === maxCount);
  
        for (let i = highestCountResidents.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [highestCountResidents[i], highestCountResidents[j]] = [highestCountResidents[j], highestCountResidents[i]];
        }
  
        highestCountResidents.slice(0, excess).forEach(({ resident }) => {
          schedule[resident.name][block] = '-';
          rotationCounts[resident.name][rotation.name]--;
          changesMade = true;
        });
  
        overfilledRotations = mandatoryRotations.filter((rotation) => {
          const required = rotation.requiredPerBlock || 1;
          const currentAssigned = residents.filter((r) => schedule[r.name][block] === rotation.name).length;
          return currentAssigned > required;
        });
      }
    }
  
    if (!changesMade) break;
  }

    
    // Step 11: Enforce Maximum Limits for Mandatory Rotations per Resident (Run 5 Cycles)
  for (let cycle = 0; cycle < 20; cycle++) {
    mandatoryRotations.forEach((rotation) => {
      const maxAllowed = rotation.max || Infinity; // Use Infinity if no max is specified
      residents.forEach((resident) => {
        const currentCount = rotationCounts[resident.name][rotation.name] || 0;
        if (currentCount > maxAllowed) {
          let blocksWithRotation = [];
          for (let block = 0; block < 26; block++) {
            if (schedule[resident.name][block] === rotation.name) {
              blocksWithRotation.push(block);
            }
          }
          // Shuffle blocks for random removal
          for (let i = blocksWithRotation.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [blocksWithRotation[i], blocksWithRotation[j]] = [blocksWithRotation[j], blocksWithRotation[i]];
          }
          const excess = currentCount - maxAllowed;
          blocksWithRotation.slice(0, excess).forEach((block) => {
            schedule[resident.name][block] = '-';
            rotationCounts[resident.name][rotation.name]--;
          });
        }
      });
    });
  }


  // Step 12: Fill Underfilled Mandatory Rotations with Lowest Count Residents (Run 20 Cycles)
  for (let cycle = 0; cycle < 20; cycle++) {
    for (let block = 0; block < 26; block++) {
      mandatoryRotations.forEach((rotation) => {
        const required = rotation.requiredPerBlock || 1;
        const currentAssigned = residents.filter((r) => schedule[r.name][block] === rotation.name).length;

        if (currentAssigned < required) {
          const remaining = required - currentAssigned;
          let availableResidents = residents
            .filter((resident) => {
              const currentCount = rotationCounts[resident.name][rotation.name] || 0;
              return (
                schedule[resident.name][block] === '-' &&
                currentCount < (rotation.max || Infinity)
              );
            })
            .map((resident) => ({
              resident,
              count: rotationCounts[resident.name][rotation.name] || 0,
            }));

          // Sort by count (lowest first)
          availableResidents.sort((a, b) => a.count - b.count);

          // Assign to residents with lowest count
          const toAssign = availableResidents.slice(0, remaining);
          toAssign.forEach(({ resident }) => {
            schedule[resident.name][block] = rotation.name;
            rotationCounts[resident.name][rotation.name] = (rotationCounts[resident.name][rotation.name] || 0) + 1;
          });
        }
      });
    }
  }



  return schedule;
};