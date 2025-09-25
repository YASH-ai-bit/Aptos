// Fridge Agent Connector - Registers existing fridge agent with A2A Host
// This allows your existing fridge-agent to participate in A2A conversations

const axios = require("axios");

class FridgeAgentConnector {
  constructor(
    hostUrl = "http://localhost:4000",
    fridgeUrl = "http://localhost:3000"
  ) {
    this.hostUrl = hostUrl;
    this.fridgeUrl = fridgeUrl;
    this.agentInfo = {
      id: "fridge-001",
      name: "Smart Fridge Agent",
      type: "seller",
      description: "AI-powered smart fridge with x402 payment protocol",
      endpoint: fridgeUrl,
      capabilities: ["soda_dispensing", "payment_verification", "ai_responses"],
      metadata: {
        services: ["dispense_soda"],
        pricing: { soda: 0.1, currency: "APT" },
        location: "Kitchen",
        ai_model: "Google Gemini Pro",
      },
    };
  }

  // Register with host agent
  async connectToHost() {
    try {
      console.log("🔗 Connecting Fridge Agent to A2A Host...");

      // First check if fridge agent is running
      await this.checkFridgeAgent();

      // Register with host
      const response = await axios.post(
        `${this.hostUrl}/api/register-agent`,
        this.agentInfo
      );
      console.log(`✅ Fridge Agent registered with host: ${this.agentInfo.id}`);

      // Set up heartbeat
      this.startHeartbeat();

      return response.data;
    } catch (error) {
      console.error("❌ Failed to connect to host:", error.message);
      throw error;
    }
  }

  // Check if the original fridge agent is running
  async checkFridgeAgent() {
    try {
      const response = await axios.get(`${this.fridgeUrl}/api/dispense/soda`);
    } catch (error) {
      if (error.response && error.response.status === 402) {
        // Expected 402 response means fridge agent is working
        console.log("✅ Fridge Agent is running and responding correctly");
        return true;
      }
      console.error(
        "❌ Fridge Agent not responding. Please start fridge-agent first."
      );
      throw new Error("Fridge Agent not accessible at " + this.fridgeUrl);
    }
  }

  // Send periodic heartbeat to host
  startHeartbeat() {
    setInterval(async () => {
      try {
        await axios.post(`${this.hostUrl}/api/heartbeat`, {
          agentId: this.agentInfo.id,
          timestamp: new Date().toISOString(),
          status: "active",
        });
      } catch (error) {
        console.error("💔 Heartbeat failed:", error.message);
      }
    }, 30000); // Every 30 seconds
  }

  // Manually add the registration to host agent (direct approach)
  async directConnect(hostAgent) {
    console.log("🔗 Direct connecting Fridge Agent to Host...");

    // Check fridge agent is running
    await this.checkFridgeAgent();

    // Register directly with host agent instance
    hostAgent.registerAgent(this.agentInfo);

    console.log("✅ Fridge Agent directly connected to host");
    return this.agentInfo;
  }
}

module.exports = FridgeAgentConnector;

// Auto-connect if run directly
if (require.main === module) {
  const connector = new FridgeAgentConnector();
  connector.connectToHost().catch(console.error);
}
