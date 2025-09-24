// fridge-agent/index.js (AI VERSION)
require("dotenv").config();
const express = require("express");
const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- 1. CONFIGURATION ---
const app = express();
const PORT = 3000;

// AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Aptos Configuration
const APTOS_CONFIG = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(APTOS_CONFIG);
const SERVICE_PRICE_APT = 0.1;
const RECIPIENT_ADDRESS = process.env.SELLER_ADDRESS;

if (!RECIPIENT_ADDRESS) throw new Error("SELLER_ADDRESS is not set.");

// --- 2. CORE VERIFICATION LOGIC (Unchanged) ---
async function verifyPayment(txnHash) {
  try {
    console.log(`[Fridge AI]: Verifying transaction: ${txnHash}`);
    const transaction = await aptos.getTransactionByHash({
      transactionHash: txnHash,
    });
    if (
      !transaction.success ||
      transaction.payload.function !== "0x1::aptos_account::transfer"
    )
      return false;

    const recipient = transaction.payload.arguments[0];
    const amount = transaction.payload.arguments[1];
    const expectedAmount = SERVICE_PRICE_APT * 10 ** 8;
    if (recipient !== RECIPIENT_ADDRESS || amount < expectedAmount)
      return false;

    console.log("[Fridge AI]: ✅ Verification successful!");
    return true;
  } catch (error) {
    console.error("[Fridge AI]: Error during verification:", error.message);
    return false;
  }
}

// --- 3. UPGRADED AI-POWERED API ENDPOINT ---
app.get("/api/dispense/soda", async (req, res) => {
  console.log("\n[Fridge AI]: Received a request for a soda...");
  const paymentProofHash = req.header("x-payment-proof");

  if (!paymentProofHash) {
    console.log(
      "[Fridge AI]: No payment proof found. Asking my AI brain for a response..."
    );

    try {
      // Use AI to generate the payment request
      const prompt = `You are an AI for a smart fridge. A client agent wants a soda but hasn't paid. Politely ask them to pay ${SERVICE_PRICE_APT} APT.`;
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      console.log("[Fridge AI]: ✅ AI generated payment request!");
      return res.status(402).json({
        message: aiResponse.trim(),
        price: SERVICE_PRICE_APT,
        recipient: RECIPIENT_ADDRESS,
      });
    } catch (aiError) {
      console.error("[Fridge AI]: ❌ AI call failed:", aiError.message);
      // Fallback response if AI fails
      return res.status(402).json({
        message: `Payment required: Please pay ${SERVICE_PRICE_APT} APT for your soda.`,
        price: SERVICE_PRICE_APT,
        recipient: RECIPIENT_ADDRESS,
      });
    }
  }

  const isValid = await verifyPayment(paymentProofHash);

  if (isValid) {
    console.log(
      "[Fridge AI]: Payment is valid. Asking my AI brain for a success message..."
    );

    try {
      // Use AI to generate the success response, adding local context
      const prompt = `You are an AI for a smart fridge. A client agent just successfully paid for a soda. Give them a short, fun confirmation message. It's a warm evening here in Haryana, India.`;
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      console.log("[Fridge AI]: ✅ AI generated success message!");
      res.status(200).json({ status: aiResponse.trim() });
    } catch (aiError) {
      console.error("[Fridge AI]: ❌ AI call failed:", aiError.message);
      // Fallback response if AI fails
      res.status(200).json({
        status: "Soda dispensed successfully! Enjoy your refreshing drink!",
      });
    }
  } else {
    console.log("[Fridge AI]: Payment proof was invalid.");
    res.status(400).json({
      error: "The provided payment proof was invalid or could not be verified.",
    });
  }
});

// --- 4. SERVER START ---
app.listen(PORT, () => {
  console.log(
    "==============================================================="
  );
  console.log(
    `🤖 INTELLIGENT FridgeFresh Seller Agent is running on http://localhost:${PORT}`
  );
  console.log(`💳 Accepting payments at address: ${RECIPIENT_ADDRESS}`);
  console.log(
    "==============================================================="
  );
});
