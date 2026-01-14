# App Integration with Backend and Smart Contracts

This document explains how the Flutter app is connected to the backend services and smart contracts.

## Overview

The app is now fully integrated with:
1. **Smart Contracts** - Deployed on Polygon Amoy Testnet
2. **Backend Services** - Node.js services for monitoring and automation

## Configuration Files

### 1. Environment Variables (`.env`)

All contract addresses and configuration are stored in the `.env` file:

```env
# Blockchain Configuration
CHAIN_RPC_URL=https://rpc-amoy.polygon.technology
CHAIN_ID=80002

# Contract Addresses (Deployed)
USDC_CONTRACT_ADDRESS=0xB1fC9a11C50Ce3DD6943AeBdAe1951c9191a19ca
IDENTITY_REGISTRY_ADDRESS=0x9AF27A1571b4Df7A94c61Eaa30f5bB3C942953aB
SOVEREIGN_BOND_ADDRESS=0xDAF1155390b64E15CCDedD54Ed42CD5A1C7db5CD
TREASURY_SWAP_ADDRESS=0x99A68DfD1c2209b7f76f1E9cF83fFec3F31974a1
SWAP_GATEWAY_ADDRESS=0x1cAEff73E6114C570bF57801989C177996112724
COUPON_DISTRIBUTOR_ADDRESS=0x42bCA77915BBb75324B61b650F84772A4ed7a400

# Backend API
API_BASE_URL=http://localhost:3000
```

### 2. Contracts Configuration (`lib/core/config/contracts_config.dart`)

Centralized configuration file that:
- Reads contract addresses from `.env`
- Provides contract ABIs for all smart contracts
- Offers type-safe access to addresses

**Key Features:**
- ✅ All contract addresses in one place
- ✅ Complete ABIs for ERC20, TreasurySwap, SovereignBond, IdentityRegistry, CouponDistributor, SwapGateway
- ✅ Easy to update when contracts are redeployed

## Services

### 1. BlockchainService (`lib/core/services/blockchain_service.dart`)

Handles all blockchain interactions:

**USDC Operations:**
- `approveUSDC(privateKey, amount, spender)` - Approve USDC spending
- `getUSDCBalance(address)` - Get USDC balance

**Bond Operations:**
- `buyBond(privateKey, usdcAmount)` - Purchase bonds
- `getBondBalance(address)` - Get bond token balance
- `getBondName()` - Get bond name
- `getBondSymbol()` - Get bond symbol

**Identity Registry Operations:**
- `isVerified(address)` - Check if address is KYC verified
- `registerIdentity(privateKey, nationalId)` - Register for KYC

**Utility:**
- `getBalance(address)` - Get native token balance (MATIC)

### 2. BackendService (`lib/core/services/backend_service.dart`)

Communicates with backend APIs for:

**Debt Monitoring:**
- `getDebtStatus()` - Get current debt/backing status
  - Returns: `DebtMonitorStatus` with total debt, backing, health status

**Yield Distribution:**
- `distributeYield(amount)` - Trigger yield distribution (admin)
  - Returns: `YieldDistributionResult` with transaction details

**Bond Information:**
- `getBondInfo(bondAddress)` - Get detailed bond information
  - Returns: `BondInfo` with name, symbol, supply, rates, maturity

### 3. KycService (`lib/core/services/kyc_service.dart`)

Handles KYC registration:
- `requestRegistration(address, nationalId)` - Submit KYC request

### 4. BondRegistryService (`lib/core/services/bond_registry_service.dart`)

Fetches available bonds:
- `listBonds()` - Get list of all available bonds

