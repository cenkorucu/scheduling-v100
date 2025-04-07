// src/App.js
import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import ResidentsTab from './components/ResidentsTab';
import RotationsTab from './components/RotationsTab';
import SchedulesTab from './components/SchedulesTab';

const App = () => {
  const [tabValue, setTabValue] = useState(0);
  const [residents, setResidents] = useState([]);
  
  // Initial rotation sets
  const initialRotationSets = {
    'PGY-1': [
      { name: 'Geriatrics', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'NF', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'MAR', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team A', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team B', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'CCU Day', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'ICU Day', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team A', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'ID', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'ED', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Elective', included: true, type: 'minMax', min: '', max: '', exact: '' },
    ],
    'PGY-2': [
      { name: 'ICU Night', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'NF', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'IMP', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'ICU Day', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'MAR', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'CCU Night', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team A', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'CCU Day', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team B', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Elective', included: true, type: 'minMax', min: '', max: '', exact: '' },
    ],
    'PGY-3': [
      { name: 'MON', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'ICU Night', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'ICU Day', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'MOD', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Elective', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team A', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team B', included: true, type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Palliative', included: true, type: 'minMax', min: '', max: '', exact: '' },
    ],
    'Custom': [],
  };

  const [rotations, setRotations] = useState(initialRotationSets);
  const [selectedSet, setSelectedSet] = useState('PGY-1');

  // Debug: Log residents state to confirm it persists
  useEffect(() => {
    console.log('Current residents:', residents);
  }, [residents]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" align="center" sx={{ my: 3 }}>
        Scheduling App
      </Typography>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        centered
        sx={{ mb: 3 }}
      >
        <Tab label="Residents" />
        <Tab label="Rotations" />
        <Tab label="Schedules" />
      </Tabs>
      {tabValue === 0 && <ResidentsTab residents={residents} setResidents={setResidents} />}
      {tabValue === 1 && (
        <RotationsTab
          residents={residents}
          rotations={rotations}
          setRotations={setRotations}
          selectedSet={selectedSet}
          setSelectedSet={setSelectedSet}
        />
      )}
      {tabValue === 2 && <SchedulesTab />}
    </Box>
  );
};

export default App;