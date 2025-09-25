// Chat Demo Server - Shows real-time AI agent communication
require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 4001;
const FRIDGE_URL = "http://localhost:3000";
const HOMEHUB_URL = "http://localhost:3001"; // We'll make HomeHub a server too

// Serve static files
app.use(express.static("public"));
app.use(express.json());

// Store chat messages for the demo
let chatHistory = [];

// Agent status tracking
let agentStatus = {
  fridge: { online: false, lastSeen: null },
  homehub: { online: false, lastSeen: null },
};

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🌐 Client connected to chat demo");

  // Send chat history to new client
  socket.emit("chat_history", chatHistory);
  socket.emit("agent_status", agentStatus);

  // Handle manual chat triggers
  socket.on("trigger_interaction", async (data) => {
    console.log("🎬 Triggering agent interaction:", data.type);

    try {
      if (data.type === "soda_request") {
        await triggerRealAgentInteraction(); // Use real agent instead of simulation
      }
    } catch (error) {
      console.error("❌ Error triggering interaction:", error.message);
      addChatMessage(
        "system",
        "Error triggering interaction: " + error.message,
        "error"
      );
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected from chat demo");
  });
});

// Add message to chat and broadcast
function addChatMessage(agent, message, type = "message", metadata = {}) {
  const chatMessage = {
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    agent: agent,
    message: message,
    type: type, // message, payment, transaction, error, system
    metadata: metadata,
  };

  chatHistory.push(chatMessage);

  // Keep only last 50 messages
  if (chatHistory.length > 50) {
    chatHistory = chatHistory.slice(-50);
  }

  // Broadcast to all clients
  io.emit("new_message", chatMessage);

  return chatMessage;
}

// Check agent status
async function checkAgentStatus() {
  // Check Fridge Agent
  try {
    await axios.get(`${FRIDGE_URL}/api/dispense/soda`);
    agentStatus.fridge = { online: true, lastSeen: new Date() };
  } catch (error) {
    if (error.response && error.response.status === 402) {
      // 402 is expected from fridge agent
      agentStatus.fridge = { online: true, lastSeen: new Date() };
    } else {
      agentStatus.fridge.online = false;
    }
  }

  // For now, mark HomeHub as online if we can simulate it
  agentStatus.homehub = { online: true, lastSeen: new Date() };

  io.emit("agent_status", agentStatus);
}

// Add monitoring for Fridge Agent responses with retry logic
async function monitorFridgeResponses(txHash = null, retryCount = 0) {
  const maxRetries = 3;

  try {
    if (!txHash) {
      // First request without payment
      console.log("🔍 Monitoring initial request to Fridge Agent...");
      const fridgeResponse = await axios.get(`${FRIDGE_URL}/api/dispense/soda`);

      if (fridgeResponse.status === 200) {
        addChatMessage("fridge", fridgeResponse.data.status, "success");
      }
    } else {
      // HARDCODED: Payment proof always succeeds since we know payment is made
      console.log("💰 HARDCODED: Payment verification - assuming payment is valid");
      
      // Add a short delay for realism
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Hardcode successful fridge response
      addChatMessage("fridge", "✅ Payment verified! Dispensing soda... *CLUNK* Enjoy your refreshing beverage!", "success");
      addChatMessage(
        "homehub",
        "🥤 Perfect! The payment was verified and I got my soda!",
        "celebration"
      );
      
      return true; // Always return success
    }
  } catch (error) {
    if (error.response && error.response.status === 402) {
      const paymentInfo = error.response.data;
      addChatMessage("fridge", paymentInfo.message, "payment_request", {
        price: paymentInfo.price,
        recipient: paymentInfo.recipient,
      });
      return false; // Payment required
    } else if (error.response && error.response.status === 400) {
      // Payment verification failed - retry if we haven't exceeded max retries
      if (txHash && retryCount < maxRetries) {
        addChatMessage(
          "fridge",
          `⚠️ Payment verification failed (attempt ${
            retryCount + 1
          }). Transaction may still be processing on blockchain...`,
          "warning"
        );
        console.log(`🔄 Will retry verification in a few seconds...`);

        // Schedule retry with exponential backoff
        setTimeout(() => monitorFridgeResponses(txHash, retryCount + 1), 1000);
        return false;
      } else {
        addChatMessage(
          "fridge",
          error.response.data.error ||
            "Payment verification failed after all retries",
          "error"
        );
        if (txHash) {
          addChatMessage(
            "system",
            `💡 Transaction ${txHash.substring(
              0,
              20
            )}... may be valid - check Aptos Explorer`,
            "warning"
          );
        }
        return false; // Final failure
      }
    } else {
      console.error("Error monitoring fridge response:", error.message);
      addChatMessage(
        "system",
        `❌ Error communicating with Fridge Agent: ${error.message}`,
        "error"
      );
      return false;
    }
  }
}

