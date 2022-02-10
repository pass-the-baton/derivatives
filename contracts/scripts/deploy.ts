// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
// eslint-disable-next-line camelcase
import { PTBExclusiveDrop__factory } from "../typechain";
import { merkleRoot } from "../utils/merkle-tree";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploy");
  const VRF_KEY_HASH =
    "0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445";
  const VRF_FEE = parseEther("2");
  const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CAsdf";
  const MAX_SUPPLY = 500;
  const VRF_COORDINATOR = "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952";
  const MASK_URI = "ipfs://maskimg";
  const beneficiary = [];
  let claimableUntil: number;
  let mintableUntil: number;
  const ptbDrops = await new PTBExclusiveDrop__factory(deployer).deploy(
    "name",
    "symbol",
    MASK_URI,
    merkleRoot(beneficiary),
    MAX_SUPPLY,
    VRF_COORDINATOR,
    VRF_KEY_HASH,
    VRF_FEE,
    LINK,
    claimableUntil,
    mintableUntil
  );
  await ptbDrops.deployed();

  console.log("PassTheBaton Drops deployed to:", ptbDrops.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
