// src/components/ResidentsTab.js
import React, { useState, useRef } from 'react';
import ResidentInput from './ResidentInput';
import ResidentList from './ResidentList';
import { assignResidentData } from '../utils/assignResidentData';
import {
  Button,
  Box,
  ButtonGroup,
  Typography,
  Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { saveAs } from 'file-saver';

const ResidentsTab = ({ residents, setResidents, setTabValue }) => {
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  const saveToHistory = () => {
    setHistory((prev) => {
      const newHistory = [...prev, JSON.parse(JSON.stringify(residents))];
      if (newHistory.length > 10) newHistory.shift();
      return newHistory;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setResidents(lastState);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleNamesAdded = (newNames) => {
    saveToHistory();
    const assignedResidents = assignResidentData(newNames, residents);
    setResidents([...residents, ...assignedResidents]);
  };

  const handleClearAll = () => {
    saveToHistory();
    setResidents([]);
  };

  const handleReassignVacations = () => {
    saveToHistory();
    setResidents(assignResidentData(residents.map((r) => r.name)));
  };

  const handleDemoClick = (setInputText) => {
    const demoNames = [
      'Alice',
      'Benjamin',
      'Clara',
      'Daniel',
      'Emily',
      'Frank',
      'Grace',
      'Henry',
      'Isabella',
      'Jack',
      'Katherine',
      'Liam',
      'Mia',
      'Noah',
      'Olivia',
      'Peter',
      'Quinn',
      'Ryan',
      'Sophia',
      'Tina',
    ].join('\n');
    setInputText(demoNames);
  };

  const handleSaveResidents = () => {
    const dataToSave = JSON.stringify(residents, null, 2);
    const blob = new Blob([dataToSave], { type: 'application/json' });
    saveAs(blob, 'residents_data.json');
  };

  const handleLoadResidents = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedData = JSON.parse(e.target.result);
        const isValid = Array.isArray(loadedData) && loadedData.every((r) => typeof r === 'object' && 'name' in r);
        if (isValid) {
          saveToHistory();
          setResidents(loadedData);
        } else {
          alert('Invalid residents data: Ensure the file contains an array of resident objects with at least a "name" property.');
        }
      } catch (error) {
        alert('Error loading residents data: Invalid JSON format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSwitchToRotations = () => {
    setTabValue(1); // Switch to Rotations tab (index 1)
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h6">Residents Management</Typography>
        <Stack direction="column" spacing={1} alignItems="flex-end">
          <ButtonGroup variant="contained" color="primary" size="small">
            <Button startIcon={<SaveIcon />} onClick={handleSaveResidents}>
              Save
            </Button>
            <Button startIcon={<UploadFileIcon />} onClick={triggerFileInput}>
              Load
            </Button>
            <Button
              startIcon={<UndoIcon />}
              onClick={handleUndo}
              disabled={history.length === 0}
            >
              Undo
            </Button>
          </ButtonGroup>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSwitchToRotations}
            endIcon={<ArrowForwardIcon />}
            sx={{ width: '100%' }} // Match width of ButtonGroup
          >
            Rotations
          </Button>
        </Stack>
      </Box>

      <ResidentInput onNamesAdded={handleNamesAdded} onDemoClick={handleDemoClick} />

      {residents.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="contained" color="secondary" onClick={handleClearAll}>
           Clear All
          </Button>
          <Button variant="contained" color="primary" onClick={handleReassignVacations}>
            Re-assign Vacations
          </Button>
        </Box>
      )}

      <ResidentList residents={residents} setResidents={setResidents} />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleLoadResidents}
      />
    </Box>
  );
};

export default ResidentsTab;