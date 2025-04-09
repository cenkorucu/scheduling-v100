// src/components/SchedulesTab.js
import React, { useState, useMemo, useRef } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Menu, MenuItem, TextField, Checkbox, ListItemText, Switch, FormControlLabel } from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import { generateSchedule } from '../utils/scheduleUtils';
import { getBlockDates } from '../utils/uiUtils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  const [showRotationCounts, setShowRotationCounts] = useState(false);
  const blockDates = getBlockDates();
  const fileInputRef = useRef(null); // Ref for hidden file input

  const rotationNames = [
    ...(rotations[selectedSet] || []).filter((r) => r.included).map((r) => r.name),
    ...(rotations[selectedSet] && rotations[selectedSet].some((r) => r.name === 'Ambulatory') ? [] : ['Ambulatory']),
  ];

  const staticRotationColors = {
    'Elective': '#FFD700',
    'NF': '#87CEEB',
    'Team A': '#98FB98',
    'Team B': '#FFA07A',
    'IMP': '#DDA0DD',
    'MAR': '#F0E68C',
    'CCU Day': '#FFB6C1',
    'CCU Night': '#B0C4DE',
    'ICU Day': '#FF6347',
    'ICU Night': '#4682B4',
    'Geriatrics': '#EEE8AA',
    'ID': '#20B2AA',
    'Cardio': '#FF4500',
    'Neuro': '#9370DB',
    'Renal': '#00CED1',
    'ED': '#E69138',
    'MON': '#ADFF2F',
    'MOD': '#FF69B4',
    'Coverage': '#7FFFD4',
    '-': '#F0F0F0',
    'Vacation': '#999999',
    'Ambulatory': '#d70ee6',
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
    counts['Total'] = counts['Nights'] + counts['Units'] + counts['Floors'];
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

    const counts = getRotationCounts(residentName);
    const rotationCount = counts[rotation] || 0;

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
        {showRotationCounts && rotation !== '-' && (
          <sup style={{ fontSize: '0.6rem', marginLeft: '2px' }}>{rotationCount}</sup>
        )}
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

  const exportAllTablesToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Table 1: Resident Schedule by Block
    const table1Headers = ['Resident', ...Array.from({ length: 26 }, (_, i) => `Block ${i + 1}\n${blockDates[i]}`)];
    const table1Data = residents
      .filter((resident) => selectedResidents.includes(resident.name))
      .map((resident) => [resident.name, ...scheduleData[resident.name]]);
    const table1Ws = XLSX.utils.aoa_to_sheet([table1Headers, ...table1Data]);
    XLSX.utils.book_append_sheet(wb, table1Ws, 'Resident Schedule');

    // Table 2: Rotation Counts per Resident
    const table2Headers = ['Resident', ...rotationNames, 'Nights', 'Units', 'Floors', 'Total (Nights+Units+Floors)'];
    const table2Data = residents.map((resident) => {
      const counts = getRotationCounts(resident.name);
      return [resident.name, ...rotationNames.map(rotation => counts[rotation]), counts['Nights'], counts['Units'], counts['Floors'], counts['Total']];
    });
    const table2Ws = XLSX.utils.aoa_to_sheet([table2Headers, ...table2Data]);
    table2Data.forEach((_, rowIndex) => {
      const totalCell = XLSX.utils.encode_cell({ r: rowIndex + 1, c: table2Headers.length - 1 });
      const nightsCell = XLSX.utils.encode_cell({ r: rowIndex + 1, c: table2Headers.indexOf('Nights') });
      const unitsCell = XLSX.utils.encode_cell({ r: rowIndex + 1, c: table2Headers.indexOf('Units') });
      const floorsCell = XLSX.utils.encode_cell({ r: rowIndex + 1, c: table2Headers.indexOf('Floors') });
      table2Ws[totalCell].f = `${nightsCell}+${unitsCell}+${floorsCell}`;
    });
    XLSX.utils.book_append_sheet(wb, table2Ws, 'Rotation Counts');

    // Table 3: Block Filling Status
    const table3Headers = ['Block', ...rotationNames.map(rotation => `${rotation} (Assigned/Required)`)];
    const table3Data = Array.from({ length: 26 }, (_, block) => {
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
    const table3Ws = XLSX.utils.aoa_to_sheet([table3Headers, ...table3Data]);
    XLSX.utils.book_append_sheet(wb, table3Ws, 'Block Filling');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'Resident_Schedules.xlsx');
  };

  // Save schedule data to JSON file
  const handleSaveSchedule = () => {
    const dataToSave = JSON.stringify(scheduleData, null, 2);
    const blob = new Blob([dataToSave], { type: 'application/json' });
    saveAs(blob, 'schedule_data.json');
  };

  // Load schedule data from JSON file
  const handleLoadSchedule = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedData = JSON.parse(e.target.result);
        // Basic validation: ensure loaded data matches resident names and block length
        const residentNames = residents.map(r => r.name);
        const isValid = Object.keys(loadedData).every(name => 
          residentNames.includes(name) && 
          Array.isArray(loadedData[name]) && 
          loadedData[name].length === 26
        );
        if (isValid) {
          setScheduleData(loadedData);
          setSelectedResidents(residents.map(r => r.name)); // Reset selection
        } else {
          alert('Invalid schedule data: Ensure the file matches the resident list and block structure.');
        }
      } catch (error) {
        alert('Error loading schedule data: Invalid JSON format.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Resident Schedule by Block</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={<Switch checked={showRotationCounts} onChange={(e) => setShowRotationCounts(e.target.checked)} />}
            label="Show Rotation Counts"
          />
          <Button variant="outlined" color="primary" onClick={handleSelectAll}>Select All</Button>
          <Button variant="outlined" color="primary" onClick={handleUnselectAll}>Unselect All</Button>
          <Button variant="outlined" color="primary" onClick={handleFilterClick}>Filter</Button>
          <Button variant="outlined" color="primary" onClick={handleRefresh}>Refresh</Button>
          <Button variant="outlined" color="primary" onClick={exportAllTablesToExcel}>Export All to Excel</Button>
          <Button variant="outlined" color="primary" onClick={handleSaveSchedule}>Save Schedule</Button>
          <Button variant="outlined" color="primary" onClick={triggerFileInput}>Load Schedule</Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleLoadSchedule}
          />
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
              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Total (Nights+Units+Floors)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {residents.map((resident, index) => {
              const counts = getRotationCounts(resident.name);
              const rowBgColor = index % 2 === 0 ? '#ffffff' : '#f5f5f5';
              return (
                <TableRow key={resident.name} sx={{ bgcolor: rowBgColor }}>
                  <TableCell sx={{ border: '1px solid #e0e0e0', p: 1 }}>{resident.name}</TableCell>
                  {rotationNames.map((rotation) => (
                    <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>{counts[rotation]}</TableCell>
                  ))}
                  <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>{counts['Nights']}</TableCell>
                  <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>{counts['Units']}</TableCell>
                  <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>{counts['Floors']}</TableCell>
                  <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>{counts['Total']}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Block Filling Status</Typography>
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
              const rowBgColor = block % 2 === 0 ? '#ffffff' : '#f5f5f5';
              return (
                <TableRow key={blockNum} sx={{ bgcolor: rowBgColor }}>
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