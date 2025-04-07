// src/components/ResidentsTab.js
import React from 'react';
import ResidentInput from './ResidentInput';
import ResidentList from './ResidentList';
import { assignResidentData } from '../utils/assignResidentData';
import { Button, Box } from '@mui/material';

const ResidentsTab = ({ residents, setResidents }) => {
  const handleNamesAdded = (newNames) => {
    const assignedResidents = assignResidentData(newNames, residents);
    setResidents([...residents, ...assignedResidents]);
  };

  const handleClearAll = () => {
    setResidents([]);
  };

  const handleReassignVacations = () => {
    const names = residents.map(r => r.name);
    const reassigned = assignResidentData(names);
    setResidents(reassigned);
  };

  return (
    <Box sx={{ p: 3 }}>
      <ResidentInput onNamesAdded={handleNamesAdded} />
      {residents.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleClearAll}
            sx={{ mr: 1 }}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReassignVacations}
          >
            Re-assign Vacations
          </Button>
        </Box>
      )}
      <ResidentList residents={residents} setResidents={setResidents} />
    </Box>
  );
};

export default ResidentsTab;