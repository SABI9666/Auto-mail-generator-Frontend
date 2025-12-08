import React, { useState, useEffect } from 'react';
import {
  Container, Card, CardContent, Typography, Button, TextField,
  Box, AppBar, Toolbar, IconButton, Select, MenuItem, FormControl, 
  InputLabel, Alert, CircularProgress, Chip
} from '@mui/material';
import { ArrowBack, Google, CheckCircle, CloudOff } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
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

  // Check for OAuth callback success/error
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const gmailStatus = urlParams.get('gmail');
    const error = urlParams.get('error');
    
    if (gmailStatus === 'connected') {
      console.log('✅ Gmail OAuth successful!');
      setGmailConnected(true);
      setSuccessMessage('Gmail connected successfully! You can now scan your inbox.');
      
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
      
      // Reload profile to get updated data
      setTimeout(() => {
        loadProfile();
      }, 500);
    } else if (error) {
      console.error('❌ Gmail OAuth error:', error);
      setErrorMessage(`Failed to connect Gmail: ${error}`);
      window.history.replaceState({}, '', '/settings');
    }
  }, [location]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      setProfile(response.data);
      setGmailConnected(response.data.gmailConnected || false);
      console.log('Profile loaded, Gmail connected:', response.data.gmailConnected);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setErrorMessage('Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  };

  const checkGmailStatus = async () => {
    try {
      const response = await authAPI.getGmailStatus();
      setGmailConnected(response.data.connected);
      return response.data.connected;
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
      return false;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      await authAPI.updateProfile(profile);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrorMessage('Failed to save settings: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setErrorMessage('');
      const response = await authAPI.connectGmail();
      // Redirect to Gmail OAuth
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to connect Gmail:', error);
      setErrorMessage('Failed to start Gmail connection');
    }
  };

  const handleDisconnectGmail = async () => {
    if (!window.confirm('Are you sure you want to disconnect Gmail?')) return;
    
    try {
      await authAPI.disconnectGmail();
      setGmailConnected(false);
      setSuccessMessage('Gmail disconnected successfully');
      loadProfile();
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
      setErrorMessage('Failed to disconnect Gmail');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

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
        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        {/* Account Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Account Information</Typography>
            <TextField
              fullWidth
              label="Name"
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              value={profile.email || ''}
              disabled
              margin="normal"
              helperText="Email cannot be changed"
            />
          </CardContent>
        </Card>

        {/* Gmail Connection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Gmail Connection</Typography>
            
            {gmailConnected ? (
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <CheckCircle color="success" fontSize="large" />
                  <Box>
                    <Typography variant="h6" color="success.main">
                      Gmail Connected
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Email: {profile.email}
                    </Typography>
                  </Box>
                  <Chip label="Active" color="success" size="small" />
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDisconnectGmail}
                >
                  Disconnect Gmail
                </Button>
              </Box>
            ) : (
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <CloudOff color="error" fontSize="large" />
                  <Box>
                    <Typography variant="h6" color="error">
                      Gmail Not Connected
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Connect your Gmail account to start scanning emails
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Google />}
                  onClick={handleConnectGmail}
                >
                  Connect Gmail Account
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Configuration */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>WhatsApp Notifications</Typography>
            <TextField
              fullWidth
              label="WhatsApp Number"
              value={profile.whatsappNumber || ''}
              onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
              placeholder="+1234567890"
              helperText="Include country code (e.g., +91 for India, +1 for US). You'll receive draft approval notifications on WhatsApp."
              sx={{ mt: 2 }}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>WhatsApp Commands:</strong><br />
                • Reply "approve &lt;draft-id&gt;" to send email<br />
                • Reply "reject &lt;draft-id&gt;" to reject draft<br />
                • Reply "edit &lt;draft-id&gt; &lt;message&gt;" to edit and send
              </Typography>
            </Alert>
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
                label="Reply Tone"
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
              placeholder="Best regards, Sincerely, Thanks"
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
              placeholder="Your Name&#10;Your Title&#10;Company Name"
              helperText="This will be added at the end of all generated replies"
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          variant="contained" 
          size="large" 
          fullWidth 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </Container>
    </>
  );
};

export default Settings;


















































