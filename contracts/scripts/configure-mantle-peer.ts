import hre from "hardhat";

// Gateway addresses
const MANTLE_GATEWAY = "0x1C1CFCfCB7f26ac36c1602EEefeDa1Ece5275d5d";
const POLYGON_GATEWAY = "0x78c8Cb2aE4D57eC7b14b6296bf07E30aB62b48DD";

// LayerZero Endpoint ID for Polygon Amoy
const POLYGON_EID = 40267;

async function main() {
    console.log("Configuring Mantle Gateway peer...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Using account:", deployer.address);

    const gateway = await hre.ethers.getContractAt(
        "CrossChainInvestmentGateway",
        MANTLE_GATEWAY
    );

    const polygonPeerBytes32 = hre.ethers.zeroPadValue(POLYGON_GATEWAY, 32);

    console.log(`Setting peer for EID ${POLYGON_EID}:`, POLYGON_GATEWAY);
    console.log("Peer bytes32:", polygonPeerBytes32);

    const tx = await gateway.setPeer(POLYGON_EID, polygonPeerBytes32);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("✅ Peer configured successfully!");

    const configuredPeer = await gateway.peers(POLYGON_EID);
    console.log("Configured peer:", configuredPeer);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
