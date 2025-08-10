import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import CreateForm from './pages/CreateForm';
import Preview from './pages/Preview';
import MyForms from './pages/MyForms';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
//import backgroundImage from './path/C:\Users\DELL-PC\Downloads\pexels-photo-1260727.jpeg'; // Import your image

export default function App(){
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{flexGrow:1}}>Customized Form Builder</Typography>
          <Button color="inherit" component={Link} to="/create">Create Form</Button>
          <Button color="inherit" component={Link} to="/myforms">My Forms</Button>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<CreateForm/>} />
        <Route path="/create" element={<CreateForm/>} />
        <Route path="/preview" element={<Preview/>} />
        <Route path="/myforms" element={<MyForms/>} />
      </Routes>
    </>
  );
}
