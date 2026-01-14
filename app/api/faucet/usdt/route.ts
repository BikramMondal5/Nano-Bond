import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const NETWORK_CONFIGS = {
    mantle: {
        rpc: "https://rpc.sepolia.mantle.xyz",
        usdtAddress: process.env.USDT_ADDRESS!
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
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address account) external view returns (uint256)"
];

export async function POST(req: NextRequest) {
    try {
        const { address, amount, network = 'mantle' } = await req.json();

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

        const provider = new ethers.JsonRpcProvider(networkConfig.rpc);
        const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

        const usdt = new ethers.Contract(networkConfig.usdtAddress, USDT_ABI, adminWallet);

        const amountBig = ethers.parseUnits(amount.toString(), 6);
        const tx = await usdt.mint(address, amountBig);
        await tx.wait();

        return NextResponse.json({
            success: true,
            txHash: tx.hash,
            network,
            message: `Minted ${amount} USDT on ${network}`
        });

    } catch (error: any) {
        console.error("[Faucet] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Faucet failed" },
            { status: 500 }
        );
    }
}