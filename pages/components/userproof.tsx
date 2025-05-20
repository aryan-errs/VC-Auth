import React, { Component, useState } from "react";
import styles from "../../styles/Home.module.css";
import { Contract, ethers, Signer } from "ethers";
import { poseidon } from "circomlibjs";
import { IncrementalMerkleTree } from "@zk-kit/incremental-merkle-tree";
const groth16 = require("snarkjs").groth16;

async function downloadEncryptedCredentialFromContract(
  index: number,
  contract: Contract | undefined
) {
  if (contract) {
    const encCredential = await contract.viewArray(index);
    return encCredential;
  }
}

function ascii_to_hex(str: string) {
  var arr1 = ["0x"];
  for (var n = 0, l = str.length; n < l; n++) {
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join("");
}

async function decryptionWithMM(walletAddress: string, encCredential: string) {
  if (window.ethereum) {
    const dataHexLike = `0x${Buffer.from(encCredential, "utf-8").toString(
      "hex"
    )}`;

    const decrypt = await window.ethereum.request!({
      method: "eth_decrypt",
      params: [dataHexLike, walletAddress],
    });
    return decrypt;
  }
}

async function readSchemaClaims(contract: Contract | undefined) {
  if (contract) {
    const readCredentialsSchema = await contract.credentialsSchema();
    const readCredentialsSchemaJSON = JSON.parse(readCredentialsSchema);
    const claimsArray = readCredentialsSchemaJSON.schema_json.claims;

    return claimsArray;
  }
}

async function generateMerkleProof(
  contract: Contract | undefined,
  credentialNumber: number
) {
  if (contract) {
    const depth = await contract.TREE_DEPTH();
    const leavesArray = await contract.getLeavesArray();

    const tree = new IncrementalMerkleTree(poseidon, depth, BigInt(0), 2);
    leavesArray.forEach((element: ethers.BigNumber) => {
      tree.insert(element.toBigInt());
    });

    const proof = tree.createProof(credentialNumber - 1);

    return proof;
  }
}

async function generateZKProof(
  credentialJSON: { claims: { [x: string]: string } },
  claimsArray: [string] | undefined,
  merkleProof: any,
  disclosureVector: [number]
) {
  const ethAddress = credentialJSON.claims.ethAddress;
  let convertedArrayHex: string[] = [];
  if (claimsArray) {
    for (let i in claimsArray) {
      if (claimsArray[i] !== "ethAddress") {
        convertedArrayHex.push(
          ascii_to_hex(credentialJSON.claims[claimsArray[i]])
        );
      } else {
        convertedArrayHex.push(credentialJSON.claims[claimsArray[i]]);
      }
    }
  }
  var siblings = merkleProof.siblings.map((val: any) => {
    var value = ethers.BigNumber.from(val[0]);
    return value.toHexString();
  });

  var root: any = ethers.BigNumber.from(merkleProof.root);
  root = root.toHexString();

  const inputs = {
    ClaimsVals: convertedArrayHex,
    MerkleProofSiblings: siblings,
    MerkleProofPathIndices: merkleProof.pathIndices,
    MerkleProofRoot: root,
    EthAddress: ethAddress,
    DisclosureVector: disclosureVector,
  };

  const { proof, publicSignals } = await groth16.fullProve(
    inputs,
    "zkVerifiableCredentialsDBCore.wasm",
    "circuit_final.zkey"
  );

  return { proof, publicSignals };
}

export default class UserProof extends Component<
  {
    credentialsDB: Contract | undefined;
    walletAddress: string;
  },
  {
    credentialNumber: number;
    claimsArray: [string] | undefined;
    credentialJSON: { claims: { [x: string]: string } };
    disclosureVector: [number];
    proof: any;
  }
> {
  render() {
    return (
      <div className={styles.issuerContainer}>
        <h2>Recover your credential</h2>
        <h4>Hint: use your credential number to recover your data.</h4>
        <div className={styles.credNumberIn}>
          <input
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const val = Number.parseInt(event.target.value);
              this.setState((state) => ({ credentialNumber: val }));
            }}
          />
        </div>
        <button
          className={styles.btn}
          onClick={async () => {
            const claimsArray = await readSchemaClaims(
              this.props.credentialsDB
            );
            const enc = await downloadEncryptedCredentialFromContract(
              this.state.credentialNumber - 1,
              this.props.credentialsDB
            );
            const credential = await decryptionWithMM(
              this.props.walletAddress,
              enc
            );
            const credentialJSON = JSON.parse(credential);
            // @ts-ignore
            const disclosureVector = claimsArray.map((x) => 0);

            this.setState((state) => ({
              claimsArray: claimsArray,
              credentialJSON: credentialJSON,
              disclosureVector: disclosureVector,
            }));
          }}
        >
          Recover
        </button>

        {this.state && this.state.credentialJSON && this.state.claimsArray ? (
          <div className={styles.issuerContainer}>
            <h3>Recovered credential</h3>
            <ul>
              {this.state.claimsArray.map((claimNames) => {
                return (
                  <li key={claimNames}>
                    {claimNames} ={" "}
                    {this.state.credentialJSON.claims[claimNames]}
                  </li>
                );
              })}
            </ul>
            <h3>Selective disclosure selection</h3>
            {this.state.claimsArray.map((claimNames, index) => {
              return (
                <div key={claimNames} className={styles.credNumberIn}>
                  <p>{claimNames}</p>{" "}
                  <input
                    type="checkbox"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      let newDisclosureVector = this.state.disclosureVector;
                      newDisclosureVector[index] = event.target.checked ? 1 : 0;
                      this.setState((state) => ({
                        disclosureVector: newDisclosureVector,
                      }));
                    }}
                  />
                </div>
              );
            })}
            <button
              onClick={async () => {
                const merkleProof = await generateMerkleProof(
                  this.props.credentialsDB,
                  this.state.credentialNumber
                );
                const { proof, publicSignals } = await generateZKProof(
                  this.state.credentialJSON,
                  this.state.claimsArray,
                  merkleProof,
                  this.state.disclosureVector
                );

                const proofPack = {
                  proof: proof,
                  publicSignals: publicSignals,
                };

                this.setState((state) => ({
                  proof: JSON.stringify(proofPack),
                }));
              }}
            >
              Generate proof
            </button>
          </div>
        ) : (
          <div></div>
        )}
        <div>
          {this.state && this.state.proof ? (
            <div>
              <textarea rows={15} cols={100}>
                {this.state.proof}
              </textarea>{" "}
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    );
  }
}
