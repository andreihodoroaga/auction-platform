// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Auction.sol";

contract AuctionHouse {
    Auction[] public auctions;

    event AuctionCreated(uint auctionId, address owner, string name, uint endTime);

    function createAuction(string memory name, uint endTime) public {
        require(endTime > block.timestamp, "End time must be in the future");

        Auction newAuction = new Auction(name, endTime);
        auctions.push(newAuction);

        emit AuctionCreated(auctions.length - 1, msg.sender, name, endTime);
    }

    function getAuction(uint auctionId) public view returns (
        address owner,
        string memory name,
        uint endTime,
        uint highestBid,
        address highestBidder,
        bool ended
    ) {
        Auction auction = auctions[auctionId];
        return (
            auction.owner(),
            auction.name(),
            auction.endTime(),
            auction.highestBid(),
            auction.highestBidder(),
            auction.ended()
        );
    }

    function getAuctionCount() public view returns (uint) {
        return auctions.length;
    }

    function getAllAuctions() public view returns (
        address[] memory owners,
        string[] memory names,
        uint[] memory endTimes,
        uint[] memory highestBids,
        address[] memory highestBidders,
        bool[] memory endeds
    ) {
        uint count = auctions.length;

        address[] memory _owners = new address[](count);
        string[] memory _names = new string[](count);
        uint[] memory _endTimes = new uint[](count);
        uint[] memory _highestBids = new uint[](count);
        address[] memory _highestBidders = new address[](count);
        bool[] memory _endeds = new bool[](count);

        for (uint i = 0; i < count; i++) {
            Auction auction = auctions[i];
            _owners[i] = auction.owner();
            _names[i] = auction.name();
            _endTimes[i] = auction.endTime();
            _highestBids[i] = auction.highestBid();
            _highestBidders[i] = auction.highestBidder();
            _endeds[i] = auction.ended();
        }

        return (_owners, _names, _endTimes, _highestBids, _highestBidders, _endeds);
    }
}