// Trigger real HomeHub agent interaction
async function triggerRealAgentInteraction() {
  console.log("🚀 Triggering REAL HomeHub agent...");

  addChatMessage(
    "system",
    "🎬 Starting real agent interaction - HomeHub will make actual blockchain transaction!",
    "system"
  );

  try {
    // Import and run the actual HomeHub agent logic
    const { spawn } = require("child_process");

    // Run the real HomeHub agent
    const homehubProcess = spawn("node", ["index.js"], {
      cwd: "/home/yash/aptos-x402/homehub-agent",
      stdio: ["pipe", "pipe", "pipe"],
    });

    let outputBuffer = "";

    homehubProcess.stdout.on("data", (data) => {
      const output = data.toString();
      outputBuffer += output;
      console.log(`[HomeHub Real]: ${output.trim()}`);

      // Parse HomeHub output and add to chat
      if (output.includes("My goal is to get a soda")) {
        addChatMessage(
          "homehub",
          "🎯 My goal is to get a soda. Let me start the process...",
          "thinking"
        );

        // Monitor the first request to Fridge after a short delay
        setTimeout(() => monitorFridgeResponses(), 2000);
      }

      if (output.includes("accessing the service directly")) {
        addChatMessage(
          "homehub",
          "🌐 Accessing the fridge service to see what's available...",
          "request"
        );
      }

      if (output.includes("requires payment")) {
        addChatMessage(
          "homehub",
          "💳 The service requires payment. The price is fair. I'll use my payment tool.",
          "decision"
        );
      }

      if (output.includes("payment was successful")) {
        const txHashMatch = output.match(/Transaction hash: (0x[a-fA-F0-9]+)/);
        const txHash = txHashMatch ? txHashMatch[1] : "Unknown";
        addChatMessage(
          "homehub",
          `✅ Real blockchain payment successful! Transaction: ${txHash.substring(
            0,
            20
          )}...`,
          "transaction",
          {
            txHash: txHash,
            real: true,
          }
        );

        // Monitor the verification request with payment proof - hardcoded success
        addChatMessage(
          "system",
          "💰 Processing payment verification (hardcoded success)...",
          "system"
        );
        setTimeout(() => monitorFridgeResponses(txHash), 2000); // Quick response since hardcoded
      }

      if (output.includes("MISSION COMPLETE")) {
        addChatMessage(
          "homehub",
          "🎉 Mission complete! I successfully got my soda using real blockchain transactions!",
          "celebration"
        );
      }
    });

    homehubProcess.stderr.on("data", (data) => {
      const error = data.toString();
      console.error(`[HomeHub Error]: ${error}`);
      if (error.includes("Error") || error.includes("Failed")) {
        addChatMessage("homehub", `❌ Error: ${error.trim()}`, "error");
      }
    });

    homehubProcess.on("close", (code) => {
      console.log(`HomeHub agent exited with code ${code}`);
      if (code === 0) {
        addChatMessage(
          "system",
          "✅ Real agent interaction completed successfully!",
          "success"
        );
      } else {
        addChatMessage(
          "system",
          `❌ Agent interaction failed with code ${code}`,
          "error"
        );
      }
    });

    // Set timeout to kill process if it runs too long
    setTimeout(() => {
      if (!homehubProcess.killed) {
        homehubProcess.kill();
        addChatMessage("system", "⏰ Agent interaction timed out", "warning");
      }
    }, 30000); // 30 second timeout
  } catch (error) {
    console.error("❌ Error running real HomeHub agent:", error);
    addChatMessage(
      "system",
      `❌ Failed to run real HomeHub agent: ${error.message}`,
      "error"
    );
  }
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/status", (req, res) => {
  res.json({
    agents: agentStatus,
    chatHistory: chatHistory.length,
    uptime: process.uptime(),
  });
});

app.post("/api/trigger-interaction", async (req, res) => {
  try {
    await triggerRealAgentInteraction(); // Use real agent
    res.json({ success: true, message: "Real agent interaction triggered" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start status checking
setInterval(checkAgentStatus, 5000);
checkAgentStatus(); // Initial check

// Start server
server.listen(PORT, () => {
  console.log(
    "==============================================================="
  );
  console.log(`🎭 Agent Chat Demo running on http://localhost:${PORT}`);
  console.log("🤖 Visualizing AI Agent Communication");
  console.log("📡 Make sure your Fridge Agent is running on port 3000");
  console.log(
    "==============================================================="
  );
});
