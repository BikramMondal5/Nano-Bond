import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const NETWORK_CONFIGS = {
    mantle: {
        rpc: "https://rpc.sepolia.mantle.xyz",
        usdtAddress: process.env.USDT_ADDRESS || process.env.NEXT_PUBLIC_USDT_MANTLE!
    },
    ethereum: {
        rpc: process.env.NEXT_PUBLIC_ETHEREUM_RPC!,
        usdtAddress: process.env.NEXT_PUBLIC_USDT_ETHEREUM!
    },
    arbitrum: {
        rpc: process.env.NEXT_PUBLIC_ARBITRUM_RPC!,
        usdtAddress: process.env.NEXT_PUBLIC_USDT_ARBITRUM!
    },
    polygon: {
        rpc: process.env.NEXT_PUBLIC_POLYGON_RPC!,
        usdtAddress: process.env.NEXT_PUBLIC_USDT_POLYGON!
    },
    scroll: {
        rpc: process.env.NEXT_PUBLIC_SCROLL_RPC!,
        usdtAddress: process.env.NEXT_PUBLIC_USDT_SCROLL!
    }
};

const USDT_ABI = [
    "function balanceOf(address account) external view returns (uint256)"
];

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    try {
        const { address } = await params;
        const { searchParams } = new URL(req.url);
        const network = searchParams.get('network') || 'mantle';

        if (!address) {
            return NextResponse.json(
                { success: false, error: "Address required" },
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

        if (!networkConfig.usdtAddress) {
            return NextResponse.json(
                { success: false, error: `USDT address not configured for ${network}` },
                { status: 400 }
            );
        }

        console.log(`[Balance API] Fetching balance for ${address} on ${network}`);
        console.log(`[Balance API] USDT Address: ${networkConfig.usdtAddress}`);
        console.log(`[Balance API] RPC: ${networkConfig.rpc}`);

        const provider = new ethers.JsonRpcProvider(networkConfig.rpc);
        const usdt = new ethers.Contract(networkConfig.usdtAddress, USDT_ABI, provider);

        const balance = await usdt.balanceOf(address);
        const balanceFormatted = ethers.formatUnits(balance, 6); // USDT has 6 decimals

        console.log(`[Balance API] Balance: ${balanceFormatted} USDT`);

        return NextResponse.json({
            success: true,
            balance: balanceFormatted,
            network,
            address
        });

    } catch (error: any) {
        console.error("[Balance API] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch balance", balance: "0" },
            { status: 500 }
        );
    }
}