// src/components/SchedulesTab.js
import React, { useState, useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Menu, MenuItem, TextField, Checkbox, ListItemText } from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import { generateSchedule } from '../../utils/scheduleUtils';
import { getBlockDates } from '../../utils/uiUtils';

// Function to generate a random hex color
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const SchedulesTab = ({ residents, rotations, selectedSet }) => {
  const [scheduleData, setScheduleData] = useState(generateSchedule(residents, rotations[selectedSet]));
  const blockDates = getBlockDates();

  const rotationNames = [
    ...(rotations[selectedSet] || []).filter((r) => r.included).map((r) => r.name),
    ...(rotations[selectedSet] && rotations[selectedSet].some((r) => r.name === 'Ambulatory') ? [] : ['Ambulatory']),
  ];

  const staticRotationColors = {
    'Elective': '#FFD700',      // Gold
    'NF': '#87CEEB',           // Sky Blue
    'Team A': '#98FB98',       // Pale Green
    'Team B': '#FFA07A',       // Light Salmon
    'IMP': '#DDA0DD',          // Plum
    'MAR': '#F0E68C',          // Khaki
    'CCU Day': '#FFB6C1',      // Light Pink
    'CCU Night': '#B0C4DE',    // Light Steel Blue
    'ICU Day': '#FF6347',      // Tomato
    'ICU Night': '#4682B4',    // Steel Blue
    'Geriatrics': '#EEE8AA',   // Pale Goldenrod
    'ID': '#20B2AA',           // Light Sea Green
    'Cardio': '#FF4500',       // Orange Red
    'Neuro': '#9370DB',        // Medium Purple
    'Renal': '#00CED1',        // Dark Turquoise
    'ED': '#E69138',           // Light Orange    
    'MON': '#ADFF2F',          // Green Yellow
    'MOD': '#FF69B4',          // Hot Pink
    'Coverage': '#7FFFD4',     // Aquamarine
    '-': '#F0F0F0',            // Light Gray (for cleared)
    'Vacation': '#999999',     // Light Yellow
    'Ambulatory': '#d70ee6',   // Purple
  };

  const rotationOptions = [
    'Clear', 'Elective', 'NF', 'Team A', 'Team B', 'IMP', 'MAR', 'CCU Day', 'CCU Night',
    'ICU Day', 'ICU Night', 'Geriatrics', 'ID', 'Cardio', 'Neuro', 'Renal', 'ED',
    'MON', 'MOD', 'Coverage', 'Ambulatory', 'Custom'
  ];

  const [customRotationColors, setCustomRotationColors] = useState({});
  const rotationColors = useMemo(() => {
    const allRotations = new Set([
      ...Object.keys(scheduleData).flatMap(name => scheduleData[name]),
      ...rotationOptions.filter(opt => opt !== 'Clear' && opt !== 'Custom')
    ]);
    const updatedCustomColors = { ...customRotationColors };
    allRotations.forEach(rotation => {
      if (!staticRotationColors[rotation] && !updatedCustomColors[rotation] && rotation) {
        updatedCustomColors[rotation] = getRandomColor();
      }
    });
    setCustomRotationColors(updatedCustomColors);
    return { ...staticRotationColors, ...updatedCustomColors };
  }, [scheduleData]);

  const getRotationCounts = (residentName) => {
    const counts = {};
    rotationNames.forEach((rotation) => {
      counts[rotation] = scheduleData[residentName].filter((block) => block === rotation).length;
    });
    // Add aggregate counts
    counts['Nights'] = (
      (counts['NF'] || 0) +
      (counts['CCU Night'] || 0) +
      (counts['ICU Night'] || 0) +
      (counts['MON'] || 0)
    );
    counts['Units'] = (
      (counts['ICU Day'] || 0) +
      (counts['CCU Day'] || 0)
    );
    counts['Floors'] = (
      (counts['Team A'] || 0) +
      (counts['Team B'] || 0) +
      (counts['IMP'] || 0)
    );
    return counts;
  };

  const getBlockAssignments = () => {
    const assignments = Array.from({ length: 26 }, () => ({}));
    residents.forEach((resident) => {
      scheduleData[resident.name].forEach((rotation, block) => {
        if (rotation !== '-' && rotation !== 'Vacation') {
          assignments[block][rotation] = (assignments[block][rotation] || 0) + 1;
        }
      });
    });
    return assignments;
  };

  const handleRefresh = () => {
    setScheduleData(generateSchedule(residents, rotations[selectedSet]));
    setSelectedResidents(residents.map(r => r.name));
  };

  const blockAssignments = getBlockAssignments();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [contextMenu, setContextMenu] = useState(null);
  const [customRotation, setCustomRotation] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedResidents, setSelectedResidents] = useState(residents.map(r => r.name));
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const handleContextMenu = (event, residentName, blockIndex) => {
    event.preventDefault();
    setSelectedCell({ residentName, blockIndex });
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
    });
  };

  const handleClose = () => {
    setContextMenu(null);
    setCustomRotation('');
  };

  const handleMenuClick = (option) => {
    if (!selectedCell) return;

    const { residentName, blockIndex } = selectedCell;
    if (option === 'Clear') {
      setScheduleData((prev) => ({
        ...prev,
        [residentName]: prev[residentName].map((r, i) => (i === blockIndex ? '-' : r)),
      }));
      handleClose();
    } else if (option === 'Custom') {
      // Wait for custom input
    } else {
      setScheduleData((prev) => ({
        ...prev,
        [residentName]: prev[residentName].map((r, i) => (i === blockIndex ? option : r)),
      }));
      handleClose();
    }
  };

  const handleCustomSubmit = (e) => {
    if (e.key === 'Enter' && customRotation.trim() && selectedCell) {
      const { residentName, blockIndex } = selectedCell;
      setScheduleData((prev) => ({
        ...prev,
        [residentName]: prev[residentName].map((r, i) => (i === blockIndex ? customRotation.trim() : r)),
      }));
      handleClose();
    }
  };

  const DraggableCell = ({ residentName, blockIndex, rotation }) => {
    const { attributes, listeners, setNodeRef: setDragRef, transform } = useDraggable({
      id: `${residentName}-${blockIndex}`,
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
      id: `${residentName}-${blockIndex}`,
    });

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: transform ? 0.5 : 1,
      backgroundColor: isOver ? '#e0e0e0' : rotationColors[rotation] || '#E0E0E0',
      border: '1px solid #e0e0e0',
      padding: '8px',
      textAlign: 'center',
      cursor: 'grab',
    };

    return (
      <TableCell
        ref={(node) => {
          setDragRef(node);
          setDropRef(node);
        }}
        style={style}
        {...attributes}
        {...listeners}
        onContextMenu={(e) => handleContextMenu(e, residentName, blockIndex)}
      >
        {rotation}
      </TableCell>
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const [activeResident, activeBlock] = active.id.split('-');
    const [overResident, overBlock] = over.id.split('-');
    const activeBlockIndex = parseInt(activeBlock, 10);
    const overBlockIndex = parseInt(overBlock, 10);

    setScheduleData((prev) => {
      const newSchedule = { ...prev };
      newSchedule[activeResident] = [...newSchedule[activeResident]];
      newSchedule[overResident] = [...newSchedule[overResident]];
      const activeRotation = newSchedule[activeResident][activeBlockIndex];
      const overRotation = newSchedule[overResident][overBlockIndex];
      newSchedule[activeResident][activeBlockIndex] = overRotation;
      newSchedule[overResident][overBlockIndex] = activeRotation;
      return newSchedule;
    });
  };

  const handleSelectAll = () => setSelectedResidents(residents.map(r => r.name));
  const handleUnselectAll = () => setSelectedResidents([]);
  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget);
  const handleFilterClose = () => setFilterAnchorEl(null);
  const handleResidentToggle = (residentName) => () => {
    setSelectedResidents((prev) =>
      prev.includes(residentName)
        ? prev.filter((name) => name !== residentName)
        : [...prev, residentName]
    );
  };

  const exportTable1ToCSV = () => {
    const headers = ['Resident', ...Array.from({ length: 26 }, (_, i) => `Block ${i + 1}`)];
    const rows = residents
      .filter((resident) => selectedResidents.includes(resident.name))
      .map((resident) => [resident.name, ...scheduleData[resident.name]]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'resident_schedule.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTable2ToCSV = () => {
    const headers = ['Resident', ...rotationNames, 'Nights', 'Units', 'Floors'];
    const rows = residents.map((resident) => {
      const counts = getRotationCounts(resident.name);
      return [resident.name, ...rotationNames.map(rotation => counts[rotation]), counts['Nights'], counts['Units'], counts['Floors']];
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rotation_counts.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTable3ToCSV = () => {
    const headers = ['Block', ...rotationNames.map(rotation => `${rotation} (Assigned/Required)`)];
    const rows = Array.from({ length: 26 }, (_, block) => {
      const blockNum = block + 1;
      return [
        `Block ${blockNum}`,
        ...rotationNames.map((rotation) => {
          const assigned = blockAssignments[block][rotation] || 0;
          const rotationData = (rotations[selectedSet] || []).find((r) => r.name === rotation);
          const required = rotationData?.mandatory && rotationData.requiredPerBlock ? rotationData.requiredPerBlock : 1;
          return `${assigned}/${required}`;
        }),
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'block_filling_status.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Resident Schedule by Block</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="primary" onClick={handleSelectAll}>Select All</Button>
          <Button variant="outlined" color="primary" onClick={handleUnselectAll}>Unselect All</Button>
          <Button variant="outlined" color="primary" onClick={handleFilterClick}>Filter</Button>
          <Button variant="outlined" color="primary" onClick={handleRefresh}>Refresh</Button>
          <Button variant="outlined" color="primary" onClick={exportTable1ToCSV}>Export to CSV</Button>
        </Box>
      </Box>
      <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleFilterClose}>
        {residents.map((resident) => (
          <MenuItem key={resident.name} onClick={handleResidentToggle(resident.name)}>
            <Checkbox checked={selectedResidents.includes(resident.name)} />
            <ListItemText primary={resident.name} />
          </MenuItem>
        ))}
      </Menu>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <TableContainer component={Paper} sx={{ mb: 3, border: '1px solid #e0e0e0', maxHeight: 600, overflow: 'auto' }}>
          <Table sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5', position: 'sticky', top: 0, zIndex: 2 }}>
                <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold', position: 'sticky', left: 0, bgcolor: '#f5f5f5', zIndex: 3 }}>
                  Resident
                </TableCell>
                {Array.from({ length: 26 }, (_, i) => (
                  <TableCell key={i} align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>
                    Block {i + 1}<br />{blockDates[i]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {residents
                .filter((resident) => selectedResidents.includes(resident.name))
                .map((resident) => (
                  <TableRow key={resident.name}>
                    <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, position: 'sticky', left: 0, bgcolor: '#fafafa', zIndex: 1 }}>
                      {resident.name}
                    </TableCell>
                    {scheduleData[resident.name].map((rotation, blockIndex) => (
                      <DraggableCell
                        key={blockIndex}
                        residentName={resident.name}
                        blockIndex={blockIndex}
                        rotation={rotation}
                      />
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DndContext>

      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        {rotationOptions.map((option) => (
          <MenuItem
            key={option}
            onClick={() => handleMenuClick(option)}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
          >
            {option}
            {option === 'Custom' && contextMenu && (
              <TextField
                size="small"
                value={customRotation}
                onChange={(e) => setCustomRotation(e.target.value)}
                onKeyDown={handleCustomSubmit}
                placeholder="Type rotation"
                autoFocus
                sx={{ mt: 1, width: '150px' }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </MenuItem>
        ))}
      </Menu>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Rotation Counts per Resident</Typography>
        <Button variant="outlined" color="primary" onClick={exportTable2ToCSV}>Export to CSV</Button>
      </Box>
      <TableContainer component={Paper} sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <Table sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Resident</TableCell>
              {rotationNames.map((rotation) => (
                <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>{rotation}</TableCell>
              ))}
              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Nights</TableCell>
              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Units</TableCell>
              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Floors</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {residents.map((resident) => {
              const counts = getRotationCounts(resident.name);
              return (
                <TableRow key={resident.name}>
                  <TableCell sx={{ border: '1px solid #e0e0e0', p: 1 }}>{resident.name}</TableCell>
                  {rotationNames.map((rotation) => (
                    <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>{counts[rotation]}</TableCell>
                  ))}
                  <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>{counts['Nights']}</TableCell>
                  <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>{counts['Units']}</TableCell>
                  <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>{counts['Floors']}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Block Filling Status</Typography>
        <Button variant="outlined" color="primary" onClick={exportTable3ToCSV}>Export to CSV</Button>
      </Box>
      <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
        <Table sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Block</TableCell>
              {rotationNames.map((rotation) => (
                <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>{rotation}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 26 }, (_, block) => {
              const blockNum = block + 1;
              return (
                <TableRow key={blockNum}>
                  <TableCell sx={{ border: '1px solid #e0e0e0', p: 1 }}>Block {blockNum}</TableCell>
                  {rotationNames.map((rotation) => {
                    const assigned = blockAssignments[block][rotation] || 0;
                    const rotationData = (rotations[selectedSet] || []).find((r) => r.name === rotation);
                    const required = rotationData?.mandatory && rotationData.requiredPerBlock ? rotationData.requiredPerBlock : 1;
                    const bgcolor = assigned > required ? '#cce5ff' : assigned === required ? '#ccffcc' : '#ffcccc';
                    return (
                      <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1, bgcolor }}>
                        {assigned} / {required}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SchedulesTab;