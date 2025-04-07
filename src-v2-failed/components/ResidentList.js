// src/components/ResidentList.js
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Typography,
} from '@mui/material';

const ResidentList = ({ residents, setResidents }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({});

  if (residents.length === 0) return null;

  const handleDelete = (index) => {
    setResidents(residents.filter((_, i) => i !== index));
  };

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
    <div>
      <Typography variant="h6" gutterBottom>
        Residents Added
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Vacation 1</TableCell>
              <TableCell>Vacation 2</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {residents.map((resident, index) => (
              <TableRow key={index}>
                <TableCell>{resident.name}</TableCell>
                <TableCell>
                  {editingIndex === index ? (
                    <TextField
                      type="number"
                      name="group"
                      value={editValues.group}
                      onChange={handleEditChange}
                      inputProps={{ min: 1, max: 5 }}
                      size="small"
                      sx={{ width: '60px' }}
                    />
                  ) : (
                    resident.group
                  )}
                </TableCell>
                <TableCell>
                  {editingIndex === index ? (
                    <TextField
                      type="number"
                      name="vacation1"
                      value={editValues.vacation1}
                      onChange={handleEditChange}
                      inputProps={{ min: 3, max: 25 }}
                      size="small"
                      sx={{ width: '60px' }}
                    />
                  ) : (
                    resident.vacation1
                  )}
                </TableCell>
                <TableCell>
                  {editingIndex === index ? (
                    <TextField
                      type="number"
                      name="vacation2"
                      value={editValues.vacation2}
                      onChange={handleEditChange}
                      inputProps={{ min: 3, max: 25 }}
                      size="small"
                      sx={{ width: '60px' }}
                    />
                  ) : (
                    resident.vacation2
                  )}
                </TableCell>
                <TableCell>
                  {editingIndex === index ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleEditSave(index)}
                    >
                      Save
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleEditStart(index, resident)}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(index)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ResidentList;