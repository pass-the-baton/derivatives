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
import { IBaton__factory } from "../typechain";
import { formatEther } from "@ethersproject/units";

dotenv.config();

async function main() {
  const response0 = await prompts({
    type: "text",
    name: "address",
    message: `Please enter the Baton contract address.`,
  });
  const response1 = await prompts({
    type: "text",
    name: "value",
    message: `Please enter the Donor's address`,
  });
  const baton = IBaton__factory.connect(response0.address, ethers.provider);
  const filterResult = await baton.queryFilter(
    baton.filters.Donated(undefined, response1.value)
  );
  for (const event of filterResult) {
    console.log("Found Donated()");
    console.log("Token id", event.args.tokenId);
    console.log("Donor", event.args.donor);
    console.log("Amount", formatEther(event.args.amount), "ETH");
    console.log("Tx Hash", event.transactionHash);
  }
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
