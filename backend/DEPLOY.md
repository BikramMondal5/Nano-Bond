# Deploying NanoBond Backend to Render

## Prerequisites
- A GitHub repository containing this project.
- A [Render](https://render.com) account.

## Step-by-Step Guide

1.  **Push your code to GitHub**
    Ensure your latest code is committed and pushed to your GitHub repository.

2.  **Create a New Web Service on Render**
    - Log in to your Render dashboard.
    - Click **"New +"** and select **"Web Service"**.
    - Connect your GitHub repository.

3.  **Configure the Service**
    - **Name**: `nanobond-backend` (or your preferred name)
    - **Region**: Select a region close to your users (e.g., Singapore, Frankfurt, etc.)
    - **Branch**: `main` (or your working branch)
    - **Root Directory**: `backend` (This is crucial since the backend is in a subfolder)
    - **Runtime**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `node dist/server.js`

4.  **Environment Variables**
    Scroll down to the "Environment Variables" section and add the following keys from your `.env` file:

    | Key | Value |
    |-----|-------|
    | `RPC_URL` | `https://rpc.sepolia.mantle.xyz` (or your own) |
    | `COUPON_DISTRIBUTOR_ADDRESS` | *[Your Contract Address]* |
    | `SOVEREIGN_BOND_ADDRESS` | *[Your Contract Address]* |
    | `USDT_ADDRESS` | *[Your Contract Address]* |
    | `IDENTITY_REGISTRY_ADDRESS` | *[Your Contract Address]* |
    | `SWAP_GATEWAY_ADDRESS` | *[Your Contract Address]* |
    | `TREASURY_SWAP_ADDRESS` | *[Your Contract Address]* |
    | `PRIVATE_KEY` | *[Your Admin Private Key]* |
    | `PORT` | `10000` (Render sets this automatically, but good to know) |

5.  **Deploy**
    - Click **"Create Web Service"**.
    - Render will start building your app. Watch the logs for any errors.

6.  **Verify**
    - Once deployed, Render will provide a URL (e.g., `https://nanobond-backend.onrender.com`).
    - Visit `https://nanobond-backend.onrender.com/health` to verify the server is running. It should return `{"status":"ok",...}`.

## Troubleshooting
- **Build Fails**: Check if `npm install` is working correctly. ensure `typescript` is in `devDependencies`.
- **Start Fails**: Check logs. If `dist/server.js` is not found, ensure `npm run build` ran successfully and `tsconfig.json` has `"outDir": "./dist"`.
- **Connection Errors**: Verify your `RPC_URL` and `PRIVATE_KEY` are correct.
