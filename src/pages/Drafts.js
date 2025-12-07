import React, { useState, useEffect } from 'react';
import {
  Container, Card, CardContent, Typography, Button, Box,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, AppBar, Toolbar, IconButton
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { emailAPI } from '../services/api';

const Drafts = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedBody, setEditedBody] = useState('');

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const response = await emailAPI.getPendingDrafts();
      setDrafts(response.data.drafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (draftId) => {
    try {
      await emailAPI.approveDraft(draftId);
      alert('✅ Email sent successfully!');
      loadDrafts();
      setSelectedDraft(null);
    } catch (error) {
      alert('❌ Failed to send email');
    }
  };

  const handleReject = async (draftId) => {
    try {
      await emailAPI.rejectDraft(draftId);
      alert('❌ Draft rejected');
      loadDrafts();
      setSelectedDraft(null);
    } catch (error) {
      alert('❌ Failed to reject draft');
    }
  };

  const handleEdit = async () => {
    try {
      await emailAPI.editDraft(selectedDraft.id, editedBody);
      alert('✅ Edited email sent!');
      loadDrafts();
      setSelectedDraft(null);
      setEditMode(false);
    } catch (error) {
      alert('❌ Failed to send edited email');
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
          <Typography variant="h6">
            Pending Drafts ({drafts.length})
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {drafts.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" align="center" color="textSecondary">
                No pending drafts
              </Typography>
            </CardContent>
          </Card>
        ) : (
          drafts.map(draft => (
            <Card key={draft.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      From: {draft.senderEmail}
                    </Typography>
                    <Typography variant="h6">
                      {draft.subject}
                    </Typography>
                  </Box>
                  <Chip label={draft.emailProvider.toUpperCase()} color="primary" size="small" />
                </Box>

                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Original Message:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {draft.originalBody.substring(0, 200)}...
                </Typography>

                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Proposed Reply:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  {draft.draftBody}
                </Typography>

                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleApprove(draft.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Edit />}
                    onClick={() => {
                      setSelectedDraft(draft);
                      setEditedBody(draft.draftBody);
                      setEditMode(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => handleReject(draft.id)}
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
      <Dialog open={editMode} onClose={() => setEditMode(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Draft</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMode(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained" color="primary">
            Send Edited Email
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Drafts;
