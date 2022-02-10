import { hexZeroPad } from "ethers/lib/utils";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

export const leaf = (address: string) => hexZeroPad(address, 32);

export const merkleRoot = (addresses: string[]) => {
  const merkleTree = new MerkleTree(
    addresses.map((address) => leaf(address)),
    keccak256,
    { sort: true }
  );
  const merkleRoot = merkleTree.getHexRoot();
  return merkleRoot;
};

export const merkleProof = (addresses: string[], address: string) => {
  const merkleTree = new MerkleTree(
    addresses.map((address) => leaf(address)),
    keccak256,
    { sort: true }
  );
  const index = addresses.findIndex((l) => l === address);
  if (index < 0) throw Error(`Failed to create the merkle proof`);
  const proof = merkleTree.getHexProof(leaf(addresses[index]));
  return proof;
};
