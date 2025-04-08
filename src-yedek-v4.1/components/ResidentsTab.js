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

  const handleClearAll = () => setResidents([]);
  const handleReassignVacations = () => setResidents(assignResidentData(residents.map(r => r.name)));

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      <ResidentInput onNamesAdded={handleNamesAdded} />
      {residents.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="contained" color="secondary" onClick={handleClearAll}>
            Clear All
          </Button>
          <Button variant="contained" color="primary" onClick={handleReassignVacations}>
            Re-assign Vacations
          </Button>
        </Box>
      )}
      <ResidentList residents={residents} setResidents={setResidents} />
    </Box>
  );
};

export default ResidentsTab;