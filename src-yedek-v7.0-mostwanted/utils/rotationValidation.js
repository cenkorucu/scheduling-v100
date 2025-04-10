// src/utils/rotationValidation.js

// Validation rules for rotation assignment
export const validateRotation = (schedule, residentName, block, rotation, nightRotations, unitDayRotations, validAfterNight) => {
  const current = schedule[residentName][block];
  const prev = block > 0 ? schedule[residentName][block - 1] : null;
  const prevPrev = block > 1 ? schedule[residentName][block - 2] : null;
  const next = block < 25 ? schedule[residentName][block + 1] : null;
  const nextNext = block < 24 ? schedule[residentName][block + 2] : null;

  // Rule 1: Block must be empty
  if (current !== '-') return false;

  // Rule 2: No consecutive night rotations
  if (nightRotations.includes(rotation)) {
    if (prev && nightRotations.includes(prev)) return false;
    if (next && nightRotations.includes(next)) return false;
  }

  // Rule 3: After a night rotation, next block must be Empty, Vacation, or Ambulatory
  if (nightRotations.includes(rotation) && next && !validAfterNight.includes(next)) return false;

  // Rule 4: No consecutive unit day rotations
  if (unitDayRotations.includes(rotation) && prev && unitDayRotations.includes(prev)) return false;

  // Rule 5: No more than 2 consecutive occurrences of any rotation
  if (
    (prev === rotation && prevPrev === rotation) || // Check previous two blocks
    (next === rotation && nextNext === rotation) || // Check next two blocks
    (prev === rotation && next === rotation) // Check sandwich case (prev and next)
  ) {
    return false;
  }

  // Rule 6: No more than 2 team rotations ('Team A' or 'Team B') in any consecutive 4 blocks
  const teamRotations = ['Team A', 'Team B'];
  if (teamRotations.includes(rotation)) {
    const windowStart = Math.max(0, block - 3);
    const windowEnd = Math.min(25, block + 3);
    let teamCount = 0;
    for (let i = windowStart; i <= windowEnd; i++) {
      if (i === block) continue; // Skip the current block since we're validating it
      if (teamRotations.includes(schedule[residentName][i])) teamCount++;
    }
    if (teamCount >= 2) return false; // Adding this rotation would exceed 2 in the 4-block window
  }

  return true;
};

// Find a valid block for a rotation
export const findValidBlock = (schedule, residentName, rotation, nightRotations, unitDayRotations, validAfterNight) => {
  for (let block = 0; block < 26; block++) {
    if (validateRotation(schedule, residentName, block, rotation, nightRotations, unitDayRotations, validAfterNight)) {
      return block;
    }
  }
  return -1; // No valid block found
};