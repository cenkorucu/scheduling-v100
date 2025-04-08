import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const ReviewTab = ({ residents, rotations, selectedSet, setTabValue }) => {
  // Calculate vacation counts per block (1-26)
  const vacationCounts = Array(26).fill(0);
  residents.forEach((resident) => {
    vacationCounts[resident.vacation1 - 1]++;
    vacationCounts[resident.vacation2 - 1]++;
  });

  // Filter rotations
  const mandatoryRotations = rotations[selectedSet].filter(r => r.included && r.mandatory);
  const nonMandatoryRotations = rotations[selectedSet].filter(r => r.included && !r.mandatory);

  // Determine cell background color based on vacation count
  const getCellColor = (count) => {
    if (count === 0) return '#cce5ff'; // Blue for 0
    if (count <= 5) return '#ccffcc';  // Green for 1-5
    return '#ffcccc';                  // Red for 6+
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      {/* Residents and Preferences */}
      <Typography variant="h6" sx={{ mb: 1 }}>Residents and Preferences</Typography>
      <List dense sx={{ bgcolor: '#fafafa', borderRadius: 1, mb: 2 }}>
        {residents.map((resident, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText primary={`${resident.name} - Group: ${resident.group}, Vacation 1: ${resident.vacation1}, Vacation 2: ${resident.vacation2}`} />
          </ListItem>
        ))}
      </List>

      {/* Mandatory Rotations */}
      <Typography variant="h6" sx={{ mb: 1 }}>Mandatory Rotations</Typography>
      <List dense sx={{ bgcolor: '#fafafa', borderRadius: 1, mb: 2 }}>
        {mandatoryRotations.map((rotation, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText
              primary={`${rotation.name} - Required: ${rotation.requiredPerBlock}, ${rotation.type === 'minMax' ? `Min: ${rotation.min}, Max: ${rotation.max}` : `Exact: ${rotation.exact}`}`}
            />
          </ListItem>
        ))}
      </List>

      {/* Non-Mandatory Rotations */}
      <Typography variant="h6" sx={{ mb: 1 }}>Non-Mandatory Rotations</Typography>
      <List dense sx={{ bgcolor: '#fafafa', borderRadius: 1, mb: 2 }}>
        {nonMandatoryRotations.map((rotation, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemText
              primary={`${rotation.name} - ${rotation.type === 'minMax' ? `Min: ${rotation.min}, Max: ${rotation.max}` : `Exact: ${rotation.exact}`}`}
            />
          </ListItem>
        ))}
      </List>

      {/* Vacation Crosstab */}
      <Typography variant="h6" sx={{ mb: 1 }}>Vacation Overview</Typography>
      <TableContainer component={Paper} sx={{ bgcolor: '#fafafa', mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 0.5 }}></TableCell>
              {Array.from({ length: 26 }, (_, i) => (
                <TableCell key={i} align="center" sx={{ py: 0.5 }}>{i + 1}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ py: 0.5 }}>Vacation</TableCell>
              {vacationCounts.map((count, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{ py: 0.5, bgcolor: getCellColor(count) }}
                >
                  {count}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Schedule Button */}
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => setTabValue(3)}
      >
        Create Schedule
      </Button>
    </Box>
  );
};

export default ReviewTab;