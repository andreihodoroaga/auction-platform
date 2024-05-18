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

    modifier notEnded() {
        require(block.timestamp >= endTime, "Auction not yet ended.");
        _;
    }
    modifier alreadyEnded() {
        require(block.timestamp < endTime, "Auction already ended.");
        _;
    }
    modifier higherBidder() {
        require(msg.value > highestBid, "There already is a higher bid.");
        _;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the auction owner.");
        _;
    }

    function isNotZero(uint number) public pure returns (bool) {
        return number != 0;
    }

    function bid() public payable alreadyEnded higherBidder {
        if (isNotZero(highestBid)) {
            payable(highestBidder).transfer(highestBid);
        }
        highestBidder = msg.sender;
        highestBid = msg.value;
        emit HighestBidIncreased(msg.sender, msg.value);
    }

    function endAuction() public onlyOwner notEnded {
        require(!ended, "Auction already ended.");
        ended = true;
        emit AuctionEnded(highestBidder, highestBid);

        if (isNotZero(highestBid)) {
            (bool success, ) = owner.call{value: highestBid, gas: 900000000000000000}("");
            require(success, "Transfer to owner failed.");
        }
    }

    function getAddr() external view returns (address) {
        return address(this);
    }
}
