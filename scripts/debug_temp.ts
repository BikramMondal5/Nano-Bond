
import { createPublicClient, http, formatUnits, parseAbi } from 'viem'
import { mantleSepoliaTestnet } from 'viem/chains'

const TREASURY_ADDRESS = "0x614fA7240eEE05bC9F538e92846F4FB4054A3855"

const TREASURY_ABI = parseAbi([
    'function bond() view returns (address)'
])

const BOND_ABI = parseAbi([
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function totalBackedValue() view returns (uint256)'
])

async function main() {
    const client = createPublicClient({
        chain: mantleSepoliaTestnet,
        transport: http() // will use default public RPC
    })

    console.log("Fetching Bond Address from Treasury...")
    try {
        const bondAddress = await client.readContract({
            address: TREASURY_ADDRESS,
            abi: TREASURY_ABI,
            functionName: 'bond'
        })
        console.log("Bond Address:", bondAddress)

        console.log("Fetching Bond Stats...")
        const [decimals, supply, backed] = await Promise.all([
            client.readContract({ address: bondAddress, abi: BOND_ABI, functionName: 'decimals' }),
            client.readContract({ address: bondAddress, abi: BOND_ABI, functionName: 'totalSupply' }),
            client.readContract({ address: bondAddress, abi: BOND_ABI, functionName: 'totalBackedValue' })
        ])

        console.log("--- STATS ---")
        console.log(`Decimals: ${decimals}`)
        console.log(`Total Supply (Raw): ${supply}`)
        console.log(`Total Backed Value (Raw): ${backed}`)

        console.log(`Total Supply (Formatted): ${formatUnits(supply, decimals)}`)
        console.log(`Total Backed Value (Formatted): ${formatUnits(backed, decimals)}`)

        // Check for Decimal Mismatch Hypothesis
        // If backed value was added as 6 decimals (e.g. 500 * 10^6)
        // And decimals is 18.
        // Formatted Backed Value will be tiny.

        const backedAs6 = Number(backed) / 1e6
        console.log(`Total Backed Value (Assuming 6 Decimals input): ${backedAs6.toLocaleString()}`)

    } catch (err) {
        console.error("Error:", err)
    }
}

main()
