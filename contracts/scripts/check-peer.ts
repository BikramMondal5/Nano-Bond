import hre from "hardhat";

const POLYGON_GATEWAY = "0x78c8Cb2aE4D57eC7b14b6296bf07E30aB62b48DD";
const MANTLE_EID = 40356;

async function main() {
    console.log("Checking Polygon Gateway peer configuration...");

    const gateway = await hre.ethers.getContractAt(
        "CrossChainInvestmentGateway",
        POLYGON_GATEWAY
    );

    // Check the configured peer
    const configuredPeer = await gateway.peers(MANTLE_EID);
    console.log(`Peer for EID ${MANTLE_EID}:`, configuredPeer);

    if (configuredPeer === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log("❌ No peer configured!");
    } else {
        // Extract address from bytes32
        const peerAddress = "0x" + configuredPeer.slice(-40);
        console.log("✅ Peer address:", peerAddress);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
