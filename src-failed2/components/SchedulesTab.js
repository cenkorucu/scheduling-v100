import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Button, CircularProgress } from '@mui/material';
import { generateSchedule, checkRotationLimits, checkNightAndUnitConstraints } from '../rules/schedulingRules';

const SchedulesTab = ({ residents, rotations, selectedSet }) => {
  const [schedule, setSchedule] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (residents.length && rotations[selectedSet]?.length) {
      setLoading(true);
      setTimeout(() => {
        try {
          const newSchedule = generateSchedule(residents, rotations, selectedSet);
          setSchedule(newSchedule);
          setError(null);
        } catch (err) {
          console.error('Error generating schedule:', err);
          setError(err.message || 'Failed to generate schedule');
          setSchedule(null);
        } finally {
          setLoading(false);
        }
      }, 0); // Run asynchronously to avoid blocking the UI
    }
  }, [residents, rotations, selectedSet]);

  const handleEdit = (residentIndex, blockIndex, value) => {
    const newSchedule = schedule.map(row => [...row]);
    newSchedule[residentIndex][blockIndex] = value;
    setSchedule(newSchedule);
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Schedules</Typography>
        <CircularProgress />
        <Typography>Generating schedule, please wait...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Schedules</Typography>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  if (!schedule) {
    return (
      <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Schedules</Typography>
        <Typography>Generating schedule...</Typography>
      </Box>
    );
  }

  const getCellColor = (residentIndex, blockIndex) => {
    const rotation = schedule[residentIndex][blockIndex];
    const residentSchedule = schedule[residentIndex];
    const rotationDef = rotations[selectedSet].find(r => r.name === rotation);
    if (rotationDef && rotationDef.type === 'minMax' && !checkRotationLimits(residentSchedule, rotationDef)) return '#ffcccc'; // Pink for exceeding max
    if (!checkNightAndUnitConstraints(residentSchedule, blockIndex)) return '#ff0000'; // Red for rule violation
    return '#fff';
  };

  const allRotations = [...rotations[selectedSet].filter(r => r.included), { name: 'Ambulatory' }, { name: 'Vacation' }];
  const rotationCounts = schedule.map(row => {
    const counts = {};
    allRotations.forEach(rotation => {
      counts[rotation.name] = row.filter(block => block === rotation.name).length;
    });
    return counts;
  });

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Schedules</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant="contained" onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Save' : 'Edit'}
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Main Schedule Table */}
        <TableContainer component={Paper} sx={{ bgcolor: '#fafafa', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#fafafa', py: 0.5 }}>Resident</TableCell>
                {Array.from({ length: 26 }, (_, i) => (
                  <TableCell key={i} align="center" sx={{ py: 0.5 }}>{i + 1}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {residents.map((resident, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#fafafa', py: 0.5 }}>{resident.name}</TableCell>
                  {schedule[i].map((rotation, j) => (
                    <TableCell key={j} align="center" sx={{ py: 0.5, bgcolor: getCellColor(i, j) }}>
                      {editMode ? (
                        <TextField
                          value={rotation || ''}
                          onChange={(e) => handleEdit(i, j, e.target.value)}
                          size="small"
                          sx={{ width: '80px' }}
                        />
                      ) : (
                        rotation || '-'
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Rotation Counts Table */}
        <TableContainer component={Paper} sx={{ bgcolor: '#fafafa', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#fafafa', py: 0.5 }}>Resident</TableCell>
                {allRotations.map((rotation, i) => (
                  <TableCell key={i} align="center" sx={{ py: 0.5 }}>{rotation.name}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {residents.map((resident, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#fafafa', py: 0.5 }}>{resident.name}</TableCell>
                  {allRotations.map((rotation, j) => (
                    <TableCell key={j} align="center" sx={{ py: 0.5 }}>
                      {rotationCounts[i][rotation.name]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Filling Status Table */}
        <TableContainer component={Paper} sx={{ bgcolor: '#fafafa', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#fafafa', py: 0.5 }}>Rotation</TableCell>
                {Array.from({ length: 26 }, (_, i) => (
                  <TableCell key={i} align="center" sx={{ py: 0.5 }}>{i + 1}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {allRotations.map((rotation, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#fafafa', py: 0.5 }}>{rotation.name}</TableCell>
                  {Array.from({ length: 26 }, (_, j) => {
                    const count = schedule.filter(row => row[j] === rotation.name).length;
                    const target = rotation.mandatory ? rotation.requiredPerBlock : (rotation.exact || 0);
                    return (
                      <TableCell key={j} align="center" sx={{ py: 0.5 }}>
                        {count}/{target}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default SchedulesTab;