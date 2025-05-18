import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";

const HARMONY_PRIVATE_KEY =
  "0d065b1a5dc3f5e336f20b51e7c0cca40bcffe17b64d9e01a0fa0a2188d1904a"; //Example Harmony Devnet privkey
const SEPOLIA_PK =
  "566dc65ca94cc3e69bf6a0170be2f94752dace6c724b4050bdcdcddc3f8c948c";
const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    harmonydevnet: {
      url: `https://api.s0.ps.hmny.io`,
      accounts: [`0x${HARMONY_PRIVATE_KEY}`],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/Dp3-dMBc1XWm2veRNbRiTFw-dUddq1c7`,
      accounts: [`0x${SEPOLIA_PK}`],
    },
  },
};

export default config;
