export const SOVEREIGN_BOND = {
    address: process.env.NEXT_PUBLIC_SOVEREIGN_BOND_ADDRESS as `0x${string}`,
    abi: [
        {
            "inputs": [
                { "internalType": "string", "name": "uri", "type": "string" },
                { "internalType": "uint256", "name": "value", "type": "uint256" }
            ],
            "name": "addAsset",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "totalBackedValue",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "MINTER_ROLE",
            "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "bytes32", "name": "role", "type": "bytes32" },
                { "internalType": "address", "name": "account", "type": "address" }
            ],
            "name": "hasRole",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
                { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
            ],
            "name": "Transfer",
            "type": "event"
        }
    ] as const
}

export const COUPON_DISTRIBUTOR = {
    // Assuming address will be added later or is same as bond for now if proxied, 
    // but likely separate. For now using placeholder or env.
    address: process.env.NEXT_PUBLIC_COUPON_DISTRIBUTOR_ADDRESS as `0x${string}`,
    abi: [
        {
            "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
            "name": "depositYield",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "claim",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "cumulativeYieldPerToken",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "name": "userPaidPerToken",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        }
    ] as const
}

export const USDT = {
    address: "0xCED8c1aE948C3800C0074501ED1DAae6268552D7" as `0x${string}`,
    abi: [
        {
            "constant": false,
            "inputs": [
                { "name": "_spender", "type": "address" },
                { "name": "_value", "type": "uint256" }
            ],
            "name": "approve",
            "outputs": [{ "name": "", "type": "bool" }],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                { "name": "_owner", "type": "address" },
                { "name": "_spender", "type": "address" }
            ],
            "name": "allowance",
            "outputs": [{ "name": "", "type": "uint256" }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [{ "name": "_owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ] as const
}

export const TREASURY_SWAP = {
    address: "0x614fA7240eEE05bC9F538e92846F4FB4054A3855" as `0x${string}`,
    abi: [
        {
            "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
            "name": "buy",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "uint256", "name": "amount", "type": "uint256" },
                { "internalType": "address", "name": "beneficiary", "type": "address" }
            ],
            "name": "buyFor",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "bond",
            "outputs": [{ "internalType": "contract ISovereignBond", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "BondPurchased",
            "type": "event"
        }
    ] as const
}
