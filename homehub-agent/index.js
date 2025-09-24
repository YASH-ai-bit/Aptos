// homehub-agent/index.js (AI VERSION)
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
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- 1. CONFIGURATION ---
const FRIDGE_API_URL = "http://localhost:3000/api/dispense/soda";

// AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Aptos Configuration
const APTOS_CONFIG = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(APTOS_CONFIG);
const privateKey = process.env.BUYER_PRIVATE_KEY;
if (!privateKey) throw new Error("BUYER_PRIVATE_KEY is not set.");
const privateKeyObj = new Ed25519PrivateKey(privateKey);
const homehubAccount = Account.fromPrivateKey({ privateKey: privateKeyObj });

// --- 2. THE PAYMENT "TOOL" THE AI CAN USE ---
async function pay_for_service(price, recipient) {
  try {
    console.log(`[AI Tool]: Executing payment of ${price} APT to ${recipient}`);
    const amountToPay = new U64(price * 10 ** 8);
    const transaction = await aptos.transaction.build.simple({
      sender: homehubAccount.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipient, amountToPay],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: homehubAccount,
      transaction,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    return { success: true, transactionHash: committedTxn.hash };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- 3. MAIN AI AGENT LOGIC ---
async function runIntelligentAgent() {
  console.log(
    "==============================================================="
  );
  console.log(`🤖 INTELLIGENT HomeHub Agent is active.`);
  console.log("🎯 Goal: Acquire one soda.");
  console.log(
    "---------------------------------------------------------------"
  );

  try {
    console.log(
      "🧠 [AI Brain]: My goal is to get a soda. I will try accessing the service directly first."
    );
    await axios.get(FRIDGE_API_URL);
  } catch (error) {
    if (error.response && error.response.status === 402) {
      const paymentInfo = error.response.data;
      console.log(
        "🧠 [AI Brain]: The service requires payment. The price is fair. I will use my payment tool."
      );

      // The AI "decides" to pay by calling the tool we gave it.
      const paymentResult = await pay_for_service(
        paymentInfo.price,
        paymentInfo.recipient
      );

      if (paymentResult.success) {
        console.log(
          "🧠 [AI Brain]: The payment was successful. Now I will get the soda with my proof of payment."
        );

        // The agent retries the request with the transaction hash proof
        const finalResponse = await axios.get(FRIDGE_API_URL, {
          headers: { "x-payment-proof": paymentResult.transactionHash },
        });

        // Ask the AI to give a final, conversational status update
        const prompt = `You are a home AI agent. You just successfully bought a soda from a smart fridge. The fridge's final message was: '${JSON.stringify(
          finalResponse.data
        )}'. Write a short, single-sentence confirmation for your user.`;
        const result = await model.generateContent(prompt);
        const aiConfirmation = result.response.text();

        console.log("\n--- ✅ MISSION COMPLETE! ---");
        console.log(`🤖 [AI Voice]: ${aiConfirmation.trim()}`);
        console.log(
          "===============================================================\n"
        );
      } else {
        console.error("\n--- ❌ MISSION FAILED ---");
        console.error(
          "The AI decided to pay, but the payment tool failed:",
          paymentResult.error
        );
      }
    } else {
      console.error("\n--- ❌ MISSION FAILED ---", error.message);
    }
  }
}

runIntelligentAgent();
