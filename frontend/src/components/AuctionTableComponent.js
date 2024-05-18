import React from 'react';
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
import { reformatDate } from "../shared/util";
const AuctionTable = ({ auctions, expired, openModal }) => {

    return (
        <>
            {!expired ?
                <Typography variant="h4" gutterBottom style={{ marginTop: "30px" }}>
                    Live Auctions
                </Typography> :
                <Typography variant="h6" gutterBottom style={{ marginTop: "30px" }}>
                    Expired Auctions
                </Typography>
            }
            <TableContainer component={Paper} >
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
                                    {!expired && <Button
                                        variant="contained"
                                        color="success"
                                        onClick={() => openModal(index)}>
                                        Bid
                                    </Button>}
                                    {expired &&
                                        <div>Expired</div>
                                    }
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
