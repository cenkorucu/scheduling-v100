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
        <Button type="submit" variant="contained" color="primary">
          Add
        </Button>
      </form>
    </Box>
  );
};

export default ResidentInput;