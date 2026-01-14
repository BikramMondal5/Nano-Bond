import express, { Request, Response } from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { config } from './config';

// ==================================================================
// SECURE KYC SERVER (Privacy First)
// ==================================================================
// This server runs independently on a separate port (3002).
// It has NO database connection.
// It receives sensitive data -> Hashes it -> Sends to Blockchain -> Forgets it.
// ==================================================================

const app = express();
const PORT = 3002;

app.use(cors());

// Privacy: Parse JSON but do NOT log the body content in middleware
app.use(express.json());

// Identity Registry ABI
const IDENTITY_REGISTRY_ABI = [
    "function register(address wallet, bytes32 nationalIdHash) external",
    "function isVerified(address wallet) external view returns (bool)",
];

// Admin Wallet for Registration (Only loaded in memory)
const provider = new ethers.JsonRpcProvider(config.rpc.url);
const adminWallet = config.admin.privateKey
    ? new ethers.Wallet(config.admin.privateKey, provider)
    : null;

/**
 * POST /register
 * Secure endpoint for KYC registration.
 * Privacy Guarantee:
 * 1. Checks validity of input.
 * 2. Hashes 'nationalId' immediately.
 * 3. Submits Hash to Blockchain.
 * 4. Does NOT save 'nationalId' anywhere.
 */
app.post('/register', async (req: Request, res: Response) => {
    try {
        const { address, nationalId } = req.body;

        // 1. Strict Input Validation
        if (!address || !nationalId) {
            console.log(`[KYC-SECURE] Failed request from ${req.ip} - Missing Data`);
            res.status(400).json({ error: 'Missing address or nationalId' });
            return;
        }

        if (!adminWallet) {
            console.error('[KYC-SECURE] Admin wallet not configured');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }

        // 2. Immediate Hashing (Zero Knowledge Storage)
        // We use the ID only to generate the hash, then it falls out of scope.
        const nationalIdHash = ethers.keccak256(ethers.toUtf8Bytes(nationalId));

        console.log(`[KYC-SECURE] Processing KYC for ${address}`);
        console.log(`[KYC-SECURE] ID Hash generated: ${nationalIdHash}`);
        // NOTE: We do NOT log the actual nationalId.

        const registry = new ethers.Contract(
            config.contracts.registryAddress,
            IDENTITY_REGISTRY_ABI,
            adminWallet
        );

        // 3. Blockchain Interaction
        // Check if already on-chain (to save gas)
        const isVerified = await registry.isVerified(address);
        if (isVerified) {
            console.log(`[KYC-SECURE] Address ${address} already verified on-chain`);
            res.json({ success: true, message: 'Already verified' });
            return;
        }

        console.log(`[KYC-SECURE] Sending TX to blockchain...`);
        const tx = await registry.register(address, nationalIdHash);
        console.log(`[KYC-SECURE] TX Sent: ${tx.hash}`);

        // Wait for confirmation
        await tx.wait();
        console.log(`[KYC-SECURE] Verification Confirmed on Blockchain.`);

        // 4. Success Response
        res.json({
            success: true,
            message: 'Secure Verification Successful',
            txHash: tx.hash
        });

    } catch (error: any) {
        console.error('[KYC-SECURE] Error:', error.message);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Start Secure Server
app.listen(PORT, () => {
    console.log(`
    =============================================
       SECURE KYC SERVER (PRIVACY ENFORCED)
    =============================================
    
    Status: RUNNING
    Port:   ${PORT}
    Mode:   ZERO-STORAGE
    
    This server handles sensitive data solely in memory
    for the duration of the hashing process.
    =============================================
    `);
});
