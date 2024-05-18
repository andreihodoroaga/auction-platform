import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import AuctionComponent from "./AuctionComponent";
// This is the default id used by the Hardhat Network
const HARDHAT_NETWORK_ID = "31337";

export class Dapp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAddress: null,
      balance: null,
      networkError: null,
    };
  }

  async componentDidMount() {
    if (window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
    }
  }

  async _connectWallet() {
    try {
      // Prompt user to connect their wallet
      const accounts = await this.provider.send("eth_requestAccounts", []);
      const selectedAddress = accounts[0];

      this._checkNetwork();
      // Fetch balance
      await this._initialize();

      this.setState({ selectedAddress });
    } catch (error) {
      console.error(error);
      this.setState({ networkError: "Failed to connect wallet" });
    }
  }

  async _initialize() {
    this._startPollingData();
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this.setState({ networkError: null })}
        />
      );
    }

    if (this.state.balance === null) {
      return <Loading />;
    }

    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <p>
              Welcome <b>{this.state.selectedAddress}</b>, you have <b>{this.state.balance} ETH</b>.
            </p>
          </div>
        </div>
        <hr />
        <AuctionComponent />
      </div>
    );
  }

  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalance();
  }

  async _switchChain() {
    const chainIdHex = `0x${HARDHAT_NETWORK_ID.toString(16)}`;
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    await this._initialize();
  }

  // This method checks if the selected network is Localhost:8545
  _checkNetwork() {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      this._switchChain();
    }
  }

  async _updateBalance() {
    const balance = await this.provider.getBalance(this.state.selectedAddress);

    this.setState({
      balance: ethers.utils.formatEther(balance),
    });
  }
}

export default Dapp;
