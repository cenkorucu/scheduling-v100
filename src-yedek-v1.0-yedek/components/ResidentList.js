import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Typography, Box } from '@mui/material';

const ResidentList = ({ residents, setResidents }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({});

  if (!residents.length) return null;

  const handleDelete = (index) => setResidents(residents.filter((_, i) => i !== index));

  const handleEditStart = (index, resident) => {
    setEditingIndex(index);
    setEditValues({ ...resident });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues({ ...editValues, [name]: parseInt(value) || value });
  };

  const handleEditSave = (index) => {
    const updatedResidents = [...residents];
    updatedResidents[index] = {
      ...editValues,
      group: Math.min(editValues.group, 5),
      vacation1: Math.max(3, Math.min(editValues.vacation1, 25)),
      vacation2: Math.max(3, Math.min(editValues.vacation2, 25)),
    };
    if (updatedResidents[index].vacation1 >= updatedResidents[index].vacation2 - 3) {
      updatedResidents[index].vacation2 = updatedResidents[index].vacation1 + 4;
    }
    setResidents(updatedResidents);
    setEditingIndex(null);
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 1, borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Residents</Typography>
      <TableContainer component={Paper} sx={{ bgcolor: '#fafafa' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 1 }}>#</TableCell>
              <TableCell sx={{ py: 1 }}>Name</TableCell>
              <TableCell sx={{ py: 1 }}>Group</TableCell>
              <TableCell sx={{ py: 1 }}>Vacation 1</TableCell>
              <TableCell sx={{ py: 1 }}>Vacation 2</TableCell>
              <TableCell sx={{ py: 1 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {residents.map((resident, index) => (
              <TableRow key={index}>
                <TableCell sx={{ py: 0.5 }}>{index + 1}</TableCell>
                <TableCell sx={{ py: 0.5 }}>{resident.name}</TableCell>
                <TableCell sx={{ py: 0.5 }}>
                  {editingIndex === index ? (
                    <TextField
                      type="number"
                      name="group"
                      value={editValues.group}
                      onChange={handleEditChange}
                      inputProps={{ min: 1, max: 5 }}
                      size="small"
                      sx={{ width: '70px' }}
                    />
                  ) : (
                    resident.group
                  )}
                </TableCell>
                <TableCell sx={{ py: 0.5 }}>
                  {editingIndex === index ? (
                    <TextField
                      type="number"
                      name="vacation1"
                      value={editValues.vacation1}
                      onChange={handleEditChange}
                      inputProps={{ min: 3, max: 25 }}
                      size="small"
                      sx={{ width: '70px' }}
                    />
                  ) : (
                    resident.vacation1
                  )}
                </TableCell>
                <TableCell sx={{ py: 0.5 }}>
                  {editingIndex === index ? (
                    <TextField
                      type="number"
                      name="vacation2"
                      value={editValues.vacation2}
                      onChange={handleEditChange}
                      inputProps={{ min: 3, max: 25 }}
                      size="small"
                      sx={{ width: '70px' }}
                    />
                  ) : (
                    resident.vacation2
                  )}
                </TableCell>
                <TableCell sx={{ py: 0.5 }}>
                  {editingIndex === index ? (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleEditSave(index)}
                    >
                      Save
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => handleEditStart(index, resident)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(index)}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ResidentList;