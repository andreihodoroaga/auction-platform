import React, { useEffect, useState } from "react";
import { Container, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

import { ethers } from "ethers";
import AuctionHouseArtifact from "../contracts/AuctionHouse.json";
import AuctionArtifact from "../contracts/Auction.json";
import auctionHouseAddress from "../contracts/AuctionHouse-address.json";
import AuctionTable from "./AuctionTableComponent";
import JSConfetti from "js-confetti";

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

const getAuctionContract = (auctionAddress, requiresSigner = false) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const providerOrSigner = requiresSigner ? provider.getSigner() : provider;
  return new ethers.Contract(auctionAddress, AuctionArtifact.abi, providerOrSigner);
};

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const SnackbarAlert = ({ open, onClose, severity, message }) => {
  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

const AuctionComponent = () => {
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [expiredAuctions, setExpiredAuctions] = useState([]);
  const [newAuctionName, setNewAuctionName] = useState("");
  const [newAuctionEndDate, setNewAuctionEndDate] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [openNewAuctionModal, setOpenNewAuctionModal] = useState(false);
  const [openBidModal, setOpenBidModal] = useState(null); // auction or null
  const [isEndingAuction, setIsEndingAuction] = useState(false);
  const [isDateInvalid, setIsDateInvalid] = useState(false);
  const [isBidInvalid, setIsBidInvalid] = useState(false);
  const [createAuctionGasEstimate, setCreateAuctionGasEstimate] = useState("");
  const [bidGasEstimate, setBidGasEstimate] = useState("");
  const addAuctionGasLimit = "0.00000000001";    
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

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
    const currentBidAmount = openBidModal?.highestBid;

    if (bidAmount !== "") {
      if (ethers.utils.parseEther(bidAmount).gt(ethers.utils.parseEther(currentBidAmount))) {
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
        console.error("Error fetching auctions:");
        setSnackbarMessage("Error creating auction: " + error.message);
        setOpenSnackbar(true);
      }
    };

    fetchAllAuctions();
  }, []);

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const auctionHouseContract = new ethers.Contract(auctionHouseAddress.address, AuctionHouseArtifact.abi, signer);
    const processedEvents = new Set();

    const handleAuctionCreated = auctionId => {
      const uniqueEventId = auctionId.toString();
      if (!processedEvents.has(uniqueEventId)) {
        processedEvents.add(uniqueEventId);
        const jsConfetti = new JSConfetti();
        jsConfetti.addConfetti();
      }
    };

    const startListening = async () => {
      const blockNumber = await provider.getBlockNumber();

      provider.on("block", async newBlockNumber => {
        if (newBlockNumber > blockNumber) {
          const filter = {
            address: auctionHouseContract.address,
            topics: [ethers.utils.id("AuctionCreated(uint256,address,string,uint256)")],
            fromBlock: newBlockNumber,
          };
          const logs = await provider.getLogs(filter);
          logs.forEach(log => {
            const parsedLog = auctionHouseContract.interface.parseLog(log);
            handleAuctionCreated(parsedLog.args.auctionId, parsedLog.args.owner, parsedLog.args.name, parsedLog.args.endTime);
          });
        }
      });
    };

    startListening();

    return () => {
      provider.removeAllListeners("block");
    };
  }, []);

  // TODO: not working properly
  useEffect(() => {
    async function listenToAuctionEvents() {
      const auctionHouse = getAuctionHouseContract();
      const auctions = await auctionHouse.getAllAuctions();

      auctions[0].forEach(async auctionAddress => {
        const auctionContract = getAuctionContract(auctionAddress);

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

  useEffect(() => {
    const estimateGas = async () => {
      const auctionHouse = getAuctionHouseContract();
      if (newAuctionEndDate !== "" && newAuctionName !== "") {
        const endDateTimestamp = Math.floor(new Date(newAuctionEndDate).getTime() / 1000);
        const gasEstimate = await auctionHouse.estimateGas.createAuction(newAuctionName, endDateTimestamp);
        setCreateAuctionGasEstimate(ethers.utils.formatEther(gasEstimate.toString()).toString());
      }
    };
    estimateGas().catch(console.error);
  }, [newAuctionEndDate, newAuctionName]);

  useEffect(() => {

    const estimateGas = async () => {
      const auctionContract = getAuctionContract(openBidModal.address, true);
      if (bidAmount !== "") {
        const bidAmountInWei = ethers.utils.parseEther(bidAmount);

        const gasEstimate = await auctionContract.estimateGas.bid({
          value: bidAmountInWei,
        });

        setBidGasEstimate(ethers.utils.formatEther(gasEstimate.toString()).toString());
        console.log(gasEstimate)
      }
    };
    if (openBidModal) {
      estimateGas().catch(console.error);
    }
  }, [bidAmount]);


  const handleAddAuction = async () => {
    if (!newAuctionName || !newAuctionEndDate) {
      console.error("Auction name and end date are required");
      return;
    }
  
    const endDateTimestamp = Math.floor(new Date(newAuctionEndDate).getTime() / 1000);
    setOpenNewAuctionModal(false);
    setCreateAuctionGasEstimate("");
    try {
      const auctionHouse = getAuctionHouseContract();
      const gasLimitWei = ethers.utils.parseUnits(addAuctionGasLimit.toString(), 'ether');

      const tx = await auctionHouse.createAuction(newAuctionName, endDateTimestamp, {
        gasLimit: gasLimitWei
      });
      await tx.wait();
  
      const auctions = await getAuctions();
      handleSetAuctions(auctions);
  
      setNewAuctionName("");
      setNewAuctionEndDate("");
  
      console.log("Auction created successfully!");
    } catch (error) {
      console.error("Error creating auction:", error);
      setSnackbarMessage("Error creating auction: " + error.message);
      setOpenSnackbar(true);
    }
  };

  const handleBid = async () => {
    try {
      const auctionContract = getAuctionContract(openBidModal.address, true);

      const bidAmountInWei = ethers.utils.parseEther(bidAmount);

      const tx = await auctionContract.bid({
        value: bidAmountInWei,
      });

      await tx.wait();

      const updatedAuctions = await getAuctions();
      handleSetAuctions(updatedAuctions);

      setBidAmount("");
      setOpenBidModal(null);
    } catch (error) {
      console.error("Error creating bid:", error);
      setSnackbarMessage("Error creating auction: " + error.message);
      setOpenSnackbar(true);
    }
  };

  const handleOpenBidModal = auctionAddress => {
    const auction = liveAuctions.find(auc => auc.address === auctionAddress);
    setOpenBidModal(auction);
  };

  const handleBidAmountChange = e => {
    const value = e.target.value;
    setBidAmount(value);
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container>
      <Button variant="contained" color="primary" onClick={() => setOpenNewAuctionModal(true)}>
        Create New Auction
      </Button>

      <AuctionTable auctions={liveAuctions} expired={false} openModal={handleOpenBidModal} />
      <AuctionTable auctions={expiredAuctions} expired={true} />

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
          <TextField
            autoFocus
            margin="dense"
            label="Buyout Price"
            type="number"
            fullWidth
          />
          {<div>Gas limit: {addAuctionGasLimit} ETH</div>}
          {createAuctionGasEstimate !== "" && <div>Estimated gas: {createAuctionGasEstimate} ETH</div>}
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
      <Dialog open={!!openBidModal} onClose={() => setOpenBidModal(null)}>
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
          {bidGasEstimate !== "" && <div>Estimated gas: {bidGasEstimate} ETH</div>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBidModal(null)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleBid} color="primary" disabled={isBidInvalid}>
            Place Bid
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarAlert
        open={openSnackbar}
        onClose={handleSnackbarClose}
        severity={'error'}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default AuctionComponent;
