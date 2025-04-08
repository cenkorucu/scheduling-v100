import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

function SchedulesTab({ residents }) {
    const [schedule, setSchedule] = useState([]);

    useEffect(() => {
        if (!residents?.length) return;

        // Initialize empty schedule (26 blocks, 0-indexed)
        const newSchedule = Array.from({ length: 26 }, () => ({}));

        // Define the rotation pattern starting from block 2
        const getAmbulatoryGroup = (block) => {
            if (block === 2) return 2;  // Block 2: Group 2
            if (block === 3) return 3;  // Block 3: Group 3
            if (block === 4) return 4;  // Block 4: Group 4
            if (block === 5) return 5;  // Block 5: Group 5
            if (block === 6) return 1;  // Block 6: Group 1
            if (block === 7) return 2;  // Block 7: Group 2
            
            // After block 7, continue the pattern (3, 4, 5, 1, 2, 3, ...)
            const offset = block - 7;
            return ((offset - 1) % 5) + 1;
        };

        // Assign rotations from block 2 to 25
        for (let block = 2; block <= 25; block++) {
            const ambulatoryGroup = getAmbulatoryGroup(block);
            
            // Assign all residents a status for this block
            residents.forEach(resident => {
                if (resident.group === ambulatoryGroup) {
                    newSchedule[block - 1][resident.id] = 'Ambulatory';
                } else {
                    newSchedule[block - 1][resident.id] = 'Non-Ambulatory'; // Default for non-ambulatory residents
                }
            });
            
            console.log(`Block ${block}: Group ${ambulatoryGroup} assigned to Ambulatory`);
        }

        setSchedule(newSchedule);
    }, [residents]);

    return (
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                <thead>
                    <tr>
                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>
                            Resident (Group)
                        </th>
                        {Array.from({ length: 26 }, (_, i) => (
                            <th key={i} style={{ border: '1px solid #ccc', padding: '8px' }}>
                                {i + 1}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {residents.map(resident => (
                        <tr key={resident.id}>
                            <td style={{ 
                                border: '1px solid #ccc', 
                                padding: '8px', 
                                fontWeight: 'bold' 
                            }}>
                                {resident.name} (G{resident.group})
                            </td>
                            {Array.from({ length: 26 }, (_, block) => (
                                <td key={block} style={{ 
                                    border: '1px solid #ccc', 
                                    padding: '8px',
                                    backgroundColor: schedule[block]?.[resident.id] === 'Ambulatory' ? 
                                        '#e8f5e9' : '#fff'
                                }}>
                                    {schedule[block]?.[resident.id] || '-'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </Box>
    );
}

export default SchedulesTab;