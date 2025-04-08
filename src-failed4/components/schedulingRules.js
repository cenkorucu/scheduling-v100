// Function to assign Ambulatory rotations
export function assignAmbulatoryRotations(schedule, residents) {
    if (!Array.isArray(residents) || residents.length === 0) {
        console.warn('No residents provided for scheduling');
        return schedule;
    }

    console.log('Starting Ambulatory assignments...');

    const ambulatoryStart = 2;
    const ambulatoryEnd = 25;
    const groups = [1, 2, 3, 4, 5];

    for (let block = ambulatoryStart; block <= ambulatoryEnd; block++) {
        const groupIndex = (block - ambulatoryStart) % groups.length;
        const currentGroup = groups[groupIndex];

        console.log(`Processing block ${block}, group ${currentGroup}`);

        const groupResidents = residents.filter(resident => 
            resident.group === currentGroup && resident.id
        );

        console.log(`Found ${groupResidents.length} residents in group ${currentGroup}`);

        if (groupResidents.length > 0) {
            groupResidents.forEach(resident => {
                if (!schedule[block - 1].assignments) {
                    schedule[block - 1].assignments = {};
                }
                schedule[block - 1].assignments[resident.id] = 'Ambulatory';
                
                // Ensure residents array exists
                if (!Array.isArray(schedule[block - 1].residents)) {
                    schedule[block - 1].residents = [];
                }
                
                schedule[block - 1].residents.push({
                    residentId: resident.id,
                    rotation: 'Ambulatory'
                });

                console.log(`Assigned resident ${resident.id} to Ambulatory in block ${block}`);
            });
        }
    }

    console.log('Final schedule after Ambulatory assignments:', schedule);
    return schedule;
}

// Function to handle vacation conflicts
export function handleVacationConflicts(schedule, residents) {
    residents.forEach((resident) => {
        const vacationBlocks = [resident.vacation1, resident.vacation2];

        vacationBlocks.forEach((vacationBlock) => {
            if (schedule[vacationBlock - 1][resident.id] === "Ambulatory") {
                // Move vacation to the next block
                let nextBlock = vacationBlock + 1;

                while (
                    nextBlock <= 26 &&
                    schedule[nextBlock - 1][resident.id] === "Ambulatory"
                ) {
                    nextBlock++;
                }

                if (nextBlock <= 26) {
                    schedule[nextBlock - 1][resident.id] = "Vacation";
                }
            } else {
                schedule[vacationBlock - 1][resident.id] = "Vacation";
            }
        });
    });

    return schedule;
}

// Function to assign Mandatory Rotations
export function assignMandatoryRotations(schedule, residents, mandatoryRotations) {
    mandatoryRotations.forEach((rotation) => {
        const { name, requiredPerBlock, min, max } = rotation;

        for (let block = 0; block < 26; block++) {
            let assignedResidents = 0;

            // Assign residents to the rotation for the current block
            residents.forEach((resident) => {
                if (
                    assignedResidents < requiredPerBlock &&
                    (resident[`${name}Count`] || 0) < max &&
                    !schedule[block][resident.id] // Ensure no conflict
                ) {
                    schedule[block][resident.id] = name;
                    resident[`${name}Count`] = (resident[`${name}Count`] || 0) + 1;
                    assignedResidents++;
                }
            });

            // Handle cases where requiredPerBlock is not met
            if (assignedResidents < requiredPerBlock) {
                residents.forEach((resident) => {
                    if (
                        assignedResidents < requiredPerBlock &&
                        !schedule[block][resident.id] // Ensure no conflict
                    ) {
                        schedule[block][resident.id] = `${name} (Override)`; // Flag as override
                        assignedResidents++;
                    }
                });
            }
        }
    });

    return schedule;
}

// Function to enforce Min/Max Limits
export function enforceMinMaxLimits(schedule, residents, mandatoryRotations) {
    mandatoryRotations.forEach((rotation) => {
        const { name, requiredPerBlock, min, max } = rotation;

        // Ensure each resident meets the min and does not exceed the max
        residents.forEach((resident) => {
            const rotationCount = resident[`${name}Count`] || 0;

            // If resident hasn't met the min by the end of the year, assign them
            if (rotationCount < min) {
                for (let block = 0; block < 26; block++) {
                    if (!schedule[block][resident.id]) {
                        schedule[block][resident.id] = `${name} (Min Override)`; // Flag as override
                        resident[`${name}Count`] = (resident[`${name}Count`] || 0) + 1;

                        if (resident[`${name}Count`] >= min) break;
                    }
                }
            }

            // If resident exceeds the max, flag the assignment
            if (rotationCount > max) {
                for (let block = 0; block < 26; block++) {
                    if (schedule[block][resident.id] === name) {
                        schedule[block][resident.id] = `${name} (Exceeds Max)`; // Flag as pink
                    }
                }
            }
        });

        // Ensure requiredPerBlock is met for each block
        for (let block = 0; block < 26; block++) {
            let assignedResidents = residents.filter(
                (resident) => schedule[block][resident.id] === name
            ).length;

            if (assignedResidents < requiredPerBlock) {
                residents.forEach((resident) => {
                    if (
                        assignedResidents < requiredPerBlock &&
                        (resident[`${name}Count`] || 0) < max &&
                        !schedule[block][resident.id]
                    ) {
                        schedule[block][resident.id] = `${name} (Override)`; // Flag as override
                        resident[`${name}Count`] = (resident[`${name}Count`] || 0) + 1;
                        assignedResidents++;
                    }
                });
            }
        }
    });

    return schedule;
}

