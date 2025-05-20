import type { NextPage } from "next";
import React from "react";
import { useState } from "react";
import Head from "next/head";
import { Contract, ethers, Signer } from "ethers";
import styles from "../styles/Home.module.css";
import { Web3Provider } from "@ethersproject/providers";
import CREDENTIAL_DB_ARTIFACT from "../artifacts/contracts/CredentialsDB.sol/CredentialsDB.json";
import Issuer from "./components/issuer";
import UserProof from "./components/userproof";
import UserVerify from "./components/userverify";

const Home: NextPage = () => {
  const CREDENTIALS_DB_ADDRESS = "0xDA7411b67b4f020928818f81E27366F62f4D7522";

  const [walletAddress, setWalletAddress] = useState("");
  const [walletPublicKey, setWalletPublicKey] = useState("");
  const [provider, setProvider] = useState<Web3Provider | undefined>(undefined);
  const [signer, setSigner] = useState<Signer | undefined>(undefined);
  const [credentialsDB, setCredentialsDB] = useState<Contract | undefined>(
    undefined
  );
  const [isIssuer, setIsIssuer] = useState(false);
  const [walletCon, setWalletCon] = useState(false);
  const [userSelection, setUserSelection] = useState("default");

  async function requestAccount() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request!({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
      } catch (e) {
        console.log(e);
      }
    } else {
      console.log("metamask not found");
    }
  }

  async function connectAccount() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();
      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      await setProvider(provider);
      const signer = await provider.getSigner();
      console.log("52", signer);

      await setSigner(signer);
      if (provider) {
        const abi = new ethers.utils.Interface(CREDENTIAL_DB_ARTIFACT.abi);
        console.log(abi);
        const creDB = new ethers.Contract(CREDENTIALS_DB_ADDRESS, abi, signer);
        await setCredentialsDB(creDB);

        console.log(creDB);

        const owner = await creDB.owner();
        const sigAdd = await signer.getAddress();
        console.log(owner);
        console.log(sigAdd);

        if (owner == sigAdd) {
          setIsIssuer(true);
        }
        setWalletCon(true);
      }
    }
  }

  async function getPubKeyFromMM(walletAddress: string) {
    if (window.ethereum) {
      const keyB64 = (await window.ethereum.request!({
        method: "eth_getEncryptionPublicKey",
        params: [walletAddress],
      })) as string;
      return keyB64;
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>ZK Verifiable credentials App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className={styles.header}>
        <img src="college-logo.jpeg" width={55} />
        <h3>Authentication System</h3>
        <div>
          {walletAddress == "" ? (
            <button className={styles.btn} onClick={() => connectAccount()}>
              {" "}
              <div>Connect Wallet</div>
            </button>
          ) : (
            <div className={styles.conButtonAddress}>
              {walletAddress.slice(0, 7) + "..." + walletAddress.slice(-4)}
            </div>
          )}
        </div>
      </header>
      {walletCon ? (
        <main className={styles.main}>
          {isIssuer ? (
            <Issuer
              walletAddress={walletAddress}
              credentialsDB={credentialsDB}
            ></Issuer>
          ) : (
            <div>
              {
                {
                  proove: (
                    <UserProof
                      walletAddress={walletAddress}
                      credentialsDB={credentialsDB}
                    ></UserProof>
                  ),
                  verify: (
                    <UserVerify
                      walletAddress={walletAddress}
                      credentialsDB={credentialsDB}
                      signer={signer}
                    ></UserVerify>
                  ),
                  getPubAdd: (
                    <div>
                      <h4>Your public key: {walletPublicKey}</h4>
                    </div>
                  ),
                  default: (
                    <div className={styles.main}>
                      <h1>What you want to do?</h1>
                      <div>
                        <button
                          className={styles.btn}
                          onClick={() => {
                            setUserSelection("proove");
                          }}
                        >
                          Prove your credential
                        </button>
                        <button
                          className={styles.btn}
                          onClick={() => {
                            setUserSelection("verify");
                          }}
                        >
                          Verify a proof
                        </button>
                        <button
                          className={styles.btn}
                          onClick={async () => {
                            setUserSelection("getPubAdd");
                            const pubKey = await getPubKeyFromMM(walletAddress);
                            if (pubKey) {
                              setWalletPublicKey(pubKey);
                            }
                          }}
                        >
                          Get your public key
                        </button>
                      </div>
                    </div>
                  ),
                }[userSelection]
              }
            </div>
          )}
        </main>
      ) : (
        <main className={styles.main}>
          <h1>Connect your wallet first</h1>
          <p>Your type of account will be automatically detected</p>
        </main>
      )}
    </div>
  );
};

export default Home;
