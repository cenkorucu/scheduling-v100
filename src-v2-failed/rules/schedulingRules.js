// src/rules/schedulingRules.js

// Get ambulatory group for each block (blocks 2-25)
export const getAmbulatoryGroupForBlock = (block) => {
    if (block < 2 || block > 25) return null;
    const groups = [2, 3, 4, 5, 1]; // Start with Group 2, then 3, 4, 5, 1
    const index = (block - 2) % 5; // Block 2 -> index 0 (Group 2), Block 3 -> index 1 (Group 3), etc.
    return groups[index];
  };
  
  // Check if a rotation is a night rotation
  export const isNightRotation = (rotation) => {
    return ['NF', 'ICU Night', 'CCU Night'].includes(rotation);
  };
  
  // Check if a rotation is a unit day rotation
  export const isUnitDayRotation = (rotation) => {
    return ['ICU Day', 'CCU Day'].includes(rotation);
  };
  
  // Check if a rotation is allowed after a night rotation
  export const isAllowedAfterNight = (rotation) => {
    return ['', 'Elective', 'ID', 'ED', 'Geriatrics', 'Ambulatory'].includes(rotation) || rotation === 'Vacation';
  };
  
  // Get all included rotations for a resident based on their PGY level
  export const getIncludedRotations = (resident, rotations) => {
    const rotationSet = rotations[resident.pgyLevel] || [];
    return rotationSet.filter(rotation => rotation.included);
  };
  
  // Get mandatory rotations and their required counts
  export const getMandatoryRotations = (rotations) => {
    const allRotations = Object.values(rotations).flat();
    return allRotations.filter(rotation => rotation.included && rotation.isMandatory);
  };
  
  // Validate mandatory rotation requirements
  export const validateMandatoryRotations = (residents, rotations) => {
    const mandatoryRotations = getMandatoryRotations(rotations);
    const totalRequired = mandatoryRotations.reduce((sum, rotation) => sum + (rotation.requiredCount || 0), 0);
    if (totalRequired > residents.length) {
      throw new Error(`Not enough residents to fulfill mandatory rotations. Required: ${totalRequired}, Available: ${residents.length}`);
    }
    return mandatoryRotations;
  };