import React from 'react';
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
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const ReviewTab = ({ residents, rotations, selectedSet, setTabValue }) => {
  // Calculate vacation counts per block (1-26)
  const vacationCounts = Array(26).fill(0);
  residents.forEach((resident) => {
    vacationCounts[resident.vacation1 - 1]++;
    vacationCounts[resident.vacation2 - 1]++;
  });

  // Filter rotations
  const mandatoryRotations = rotations[selectedSet].filter((r) => r.included && r.mandatory);
  const nonMandatoryRotations = rotations[selectedSet].filter((r) => r.included && !r.mandatory);

  // Determine cell background color based on vacation count
  const getCellColor = (count) => {
    if (count === 0) return '#cce5ff'; // Blue for 0
    if (count <= 5) return '#ccffcc'; // Green for 1-5
    return '#ffcccc'; // Red for 6+
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      {/* Header with Review title and Create Schedule button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Review</Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => setTabValue(3)}
          endIcon={<ArrowForwardIcon />}
        >
          Create Schedule
        </Button>
      </Box>

      {/* Flex container for the first three boxes */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        {/* Residents and Preferences */}
        <Box
          sx={{
            flex: '1 1 300px',
            maxWidth: '400px',
            bgcolor: '#fafafa',
            borderRadius: 1,
            p: 2,
            border: '1px solid #eee',
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Residents and Preferences
          </Typography>
          <List dense>
            {residents.map((resident, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemText
                  primary={resident.name}
                  secondary={`Group: ${resident.group} | Vacation 1: ${resident.vacation1} | Vacation 2: ${resident.vacation2}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Mandatory Rotations */}
        <Box
          sx={{
            flex: '1 1 300px',
            maxWidth: '400px',
            bgcolor: '#fafafa',
            borderRadius: 1,
            p: 2,
            border: '1px solid #eee',
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Mandatory Rotations
          </Typography>
          <List dense>
            {mandatoryRotations.map((rotation, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemText
                  primary={rotation.name}
                  secondary={`Required: ${rotation.requiredPerBlock} | ${
                    rotation.type === 'minMax'
                      ? `Min: ${rotation.min}, Max: ${rotation.max}`
                      : `Exact: ${rotation.exact}`
                  }`}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Non-Mandatory Rotations */}
        <Box
          sx={{
            flex: '1 1 300px',
            maxWidth: '400px',
            bgcolor: '#fafafa',
            borderRadius: 1,
            p: 2,
            border: '1px solid #eee',
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Non-Mandatory Rotations
          </Typography>
          <List dense>
            {nonMandatoryRotations.map((rotation, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemText
                  primary={rotation.name}
                  secondary={
                    rotation.type === 'minMax'
                      ? `Min: ${rotation.min}, Max: ${rotation.max}`
                      : `Exact: ${rotation.exact}`
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      {/* Vacation Crosstab */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        Vacation Overview
      </Typography>
      <TableContainer component={Paper} sx={{ bgcolor: '#fafafa', mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 0.5 }}></TableCell>
              {Array.from({ length: 26 }, (_, i) => (
                <TableCell key={i} align="center" sx={{ py: 0.5 }}>
                  {i + 1}
                </TableCell>
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
    </Box>
  );
};

export default ReviewTab;