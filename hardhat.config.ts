import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();
import "hardhat-deploy";


const GANACHE_RPC_URL = process.env.GANACHE_RPC_URL || "https://something:1234";
const GANACHE_PRIVATE_KEY = process.env.GANACHE_PRIVATE_KEY || "0xkey";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.17" }, { version: "0.8.0" }],
  },
  defaultNetwork: "hardhat",
  networks: {
    ganache: {
      url: GANACHE_RPC_URL,
      accounts: [GANACHE_PRIVATE_KEY],
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337,
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
  },
  paths: {
    sources: "./src/contracts",
    tests: "./src/test",
    deploy: "./src/deploy",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
