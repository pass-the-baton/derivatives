/* eslint-disable camelcase */
import { expect } from "chai";
import "ethereum-waffle";
import {
  PTBPFP__factory,
  PTBPFP,
  BatonMock,
  BatonMock__factory,
} from "../typechain";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { solidityKeccak256 } from "ethers/lib/utils";
import { BigNumber } from "ethers";

describe("Pass the baton Airdrops", function () {
  let deployer: SignerWithAddress;
  const signer = ethers.Wallet.createRandom();
  const signerKey = signer.privateKey;
  let minter: SignerWithAddress;
  let ptbPFP: PTBPFP;
  let batonMock: BatonMock;
  before(async () => {
    [deployer, minter] = await ethers.getSigners();
  });
  it("should deploy and set the deployer as its owner", async function () {
    batonMock = await new BatonMock__factory(deployer).deploy(
      "Baton Mock",
      "BTN"
    );
    ptbPFP = await new PTBPFP__factory(deployer).deploy(
      "Pass The Baton PFP",
      "PTBPFP",
      batonMock.address
    );
    await ptbPFP.setSigner(signer.address);
  });
  const batonId: BigNumber = BigNumber.from(1234);
  it("user create a donation tx", async function () {
    await batonMock.connect(minter).testMint(batonId);
    const receipt = await batonMock
      .connect(minter)
      .donate(batonId, { value: 1 });
    receipt.wait();
  });
  const uri = "ipfs://sampleuri";
  it("user sends the tx hash to the server and server creates and returns a signature for it", async function () {
    const h = solidityKeccak256(
      ["uint256", "address", "string"],
      [batonId, minter.address, uri]
    );
    const key = new ethers.utils.SigningKey(signerKey);
    const sig = ethers.utils.joinSignature(key.signDigest(h));
    await expect(ptbPFP.connect(minter).claim(batonId, uri, sig)).to.emit(
      ptbPFP,
      "Transfer"
    );
    await expect(
      ptbPFP.connect(minter).transferFrom(minter.address, deployer.address, 0)
    ).to.emit(ptbPFP, "Transfer");
  });
});
