// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract Auction {
    address public owner;
    uint public highestBid;
    address public highestBidder;
    bool public ended;

    string public name;
    uint public endTime;

    event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);

    constructor(string memory _name, uint _endTime) {
        owner = msg.sender;
        name = _name;
        endTime = _endTime;
    }

    function bid() public payable {
        require(block.timestamp < endTime, "Auction already ended.");
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
        require(block.timestamp >= endTime, "Auction not yet ended.");
        require(!ended, "Auction already ended.");

        console.log("Auction address");
        console.log(address(this));
        ended = true;
        emit AuctionEnded(highestBidder, highestBid);

        if (highestBid != 0) {
            payable(owner).transfer(highestBid);
        }
    }
}