## Smart Contract Addresses (Polygon Amoy Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| USDC | `0xB1fC9a11C50Ce3DD6943AeBdAe1951c9191a19ca` | Stablecoin for purchases |
| Identity Registry | `0x9AF27A1571b4Df7A94c61Eaa30f5bB3C942953aB` | KYC verification |
| Sovereign Bond | `0xDAF1155390b64E15CCDedD54Ed42CD5A1C7db5CD` | Bond token (ERC20) |
| Treasury Swap | `0x99A68DfD1c2209b7f76f1E9cF83fFec3F31974a1` | Bond purchase |
| Swap Gateway | `0x1cAEff73E6114C570bF57801989C177996112724` | Token swaps |
| Coupon Distributor | `0x42bCA77915BBb75324B61b650F84772A4ed7a400` | Yield distribution |

## Backend Services

The backend provides two main services:

### 1. Debt Monitor (`backend/src/debt-monitor.ts`)
- Monitors total debt issued vs asset backing
- Provides transparency portal
- Run: `cd backend && npm run monitor`

### 2. Yield Bot (`backend/src/yield-bot.ts`)
- Automated coupon distribution
- Integrates with Bybit for market data
- Run: `cd backend && npm run bot`

## Usage Example

### Buying Bonds in the App

```dart
// 1. Get blockchain service
final blockchainService = BlockchainService();

// 2. Check if user is verified
final isVerified = await blockchainService.isVerified(userAddress);

// 3. Approve USDC spending
await blockchainService.approveUSDC(
  privateKey,
  amount,
  ContractsConfig.treasurySwapAddress,
);

// 4. Buy bonds
await blockchainService.buyBond(privateKey, amount);

// 5. Check new bond balance
final bondBalance = await blockchainService.getBondBalance(userAddress);
```

### Monitoring Debt Status

```dart
// Get backend service
final backendService = BackendService();

// Fetch debt status
final status = await backendService.getDebtStatus();

print('Total Debt: \$${status.totalDebtIssued}');
print('Total Backing: \$${status.totalAssetBacking}');
print('Status: ${status.isHealthy ? "HEALTHY" : "WARNING"}');
```

## Testing the Connection

### 1. Test Blockchain Connection

```bash
cd app
flutter pub get
flutter run
```

The app will:
- Connect to Polygon Amoy RPC
- Load contract addresses from `.env`
- Allow interaction with all contracts

### 2. Test Backend Connection

```bash
cd backend
npm install
npm run monitor  # Check debt status
npm run bot      # Test yield distribution
```

### 3. Verify Contract Deployment

Check that all addresses in `.env` match those in `contracts/deployed_addresses.json`:

```bash
cd contracts
cat deployed_addresses.json
```

## Updating Contract Addresses

When contracts are redeployed:

1. Update `contracts/deployed_addresses.json`
2. Update `app/.env` with new addresses
3. Update `backend/src/config.ts` if needed
4. Restart the app and backend services

## Environment Setup

### Prerequisites
- Flutter SDK 3.10.4+
- Node.js 20+
- Polygon Amoy testnet MATIC for gas
- USDC tokens for testing

### Quick Start

```bash
# 1. Deploy/verify contracts
cd contracts
npm install
npx hardhat run scripts/deploy_and_save.ts --network polygonAmoy

# 2. Start backend
cd ../backend
npm install
npm start

# 3. Run app
cd ../app
flutter pub get
flutter run
```

## Troubleshooting

### App can't connect to contracts
- Check `.env` file has correct addresses
- Verify RPC URL is accessible
- Ensure CHAIN_ID matches network

### Backend services fail
- Check `backend/.env` has required keys
- Verify contract addresses match deployment
- Ensure admin wallet has MATIC for gas

### Transactions fail
- Check user has MATIC for gas
- Verify USDC balance is sufficient
- Ensure user is KYC verified (if required)

## Security Notes

⚠️ **Important:**
- Never commit `.env` files with private keys
- Use separate wallets for development and production
- Keep API keys secure
- Validate all user inputs before blockchain transactions

## Next Steps

- [ ] Implement transaction history syncing with backend
- [ ] Add real-time price feeds from backend
- [ ] Integrate push notifications for yield distribution
- [ ] Add analytics dashboard using backend APIs
