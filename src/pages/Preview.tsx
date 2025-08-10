import React, { useMemo, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../utils/hooks';
import {
  Box, TextField, Checkbox, FormControlLabel, Button, MenuItem,
  RadioGroup, Radio, Typography
} from '@mui/material';
import { saveWorkingForm } from '../slices/formBuilderSlice';
import { useNavigate, useLocation } from 'react-router-dom';

function evaluateDerived(expr: string, values: Record<string, any>) {
  try {
    const tpl = expr.replace(/\$\{([^}]+)\}/g, (_, id) => {
      const v = values[id];
      if (typeof v === 'string') return '`' + v + '`';
      return String(v ?? '0');
    });
    // eslint-disable-next-line no-new-func
    const fn = new Function('return (' + tpl + ');');
    return fn();
  } catch {
    return '';
  }
}

export default function Preview() {
  const workingForm = useAppSelector(s => s.formBuilder.workingForm);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const derivedFields = useMemo(() => workingForm?.fields.filter(f => f.derived) || [], [workingForm]);
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const mode = params.get('mode'); // 'create' or 'view'

  if (!workingForm) return <Typography>No form to preview</Typography>;

  function handleChange(id: string, v: any) {
    setValues(prev => {
      const next = { ...prev, [id]: v };
      for (const df of derivedFields) {
        if (df.derived) {
          const val = evaluateDerived(df.derived.expression, next);
          next[df.id] = val;
        }
      }
      return next;
    });
  }

  function validate(): boolean {
    if (!workingForm) return false;
    const errs: Record<string, string> = {};
    for (const f of workingForm.fields) {
      const val = values[f.id];
      if (f.required && (val === undefined || val === '' || val === null || (Array.isArray(val) && val.length === 0))) {
        errs[f.id] = 'Required';
        continue;
      }
      if (f.validation?.minLength && typeof val === 'string' && val.length < f.validation.minLength) {
        errs[f.id] = 'Too short';
      }
      if (f.validation?.maxLength && typeof val === 'string' && val.length > f.validation.maxLength) {
        errs[f.id] = 'Too long';
      }
      if (f.validation?.pattern) {
        try { const re = new RegExp(f.validation.pattern); if (!re.test(val || '')) errs[f.id] = 'Invalid format'; } catch { }
      }
      if (f.validation?.customPassword && typeof val === 'string') {
        if (val.length < 8 || !/\d/.test(val)) errs[f.id] = 'Password must be >=8 chars and contain a number';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (validate()) {
      if (!workingForm) { return false; }
      dispatch(saveWorkingForm({ name: workingForm.name || ' ' }));
      nav('/create');
    }
  }

  return (
    <Box mt={2}
    sx={{
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      p: 2
    }}>
      <Typography variant="h6">{workingForm.name}</Typography>
      <Box component="form" onSubmit={e => { e.preventDefault(); handleSubmit(); }}
        display="flex" flexDirection="column" gap={2}>
        {workingForm.fields.map(f => {
          if (f.derived) {
            return <TextField key={f.id} label={f.label} value={values[f.id] ?? ''} InputProps={{ readOnly: true }} helperText={errors[f.id]} />;
          }
          switch (f.type) {
            case 'text':
            case 'number':
              return <Box key={f.id} display="flex" alignItems="left" gap={2}>
                <Typography sx={{ minWidth: 150 }}>{f.label}</Typography>
                <TextField key={f.id} label={f.label}
                  type={f.type === 'number' ? 'number' : f.type === 'text' ? 'text' : 'text'}
                  value={values[f.id] ?? f.defaultValue ?? ''}
                  onChange={e => handleChange(f.id, e.target.value)}
                  helperText={errors[f.id]} />
              </Box>
            case 'date':
              return <Box key={f.id} display="flex" alignItems="left" gap={2}>
                <Typography sx={{ minWidth: 150 }}>{f.label}</Typography>
                <TextField key={f.id} //label={f.label}
                  type={f.type === 'date' ? 'date' : 'text'}
                  value={values[f.id] ?? f.defaultValue ?? ''}
                  onChange={e => handleChange(f.id, e.target.value)}
                  helperText={errors[f.id]} />
              </Box>
            case 'textarea':
              return <TextField key={f.id} label={f.label} multiline margin='normal' minRows={3}
                value={values[f.id] ?? f.defaultValue ?? ''}
                onChange={e => handleChange(f.id, e.target.value)}
                helperText={errors[f.id]} />;

            case 'select':
              return <TextField key={f.id} select label={f.label}
                value={values[f.id] ?? f.defaultValue ?? ''}
                onChange={e => handleChange(f.id, e.target.value)}
                helperText={errors[f.id]}>
                {f.options?.map(o => <MenuItem key={o.id} value={o.value}>{o.label}</MenuItem>)}
              </TextField>;

            case 'radio':
              return <Box key={f.id}>
                <Typography>{f.label}</Typography>
                <RadioGroup value={values[f.id] ?? f.defaultValue ?? ''}
                  onChange={e => handleChange(f.id, e.target.value)}>
                  {f.options?.map(o => <FormControlLabel key={o.id} value={o.value} control={<Radio />} label={o.label} />)}
                </RadioGroup>
              </Box>;

            case 'checkbox':
              return <FormControlLabel key={f.id}
                control={<Checkbox checked={!!values[f.id]}
                  onChange={e => handleChange(f.id, e.target.checked)} />}
                label={f.label} />;
            default:
              return null;
          }
        })}

        <Box mt={4} display="flex" justifyContent="space-between">

        <Button
              variant="contained"
              onClick={() => nav('/myforms')}
            >
              Back
            </Button>
            <Button variant="contained" type="submit">
              Save Form
            </Button>
        </Box>
      </Box>
    </Box>
  );
}
