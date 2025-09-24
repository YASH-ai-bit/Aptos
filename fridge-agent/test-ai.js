require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function testAI() {
    try {
        console.log("Testing AI connection...");
        const result = await model.generateContent("Say hello!");
        console.log("AI Response:", result.response.text());
        console.log("✅ AI is working!");
    } catch (error) {
        console.error("❌ AI Error:", error.message);
        console.error("Full error:", error);
    }
}

testAI();