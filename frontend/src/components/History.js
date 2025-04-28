import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Card, CardContent, Tabs, Tab } from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import axios from 'axios';

const History = () => {
  const [myRequests, setMyRequests] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const [reqRes, donRes] = await Promise.all([
          axios.get('http://localhost:5000/api/requests/my-requests', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/requests/my-donations', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setMyRequests(reqRes.data);
        setMyDonations(donRes.data);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom align="center">
        History
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label="Donations" />
          <Tab label="Requests" />
        </Tabs>
      </Box>
      {tab === 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Donation History
            </Typography>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : myDonations.length === 0 ? (
              <Typography color="text.secondary">No donations yet.</Typography>
            ) : (
              Array.from(new Map(myDonations.map(don => [don._id, don])).values()).map((don, idx) => (
                <Box key={don._id || idx} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <VolunteerActivismIcon color="primary" sx={{ mr: 1 }} />
                    <Typography fontWeight={600}>
                      Donated to: {don.requester?.name || 'Unknown'} ({don.requester?.userType === 'medicalUser' ? 'Medical Institution' : 'Donor'})
                    </Typography>
                  </Box>
                  <Typography variant="body2">Status: {don.status}</Typography>
                  {don.fulfilledAt && <Typography variant="body2">Fulfilled At: {new Date(don.fulfilledAt).toLocaleString()}</Typography>}
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      )}
      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Request History
            </Typography>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : myRequests.length === 0 ? (
              <Typography color="text.secondary">No requests yet.</Typography>
            ) : (
              myRequests
                .filter(req => req.unitsLeft === 0)
                .map((req, idx) => (
                <Box key={req._id || idx} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <AddCircleOutlineIcon color="error" sx={{ mr: 1 }} />
                    <Typography fontWeight={600}>
                      Request for: {req.bloodType} | Total Units: {req.totalUnits}
                    </Typography>
                  </Box>
                  <Typography variant="body2">Status: {req.status}</Typography>
                  {req.donations && req.donations.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" fontWeight={500}>Contributors:</Typography>
                      {req.donations.map((donation, dIdx) => {
                        const donorName = donation.donor?.name || 'Unknown Donor';
                        const donorType = donation.donor?.userType || 'Donor';
                        
                        return (
                          <Typography key={dIdx} variant="body2" sx={{ ml: 2 }}>
                            • {donorName} ({donorType === 'medicalUser' ? 'Medical Institution' : 'Donor'})
                          </Typography>
                        );
                      })}
                    </Box>
                  )}
                  {req.fulfilledAt && <Typography variant="body2">Fulfilled At: {new Date(req.fulfilledAt).toLocaleString()}</Typography>}
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default History; 