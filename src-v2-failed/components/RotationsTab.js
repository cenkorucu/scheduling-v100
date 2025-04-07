// src/components/RotationsTab.js
import React, { useState } from 'react';
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
  Divider,
} from '@mui/material';

const RotationsTab = ({ residents, rotations, setRotations, selectedSet, setSelectedSet }) => {
  const [newRotationName, setNewRotationName] = useState('');

  const handleSetChange = (event) => {
    setSelectedSet(event.target.value);
  };

  const handleRotationToggle = (index) => {
    const updatedRotations = { ...rotations };
    updatedRotations[selectedSet][index].included = !updatedRotations[selectedSet][index].included;
    // If unchecking the rotation, also uncheck mandatory
    if (!updatedRotations[selectedSet][index].included) {
      updatedRotations[selectedSet][index].isMandatory = false;
      updatedRotations[selectedSet][index].requiredCount = 0;
    }
    setRotations(updatedRotations);
  };

  const handleMandatoryToggle = (index) => {
    const updatedRotations = { ...rotations };
    updatedRotations[selectedSet][index].isMandatory = !updatedRotations[selectedSet][index].isMandatory;
    // Set default required count to 1 when marking as mandatory, reset to 0 when unmarking
    if (updatedRotations[selectedSet][index].isMandatory) {
      updatedRotations[selectedSet][index].requiredCount = 1; // Default to 1
    } else {
      updatedRotations[selectedSet][index].requiredCount = 0;
    }
    setRotations(updatedRotations);
  };

  const handleRequiredCountChange = (index, value) => {
    const updatedRotations = { ...rotations };
    updatedRotations[selectedSet][index].requiredCount = parseInt(value) || 0;
    setRotations(updatedRotations);
  };

  const handleTypeChange = (index, type) => {
    const updatedRotations = { ...rotations };
    updatedRotations[selectedSet][index].type = type;
    if (type === 'minMax') {
      updatedRotations[selectedSet][index].exact = '';
    } else {
      updatedRotations[selectedSet][index].min = '';
      updatedRotations[selectedSet][index].max = '';
    }
    setRotations(updatedRotations);
  };

  const handleInputChange = (index, field, value) => {
    const updatedRotations = { ...rotations };
    updatedRotations[selectedSet][index][field] = value;
    setRotations(updatedRotations);
  };

  const handleAddRotation = () => {
    if (newRotationName.trim() === '') return;
    const updatedRotations = { ...rotations };
    updatedRotations[selectedSet].push({
      name: newRotationName,
      included: false,
      type: 'minMax',
      min: '',
      max: '',
      exact: '',
      isMandatory: false,
      requiredCount: 0,
    });
    setRotations(updatedRotations);
    setNewRotationName('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Rotations
      </Typography>

      {/* Rotation Set Selection */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Rotation Set</InputLabel>
        <Select value={selectedSet} onChange={handleSetChange} label="Rotation Set">
          <MenuItem value="PGY-1">PGY-1</MenuItem>
          <MenuItem value="PGY-2">PGY-2</MenuItem>
          <MenuItem value="PGY-3">PGY-3</MenuItem>
          <MenuItem value="Custom">Custom</MenuItem>
        </Select>
      </FormControl>

      {/* Rotations List */}
      {rotations[selectedSet].length > 0 ? (
        rotations[selectedSet].map((rotation, index) => (
          <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rotation.included}
                    onChange={() => handleRotationToggle(index)}
                  />
                }
                label={rotation.name}
              />
              {rotation.included && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rotation.isMandatory}
                      onChange={() => handleMandatoryToggle(index)}
                    />
                  }
                  label="Mandatory"
                />
              )}
            </Box>
            {rotation.included && (
              <Box sx={{ ml: 4, mt: 1 }}>
                <RadioGroup
                  row
                  value={rotation.type}
                  onChange={(e) => handleTypeChange(index, e.target.value)}
                >
                  <FormControlLabel value="minMax" control={<Radio />} label="Min/Max" />
                  <FormControlLabel value="exact" control={<Radio />} label="Exact" />
                </RadioGroup>
                {rotation.type === 'minMax' ? (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Min"
                      type="number"
                      value={rotation.min}
                      onChange={(e) => handleInputChange(index, 'min', e.target.value)}
                      size="small"
                      sx={{ width: '100px' }}
                    />
                    <TextField
                      label="Max"
                      type="number"
                      value={rotation.max}
                      onChange={(e) => handleInputChange(index, 'max', e.target.value)}
                      size="small"
                      sx={{ width: '100px' }}
                    />
                  </Box>
                ) : (
                  <TextField
                    label="Exact"
                    type="number"
                    value={rotation.exact}
                    onChange={(e) => handleInputChange(index, 'exact', e.target.value)}
                    size="small"
                    sx={{ width: '100px' }}
                  />
                )}
                {rotation.isMandatory && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      label="Required Resident Count per Block"
                      type="number"
                      value={rotation.requiredCount}
                      onChange={(e) => handleRequiredCountChange(index, e.target.value)}
                      size="small"
                      sx={{ width: '200px' }}
                      inputProps={{ min: 0 }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        ))
      ) : (
        <Typography>No rotations added yet. Add a new rotation below.</Typography>
      )}

      {/* Add New Rotation */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add New Rotation
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Rotation Name"
            value={newRotationName}
            onChange={(e) => setNewRotationName(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleAddRotation}>
            Add Rotation
          </Button>
        </Box>
      </Box>

      {/* Ambulatory and Vacation Reference */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" gutterBottom>
        Ambulatory and Vacation Reference
      </Typography>
      <Typography>
        Ambulatory and vacation rotations will be automatically included in the schedule based on the following data from the Residents tab:
      </Typography>
      <ul>
        <li>Ambulatory: Determined by the ambulatory group (1-5) assigned to each resident.</li>
        <li>Vacation 1: First vacation block for each resident.</li>
        <li>Vacation 2: Second vacation block for each resident.</li>
      </ul>
      <Typography>
        Note: This data will be used in the scheduling step. Saving functionality will be added later.
      </Typography>
    </Box>
  );
};

export default RotationsTab;