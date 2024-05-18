import React, { useState } from "react";
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { reformatDate } from "../shared/util";
const AuctionTable = ({ auctions, expired, openModal }) => {
  const [showFullAddress, setShowFullAddress] = useState(false);
  return (
    <>
      {!expired ? (
        <Typography variant="h4" gutterBottom style={{ marginTop: "30px" }}>
          Live Auctions
        </Typography>
      ) : (
        <Typography variant="h6" gutterBottom style={{ marginTop: "30px" }}>
          Expired Auctions
        </Typography>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>{expired ? "Final price" : "Current Bid"}</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell> {expired ? "Winner" : "Actions"}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auctions.map((auction, index) => (
              <TableRow key={index}>
                <TableCell>{auction.name}</TableCell>
                <TableCell>{auction.highestBid} ETH</TableCell>
                <TableCell>{reformatDate(auction.endTime.toString())}</TableCell>
                <TableCell>
                  {!expired ? (
                    <Button variant="contained" color="success" onClick={() => openModal(auction.address)}>
                      Bid
                    </Button>
                  ) : (
                    <>
                      {showFullAddress ? auction.highestBidder : `${auction.highestBidder.slice(0, 6)}...`}
                      <span
                        onClick={() => setShowFullAddress(!showFullAddress)}
                        style={{ minWidth: "30px", padding: "2px 5px", fontSize: "0.7em" }}
                      >
                        {showFullAddress ? "Show less" : "Show more"}
                      </span>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
export default AuctionTable;
