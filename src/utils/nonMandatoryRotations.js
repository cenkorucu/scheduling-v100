// src/utils/nonMandatoryRotations.js
export const generateNonMandatorySchedule = (residents, rotations, currentSchedule, rotationCounts) => {
    const schedule = { ...currentSchedule };
    const updatedRotationCounts = { ...rotationCounts };
  
    // Filter non-mandatory rotations with exact constraints, excluding "Elective"
    const nonMandatoryExactRotations = rotations.filter(
      (r) =>
        r.included &&
        !r.mandatory &&
        r.type === 'exact' &&
        r.exact !== undefined &&
        r.name !== 'Elective'
    );
  
    nonMandatoryExactRotations.forEach((rotation) => {
      const exactRequired = rotation.exact || 0;
      residents.forEach((resident) => {
        let assignmentsNeeded = exactRequired - (updatedRotationCounts[resident.name][rotation.name] || 0);
        if (assignmentsNeeded > 0) {
          let availableBlocks = [];
          for (let block = 0; block < 26; block++) {
            const currentAssigned = residents.filter((r) => schedule[r.name][block] === rotation.name).length;
            if (schedule[resident.name][block] === '-' && currentAssigned === 0) {
              availableBlocks.push(block);
            }
          }
          // Shuffle available blocks for randomness
          for (let i = availableBlocks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableBlocks[i], availableBlocks[j]] = [availableBlocks[j], availableBlocks[i]];
          }
          // Assign the exact number needed
          for (let i = 0; i < assignmentsNeeded && i < availableBlocks.length; i++) {
            const block = availableBlocks[i];
            schedule[resident.name][block] = rotation.name;
            updatedRotationCounts[resident.name][rotation.name] =
              (updatedRotationCounts[resident.name][rotation.name] || 0) + 1;
          }
        }
      });
    });
  
    return { schedule, rotationCounts: updatedRotationCounts };
  };