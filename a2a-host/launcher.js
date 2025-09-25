// A2A System Launcher - Starts all components together
// Based on the agent2agent pattern

const A2AHostAgent = require("./host-agent");
const FridgeAgentConnector = require("./fridge-connector");
const HomeHubAgentConnector = require("./homehub-connector");

class A2ASystemLauncher {
  constructor() {
    this.hostAgent = null;
    this.fridgeConnector = null;
    this.homeHubConnector = null;
  }

  async launch() {
    console.log("🚀 Launching A2A Agent Communication System...");
    console.log("📋 Based on agent2agent orchestration pattern");
    console.log(
      "==============================================================="
    );

    try {
      // Step 1: Start Host Agent
      console.log("1️⃣ Starting A2A Host Agent...");
      this.hostAgent = new A2AHostAgent();

      // Start host in background
      this.hostAgent.start();

      // Give host time to start
      await this.delay(2000);

      // Step 2: Connect existing agents
      console.log("2️⃣ Connecting existing agents to host...");

      // Connect Fridge Agent
      this.fridgeConnector = new FridgeAgentConnector();
      await this.fridgeConnector.directConnect(this.hostAgent);

      // Connect HomeHub Agent
      this.homeHubConnector = new HomeHubAgentConnector();
      await this.homeHubConnector.directConnect(this.hostAgent);

      console.log(
        "==============================================================="
      );
      console.log("🎉 A2A System Launch Complete!");
      console.log("");
      console.log("🌐 Access the UI at: http://localhost:4000");
      console.log("🤖 Agents Connected:");
      console.log("   • Host Agent (Orchestrator)");
      console.log("   • Fridge Agent (Smart Appliance/Seller)");
      console.log("   • HomeHub Agent (Home Automation/Buyer)");
      console.log("");
      console.log(
        '🎮 Try clicking "Start A2A Demo" to watch autonomous agent communication!'
      );
      console.log(
        "==============================================================="
      );
    } catch (error) {
      console.error("❌ System launch failed:", error.message);
      console.log("");
      console.log("🛠️ Troubleshooting:");
      console.log("   • Make sure fridge-agent is running on port 3000");
      console.log("   • Check that no other service is using port 4000");
      console.log("   • Verify .env files are properly configured");
      process.exit(1);
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Graceful shutdown
  async shutdown() {
    console.log("🛑 Shutting down A2A system...");
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received shutdown signal...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received termination signal...");
  process.exit(0);
});

// Auto-launch if run directly
if (require.main === module) {
  const launcher = new A2ASystemLauncher();
  launcher.launch().catch(console.error);
}

module.exports = A2ASystemLauncher;
