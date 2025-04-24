import React, { useState, useEffect } from 'react';
import { create } from 'ipfs-http-client';
import { ethers } from 'ethers';
import './FileUpload.css';

// Configure IPFS client
const ipfsClient = create({
  host: 'localhost',
  port: 5001,
  protocol: 'http'
});

const BACKEND_URL = "http://localhost:3000";

// Storage Payment contract details
const STORAGE_PAYMENT_ABI = [
  "function purchaseStorage() public payable",
  "function useStorage(uint256 fileSizeInKB) public"
];
const STORAGE_PAYMENT_ADDRESS = "0xYourStoragePaymentContractAddress"; // Replace with your contract address

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [storageContract, setStorageContract] = useState(null);
  const [storageCost, setStorageCost] = useState(null);
  
  // Storage pricing constants
  const PRICE_PER_KB = 0.00000001; // ETH per KB
  const MIN_PAYMENT = 0.000000000001; // Minimum payment in ETH

  // Connect wallet
  const connectWallet = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      // Initialize storage contract
      const paymentContract = new ethers.Contract(
        STORAGE_PAYMENT_ADDRESS, 
        STORAGE_PAYMENT_ABI, 
        signer
      );
      setStorageContract(paymentContract);
      setWalletConnected(true);
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("Failed to connect wallet: " + err.message);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      setError(null);
      
      // Calculate storage cost
      const fileSizeInKB = Math.ceil(selectedFile.size / 1024);
      let cost = fileSizeInKB * PRICE_PER_KB;
      
      // Apply minimum payment rule
      if (cost < MIN_PAYMENT) {
        cost = MIN_PAYMENT;
      }
      
      setStorageCost(cost.toFixed(5));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!file) return;
    
    if (!walletConnected || !storageContract) {
      setError("Please connect your wallet first");
      return;
    }
    
    setUploading(true);
    setProgress(10); // Start progress at 10%
    setError(null);
    setResult(null);
    
    try {
      // 1. FIRST: Process storage payment
      setProgress(20);
      console.log(`Initiating payment of ${storageCost} ETH`);
      
      // Process the transaction for storage payment
      const fileSizeInKB = Math.ceil(file.size / 1024);
      const tx = await storageContract.purchaseStorage({
        value: ethers.parseEther(storageCost)
      });
      
      setProgress(40);
      console.log("Payment transaction submitted:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      if (!receipt.status) {
        throw new Error("Transaction failed");
      }
      
      console.log("Payment confirmed in block:", receipt.blockNumber);
      setProgress(60);
      
      // 2. SECOND: Use storage allocation
      const useTx = await storageContract.useStorage(fileSizeInKB);
      await useTx.wait();
      
      setProgress(70);
      console.log("Storage allocation recorded");
      
      // 3. THIRD: Upload file to IPFS now that payment is complete
      const formData = new FormData();
      formData.append('file', file);
      
      console.log("Uploading file to IPFS...");
      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      console.log("IPFS upload successful:", data);
      
      // Extract CID from response
      const cid = data.cid || (data.data && data.data.cid) || "";
      
      if (!cid) {
        throw new Error("No CID returned from server");
      }
      
      setProgress(100);
      
      // Set successful result
      setResult({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        cid: cid,
        txHash: tx.hash,
        storageCost: storageCost,
        accessLink: `http://127.0.0.1:8080/ipfs/${cid}`
      });
      
    } catch (err) {
      console.error("Error in upload process:", err);
      setError(`Transaction or upload failed: ${err.message}`);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="upload-container">
      <h2>Store Your Files Securely on IPFS</h2>
      <p className="description">
        Files are stored on IPFS and referenced on the blockchain.
        Storage cost: {PRICE_PER_KB} ETH per KB (min. {MIN_PAYMENT} ETH)
      </p>
      
      <div className="wallet-section">
        {!walletConnected ? (
          <button onClick={connectWallet} className="connect-wallet-btn">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <span className="wallet-status connected">Wallet Connected</span>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-drop-area">
          <input 
            type="file" 
            id="fileInput" 
            onChange={handleFileChange}
            className="file-input"
            disabled={!walletConnected}
          />
          <label htmlFor="fileInput" className="file-label">
            {file ? file.name : 'Choose a file or drag it here'}
          </label>
        </div>
        
        {file && storageCost && (
          <div className="cost-preview">
            <p>File Size: {formatFileSize(file.size)}</p>
            <p>Storage Cost: <strong>{storageCost} ETH</strong></p>
          </div>
        )}
        
        <button 
          type="submit" 
          className="upload-button" 
          disabled={!file || uploading || !walletConnected}
        >
          {uploading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : `Pay & Upload${storageCost ? ` (${storageCost} ETH)` : ''}`}
        </button>
      </form>
      
      {uploading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{width: `${progress}%`}}
            ></div>
          </div>
          <span className="progress-text">{progress}%</span>
          <div className="progress-status">
            {progress < 60 ? "Processing payment..." : 
             progress < 80 ? "Uploading to IPFS..." : 
             "Finalizing..."}
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {result && (
        <div className="result-container">
          <h3>File Successfully Uploaded!</h3>
          <div className="result-details">
            <p><strong>File:</strong> {result.fileName} ({formatFileSize(result.fileSize)})</p>
            <p><strong>IPFS CID:</strong> <code>{result.cid}</code></p>
            <p><strong>Transaction:</strong> <a href={`https://etherscan.io/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer">{result.txHash?.substring(0,10)}...</a></p>
            <p><strong>Storage Cost:</strong> {result.storageCost} ETH</p>
          </div>
          <div className="result-actions">
            <a href={result.accessLink} className="view-file-button" target="_blank" rel="noopener noreferrer">
              View Your File
            </a>
            <button 
              onClick={() => navigator.clipboard.writeText(result.cid)}
              className="copy-cid-btn"
            >
              Copy CID
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;