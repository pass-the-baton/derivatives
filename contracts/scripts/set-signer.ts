// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import "@nomiclabs/hardhat-ethers";
import * as dotenv from "dotenv";
import { ethers } from "hardhat";
import prompts from "prompts";
// eslint-disable-next-line camelcase
import { IBaton__factory, PTBPFP__factory } from "../typechain";
import { formatEther } from "@ethersproject/units";

dotenv.config();

async function main() {
  const response0 = await prompts({
    type: "text",
    name: "address",
    message: `Please enter the PFP address.`,
  });
  const response1 = await prompts({
    type: "text",
    name: "address",
    message: `Please enter the signer address.`,
  });
  const [deployer] = await ethers.getSigners();
  const pfp = PTBPFP__factory.connect(response0.address, deployer);
  await pfp.setSigner(response1.address)
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
