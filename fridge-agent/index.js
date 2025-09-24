require('dotenv').config();
const express = require('express');
const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

const app = express();
const PORT = 3000;
const APTOS_CONFIG = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(APTOS_CONFIG);
const SERVICE_PRICE_APT = 0.1;
const RECIPIENT_ADDRESS = process.env.SELLER_ADDRESS;

if (!RECIPIENT_ADDRESS) throw new Error("SELLER_ADDRESS is not set in .env file.");

async function verifyPayment(txnHash) {
    try {
        console.log(`[Fridge] Verifying transaction: ${txnHash}`);
        const transaction = await aptos.getTransactionByHash({ transactionHash: txnHash });

        if (!transaction.success) return false;
        if (transaction.payload.function !== '0x1::aptos_account::transfer') return false;

        const recipient = transaction.payload.arguments[0];
        const amount = transaction.payload.arguments[1];
        const expectedAmount = SERVICE_PRICE_APT * 10**8;

        if (recipient !== RECIPIENT_ADDRESS || amount < expectedAmount) return false;

        console.log("[Fridge] ✅ Verification successful!");
        return true;
    } catch (error) {
        console.error("[Fridge] Error during verification:", error.message);
        return false;
    }
}

app.get('/api/dispense/soda', async (req, res) => {
    console.log("\n[Fridge] Received a request for a soda...");
    const paymentProofHash = req.header('x-payment-proof');

    if (!paymentProofHash) {
        console.log("[Fridge] No payment proof. Sending 402 Payment Required.");
        return res.status(402).json({
            price: SERVICE_PRICE_APT,
            recipient: RECIPIENT_ADDRESS,
        });
    }
    const isValid = await verifyPayment(paymentProofHash);
    if (isValid) {
        res.status(200).json({ status: "Soda dispensed successfully." });
    } else {
        res.status(400).json({ error: "Invalid payment proof." });
    }
});

app.listen(PORT, () => {
    console.log("===============================================================");
    console.log(`🤖 FridgeFresh Seller Agent is running on http://localhost:${PORT}`);
    console.log(`💳 Accepting payments at address: ${RECIPIENT_ADDRESS}`);
    console.log("===============================================================");
});