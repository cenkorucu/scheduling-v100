// src/App.js
import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Divider } from '@mui/material';
import ResidentsTab from './components/ResidentsTab';
import RotationsTab from './components/RotationsTab';
import SchedulesTab from './components/SchedulesTab';

const App = () => {
  const [tabValue, setTabValue] = useState(0);
  
  const [residents, setResidents] = useState([
    { name: "Alice", group: "A", vacation1: "9", vacation2: "19" },
    { name: "Benjamin", group: "A", vacation1: "7", vacation2: "23" },
    { name: "Clara", group: "A", vacation1: "10", vacation2: "15" },
    { name: "Daniel", group: "A", vacation1: "5", vacation2: "19" },
    { name: "Emily", group: "A", vacation1: "11", vacation2: "24" },
    { name: "Frank", group: "A", vacation1: "13", vacation2: "24" },
    { name: "Grace", group: "A", vacation1: "15", vacation2: "21" },
    { name: "Henry", group: "A", vacation1: "12", vacation2: "22" },
    { name: "Isabella", group: "A", vacation1: "14", vacation2: "21" },
    { name: "Jack", group: "B", vacation1: "11", vacation2: "20" },
    { name: "Katherine", group: "B", vacation1: "6", vacation2: "17" },
    { name: "Liam", group: "B", vacation1: "12", vacation2: "17" },
    { name: "Mia", group: "B", vacation1: "10", vacation2: "23" },
    { name: "Noah", group: "B", vacation1: "8", vacation2: "23" },
    { name: "Olivia", group: "B", vacation1: "20", vacation2: "25" },
    { name: "Peter", group: "B", vacation1: "7", vacation2: "18" },
    { name: "Quinn", group: "B", vacation1: "14", vacation2: "25" },
    { name: "Ryan", group: "B", vacation1: "13", vacation2: "17" },
    { name: "Sophia", group: "B", vacation1: "15", vacation2: "19" },
  ]);

  const initialRotationSets = {
    'PGY-1': [
      { name: 'Geriatrics', included: true, type: 'minMax', min: '1', max: '3', exact: '', isMandatory: true, requiredCount: 1 },
      { name: 'NF', included: true, type: 'minMax', min: '1', max: '3', exact: '', isMandatory: false, requiredCount: 0 },
      { name: 'MAR', included: true, type: 'minMax', min: '1', max: '3', exact: '', isMandatory: true, requiredCount: 1 },
      { name: "Team A", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: true, requiredCount: 1 },
      { name: "Team B", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: true, requiredCount: 1 },
      { name: "CCU Day", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "ICU Day", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "ID", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "ED", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "Elective", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
    ],
    'PGY-2': [
      { name: "ICU Night", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "NF", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "IMP", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: true, requiredCount: 1 },
      { name: "ICU Day", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: true, requiredCount: 1 },
      { name: "MAR", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: true, requiredCount: 1 },
      { name: "CCU Night", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "Team A", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "CCU Day", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "Team B", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "Elective", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
    ],
    'PGY-3': [
      { name: "MON", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: true, requiredCount: 1 },
      { name: "ICU Night", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "ICU Day", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: true, requiredCount: 1 },
      { name: "MOD", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: true, requiredCount: 1 },
      { name: "Elective", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "Team A", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "Team B", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
      { name: "Palliative", included: true, type: "minMax", min: "1", max: "3", exact: "", isMandatory: false, requiredCount: 0 },
    ],
    'Custom': [],
  };

  const [rotations, setRotations] = useState(initialRotationSets);
  const [selectedSet, setSelectedSet] = useState('PGY-1');
  const [scheduleData, setScheduleData] = useState({ schedule: [], violations: [] });

  useEffect(() => {
    console.log('Current residents:', residents);
    console.log('Current rotations:', rotations);
    console.log('Selected rotation set:', selectedSet);
    console.log('Current schedule data:', scheduleData);
  }, [residents, rotations, selectedSet, scheduleData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const selectedRotations = rotations[selectedSet] || [];

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ textAlign: 'center', my: 3 }}>
        <Typography variant="h4">JCMC</Typography>
        <Typography variant="h5">Department of Medicine</Typography>
        <Typography variant="h6">Residency Scheduling Tool</Typography>
      </Box>

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
      {tabValue === 2 && (
        <>
          {console.log('Rendering SchedulesTab with props:', { residents, rotations: selectedRotations, scheduleData })}
          <SchedulesTab
            residents={residents}
            rotations={selectedRotations}
            scheduleData={scheduleData}
            setScheduleData={setScheduleData}
          />
        </>
      )}

      <Box sx={{ mt: 'auto', py: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2">
          MIT License
        </Typography>
        <Typography variant="body2">
          Copyright (c) 2025 Berke Cenktug Korucu
        </Typography>
      </Box>
    </Box>
  );
};

export default App;