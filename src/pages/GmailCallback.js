import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Container } from '@mui/material';
import axios from 'axios';

const GmailCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Connecting your Gmail account...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Gmail connection was cancelled or denied.');
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received.');
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.REACT_APP_API_URL || 'https://auto-mail-generator-backend.onrender.com/api';
        
        await axios.get(`${API_URL}/gmail/callback?code=${code}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setStatus('success');
        setMessage('Gmail connected successfully! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (err) {
        console.error('Gmail callback error:', err);
        setStatus('error');
        setMessage(err.response?.data?.error || 'Failed to connect Gmail. Please try again.');
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
      >
        {status === 'processing' && (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Connecting Gmail
            </Typography>
            <Typography color="textSecondary">
              {message}
            </Typography>
          </>
        )}

        {status === 'success' && (
          <Alert severity="success" sx={{ width: '100%' }}>
            <Typography variant="h6">{message}</Typography>
          </Alert>
        )}

        {status === 'error' && (
          <Alert severity="error" sx={{ width: '100%' }}>
            <Typography variant="h6">{message}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Redirecting to dashboard...
            </Typography>
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default GmailCallback;
















