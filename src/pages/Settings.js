import React, { useState, useEffect } from 'react';
import {
  Container, Card, CardContent, Typography, Button, TextField,
  Box, AppBar, Toolbar, IconButton, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { ArrowBack, Google } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    whatsappNumber: '',
    emailPreferences: {
      tone: 'professional',
      signOff: 'Best regards',
      signature: ''
    }
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      await authAPI.updateProfile(profile);
      alert('✅ Settings saved successfully!');
    } catch (error) {
      alert('❌ Failed to save settings');
    }
  };

  const handleConnectGmail = async () => {
    try {
      const response = await authAPI.connectGmail();
      window.location.href = response.data.url;
    } catch (error) {
      alert('❌ Failed to connect Gmail');
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6">Settings</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* Account Connection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Email Accounts</Typography>
            <Box display="flex" gap={2} mt={2}>
              <Button
                variant="contained"
                startIcon={<Google />}
                onClick={handleConnectGmail}
              >
                Connect Gmail
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* WhatsApp */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>WhatsApp</Typography>
            <TextField
              fullWidth
              label="WhatsApp Number"
              value={profile.whatsappNumber || ''}
              onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
              placeholder="+1234567890"
              helperText="Include country code (e.g., +1 for US)"
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>

        {/* Email Preferences */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Email Preferences</Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Reply Tone</InputLabel>
              <Select
                value={profile.emailPreferences?.tone || 'professional'}
                onChange={(e) => setProfile({
                  ...profile,
                  emailPreferences: { ...profile.emailPreferences, tone: e.target.value }
                })}
              >
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
                <MenuItem value="friendly">Friendly</MenuItem>
                <MenuItem value="formal">Formal</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Sign-off"
              value={profile.emailPreferences?.signOff || ''}
              onChange={(e) => setProfile({
                ...profile,
                emailPreferences: { ...profile.emailPreferences, signOff: e.target.value }
              })}
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Email Signature"
              value={profile.emailPreferences?.signature || ''}
              onChange={(e) => setProfile({
                ...profile,
                emailPreferences: { ...profile.emailPreferences, signature: e.target.value }
              })}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>

        <Button variant="contained" size="large" fullWidth onClick={handleSave}>
          Save Settings
        </Button>
      </Container>
    </>
  );
};

export default Settings;
