require("dotenv").config();
const axios = require("axios");
const {
  Aptos,
  AptosConfig,
  Network,
  Account,
  U64,
  Ed25519PrivateKey,
} = require("@aptos-labs/ts-sdk");

const FRIDGE_API_URL = "http://localhost:3000/api/dispense/soda";
const APTOS_CONFIG = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(APTOS_CONFIG);
const privateKey = process.env.BUYER_PRIVATE_KEY;

if (!privateKey) throw new Error("BUYER_PRIVATE_KEY is not set in .env file.");
const privateKeyObj = new Ed25519PrivateKey(privateKey);
const homehubAccount = Account.fromPrivateKey({ privateKey: privateKeyObj });

async function checkAccountBalance() {
  try {
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: homehubAccount.accountAddress,
    });
    console.log(`💰 Current APT balance: ${balance / 10 ** 8} APT`);

    if (balance < 10000000) {
      // Less than 0.1 APT
      console.log("⚠️  Insufficient balance for transactions!");
      console.log(`Please fund your account using the devnet faucet:`);
      console.log(`https://aptos.dev/network/faucet`);
      console.log(`Make sure to select DEVNET in the dropdown!`);
      console.log(`Account address: ${homehubAccount.accountAddress}`);
      return false;
    }
    return true;
  } catch (error) {
    if (error.message.includes("Account not found")) {
      console.log(
        "🔄 Account not found on-chain. Please fund it to initialize."
      );
      console.log(`Use the devnet faucet: https://aptos.dev/network/faucet`);
      console.log(`Make sure to select DEVNET in the dropdown!`);
      console.log(`Account address: ${homehubAccount.accountAddress}`);
      return false;
    } else {
      console.log(`⚠️  Balance check failed: ${error.message}`);
      return false;
    }
  }
}

async function getSoda() {
  try {
    console.log(
      "==============================================================="
    );
    console.log(
      `🤖 HomeHub Agent (${homehubAccount.accountAddress}) is active.`
    );

    // Check account balance
    const hasSufficientBalance = await checkAccountBalance();
    if (!hasSufficientBalance) {
      console.log("\n--- ❌ MISSION ABORTED (Insufficient Balance) ---");
      return;
    }

    console.log("STEP 1: Attempting to get soda for free...");
    await axios.get(FRIDGE_API_URL);
  } catch (error) {
    if (error.response && error.response.status === 402) {
      const paymentInfo = error.response.data;
      console.log("✅ Received 402. Seller requires payment.");
      console.log("STEP 2: Proceeding with autonomous on-chain payment...");
      try {
        const amountToPay = new U64(paymentInfo.price * 10 ** 8);
        const transaction = await aptos.transaction.build.simple({
          sender: homehubAccount.accountAddress,
          data: {
            function: "0x1::aptos_account::transfer",
            functionArguments: [paymentInfo.recipient, amountToPay],
          },
        });
        const committedTxn = await aptos.signAndSubmitTransaction({
          signer: homehubAccount,
          transaction,
        });
        console.log(
          `   - Transaction submitted with hash: ${committedTxn.hash}`
        );
        await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
        console.log("✅ Payment confirmed on-chain!");
        console.log("STEP 3: Retrying request with payment proof...");
        const finalResponse = await axios.get(FRIDGE_API_URL, {
          headers: { "x-payment-proof": committedTxn.hash },
        });
        console.log("\n--- ✅ MISSION COMPLETE! ---");
        console.log("Fridge response:", finalResponse.data);
      } catch (paymentError) {
        console.error(
          "\n--- ❌ MISSION FAILED (Payment Phase) ---",
          paymentError.message
        );
      }
    } else {
      console.error(
        "\n--- ❌ MISSION FAILED (Initial Request) ---",
        error.message
      );
    }
  } finally {
    console.log(
      "===============================================================\n"
    );
  }
}

getSoda();
