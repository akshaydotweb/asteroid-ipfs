
## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd asteroid
    ```
2.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    ```
3.  **Install frontend dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```
4.  **Install IPFS:** Follow the official IPFS installation guide: [https://docs.ipfs.tech/install/](https://docs.ipfs.tech/install/)
5.  **Install MetaMask:** Add the MetaMask browser extension.

## Configuration

1.  **Smart Contracts:**
    *   Review and modify contracts in `backend/contracts/` if needed.
    *   Deploy the contracts using Hardhat (see Deployment section).
    *   Update the deployed contract addresses in:
        *   `frontend/src/components/FileUpload.js` (`CONTRACT_ADDRESS`, `STORAGE_PAYMENT_ADDRESS`)
        *   `frontend/src/components/FileGallery.js` (`CONTRACT_ADDRESS` - if used)
2.  **Backend Port:** The backend server (`server.cjs`) runs on port 3001 by default. Ensure the `BACKEND_URL` in `frontend/src/components/FileUpload.js` and `FileGallery.js` matches this (e.g., `http://localhost:3001`).
3.  **IPFS Configuration:**
    *   Ensure your IPFS daemon is configured with the necessary API CORS headers if running on different origins:
        ```bash
        ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3000", "http://127.0.0.1:5001"]' # Add your frontend origin
        ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
        ```
    *   The application assumes the IPFS API is running on `localhost:5001` and the gateway on `localhost:8080`.

## Usage

1.  **Start IPFS Daemon:**
    *   Open a terminal and run:
        ```bash
        ipfs daemon
        ```
    *   Keep this running in the background.

2.  **Deploy Smart Contracts (if not already done):**
    *   Navigate to the  directory.
    *   Configure your `hardhat.config.cjs` for the desired network (e.g., localhost for Ganache/Hardhat Node, or a testnet like Sepolia).
    *   Run the deployment script (e.g., `npx hardhat run scripts/deploy.js --network your_network_name`).
    *   Note the deployed contract addresses and update the frontend configuration.

3.  **Start Backend Server:**
    *   Navigate to the  directory.
    *   Run:
        ```bash
        node server.cjs
        ```
    *   The server should start, typically on port 3001.

4.  **Start Frontend Application:**
    *   Navigate to the  directory.
    *   Run:
        ```bash
        npm start
        ```
    *   This will open the application in your browser, usually at `http://localhost:3000`.

5.  **Interact with the DApp:**
    *   Connect your MetaMask wallet (ensure it's configured for the network you deployed to).
    *   Select a file using the upload component.
    *   Review the calculated storage cost.
    *   Click "Pay & Upload" and approve the transaction in MetaMask.
    *   Wait for the transaction confirmation and IPFS upload.
    *   View the results or check the File Gallery.

