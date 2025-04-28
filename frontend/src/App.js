import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import RequestList from './components/requests/RequestList';
import RequestForm from './components/requests/RequestForm';
import History from './components/History';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';

const theme = createTheme({
  palette: {
    primary: {
      main: '#b71c1c',
    },
    secondary: {
      main: '#f8bbd0',
    },
    background: {
      default: '#fff5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#fff5f5',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
<<<<<<< Updated upstream
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/requests" element={<RequestList />} />
            <Route path="/requests/new" element={<RequestForm />} />
            <Route path="/history" element={<History />} />
            <Route path="/" element={<Home />} />
          </Routes>
=======
          <Box sx={{ 
            minHeight: '100vh',
            backgroundColor: 'background.default',
            backgroundImage: 'linear-gradient(to bottom, #fff5f5, #ffe5e5)',
          }}>
            <Navbar />
            <Box sx={{ 
              pt: 2,
              pb: 4,
              minHeight: 'calc(100vh - 64px)',
            }}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/requests" element={<RequestList />} />
                <Route path="/requests/new" element={<RequestForm />} />
                <Route path="/history" element={<History />} />
                <Route path="/" element={<Dashboard />} />
              </Routes>
            </Box>
          </Box>
>>>>>>> Stashed changes
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 