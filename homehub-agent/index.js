require('dotenv').config();
const axios = require('axios');
const { Aptos, AptosConfig, Network, Account, U64 } = require("@aptos-labs/ts-sdk");

const FRIDGE_API_URL = 'http://localhost:3000/api/dispense/soda';
const APTOS_CONFIG = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(APTOS_CONFIG);
const privateKey = process.env.BUYER_PRIVATE_KEY;

if (!privateKey) throw new Error("BUYER_PRIVATE_KEY is not set in .env file.");
const homehubAccount = Account.fromPrivateKey({ privateKey });

async function getSoda() {
    try {
        console.log("===============================================================");
        console.log(`🤖 HomeHub Agent (${homehubAccount.accountAddress}) is active.`);
        console.log("STEP 1: Attempting to get soda for free...");
        await axios.get(FRIDGE_API_URL);
    } catch (error) {
        if (error.response && error.response.status === 402) {
            const paymentInfo = error.response.data;
            console.log("✅ Received 402. Seller requires payment.");
            console.log("STEP 2: Proceeding with autonomous on-chain payment...");
            try {
                const amountToPay = new U64(paymentInfo.price * 10**8);
                const transaction = await aptos.transaction.build.simple({
                    sender: homehubAccount.accountAddress,
                    data: {
                        function: "0x1::aptos_account::transfer",
                        functionArguments: [paymentInfo.recipient, amountToPay],
                    },
                });
                const committedTxn = await aptos.signAndSubmitTransaction({ signer: homehubAccount, transaction });
                console.log(`   - Transaction submitted with hash: ${committedTxn.hash}`);
                await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
                console.log("✅ Payment confirmed on-chain!");
                console.log("STEP 3: Retrying request with payment proof...");
                const finalResponse = await axios.get(FRIDGE_API_URL, {
                    headers: { 'x-payment-proof': committedTxn.hash }
                });
                console.log("\n--- ✅ MISSION COMPLETE! ---");
                console.log("Fridge response:", finalResponse.data);
            } catch (paymentError) {
                console.error("\n--- ❌ MISSION FAILED (Payment Phase) ---", paymentError.message);
            }
        } else {
            console.error("\n--- ❌ MISSION FAILED (Initial Request) ---", error.message);
        }
    } finally {
        console.log("===============================================================\n");
    }
}

getSoda();