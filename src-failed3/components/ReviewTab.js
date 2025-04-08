import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  Alert
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

const ReviewTab = ({ residents, rotations, selectedSet, setTabValue, violations = [] }) => {
  const [schedule, setSchedule] = useState(Array(residents.length).fill(Array(26).fill(null))); // Initialize empty schedule

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

  // Scheduling function
  const generateSchedule = () => {
    const newSchedule = Array(residents.length).fill(null).map(() => Array(26).fill(null));

    // Step 1: Assign Ambulatory rotations
    for (let block = 1; block < 26; block++) {
      const group = (block - 1) % 5 + 1; // Cycle through groups 1-5
      const residentIndex = residents.findIndex(r => r.group === group);
      if (residentIndex !== -1) {
        newSchedule[residentIndex][block] = 'Ambulatory';
      }
    }

    // Step 2: Assign vacations and resolve conflicts
    residents.forEach((resident, index) => {
      const { vacation1, vacation2 } = resident;
      if (newSchedule[index][vacation1 - 1] === 'Ambulatory') {
        newSchedule[index][vacation1] = 'Vacation'; // Shift vacation to the next block
      } else {
        newSchedule[index][vacation1 - 1] = 'Vacation';
      }
      if (newSchedule[index][vacation2 - 1] === 'Ambulatory') {
        newSchedule[index][vacation2] = 'Vacation'; // Shift vacation to the next block
      } else {
        newSchedule[index][vacation2 - 1] = 'Vacation';
      }
    });

    // Step 3: Assign mandatory rotations
    rotations[selectedSet]
      .filter(r => r.mandatory)
      .forEach(rotation => {
        for (let block = 0; block < 26; block++) {
          const assigned = newSchedule.reduce((count, row) => count + (row[block] === rotation.name ? 1 : 0), 0);
          if (assigned < rotation.requiredPerBlock) {
            const availableResident = residents.findIndex((_, i) => !newSchedule[i][block]);
            if (availableResident !== -1) {
              newSchedule[availableResident][block] = rotation.name;
            }
          }
        }
      });

    // Step 4: Handle balancing and fallbacks (to be implemented later)

    setSchedule(newSchedule);
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

      {/* Schedule Validation */}
      {violations.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Schedule Issues</Typography>
          {violations.map((violation, index) => (
            <Alert 
              key={index}
              severity={violation.type === 'maxExceeded' ? 'warning' : 'error'}
              icon={violation.type === 'maxExceeded' ? <WarningIcon /> : <ErrorIcon />}
              sx={{ mb: 1 }}
            >
              {violation.message} (Resident: {residents[violation.residentIndex]?.name}, Block: {violation.blockIndex + 1})
            </Alert>
          ))}
        </Box>
      )}

      {/* Rotation Coverage */}
      <Typography variant="h6" sx={{ mb: 1 }}>Rotation Coverage</Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rotation</TableCell>
              {Array.from({ length: 26 }, (_, i) => (
                <TableCell key={i} align="center">{i + 1}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rotations[selectedSet]
              .filter(r => r.included)
              .map((rotation, index) => (
                <TableRow key={index}>
                  <TableCell>{rotation.name}</TableCell>
                  {Array.from({ length: 26 }, (_, i) => (
                    <TableCell key={i} align="center">
                      <Chip 
                        label={`${rotation.coverage?.[i] || 0}/${rotation.requiredPerBlock || 0}`}
                        size="small"
                        color={
                          (rotation.coverage?.[i] || 0) < (rotation.requiredPerBlock || 0) 
                            ? 'error' 
                            : 'default'
                        }
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Generated Schedule */}
      <Typography variant="h6" sx={{ mb: 1 }}>Generated Schedule</Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Resident</TableCell>
              {Array.from({ length: 26 }, (_, i) => (
                <TableCell key={i} align="center">{i + 1}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {schedule.map((row, residentIndex) => (
              <TableRow key={residentIndex}>
                <TableCell>{residents[residentIndex].name}</TableCell>
                {row.map((rotation, blockIndex) => (
                  <TableCell key={blockIndex} align="center">
                    {rotation || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Schedule Button */}
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={generateSchedule}
      >
        Generate Schedule
      </Button>
    </Box>
  );
};

export default ReviewTab;