import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { generateSchedule } from '../utils/schedulingAlgorithm';

const SchedulesTab = ({ residents, rotations }) => {
  const [schedule, setSchedule] = useState([]);
  const [violations, setViolations] = useState([]);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const { schedule, violations } = generateSchedule(residents, rotations);
    setSchedule(schedule);
    setViolations(violations);
  }, [residents, rotations]);

  const handleCellEdit = (residentIndex, blockIndex, value) => {
    const newSchedule = [...schedule];
    newSchedule[residentIndex][blockIndex] = value;
    setSchedule(newSchedule);
  };

  const getCellColor = (residentIndex, blockIndex) => {
    const cellValue = schedule[residentIndex]?.[blockIndex];
    const violation = violations.find(v => 
      v.residentIndex === residentIndex && v.blockIndex === blockIndex
    );

    if (violation) {
      return violation.type === 'maxExceeded' ? '#ffb6c1' : '#ffcccc'; // Pink or red
    }
    return cellValue ? '#f0f0f0' : '#ffffff'; // Light gray for assigned, white for empty
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Resident Schedule</Typography>
        <Tooltip title={editMode ? "Exit edit mode" : "Edit schedule"}>
          <IconButton onClick={() => setEditMode(!editMode)} color="primary">
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, zIndex: 1, bgcolor: 'white' }}>
                Resident
              </TableCell>
              {Array.from({ length: 26 }, (_, i) => (
                <TableCell key={i} align="center" sx={{ fontWeight: 'bold' }}>
                  {i + 1}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {residents.map((resident, residentIndex) => (
              <TableRow key={residentIndex}>
                <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'white' }}>
                  {resident.name} (G{resident.group})
                </TableCell>
                {schedule[residentIndex]?.map((rotation, blockIndex) => (
                  <TableCell
                    key={blockIndex}
                    align="center"
                    sx={{ 
                      bgcolor: getCellColor(residentIndex, blockIndex),
                      minWidth: 80,
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    {editMode ? (
                      <select
                        value={rotation || ''}
                        onChange={(e) => handleCellEdit(residentIndex, blockIndex, e.target.value)}
                        style={{ width: '100%', border: 'none', background: 'transparent' }}
                      >
                        <option value="">Empty</option>
                        {rotations.map((r, i) => (
                          <option key={i} value={r.name}>{r.name}</option>
                        ))}
                      </select>
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
    </Box>
  );
};

export default SchedulesTab;
