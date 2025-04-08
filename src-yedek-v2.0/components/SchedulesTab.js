// src/components/SchedulesTab.js
import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { generateSchedule } from '../utils/scheduleUtils';

const SchedulesTab = ({ residents, rotations, selectedSet }) => {
  const scheduleData = generateSchedule(residents, rotations[selectedSet]);

  const rotationNames = [
    ...rotations[selectedSet].filter((r) => r.included).map((r) => r.name),
    ...(rotations[selectedSet].some((r) => r.name === 'Ambulatory') ? [] : ['Ambulatory']),
  ];

  const getRotationCounts = (residentName) => {
    const counts = {};
    rotationNames.forEach((rotation) => {
      counts[rotation] = scheduleData[residentName].filter((block) => block === rotation).length;
    });
    return counts;
  };

  const getBlockAssignments = () => {
    const assignments = Array.from({ length: 26 }, () => ({}));
    residents.forEach((resident) => {
      scheduleData[resident.name].forEach((rotation, block) => {
        if (rotation !== '-' && rotation !== 'Vacation') {
          assignments[block][rotation] = (assignments[block][rotation] || 0) + 1;
        }
      });
    });
    return assignments;
  };

  const blockAssignments = getBlockAssignments();

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      {/* Table 1: Resident Schedule by Block */}
      <Typography variant="h6" sx={{ mb: 1 }}>Resident Schedule by Block</Typography>
      <TableContainer component={Paper} sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <Table sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Resident</TableCell>
              {Array.from({ length: 26 }, (_, i) => (
                <TableCell key={i} align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>
                  Block {i + 1}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {residents.map((resident) => (
              <TableRow key={resident.name}>
                <TableCell sx={{ border: '1px solid #e0e0e0', p: 1 }}>{resident.name}</TableCell>
                {Array.from({ length: 26 }, (_, block) => (
                  <TableCell
                    key={block}
                    align="center"
                    sx={{
                      border: '1px solid #e0e0e0',
                      p: 1,
                      bgcolor: scheduleData[resident.name][block] === 'Vacation' ? '#ffcccc' : 'inherit',
                    }}
                  >
                    {scheduleData[resident.name][block]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Table 2: Rotation Counts per Resident */}
      <Typography variant="h6" sx={{ mb: 1 }}>Rotation Counts per Resident</Typography>
      <TableContainer component={Paper} sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <Table sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Resident</TableCell>
              {rotationNames.map((rotation) => (
                <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>
                  {rotation}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {residents.map((resident) => {
              const counts = getRotationCounts(resident.name);
              return (
                <TableRow key={resident.name}>
                  <TableCell sx={{ border: '1px solid #e0e0e0', p: 1 }}>{resident.name}</TableCell>
                  {rotationNames.map((rotation) => (
                    <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1 }}>
                      {counts[rotation]}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Table 3: Block Filling Status */}
      <Typography variant="h6" sx={{ mb: 1 }}>Block Filling Status</Typography>
      <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
        <Table sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>Block</TableCell>
              {rotationNames.map((rotation) => (
                <TableCell key={rotation} align="center" sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold' }}>
                  {rotation}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 26 }, (_, block) => {
              const blockNum = block + 1;
              return (
                <TableRow key={blockNum}>
                  <TableCell sx={{ border: '1px solid #e0e0e0', p: 1 }}>Block {blockNum}</TableCell>
                  {rotationNames.map((rotation) => {
                    const assigned = blockAssignments[block][rotation] || 0;
                    const rotationData = rotations[selectedSet].find((r) => r.name === rotation);
                    const required = rotationData?.mandatory && rotationData.requiredPerBlock ? rotationData.requiredPerBlock : 1;
                    const bgcolor =
                      assigned > required ? '#cce5ff' : // Blue for overfilled
                      assigned === required ? '#ccffcc' : // Green for exact
                      '#ffcccc'; // Red for underfilled
                    return (
                      <TableCell
                        key={rotation}
                        align="center"
                        sx={{ border: '1px solid #e0e0e0', p: 1, bgcolor }}
                      >
                        {assigned} / {required}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SchedulesTab;