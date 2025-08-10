import React, { useMemo, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../utils/hooks';
import {
  Box, TextField, Checkbox, FormControlLabel, Button, MenuItem,
  RadioGroup, Radio, Typography
} from '@mui/material';
import { saveWorkingForm } from '../slices/formBuilderSlice';
import { useNavigate, useLocation } from 'react-router-dom';

function evaluateDerived(expr: string, values: Record<string, any>) {
  try {
    const tpl = expr.replace(/\$\{([^}]+)\}/g, (_match, id) => {
      const v = values[id];
      if (typeof v === 'string') {
        const n = Number(v);
        if (!isNaN(n)) return String(n);
        return JSON.stringify(v);
      }
      if (typeof v === 'number' || typeof v === 'boolean') {
        return String(v);
      }
      return '0';
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

  function recalcDerived(next: Record<string, any>) {
    for (const df of derivedFields) {
      if (df.derived) {
        const aliasMap: Record<string, any> = {};
        df.derived.parents.forEach((pid, idx) => {
          const parentField = workingForm?.fields.find(f => f.id === pid);
          let val = next[pid];
          if (parentField?.type === 'number') {
            val = parseFloat(val);
            if (isNaN(val)) val = 0;
          }
          aliasMap[String.fromCharCode(97 + idx)] = val;
        });
        const val = evaluateDerived(df.derived.expression, aliasMap);
        next[df.id] = val;
      }
    }
    return next;
  }

  useEffect(() => {
    if (!workingForm) return;
    setValues(prev => {
      const next = { ...prev };
      return recalcDerived(next);
    });
  }, [workingForm, derivedFields]);

  if (!workingForm) return <Typography>No form to preview</Typography>;

  function handleChange(id: string, v: any) {
    setValues(prev => {
      const next = { ...prev, [id]: v };
      return recalcDerived(next);
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
          const isReadOnly = mode === 'view';
          switch (f.type) {
            case 'text':
            case 'number':
              return <Box key={f.id} display="flex" alignItems="left" gap={2}>
                <Typography sx={{ minWidth: 150 }}>{f.label}</Typography>
                <TextField
                  key={f.id}
                  label={f.label}
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={values[f.id] ?? f.defaultValue ?? ''}
                  onChange={e => handleChange(f.id, e.target.value)}
                  helperText={errors[f.id]}
                  InputProps={{ readOnly: isReadOnly }}
                />
              </Box>
            case 'date':
              return <Box key={f.id} display="flex" alignItems="left" gap={2}>
                <Typography sx={{ minWidth: 150 }}>{f.label}</Typography>
                <TextField
                  key={f.id}
                  type="date"
                  value={values[f.id] ?? f.defaultValue ?? ''}
                  onChange={e => handleChange(f.id, e.target.value)}
                  helperText={errors[f.id]}
                  InputProps={{ readOnly: isReadOnly }}
                />
              </Box>
            case 'textarea':
              return <TextField
                key={f.id}
                label={f.label}
                multiline
                margin='normal'
                minRows={3}
                value={values[f.id] ?? f.defaultValue ?? ''}
                onChange={e => handleChange(f.id, e.target.value)}
                helperText={errors[f.id]}
                InputProps={{ readOnly: isReadOnly }}
              />;
            case 'select':
              return <TextField
                key={f.id}
                select
                label={f.label}
                value={values[f.id] ?? f.defaultValue ?? ''}
                onChange={e => handleChange(f.id, e.target.value)}
                helperText={errors[f.id]}
                SelectProps={{ readOnly: isReadOnly }}
              >
                {f.options?.map(o => <MenuItem key={o.id} value={o.value}>{o.label}</MenuItem>)}
              </TextField>;
            case 'radio':
              return <Box key={f.id}>
                <Typography>{f.label}</Typography>
                <RadioGroup
                  value={values[f.id] ?? f.defaultValue ?? ''}
                  onChange={e => handleChange(f.id, e.target.value)}
                >
                  {f.options?.map(o => <FormControlLabel key={o.id} value={o.value} control={<Radio disabled={isReadOnly} />} label={o.label} />)}
                </RadioGroup>
              </Box>;
            case 'checkbox':
              if (!f.options || f.options.length === 0) {
                return false;
              }
              else {
                return <Box key={f.id}>
                  <Typography>{f.label}</Typography>
                  {f.options.map(o => (
                    <FormControlLabel
                      key={o.id} control={
                        <Checkbox
                          checked={Array.isArray(values[f.id]) ? values[f.id].includes(o.value) : false}
                          onChange={e => {
                            const checked = e.target.checked;
                            setValues(prev => {
                              const prevArr = Array.isArray(prev[f.id]) ? prev[f.id] : [];
                              const newArr = checked
                                ? [...prevArr, o.value]
                                : prevArr.filter((val: any) => val !== o.value);
                              const next = { ...prev, [f.id]: newArr };
                              return recalcDerived(next);
                            });
                          }}
                          disabled={isReadOnly}
                        />
                      }
                      label={o.label}
                    />
                  ))}
                </Box>
                  ;
              }


            default:
              return null;
          }
        })}
        {String(mode).toLowerCase() !== 'view' ? (
          <Box mt={4} display="flex" justifyContent="space-between">
            <Button variant="contained" onClick={() => nav('/create')}>
              Back
            </Button>
            <Button variant="contained" type="submit">
              Save Form
            </Button>
          </Box>
        ) : (
          <Box mt={4} display="flex" justifyContent="space-between">
            <Button variant="contained" onClick={() => nav('/myforms')}>
              Back
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
