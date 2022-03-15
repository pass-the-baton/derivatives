// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import prompts from "prompts";
// eslint-disable-next-line camelcase
import { PTBPFP__factory } from "../typechain";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploy");
  const res = await prompts({
    type: "text",
    name: "contract",
    message: `Please enter the Baton contract address.`,
  });
  const batonAddress = res.contract;
  const ptbPFP = await new PTBPFP__factory(deployer).deploy(
    "Pass The Baton PFP",
    "BPFP",
    batonAddress
  );
  await ptbPFP.deployed();
  console.log("BPFP deployed to:", ptbPFP.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
