// src/components/SchedulesTab.js
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
  Button,
  Tooltip,
} from '@mui/material';
import { generateSchedule } from '../rules/scheduleGenerator';

const SchedulesTab = ({ residents = [], rotations = [], scheduleData = { schedule: [], violations: [] }, setScheduleData }) => {
  const [schedule, setSchedule] = useState(scheduleData.schedule);
  const [violations, setViolations] = useState(scheduleData.violations);

  useEffect(() => {
    console.log('SchedulesTab props:', { residents, rotations, scheduleData });
  }, [residents, rotations, scheduleData]);

  useEffect(() => {
    if (scheduleData.schedule.length > 0 && scheduleData.schedule.length === residents.length) {
      setSchedule(scheduleData.schedule);
      setViolations(scheduleData.violations);
    } else if (Array.isArray(residents) && residents.length > 0) {
      setSchedule(residents.map(() => Array(26).fill('')));
      setViolations([]);
    } else {
      setSchedule([]);
      setViolations([]);
    }
  }, [residents, scheduleData]);

  const startDate = new Date('2025-07-01');
  const blockHeaders = Array.from({ length: 26 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 14);
    return {
      block: i + 1,
      date: `${date.getMonth() + 1}/${date.getDate()}`,
    };
  });

  const handleGenerateSchedule = () => {
    try {
      const validatedResidents = residents.map(resident => ({
        name: resident.name,
        group: resident.group || "A",
        vacation1: resident.vacation1?.toString() || "1",
        vacation2: resident.vacation2?.toString() || "2",
      }));

      const validatedRotations = rotations
        .filter(r => r.included)
        .map(rotation => ({
          name: rotation.name,
          isMandatory: rotation.isMandatory ?? false,
          type: rotation.type || "minMax",
          min: rotation.min?.toString() || "1",
          max: rotation.max?.toString() || "1",
          exact: rotation.exact?.toString() || "",
          requiredCount: rotation.isMandatory ? (rotation.requiredCount || 1) : 1,
        }));

      console.log("Transformed Residents:", validatedResidents);
      console.log("Transformed Rotations:", validatedRotations);

      if (validatedResidents.length === 0) {
        throw new Error("No residents available to schedule.");
      }
      if (validatedRotations.length === 0) {
        throw new Error("No rotations available to schedule.");
      }

      const { schedule: newSchedule, violations: newViolations } = generateSchedule(validatedResidents, validatedRotations);
      setSchedule(newSchedule);
      setViolations(newViolations);
      setScheduleData({ schedule: newSchedule, violations: newViolations });
    } catch (error) {
      console.error("Error generating schedule:", error);
      alert(`Failed to generate schedule: ${error.message}`);
    }
  };

  const mandatoryRotations = rotations.filter(r => r.isMandatory && r.included);
  const nonMandatoryRotations = rotations.filter(r => !r.isMandatory && r.included);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Schedules
      </Typography>

      {/* Display Resident List */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Residents
        </Typography>
        {residents.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.200' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ambulatory Group</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Vacation 1 (Block)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Vacation 2 (Block)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {residents.map((resident, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                    <TableCell>{resident.name}</TableCell>
                    <TableCell>{resident.group || "A"}</TableCell>
                    <TableCell>{resident.vacation1 || "1"}</TableCell>
                    <TableCell>{resident.vacation2 || "2"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No residents available.</Typography>
        )}
      </Box>

      {/* Display Mandatory Rotations */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Mandatory Rotations
        </Typography>
        {mandatoryRotations.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.200' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Min/Max or Exact</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Required Residents per Block</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mandatoryRotations.map((rotation, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                    <TableCell>{rotation.name}</TableCell>
                    <TableCell>{rotation.type || "minMax"}</TableCell>
                    <TableCell>
                      {rotation.type === "exact" ? `Exactly ${rotation.exact || "0"}` : `${rotation.min || "1"} - ${rotation.max || "1"} blocks`}
                    </TableCell>
                    <TableCell>{rotation.requiredCount || 1}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No mandatory rotations available.</Typography>
        )}
      </Box>

      {/* Display Non-Mandatory Rotations */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Non-Mandatory Rotations
        </Typography>
        {nonMandatoryRotations.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.200' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Min/Max or Exact</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nonMandatoryRotations.map((rotation, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                    <TableCell>{rotation.name}</TableCell>
                    <TableCell>{rotation.type || "minMax"}</TableCell>
                    <TableCell>
                      {rotation.type === "exact" ? `Exactly ${rotation.exact || "0"}` : `${rotation.min || "1"} - ${rotation.max || "1"} blocks`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No non-mandatory rotations available.</Typography>
        )}
      </Box>

      <Button variant="contained" color="primary" onClick={handleGenerateSchedule} sx={{ mb: 3 }}>
        Generate Schedule
      </Button>

      {/* Schedule Table with Improved UI */}
      {Array.isArray(residents) && schedule.length > 0 ? (
        <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto', boxShadow: 3 }}>
          <Table stickyHeader sx={{ tableLayout: 'auto', borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                    bgcolor: 'primary.light',
                    borderRight: '1px solid',
                    borderColor: 'grey.300',
                    minWidth: 150,
                  }}
                >
                  Resident
                </TableCell>
                {blockHeaders.map((header, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      borderRight: '1px solid',
                      borderColor: 'grey.300',
                      padding: '8px',
                      textAlign: 'center',
                      minWidth: 100,
                    }}
                  >
                    {`Block ${header.block}`} <br /> {header.date}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {residents.map((resident, residentIndex) => (
                <TableRow key={resident.name} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      bgcolor: 'inherit',
                      borderRight: '1px solid',
                      borderColor: 'grey.300',
                      padding: '8px',
                      minWidth: 150,
                    }}
                  >
                    {resident.name}
                  </TableCell>
                  {schedule[residentIndex].map((rotation, blockIndex) => {
                    const isViolation = violations.some(
                      v => v.residentIndex === residentIndex && v.block === blockIndex + 1
                    );
                    const violationDetail = violations.find(
                      v => v.residentIndex === residentIndex && v.block === blockIndex + 1
                    );
                    return (
                      <Tooltip
                        key={blockIndex}
                        title={isViolation ? `Violation: ${violationDetail?.type}` : rotation || ''}
                        arrow
                      >
                        <TableCell
                          sx={{
                            bgcolor: isViolation
                              ? 'red.100'
                              : rotation === 'Vacation'
                              ? 'green.100'
                              : rotation === 'Ambulatory'
                              ? 'blue.100'
                              : 'inherit',
                            borderRight: '1px solid',
                            borderBottom: '1px solid',
                            borderColor: 'grey.300',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            minWidth: 100,
                            '&:hover': {
                              bgcolor: isViolation ? 'red.200' : 'grey.200',
                            },
                          }}
                        >
                          {rotation || '-'}
                        </TableCell>
                      </Tooltip>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>Please generate a schedule to view.</Typography>
      )}
    </Box>
  );
};

export default SchedulesTab;