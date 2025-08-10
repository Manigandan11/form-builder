import React from 'react';
import { useAppSelector, useAppDispatch } from '../utils/hooks';
import { List, ListItem, ListItemText, Button, Box } from '@mui/material';
import { loadFormToPreview, deleteForm, setWorkingForm } from '../slices/formBuilderSlice';
import { useNavigate } from 'react-router-dom';

export default function MyForms() {
  const forms = useAppSelector(s => s.formBuilder.savedForms);
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  return (
    <div
    style={{
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <List>
        {forms.map(f => (
          <ListItem key={f.id}>
            <ListItemText
              primary={f.name}
              secondary={new Date(f.createdAt).toLocaleString()}
            />
            <Box display="flex" gap={1}>
              <Button variant="contained" onClick={() => {
                dispatch(loadFormToPreview(f.id));
                //dispatch(setWorkingForm(f));
                //nav('/preview ? mode=view');
                nav('/preview');
              }}>
                Open
              </Button>
              <Button variant="contained" color="error" onClick={() => {
                if (window.confirm(`Delete form "${f.name}"?`)) {
                  dispatch(deleteForm(f.id));
                }
              }}>
                Delete
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>
      {forms.length === 0 && <div>No saved forms yet</div>}
    </div>
  );
}