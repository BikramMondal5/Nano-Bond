import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { toast } from 'sonner'
import { useWeb3AuthContext } from '@/components/providers'

// LayerZero V2 Endpoint IDs
const LZ_CHAIN_IDS = {
    mantleSepolia: 40356,
    ethereumSepolia: 40161,
    bscTestnet: 40102,
    arbitrumSepolia: 40231,
    optimismSepolia: 40232,
    baseSepolia: 40245,
}

const CROSS_CHAIN_GATEWAY_ABI = [
    "function investCrossChain(uint256 amount, uint32 dstEid, bytes calldata extraOptions) external payable returns (bytes32)",
    "function quoteCrossChainFee(uint32 dstEid, uint256 amount, bytes calldata extraOptions) external view returns (uint256, uint256)",
]

export function useCrossChainInvestment() {
    const { getSigner, getEthersProvider, walletAddress } = useWeb3AuthContext()

    const [isPending, setIsPending] = useState(false)
    const [txHash, setTxHash] = useState<string | null>(null)
    const [error, setError] = useState<Error | null>(null)

    /**
     * Quote the LayerZero fee for cross-chain investment
     */
    const quoteFee = useCallback(async (
        gatewayAddress: string,
        amount: string,
        sourceChain: keyof typeof LZ_CHAIN_IDS
    ) => {
        try {
            const provider = getEthersProvider()
            if (!provider) throw new Error('No provider available')

            const gateway = new ethers.Contract(gatewayAddress, CROSS_CHAIN_GATEWAY_ABI, provider)
            const amountBig = ethers.parseUnits(amount, 6)
            const dstEid = LZ_CHAIN_IDS.mantleSepolia

            const [nativeFee] = await gateway.quoteCrossChainFee(
                dstEid,
                amountBig,
                "0x" // Default options
            )

            return ethers.formatEther(nativeFee)
        } catch (err: any) {
            console.error('Failed to quote fee:', err)
            return "0"
        }
    }, [getEthersProvider])

    /**
     * Execute cross-chain investment
     */
    const investCrossChain = useCallback(async (
        gatewayAddress: string,
        usdtAddress: string,
        amount: string,
        sourceChain: keyof typeof LZ_CHAIN_IDS
    ) => {
        setIsPending(true)
        setError(null)
        setTxHash(null)

        try {
            const signer = await getSigner()
            if (!signer) throw new Error('No signer available')

            const gateway = new ethers.Contract(gatewayAddress, CROSS_CHAIN_GATEWAY_ABI, signer)
            const usdt = new ethers.Contract(usdtAddress, [
                "function approve(address spender, uint256 amount) external returns (bool)",
                "function allowance(address owner, address spender) external view returns (uint256)"
            ], signer)

            const amountBig = ethers.parseUnits(amount, 6)
            const dstEid = LZ_CHAIN_IDS.mantleSepolia

            // 1. Check and approve USDT
            const allowance = await usdt.allowance(walletAddress, gatewayAddress)
            if (allowance < amountBig) {
                toast.info('Approving USDT...')
                const approveTx = await usdt.approve(gatewayAddress, amountBig)
                await approveTx.wait()
                toast.success('USDT approved!')
            }

            // 2. Quote LayerZero fee
            const [nativeFee] = await gateway.quoteCrossChainFee(
                dstEid,
                amountBig,
                "0x"
            )

            // 3. Execute cross-chain investment
            toast.info('Sending cross-chain investment...')
            const tx = await gateway.investCrossChain(
                amountBig,
                dstEid,
                "0x",
                { value: nativeFee }
            )

            setTxHash(tx.hash)
            toast.info('Transaction sent! Waiting for confirmation...')

            await tx.wait()
            toast.success(`Cross-chain investment successful! Bonds will arrive on Mantle in ~5-10 minutes.`)

            return tx.hash
        } catch (err: any) {
            console.error('Cross-chain investment failed:', err)
            setError(err)
            toast.error('Investment failed: ' + err.message)
            throw err
        } finally {
            setIsPending(false)
        }
    }, [getSigner, walletAddress])

    return {
        investCrossChain,
        quoteFee,
        isPending,
        txHash,
        error,
    }
}