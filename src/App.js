import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import ResidentsTab from './components/ResidentsTab';
import RotationsTab from './components/RotationsTab';
import SchedulesTab from './components/SchedulesTab';
import ReviewTab from './components/ReviewTab';

const App = () => {
  const [tabValue, setTabValue] = useState(0);
  const [residents, setResidents] = useState([]);

  const initialRotationSets = {
    'PGY-1': [
      { name: 'NF', included: true, mandatory: true, requiredPerBlock: 2, type: 'minMax', min: 2, max: 3, exact: '' },
      { name: 'MAR', included: true, mandatory: true, requiredPerBlock: 1, type: 'minMax', min: 1, max: 2, exact: '' },
      { name: 'Team A', included: true, mandatory: true, requiredPerBlock: 2, type: 'minMax', min: 2, max: 3, exact: '' },
      { name: 'Team B', included: true, mandatory: true, requiredPerBlock: 2, type: 'minMax', min: 2, max: 3, exact: '' },
      { name: 'CCU Day', included: true, mandatory: true, requiredPerBlock: 1, type: 'minMax', min: 1, max: 2, exact: '' },
      { name: 'ICU Day', included: true, mandatory: true, requiredPerBlock: 1, type: 'minMax', min: 1, max: 2, exact: '' },
      { name: 'Geriatrics', included: true, mandatory: false, requiredPerBlock: '', type: 'exact', min: '', max: '', exact: 1 },
      { name: 'ID', included: true, mandatory: false, requiredPerBlock: '', type: 'exact', min: '', max: '', exact: 1 },
      { name: 'ED', included: true, mandatory: false, requiredPerBlock: '', type: 'exact', min: '', max: '', exact: 1 },
      { name: 'Elective', included: true, mandatory: false, requiredPerBlock: '', type: 'exact', min: '', max: '', exact: 4 },
    ],
    'PGY-2': [
      { name: 'ICU Night', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'NF', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'IMP', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'ICU Day', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'MAR', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'CCU Night', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team A', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'CCU Day', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team B', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Elective', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
    ],
    'PGY-3': [
      { name: 'MON', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'ICU Night', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'ICU Day', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'MOD', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Elective', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team A', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Team B', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
      { name: 'Palliative', included: true, mandatory: false, requiredPerBlock: '', type: 'minMax', min: '', max: '', exact: '' },
    ],
    'Custom': [],
  };

  const [rotations, setRotations] = useState(initialRotationSets);
  const [selectedSet, setSelectedSet] = useState('PGY-1');

  useEffect(() => {
    console.log('Current residents:', residents);
  }, [residents]);

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      <Typography variant="h4" align="center" sx={{ py: 2, bgcolor: '#fff', boxShadow: 1 }}>
        JCMC <br />
        Department of Medicine <br />
        Scheduling App
      </Typography>
      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ bgcolor: '#fff', boxShadow: 1 }}>
        <Tab label="Residents" />
        <Tab label="Rotations" />
        <Tab label="Review" />
        <Tab label="Schedules" />
      </Tabs>
      <Box sx={{ flexGrow: 1, p: 2 }}>
        {tabValue === 0 && <ResidentsTab residents={residents} setResidents={setResidents} />}
        {tabValue === 1 && (
          <RotationsTab residents={residents} rotations={rotations} setRotations={setRotations} selectedSet={selectedSet} setSelectedSet={setSelectedSet} />
        )}
        {tabValue === 2 && <ReviewTab residents={residents} rotations={rotations} selectedSet={selectedSet} setTabValue={setTabValue} />}
        {tabValue === 3 && <SchedulesTab residents={residents} rotations={rotations} selectedSet={selectedSet} />}
      </Box>
      <Typography variant="body2" align="center" sx={{ py: 4, bgcolor: '#fff', boxShadow: 1 }}>
        MIT License <br />
        <br />
        Copyright (c) 2025 Berke Cenktug Korucu
      </Typography>
    </Box>
  );
};

export default App;