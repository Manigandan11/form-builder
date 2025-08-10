import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../utils/hooks';
import { addField, updateField, removeField, reorderFields, setWorkingForm, updateFormName, resetFields } from '../slices/formBuilderSlice';
import { Field } from '../types';
import {
  Box, Button, TextField, MenuItem, Paper, IconButton, List, ListItem, ListItemText
} from '@mui/material';
import { v4 as uuid } from 'uuid';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useNavigate } from 'react-router-dom';

const FIELD_TYPES = ['date', 'number', 'text', 'text area', 'select', 'radio', 'checkbox'] as const;

export default function CreateForm() {
  const dispatch = useAppDispatch();
  const workingForm = useAppSelector(s => s.formBuilder.workingForm);
  const [newType, setNewType] = useState<Field['type'] | ''>('');
  const [newLabel, setNewLabel] = useState('');
  const nav = useNavigate();

  if (!workingForm) return null;

  function addNew() {
    if (!newType) {
      alert('Please select a field type');
      return;
    }
    if (!newLabel.trim()) {
      alert('Please enter a Value for the field label');
      return;
    }
    const f: Field = {
      id: uuid(),
      type: newType,
      label: newLabel.trim(),
      required: false,
      defaultValue: '',
      validation: {},
      options: newType === 'select' || newType === 'radio'
        ? [{ id: uuid(), label: 'Option 1', value: 'opt1' }]
        : undefined,
      derived: null
    };
    dispatch(addField(f));
    setNewLabel('');
  }

  return (
    <Box mt={2}
    sx={{
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      p: 2,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {/* Controls */}
      <TextField
      
        label="Form Name"
        value={workingForm.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          dispatch(updateFormName(e.target.value))
        }
        sx={{ mb: 2 , backgroundColor: '#ffffff'}}
      />
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" /*flexWrap="wrap"*/             
         sx={{
              backgroundColor: '#ffffff'}}>
          <TextField
            select
            label="Field Type"
            value={newType}
            onChange={e => setNewType(e.target.value as any)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="" disabled>
              Select Field Type
            </MenuItem>

            {FIELD_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField
            label="Field Name"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            size="small" />

          <Button variant="contained" onClick={addNew}>Add Field</Button>
        </Box>
      </Paper>

      {/* Field List */}
      <List>
        {workingForm.fields.map((f, idx) => (
          <ListItem key={f.id} sx={{ mt: 1, p: 2, border: '2px solid #ddd' }}>
            <ListItemText
              primary={`${f.label} (${f.type})`}
              secondary={f.derived ? `Derived from: ${f.derived.parents.join(',')}` : ''}
            />
            <Box>
              <Button onClick={() => {
                const label = prompt('Label', f.label) || f.label;
                const required = confirm('Confirm?');
                const updated: Field = { ...f, label, required };
                dispatch(updateField(updated));
              }}>Edit</Button>
              <IconButton onClick={() => dispatch(reorderFields({ from: idx, to: Math.max(0, idx - 1) }))}>
                <ArrowUpwardIcon />
              </IconButton>
              <IconButton onClick={() => dispatch(reorderFields({ from: idx, to: Math.min(workingForm.fields.length - 1, idx + 1) }))}>
                <ArrowDownwardIcon />
              </IconButton>
              <IconButton onClick={() => dispatch(removeField(f.id))}>
                <DeleteIcon />
              </IconButton>
              <Button onClick={() => {
                const parents = prompt('Comma-separated parent field ids') || '';
                if (!parents) return;
                const expr = prompt('Expression like `${a} + ${b}`') || '';
                const updated: Field = { ...f, derived: { parents: parents.split(',').map(s => s.trim()), expression: expr } };
                dispatch(updateField(updated));
              }}>Make Derived</Button>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Preview Button */}
      <Box mt={4} display="flex" justifyContent="space-between">
        <Button variant="contained" color="error" onClick={() => {
          if (window.confirm('Are you sure you want to reset the form? This will discard all changes.')) {
            dispatch(setWorkingForm(null));
            dispatch(resetFields());
            setNewType('');
            // setNewLabel('');
          }
        }}>
          Reset Form </Button>
        <Button variant="contained" color="success" onClick={() => {
            if (!workingForm.name.trim()) {
              alert('Please enter a form name before previewing.');
              return;
            }
            if (workingForm.fields.length === 0) {
              alert('Please add at least one field before previewing.');
              return;
            }
            nav('/preview');
            //nav('/preview?mode=create');
          }}>
          Preview Form
        </Button>
      </Box>
    </Box>
  );
}
