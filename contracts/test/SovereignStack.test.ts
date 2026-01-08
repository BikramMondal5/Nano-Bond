import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Sovereign DPI Stack", function () {
    async function deployStackFixture() {
        const [admin, citizen, treasury, stranger] = await ethers.getSigners();

        // 1. Mock USDT
        const MockToken = await ethers.getContractFactory("MockUSDT");
        const usdt = await MockToken.deploy();

        // 2. Identity Registry
        const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
        const registry = await IdentityRegistry.deploy(admin.address);

        // 3. Sovereign Bond
        const SovereignBond = await ethers.getContractFactory("SovereignBond");
        const bond = await SovereignBond.deploy("Sovereign Bond", "SOV", await registry.getAddress(), admin.address);

        // 4. Treasury Swap
        const TreasurySwap = await ethers.getContractFactory("TreasurySwap");
        const treasurySwap = await TreasurySwap.deploy(await usdt.getAddress(), await bond.getAddress(), admin.address);
        // Grant Minter Role to TreasurySwap
        await bond.grantRole(await bond.MINTER_ROLE(), await treasurySwap.getAddress());

        // 5. Mock Router
        const MockRouter = await ethers.getContractFactory("MockRouter");
        const router = await MockRouter.deploy(await usdt.getAddress());

        // 6. Swap Gateway
        const SwapGateway = await ethers.getContractFactory("SwapGateway");
        // Pass usdt for wmnt just placeholder
        const gateway = await SwapGateway.deploy(
            await treasurySwap.getAddress(),
            await usdt.getAddress(),
            await router.getAddress(),
            await usdt.getAddress()
        );

        // 7. Coupon Distributor
        const CouponDistributor = await ethers.getContractFactory("CouponDistributor");
        const distributor = await CouponDistributor.deploy(await usdt.getAddress(), await bond.getAddress(), admin.address);

        // Register Citizen
        const citizenID = ethers.keccak256(ethers.toUtf8Bytes("IND-123"));
        await registry.register(citizen.address, citizenID);

        // Add Asset Backing (NEW)
        // Backing 2000 USDT worth of Bonds
        await bond.addAsset("ipfs://treasury-bill-001.pdf", 2000);

        return { usdt, registry, bond, treasurySwap, router, gateway, distributor, admin, citizen, stranger };
    }

    it("Should enforce Identity Compliance on transfers", async function () {
        const { bond, registry, admin, citizen, stranger } = await loadFixture(deployStackFixture);

        // Admin mints to Citizen (Verified) -> Success
        await bond.mint(citizen.address, 100);
        expect(await bond.balanceOf(citizen.address)).to.equal(100);

        // Test Asset Cap Exceeded
        // Try to mint 3000 -> Should fail (Available 1900, Total 2000)
        await expect(
            bond.mint(citizen.address, 3000)
        ).to.be.revertedWithCustomError(bond, "ExceedsBackedLogic");

        // Admin tries to mint to Stranger (Unverified) -> Fail
        await expect(
            bond.mint(stranger.address, 100)
        ).to.be.revertedWithCustomError(bond, "NotVerified");

        // Citizen tries to transfer to Stranger -> Fail
        await expect(
            bond.connect(citizen).transfer(stranger.address, 50)
        ).to.be.revertedWithCustomError(bond, "NotVerified");
    });

    it("Should allow Atomic Buy via TreasurySwap", async function () {
        const { usdt, treasurySwap, bond, citizen } = await loadFixture(deployStackFixture);

        // Give Citizen USDT
        await usdt.mint(citizen.address, 1000);
        await usdt.connect(citizen).approve(await treasurySwap.getAddress(), 1000);

        // Buy Bond
        await treasurySwap.connect(citizen).buy(1000);

        // Check Balances
        expect(await bond.balanceOf(citizen.address)).to.equal(1000);
        expect(await usdt.balanceOf(await treasurySwap.getAddress())).to.equal(1000);
    });

    it("Should execute Swap Gateway (Native -> Bond)", async function () {
        const { gateway, bond, citizen } = await loadFixture(deployStackFixture);

        // Send 500 Wei MNT -> Gateway
        // Gateway swaps to 500 Wei USDT -> Buys 500 Bonds -> Sends to Citizen
        await gateway.connect(citizen).buyBondWithNative({ value: 500 });

        expect(await bond.balanceOf(citizen.address)).to.equal(500);
    });

    it("Should distribute coupons via Push/Pull", async function () {
        const { usdt, bond, distributor, citizen, admin } = await loadFixture(deployStackFixture);

        // Mint bonds to citizen
        await bond.mint(citizen.address, 1000); // Supply = 1000

        // Admin deposits 100 USDT yield (10%)
        await usdt.mint(admin.address, 100);
        await usdt.connect(admin).approve(await distributor.getAddress(), 100);
        await distributor.depositYield(100);

        // Rate = 100 / 1000 = 0.1 per token (1e17 scaled)

        // Citizen claims
        await distributor.connect(citizen).claim();

        // Check Reward
        // 1000 tokens * 0.1 = 100 USDT
        expect(await usdt.balanceOf(citizen.address)).to.equal(100);
    });
});
