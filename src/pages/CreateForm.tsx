import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../utils/hooks';
import { addField, updateField, removeField, reorderFields, setWorkingForm, updateFormName, resetFields } from '../slices/formBuilderSlice';
import { Field } from '../types';
import {
  Box, Button, TextField, MenuItem, Paper, IconButton, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { v4 as uuid } from 'uuid';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useNavigate, useLocation } from 'react-router-dom';

const FIELD_TYPES = ['date', 'number', 'text', 'text area', 'select', 'radio', 'checkbox'] as const;

export default function CreateForm() {
  const dispatch = useAppDispatch();
  const workingForm = useAppSelector(s => s.formBuilder.workingForm);
  const [newType, setNewType] = useState<Field['type'] | ''>('');
  const [newLabel, setNewLabel] = useState('');
  const nav = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  if( params.get('reset') === 'true') {
useEffect(() => {

    dispatch(resetFields());
    dispatch(setWorkingForm({
      id: uuid(),
      name: '',
      fields: [],
      createdAt: new Date().toISOString()
    }));
  }, [location.search, dispatch]);}

  const [derivedOpen, setDerivedOpen] = useState(false);
  const [derivedTarget, setDerivedTarget] = useState<Field | null>(null);
  const [selectedParents, setSelectedParents] = useState<string[]>([]);


  const [optionsOpen, setOptionsOpen] = useState(false);
  const [numOptions, setNumOptions] = useState(0);
  const [optionNames, setOptionNames] = useState<string[]>([]);

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

    if (newType === 'select' || newType === 'radio' || newType === 'checkbox') {
      setNumOptions(0);
      setOptionNames([]);
      setOptionsOpen(true);
    } 
    else {
      const f: Field = {
        id: uuid(),
        type: newType,
        label: newLabel.trim(),
        required: false,
        defaultValue: '',
        validation: {},
        options: undefined,
        derived: null
      };
      dispatch(addField(f));
      setNewLabel('');
    }
  }

  function confirmAddWithOptions() {
    if (numOptions <= 0 || optionNames.some(name => !name.trim())) {
      alert('Please enter valid option names.');
      return;
    }
    const f: Field = {
      id: uuid(),
      type: newType as Field['type'],
      label: newLabel.trim(),
      required: false,
      defaultValue: '',
      validation: {},
      options: optionNames.map(name => ({
        id: uuid(),
        label: name,
        value: name
      })),
      derived: null
    };
    dispatch(addField(f));
    setNewLabel('');
    setOptionsOpen(false);
  }

  function handleParentToggle(id: string) {
    setSelectedParents(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  function confirmDerived() {
    if (!derivedTarget || selectedParents.length === 0) {
      alert("Please select at least one parent field.");
      return;
    }

    const operation = prompt("Enter operation: Add, Subtract, Multiply, Divide") || '';
    const op = operation.toLowerCase();

    let symbol = '+';
    if (op.startsWith('sub')) symbol = '-';
    else if (op.startsWith('mul')) symbol = '*';
    else if (op.startsWith('div')) symbol = '/';

    const aliases = selectedParents.map((_, i) => `\${${String.fromCharCode(97 + i)}}`);
    const expr = aliases.join(` ${symbol} `);

    const updated: Field = {
      ...derivedTarget,
      derived: {
        parents: selectedParents,
        expression: expr
      }
    };
    dispatch(updateField(updated));
    setDerivedOpen(false);
    setSelectedParents([]);
    setDerivedTarget(null);
  }

  return (
    <Box mt={2}
      sx={{
        backgroundColor: '#f0f0f0',
        minHeight: '100vh',
        p: 2,
        padding: '20px',
        display: 'display-box',
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
        sx={{ mb: 2, backgroundColor: '#ffffff' }}
      />
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center"
          sx={{
            backgroundColor: '#ffffff',
          }}>
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
              secondary={
                f.derived
                  ? `Derived from: ${f.derived.parents
                    .map(pid => workingForm.fields.find(ff => ff.id === pid)?.label || pid)
                    .join(', ')}`
                  : ''
              }
            />
            <Box>
              <Button onClick={() => {
                const label = prompt('Label', f.label) || f.label;
                const required = confirm('Confirm?');
                const updated: Field = { ...f, label, required };
                dispatch(updateField(updated));
              }}>Edit</Button>
              <Button
                onClick={() => {
                  const eligibleParents = workingForm.fields.filter(
                    pf => pf.id !== f.id && pf.type === f.type
                  );
                  if (eligibleParents.length === 0) {
                    alert(`No fields of type "${f.type}" available to derive from.`);
                    return;
                  }
                  setDerivedTarget(f);
                  setDerivedOpen(true);
                }}
              >
                Make Derived
              </Button>
              <IconButton onClick={() => dispatch(reorderFields({ from: idx, to: Math.max(0, idx - 1) }))}>
                <ArrowUpwardIcon />
              </IconButton>
              <IconButton onClick={() => dispatch(reorderFields({ from: idx, to: Math.min(workingForm.fields.length - 1, idx + 1) }))}>
                <ArrowDownwardIcon />
              </IconButton>
              <IconButton onClick={() => dispatch(removeField(f.id))}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Derived Selection Dialog */}
      <Dialog open={derivedOpen} onClose={() => setDerivedOpen(false)} fullWidth>
        <DialogTitle>Select Parent Fields</DialogTitle>
        <DialogContent>
          <FormGroup>
            {derivedTarget && workingForm.fields
              .filter(pf => pf.id !== derivedTarget.id && pf.type === derivedTarget.type)
              .map(pf => (
                <FormControlLabel
                  key={pf.id}
                  control={
                    <Checkbox
                      checked={selectedParents.includes(pf.id)}
                      onChange={() => handleParentToggle(pf.id)}
                    />
                  }
                  label={pf.label}
                />
              ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDerivedOpen(false)}>Cancel</Button>
          <Button onClick={confirmDerived} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Options Dialog */}
      <Dialog open={optionsOpen} onClose={() => setOptionsOpen(false)} fullWidth>
        <DialogTitle>Enter Options</DialogTitle>
        <DialogContent>
          <TextField
            type="number"
            label="Number of options"
            value={numOptions}
            onChange={(e) => {
              const count = parseInt(e.target.value) || 0;
              setNumOptions(count);
              setOptionNames(Array.from({ length: count }, (_, i) => optionNames[i] || `Option ${i + 1}`));
            }}
            sx={{ mb: 2 }}
          />
          {Array.from({ length: numOptions }).map((_, i) => (
            <TextField
              key={i}
              label={`Option ${i + 1} Name`}
              value={optionNames[i] || ''}
              onChange={(e) => {
                const updated = [...optionNames];
                updated[i] = e.target.value;
                setOptionNames(updated);
              }}
              sx={{ mb: 1, display: 'block' }}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOptionsOpen(false)}>Cancel</Button>
          <Button onClick={confirmAddWithOptions} variant="contained" color="primary">
            Add Field
          </Button>
        </DialogActions>
      </Dialog>

      <Box mt={4} display="flex" justifyContent="space-between">
        <Button variant="contained" color="error" onClick={() => {
          if (window.confirm('Are you sure you want to reset the form? This will discard all changes.')) {
            dispatch(setWorkingForm(null));
            dispatch(resetFields());
            setNewType('');
          }
        }}>
          Reset Form
        </Button>
        <Button variant="contained" color="success" onClick={() => {
          if (!workingForm.name.trim()) {
            alert('Please enter a form name before previewing.');
            return;
          }
          if (workingForm.fields.length === 0) {
            alert('Please add at least one field before previewing.');
            return;
          }
          //nav('/preview');
          nav(`/preview?mode=create&id=${workingForm.id}`);
        }}>
          Preview Form
        </Button>
      </Box>
    </Box>
  );
}
