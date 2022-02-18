import React, { useCallback, useEffect, useState } from "react";
import { useEthers } from "@usedapp/core";
import { ethers, providers } from "ethers";
import { getAddress } from "ethers/lib/utils";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { PTBExclusiveDrop__factory, utils } from "contracts";
import data from "contracts/airdrops/0.json";
import "./App.css";

const walletconnect = new WalletConnectConnector({
  rpc: {
    1:
      process.env.WEB3_API ||
      "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY",
  },
  qrcode: true,
});

type AirdropData = {
  [key: string]: number;
};

const airdrapData = data as AirdropData;

const getContract = (lib: ethers.providers.Provider) => {
  const contract = PTBExclusiveDrop__factory.connect(
    process.env.CONTRACT_ADDRESS ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    lib
  );
  return contract;
};

const useContractData = (
  id: number,
  lib?: providers.Provider,
  account?: string
) => {
  // claimable amount
  const [claimableAmount, setClaimableAmount] = useState<number>();
  const updateClaimableAmount = useCallback(async () => {
    if (!lib || !account) {
      setClaimableAmount(undefined);
      return;
    }
    const eligibleAcc = Object.keys(airdrapData).find(
      (k) => getAddress(k) === account
    );
    if (!eligibleAcc) return 0;
    const assigned = airdrapData[eligibleAcc];
    const claimed = (await getContract(lib).claimed(id, account)).toNumber();
    const claimable = assigned - claimed;
    setClaimableAmount(claimable);
  }, [id, account, lib]);
  // claimable until
  const [claimableUntil, setClaimableUntil] = useState<Date>();
  const updateClaimableUntil = useCallback(async () => {
    if (!lib || !account) {
      setClaimableUntil(undefined);
      return;
    }
    const claimableUntil = (
      await getContract(lib).claimableUntil(id)
    ).toNumber();
    const d = new Date(claimableUntil * 1000);
    setClaimableUntil(d);
  }, [id, account, lib]);

  useEffect(() => {
    updateClaimableAmount();
    updateClaimableUntil();
    lib?.on("block", updateClaimableAmount);
    lib?.on("block", updateClaimableUntil);
    return () => {
      lib?.off("block", updateClaimableAmount);
      lib?.off("block", updateClaimableUntil);
    };
  }, [lib, updateClaimableAmount, updateClaimableUntil]);
  return [claimableAmount, claimableUntil];
};

const nftId = 0;

function Mint() {
  const { activateBrowserWallet, activate, library, account } = useEthers();
  const [claimableAmount, claimableUntil] = useContractData(
    nftId,
    library,
    account || undefined
  );
  const eligible =
    !!account &&
    Object.keys(airdrapData).find((k) => getAddress(k) === account);

  return (
    <div>
      {!library ? (
        <>
          <button onClick={() => activateBrowserWallet()}>Use metamask</button>
          <button onClick={() => activate(walletconnect)}>
            Use WalletConnect
          </button>
        </>
      ) : (
        <p>Connected: {account} </p>
      )}
      <p>Eligible: {eligible ? "true" : "false"}</p>
      <p>Mintable: {claimableAmount}</p>
      <p>Claimable until: {claimableUntil?.toString()}</p>
      <button
        disabled={!eligible}
        onClick={async () => {
          if (!library || !account) {
            alert("Connect wallet first");
            return;
          }
          const signer = library.getSigner();
          const contract = PTBExclusiveDrop__factory.connect(
            process.env.CONTRACT_ADDRESS ||
              "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            library
          );
          try {
            console.log("get proof");
            console.log(
              "leaves",
              Object.keys(airdrapData).map((key) => ({
                address: key,
                amount: airdrapData[key] as number,
              }))
            );
            console.log("account", account);
            // TODO: implement merkle proof here
            const proof = utils.merkleProof(
              Object.keys(airdrapData).map((key) => ({
                address: getAddress(key),
                amount: airdrapData[key] as number,
              })),
              account
            );
            console.log("proof is", proof);
            await contract.connect(signer).claim(nftId, 1, 1, proof);
          } catch (e) {
            const message = (e as any).message;
            alert(message);
          }
        }}
      >
        {eligible
          ? "Mint with a merkle proof"
          : "You're not eligible for the claim"}
      </button>
    </div>
  );
}

export default Mint;
