import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { CssBaseline, Container } from '@mui/material';
import App from './App';
import store from './store';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <CssBaseline />
        <Container sx={{mt:4}}>
          <App />
        </Container>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
