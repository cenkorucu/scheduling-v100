// src/rules/scheduleGenerator.js
import {
    getAmbulatoryGroupForBlock,
    isNightRotation,
    isUnitDayRotation,
    isAllowedAfterNight,
    getIncludedRotations,
    validateMandatoryRotations,
} from './schedulingRules';

export const generateSchedule = (residents, rotations) => {
    const schedule = residents.map(() => Array(26).fill(''));
    const violations = [];
    const rotationAssignments = {};
    const metrics = {
        unitDays: Array(residents.length).fill(0),
        nights: Array(residents.length).fill(0),
        floors: Array(residents.length).fill(0)
    };

    // Initialize rotation assignments tracking
    Object.keys(rotations).forEach(rotationType => {
        rotations[rotationType].forEach(rotation => {
            if (rotation.included) {
                rotationAssignments[rotation.name] = Array(26).fill(0);
            }
        });
    });

    // 1. Assign Ambulatory Rotations (Blocks 2-25)
    for (let block = 1; block <= 24; block++) {
        const ambulatoryGroup = ((block - 1) % 5) + 1; // Groups 1-5 rotating
        residents.forEach((resident, residentIndex) => {
            if (resident.group === ambulatoryGroup && schedule[residentIndex][block] === '') {
                schedule[residentIndex][block] = 'Ambulatory';
            }
        });
    }

    // 2. Assign Vacations (with highest priority)
    residents.forEach((resident, residentIndex) => {
        // Vacation 1
        const v1 = resident.vacation1 - 1;
        if (v1 >= 0 && v1 < 26) {
            if (schedule[residentIndex][v1] === 'Ambulatory') {
                // Find next available block for ambulatory
                for (let b = v1 + 1; b < 26; b++) {
                    if (getAmbulatoryGroupForBlock(b + 1) === resident.group && 
                        schedule[residentIndex][b] === '') {
                        schedule[residentIndex][b] = 'Ambulatory';
                        break;
                    }
                }
            }
            schedule[residentIndex][v1] = 'Vacation';
        }

        // Vacation 2
        const v2 = resident.vacation2 - 1;
        if (v2 >= 0 && v2 < 26 && v2 !== v1) {
            if (schedule[residentIndex][v2] === 'Ambulatory') {
                // Find next available block for ambulatory
                for (let b = v2 + 1; b < 26; b++) {
                    if (getAmbulatoryGroupForBlock(b + 1) === resident.group && 
                        schedule[residentIndex][b] === '') {
                        schedule[residentIndex][b] = 'Ambulatory';
                        break;
                    }
                }
            }
            schedule[residentIndex][v2] = 'Vacation';
        }
    });

    // 3. Assign Mandatory Rotations (exactly required number per block)
    const mandatoryRotations = validateMandatoryRotations(residents, rotations);
    
    mandatoryRotations.forEach(rotation => {
        const required = rotation.requiredCount || 1;
        
        for (let block = 0; block < 26; block++) {
            let assigned = 0;
            const eligibleResidents = residents
                .map((r, i) => ({ ...r, index: i }))
                .filter(resident => {
                    return getIncludedRotations(resident, rotations).some(r => r.name === rotation.name) &&
                           schedule[resident.index][block] === '';
                });

            // Try to assign required residents
            while (assigned < required && eligibleResidents.length > 0) {
                const resident = eligibleResidents.pop();
                schedule[resident.index][block] = rotation.name;
                rotationAssignments[rotation.name][block]++;
                assigned++;
                
                // Update metrics
                if (rotation.name === 'ICU Day' || rotation.name === 'CCU Day') {
                    metrics.unitDays[resident.index]++;
                } else if (rotation.name === 'ICU Night' || rotation.name === 'CCU Night' || rotation.name === 'NF') {
                    metrics.nights[resident.index]++;
                } else if (rotation.name === 'Team A' || rotation.name === 'Team B' || rotation.name === 'IMP') {
                    metrics.floors[resident.index]++;
                }
            }

            if (assigned < required) {
                violations.push({
                    type: 'MISSING_MANDATORY',
                    block: block + 1,
                    rotation: rotation.name,
                    required,
                    assigned,
                    message: `Only ${assigned} of ${required} required residents assigned to ${rotation.name} in block ${block + 1}`
                });
            }
        }
    });

    // 4. Assign Non-Mandatory Rotations
    residents.forEach((resident, residentIndex) => {
        const residentRotations = getIncludedRotations(resident, rotations);
        
        // Process rotations by priority: exact > minMax > others
        const prioritySorted = [...residentRotations].sort((a, b) => {
            if (a.type === 'exact' && b.type !== 'exact') return -1;
            if (b.type === 'exact' && a.type !== 'exact') return 1;
            if (a.type === 'minMax' && b.type !== 'minMax') return -1;
            if (b.type === 'minMax' && a.type !== 'minMax') return 1;
            return 0;
        });

        prioritySorted.forEach(rotation => {
            const currentCount = schedule[residentIndex].filter(r => r === rotation.name).length;
            let targetCount = rotation.type === 'exact' ? parseInt(rotation.exact) : 
                           (rotation.type === 'minMax' ? parseInt(rotation.min) : 0);

            while (currentCount < targetCount) {
                let bestBlock = -1;
                let bestScore = -Infinity;

                // Find best block to assign this rotation
                for (let block = 0; block < 26; block++) {
                    if (schedule[residentIndex][block] !== '') continue;

                    // Check scheduling rules
                    const prev = block > 0 ? schedule[residentIndex][block - 1] : null;
                    const next = block < 25 ? schedule[residentIndex][block + 1] : null;
                    
                    if (isNightRotation(rotation.name)) {
                        if (prev && isNightRotation(prev)) continue;
                        if (next && !isAllowedAfterNight(next)) continue;
                    }
                    
                    if (isUnitDayRotation(rotation.name)) {
                        if (prev && isUnitDayRotation(prev)) continue;
                    }

                    // Calculate score based on balancing needs
                    let score = 0;
                    
                    // Prefer blocks that help balance metrics
                    const currentUnitDays = metrics.unitDays[residentIndex];
                    const currentNights = metrics.nights[residentIndex];
                    const currentFloors = metrics.floors[residentIndex];
                    
                    if (rotation.name === 'ICU Day' || rotation.name === 'CCU Day') {
                        const avg = metrics.unitDays.reduce((a, b) => a + b, 0) / residents.length;
                        score = (avg - currentUnitDays) * 10;
                    } else if (rotation.name === 'ICU Night' || rotation.name === 'CCU Night' || rotation.name === 'NF') {
                        const avg = metrics.nights.reduce((a, b) => a + b, 0) / residents.length;
                        score = (avg - currentNights) * 10;
                    } else if (rotation.name === 'Team A' || rotation.name === 'Team B' || rotation.name === 'IMP') {
                        const avg = metrics.floors.reduce((a, b) => a + b, 0) / residents.length;
                        score = (avg - currentFloors) * 10;
                    }

                    // Prefer blocks where this rotation isn't already assigned
                    if (rotationAssignments[rotation.name][block] > 0) {
                        score -= 5;
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestBlock = block;
                    }
                }

                if (bestBlock >= 0) {
                    schedule[residentIndex][bestBlock] = rotation.name;
                    rotationAssignments[rotation.name][bestBlock]++;
                    
                    // Update metrics
                    if (rotation.name === 'ICU Day' || rotation.name === 'CCU Day') {
                        metrics.unitDays[residentIndex]++;
                    } else if (rotation.name === 'ICU Night' || rotation.name === 'CCU Night' || rotation.name === 'NF') {
                        metrics.nights[residentIndex]++;
                    } else if (rotation.name === 'Team A' || rotation.name === 'Team B' || rotation.name === 'IMP') {
                        metrics.floors[residentIndex]++;
                    }
                } else {
                    violations.push({
                        type: 'UNMET_REQUIREMENT',
                        resident: resident.name,
                        rotation: rotation.name,
                        required: targetCount,
                        assigned: currentCount,
                        message: `Could not assign required ${rotation.name} rotations to ${resident.name}`
                    });
                    break;
                }
            }
        });
    });

    // 5. Fill remaining empty blocks with available rotations
    residents.forEach((resident, residentIndex) => {
        const residentRotations = getIncludedRotations(resident, rotations);
        
        for (let block = 0; block < 26; block++) {
            if (schedule[residentIndex][block] === '') {
                // Find a rotation that this resident can take
                const availableRotations = residentRotations.filter(r => {
                    const currentCount = schedule[residentIndex].filter(x => x === r.name).length;
                    const max = r.type === 'minMax' ? parseInt(r.max) : 
                               (r.type === 'exact' ? parseInt(r.exact) : Infinity);
                    return currentCount < max;
                });

                if (availableRotations.length > 0) {
                    // Prefer rotations that help balance the schedule
                    availableRotations.sort((a, b) => {
                        // Prioritize rotations that are under-assigned
                        const aCount = schedule[residentIndex].filter(x => x === a.name).length;
                        const bCount = schedule[residentIndex].filter(x => x === b.name).length;
                        return aCount - bCount;
                    });

                    schedule[residentIndex][block] = availableRotations[0].name;
                    rotationAssignments[availableRotations[0].name][block]++;
                    
                    // Update metrics
                    if (availableRotations[0].name === 'ICU Day' || availableRotations[0].name === 'CCU Day') {
                        metrics.unitDays[residentIndex]++;
                    } else if (availableRotations[0].name === 'ICU Night' || availableRotations[0].name === 'CCU Night' || availableRotations[0].name === 'NF') {
                        metrics.nights[residentIndex]++;
                    } else if (availableRotations[0].name === 'Team A' || availableRotations[0].name === 'Team B' || availableRotations[0].name === 'IMP') {
                        metrics.floors[residentIndex]++;
                    }
                } else {
                    schedule[residentIndex][block] = 'Ambulatory'; // Fallback
                }
            }
        }
    });

    // 6. Validate and collect violations
    residents.forEach((resident, residentIndex) => {
        // Check consecutive rotations
        for (let block = 0; block < 25; block++) {
            const current = schedule[residentIndex][block];
            const next = schedule[residentIndex][block + 1];
            
            if (isNightRotation(current) && isNightRotation(next)) {
                violations.push({
                    type: 'CONSECUTIVE_NIGHTS',
                    resident: resident.name,
                    block: block + 1,
                    message: `Consecutive night rotations in blocks ${block + 1}-${block + 2}`
                });
            }
            
            if (isNightRotation(current) && next && !isAllowedAfterNight(next)) {
                violations.push({
                    type: 'INVALID_AFTER_NIGHT',
                    resident: resident.name,
                    block: block + 1,
                    message: `Invalid rotation (${next}) after night shift in block ${block + 1}`
                });
            }
            
            if (isUnitDayRotation(current) && isUnitDayRotation(next)) {
                violations.push({
                    type: 'CONSECUTIVE_UNIT_DAYS',
                    resident: resident.name,
                    block: block + 1,
                    message: `Consecutive unit day rotations in blocks ${block + 1}-${block + 2}`
                });
            }
        }
    });

    // Calculate final metrics
    const finalMetrics = residents.map((resident, index) => ({
        resident: resident.name,
        unitDays: metrics.unitDays[index],
        nights: metrics.nights[index],
        floors: metrics.floors[index]
    }));

    return {
        schedule,
        violations,
        rotationAssignments,
        metrics: finalMetrics,
        fillingStatus: calculateFillingStatus(residents, rotations, schedule)
    };
};

const calculateFillingStatus = (residents, rotations, schedule) => {
    const status = [];
    const allRotations = Object.values(rotations).flat().filter(r => r.included);
    
    for (let block = 0; block < 26; block++) {
        const blockStatus = {};
        
        allRotations.forEach(rotation => {
            const required = rotation.isMandatory ? (rotation.requiredCount || 1) : 1;
            const assigned = residents.filter((_, i) => schedule[i][block] === rotation.name).length;
            blockStatus[rotation.name] = `${assigned}/${required}`;
        });
        
        status.push(blockStatus);
    }
    
    return status;
};