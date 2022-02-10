/* eslint-disable camelcase */
import { expect } from "chai";
// eslint-disable-next-line camelcase
import {
  PTBExclusiveDrop__factory,
  PTBExclusiveDrop,
  IERC20__factory,
} from "../typechain";
import hre, { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { merkleProof, merkleRoot } from "../utils/merkle-tree";
import { parseEther } from "ethers/lib/utils";

describe("Pass the baton Airdrops", function () {
  let deployer: SignerWithAddress;
  let ptbDrops: PTBExclusiveDrop;
  let airdrop: string[];
  const VRF_KEY_HASH =
    "0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445";
  const VRF_FEE = parseEther("2");
  const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
  const MAX_SUPPLY = 500;
  const VRF_COORDINATOR = "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952";
  const MASK_URI = "ipfs://maskimg";
  const BASE_URI = "ipfs://sampledir/";
  let claimableUntil: number;
  let mintableUntil: number;
  before(async () => {
    const [, minter1, minter2, minter3, minter4, minter5] =
      await ethers.getSigners();
    airdrop = [
      minter1.address,
      minter2.address,
      minter3.address,
      minter4.address,
      minter5.address,
    ];
    const block = await ethers.provider.getBlock("latest");
    claimableUntil = block.timestamp + 86400 * 5;
    mintableUntil = block.timestamp + 86400 * 7;
  });
  it("should deploy and set the deployer as its owner", async function () {
    [deployer] = await ethers.getSigners();
    ptbDrops = await new PTBExclusiveDrop__factory(deployer).deploy(
      "name",
      "symbol",
      MASK_URI,
      merkleRoot(airdrop),
      MAX_SUPPLY,
      VRF_COORDINATOR,
      VRF_KEY_HASH,
      VRF_FEE,
      LINK,
      claimableUntil,
      mintableUntil
    );
    await ptbDrops.deployed();
    expect(await ptbDrops.owner()).to.eq(deployer.address);
  });
  it("should return the contract uri once it's updated", async function () {
    await ptbDrops.updateContractURI(
      "QmccMNSQ5V9dsAip6szYaSYpfaqLXpivWq3FzHBQJS5dq8"
    );
    expect(await ptbDrops.contractURI()).to.equal(
      "QmccMNSQ5V9dsAip6szYaSYpfaqLXpivWq3FzHBQJS5dq8"
    );
  });
  it("should mint nfts with merkle proofs", async function () {
    const [, minter1, minter2, minter3, minter4, minter5] =
      await ethers.getSigners();
    const testMint = async (minter: SignerWithAddress) => {
      await expect(
        ptbDrops.connect(minter).claim(merkleProof(airdrop, minter.address))
      ).to.emit(ptbDrops, "Transfer");
    };
    await testMint(minter1);
    await testMint(minter2);
    await testMint(minter3);
    await testMint(minter4);
    await testMint(minter5);
    expect(await ptbDrops.totalSupply()).to.eq(5);
  });
  it("should impersonate an LINK holding account and send a test LINK", async function () {
    const linkHolderAddress = "0x0d4f1ff895d12c34994d6b65fabbeefdc1a9fb39";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [linkHolderAddress],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [linkHolderAddress],
    });
    const linkHolder = await ethers.getSigner(linkHolderAddress);
    const link = IERC20__factory.connect(
      "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      ethers.provider
    );
    await link
      .connect(linkHolder)
      .transfer(ptbDrops.address, parseEther("2.1"));
    expect(await link.balanceOf(ptbDrops.address)).to.eq(parseEther("2.1"));
  });
  it("should prepare reveal", async function () {
    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [mintableUntil + 1],
    });
    const [deployer] = await ethers.getSigners();
    await ptbDrops.connect(deployer).prepReveal(BASE_URI);
  });
  it("should reveal & set the randomness", async function () {
    const [deployer] = await ethers.getSigners();
    await ptbDrops.connect(deployer).reveal();
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [VRF_COORDINATOR],
    });
    await hre.network.provider.request({
      method: "hardhat_setBalance",
      params: [VRF_COORDINATOR, "0x100000000000000000"],
    });
    const vrfCoordinator = await ethers.getSigner(VRF_COORDINATOR);
    await ptbDrops
      .connect(vrfCoordinator)
      .rawFulfillRandomness(await ptbDrops.vrfReqId(), 3);
    expect(await ptbDrops.randomness()).to.eq(3);
    expect(await ptbDrops.tokenURI(0)).to.eq(BASE_URI + 3);
    expect(await ptbDrops.tokenURI(1)).to.eq(BASE_URI + 4);
    expect(await ptbDrops.tokenURI(2)).to.eq(BASE_URI + 0);
    expect(await ptbDrops.tokenURI(3)).to.eq(BASE_URI + 1);
    expect(await ptbDrops.tokenURI(4)).to.eq(BASE_URI + 2);
  });
});
