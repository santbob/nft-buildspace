import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import openseaLogo from './assets/opensea-logo.svg';
import React, {useEffect, useState} from "react";
import {ethers} from 'ethers';
import myEpicNFT from './utils/MyEpicNFT.json'

// Constants
const TWITTER_HANDLE = 'santbob';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/assets/migannft-3suzwnqazz';
const CONTRACT_ADDRESS = "0xCA886B7F73CDdF8b46ceA9Cc8E32592762c6f481";

const App = () => {

  const [currentAccount, setCurrentAccount] = useState(null)
  const [maxMintableCount, setMaxMintableCount] = useState(0)
  const [mintedCount, setMintedCount] = useState(0)
  const [loading, setLoading] = useState(false);

  const checkWalletAndChain = async () => {
    const { ethereum } = window;

      if(!ethereum){
        alert("Make sure you have MetaMask wallet")
        return false;
      } else {
        console.log("Cool! you have the MetaMask wallet")
      }
      
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);

      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x4"; 
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
        return false;
      }

      return true;
  }

  const checkIfWalletIsConnected = async () => {
      const { ethereum } = window;

      const hasValidWallet = await checkWalletAndChain();
      if(!hasValidWallet) {
        return;
      }

      const accounts = await ethereum.request({method: 'eth_accounts'});

      if(accounts && accounts.length > 0) {
        const account = accounts[0]
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        setupListener()
      } else {
        console.log("no valid account found")
      }
  }

  const connectWallet = async () => {
    const {ethereum} = window;

    const hasValidWallet = await checkWalletAndChain();
    if(!hasValidWallet) {
      return;
    }

    const accounts = await ethereum.request({method: 'eth_requestAccounts'});

    if(accounts && accounts.length > 0) {
      const account = accounts[0]
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)
      setupListener()
    } else {
      console.log("no valid account found")
    }
  }

  const setupListener = async () => {
    try {
      
        const connectedContract = await getContract()
        await updateMintedNFTCounts(connectedContract)
        connectedContract.on('NewEpicNFTMinted', async (from, tokenId) => {
          console.log(`A New Epic NFT Minted by ${from} and the tokenId is ${tokenId}`)
          
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
          await updateMintedNFTCounts(connectedContract)
          setLoading(false)
        })
     
    } catch(error){
      console.log(error)
    }
  }


  const getContract = async () => {

    const hasValidWallet = await checkWalletAndChain();
    if(hasValidWallet) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNFT.abi, signer);
      return connectedContract;
    }
    return false
  }

  const askContractToMintNft = async () => {
    try {
     
        const connectedContract = await getContract();

        setLoading(true)
        console.log("calling contract to mint migan NFT")
        let nftTxn = await connectedContract.makeMiganNFT();

        console.log('Mining plz wait...')
        nftTxn.wait()

        await updateMintedNFTCounts(connectedContract)
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        
    } catch(error){
      alert("Transaction failed, Try again")
      console.log(error)
      setLoading(false)
    }
    
  }

  const updateMintedNFTCounts = async (connectedContract) => {
     const maxMintable = await connectedContract.getMaxNFTsMintable()
     const mintedCount = await connectedContract.getTotalNFTsMinted();

      console.log(`Minted=${mintedCount.toNumber()} & Max=${maxMintable.toNumber()}`)
      setMaxMintableCount(maxMintable.toNumber());
      setMintedCount(mintedCount.toNumber());
  }


  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => (
      <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
        Mint NFT
      </button>
  );

  useEffect(() => {
    setLoading(false)
    checkIfWalletIsConnected();
  }, [])


  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {!currentAccount ? 
              renderNotConnectedContainer()
           : 
            renderConnectedContainer()
          }

          {maxMintableCount > 0 && (<div className="mint-count">Minted {mintedCount}/{maxMintableCount}</div>)}

          {loading && (<div className="loader">
            Please wait for the transaction to complete...
          </div>
        )}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a> 
          
          <span className="divider">|</span>
          
          <img alt="OpenSea Logo" className="opensea-logo" src={openseaLogo} />
          <a
            className="footer-text"
            href={OPENSEA_LINK}
            target="_blank"
            rel="noreferrer"
          >{'Browse MiganNFT'}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
