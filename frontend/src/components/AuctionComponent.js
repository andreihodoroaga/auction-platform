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
import AuctionArtifact from "../contracts/Auction.json";
import auctionHouseAddress from "../contracts/AuctionHouse-address.json";
import AuctionTable from "./AuctionTableComponent";
const toUnixTimestamp = date => new Date(date).getTime() / 1000;

const getAuctionHouseContract = () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(auctionHouseAddress.address, AuctionHouseArtifact.abi, signer);
};

const getAuctionsDetails = auctionHouseActions => {
  return auctionHouseActions[0].map((_, index) => ({
    address: auctionHouseActions[0][index],
    owner: auctionHouseActions[1][index],
    name: auctionHouseActions[2][index],
    endTime: new Date(auctionHouseActions[3][index] * 1000), // Convert UNIX timestamp to date
    highestBid: ethers.utils.formatEther(auctionHouseActions[4][index]), // Convert wei to ether
    highestBidder: auctionHouseActions[5][index],
    ended: auctionHouseActions[6][index],
  }));
};

const getAuctions = async () => {
  const auctionHouse = getAuctionHouseContract();
  const auctionsFromContract = await auctionHouse.getAllAuctions();
  return getAuctionsDetails(auctionsFromContract);
};

const AuctionComponent = () => {
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [expiredAuctions, setExpiredAuctions] = useState([]);
  const [newAuctionName, setNewAuctionName] = useState("");
  const [newAuctionEndDate, setNewAuctionEndDate] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [openNewAuctionModal, setOpenNewAuctionModal] = useState(false);
  const [openBidModal, setOpenBidModal] = useState(false);
  const [currentAuctionIndex, setCurrentAuctionIndex] = useState(null);
  const [isEndingAuction, setIsEndingAuction] = useState(false);
  const [isDateInvalid, setIsDateInvalid] = useState(false);
  const [isBidInvalid, setIsBidInvalid] = useState(false)

  useEffect(() => {
    const checkExpiredAuctions = async () => {
      if (isEndingAuction) {
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const newExpiredAuctions = liveAuctions.filter(auction => toUnixTimestamp(auction.endTime) < now);

      if (newExpiredAuctions.length > 0) {
        setIsEndingAuction(true);
        const auctionHouse = getAuctionHouseContract();
        const tx = await auctionHouse.endExpiredAuctions();
        await tx.wait();
        const auctions = await getAuctions();
        handleSetAuctions(auctions);
        setIsEndingAuction(false);
      }
    };

    const id = setInterval(checkExpiredAuctions, 1000);

    return () => clearInterval(id);
  }, [liveAuctions, isEndingAuction]);

  useEffect(() => {
    const selectedDate = new Date(newAuctionEndDate);
    const currentDate = new Date();
    if (newAuctionEndDate !== "") {
      if (selectedDate.getTime() > currentDate.getTime()) {
        setIsDateInvalid(false);
      } else {
        setIsDateInvalid(true);
      }
    }
  }, [newAuctionEndDate]);

  useEffect(() => {
    const currentBidAmount = liveAuctions[currentAuctionIndex]?.highestBid;

    if (bidAmount !== "") {
      if (bidAmount > currentBidAmount) {
        setIsBidInvalid(false);
      } else {
        setIsBidInvalid(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidAmount]);

  useEffect(() => {
    const fetchAllAuctions = async () => {
      try {
        const auctions = await getAuctions();
        handleSetAuctions(auctions);
      } catch (error) {
        console.error("Error fetching auctions:", error);
      }
    };

    fetchAllAuctions();
  }, []);

  // TODO: not working properly
  useEffect(() => {
    async function listenToAuctionEvents() {
      const auctionHouse = getAuctionHouseContract();
      const auctions = await auctionHouse.getAllAuctions();

      auctions[0].forEach(async auctionAddress => {
        const auctionContract = new ethers.Contract(
          auctionAddress,
          AuctionArtifact.abi,
          new ethers.providers.Web3Provider(window.ethereum)
        );

        auctionContract.on("AuctionEnded", (winner, amount) => {
          console.log("AuctionEnded event received for auction:", auctionAddress);
          console.log("Winner:", winner);
          console.log("Amount:", amount);
        });
      });
    }

    listenToAuctionEvents();
  }, [expiredAuctions]);

  const handleSetAuctions = auctions => {
    setLiveAuctions(auctions.filter(auction => !auction.ended));
    setExpiredAuctions(auctions.filter(auction => auction.ended));
  };

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

      const auctions = await getAuctions();
      handleSetAuctions(auctions);

      setNewAuctionName("");
      setNewAuctionEndDate("");
      setOpenNewAuctionModal(false);

      console.log("Auction created successfully!");
    } catch (error) {
      console.error("Error creating auction:", error);
    }
  };
  const handleBid = async () => {
    // try {
    //   const provider = new ethers.providers.Web3Provider(window.ethereum);
    //   const signer = provider.getSigner();
    //   const auctionHouse = new ethers.Contract(auctionHouseAddress.address, AuctionHouseArtifact.abi, signer);
    //   const auction = new ethers.Contract(auctionAddress.address, AuctionArtifact.abi, signer);
    //   const updatedAuctions = auctions.map((auction, i) =>
    //     i === currentAuctionIndex ? { ...auction, highestBid: parseFloat(bidAmount) } : auction
    //   );
    //   setAuctions(updatedAuctions);
    //   auction.bid();
    //   setBidAmount("");
    //   setOpenBidModal(false);
    //   console.log("Bid created successfully!");
    // } catch (error) {
    //   console.error("Error creating bid:", error);
    // }
  };

  const handleOpenBidModal = index => {
    setCurrentAuctionIndex(index);
    setOpenBidModal(true);
  };

  const handleBidAmountChange = e => {
    const value = e.target.value;
    setBidAmount(value);
  };
  console.log(liveAuctions)
  return (
    <Container>
      <Button variant="contained" color="primary" onClick={() => setOpenNewAuctionModal(true)}>
        Create New Auction
      </Button>

      <AuctionTable
        auctions={liveAuctions}
        expired={false}
        openModal={handleOpenBidModal}
      />
      <AuctionTable
        auctions={expiredAuctions}
        expired={true}
      />
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
