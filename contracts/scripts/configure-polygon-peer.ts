import hre from "hardhat";

// Gateway addresses
const POLYGON_GATEWAY = "0x78c8Cb2aE4D57eC7b14b6296bf07E30aB62b48DD";
const MANTLE_GATEWAY = "0x1C1CFCfCB7f26ac36c1602EEefeDa1Ece5275d5d"; // CrossChainInvestmentGateway on Mantle

// LayerZero Endpoint IDs
const MANTLE_EID = 40356;

async function main() {
    console.log("Configuring Polygon Gateway peer...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Using account:", deployer.address);

    // Connect to the Gateway
    const gateway = await hre.ethers.getContractAt(
        "CrossChainInvestmentGateway",
        POLYGON_GATEWAY
    );

    // Convert Mantle gateway address to bytes32 (LayerZero peer format)
    const mantlePeerBytes32 = hre.ethers.zeroPadValue(MANTLE_GATEWAY, 32);

    console.log(`Setting peer for EID ${MANTLE_EID}:`, MANTLE_GATEWAY);
    console.log("Peer bytes32:", mantlePeerBytes32);

    // Set the peer
    const tx = await gateway.setPeer(MANTLE_EID, mantlePeerBytes32);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("✅ Peer configured successfully!");

    // Verify
    const configuredPeer = await gateway.peers(MANTLE_EID);
    console.log("Configured peer:", configuredPeer);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
