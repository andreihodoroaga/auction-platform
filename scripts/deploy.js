const path = require("path");
const fs = require("fs");
const { ethers, artifacts, network } = require("hardhat");

async function main() {
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying the contracts with the account:", await deployer.getAddress());

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const AuctionHouseFactory = await ethers.getContractFactory("AuctionHouse");
  const auctionHouse = await AuctionHouseFactory.deploy();
  await auctionHouse.deployed();
  console.log("AuctionHouse deployed to:", auctionHouse.address);

  saveContractFrontendFiles(auctionHouse, "AuctionHouse");

  await deployOtherContracts();
}

async function deployOtherContracts() {
  const contractsDir = path.join(__dirname, "..", "contracts");
  const contractFiles = fs.readdirSync(contractsDir).filter(file => file.endsWith(".sol"));

  const deployedContracts = {};

  for (const file of contractFiles) {
    const contractName = file.replace(".sol", "");
    if (contractName === "AuctionHouse" || contractName === "Auction") {
      continue;
    }

    console.log(`Deploying ${contractName}...`);

    const ContractFactory = await ethers.getContractFactory(contractName);
    const contract = await ContractFactory.deploy();
    await contract.deployed();

    console.log(`${contractName} deployed to:`, contract.address);
    deployedContracts[contractName] = contract.address;

    saveContractFrontendFiles(contract, contractName);
  }
}

function saveContractFrontendFiles(contract, contractName) {
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(path.join(contractsDir, `${contractName}-address.json`), JSON.stringify({ address: contract.address }, undefined, 2));

  const ContractArtifact = artifacts.readArtifactSync(contractName);

  fs.writeFileSync(path.join(contractsDir, `${contractName}.json`), JSON.stringify(ContractArtifact, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
