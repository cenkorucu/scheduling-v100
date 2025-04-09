// src/components/ResidentInput.js
import React, { useState } from 'react';
import { processNames } from '../utils/processNames';
import { TextField, Button, Box, Typography } from '@mui/material';

const ResidentInput = ({ onNamesAdded }) => {
  const [namesInput, setNamesInput] = useState('');

  const handleInputChange = (e) => setNamesInput(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    const namesArray = processNames(namesInput);
    onNamesAdded(namesArray);
    setNamesInput('');
  };

  const handleDemoClick = () => {
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
      'Tina'
    ].join('\n');
    setNamesInput(demoNames); // Only fills the text box
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6">Add Residents</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          value={namesInput}
          onChange={handleInputChange}
          placeholder="One name per line..."
          multiline
          rows={6}
          fullWidth
          variant="outlined"
          sx={{ mb: 1, bgcolor: '#fafafa' }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button type="submit" variant="contained" color="primary">
            Add
          </Button>
          <Button variant="outlined" color="primary" onClick={handleDemoClick}>
            Demo
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ResidentInput;