const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { ethers } = require("ethers");

const DEFAULT_RPC = "https://rpc.mainnet.chain.robinhood.com";

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("");
  console.log("╔══════════════════════════════════════╗");
  console.log("║      BEEPERS SCANNER DEPLOYER        ║");
  console.log("║          ROBINHOOD CHAIN             ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("");

  let privateKey = await ask("Private key deployer: ");

  if (!privateKey) {
    throw new Error("Private key tidak boleh kosong.");
  }

  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  const customRpc = await ask(
    "RPC URL [Enter = Robinhood default]: "
  );

  const rpcUrl = customRpc || DEFAULT_RPC;

  console.log("");
  console.log("Connecting to Robinhood Chain...");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const network = await provider.getNetwork();

  if (network.chainId !== 4663n) {
    throw new Error(
      `Wrong network. Expected Robinhood Chain (4663), got ${network.chainId}`
    );
  }

  const balance = await provider.getBalance(wallet.address);

  console.log(`✓ Deployer: ${wallet.address}`);
  console.log(`✓ Chain ID: ${network.chainId}`);
  console.log(
    `✓ Gas Balance: ${ethers.formatEther(balance)} ETH`
  );

  if (balance === 0n) {
    throw new Error("Wallet tidak memiliki ETH untuk gas.");
  }

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "BEEPERSScanner.sol",
    "BEEPERSScanner.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      "Contract artifact tidak ditemukan. Jalankan compile terlebih dahulu."
    );
  }

  const artifact = JSON.parse(
    fs.readFileSync(artifactPath, "utf8")
  );

  console.log("");
  console.log("Deploying BEEPERS Scanner...");

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const contract = await factory.deploy();

  console.log(`Transaction: ${contract.deploymentTransaction().hash}`);
  console.log("Waiting for confirmation...");

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("");
  console.log("════════════════════════════════════════");
  console.log("           DEPLOY SUCCESS ✓");
  console.log("════════════════════════════════════════");
  console.log("");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Owner:    ${wallet.address}`);
  console.log("");
  console.log("BEEPERS NFT:");
  console.log("0xaa4c702152894addf49e2644147d2b7ea389f8ad");
  console.log("");
  console.log("NVDA TOKEN:");
  console.log("0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC");
  console.log("");
  console.log("Pool funding:");
  console.log("Send NVDA directly to the contract address.");
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("DEPLOY FAILED:");
  console.error(error.shortMessage || error.message || error);
  process.exit(1);
});
