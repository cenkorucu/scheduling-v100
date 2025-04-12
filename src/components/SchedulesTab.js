import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
  </div>
);

const SchedulesTab = ({ residents = [], rotations = {}, selectedSet = '' }) => {
  const initialScheduleRef = useRef(null);
  if (!initialScheduleRef.current) {
    initialScheduleRef.current = Object.fromEntries(residents.map((r) => [r.name, Array(26).fill('-')]));
  }

  const [scheduleData, setScheduleData] = useState(() => {
    const saved = localStorage.getItem('scheduleData');
    return saved ? JSON.parse(saved) : initialScheduleRef.current;
  });
  const [rotationCounts, setRotationCounts] = useState(
    Object.fromEntries(residents.map((r) => [r.name, {}]))
  );
  const [history, setHistory] = useState([]);
  const [showRotationCounts, setShowRotationCounts] = useState(false);
  const [showValidationBorders, setShowValidationBorders] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [warningTabValue, setWarningTabValue] = useState(0);
  const [filters, setFilters] = useState({});
  const [selectedResidents, setSelectedResidents] = useState(residents.map((r) => r.name));
  const [customRotationColors, setCustomRotationColors] = useState({});
  const blockDates = getBlockDates();
  const fileInputRef = useRef(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [customRotation, setCustomRotation] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);

  // Log props for debugging
  useEffect(() => {
    console.log('SchedulesTab props:', { residents, rotations, selectedSet });
    console.log('SchedulesTab mounted');
    return () => console.log('SchedulesTab unmounted');
  }, [residents, rotations, selectedSet]);

  // Persist scheduleData
  useEffect(() => {
    localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
    console.log('scheduleData updated:', scheduleData);
  }, [scheduleData]);

  // Safely compute rotationNames
  const rotationNames = useMemo(() => {
    const setRotations = rotations[selectedSet] || [];
    const hasAmbulatory = setRotations.some((r) => r.name === 'Ambulatory');
    return [
      ...setRotations.filter((r) => r.included).map((r) => r.name),
      ...(hasAmbulatory ? [] : ['Ambulatory']),
    ];
  }, [rotations, selectedSet]);

  // Define rotationOptions and staticRotationColors statically
  const rotationOptions = [
    'Clear',
    'Elective',
    'NF',
    'Team A',
    'Team B',
    'IMP',
    'MAR',
    'CCU Day',
    'CCU Night',
    'ICU Day',
    'ICU Night',
    'Geriatrics',
    'ID',
    'Cardio',
    'Neuro',
    'Renal',
    'ED',
    'MON',
    'MOD',
    'Coverage',
    'Ambulatory',
    'Custom',
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

  // Compute rotationColors without state update
  const rotationColors = useMemo(() => {
    const allRotations = new Set([
      ...Object.keys(scheduleData).flatMap((name) => scheduleData[name] || []),
      ...(rotationOptions.filter((opt) => opt !== 'Clear' && opt !== 'Custom') || []),
    ]);
    const updatedCustomColors = { ...customRotationColors };
    allRotations.forEach((rotation) => {
      if (!staticRotationColors[rotation] && !updatedCustomColors[rotation] && rotation) {
        updatedCustomColors[rotation] = getRandomColor();
      }
    });
    return { ...staticRotationColors, ...updatedCustomColors };
  }, [scheduleData, customRotationColors]);

  // Update customRotationColors when new rotations appear
  useEffect(() => {
    const allRotations = new Set([
      ...Object.keys(scheduleData).flatMap((name) => scheduleData[name] || []),
      ...(rotationOptions.filter((opt) => opt !== 'Clear' && opt !== 'Custom') || []),
    ]);
    setCustomRotationColors((prev) => {
      const updated = { ...prev };
      allRotations.forEach((rotation) => {
        if (!staticRotationColors[rotation] && !updated[rotation] && rotation) {
          updated[rotation] = getRandomColor();
        }
      });
      return updated;
    });
  }, [scheduleData]);

  const getRotationCounts = useCallback(
    (residentName) => {
      const counts = {};
      rotationNames.forEach((rotation) => {
        counts[rotation] = scheduleData[residentName]?.filter((block) => block === rotation).length || 0;
      });
      counts['Nights'] = (
        (counts['NF'] || 0) +
        (counts['CCU Night'] || 0) +
        (counts['ICU Night'] || 0) +
        (counts['MON'] || 0)
      );
      counts['Units'] = (counts['ICU Day'] || 0) + (counts['CCU Day'] || 0);
      counts['Floors'] = (
        (counts['Team A'] || 0) +
        (counts['Team B'] || 0) +
        (counts['IMP'] || 0) +
        (counts['MAR'] || 0) +
        (counts['MOD'] || 0)
      );
      counts['Total'] = counts['Nights'] + counts['Units'] + counts['Floors'];
      return counts;
    },
    [scheduleData, rotationNames]
  );

  const getRotationFilterOptions = () => {
    const options = {};
    residents.forEach((resident) => {
      const counts = getRotationCounts(resident.name);
      Object.entries(counts).forEach(([rotation, count]) => {
        if (!options[rotation]) options[rotation] = new Set();
        options[rotation].add(count);
      });
    });
    const result = Object.fromEntries(
      Object.entries(options).map(([rotation, counts]) => [rotation, Array.from(counts).sort((a, b) => a - b)])
    );
    console.log('getRotationFilterOptions:', result);
    return result;
  };

  const rotationFilterOptions = getRotationFilterOptions();

  const handleFilterChange = (rotation, count) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      const currentCounts = newFilters[rotation] || [];
      if (currentCounts.includes(count)) {
        newFilters[rotation] = currentCounts.filter((c) => c !== count);
        if (newFilters[rotation].length === 0) {
          delete newFilters[rotation];
        }
      } else {
        newFilters[rotation] = [...currentCounts, count].sort((a, b) => a - b);
      }
      console.log('handleFilterChange - New filters:', newFilters);
      return newFilters;
    });
  };

  const computeFilteredResidents = useMemo(() => {
    console.log('computeFilteredResidents - Filters:', filters, 'ScheduleData:', scheduleData);
    let filtered = residents.map((r) => r.name);
    if (Object.keys(filters).length > 0) {
      filtered = residents.filter((resident) => {
        const counts = getRotationCounts(resident.name);
        return Object.entries(filters).every(([rotation, selectedCounts]) => {
          const residentCount = counts[rotation] || 0;
          return selectedCounts.includes(residentCount);
        });
      }).map((r) => r.name);
    }
    console.log('computeFilteredResidents - Result:', filtered);
    return filtered.length > 0 ? filtered : residents.map((r) => r.name);
  }, [filters, scheduleData, residents, getRotationCounts]);

  useEffect(() => {
    setSelectedResidents(computeFilteredResidents);
  }, [computeFilteredResidents, filters]);

  const getValidationIssues = () => {
    const blockIssues = [];
    const mandatoryFillingIssues = [];
    const minIssues = [];
    const maxIssues = [];
    const assignments = Array.from({ length: 26 }, () => ({}));
    const nightRotations = ['NF', 'CCU Night', 'ICU Night', 'MON'];
    const validAfterNight = [
      '-', 'Vacation', 'Ambulatory', 'Elective',
      ...((rotations[selectedSet] || []).filter((r) => r.included && !r.mandatory).map((r) => r.name)),
    ];
    const unitDayRotations = ['CCU Day', 'ICU Day'];
    const teamRotations = ['Team A', 'Team B'];

    residents.forEach((resident) => {
      const schedule = scheduleData[resident.name] || Array(26).fill('-');
      schedule.forEach((rotation, block) => {
        if (rotation !== '-' && rotation !== 'Vacation') {
          assignments[block][rotation] = (assignments[block][rotation] || 0) + 1;
        }
      });
    });

    residents.forEach((resident) => {
      const schedule = scheduleData[resident.name] || Array(26).fill('-');
      for (let block = 0; block < 26; block++) {
        const rotation = schedule[block];
        const prev = block > 0 ? schedule[block - 1] : null;
        const next = block < 25 ? schedule[block + 1] : null;

        if (nightRotations.includes(rotation)) {
          if (prev && nightRotations.includes(prev)) {
            blockIssues.push(`${resident.name}, Block ${block + 1}: Consecutive night rotation with ${prev}`);
          }
          if (next && nightRotations.includes(next)) {
            blockIssues.push(`${resident.name}, Block ${block + 1}: Consecutive night rotation with ${next}`);
          }
        }

        if (nightRotations.includes(rotation) && next && !validAfterNight.includes(next)) {
          blockIssues.push(`${resident.name}, Block ${block + 1}: Invalid rotation ${next} after night rotation`);
        }

        if (unitDayRotations.includes(rotation) && prev && unitDayRotations.includes(prev)) {
          blockIssues.push(`${resident.name}, Block ${block + 1}: Consecutive unit day rotation with ${prev}`);
        }

        if (teamRotations.includes(rotation)) {
          const windowStart = Math.max(0, block - 3);
          const windowEnd = Math.min(25, block + 3);
          let teamCount = 0;
          for (let i = windowStart; i <= windowEnd; i++) {
            if (i !== block && teamRotations.includes(schedule[i])) teamCount++;
          }
          if (teamCount >= 3) {
            blockIssues.push(`${resident.name}, Block ${block + 1}: Too many team rotations in 4-block window (${teamCount + 1} total)`);
          }
        }
      }
    });

    const mandatoryRotations = (rotations[selectedSet] || []).filter((r) => r.mandatory && r.included);
    for (let block = 0; block < 26; block++) {
      mandatoryRotations.forEach((rotation) => {
        const assigned = assignments[block][rotation.name] || 0;
        const required = rotation.requiredPerBlock || 0;
        if (required > 0 && assigned !== required) {
          mandatoryFillingIssues.push(`Block ${block + 1}: ${rotation.name} ${assigned < required ? 'underfilled' : 'overfilled'} (${assigned}/${required})`);
        }
      });
    }

    residents.forEach((resident) => {
      const counts = getRotationCounts(resident.name);
      (rotations[selectedSet] || []).forEach((rotation) => {
        const count = counts[rotation.name] || 0;
        const min = rotation.min || 0;
        const max = rotation.max || Infinity;
        if (count < min) {
          minIssues.push(`${resident.name}: ${rotation.name} below min (${count}/${min})`);
        }
        if (count > max) {
          maxIssues.push(`${resident.name}: ${rotation.name} above max (${count}/${max})`);
        }
      });
    });

    return { blockIssues, mandatoryFillingIssues, minIssues, maxIssues, assignments };
  };

  const { blockIssues, mandatoryFillingIssues, minIssues, maxIssues, assignments: blockAssignments } = getValidationIssues();

  const getCellValidation = (residentName, blockIndex) => {
    const schedule = scheduleData[residentName] || Array(26).fill('-');
    const rotation = schedule[blockIndex];
    const prev = blockIndex > 0 ? schedule[blockIndex - 1] : null;
    const next = blockIndex < 25 ? schedule[blockIndex + 1] : null;
    const nightRotations = ['NF', 'CCU Night', 'ICU Night', 'MON'];
    const validAfterNight = [
      '-', 'Vacation', 'Ambulatory', 'Elective',
      ...((rotations[selectedSet] || []).filter((r) => r.included && !r.mandatory).map((r) => r.name)),
    ];
    const unitDayRotations = ['CCU Day', 'ICU Day'];
    const teamRotations = ['Team A', 'Team B'];

    let isBreaching = false;

    if (nightRotations.includes(rotation)) {
      if (prev && nightRotations.includes(prev)) isBreaching = true;
      if (next && nightRotations.includes(next)) isBreaching = true;
    }

    if (nightRotations.includes(rotation) && next && !validAfterNight.includes(next)) {
      isBreaching = true;
    }

    if (unitDayRotations.includes(rotation) && prev && unitDayRotations.includes(prev)) {
      isBreaching = true;
    }

    if (teamRotations.includes(rotation)) {
      const windowStart = Math.max(0, blockIndex - 3);
      const windowEnd = Math.min(25, blockIndex + 3);
      let teamCount = 0;
      for (let i = windowStart; i <= windowEnd; i++) {
        if (i !== blockIndex && teamRotations.includes(schedule[i])) teamCount++;
      }
      if (teamCount >= 3) isBreaching = true;
    }

    return isBreaching;
  };

  const saveToHistory = () => {
    setHistory((prev) => {
      const newHistory = [...prev, {
        scheduleData: JSON.parse(JSON.stringify(scheduleData)),
        rotationCounts: JSON.parse(JSON.stringify(rotationCounts)),
      }];
      if (newHistory.length > 10) newHistory.shift();
      return newHistory;
    });
  };

  const handleStep1 = () => {
    saveToHistory();
    let attempts = 0;
    const maxAttempts = 25;
    let schedule, updatedRotationCounts, breaches;

    do {
      ({ schedule, rotationCounts: updatedRotationCounts } = generateMandatorySchedule(residents, rotations[selectedSet] || []));
      setScheduleData(schedule);
      setRotationCounts(updatedRotationCounts);
      const { blockIssues } = getValidationIssues();
      breaches = blockIssues.length;
      attempts++;
    } while (breaches > 2 && attempts < maxAttempts);

    if (breaches > 2) {
      console.warn(`Max attempts (${maxAttempts}) reached. Best schedule has ${breaches} block breaches.`);
    }

    setSelectedResidents(residents.map((r) => r.name));
  };

  const handleStep2 = () => {
    saveToHistory();
    const { schedule, rotationCounts: updatedRotationCounts } = generateNonMandatorySchedule(
      residents,
      rotations[selectedSet] || [],
      scheduleData,
      rotationCounts
    );
    setScheduleData(schedule);
    setRotationCounts(updatedRotationCounts);
  };

  const handleStep3 = () => {
    saveToHistory();
    setFilterAnchorEl(null);
    setContextMenu(null);
    const { schedule, rotationCounts: updatedRotationCounts } = fillElectives(
      residents,
      rotations[selectedSet] || [],
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
    setFilters({});
    setSelectedResidents(residents.map((r) => r.name));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setScheduleData(lastState.scheduleData);
    setRotationCounts(lastState.rotationCounts);
    setHistory((prev) => prev.slice(0, -1));
  };

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
    saveToHistory();
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
      saveToHistory();
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

    const rotationCount = rotationCounts[residentName]?.[rotation] || 0;
    const isBreaching = getCellValidation(residentName, blockIndex);

    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      opacity: transform ? 0.5 : 1,
      backgroundColor: isOver ? '#e0e0e0' : rotationColors[rotation] || '#E0E0E0',
      border: showValidationBorders && isBreaching ? '4px solid #A020F0' : '1px solid #e0e0e0',
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

    saveToHistory();
    const [activeResident, activeBlock] = active.id.split('-');
    const [overResident, overBlock] = over.id.split('-');
    const activeBlockIndex = parseInt(activeBlock, 10);
    const overBlockIndex = parseInt(overBlock, 10);

    setScheduleData((prev) => {
      const newSchedule = JSON.parse(JSON.stringify(prev));
      const activeRotation = newSchedule[activeResident][activeBlockIndex];
      const overRotation = newSchedule[overResident][overBlockIndex];
      newSchedule[activeResident][activeBlockIndex] = overRotation;
      newSchedule[overResident][overBlockIndex] = activeRotation;

      const newRotationCounts = {};
      residents.forEach((resident) => {
        newRotationCounts[resident.name] = {};
        newSchedule[resident.name].forEach((rotation) => {
          if (rotation !== '-') {
            newRotationCounts[resident.name][rotation] = (newRotationCounts[resident.name][rotation] || 0) + 1;
          }
        });
      });

      console.log('handleDragEnd - New scheduleData:', newSchedule, 'New rotationCounts:', newRotationCounts);
      setRotationCounts(newRotationCounts);
      setFilters({});
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
      .map((resident) => [resident.name, ...(scheduleData[resident.name] || Array(26).fill('-'))]);
    const table1Ws = XLSX.utils.aoa_to_sheet([table1Headers, ...table1Data]);
    XLSX.utils.book_append_sheet(wb, table1Ws, 'Resident Schedule');

    const table2Headers = ['Resident', ...rotationNames, 'Nights', 'Units', 'Floors', 'Total'];
    const table2Data = residents.map((resident) => {
      const counts = getRotationCounts(resident.name);
      return [
        resident.name,
        ...rotationNames.map((rotation) => counts[rotation] || 0),
        counts['Nights'],
        counts['Units'],
        counts['Floors'],
        counts['Total'],
      ];
    });
    const table2Ws = XLSX.utils.aoa_to_sheet([table2Headers, ...table2Data]);
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
          saveToHistory();
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
          <Stack direction="column" spacing={0}>
            <FormControlLabel
              control={<Switch checked={showRotationCounts} onChange={(e) => setShowRotationCounts(e.target.checked)} />}
              label="Show Counts"
              sx={{ m: 0 }}
            />
            <FormControlLabel
              control={<Switch checked={showValidationBorders} onChange={(e) => setShowValidationBorders(e.target.checked)} />}
              label="Show Validation Borders"
              sx={{ m: 0 }}
            />
          </Stack>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ButtonGroup variant="outlined" color="primary" size="small">
            <Button onClick={handleSelectAll}>Select All</Button>
            <Button onClick={handleUnselectAll}>Clear All</Button>
            <Button onClick={handleFilterClick}>Filter by Name</Button>
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

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Filter by Rotation Counts</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {Object.entries(rotationFilterOptions).map(([rotation, counts]) => (
              <Box key={rotation}>
                <Typography variant="subtitle2">{rotation}</Typography>
                {counts.map((count) => (
                  <FormControlLabel
                    key={count}
                    control={
                      <Checkbox
                        checked={filters[rotation]?.includes(count) || false}
                        onChange={() => handleFilterChange(rotation, count)}
                        value={count}
                      />
                    }
                    label={`${count}`}
                  />
                ))}
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleFilterClose}>
        {residents.map((resident) => (
          <MenuItem key={resident.name} onClick={handleResidentToggle(resident.name)}>
            <Checkbox checked={selectedResidents.includes(resident.name)} />
            <ListItemText primary={resident.name} />
          </MenuItem>
        ))}
      </Menu>

      <Tabs
        value={tabValue}
        onChange={(e, newValue) => {
          console.log('Switching to tab:', newValue);
          setTabValue(newValue);
        }}
        sx={{ mb: 2 }}
      >
        <Tab label="Resident Schedule" />
        <Tab label="Rotation Counts" />
        <Tab label="Block Filling" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
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
                {console.log('Rendering TableBody - selectedResidents:', selectedResidents, 'scheduleData:', scheduleData)}
                {residents
                  .filter((resident) => selectedResidents.includes(resident.name))
                  .map((resident) => (
                    <TableRow key={resident.name}>
                      <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, position: 'sticky', left: 0, bgcolor: '#fafafa', zIndex: 1 }}>
                        {resident.name}
                      </TableCell>
                      {(scheduleData[resident.name] || Array(26).fill('-')).map((rotation, blockIndex) => (
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
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
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
                return (
                  <TableRow
                    key={resident.name}
                    sx={{
                      bgcolor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                      '&:hover': { bgcolor: '#e0f7fa' },
                    }}
                  >
                    <TableCell sx={{ border: '1px solid #e0e0e0', p: 1 }}>{resident.name}</TableCell>
                    {rotationNames.map((rotation) => (
                      <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>
                        {counts[rotation] || 0}
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
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
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
                return (
                  <TableRow
                    key={blockNum}
                    sx={{
                      bgcolor: block % 2 === 0 ? '#ffffff' : '#f5f5f5',
                      '&:hover': { bgcolor: '#b0e0e6', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)' },
                    }}
                  >
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
      </TabPanel>

      <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', border: '1px solid #ff9800', borderRadius: 1 }}>
        <Typography variant="h6" color="warning.main">
          Validation Issues ({blockIssues.length + mandatoryFillingIssues.length + minIssues.length + maxIssues.length})
        </Typography>
        <Tabs value={warningTabValue} onChange={(e, newValue) => setWarningTabValue(newValue)} sx={{ mb: 1 }}>
          <Tab label={`Block Breaches (${blockIssues.length})`} />
          <Tab label={`Mandatory Filling (${mandatoryFillingIssues.length})`} />
          <Tab label={`Min Values (${minIssues.length})`} />
          <Tab label={`Max Values (${maxIssues.length})`} />
        </Tabs>
        <TabPanel value={warningTabValue} index={0}>
          {blockIssues.length > 0 ? (
            blockIssues.slice(0, 50).map((issue, index) => (
              <Typography key={index} variant="body2" color="error">{issue}</Typography>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">No block validation breaches</Typography>
          )}
        </TabPanel>
        <TabPanel value={warningTabValue} index={1}>
          {mandatoryFillingIssues.length > 0 ? (
            mandatoryFillingIssues.slice(0, 50).map((issue, index) => (
              <Typography key={index} variant="body2" color="error">{issue}</Typography>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">No mandatory filling issues</Typography>
          )}
        </TabPanel>
        <TabPanel value={warningTabValue} index={2}>
          {minIssues.length > 0 ? (
            minIssues.slice(0, 50).map((issue, index) => (
              <Typography key={index} variant="body2" color="error">{issue}</Typography>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">No minimum value issues</Typography>
          )}
        </TabPanel>
        <TabPanel value={warningTabValue} index={3}>
          {maxIssues.length > 0 ? (
            maxIssues.slice(0, 50).map((issue, index) => (
              <Typography key={index} variant="body2" color="error">{issue}</Typography>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">No maximum value issues</Typography>
          )}
        </TabPanel>
      </Box>

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
    </Box>
  );
};

export default SchedulesTab;