import React, { useState } from 'react';
import { Container, Card, CardContent, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authAPI.register(form);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (error) {
      alert('Registration failed: ' + error.response?.data?.error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>
            Create Account
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              margin="normal"
              required
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Register
            </Button>
            <Button onClick={() => navigate('/login')} fullWidth sx={{ mt: 1 }}>
              Already have an account? Login
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Register;
