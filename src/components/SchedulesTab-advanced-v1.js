// src/components/SchedulesTab.js
import React, { useState, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  TextField,
  Checkbox,
  ListItemText,
  Switch,
  FormControlLabel,
  Stack,
} from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import { generateMandatorySchedule } from '../utils/mandatoryRotations';
import { generateNonMandatorySchedule } from '../utils/nonMandatoryRotations';
import { fillElectives } from '../utils/electiveFill';
import { getBlockDates } from '../utils/uiUtils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import UndoIcon from '@mui/icons-material/Undo';

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const SchedulesTab = ({ residents, rotations, selectedSet }) => {
  const [scheduleData, setScheduleData] = useState(
    Object.fromEntries(residents.map((r) => [r.name, Array(26).fill('-')]))
  );
  const [rotationCounts, setRotationCounts] = useState(
    Object.fromEntries(residents.map((r) => [r.name, {}]))
  );
  const [history, setHistory] = useState([]); // History stack for undo
  const [showRotationCounts, setShowRotationCounts] = useState(false);
  const blockDates = getBlockDates();
  const fileInputRef = useRef(null);

  const rotationNames = [
    ...(rotations[selectedSet] || []).filter((r) => r.included).map((r) => r.name),
    ...(rotations[selectedSet] && rotations[selectedSet].some((r) => r.name === 'Ambulatory') ? [] : ['Ambulatory']),
  ];

  const staticRotationColors = {
    Elective: '#FFD700',
    NF: '#87CEEB',
    'Team A': '#98FB98',
    'Team B': '#85bb74',
    IMP: '#DDA0DD',
    MAR: '#F0E68C',
    'CCU Day': '#FFB6C1',
    'CCU Night': '#B0C4DE',
    'ICU Day': '#FF6347',
    'ICU Night': '#4682B4',
    Geriatrics: '#EEE8AA',
    ID: '#20B2AA',
    Cardio: '#FF4500',
    Neuro: '#9370DB',
    Renal: '#00CED1',
    ED: '#E69138',
    MON: '#ADFF2F',
    MOD: '#FF69B4',
    Coverage: '#7FFFD4',
    '-': '#F0F0F0',
    Vacation: '#999999',
    Ambulatory: '#9b5d66',
  };

  const rotationOptions = [
    'Clear', 'Elective', 'NF', 'Team A', 'Team B', 'IMP', 'MAR', 'CCU Day', 'CCU Night',
    'ICU Day', 'ICU Night', 'Geriatrics', 'ID', 'Cardio', 'Neuro', 'Renal', 'ED',
    'MON', 'MOD', 'Coverage', 'Ambulatory', 'Custom'
  ];

  const [customRotationColors, setCustomRotationColors] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [customRotation, setCustomRotation] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedResidents, setSelectedResidents] = useState(residents.map((r) => r.name));
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const rotationColors = useMemo(() => {
    const allRotations = new Set([
      ...Object.keys(scheduleData).flatMap((name) => scheduleData[name]),
      ...rotationOptions.filter((opt) => opt !== 'Clear' && opt !== 'Custom'),
    ]);
    const updatedCustomColors = { ...customRotationColors };
    allRotations.forEach((rotation) => {
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
      (counts['IMP'] || 0) +
      (counts['MAR'] || 0) +
      (counts['MOD'] || 0)
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

  // Helper to save current state to history
  const saveToHistory = () => {
    setHistory((prev) => {
      const newHistory = [...prev, { scheduleData, rotationCounts }];
      if (newHistory.length > 10) newHistory.shift(); // Limit to 10 steps
      return newHistory;
    });
  };

  const handleStep1 = () => {
    saveToHistory();
    const { schedule, rotationCounts: updatedRotationCounts } = generateMandatorySchedule(residents, rotations[selectedSet]);
    setScheduleData(schedule);
    setRotationCounts(updatedRotationCounts);
    setSelectedResidents(residents.map((r) => r.name));
  };

  const handleStep2 = () => {
    saveToHistory();
    const { schedule, rotationCounts: updatedRotationCounts } = generateNonMandatorySchedule(
      residents,
      rotations[selectedSet],
      scheduleData,
      rotationCounts
    );
    setScheduleData(schedule);
    setRotationCounts(updatedRotationCounts);
  };

  const handleStep3 = () => {
    saveToHistory();
    setFilterAnchorEl(null); // Close filter menu
    setContextMenu(null); // Close context menu
    const { schedule, rotationCounts: updatedRotationCounts } = fillElectives(
      residents,
      rotations[selectedSet],
      scheduleData,
      rotationCounts
    );
    setScheduleData(schedule);
    setRotationCounts(updatedRotationCounts);
  };

  const handleRefresh = () => {
    saveToHistory();
    setScheduleData(Object.fromEntries(residents.map((r) => [r.name, Array(26).fill('-')])));
    setRotationCounts(Object.fromEntries(residents.map((r) => [r.name, {}])));
    setSelectedResidents(residents.map((r) => r.name));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setScheduleData(lastState.scheduleData);
    setRotationCounts(lastState.rotationCounts);
    setHistory((prev) => prev.slice(0, -1)); // Remove the last state
  };

  const blockAssignments = getBlockAssignments();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
    saveToHistory(); // Save state before edit
    if (option === 'Clear') {
      setScheduleData((prev) => ({
        ...prev,
        [residentName]: prev[residentName].map((r, i) => (i === blockIndex ? '-' : r)),
      }));
      setRotationCounts((prev) => {
        const prevRotation = scheduleData[residentName][blockIndex];
        if (prevRotation !== '-') {
          const newCounts = { ...prev[residentName] };
          newCounts[prevRotation] = (newCounts[prevRotation] || 0) - 1;
          if (newCounts[prevRotation] === 0) delete newCounts[prevRotation];
          return { ...prev, [residentName]: newCounts };
        }
        return prev;
      });
      handleClose();
    } else if (option === 'Custom') {
      // Wait for custom input
    } else {
      setScheduleData((prev) => ({
        ...prev,
        [residentName]: prev[residentName].map((r, i) => (i === blockIndex ? option : r)),
      }));
      setRotationCounts((prev) => {
        const prevRotation = scheduleData[residentName][blockIndex];
        const newCounts = { ...prev[residentName] };
        if (prevRotation !== '-') {
          newCounts[prevRotation] = (newCounts[prevRotation] || 0) - 1;
          if (newCounts[prevRotation] === 0) delete newCounts[prevRotation];
        }
        newCounts[option] = (newCounts[option] || 0) + 1;
        return { ...prev, [residentName]: newCounts };
      });
      handleClose();
    }
  };

  const handleCustomSubmit = (e) => {
    if (e.key === 'Enter' && customRotation.trim() && selectedCell) {
      saveToHistory(); // Save state before edit
      const { residentName, blockIndex } = selectedCell;
      setScheduleData((prev) => ({
        ...prev,
        [residentName]: prev[residentName].map((r, i) => (i === blockIndex ? customRotation.trim() : r)),
      }));
      setRotationCounts((prev) => {
        const prevRotation = scheduleData[residentName][blockIndex];
        const newCounts = { ...prev[residentName] };
        if (prevRotation !== '-') {
          newCounts[prevRotation] = (newCounts[prevRotation] || 0) - 1;
          if (newCounts[prevRotation] === 0) delete newCounts[prevRotation];
        }
        newCounts[customRotation.trim()] = (newCounts[customRotation.trim()] || 0) + 1;
        return { ...prev, [residentName]: newCounts };
      });
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

    const rotationCount = rotationCounts[residentName][rotation] || 0;

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

    saveToHistory(); // Save state before drag
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

      const newRotationCounts = { ...rotationCounts };
      [activeResident, overResident].forEach((residentName) => {
        newRotationCounts[residentName] = {};
        newSchedule[residentName].forEach((rotation) => {
          if (rotation !== '-') {
            newRotationCounts[residentName][rotation] = (newRotationCounts[residentName][rotation] || 0) + 1;
          }
        });
      });

      setRotationCounts(newRotationCounts);
      return newSchedule;
    });
  };

  const handleSelectAll = () => setSelectedResidents(residents.map((r) => r.name));
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

    const table1Headers = ['Resident', ...Array.from({ length: 26 }, (_, i) => `Block ${i + 1}\n${blockDates[i]}`)];
    const table1Data = residents
      .filter((resident) => selectedResidents.includes(resident.name))
      .map((resident) => [resident.name, ...scheduleData[resident.name]]);
    const table1Ws = XLSX.utils.aoa_to_sheet([table1Headers, ...table1Data]);
    XLSX.utils.book_append_sheet(wb, table1Ws, 'Resident Schedule');

    const table2Headers = ['Resident', ...rotationNames, 'Nights', 'Units', 'Floors', 'Total'];
    const table2Data = residents.map((resident) => {
      const counts = getRotationCounts(resident.name);
      return [
        resident.name,
        ...rotationNames.map((rotation) => counts[rotation]),
        counts['Nights'],
        counts['Units'],
        counts['Floors'],
        counts['Total'],
      ];
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

    const table3Headers = ['Block', ...rotationNames.map((rotation) => `${rotation} (Assigned/Required)`)];
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

  const handleSaveSchedule = () => {
    const dataToSave = JSON.stringify({ schedule: scheduleData, rotationCounts }, null, 2);
    const blob = new Blob([dataToSave], { type: 'application/json' });
    saveAs(blob, 'schedule_data.json');
  };

  const handleLoadSchedule = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedData = JSON.parse(e.target.result);
        const residentNames = residents.map((r) => r.name);
        const isValidSchedule = Object.keys(loadedData.schedule).every(
          (name) => residentNames.includes(name) && Array.isArray(loadedData.schedule[name]) && loadedData.schedule[name].length === 26
        );
        const isValidCounts = Object.keys(loadedData.rotationCounts).every((name) => residentNames.includes(name));
        if (isValidSchedule && isValidCounts) {
          saveToHistory(); // Save current state before loading
          setScheduleData(loadedData.schedule);
          setRotationCounts(loadedData.rotationCounts);
          setSelectedResidents(residents.map((r) => r.name));
        } else {
          alert('Invalid schedule data: Ensure the file matches the resident list and block structure.');
        }
      } catch (error) {
        alert('Error loading schedule data: Invalid JSON format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">Resident Schedule by Block</Typography>
          <FormControlLabel
            control={<Switch checked={showRotationCounts} onChange={(e) => setShowRotationCounts(e.target.checked)} />}
            label="Show Counts"
            sx={{ m: 0 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ButtonGroup variant="outlined" color="primary" size="small">
            <Button onClick={handleSelectAll}>Select All</Button>
            <Button onClick={handleUnselectAll}>Clear All</Button>
            <Button onClick={handleFilterClick}>Filter</Button>
          </ButtonGroup>
        </Box>
      </Stack>

      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={handleStep1}>
          Step 1: Mandatory Rotations
        </Button>
        <Button variant="contained" onClick={handleStep2}>
          Step 2: Non-Mandatory Rotations
        </Button>
        <Button variant="contained" onClick={handleStep3}>
          Step 3: Fill Electives
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <ButtonGroup variant="contained" color="primary" size="small">
          <Button startIcon={<SaveIcon />} onClick={handleSaveSchedule}>Save</Button>
          <Button startIcon={<UploadFileIcon />} onClick={triggerFileInput}>Load</Button>
          <Button startIcon={<RefreshIcon />} onClick={handleRefresh}>Refresh</Button>
          <Button startIcon={<DownloadIcon />} onClick={exportAllTablesToExcel}>Export</Button>
          <Button startIcon={<UndoIcon />} onClick={handleUndo} disabled={history.length === 0}>Undo</Button>
        </ButtonGroup>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleLoadSchedule}
        />
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
        <TableContainer component={Paper} sx={{ mb: 3, border: '1px solid #e0e0e0', maxHeight: 900, overflow: 'auto' }}>
          <Table sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5', position: 'sticky', top: 0, zIndex: 2 }}>
                <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold', position: 'sticky', left: 0, bgcolor: '#f5f5f5', zIndex: 3 }}>
                  Resident
                </TableCell>
                {Array.from({ length: 26 }, (_, i) => (
                  <TableCell key={i} align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold', fontSize: '0.8rem' }}>
                    Block {i + 1}
                    <br />
                    {blockDates[i]}
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
                <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>
                  {rotation}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Nights</TableCell>
              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Units</TableCell>
              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Floors</TableCell>
              <TableCell align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Total</TableCell>
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
                    <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>
                      {counts[rotation]}
                    </TableCell>
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
                <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>
                  {rotation}
                </TableCell>
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