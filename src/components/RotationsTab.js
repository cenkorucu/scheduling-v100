// src/components/RotationsTab.js
import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  TextField,
  Button,
  ButtonGroup,
  Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import UndoIcon from '@mui/icons-material/Undo';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { saveAs } from 'file-saver';

const RotationsTab = ({ residents, rotations, setRotations, selectedSet, setSelectedSet, setTabValue }) => {
  const [newRotationName, setNewRotationName] = useState('');
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  const saveToHistory = () => {
    setHistory((prev) => {
      const newHistory = [...prev, JSON.parse(JSON.stringify(rotations))];
      if (newHistory.length > 10) newHistory.shift();
      return newHistory;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setRotations(lastState);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleSaveRotations = () => {
    const dataToSave = JSON.stringify(rotations, null, 2);
    const blob = new Blob([dataToSave], { type: 'application/json' });
    saveAs(blob, 'rotations_data.json');
  };

  const handleLoadRotations = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedData = JSON.parse(e.target.result);
        const isValid = typeof loadedData === 'object' && Object.keys(loadedData).every((set) => Array.isArray(loadedData[set]));
        if (isValid) {
          saveToHistory();
          setRotations(loadedData);
        } else {
          alert('Invalid rotations data: Ensure the file contains an object with rotation sets (e.g., PGY-1, PGY-2).');
        }
      } catch (error) {
        alert('Error loading rotations data: Invalid JSON format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSetChange = (e) => {
    saveToHistory();
    setSelectedSet(e.target.value);
  };

  const handleRotationToggle = (index) => {
    saveToHistory();
    const updated = { ...rotations };
    updated[selectedSet][index].included = !updated[selectedSet][index].included;
    setRotations(updated);
  };

  const handleMandatoryToggle = (index) => {
    saveToHistory();
    const updated = { ...rotations };
    const isMandatory = !updated[selectedSet][index].mandatory;
    updated[selectedSet][index].mandatory = isMandatory;
    if (!isMandatory) updated[selectedSet][index].requiredPerBlock = '';
    setRotations(updated);
  };

  const handleTypeChange = (index, type) => {
    saveToHistory();
    const updated = { ...rotations };
    updated[selectedSet][index].type = type;
    if (type === 'minMax') updated[selectedSet][index].exact = '';
    else updated[selectedSet][index].min = updated[selectedSet][index].max = '';
    setRotations(updated);
  };

  const handleInputChange = (index, field, value) => {
    saveToHistory();
    const updated = { ...rotations };
    updated[selectedSet][index][field] = field === 'requiredPerBlock' ? parseInt(value) || '' : value;
    setRotations(updated);
  };

  const handleAddRotation = () => {
    if (!newRotationName.trim()) return;
    saveToHistory();
    const updated = { ...rotations };
    updated[selectedSet].push({
      name: newRotationName,
      included: false,
      mandatory: false,
      requiredPerBlock: '',
      type: 'minMax',
      min: '',
      max: '',
      exact: '',
    });
    setRotations(updated);
    setNewRotationName('');
  };

  const handleSwitchToReview = () => {
    console.log('handleSwitchToReview called, setTabValue:', setTabValue); // Debug log
    if (typeof setTabValue !== 'function') {
      console.error('setTabValue is not a function. Ensure it’s passed from the parent component.');
      return;
    }
    setTabValue(2); // Switch to Review tab (index 2)
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h6">Rotations</Typography>
        <Stack direction="column" spacing={1} alignItems="flex-end">
          <ButtonGroup variant="contained" color="primary" size="small">
            <Button startIcon={<SaveIcon />} onClick={handleSaveRotations}>
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
            size="large" // Remains large as per your last update
            onClick={handleSwitchToReview}
            endIcon={<ArrowForwardIcon />}
            sx={{ width: '100%' }} // Matches ButtonGroup width
          >
            Review
          </Button>
        </Stack>
      </Box>

      <FormControl fullWidth sx={{ mb: 1 }}>
        <InputLabel>Rotation Set</InputLabel>
        <Select value={selectedSet} onChange={handleSetChange} label="Rotation Set">
          <MenuItem value="PGY-1">PGY-1</MenuItem>
          <MenuItem value="PGY-2">PGY-2</MenuItem>
          <MenuItem value="PGY-3">PGY-3</MenuItem>
          <MenuItem value="Custom">Custom</MenuItem>
        </Select>
      </FormControl>

      {rotations[selectedSet].length ? (
        rotations[selectedSet].map((rotation, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={rotation.included} onChange={() => handleRotationToggle(index)} />}
              label={rotation.name}
              sx={{ mr: 1, minWidth: 120 }}
            />
            <FormControlLabel
              control={<Checkbox checked={rotation.mandatory} onChange={() => handleMandatoryToggle(index)} />}
              label="Mandatory"
              sx={{ mr: 1 }}
            />
            {rotation.included && (
              <>
                {rotation.mandatory && (
                  <TextField
                    label="Req/Block"
                    type="number"
                    value={rotation.requiredPerBlock}
                    onChange={(e) => handleInputChange(index, 'requiredPerBlock', e.target.value)}
                    size="small"
                    sx={{ width: '90px', mr: 1 }}
                    inputProps={{ min: 1 }}
                  />
                )}
                <RadioGroup
                  row
                  value={rotation.type}
                  onChange={(e) => handleTypeChange(index, e.target.value)}
                  sx={{ mr: 1 }}
                >
                  <FormControlLabel value="minMax" control={<Radio size="small" />} label="Min/Max" />
                  <FormControlLabel value="exact" control={<Radio size="small" />} label="Exact" />
                </RadioGroup>
                {rotation.type === 'minMax' ? (
                  <>
                    <TextField
                      label="Min"
                      type="number"
                      value={rotation.min}
                      onChange={(e) => handleInputChange(index, 'min', e.target.value)}
                      size="small"
                      sx={{ width: '70px', mr: 1 }}
                    />
                    <TextField
                      label="Max"
                      type="number"
                      value={rotation.max}
                      onChange={(e) => handleInputChange(index, 'max', e.target.value)}
                      size="small"
                      sx={{ width: '70px' }}
                    />
                  </>
                ) : (
                  <TextField
                    label="Exact"
                    type="number"
                    value={rotation.exact}
                    onChange={(e) => handleInputChange(index, 'exact', e.target.value)}
                    size="small"
                    sx={{ width: '70px' }}
                  />
                )}
              </>
            )}
          </Box>
        ))
      ) : (
        <Typography>No rotations added.</Typography>
      )}

      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Add Rotation</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Name"
            value={newRotationName}
            onChange={(e) => setNewRotationName(e.target.value)}
            fullWidth
            size="small" // Reverted to small (your last update had large, likely a typo)
            sx={{ bgcolor: '#fafafa' }}
          />
          <Button variant="contained" size="small" onClick={handleAddRotation}>Add</Button>
        </Box>
      </Box>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleLoadRotations}
      />
    </Box>
  );
};

export default RotationsTab;