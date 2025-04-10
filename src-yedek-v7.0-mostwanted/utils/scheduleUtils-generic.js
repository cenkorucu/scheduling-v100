// src/utils/scheduleUtils.js
export const generateSchedule = (residents, rotations) => {
  const schedule = {};
  const rotationCounts = {};

  // Step 1: Initialization
  const residentNames = new Set();
  residents.forEach((resident) => {
    if (residentNames.has(resident.name)) throw new Error(`Duplicate resident name: ${resident.name}`);
    residentNames.add(resident.name);
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
      if (
        resident.group === assignedGroup &&
        blockNum !== resident.vacation1 &&
        blockNum !== resident.vacation2
      ) {
        schedule[resident.name][block] = ambulatoryRotation;
        rotationCounts[resident.name][ambulatoryRotation] =
          (rotationCounts[resident.name][ambulatoryRotation] || 0) + 1;
      }
    });
  };

  // Step 3: Apply Vacations (Locked)
  residents.forEach((resident) => {
    if (resident.vacation1 && resident.vacation1 <= 26) {
      schedule[resident.name][resident.vacation1 - 1] = 'Vacation';
      rotationCounts[resident.name]['Vacation'] =
        (rotationCounts[resident.name]['Vacation'] || 0) + 1;
    }
    if (resident.vacation2 && resident.vacation2 <= 26) {
      schedule[resident.name][resident.vacation2 - 1] = 'Vacation';
      rotationCounts[resident.name]['Vacation'] =
        (rotationCounts[resident.name]['Vacation'] || 0) + 1;
    }
  });

  // Step 4: Assign Mandatory Rotations - Random Assignment to Meet Minimums per Resident
  const mandatoryRotations = rotations.filter((r) => r.included && r.mandatory);
  const nightRotations = ['NF', 'ICU Night', 'CCU Night', 'MON'];
  const unitDayRotations = ['ICU Day', 'CCU Day'];
  const validAfterNight = ['-', 'Vacation', 'Ambulatory'];

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const minRequirements = {};
  residents.forEach((resident) => {
    minRequirements[resident.name] = {};
    mandatoryRotations.forEach((rotation) => {
      minRequirements[resident.name][rotation.name] = rotation.min || 0;
    });
  });

  let allMinimumsMet = false;
  while (!allMinimumsMet) {
    let availableResidents = shuffleArray([...residents]);
    const assignedResidents = new Set();

    while (availableResidents.length > 0) {
      const resident = availableResidents.pop();
      assignedResidents.add(resident.name);

      const rotationsToAssign = shuffleArray([...mandatoryRotations]).filter((r) => {
        const currentCount = rotationCounts[resident.name][r.name] || 0;
        return currentCount < minRequirements[resident.name][r.name];
      });

      if (rotationsToAssign.length === 0) continue;

      const rotation = rotationsToAssign[0];

      let availableBlocks = [];
      for (let block = 0; block < 26; block++) {
        const current = schedule[resident.name][block];
        const prev = block > 0 ? schedule[resident.name][block - 1] : null;
        const next = block < 25 ? schedule[resident.name][block + 1] : null;

        if (current !== '-') continue;

        if (nightRotations.includes(rotation.name) && prev && nightRotations.includes(prev)) continue;
        if (nightRotations.includes(rotation.name) && next && !validAfterNight.includes(next)) continue;
        if (unitDayRotations.includes(rotation.name) && prev && unitDayRotations.includes(prev)) continue;

        availableBlocks.push(block);
      }

      if (availableBlocks.length === 0) continue;

      availableBlocks = shuffleArray(availableBlocks);
      const block = availableBlocks[0];

      schedule[resident.name][block] = rotation.name;
      rotationCounts[resident.name][rotation.name] =
        (rotationCounts[resident.name][rotation.name] || 0) + 1;
    }

    allMinimumsMet = residents.every((resident) =>
      mandatoryRotations.every((rotation) => {
        const currentCount = rotationCounts[resident.name][rotation.name] || 0;
        return currentCount >= (rotation.min || 0);
      })
    );
  }

  // Step 5: Enforce Rotation Rules
  residents.forEach((resident) => {
    for (let block = 0; block < 26; block++) {
      const current = schedule[resident.name][block];
      const next = block < 25 ? schedule[resident.name][block + 1] : null;
      const prev = block > 0 ? schedule[resident.name][block - 1] : null;
      const prevPrev = block > 1 ? schedule[resident.name][block - 2] : null;

      if (nightRotations.includes(current) && next && nightRotations.includes(next)) {
        let newBlocks = shuffleArray(
          Array.from({ length: 26 }, (_, i) => i).filter(
            (b) =>
              schedule[resident.name][b] === '-' &&
              (b === 0 || !nightRotations.includes(schedule[resident.name][b - 1])) &&
              (b === 25 || !nightRotations.includes(schedule[resident.name][b + 1]))
          )
        );
        if (newBlocks.length > 0) {
          schedule[resident.name][newBlocks[0]] = next;
          schedule[resident.name][block + 1] = '-';
          rotationCounts[resident.name][next]--;
          rotationCounts[resident.name][next] = (rotationCounts[resident.name][next] || 0) + 1;
        } else {
          schedule[resident.name][block + 1] = '-';
          rotationCounts[resident.name][next]--;
        }
      }

      if (nightRotations.includes(current) && next && !validAfterNight.includes(next)) {
        schedule[resident.name][block + 1] = '-';
        rotationCounts[resident.name][next]--;
      }

      if (unitDayRotations.includes(current) && next && unitDayRotations.includes(next)) {
        schedule[resident.name][block + 1] = '-';
        rotationCounts[resident.name][next]--;
      }

      if (
        current !== '-' &&
        current !== 'Vacation' &&
        prev === current &&
        prevPrev === current
      ) {
        schedule[resident.name][block] = '-';
        rotationCounts[resident.name][current]--;
      }
    }
  });

  // Step 6: Remove Overfilled Rotations to Match Exact Required Residents per Block
  mandatoryRotations.forEach((rotation) => {
    const required = rotation.requiredPerBlock || 1;
    for (let block = 0; block < 26; block++) {
      const assignedResidents = residents.filter((r) => schedule[r.name][block] === rotation.name);
      if (assignedResidents.length > required) {
        const residentCounts = assignedResidents.map((resident) => ({
          resident,
          count: rotationCounts[resident.name][rotation.name] || 0,
        })).sort((a, b) => b.count - a.count);

        const excess = assignedResidents.length - required;
        let toRemove = [];

        let currentCount = null;
        let sameCountGroup = [];
        residentCounts.forEach((rc) => {
          if (currentCount !== rc.count) {
            if (sameCountGroup.length > 0 && toRemove.length < excess) {
              const needed = Math.min(excess - toRemove.length, sameCountGroup.length);
              toRemove.push(...shuffleArray(sameCountGroup).slice(0, needed));
            }
            currentCount = rc.count;
            sameCountGroup = [rc];
          } else {
            sameCountGroup.push(rc);
          }
        });
        if (sameCountGroup.length > 0 && toRemove.length < excess) {
          const needed = Math.min(excess - toRemove.length, sameCountGroup.length);
          toRemove.push(...shuffleArray(sameCountGroup).slice(0, needed));
        }

        toRemove.forEach(({ resident }) => {
          schedule[resident.name][block] = '-';
          rotationCounts[resident.name][rotation.name]--;
        });
      }
    }
  });

  // Step 7: Ultra-Simple Night Rotation Fill
  const nightRotationsList = ['NF', 'ICU Night', 'CCU Night', 'MON'];

  // Track night block assignments
  const nightBlockAssignments = {};
  nightRotationsList.forEach((rotation) => {
    nightBlockAssignments[rotation] = Array(26).fill(0);
    for (let block = 0; block < 26; block++) {
      nightBlockAssignments[rotation][block] = residents.filter(
        (r) => schedule[r.name][block] === rotation
      ).length;
    }
  });

  // Try filling night rotations
  residents.forEach((resident) => {
    nightRotationsList.forEach((rotation) => {
      const required = mandatoryRotations.find((r) => r.name === rotation)?.requiredPerBlock || 1;
      for (let block = 0; block < 26; block++) {
        if (
          schedule[resident.name][block] === '-' &&
          nightBlockAssignments[rotation][block] < required
        ) {
          schedule[resident.name][block] = rotation;
          rotationCounts[resident.name][rotation] =
            (rotationCounts[resident.name][rotation] || 0) + 1;
          nightBlockAssignments[rotation][block]++;
        }
      }
    });
  });

  // Log results for debugging
  nightRotationsList.forEach((rotation) => {
    const required = mandatoryRotations.find((r) => r.name === rotation)?.requiredPerBlock || 1;
    const counts = nightBlockAssignments[rotation];
    const underfilled = counts
      .map((count, i) => (count < required ? i : -1))
      .filter((i) => i !== -1);
    console.log(`${rotation} - Required: ${required}, Counts: ${counts.join(', ')}`);
    if (underfilled.length > 0) {
      console.warn(`${rotation} underfilled at blocks: ${underfilled}`);
    }
  });

  return schedule;
};