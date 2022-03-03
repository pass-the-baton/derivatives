/* eslint-disable camelcase */
import { expect } from "chai";
// eslint-disable-next-line camelcase
import {
  PTBPFP__factory,
  PTBPFP,
  BatonMock,
  BatonMock__factory,
} from "../typechain";
import hre, { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { AirdropLeaf, merkleProof, merkleRoot } from "../utils/merkle-tree";
import { parseEther, solidityKeccak256 } from "ethers/lib/utils";

describe("Pass the baton Airdrops", function () {
  let deployer: SignerWithAddress;
  const signer = ethers.Wallet.createRandom()
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
    await ptbPFP.setSigner(signer.address)
  });
  let donationTxHash: string;
  it("user create a donation tx", async function () {
    await batonMock.connect(minter).testMint();
    const receipt = await batonMock.connect(minter).donate(0, { value: 1 });
    receipt.wait();
    donationTxHash = receipt.hash;
  });
  const uri = "ipfs://sampleuri";
  it("user sends the tx hash to the server and server creates and returns a signature for it", async function () {
    const h = solidityKeccak256(
      ["bytes32", "address", "string"],
      [donationTxHash, minter.address, uri]
    );
    const key = new ethers.utils.SigningKey(signerKey)
    const sig = ethers.utils.joinSignature(key.signDigest(h))
    await expect(
      ptbPFP.connect(minter).claim(donationTxHash, uri, sig)
    ).to.emit(ptbPFP, "Transfer");
  });
});
