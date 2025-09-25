// HomeHub Agent Connector - Registers existing homehub agent with A2A Host
// This allows your existing homehub-agent to participate in A2A conversations

const axios = require("axios");

class HomeHubAgentConnector {
  constructor(hostUrl = "http://localhost:4000") {
    this.hostUrl = hostUrl;
    this.agentInfo = {
      id: "homehub-001",
      name: "HomeHub Agent",
      type: "buyer",
      description:
        "AI-powered home automation buyer agent with autonomous payment",
      endpoint: "http://localhost:3001",
      capabilities: [
        "autonomous_purchasing",
        "blockchain_payment",
        "ai_negotiation",
      ],
      metadata: {
        wallet: "Aptos devnet enabled",
        ai_model: "Google Gemini 2.5 Flash",
        payment_methods: ["APT"],
        location: "Home Network",
      },
    };
  }

  // Register with host agent
  async connectToHost() {
    try {
      console.log("🔗 Connecting HomeHub Agent to A2A Host...");

      // Register with host
      const response = await axios.post(
        `${this.hostUrl}/api/register-agent`,
        this.agentInfo
      );
      console.log(
        `✅ HomeHub Agent registered with host: ${this.agentInfo.id}`
      );

      // Set up heartbeat
      this.startHeartbeat();

      return response.data;
    } catch (error) {
      console.error("❌ Failed to connect to host:", error.message);
      throw error;
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
    console.log("🔗 Direct connecting HomeHub Agent to Host...");

    // Register directly with host agent instance
    hostAgent.registerAgent(this.agentInfo);

    console.log("✅ HomeHub Agent directly connected to host");
    return this.agentInfo;
  }
}

module.exports = HomeHubAgentConnector;

// Auto-connect if run directly
if (require.main === module) {
  const connector = new HomeHubAgentConnector();
  connector.connectToHost().catch(console.error);
}
