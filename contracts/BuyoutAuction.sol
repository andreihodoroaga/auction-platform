// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Auction.sol";

contract BuyoutAuction is Auction {
    mapping(uint => bool) public auctionBoughtOut;

    event AuctionBoughtOut(address buyer, uint amount);

    constructor(
        string memory _name,
        uint _endTime,
        uint _buyoutPrice
    ) Auction(_name, _endTime) {}

    function buyOutAuction(uint auctionId) external payable {
        require(!ended, "Auction already ended.");
        // require(msg.value == buyoutPrice, "Incorrect buyout price");
        require(!auctionBoughtOut[auctionId], "Auction already bought out");

        ended = true;
        auctionBoughtOut[auctionId] = true;

        payable(owner).transfer(msg.value);

        emit AuctionEnded(msg.sender, msg.value);
        emit AuctionBoughtOut(msg.sender, msg.value);
    }
}
