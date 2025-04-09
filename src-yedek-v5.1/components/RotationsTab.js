import React, { useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, RadioGroup, Radio, TextField, Button } from '@mui/material';

const RotationsTab = ({ residents, rotations, setRotations, selectedSet, setSelectedSet }) => {
  const [newRotationName, setNewRotationName] = useState('');

  const handleSetChange = (e) => setSelectedSet(e.target.value);
  const handleRotationToggle = (index) => {
    const updated = { ...rotations };
    updated[selectedSet][index].included = !updated[selectedSet][index].included;
    setRotations(updated);
  };
  const handleMandatoryToggle = (index) => {
    const updated = { ...rotations };
    const isMandatory = !updated[selectedSet][index].mandatory;
    updated[selectedSet][index].mandatory = isMandatory;
    if (!isMandatory) updated[selectedSet][index].requiredPerBlock = '';
    setRotations(updated);
  };
  const handleTypeChange = (index, type) => {
    const updated = { ...rotations };
    updated[selectedSet][index].type = type;
    if (type === 'minMax') updated[selectedSet][index].exact = '';
    else updated[selectedSet][index].min = updated[selectedSet][index].max = '';
    setRotations(updated);
  };
  const handleInputChange = (index, field, value) => {
    const updated = { ...rotations };
    updated[selectedSet][index][field] = field === 'requiredPerBlock' ? parseInt(value) || '' : value;
    setRotations(updated);
  };
  const handleAddRotation = () => {
    if (!newRotationName.trim()) return;
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

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Rotations</Typography>
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
            size="small"
            sx={{ bgcolor: '#fafafa' }}
          />
          <Button variant="contained" size="small" onClick={handleAddRotation}>Add</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RotationsTab;