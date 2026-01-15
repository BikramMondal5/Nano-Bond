import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import connectDB from "@/lib/mongodb";
import { Investment } from "@/lib/models/Investment";

const NETWORK_CONFIGS = {
    mantle: {
        rpc: "https://rpc.sepolia.mantle.xyz",
        usdtAddress: process.env.USDT_ADDRESS!,
        gatewayAddress: process.env.NEXT_PUBLIC_CROSS_CHAIN_GATEWAY_MANTLE!
    },
    ethereum: {
        rpc: process.env.NEXT_PUBLIC_ETHEREUM_RPC!,
        usdtAddress: process.env.NEXT_PUBLIC_USDT_ETHEREUM!,
        gatewayAddress: process.env.NEXT_PUBLIC_CROSS_CHAIN_GATEWAY_ETHEREUM!
    },
    arbitrum: {
        rpc: process.env.NEXT_PUBLIC_ARBITRUM_RPC!,
        usdtAddress: process.env.NEXT_PUBLIC_USDT_ARBITRUM!,
        gatewayAddress: process.env.NEXT_PUBLIC_CROSS_CHAIN_GATEWAY_ARBITRUM!
    },
    polygon: {
        rpc: process.env.NEXT_PUBLIC_POLYGON_RPC!,
        usdtAddress: process.env.NEXT_PUBLIC_USDT_POLYGON!,
        gatewayAddress: process.env.NEXT_PUBLIC_CROSS_CHAIN_GATEWAY_POLYGON!
    },
    scroll: {
        rpc: process.env.NEXT_PUBLIC_SCROLL_RPC!,
        usdtAddress: process.env.NEXT_PUBLIC_USDT_SCROLL!,
        gatewayAddress: process.env.NEXT_PUBLIC_CROSS_CHAIN_GATEWAY_SCROLL!
    }
};

const GATEWAY_ABI = [
    "function investWithPermit(address user, uint256 amount, address treasury, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external"
];

const USDT_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];

export async function POST(req: NextRequest) {
    try {
        const { address, amount, bondId = 'GOI-2030', network = 'mantle' } = await req.json();

        if (!address || !amount) {
            return NextResponse.json(
                { success: false, error: "Address and amount required" },
                { status: 400 }
            );
        }

        const networkConfig = NETWORK_CONFIGS[network as keyof typeof NETWORK_CONFIGS];
        if (!networkConfig) {
            return NextResponse.json(
                { success: false, error: "Unsupported network" },
                { status: 400 }
            );
        }

        await connectDB();

        const provider = new ethers.JsonRpcProvider(networkConfig.rpc);
        const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

        const amountBig = ethers.parseUnits(amount.toString(), 6);

        // For Mantle: Direct investment through gateway
        if (network === 'mantle') {
            const gateway = new ethers.Contract(
                networkConfig.gatewayAddress,
                GATEWAY_ABI,
                adminWallet
            );

            const deadline = Math.floor(Date.now() / 1000) + 3600;
            const treasuryAddress = process.env.TREASURY_SWAP_ADDRESS!;

            const tx = await gateway.investWithPermit(
                address,
                amountBig,
                treasuryAddress,
                deadline,
                27,
                ethers.ZeroHash,
                ethers.ZeroHash
            );

            await tx.wait();

            await Investment.create({
                walletAddress: address,
                bondId,
                type: 'INVEST',
                amount: parseFloat(amount),
                txHash: tx.hash,
                status: 'SUCCESS',
                network
            });

            return NextResponse.json({
                success: true,
                txHash: tx.hash,
                network,
                message: `Invested ${amount} USDT`
            });
        }
        // For other networks: Cross-chain investment
        else {
            const CROSS_CHAIN_ABI = [
                "function investCrossChain(uint256 amount, uint32 dstEid, bytes calldata extraOptions) external payable returns (bytes32)"
            ];

            const gateway = new ethers.Contract(
                networkConfig.gatewayAddress,
                CROSS_CHAIN_ABI,
                adminWallet
            );

            const dstEid = parseInt(process.env.NEXT_PUBLIC_LZ_EID_MANTLE!);

            // Estimate LayerZero fee (simplified)
            const nativeFee = ethers.parseEther("0.01"); // You should call quoteCrossChainFee

            const tx = await gateway.investCrossChain(
                amountBig,
                dstEid,
                "0x",
                { value: nativeFee }
            );

            await tx.wait();

            await Investment.create({
                walletAddress: address,
                bondId,
                type: 'INVEST_CROSS_CHAIN',
                amount: parseFloat(amount),
                txHash: tx.hash,
                status: 'PENDING',
                network,
                sourceNetwork: network,
                destinationNetwork: 'mantle'
            });

            return NextResponse.json({
                success: true,
                txHash: tx.hash,
                network,
                message: `Cross-chain investment initiated from ${network}. Bonds will arrive on Mantle in ~5-10 minutes.`
            });
        }

    } catch (error: any) {
        console.error("[Invest] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Investment failed" },
            { status: 500 }
        );
    }
}