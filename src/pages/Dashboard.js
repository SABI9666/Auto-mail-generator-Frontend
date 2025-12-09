import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Button,
  Box, CircularProgress, AppBar, Toolbar, IconButton,
  Select, MenuItem, FormControl, InputLabel, Alert,
  Switch, FormControlLabel, Chip, Tooltip
} from '@mui/material';
import {
  Email, CheckCircle, Cancel, Refresh,
  Settings as SettingsIcon, Logout, CloudOff, CloudDone,
  PlayArrow, Stop, Schedule, TouchApp
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
  const [error, setError] = useState(null);
  
  // Auto-scan state
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [autoScanInterval, setAutoScanInterval] = useState(5);
  const [lastAutoScan, setLastAutoScan] = useState(null);
  const [togglingAutoScan, setTogglingAutoScan] = useState(false);

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
    loadAutoScanSettings();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await statsAPI.getDashboard();
      setStats(response.data);
      setGmailConnected(response.data.gmailConnected);
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
      setError('Failed to load dashboard stats: ' + (error.response?.data?.error || error.message));
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

  const loadAutoScanSettings = async () => {
    try {
      const response = await emailAPI.getAutoScanSettings();
      setAutoScanEnabled(response.data.autoScanEnabled);
      setAutoScanInterval(response.data.autoScanInterval || 5);
      setLastAutoScan(response.data.lastAutoScan);
    } catch (error) {
      console.error('Failed to load auto-scan settings:', error);
    }
  };

  const handleToggleAutoScan = async () => {
    try {
      setTogglingAutoScan(true);
      const response = await emailAPI.toggleAutoScan();
      setAutoScanEnabled(response.data.autoScanEnabled);
      
      if (response.data.autoScanEnabled) {
        alert('✅ Auto-scan enabled!\n\nNew emails will be automatically scanned and sent to WhatsApp.');
      } else {
        alert('⏹️ Auto-scan disabled.\n\nUse Manual Scan to check for new emails.');
      }
    } catch (error) {
      console.error('Toggle auto-scan error:', error);
      alert('❌ ' + (error.response?.data?.error || 'Failed to toggle auto-scan'));
    } finally {
      setTogglingAutoScan(false);
    }
  };

  const handleUpdateInterval = async (newInterval) => {
    try {
      setAutoScanInterval(newInterval);
      await emailAPI.updateAutoScanInterval(newInterval);
    } catch (error) {
      console.error('Update interval error:', error);
      alert('❌ Failed to update interval');
    }
  };

  const handleManualScan = async () => {
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
      
      setTimeout(loadStats, 1000);
    } catch (error) {
      console.error('❌ Scan error:', error);
      alert('❌ Failed to scan: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setScanning(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatLastScan = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
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
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

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
                      {stats.weeklyStats?.draftsCreated || 0}
                    </Typography>
                    <Typography color="textSecondary">
                      Drafts Created
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {stats.weeklyStats?.emailsSent || 0}
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

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SCAN MODE SELECTOR - Manual vs Auto */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: autoScanEnabled ? '#e8f5e9' : '#fff3e0' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    {autoScanEnabled ? (
                      <PlayArrow fontSize="large" color="success" />
                    ) : (
                      <TouchApp fontSize="large" color="warning" />
                    )}
                    <Box>
                      <Typography variant="h6">
                        Scan Mode: {autoScanEnabled ? 'Auto Scan' : 'Manual Scan'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {autoScanEnabled 
                          ? `Automatically scanning every ${autoScanInterval} minute(s)`
                          : 'Click "Scan Inbox" to check for new emails'
                        }
                      </Typography>
                      {autoScanEnabled && lastAutoScan && (
                        <Typography variant="caption" color="textSecondary">
                          Last auto-scan: {formatLastScan(lastAutoScan)}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    {/* Auto-scan interval selector */}
                    {autoScanEnabled && (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Interval</InputLabel>
                        <Select
                          value={autoScanInterval}
                          onChange={(e) => handleUpdateInterval(e.target.value)}
                          label="Interval"
                        >
                          <MenuItem value={1}>1 minute</MenuItem>
                          <MenuItem value={5}>5 minutes</MenuItem>
                          <MenuItem value={10}>10 minutes</MenuItem>
                          <MenuItem value={15}>15 minutes</MenuItem>
                          <MenuItem value={30}>30 minutes</MenuItem>
                          <MenuItem value={60}>1 hour</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    {/* Toggle Button */}
                    <Tooltip title={autoScanEnabled ? 'Switch to Manual Scan' : 'Enable Auto Scan'}>
                      <Button
                        variant="contained"
                        color={autoScanEnabled ? 'error' : 'success'}
                        startIcon={togglingAutoScan ? <CircularProgress size={20} color="inherit" /> : (autoScanEnabled ? <Stop /> : <PlayArrow />)}
                        onClick={handleToggleAutoScan}
                        disabled={togglingAutoScan || !gmailConnected}
                      >
                        {autoScanEnabled ? 'Stop Auto Scan' : 'Start Auto Scan'}
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Status chips */}
                <Box display="flex" gap={1} mt={2}>
                  <Chip 
                    icon={autoScanEnabled ? <PlayArrow /> : <TouchApp />}
                    label={autoScanEnabled ? 'AUTO MODE' : 'MANUAL MODE'}
                    color={autoScanEnabled ? 'success' : 'warning'}
                    size="small"
                  />
                  {autoScanEnabled && (
                    <Chip 
                      icon={<Schedule />}
                      label={`Every ${autoScanInterval} min`}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* MANUAL SCAN CONTROLS */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {autoScanEnabled ? 'Manual Override' : 'Quick Actions'}
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
                    onClick={handleManualScan}
                    disabled={scanning || !gmailConnected}
                  >
                    {scanning ? 'Scanning...' : 'Manual Scan'}
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Email />}
                    onClick={() => navigate('/drafts')}
                  >
                    View Drafts ({stats.pendingDrafts})
                  </Button>

                  <Button
                    variant="text"
                    size="small"
                    onClick={() => { loadStats(); loadAutoScanSettings(); }}
                  >
                    Refresh
                  </Button>
                </Box>

                {scanning && (
                  <Box mt={2}>
                    <Alert severity="info">
                      Scanning inbox... This may take a few minutes. Processing max 10 emails with 21-second delays.
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




























































