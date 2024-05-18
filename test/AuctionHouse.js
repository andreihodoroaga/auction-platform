const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("AuctionHouse Contract", function () {
  let AuctionHouseContract;
  const contrEndTime = Math.floor(Date.now() / 1000) + 10000;

  beforeEach(async function () {
    const AuctionFactory = await ethers.getContractFactory("Auction");
    const auctionContract = await AuctionFactory.deploy("Test Auction", contrEndTime); 
    await auctionContract.deployed();

    const AuctionHouseFactory = await ethers.getContractFactory("AuctionHouse");
    AuctionHouseContract = await AuctionHouseFactory.deploy();
    await AuctionHouseContract.deployed();
  });

  describe("Auction Creation", function () {
    it("Should create a new auction", async function () {
      await AuctionHouseContract.createAuction("Test Auction", contrEndTime);
      const auctionAddress = await AuctionHouseContract.auctions(0);
      expect(await ethers.provider.getCode(auctionAddress)).to.not.equal("0x");
    });
  });

  describe("Auction Retrieval", function () {
    it("Should retrieve auction details", async function () {
      await AuctionHouseContract.createAuction("Test Auction", contrEndTime);
      const auctionId = 0;
      const auctionDetails = await AuctionHouseContract.getAuction(auctionId);
      const [addr, _, name, endTime, highestBid, highestBidder, ended] = auctionDetails;

      expect(addr).to.equal(await AuctionHouseContract.auctions(auctionId));
      expect(name).to.equal("Test Auction");
      expect(endTime).to.equal(contrEndTime);
      expect(highestBid).to.equal(0);
      expect(highestBidder).to.equal("0x0000000000000000000000000000000000000000");
      expect(ended).to.equal(false);
    });
  });

  describe("Expired Auctions", function () {
    it("Should end expired auctions", async function () {
      await AuctionHouseContract.createAuction("Test Auction", contrEndTime); 
      await ethers.provider.send("evm_increaseTime", [contrEndTime + 2]); 
      await AuctionHouseContract.endExpiredAuctions();
      const auctionDetails = await AuctionHouseContract.getAuction(0);
      const [_, __, ___, ____, _____, ______, ended] = auctionDetails;

      expect(ended).to.equal(true);
    });
  });
});
