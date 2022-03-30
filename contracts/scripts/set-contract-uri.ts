// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import "@nomiclabs/hardhat-ethers";
import * as dotenv from "dotenv";
import { ethers } from "hardhat";
import prompts from "prompts";
import fs from "fs";
import * as IPFS from "ipfs-core";
// eslint-disable-next-line camelcase
import { PTBExclusiveDrop__factory } from "../typechain";

dotenv.config();

async function main() {
  const [account] = await ethers.getSigners();
  console.log("Deployer address: ", account.address);
  if (!account) {
    throw Error("Please configure PRIVATE_KEY at the .env file.");
  }
  const response0 = await prompts({
    type: "text",
    name: "contract",
    message: `Please enter the Airdrop contract address. You can configure AIRDROP_CONTRACT at the .env file.`,
    initial: process.env.AIRDROP_CONTRACT,
  });
  const address = response0.contract as string;
  if (!ethers.utils.isAddress(address)) {
    throw Error("Invalid contract address");
  }
  const nft = new PTBExclusiveDrop__factory(account).attach(address);
  const metadata = fs.readFileSync(`./metadata/contract.json`);
  const ipfs = await IPFS.create();
  const result = await ipfs.add(metadata);
  console.log("Metadata IPFS Hash:", result.path);
  console.log("Metadata:");
  console.log(metadata.toString());
  console.log(`Make sure that ${result.path} is pinned.`);
  await ipfs.stop();
  const tx = await nft.updateContractURI(`ipfs://${result.path}`);
  console.log("Submitted a transaction: ", tx.hash);
  await tx.wait();
  console.log("Tx is confirmed.");
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});