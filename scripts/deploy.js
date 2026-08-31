const hre = require("hardhat");
const readline = require("readline");

const DEFAULT_RPC = "https://rpc.mainnet.chain.robinhood.com";

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    if (!hidden) {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    process.stdout.write(question);

    let input = "";

    const onData = (char) => {
      char = char.toString();

      if (char === "\n" || char === "\r" || char === "\u0004") {
        process.stdin.removeListener("data", onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();

        process.stdout.write("\n");
        rl.close();

        resolve(input.trim());
      } else if (char === "\u0003") {
        process.exit();
      } else if (char === "\u007f") {
        input = input.slice(0, -1);
      } else {
        input += char;
        process.stdout.write("*");
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

async function main() {
  console.log("");
  console.log("╔══════════════════════════════════════╗");
  console.log("║      BEEPERS SCANNER DEPLOYER        ║");
  console.log("║          ROBINHOOD CHAIN             ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("");

  const privateKeyInput = await ask(
    "Private key deployer: ",
    true
  );

  if (!privateKeyInput) {
    throw new Error("Private key tidak boleh kosong.");
  }

  const rpcInput = await ask(
    "RPC URL [Enter = Robinhood default]: "
  );

  const rpcUrl = rpcInput || DEFAULT_RPC;

  let privateKey = privateKeyInput;

  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  console.log("");
  console.log("Connecting...");
  console.log(`RPC: ${rpcUrl}`);

  const provider = new hre.ethers.JsonRpcProvider(rpcUrl);
  const wallet = new hre.ethers.Wallet(privateKey, provider);

  const network = await provider.getNetwork();
  const balance = await provider.getBalance(wallet.address);

  console.log("");
  console.log("✓ Connected");
  console.log(`✓ Chain ID: ${network.chainId}`);
  console.log(`✓ Deployer: ${wallet.address}`);
  console.log(
    `✓ ETH Balance: ${hre.ethers.formatEther(balance)}`
  );

  if (balance === 0n) {
    throw new Error(
      "Wallet tidak memiliki ETH untuk gas."
    );
  }

  console.log("");
  console.log("Deploying BEEPERS Scanner...");

  const ScannerFactory =
    await hre.ethers.getContractFactory(
      "BEEPERSScanner",
      wallet
    );

  const scanner = await ScannerFactory.deploy();

  console.log("Waiting for confirmation...");

  await scanner.waitForDeployment();

  const contractAddress = await scanner.getAddress();

  console.log("");
  console.log("╔══════════════════════════════════════╗");
  console.log("║           DEPLOY SUCCESS ✓           ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("");

  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Owner: ${wallet.address}`);
  console.log(
    "BEEPERS NFT: 0xaa4c702152894addf49e2644147d2b7ea389f8ad"
  );
  console.log(
    "NVDA Token: 0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC"
  );

  console.log("");
  console.log("IMPORTANT:");
  console.log(
    "Send NVDA tokens directly to the contract address to fund the pool."
  );
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("DEPLOY FAILED:");
  console.error(error.message || error);
  process.exitCode = 1;
});
