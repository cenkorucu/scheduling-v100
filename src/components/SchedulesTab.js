// src/components/SchedulesTab.js
import React, { useState, useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { generateSchedule } from '../utils/scheduleUtils';
import { getBlockDates, getRotationColors } from '../utils/uiUtils';

const SchedulesTab = ({ residents, rotations, selectedSet }) => {
  const [scheduleData, setScheduleData] = useState(generateSchedule(residents, rotations[selectedSet]));
  const blockDates = getBlockDates();

  const allRotations = useMemo(() => {
    const fromRotations = (rotations[selectedSet] || []).filter((r) => r && r.name).map((r) => ({ name: r.name }));
    const fromSchedule = [];
    Object.values(scheduleData).forEach((blocks) => {
      blocks.forEach((rotation) => {
        if (!fromSchedule.some((r) => r.name === rotation) && !fromRotations.some((r) => r.name === rotation)) {
          fromSchedule.push({ name: rotation });
        }
      });
    });
    return [...fromRotations, ...fromSchedule];
  }, [scheduleData, rotations, selectedSet]);

  const rotationColors = getRotationColors(allRotations);
  const rotationNames = [
    ...(rotations[selectedSet] || []).filter((r) => r.included).map((r) => r.name),
    ...(rotations[selectedSet] && rotations[selectedSet].some((r) => r.name === 'Ambulatory') ? [] : ['Ambulatory']),
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

  const handleRefresh = () => {
    setScheduleData(generateSchedule(residents, rotations[selectedSet]));
  };

  const blockAssignments = getBlockAssignments();

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Sortable rotation cell component
  const SortableRotationCell = ({ residentName, blockIndex, rotation }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: `${residentName}-${blockIndex}`, // Unique ID per cell
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <TableCell
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        align="center"
        sx={{
          border: '1px solid #e0e0e0',
          p: 1,
          bgcolor: rotationColors[rotation] || '#f0f0f0',
          cursor: 'grab',
        }}
      >
        {rotation}
      </TableCell>
    );
  };

  // Handle drag end to swap rotations within a resident's row
  const handleDragEnd = (residentName) => (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldBlockIndex = parseInt(active.id.split('-')[1], 10);
    const newBlockIndex = parseInt(over.id.split('-')[1], 10);

    setScheduleData((prev) => {
      const newSchedule = { ...prev };
      const residentSchedule = [...newSchedule[residentName]];
      newSchedule[residentName] = arrayMove(residentSchedule, oldBlockIndex, newBlockIndex);
      return newSchedule;
    });
  };

  return (
    <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, boxShadow: 1 }}>
      {/* Table 1: Resident Schedule by Block */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Resident Schedule by Block</Typography>
        <Button variant="outlined" color="primary" onClick={handleRefresh}>
          Refresh
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ mb: 3, border: '1px solid #e0e0e0', maxHeight: 600, overflow: 'auto' }}>
        <Table sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5', position: 'sticky', top: 0, zIndex: 2 }}>
              <TableCell
                sx={{
                  border: '1px solid #e0e0e0',
                  p: 1,
                  fontWeight: 'bold',
                  position: 'sticky',
                  left: 0,
                  bgcolor: '#f5f5f5',
                  zIndex: 3,
                }}
              >
                Resident
              </TableCell>
              {Array.from({ length: 26 }, (_, i) => (
                <TableCell
                  key={i}
                  align="center"
                  sx={{ border: '1px solid #e0e0e0', p: 1, fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  Block {i + 1}
                  <br />
                  {blockDates[i]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {residents.map((resident) => (
              <DndContext
                key={resident.name}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd(resident.name)}
              >
                <SortableContext
                  items={scheduleData[resident.name].map((_, index) => `${resident.name}-${index}`)}
                  strategy={horizontalListSortingStrategy}
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        border: '1px solid #e0e0e0',
                        p: 1,
                        position: 'sticky',
                        left: 0,
                        bgcolor: '#fafafa',
                        zIndex: 1,
                      }}
                    >
                      {resident.name}
                    </TableCell>
                    {scheduleData[resident.name].map((rotation, blockIndex) => (
                      <SortableRotationCell
                        key={blockIndex}
                        residentName={resident.name}
                        blockIndex={blockIndex}
                        rotation={rotation}
                      />
                    ))}
                  </TableRow>
                </SortableContext>
              </DndContext>
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
                    const rotationData = (rotations[selectedSet] || []).find((r) => r.name === rotation);
                    const required = rotationData?.mandatory && rotationData.requiredPerBlock ? rotationData.requiredPerBlock : 1;
                    const bgcolor =
                      assigned > required ? '#cce5ff' :
                      assigned === required ? '#ccffcc' :
                      '#ffcccc';
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