import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Button,
  Box, CircularProgress, AppBar, Toolbar, IconButton,
  Select, MenuItem, FormControl, InputLabel, Alert
} from '@mui/material';
import {
  Email, CheckCircle, Cancel, Refresh,
  Settings as SettingsIcon, Logout, CloudOff, CloudDone
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { emailAPI, statsAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanPeriod, setScanPeriod] = useState('day');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [stats, setStats] = useState({
    totalDrafts: 0,
    pendingDrafts: 0,
    sentEmails: 0,
    rejectedDrafts: 0,
    weeklyStats: {
      draftsCreated: 0,
      emailsSent: 0
    },
    gmailConnected: false
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getDashboard();
      setStats(response.data);
      setGmailConnected(response.data.gmailConnected);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // If stats fail, at least try to show something
      setStats({
        totalDrafts: 0,
        pendingDrafts: 0,
        sentEmails: 0,
        rejectedDrafts: 0,
        weeklyStats: { draftsCreated: 0, emailsSent: 0 },
        gmailConnected: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScanInbox = async () => {
    if (!gmailConnected) {
      alert('⚠️ Please connect Gmail first in Settings');
      navigate('/settings');
      return;
    }

    try {
      setScanning(true);
      setScanResult(null);
      const response = await emailAPI.scanInbox(scanPeriod);
      
      const result = response.data;
      setScanResult(result);
      
      if (result.draftsCreated > 0) {
        alert(`✅ Scan complete!\n\n${result.draftsCreated} drafts created\n${result.processed} emails processed\n${result.errors || 0} errors\n\n${result.note || ''}`);
      } else {
        alert(`✅ Scan complete!\nNo new emails found in the last ${scanPeriod}.`);
      }
      
      // Reload stats after scan
      setTimeout(loadStats, 1000);
    } catch (error) {
      console.error('Scan error:', error);
      alert('❌ Failed to scan: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setScanning(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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
          <Email sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Email Auto Responder
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/settings')}>
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Gmail Connection Status */}
        {!gmailConnected && (
          <Alert severity="warning" sx={{ mb: 3 }} action={
            <Button color="inherit" size="small" onClick={() => navigate('/settings')}>
              Connect Now
            </Button>
          }>
            Gmail is not connected. Connect your account to start scanning emails.
          </Alert>
        )}

        {scanResult && (
          <Alert severity="info" sx={{ mb: 3 }} onClose={() => setScanResult(null)}>
            <strong>Scan Results:</strong> {scanResult.draftsCreated} drafts created, 
            {scanResult.processed} emails processed
            {scanResult.skipped > 0 && `, ${scanResult.skipped} skipped (max 10 per scan)`}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Drafts
                    </Typography>
                    <Typography variant="h4">
                      {stats.pendingDrafts}
                    </Typography>
                  </Box>
                  <Email fontSize="large" color="primary" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Sent Emails
                    </Typography>
                    <Typography variant="h4">
                      {stats.sentEmails}
                    </Typography>
                  </Box>
                  <CheckCircle fontSize="large" color="success" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Rejected
                    </Typography>
                    <Typography variant="h4">
                      {stats.rejectedDrafts}
                    </Typography>
                  </Box>
                  <Cancel fontSize="large" color="error" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Drafts
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalDrafts}
                    </Typography>
                  </Box>
                  <Email fontSize="large" color="action" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Weekly Stats */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  This Week
                </Typography>
                <Box display="flex" justifyContent="space-around" mt={2}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {stats.weeklyStats.draftsCreated}
                    </Typography>
                    <Typography color="textSecondary">
                      Drafts Created
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {stats.weeklyStats.emailsSent}
                    </Typography>
                    <Typography color="textSecondary">
                      Emails Sent
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Gmail Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Connection Status
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mt={2}>
                  {gmailConnected ? (
                    <>
                      <CloudDone fontSize="large" color="success" />
                      <Box>
                        <Typography variant="h6" color="success.main">
                          Gmail Connected
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Ready to scan emails
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <CloudOff fontSize="large" color="error" />
                      <Box>
                        <Typography variant="h6" color="error">
                          Gmail Not Connected
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Connect in Settings
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Quick Actions
                </Typography>
                
                <Box display="flex" gap={2} alignItems="center" mt={2} flexWrap="wrap">
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Scan Period</InputLabel>
                    <Select
                      value={scanPeriod}
                      onChange={(e) => setScanPeriod(e.target.value)}
                      label="Scan Period"
                      disabled={scanning}
                    >
                      <MenuItem value="day">Last 24 Hours</MenuItem>
                      <MenuItem value="week">Last Week</MenuItem>
                      <MenuItem value="month">Last Month</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    size="large"
                    startIcon={scanning ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                    onClick={handleScanInbox}
                    disabled={scanning || !gmailConnected}
                  >
                    {scanning ? 'Scanning...' : 'Scan Inbox'}
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Email />}
                    onClick={() => navigate('/drafts')}
                    disabled={stats.pendingDrafts === 0}
                  >
                    View Drafts ({stats.pendingDrafts})
                  </Button>
                </Box>

                {scanning && (
                  <Box mt={2}>
                    <Alert severity="info">
                      Scanning inbox... This may take a few minutes. Processing max 10 emails with 21-second delays to avoid rate limits.
                    </Alert>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Dashboard;
