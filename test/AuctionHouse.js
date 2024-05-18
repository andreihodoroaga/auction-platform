// SPDX-License-Identifier: MIT

import { ethers } from "hardhat";
import { expect } from "chai";

describe("AuctionHouse Contract", function () {
  beforeEach(async function () {
    const AuctionFactory = await ethers.getContractFactory("Auction");
    const auctionContract = await AuctionFactory.deploy("Test Auction", 10000); // End time 10000 seconds from now

    const AuctionHouseFactory = await ethers.getContractFactory("AuctionHouse");
    const AuctionHouseContract = await AuctionHouseFactory.deploy();
    await AuctionHouseContract.deployed();
  });

  describe("Auction Creation", function () {
    it("Should create a new auction", async function () {
      await AuctionHouseContract.createAuction("Test Auction", 10000);
      const auctionAddress = await AuctionHouseContract.auctions(0);
      expect(await ethers.provider.getCode(auctionAddress)).to.not.equal("0x");
    });
  });

  describe("Auction Retrieval", function () {
    it("Should retrieve auction details", async function () {
      await AuctionHouseContract.createAuction("Test Auction", 10000);
      const auctionId = 0;
      const auctionDetails = await AuctionHouseContract.getAuction(auctionId);
      const [addr, owner, name, endTime, highestBid, highestBidder, ended] = auctionDetails;

      expect(addr).to.equal(await AuctionHouseContract.auctions(auctionId));
      expect(owner).to.equal(await ethers.provider.getSigner().getAddress());
      expect(name).to.equal("Test Auction");
      expect(endTime).to.equal(10000);
      expect(highestBid).to.equal(0);
      expect(highestBidder).to.equal("0x0000000000000000000000000000000000000000");
      expect(ended).to.equal(false);
    });
  });

  describe("Expired Auctions", function () {
    it("Should end expired auctions", async function () {
      await AuctionHouseContract.createAuction("Test Auction", 1); // End time 1 second from now
      await ethers.provider.send("evm_increaseTime", [2]); // Move time forward by 2 seconds
      await AuctionHouseContract.endExpiredAuctions();
      const auctionDetails = await AuctionHouseContract.getAuction(0);
      const [_, __, ___, ____, _____, ______, ended] = auctionDetails;

      expect(ended).to.equal(true);
    });
  });
});
