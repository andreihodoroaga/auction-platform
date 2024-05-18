import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
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
  Paper,
} from "@mui/material";

import { ethers } from "ethers";
import AuctionHouseArtifact from "../contracts/AuctionHouse.json";
import auctionHouseAddress from "../contracts/AuctionHouse-address.json";

const toUnixTimestamp = date => new Date(date).getTime() / 1000;

const getAuctionHouseContract = () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(auctionHouseAddress.address, AuctionHouseArtifact.abi, signer);
};

const AuctionComponent = () => {
  const [auctions, setAuctions] = useState([]);
  const [newAuctionName, setNewAuctionName] = useState("");
  const [newAuctionEndDate, setNewAuctionEndDate] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [openNewAuctionModal, setOpenNewAuctionModal] = useState(false);
  const [openBidModal, setOpenBidModal] = useState(false);
  const [currentAuctionIndex, setCurrentAuctionIndex] = useState(null);
  const [isEndingAuction, setIsEndingAuction] = useState(false);

  useEffect(() => {
    const checkExpiredAuctions = async () => {
      if (isEndingAuction) {
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const expiredAuctions = auctions.filter(auction => toUnixTimestamp(auction.endTime) < now);

      if (expiredAuctions.length > 0) {
        console.log("transaction ended");
        setIsEndingAuction(true);
        const auctionHouse = getAuctionHouseContract();
        await auctionHouse.endExpiredAuctions();
      }
    };

    const id = setInterval(checkExpiredAuctions, 1000);

    return () => clearInterval(id);
  }, [auctions, isEndingAuction]);
  const [isDateInvalid, setIsDateInvalid] = useState(false);
  const [isBidInvalid, setIsBidInvalid] = useState(false);

  useEffect(() => {
    const selectedDate = new Date(newAuctionEndDate);
    const currentDate = new Date();
    if (newAuctionEndDate != "") {
      if (selectedDate.getTime() > currentDate.getTime()) {
        setIsDateInvalid(false);
      } else {
        setIsDateInvalid(true);
      }
    }
  }, [newAuctionEndDate]);

  useEffect(() => {
    const currentBidAmount = auctions[currentAuctionIndex]?.highestBid;

    if (bidAmount != "") {
      if (bidAmount > currentBidAmount) {
        setIsBidInvalid(false);
      } else {
        setIsBidInvalid(true);
      }
    }
  }, [bidAmount]);

  useEffect(() => {
    const fetchAllAuctions = async () => {
      try {
        const auctionHouse = getAuctionHouseContract();
        const auctions = await auctionHouse.getAllAuctions();
        const auctionDetails = auctions[0].map((_, index) => ({
          owner: auctions[0][index],
          name: auctions[1][index],
          endTime: new Date(auctions[2][index] * 1000), // Convert UNIX timestamp to date
          highestBid: ethers.utils.formatEther(auctions[3][index]), // Convert wei to ether
          highestBidder: auctions[4][index],
          ended: auctions[5][index],
        }));
        setAuctions(auctionDetails);
      } catch (error) {
        console.error("Error fetching auctions:", error);
      }
    };

    fetchAllAuctions();
  }, []);

  const handleAddAuction = async () => {
    if (!newAuctionName || !newAuctionEndDate) {
      console.error("Auction name and end date are required");
      return;
    }

    const endDateTimestamp = Math.floor(new Date(newAuctionEndDate).getTime() / 1000);

    try {
      const auctionHouse = getAuctionHouseContract();

      const tx = await auctionHouse.createAuction(newAuctionName, endDateTimestamp);
      await tx.wait();

      const auctions = await auctionHouse.getAllAuctions();
      const auctionDetails = auctions[0].map((_, index) => ({
        owner: auctions[0][index],
        name: auctions[1][index],
        endTime: new Date(auctions[2][index] * 1000), // Convert UNIX timestamp to date
        highestBid: ethers.utils.formatEther(auctions[3][index]), // Convert wei to ether
        highestBidder: auctions[4][index],
        ended: auctions[5][index],
      }));

      setAuctions(auctionDetails);

      setNewAuctionName("");
      setNewAuctionEndDate("");
      setOpenNewAuctionModal(false);

      console.log("Auction created successfully!");
    } catch (error) {
      console.error("Error creating auction:", error);
    }
  };
  // const handleBid = async () => {
  //   try {
  //     const provider = new ethers.providers.Web3Provider(window.ethereum);
  //     const signer = provider.getSigner();
  //     const auctionHouse = new ethers.Contract(auctionHouseAddress.address, AuctionHouseArtifact.abi, signer);

  //     const auction = new ethers.Contract(auctionAddress.address, AuctionArtifact.abi, signer);
  //     const updatedAuctions = auctions.map((auction, i) =>
  //       i === currentAuctionIndex ? { ...auction, highestBid: parseFloat(bidAmount) } : auction
  //     );
  //     setAuctions(updatedAuctions);
  //     auction.bid();
  //     setBidAmount("");
  //     setOpenBidModal(false);
  //     console.log("Bid created successfully!");
  //   } catch (error) {
  //     console.error("Error creating bid:", error);
  //   }
  // };

  const handleOpenBidModal = index => {
    setCurrentAuctionIndex(index);
    setOpenBidModal(true);
  };

  const handleBidAmountChange = e => {
    const value = e.target.value;
    setBidAmount(value);
  };

  const reformatDate = dateString => {
    const date = new Date(dateString);

    const dateOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };

    const formattedDate = date.toLocaleDateString("en-US", dateOptions);
    const formattedTime = date.toLocaleTimeString("en-US", timeOptions);

    return `${formattedDate} ${formattedTime}`;
  };
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Auctions
      </Typography>
      <Button variant="contained" color="primary" onClick={() => setOpenNewAuctionModal(true)}>
        Create New Auction
      </Button>
      <TableContainer component={Paper} style={{ marginTop: "20px" }}>
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
                <TableCell>{auction.highestBid}</TableCell>
                <TableCell>{reformatDate(auction.endTime.toString())}</TableCell>
                <TableCell>
                  <Button variant="contained" color="success" onClick={() => handleOpenBidModal(index)}>
                    Bid
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openNewAuctionModal} onClose={() => setOpenNewAuctionModal(false)}>
        <DialogTitle>Create New Auction</DialogTitle>
        <DialogContent>
          <DialogContentText>Please enter the auction details.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Auction Title"
            type="text"
            fullWidth
            value={newAuctionName}
            onChange={e => setNewAuctionName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="End Date and Time"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newAuctionEndDate}
            onChange={e => setNewAuctionEndDate(e.target.value)}
            error={isDateInvalid}
            helperText={isDateInvalid ? "End Date should be in the future" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewAuctionModal(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleAddAuction}
            color="primary"
            disabled={!newAuctionName.trim() || !newAuctionEndDate.trim() || isDateInvalid}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bid Modal */}
      <Dialog open={openBidModal} onClose={() => setOpenBidModal(false)}>
        <DialogContent>
          <DialogContentText></DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Bid Amount"
            type="number"
            fullWidth
            value={bidAmount}
            onChange={handleBidAmountChange}
            error={isBidInvalid}
            helperText={isBidInvalid ? "Please enter your bid amount. It must be greater than the current bid!" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBidModal(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleBid} color="primary" disabled={isBidInvalid}>
            Place Bid
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AuctionComponent;
