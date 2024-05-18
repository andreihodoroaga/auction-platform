import { ethers } from "hardhat";
import { expect } from "chai";

describe("Auction Contract", function () {
  let Auction;
  let auction;
  let owner;
  let bidder1;
  let bidder2;

  beforeEach(async function () {
    [owner, bidder1, bidder2] = await ethers.getSigners();

    Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.deploy("Test Auction", 10000); // End time 10000 seconds from now
    await auction.deployed();
  });

  describe("Deployment", function () {
    it("Should set the owner correctly", async function () {
      expect(await auction.owner()).to.equal(owner.address);
    });

    it("Should set the name and end time correctly", async function () {
      expect(await auction.name()).to.equal("Test Auction");
      expect(await auction.endTime()).to.equal(10000);
    });
  });

  describe("Bidding", function () {
    it("Should allow bidding from non-owner and before end time", async function () {
      await auction.connect(bidder1).bid({ value: ethers.utils.parseEther("1.0") });
      expect(await auction.highestBidder()).to.equal(bidder1.address);
      expect(await auction.highestBid()).to.equal(ethers.utils.parseEther("1.0"));
    });

    it("Should not allow bidding from owner", async function () {
      await expect(auction.connect(owner).bid({ value: ethers.utils.parseEther("1.0") })).to.be.revertedWith(
        "There already is a higher bid."
      );
    });

    it("Should not allow bidding after end time", async function () {
      await ethers.provider.send("evm_increaseTime", [10001]); // Move time forward by 10001 seconds
      await expect(auction.connect(bidder1).bid({ value: ethers.utils.parseEther("1.0") })).to.be.revertedWith("Auction already ended.");
    });
  });

  describe("End Auction", function () {
    it("Should only allow owner to end auction", async function () {
      await expect(auction.connect(bidder1).endAuction()).to.be.revertedWith("You are not the auction owner.");
    });

    it("Should not allow ending before end time", async function () {
      await expect(auction.connect(owner).endAuction()).to.be.revertedWith("Auction not yet ended.");
    });

    it("Should end auction and transfer funds to owner", async function () {
      await auction.connect(bidder1).bid({ value: ethers.utils.parseEther("2.0") });
      await auction.connect(owner).endAuction();
      expect(await auction.ended()).to.equal(true);
      expect(await ethers.provider.getBalance(auction.address)).to.equal(ethers.utils.parseEther("0.0")); // Check that balance of contract is 0
    });
  });
});
