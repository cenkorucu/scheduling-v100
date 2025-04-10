// src/utils/scheduleUtils.js
import { validateRotation, findValidBlock } from './rotationValidation.js';

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
  }

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
      const nextNext = block < 24 ? schedule[resident.name][block + 2] : null;
      const prev = block > 0 ? schedule[resident.name][block - 1] : null;
      const prevPrev = block > 1 ? schedule[resident.name][block - 2] : null;

      // Rule 2: No consecutive night rotations
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

      // Rule 3: After night rotation, next must be valid
      if (nightRotations.includes(current) && next && !validAfterNight.includes(next)) {
        schedule[resident.name][block + 1] = '-';
        rotationCounts[resident.name][next]--;
      }

      // Rule 4: No consecutive unit day rotations
      if (unitDayRotations.includes(current) && next && unitDayRotations.includes(next)) {
        schedule[resident.name][block + 1] = '-';
        rotationCounts[resident.name][next]--;
      }

      // Rule 5: No more than 2 consecutive of any rotation
      if (
        current !== '-' &&
        current !== 'Vacation' &&
        ((prev === current && prevPrev === current) || (next === current && nextNext === current))
      ) {
        schedule[resident.name][block] = '-';
        rotationCounts[resident.name][current]--;
        console.warn(`Removed ${current} for ${resident.name} at block ${block} due to 3+ consecutive`);
      }

      // Rule 6: No more than 2 team rotations in any 4 consecutive blocks
      const teamRotations = ['Team A', 'Team B'];
      if (teamRotations.includes(current)) {
        const windowStart = Math.max(0, block - 3);
        const windowEnd = Math.min(25, block);
        let teamCount = 0;
        for (let i = windowStart; i <= windowEnd; i++) {
          if (teamRotations.includes(schedule[resident.name][i])) teamCount++;
        }
        if (teamCount > 2) {
          schedule[resident.name][block] = '-';
          rotationCounts[resident.name][current]--;
          console.warn(`Removed ${current} for ${resident.name} at block ${block} due to >2 team rotations in 4 blocks`);
        }
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
    // Step 7: Fill Night Rotations Sequentially Using rotationValidation.js
  const potentialNightRotations = ['NF', 'CCU Night', 'ICU Night', 'MON'];
  const nightRotationsList = mandatoryRotations
    .filter((rotation) => potentialNightRotations.includes(rotation.name))
    .map((rotation) => rotation.name);

  if (nightRotationsList.length > 0) {
    const nightBlockAssignments = {};
    nightRotationsList.forEach((rotation) => {
      nightBlockAssignments[rotation] = Array(26).fill(0);
      for (let block = 0; block < 26; block++) {
        nightBlockAssignments[rotation][block] = residents.filter(
          (r) => schedule[r.name][block] === rotation
        ).length;
      }
    });

    for (let iteration = 0; iteration < 10; iteration++) {
      for (let block = 0; block < 26; block++) {
        shuffleArray(nightRotationsList).forEach((rotation) => {
          const required = mandatoryRotations.find((r) => r.name === rotation)?.requiredPerBlock || 1;

          if (nightBlockAssignments[rotation][block] < required) {
            const availableResident = shuffleArray([...residents]).find((resident) =>
              validateRotation(schedule, resident.name, block, rotation, nightRotations, unitDayRotations, validAfterNight)
            );

            if (availableResident) {
              schedule[availableResident.name][block] = rotation;
              rotationCounts[availableResident.name][rotation] =
                (rotationCounts[availableResident.name][rotation] || 0) + 1;
              nightBlockAssignments[rotation][block]++;
            } else {
              console.warn(`No available resident found to assign ${rotation} at block ${block}`);
              const resident = shuffleArray([...residents])[0];
              const validBlock = findValidBlock(schedule, resident.name, rotation, nightRotations, unitDayRotations, validAfterNight);
              if (validBlock !== -1) {
                schedule[resident.name][validBlock] = rotation;
                rotationCounts[resident.name][rotation] =
                  (rotationCounts[resident.name][rotation] || 0) + 1;
                nightBlockAssignments[rotation][validBlock]++;
              }
            }
          }
        });
      }

      const allFilled = nightRotationsList.every((rotation) => {
        const required = mandatoryRotations.find((r) => r.name === rotation)?.requiredPerBlock || 1;
        return nightBlockAssignments[rotation].every((count) => count === required);
      });

      if (allFilled) break;
    }

    nightRotationsList.forEach((rotation) => {
      const required = mandatoryRotations.find((r) => r.name === rotation)?.requiredPerBlock || 1;
      const underfilled = nightBlockAssignments[rotation]
        .map((count, i) => (count < required ? i : -1))
        .filter((i) => i !== -1);
      if (underfilled.length > 0) {
        console.warn(`${rotation} underfilled at blocks: ${underfilled}, counts: ${nightBlockAssignments[rotation]}`);
      }
    });
  }

  // Step 8: Balance Night Rotations by Swapping Excess (Per Rotation)
  if (nightRotationsList.length > 0) {
    nightRotationsList.forEach((rotationA) => {
      const maxRotationA = mandatoryRotations.find((r) => r.name === rotationA)?.max || 5;

      residents.forEach((residentA) => {
        const countA = rotationCounts[residentA.name][rotationA] || 0;

        if (countA > maxRotationA) {
          const nightBlocksA = [];
          for (let block = 0; block < 26; block++) {
            if (schedule[residentA.name][block] === rotationA) {
              nightBlocksA.push(block);
            }
          }

          if (nightBlocksA.length > 0) {
            const blockA = shuffleArray(nightBlocksA)[0];

            const residentB = shuffleArray([...residents])
              .filter((r) => r.name !== residentA.name)
              .find((resident) => {
                const countB = rotationCounts[resident.name][rotationA] || 0;
                return (
                  countB < maxRotationA &&
                  validateRotation(schedule, resident.name, blockA, rotationA, nightRotations, unitDayRotations, validAfterNight)
                );
              });

            if (residentB) {
              const originalB = schedule[residentB.name][blockA];
              schedule[residentB.name][blockA] = rotationA;
              schedule[residentA.name][blockA] = '-';

              rotationCounts[residentA.name][rotationA]--;
              rotationCounts[residentB.name][rotationA] =
                (rotationCounts[residentB.name][rotationA] || 0) + 1;
              if (originalB !== '-' && originalB !== 'Vacation') {
                rotationCounts[residentB.name][originalB]--;
              }
            }
          }
        }
      });
    });

    nightRotationsList.forEach((rotation) => {
      residents.forEach((resident) => {
        const count = rotationCounts[resident.name][rotation] || 0;
        const max = mandatoryRotations.find((r) => r.name === rotation)?.max || 5;
        console.log(`${resident.name} ${rotation} rotations: ${count} (max: ${max})`);
      });
    });
  }

  // Step 9: Optimize Mandatory Rotations with Swapping
  if (mandatoryRotations.length > 0) {
    // Initial aggressive fill
    mandatoryRotations.forEach((rotation) => {
      const required = rotation.requiredPerBlock || 1;
      for (let block = 0; block < 26; block++) {
        let currentCount = residents.filter((r) => schedule[r.name][block] === rotation.name).length;
        while (currentCount < required) {
          const resident = shuffleArray([...residents]).find((r) =>
            validateRotation(schedule, r.name, block, rotation.name, nightRotations, unitDayRotations, validAfterNight)
          );
          if (resident) {
            schedule[resident.name][block] = rotation.name;
            rotationCounts[resident.name][rotation.name] =
              (rotationCounts[resident.name][rotation.name] || 0) + 1;
            currentCount++;
          } else {
            break;
          }
        }
      }
    });

    // Optimize with swapping
    for (let iteration = 0; iteration < 10; iteration++) {
      let changesMade = false;

      shuffleArray(mandatoryRotations).forEach((rotation) => {
        const required = rotation.requiredPerBlock || 1;
        const maxRotation = rotation.max || Infinity;

        const blockAssignments = Array(26).fill(0);
        for (let block = 0; block < 26; block++) {
          blockAssignments[block] = residents.filter(
            (r) => schedule[r.name][block] === rotation.name
          ).length;
        }

        residents.forEach((residentA) => {
          const countA = rotationCounts[residentA.name][rotation.name] || 0;
          if (countA > maxRotation) {
            const blocksA = [];
            for (let block = 0; block < 26; block++) {
              if (schedule[residentA.name][block] === rotation.name) {
                blocksA.push(block);
              }
            }
            if (blocksA.length > 0) {
              const blockA = shuffleArray(blocksA)[0];
              const residentB = shuffleArray([...residents])
                .filter((r) => r.name !== residentA.name)
                .find((resident) => {
                  const countB = rotationCounts[resident.name][rotation.name] || 0;
                  return (
                    countB < maxRotation &&
                    validateRotation(schedule, resident.name, blockA, rotation.name, nightRotations, unitDayRotations, validAfterNight)
                  );
                });

              if (residentB) {
                const originalB = schedule[residentB.name][blockA];
                schedule[residentB.name][blockA] = rotation.name;
                schedule[residentA.name][blockA] = '-';
                rotationCounts[residentA.name][rotation.name]--;
                rotationCounts[residentB.name][rotation.name] =
                  (rotationCounts[residentB.name][rotation.name] || 0) + 1;
                if (originalB !== '-' && originalB !== 'Vacation') {
                  rotationCounts[residentB.name][originalB]--;
                }
                changesMade = true;
              }
            }
          }
        });

        const underfilledBlocks = shuffleArray(
          blockAssignments
            .map((count, i) => (count < required ? i : -1))
            .filter((i) => i !== -1)
        );

        for (const block of underfilledBlocks) {
          const resident = shuffleArray([...residents]).find((r) => {
            const count = rotationCounts[r.name][rotation.name] || 0;
            return (
              count < maxRotation &&
              validateRotation(schedule, r.name, block, rotation.name, nightRotations, unitDayRotations, validAfterNight)
            );
          });
          if (resident) {
            schedule[resident.name][block] = rotation.name;
            rotationCounts[resident.name][rotation.name] =
              (rotationCounts[resident.name][rotation.name] || 0) + 1;
            changesMade = true;
          }
        }
      });

      if (!changesMade) break;
    }

    // Log Step 9 results
    mandatoryRotations.forEach((rotation) => {
      const required = rotation.requiredPerBlock || 1;
      const blockAssignments = Array(26).fill(0);
      for (let block = 0; block < 26; block++) {
        blockAssignments[block] = residents.filter(
          (r) => schedule[r.name][block] === rotation.name
        ).length;
      }
      const underfilled = blockAssignments
        .map((count, i) => (count < required ? i : -1))
        .filter((i) => i !== -1);
      const overfilled = blockAssignments
        .map((count, i) => (count > required ? i : -1))
        .filter((i) => i !== -1);
      if (underfilled.length > 0) {
        console.warn(`${rotation.name} underfilled at blocks: ${underfilled}, counts: ${blockAssignments}`);
      }
      if (overfilled.length > 0) {
        console.warn(`${rotation.name} overfilled at blocks: ${overfilled}, counts: ${blockAssignments}`);
      }
    });
  }

  // Step 10: Ensure Minimum Rotation Requirements with Swapping
  if (mandatoryRotations.length > 0) {
    for (let iteration = 0; iteration < 10; iteration++) {
      let changesMade = false;

      shuffleArray(mandatoryRotations).forEach((rotation) => {
        const requiredPerBlock = rotation.requiredPerBlock || 1;
        const minRotation = rotation.min || 0;
        const maxRotation = rotation.max || Infinity;

        const residentCounts = residents.map((resident) => ({
          resident,
          count: rotationCounts[resident.name][rotation.name] || 0,
        }));
        const belowMin = residentCounts.filter((rc) => rc.count < minRotation);
        const aboveMin = residentCounts.filter((rc) => rc.count > minRotation && rc.count <= maxRotation);

        for (const { resident: residentA } of shuffleArray(belowMin)) {
          const needed = minRotation - (rotationCounts[residentA.name][rotation.name] || 0);
          for (let i = 0; i < needed; i++) {
            const residentB = shuffleArray(aboveMin).find((rc) => rc.count > minRotation);
            if (!residentB) break;

            const blocksB = [];
            for (let block = 0; block < 26; block++) {
              if (schedule[residentB.resident.name][block] === rotation.name) {
                blocksB.push(block);
              }
            }
            if (blocksB.length === 0) continue;

            const blockB = shuffleArray(blocksB)[0];
            const currentCountAtBlock = residents.filter(
              (r) => schedule[r.name][blockB] === rotation.name
            ).length;

            if (
              currentCountAtBlock > requiredPerBlock &&
              validateRotation(schedule, residentA.name, blockB, rotation.name, nightRotations, unitDayRotations, validAfterNight)
            ) {
              const originalA = schedule[residentA.name][blockB];
              schedule[residentA.name][blockB] = rotation.name;
              schedule[residentB.resident.name][blockB] = '-';
              rotationCounts[residentA.name][rotation.name] =
                (rotationCounts[residentA.name][rotation.name] || 0) + 1;
              rotationCounts[residentB.resident.name][rotation.name]--;
              if (originalA !== '-' && originalA !== 'Vacation') {
                rotationCounts[residentA.name][originalA]--;
              }
              residentB.count--;
              changesMade = true;
            } else {
              const validBlock = findValidBlock(
                schedule,
                residentA.name,
                rotation.name,
                nightRotations,
                unitDayRotations,
                validAfterNight
              );
              if (
                validBlock !== -1 &&
                residents.filter((r) => schedule[r.name][validBlock] === rotation.name).length < requiredPerBlock
              ) {
                schedule[residentA.name][validBlock] = rotation.name;
                rotationCounts[residentA.name][rotation.name] =
                  (rotationCounts[residentA.name][rotation.name] || 0) + 1;
                changesMade = true;
              }
            }
          }
        }
      });

      if (!changesMade) break;
    }

    // Log Step 10 results
    mandatoryRotations.forEach((rotation) => {
      const minRotation = rotation.min || 0;
      const maxRotation = rotation.max || Infinity;
      residents.forEach((resident) => {
        const count = rotationCounts[resident.name][rotation.name] || 0;
        if (count < minRotation) {
          console.warn(`${resident.name} has ${count} ${rotation.name} rotations (min: ${minRotation})`);
        }
        if (count > maxRotation) {
          console.warn(`${resident.name} has ${count} ${rotation.name} rotations (max: ${maxRotation})`);
        }
      });
    });
  }

  // Step 11: Enforce Block Validation Rules (Post-Cleanup)
  residents.forEach((resident) => {
    for (let block = 0; block < 26; block++) {
      const current = schedule[resident.name][block];
      const next = block < 25 ? schedule[resident.name][block + 1] : null;
      const nextNext = block < 24 ? schedule[resident.name][block + 2] : null;
      const prev = block > 0 ? schedule[resident.name][block - 1] : null;
      const prevPrev = block > 1 ? schedule[resident.name][block - 2] : null;

      // Rule 2: No consecutive night rotations
      if (nightRotations.includes(current) && next && nightRotations.includes(next)) {
        schedule[resident.name][block + 1] = '-';
        rotationCounts[resident.name][next]--;
        console.warn(`Removed consecutive night ${next} for ${resident.name} at block ${block + 1}`);
      }

      // Rule 3: After night rotation, next must be valid
      if (nightRotations.includes(current) && next && !validAfterNight.includes(next)) {
        const rotation = next;
        schedule[resident.name][block + 1] = '-';
        rotationCounts[resident.name][rotation]--;
        console.warn(`Removed ${rotation} after ${current} for ${resident.name} at block ${block + 1}`);

        // Try to reassign
        const validBlock = findValidBlock(
          schedule,
          resident.name,
          rotation,
          nightRotations,
          unitDayRotations,
          validAfterNight
        );
        if (validBlock !== -1) {
          const blockCount = residents.filter((r) => schedule[r.name][validBlock] === rotation).length;
          const required = mandatoryRotations.find((r) => r.name === rotation)?.requiredPerBlock || 1;
          if (blockCount < required) {
            schedule[resident.name][validBlock] = rotation;
            rotationCounts[resident.name][rotation] =
              (rotationCounts[resident.name][rotation] || 0) + 1;
          }
        }
      }

      // Rule 4: No consecutive unit day rotations
      if (unitDayRotations.includes(current) && next && unitDayRotations.includes(next)) {
        schedule[resident.name][block + 1] = '-';
        rotationCounts[resident.name][next]--;
        console.warn(`Removed consecutive unit day ${next} for ${resident.name} at block ${block + 1}`);
      }

      // Rule 5: No more than 2 consecutive of any rotation
      if (
        current !== '-' &&
        current !== 'Vacation' &&
        ((prev === current && prevPrev === current) || (next === current && nextNext === current))
      ) {
        schedule[resident.name][block] = '-';
        rotationCounts[resident.name][current]--;
        console.warn(`Removed ${current} for ${resident.name} at block ${block} due to 3+ consecutive`);

        // Try to reassign
        const validBlock = findValidBlock(
          schedule,
          resident.name,
          current,
          nightRotations,
          unitDayRotations,
          validAfterNight
        );
        if (validBlock !== -1) {
          const blockCount = residents.filter((r) => schedule[r.name][validBlock] === current).length;
          const required = mandatoryRotations.find((r) => r.name === current)?.requiredPerBlock || 1;
          if (blockCount < required) {
            schedule[resident.name][validBlock] = current;
            rotationCounts[resident.name][current] =
              (rotationCounts[resident.name][current] || 0) + 1;
          }
        }
      }

      // Rule 6: No more than 2 team rotations in any 4 consecutive blocks
      const teamRotations = ['Team A', 'Team B'];
      if (teamRotations.includes(current)) {
        const windowStart = Math.max(0, block - 3);
        const windowEnd = Math.min(25, block);
        let teamCount = 0;
        for (let i = windowStart; i <= windowEnd; i++) {
          if (teamRotations.includes(schedule[resident.name][i])) teamCount++;
        }
        if (teamCount > 2) {
          schedule[resident.name][block] = '-';
          rotationCounts[resident.name][current]--;
          console.warn(`Removed ${current} for ${resident.name} at block ${block} due to >2 team rotations in 4 blocks`);

          // Try to reassign
          const validBlock = findValidBlock(
            schedule,
            resident.name,
            current,
            nightRotations,
            unitDayRotations,
            validAfterNight
          );
          if (validBlock !== -1) {
            const blockCount = residents.filter((r) => schedule[r.name][validBlock] === current).length;
            const required = mandatoryRotations.find((r) => r.name === current)?.requiredPerBlock || 1;
            if (blockCount < required) {
              schedule[resident.name][validBlock] = current;
              rotationCounts[resident.name][current] =
                (rotationCounts[resident.name][current] || 0) + 1;
            }
          }
        }
      }
    }
  });

  // Step 12: Fill Underfilled Blocks with Residents Below Max
  if (mandatoryRotations.length > 0) {
    let changesMade = false;
    do {
      changesMade = false;
      shuffleArray(mandatoryRotations).forEach((rotation) => {
        const required = rotation.requiredPerBlock || 1;
        const maxRotation = rotation.max || Infinity;

        // Calculate current block assignments
        const blockAssignments = Array(26).fill(0);
        for (let block = 0; block < 26; block++) {
          blockAssignments[block] = residents.filter(
            (r) => schedule[r.name][block] === rotation.name
          ).length;
        }

        // Identify underfilled blocks
        const underfilledBlocks = shuffleArray(
          blockAssignments
            .map((count, i) => (count < required ? i : -1))
            .filter((i) => i !== -1)
        );

        // Attempt to fill each underfilled block
        for (const block of underfilledBlocks) {
          const eligibleResident = shuffleArray([...residents]).find((resident) => {
            const count = rotationCounts[resident.name][rotation.name] || 0;
            return (
              count < maxRotation &&
              validateRotation(schedule, resident.name, block, rotation.name, nightRotations, unitDayRotations, validAfterNight)
            );
          });

          if (eligibleResident) {
            schedule[eligibleResident.name][block] = rotation.name;
            rotationCounts[eligibleResident.name][rotation.name] =
              (rotationCounts[eligibleResident.name][rotation.name] || 0) + 1;
            changesMade = true;
            console.log(`Filled ${rotation.name} for ${eligibleResident.name} at block ${block}`);
          }
        }
      });
    } while (changesMade); // Repeat until no more fills are possible
  }

  // Step 13: Last Swap - Balance Rotation Counts Across Residents
  if (mandatoryRotations.length > 0) {
    let changesMade = false;
    do {
      changesMade = false;
      shuffleArray(mandatoryRotations).forEach((rotation) => {
        const maxRotation = rotation.max || Infinity;

        // Get resident counts for this rotation
        const residentCounts = residents.map((resident) => ({
          resident,
          count: rotationCounts[resident.name][rotation.name] || 0,
        }));

        // Compare residents in random order
        const shuffledResidents = shuffleArray([...residentCounts]);
        for (let i = 0; i < shuffledResidents.length; i++) {
          const resA = shuffledResidents[i];
          for (let j = i + 1; j < shuffledResidents.length; j++) {
            const resB = shuffledResidents[j];

            const countA = resA.count;
            const countB = resB.count;
            const diff = Math.abs(countA - countB);

            if (diff > 2) {
              const highResident = countA > countB ? resA.resident : resB.resident;
              const lowResident = countA > countB ? resB.resident : resA.resident;
              const highCount = Math.max(countA, countB);
              const lowCount = Math.min(countA, countB);

              // Find blocks where high resident has the rotation
              const highBlocks = [];
              for (let block = 0; block < 26; block++) {
                if (schedule[highResident.name][block] === rotation.name) {
                  highBlocks.push(block);
                }
              }

              // Try to swap to low resident in the same block
              for (const block of shuffleArray(highBlocks)) {
                if (
                  schedule[lowResident.name][block] === '-' && // Low resident’s block must be empty
                  validateRotation(schedule, lowResident.name, block, rotation.name, nightRotations, unitDayRotations, validAfterNight) &&
                  lowCount < maxRotation // Respect max limit
                ) {
                  schedule[lowResident.name][block] = rotation.name;
                  schedule[highResident.name][block] = '-';
                  rotationCounts[lowResident.name][rotation.name] =
                    (rotationCounts[lowResident.name][rotation.name] || 0) + 1;
                  rotationCounts[highResident.name][rotation.name]--;
                  changesMade = true;
                  console.log(
                    `Swapped ${rotation.name} from ${highResident.name} (count: ${highCount}) to ${lowResident.name} (count: ${lowCount}) at block ${block}`
                  );
                  break; // Move to next pair after a successful swap
                }
              }
            }
          }
        }
      });
    } while (changesMade); // Repeat until no more swaps are possible
  }

  // Final Validation Logging
  mandatoryRotations.forEach((rotation) => {
    const required = rotation.requiredPerBlock || 1;
    const minRotation = rotation.min || 0;
    const maxRotation = rotation.max || Infinity;
    const blockAssignments = Array(26).fill(0);
    for (let block = 0; block < 26; block++) {
      blockAssignments[block] = residents.filter((r) => schedule[r.name][block] === rotation.name).length;
    }
    const underfilled = blockAssignments
      .map((count, i) => (count < required ? i : -1))
      .filter((i) => i !== -1);
    if (underfilled.length > 0) {
      console.warn(`${rotation.name} underfilled at blocks: ${underfilled}, counts: ${blockAssignments}`);
    }
    residents.forEach((resident) => {
      const count = rotationCounts[resident.name][rotation.name] || 0;
      if (count < minRotation) {
        console.warn(`${resident.name} has ${count} ${rotation.name} rotations (min: ${minRotation})`);
      }
      if (count > maxRotation) {
        console.warn(`${resident.name} has ${count} ${rotation.name} rotations (max: ${maxRotation})`);
      }
    });
  });

  return schedule;
};