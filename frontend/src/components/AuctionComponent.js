import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Paper
} from '@mui/material';

const AuctionComponent = () => {
  // Hardcoded initial auctions
  const initialAuctions = [
    { name: 'Auction 1', bidAmount: 100, endDate: '2024-06-01 12:00:00' },
    { name: 'Auction 2', bidAmount: 150, endDate: '2024-06-02 12:00:00' },
    { name: 'Auction 3', bidAmount: 200, endDate: '2024-06-03 12:00:00' },
  ];

  const [auctions, setAuctions] = useState(initialAuctions);
  const [newAuctionName, setNewAuctionName] = useState('');
  const [newAuctionEndDate, setNewAuctionEndDate] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [openNewAuctionModal, setOpenNewAuctionModal] = useState(false);
  const [openBidModal, setOpenBidModal] = useState(false);
  const [currentAuctionIndex, setCurrentAuctionIndex] = useState(null);

  const handleAddAuction = () => {
    setAuctions([...auctions, { name: newAuctionName, bidAmount: 0, endDate: newAuctionEndDate }]);
    setNewAuctionName('');
    setNewAuctionEndDate('');
    setOpenNewAuctionModal(false);
  };

  const handleBid = () => {
    const updatedAuctions = auctions.map((auction, i) =>
      i === currentAuctionIndex ? { ...auction, bidAmount: parseFloat(bidAmount) } : auction
    );
    setAuctions(updatedAuctions);
    setBidAmount('');
    setOpenBidModal(false);
  };

  const handleOpenBidModal = (index) => {
    setCurrentAuctionIndex(index);
    setOpenBidModal(true);
  };

  const handleBidAmountChange = (e) => {
    const value = e.target.value;
    setBidAmount(value);
  };

  const isBidValid = () => {
    const currentBidAmount = auctions[currentAuctionIndex]?.bidAmount;
    return !isNaN(bidAmount) && parseFloat(bidAmount) > currentBidAmount;
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Auctions
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenNewAuctionModal(true)}
      >
        Create New Auction
      </Button>
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Current Bid</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auctions.map((auction, index) => (
              <TableRow key={index}>
                <TableCell>{auction.name}</TableCell>
                <TableCell>${auction.bidAmount}</TableCell>
                <TableCell>{auction.endDate}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleOpenBidModal(index)}
                  >
                    Bid
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New Auction Modal */}
      <Dialog open={openNewAuctionModal} onClose={() => setOpenNewAuctionModal(false)}>
        <DialogTitle>Create New Auction</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the auction details.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Auction Title"
            type="text"
            fullWidth
            value={newAuctionName}
            onChange={(e) => setNewAuctionName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="End Date and Time"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newAuctionEndDate}
            onChange={(e) => setNewAuctionEndDate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewAuctionModal(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddAuction} color="primary" disabled={!newAuctionName.trim() || !newAuctionEndDate.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bid Modal */}
      <Dialog open={openBidModal} onClose={() => setOpenBidModal(false)}>
        <DialogTitle>Place a Bid</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter your bid amount. It must be greater than the current bid.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Bid Amount"
            type="text"
            fullWidth
            value={bidAmount}
            onChange={handleBidAmountChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBidModal(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleBid} color="primary" disabled={!isBidValid()}>
            Place Bid
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AuctionComponent;
