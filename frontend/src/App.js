import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
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
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 