// Function to enforce Night and Unit Constraints
export function enforceNightAndUnitConstraints(schedule, residents) {
    const nightRotations = ["NF", "ICU Night", "CCU Night"];
    const unitDayRotations = ["ICU Day", "CCU Day"];
    const postNightAllowed = ["Elective", "ID", "ED", "Geriatrics", "Ambulatory", "Vacation"];

    residents.forEach((resident) => {
        for (let block = 0; block < 26; block++) {
            const currentRotation = schedule[block][resident.id];
            const nextBlock = block + 1 < 26 ? schedule[block + 1][resident.id] : null;

            // Check for consecutive night rotations
            if (nightRotations.includes(currentRotation) && nightRotations.includes(nextBlock)) {
                schedule[block + 1][resident.id] = `${nextBlock} (Conflict)`; // Flag conflict
            }

            // Check for consecutive unit day rotations
            if (unitDayRotations.includes(currentRotation) && unitDayRotations.includes(nextBlock)) {
                schedule[block + 1][resident.id] = `${nextBlock} (Conflict)`; // Flag conflict
            }

            // Enforce post-night rotation rules
            if (nightRotations.includes(currentRotation)) {
                if (nextBlock && !postNightAllowed.includes(nextBlock)) {
                    schedule[block + 1][resident.id] = "Empty (Post-Night Rule)"; // Adjust to empty
                }
            }
        }
    });

    return schedule;
}

// Function to enforce Balancing
export function enforceBalancing(schedule, residents, mandatoryRotations) {
    const unitDays = ["ICU Day", "CCU Day"];
    const nights = ["NF", "ICU Night", "CCU Night"];
    const floors = ["Team A", "Team B", "IMP"];

    // Ensure each resident has every mandatory rotation at least once
    mandatoryRotations.forEach((rotation) => {
        const { name } = rotation;

        residents.forEach((resident) => {
            const rotationCount = resident[`${name}Count`] || 0;

            if (rotationCount === 0) {
                for (let block = 0; block < 26; block++) {
                    if (!schedule[block][resident.id]) {
                        schedule[block][resident.id] = `${name} (Balancing)`; // Assign and flag
                        resident[`${name}Count`] = 1;
                        break;
                    }
                }
            }
        });
    });

    // Balance Unit Days, Nights, and Floors
    const categories = { unitDays, nights, floors };

    Object.keys(categories).forEach((category) => {
        const rotations = categories[category];

        // Calculate totals for each resident
        const totals = residents.map((resident) => {
            return {
                id: resident.id,
                total: rotations.reduce((sum, rotation) => {
                    return sum + (resident[`${rotation}Count`] || 0);
                }, 0),
            };
        });

        // Find the resident with the max and min totals
        const maxResident = totals.reduce((a, b) => (a.total > b.total ? a : b));
        const minResident = totals.reduce((a, b) => (a.total < b.total ? a : b));

        // Adjust assignments to balance totals
        if (maxResident.total - minResident.total > 1) {
            for (let block = 0; block < 26; block++) {
                if (rotations.includes(schedule[block][maxResident.id])) {
                    schedule[block][maxResident.id] = null; // Remove from max resident
                    schedule[block][minResident.id] = `${rotations[0]} (Balancing)`; // Assign to min resident
                    break;
                }
            }
        }
    });

    return schedule;
}

// Function to enforce Exact Numbers
export function enforceExactNumbers(schedule, residents, exactRotations) {
    exactRotations.forEach((rotation) => {
        const { name, exact } = rotation;

        residents.forEach((resident) => {
            const rotationCount = resident[`${name}Count`] || 0;

            // If resident has fewer than the exact number, assign them
            if (rotationCount < exact) {
                for (let block = 0; block < 26; block++) {
                    if (!schedule[block][resident.id]) {
                        schedule[block][resident.id] = `${name} (Exact)`; // Assign and flag
                        resident[`${name}Count`] = (resident[`${name}Count`] || 0) + 1;

                        if (resident[`${name}Count`] >= exact) break;
                    }
                }
            }

            // If resident has more than the exact number, flag the excess
            if (rotationCount > exact) {
                for (let block = 0; block < 26; block++) {
                    if (schedule[block][resident.id] === name) {
                        schedule[block][resident.id] = `${name} (Excess)`; // Flag as excess
                        resident[`${name}Count`]--;
                        if (resident[`${name}Count`] <= exact) break;
                    }
                }
            }
        });
    });

    return schedule;
}

// Function to enforce Fallbacks
export function enforceFallbacks(schedule, residents, mandatoryRotations) {
    mandatoryRotations.forEach((rotation) => {
        const { name, requiredPerBlock } = rotation;

        for (let block = 0; block < 26; block++) {
            // Count current assignments for the rotation in this block
            let assignedResidents = residents.filter(
                (resident) => schedule[block][resident.id] === name
            ).length;

            // Fill gaps if requiredPerBlock is not met
            if (assignedResidents < requiredPerBlock) {
                residents.forEach((resident) => {
                    if (
                        assignedResidents < requiredPerBlock &&
                        !schedule[block][resident.id]
                    ) {
                        schedule[block][resident.id] = `${name} (Override)`; // Flag as red
                        assignedResidents++;
                    }
                });
            }
        }
    });

    return schedule;
}