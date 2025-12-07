import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Button,
  Box, CircularProgress, AppBar, Toolbar, IconButton
} from '@mui/material';
import {
  Email, WhatsApp, CheckCircle, Cancel, Refresh,
  Settings as SettingsIcon, Logout
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { emailAPI, statsAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [stats, setStats] = useState({
    pendingDrafts: 0,
    sentToday: 0,
    approvalRate: 0,
    totalProcessed: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await statsAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanInbox = async () => {
    try {
      setScanning(true);
      const response = await emailAPI.scanInbox();
      alert(`✅ Scanned! ${response.data.draftsCreated} new drafts created.`);
      loadStats();
    } catch (error) {
      alert('❌ Failed to scan: ' + (error.response?.data?.error || 'Unknown error'));
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
                      Sent Today
                    </Typography>
                    <Typography variant="h4">
                      {stats.sentToday}
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
                      Approval Rate
                    </Typography>
                    <Typography variant="h4">
                      {stats.approvalRate}%
                    </Typography>
                  </Box>
                  <WhatsApp fontSize="large" color="secondary" />
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
                      Total Processed
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalProcessed}
                    </Typography>
                  </Box>
                  <Cancel fontSize="large" color="action" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Quick Actions
                </Typography>
                <Box display="flex" gap={2} mt={2}>
                  <Button
                    variant="contained"
                    startIcon={scanning ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                    onClick={handleScanInbox}
                    disabled={scanning}
                  >
                    {scanning ? 'Scanning...' : 'Scan Inbox'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={() => navigate('/drafts')}
                  >
                    View Drafts ({stats.pendingDrafts})
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Dashboard;
