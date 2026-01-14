export const SOVEREIGN_BOND = {
    address: "0x762E3159F2d7C3574BdF2DC8bBF16e9B41587A02" as `0x${string}`,
    abi: [
        {
            "inputs": [],
            "name": "name",
            "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "symbol",
            "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
            "stateMutability": "view",
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
            "inputs": [{ "internalType": "string", "name": "uri", "type": "string" }, { "internalType": "uint256", "name": "value", "type": "uint256" }],
            "name": "addAsset",
            "outputs": [],
            "stateMutability": "nonpayable",
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
            "name": "maturityDate",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
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
        },
        {
            "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "internalType": "address", "name": "account", "type": "address" }],
            "name": "hasRole",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "uint256", "name": "_newDate", "type": "uint256" }],
            "name": "setMaturityDate",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [{ "indexed": false, "internalType": "uint256", "name": "newDate", "type": "uint256" }],
            "name": "MaturityDateUpdated",
            "type": "event"
        }
    ] as const
}

export const COUPON_DISTRIBUTOR = {
    address: "0x956D938378484AbADf0873ca7bC94c0203e76584" as `0x${string}`,
    abi: [
        {
            "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
            "name": "depositYield",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "address", "name": "beneficiary", "type": "address" }],
            "name": "adminClaim",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
            "name": "fundReserve",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "uint256", "name": "ratePerToken", "type": "uint256" }],
            "name": "distribute",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "reserve",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
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
            "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
            "name": "claimableYield",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
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
        },
        {
            "inputs": [],
            "name": "paymentToken", // USDT
            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
            "stateMutability": "view",
            "type": "function"
        }
    ] as const
}

export const USDT = {
    address: "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1" as `0x${string}`,
    abi: [
        {
            "constant": true,
            "inputs": [{ "name": "_owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "balance", "type": "uint256" }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
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
        }
    ] as const
}

export const TREASURY_SWAP = {
    address: "0xF013e47AD7d8e0EdbB8e9D2A7d7c73a23AF88A11" as `0x${string}`,
    abi: [
        {
            "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
            "name": "buy",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "bondPrice",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "uint256", "name": "bondAmount", "type": "uint256" }
            ],
            "name": "redeem",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "seller", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "BondRedeemed",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
                { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
            ],
            "name": "BondPurchased",
            "type": "event"
        }
    ] as const
}

export const IDENTITY_REGISTRY_V2 = {
    address: "0x216eB267d21096cec82Ad40B9CD8Ce576213AbEc" as `0x${string}`,
    abi: [
        {
            "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
            "name": "isVerified",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "view",
            "type": "function"
        }
    ] as const
}

export const CROSS_CHAIN_GATEWAY = {
    // Mantle Sepolia (destination)
    mantleSepolia: "0x..." as `0x${string}`,
    // Source chains
    ethereumSepolia: "0x..." as `0x${string}`,
    arbitrumSepolia: "0x..." as `0x${string}`,
    lineaSepolia: "0x..." as `0x${string}`,
    polygonAmoy: "0x..." as `0x${string}`,
    scrollSepolia: "0x..." as `0x${string}`,
    abi: [
        {
            "inputs": [
                { "internalType": "uint256", "name": "amount", "type": "uint256" },
                { "internalType": "uint32", "name": "dstEid", "type": "uint32" },
                { "internalType": "bytes", "name": "extraOptions", "type": "bytes" }
            ],
            "name": "investCrossChain",
            "outputs": [{ "internalType": "bytes32", "name": "guid", "type": "bytes32" }],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "uint32", "name": "dstEid", "type": "uint32" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" },
                { "internalType": "bytes", "name": "extraOptions", "type": "bytes" }
            ],
            "name": "quoteCrossChainFee",
            "outputs": [
                { "internalType": "uint256", "name": "nativeFee", "type": "uint256" },
                { "internalType": "uint256", "name": "lzTokenFee", "type": "uint256" }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ] as const
}