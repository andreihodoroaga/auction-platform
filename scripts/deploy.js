// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");
const fs = require("fs");
const { ethers, artifacts } = require("hardhat");

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());
  await saveAllContracts();
}

async function saveAllContracts() {
  const contractsDir = path.join(__dirname, "..", "contracts");
    const contractFiles = fs.readdirSync(contractsDir).filter(file => file.endsWith(".sol"));

    const deployedContracts = {};

    for (const file of contractFiles) {
        const contractName = file.replace(".sol", "");
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

  fs.writeFileSync(
      path.join(contractsDir, `${contractName}-address.json`),
      JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const ContractArtifact = artifacts.readArtifactSync(contractName);

  fs.writeFileSync(
      path.join(contractsDir, `${contractName}.json`),
      JSON.stringify(ContractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
