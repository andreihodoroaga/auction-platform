// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Auction.sol";

contract AuctionHouse {
    Auction[] public auctions;

    event AuctionCreated(uint auctionId, address owner, string name, uint endTime);

    function createAuction(string memory name, uint endTime) external {
        require(endTime > block.timestamp, "End time must be in the future");

        Auction newAuction = new Auction(name, endTime);
        auctions.push(newAuction);

        emit AuctionCreated(auctions.length - 1, msg.sender, name, endTime);
    }

    function getAuction(uint auctionId) external view returns (
        address addr,
        address owner,
        string memory name,
        uint endTime,
        uint highestBid,
        address highestBidder,
        bool ended
    ) {
        Auction auction = auctions[auctionId];
        return _getAuctionDetails(auction);
    }

    function getAuctionCount() external view returns (uint) {
        return auctions.length;
    }

    function getAllAuctions() external view returns (
        address[] memory addresses,
        address[] memory owners,
        string[] memory names,
        uint[] memory endTimes,
        uint[] memory highestBids,
        address[] memory highestBidders,
        bool[] memory endeds
    ) {
        uint count = auctions.length;

        address[] memory _addresses = new address[](count);
        address[] memory _owners = new address[](count);
        string[] memory _names = new string[](count);
        uint[] memory _endTimes = new uint[](count);
        uint[] memory _highestBids = new uint[](count);
        address[] memory _highestBidders = new address[](count);
        bool[] memory _endeds = new bool[](count);

        for (uint i = 0; i < count; i++) {            
            (
                _addresses[i],
                _owners[i],
                _names[i],
                _endTimes[i],
                _highestBids[i],
                _highestBidders[i],
                _endeds[i]
            ) = _getAuctionDetails(auctions[i]);
        }

        return (_addresses, _owners, _names, _endTimes, _highestBids, _highestBidders, _endeds);
    }

    function endExpiredAuctions() public {
        for (uint i = 0; i < auctions.length; i++) {
            Auction auction = auctions[i];
            if (block.timestamp >= auction.endTime() && !auction.ended()) {
                console.log("AuctionHOuse -> Auction address");
                console.log(address(auction));
                auction.endAuction();
            }
        }
    }

    function _getAuctionDetails(Auction auction) internal view returns (
        address addr,
        address _owner,
        string memory _name,
        uint _endTime,
        uint _highestBid,
        address _highestBidder,
        bool _ended
    ) {
        return (
            auction.getAddr(),
            auction.owner(),
            auction.name(),
            auction.endTime(),
            auction.highestBid(),
            auction.highestBidder(),
            auction.ended()
        );
    }
}
