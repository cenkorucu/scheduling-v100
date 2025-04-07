// src/components/ResidentInput.js
import React, { useState } from 'react';
import { processNames } from '../utils/processNames';
import { TextField, Button, Box, Typography } from '@mui/material';

const ResidentInput = ({ onNamesAdded }) => {
  const [namesInput, setNamesInput] = useState('');

  const handleInputChange = (e) => {
    setNamesInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const namesArray = processNames(namesInput);
    onNamesAdded(namesArray);
    setNamesInput('');
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Add Resident Names
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          value={namesInput}
          onChange={handleInputChange}
          placeholder="Enter one resident name per line..."
          multiline
          rows={10}
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" color="primary">
          Add Names
        </Button>
      </form>
    </Box>
  );
};

export default ResidentInput;