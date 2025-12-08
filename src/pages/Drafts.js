import React, { useState, useEffect } from 'react';
import {
  Container, Card, CardContent, Typography, Button, Box,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, AppBar, Toolbar, IconButton,
  FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, Edit, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { emailAPI } from '../services/api';

const Drafts = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedBody, setEditedBody] = useState('');
  const [period, setPeriod] = useState('week');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDrafts();
  }, [period]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getPendingDrafts(period);
      // The response might have drafts directly or nested
      const draftsData = response.data.drafts || response.data || [];
      setDrafts(Array.isArray(draftsData) ? draftsData : []);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      setMessage('Failed to load drafts: ' + (error.response?.data?.error || error.message));
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (draft) => {
    try {
      setProcessing(true);
      await emailAPI.approveDraft(draft.id);
      setMessage(`✅ Email sent successfully to ${draft.to}!`);
      loadDrafts();
      setSelectedDraft(null);
    } catch (error) {
      console.error('Failed to approve draft:', error);
      setMessage('❌ Failed to send email: ' + (error.response?.data?.error || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (draft) => {
    if (!window.confirm(`Reject draft to ${draft.to}?`)) return;
    
    try {
      setProcessing(true);
      await emailAPI.rejectDraft(draft.id);
      setMessage(`Draft rejected`);
      loadDrafts();
      setSelectedDraft(null);
    } catch (error) {
      console.error('Failed to reject draft:', error);
      setMessage('❌ Failed to reject draft');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!editedBody.trim()) {
      alert('Please enter your edited message');
      return;
    }

    try {
      setProcessing(true);
      await emailAPI.editDraft(selectedDraft.id, editedBody);
      setMessage(`✅ Edited email sent successfully to ${selectedDraft.to}!`);
      loadDrafts();
      setSelectedDraft(null);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to send edited draft:', error);
      setMessage('❌ Failed to send edited email: ' + (error.response?.data?.error || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Pending Drafts ({drafts.length})
          </Typography>
          <IconButton color="inherit" onClick={loadDrafts}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* Message Alert */}
        {message && (
          <Alert 
            severity={message.includes('✅') ? 'success' : 'error'} 
            sx={{ mb: 3 }}
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}

        {/* Period Filter */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              label="Time Period"
            >
              <MenuItem value="day">Last 24 Hours</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDrafts}
          >
            Refresh
          </Button>
        </Box>

        {/* Drafts List */}
        {drafts.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" align="center" color="textSecondary">
                No pending drafts found
              </Typography>
              <Typography variant="body2" align="center" color="textSecondary" sx={{ mt: 1 }}>
                Try scanning your inbox from the dashboard
              </Typography>
              <Box display="flex" justifyContent="center" mt={2}>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          drafts.map(draft => (
            <Card key={draft.id} sx={{ mb: 2 }}>
              <CardContent>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="textSecondary">
                      From: {draft.from || draft.senderEmail || 'Unknown'}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      To: {draft.to || 'Unknown'}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {draft.subject || 'No Subject'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Created: {formatDate(draft.createdAt)}
                    </Typography>
                  </Box>
                  <Chip 
                    label={draft.status?.toUpperCase() || 'PENDING'} 
                    color="primary" 
                    size="small" 
                  />
                </Box>

                {/* Original Message */}
                <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mt: 2 }}>
                  <strong>Original Message:</strong>
                </Typography>
                <Box 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    bgcolor: '#f5f5f5', 
                    borderRadius: 1,
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {draft.originalBody || draft.originalMessage || 'No original message'}
                  </Typography>
                </Box>

                {/* AI Generated Reply */}
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>AI Generated Reply:</strong>
                </Typography>
                <Box 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    bgcolor: '#e3f2fd', 
                    borderRadius: 1,
                    border: '1px solid #2196f3'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {draft.generatedReply || draft.draftBody || 'No reply generated'}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={processing ? <CircularProgress size={16} /> : <CheckCircle />}
                    onClick={() => handleApprove(draft)}
                    disabled={processing}
                  >
                    Approve & Send
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Edit />}
                    onClick={() => {
                      setSelectedDraft(draft);
                      setEditedBody(draft.generatedReply || draft.draftBody || '');
                      setEditMode(true);
                    }}
                    disabled={processing}
                  >
                    Edit Reply
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => handleReject(draft)}
                    disabled={processing}
                  >
                    Reject
                  </Button>
                </Box>

                {/* Draft ID for WhatsApp */}
                <Box mt={2}>
                  <Typography variant="caption" color="textSecondary">
                    WhatsApp: Reply "approve {draft.id}" to send this email
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Container>

      {/* Edit Dialog */}
      <Dialog open={editMode} onClose={() => !processing && setEditMode(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Draft Reply
          {selectedDraft && (
            <Typography variant="body2" color="textSecondary">
              To: {selectedDraft.to}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            variant="outlined"
            placeholder="Edit your email reply here..."
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Edit the message above and click "Send" to approve and send the edited version.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMode(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleEdit} 
            variant="contained" 
            color="primary"
            disabled={processing || !editedBody.trim()}
            startIcon={processing ? <CircularProgress size={16} /> : null}
          >
            {processing ? 'Sending...' : 'Send Edited Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Drafts;
