⚙️ Basic Setup

    Note: Perform the following steps in your home directory, not the project directory.

1. Install nvm (Node Version Manager)

   curl -o- <https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh> | bash
   source ~/.nvm/nvm.sh

2. Install and Use Node.js v16

   nvm install 16
   nvm use 16

3. Install yarn

   npm install -g yarn

4. Install Project Dependencies

Navigate to your project directory and run:

    yarn install

5. Install Rust and Cargo

   curl <https://sh.rustup.rs> -sSf | sh
   source $HOME/.cargo/env

6. Build and Install circom

   git clone <https://github.com/iden3/circom.git>
   cd circom
   cargo build --release
   cargo install --path circom

🧩 System Players

    Issuer: Owner of the contract, authorized to issue credentials.

    User (Prover): Holds a credential and can generate ZK proofs.

    User (Verifier): Verifies those ZK proofs on-chain or off-chain.

🧠 Application Overview

The system includes:

    Frontend: Built with Next.js.

    Smart Contracts:

        CredentialsDB.sol: Stores encrypted credentials and a Merkle Tree of their hashes.

        Verifier.sol: Auto-generated from a circom circuit using snarkjs.

    ZK Tools: Built using circom, snarkjs, and zk-kit.

Contracts

    CredentialsDB.sol

        Publicly stores encrypted credentials (encrypted with user’s public key).

        Contains a Merkle Tree representing the set of issued credentials.

    Verifier.sol

        Generated from the circuit:
        circuits/zkVerifiableCredentialsDBCore.circom

🚀 How to Deploy

1. Define the Credential Schema

Modify the file:

    credentials-src/examplecredentialschema.json

This JSON defines the structure of claims for a credential set. 2. Update the Circuit Parameters

Edit:

    circuits/zkVerifiableCredentialsDBCore.circom

Set:

    depth → Depth of the Merkle Tree (e.g. depth = 16 for 2^16 credentials)

    claimsN → Number of claims per credential (match the schema JSON)

3. Sync Solidity Contract

Update TREE_DEPTH in CredentialsDB.sol to match the depth used in the circuit. 4. Compile the Circuit

Use:

    yarn compilecircuit

Or:

    bash scripts/compile-circuit.sh

    Modify this script to select the appropriate ptau file based on circuit constraints:
    Check available ptau files

5. Bump Solidity Verifier

   yarn bumpsolidityverifier

# or

node scripts/compile-circuit.sh

6. Deploy Smart Contracts

Use:

    yarn deploysepolia

To deploy on Hardhat local network.
To use a custom network, configure it in hardhat.config.ts and run:

    npx hardhat run --network <network-name> scripts/deploy.ts

7. Run the Frontend

   yarn run dev

📚 Resources

    🔧 Compiling Circuits

    🧪 ZK Proof Example

    🧾 Witness Generation
