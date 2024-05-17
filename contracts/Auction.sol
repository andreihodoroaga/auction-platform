// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Auction {
    address public owner;
    uint public highestBid;
    address public highestBidder;
    bool public ended;

    event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);

    constructor() {
        owner = msg.sender;
    }

    function bid() public payable {
        require(!ended, "Auction already ended.");
        require(msg.value > highestBid, "There already is a higher bid.");

        if (highestBid != 0) {
            payable(highestBidder).transfer(highestBid);
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
        emit HighestBidIncreased(msg.sender, msg.value);
    }

    function endAuction() public {
        require(msg.sender == owner, "You are not the auction owner.");
        require(!ended, "Auction already ended.");

        ended = true;
        emit AuctionEnded(highestBidder, highestBid);

        payable(owner).transfer(highestBid);
    }
}
