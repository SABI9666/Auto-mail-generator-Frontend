import React, { useState, useEffect } from 'react';
import {
  Container, Card, CardContent, Typography, Button, Box,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, AppBar, Toolbar, IconButton,
  FormControl, InputLabel, Select, MenuItem, Alert, Divider
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, Edit, Refresh, Email, Send } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { emailAPI } from '../services/api';

const Drafts = () => {
  const navigate = useNavigate();
  const { draftId } = useParams(); // Get draftId from URL if present
  
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [singleDraft, setSingleDraft] = useState(null); // For direct link view
  const [editMode, setEditMode] = useState(false);
  const [editedBody, setEditedBody] = useState('');
  const [period, setPeriod] = useState('week');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (draftId) {
      // Direct link from WhatsApp - load specific draft
      loadSingleDraft(draftId);
    } else {
      // Normal list view
      loadDrafts();
    }
  }, [draftId, period]);

  // Load single draft by ID (for WhatsApp direct link)
  const loadSingleDraft = async (id) => {
    try {
      setLoading(true);
      const response = await emailAPI.getDraft(id);
      setSingleDraft(response.data);
    } catch (error) {
      console.error('Failed to load draft:', error);
      setMessage('❌ Draft not found or access denied');
      setSingleDraft(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getPendingDrafts(period);
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
      
      if (draftId) {
        // If viewing single draft, update its status
        setSingleDraft({ ...draft, status: 'sent' });
      } else {
        loadDrafts();
      }
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
      
      if (draftId) {
        setSingleDraft({ ...draft, status: 'rejected' });
      } else {
        loadDrafts();
      }
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
      
      if (draftId) {
        setSingleDraft({ ...selectedDraft, status: 'edited' });
      } else {
        loadDrafts();
      }
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
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'rejected': return 'error';
      case 'edited': return 'info';
      default: return 'warning';
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SINGLE DRAFT VIEW (From WhatsApp Link)
  // ═══════════════════════════════════════════════════════════════════════════
  if (draftId) {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      );
    }

    if (!singleDraft) {
      return (
        <>
          <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate('/drafts')}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h6">Draft Not Found</Typography>
            </Toolbar>
          </AppBar>
          <Container maxWidth="md" sx={{ mt: 4 }}>
            <Alert severity="error">
              This draft was not found or you don't have access to it.
            </Alert>
            <Button 
              variant="contained" 
              onClick={() => navigate('/drafts')}
              sx={{ mt: 2 }}
            >
              View All Drafts
            </Button>
          </Container>
        </>
      );
    }

    const isActionable = singleDraft.status === 'pending';

    return (
      <>
        <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate('/drafts')}>
              <ArrowBack />
            </IconButton>
            <Email sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Email Draft
            </Typography>
            <Chip 
              label={singleDraft.status?.toUpperCase()} 
              color={getStatusColor(singleDraft.status)}
              size="small"
              sx={{ color: 'white' }}
            />
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>
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

          {/* Draft Card */}
          <Card elevation={3}>
            <CardContent>
              {/* Header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {singleDraft.subject || 'No Subject'}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>From:</strong> {singleDraft.to}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>To:</strong> {singleDraft.from}
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Received: {formatDate(singleDraft.createdAt)}
                </Typography>
              </Box>

              {/* Original Message */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                  📩 Original Message
                </Typography>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#fafafa', 
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {singleDraft.originalBody || 'No original message'}
                  </Typography>
                </Box>
              </Box>

              {/* AI Generated Reply */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="secondary" gutterBottom sx={{ fontWeight: 600 }}>
                  ✍️ AI Generated Reply
                </Typography>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#e3f2fd', 
                    borderRadius: 2,
                    border: '1px solid #2196f3'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {singleDraft.generatedReply || 'No reply generated'}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              {isActionable ? (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    ⚡ Take Action
                  </Typography>
                  <Box display="flex" gap={2} flexWrap="wrap" mt={2}>
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <Send />}
                      onClick={() => handleApprove(singleDraft)}
                      disabled={processing}
                      sx={{ minWidth: 150 }}
                    >
                      Approve & Send
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<Edit />}
                      onClick={() => {
                        setSelectedDraft(singleDraft);
                        setEditedBody(singleDraft.generatedReply || '');
                        setEditMode(true);
                      }}
                      disabled={processing}
                      sx={{ minWidth: 150 }}
                    >
                      Edit & Send
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="large"
                      startIcon={<Cancel />}
                      onClick={() => handleReject(singleDraft)}
                      disabled={processing}
                      sx={{ minWidth: 150 }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Alert severity={singleDraft.status === 'sent' || singleDraft.status === 'edited' ? 'success' : 'info'}>
                    This draft has been <strong>{singleDraft.status}</strong>
                    {singleDraft.sentAt && ` on ${formatDate(singleDraft.sentAt)}`}
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Back Button */}
          <Box mt={3}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBack />}
              onClick={() => navigate('/drafts')}
            >
              View All Drafts
            </Button>
          </Box>
        </Container>

        {/* Edit Dialog */}
        <Dialog open={editMode} onClose={() => !processing && setEditMode(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Edit Draft Reply
            <Typography variant="body2" color="textSecondary">
              To: {selectedDraft?.to}
            </Typography>
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
              startIcon={processing ? <CircularProgress size={16} /> : <Send />}
            >
              {processing ? 'Sending...' : 'Send Edited Email'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW (Normal Drafts Page)
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Email sx={{ mr: 1 }} />
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
            <Card key={draft.id} sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
              <CardContent>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="textSecondary">
                      From: {draft.to || 'Unknown'}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      Reply To: {draft.from || 'Unknown'}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                      {draft.subject || 'No Subject'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Created: {formatDate(draft.createdAt)}
                    </Typography>
                  </Box>
                  <Chip 
                    label={draft.status?.toUpperCase() || 'PENDING'} 
                    color={getStatusColor(draft.status)} 
                    size="small" 
                  />
                </Box>

                {/* Original Message */}
                <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                  📩 Original Message:
                </Typography>
                <Box 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    bgcolor: '#fafafa', 
                    borderRadius: 1,
                    maxHeight: '100px',
                    overflow: 'auto',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {draft.originalBody || 'No original message'}
                  </Typography>
                </Box>

                {/* AI Generated Reply */}
                <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                  ✍️ AI Generated Reply:
                </Typography>
                <Box 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    bgcolor: '#e3f2fd', 
                    borderRadius: 1,
                    border: '1px solid #2196f3',
                    maxHeight: '120px',
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {draft.generatedReply || 'No reply generated'}
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
                      setEditedBody(draft.generatedReply || '');
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
            startIcon={processing ? <CircularProgress size={16} /> : <Send />}
          >
            {processing ? 'Sending...' : 'Send Edited Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Drafts;
















