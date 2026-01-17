import hre from "hardhat";
import { ethers } from "ethers";

const LZ_CHAIN_IDS = {
    mantleSepolia: 40356,
    ethereumSepolia: 40161,
    arbitrumSepolia: 40231,
    polygonAmoy: 40267,
    scrollSepolia: 40170,
};

async function main() {
    const networkName = hre.network.name;
    console.log(`Setting LayerZero peers on ${networkName}...`);

    // Replace with your deployed addresses
    const GATEWAY_ADDRESSES = {
        mantleSepolia: "0x94Ac61D48043E5A83A65118bBF3affEC53DB1621",
        ethereumSepolia: "0xb0974B8004FB2Eb1CC4A799F03DaA14647B1e0FE",
        arbitrumSepolia: "0xf76aFf559d71ECb8347fCe5Da9B88076fEE11F90",
        polygonAmoy: "0xc45aB8aDbb1e088A2BD8c6719d387AaA835Af722",
        scrollSepolia: "0x9C497178995f70d1A5cbf33225Fc0D8B15469F8a",
    };

    const gateway = await hre.ethers.getContractAt(
        "CrossChainInvestmentGateway",
        GATEWAY_ADDRESSES[networkName as keyof typeof GATEWAY_ADDRESSES]
    );

    // Set Mantle as trusted peer
    const mantleEid = LZ_CHAIN_IDS.mantleSepolia;
    const mantleGateway = GATEWAY_ADDRESSES.mantleSepolia;
    const peerBytes32 = ethers.zeroPadValue(mantleGateway, 32);

    console.log(`Setting peer: Mantle (${mantleEid}) -> ${mantleGateway}`);
    const tx = await gateway.setPeer(mantleEid, peerBytes32);
    await tx.wait();

    console.log("Peer set successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});