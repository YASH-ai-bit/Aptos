// Host Agent - Orchestrates communication between Fridge and HomeHub agents
// Based on the agent2agent pattern from bhancockio/agent2agent

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const axios = require("axios");

class A2AHostAgent {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.connectedAgents = new Map();
    this.conversationHistory = [];
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupRoutes() {
    this.app.use(express.json());
    this.app.use(express.static("public"));

    // Main UI route
    this.app.get("/", (req, res) => {
      res.send(this.getHostUI());
    });

    // API endpoints
    this.app.get("/api/agents", (req, res) => {
      const agents = Array.from(this.connectedAgents.values());
      res.json(agents);
    });

    this.app.get("/api/conversation", (req, res) => {
      res.json(this.conversationHistory);
    });

    this.app.post("/api/start-demo", async (req, res) => {
      try {
        await this.startAgentConversation();
        res.json({ success: true, message: "Demo conversation started" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete("/api/conversation", (req, res) => {
      this.conversationHistory = [];
      this.io.emit("conversation_cleared");
      res.json({ success: true });
    });
  }

  setupWebSocket() {
    this.io.on("connection", (socket) => {
      console.log("🌐 Client connected to Host Agent UI");

      // Send current state to new client
      socket.emit("agents_update", Array.from(this.connectedAgents.values()));
      socket.emit("conversation_history", this.conversationHistory);

      // Handle manual message sending
      socket.on("send_message", async (data) => {
        await this.handleManualMessage(data);
      });

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected");
      });
    });
  }

  // Register an agent with the host
  registerAgent(agentInfo) {
    this.connectedAgents.set(agentInfo.id, {
      ...agentInfo,
      status: "connected",
      lastSeen: new Date(),
    });

    console.log(`🔗 Agent registered: ${agentInfo.id} (${agentInfo.type})`);
    this.io.emit("agents_update", Array.from(this.connectedAgents.values()));
  }

  // Add message to conversation and broadcast
  addMessage(agentId, message, messageType = "message", metadata = {}) {
    const agent = this.connectedAgents.get(agentId);
    const conversationEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      agentId: agentId,
      agentName: agent?.name || agentId,
      agentType: agent?.type || "unknown",
      message: message,
      messageType: messageType,
      metadata: metadata,
    };

    this.conversationHistory.push(conversationEntry);
    this.io.emit("new_message", conversationEntry);

    console.log(`💬 [${agent?.name || agentId}]: ${message}`);
    return conversationEntry;
  }

  // Orchestrate conversation between agents
  async startAgentConversation() {
    const fridgeAgent = Array.from(this.connectedAgents.values()).find(
      (agent) => agent.type === "seller"
    );
    const homeHubAgent = Array.from(this.connectedAgents.values()).find(
      (agent) => agent.type === "buyer"
    );

    if (!fridgeAgent || !homeHubAgent) {
      throw new Error("Both Fridge and HomeHub agents must be connected");
    }

    console.log("🚀 Host: Starting orchestrated agent conversation...");
    this.addMessage(
      "host",
      "🚀 Starting automated x402 protocol demonstration...",
      "system"
    );

    // Step 1: HomeHub initiates request
    setTimeout(() => {
      this.addMessage(
        homeHubAgent.id,
        "🤖 Hey Fridge! I'm feeling thirsty. Could I get a nice cold soda please?",
        "request"
      );
    }, 1000);

    // Step 2: Fridge responds with payment request
    setTimeout(async () => {
      try {
        // Call actual fridge agent API to get realistic response
        const response = await axios.get(
          "http://localhost:3000/api/dispense/soda"
        );
      } catch (error) {
        if (error.response && error.response.status === 402) {
          const paymentInfo = error.response.data;
          this.addMessage(
            fridgeAgent.id,
            `💳 I'd be happy to help! ${paymentInfo.message} Please send ${paymentInfo.price} APT to complete your purchase.`,
            "payment_request",
            { price: paymentInfo.price, recipient: paymentInfo.recipient }
          );
        }
      }
    }, 2500);

    // Step 3: HomeHub processes payment
    setTimeout(() => {
      this.addMessage(
        homeHubAgent.id,
        "💳 No problem! Let me process that payment right now...",
        "payment_processing"
      );
    }, 4000);

    // Step 4: Payment confirmation
    setTimeout(() => {
      const mockTxHash = "0x" + Math.random().toString(16).substring(2, 42);
      this.addMessage(
        homeHubAgent.id,
        `✅ Payment sent successfully! Transaction: ${mockTxHash}`,
        "payment_sent",
        { transactionHash: mockTxHash, amount: 0.1 }
      );
    }, 5500);

    // Step 5: HomeHub retries with payment proof
    setTimeout(() => {
      this.addMessage(
        homeHubAgent.id,
        "🔄 Now requesting the soda again with my payment proof...",
        "retry_request"
      );
    }, 7000);

    // Step 6: Fridge delivers with AI response
    setTimeout(async () => {
      try {
        const mockTxHash = "0x" + Math.random().toString(16).substring(2, 42);
        const response = await axios.get(
          "http://localhost:3000/api/dispense/soda",
          {
            headers: { "x-payment-proof": mockTxHash },
          }
        );

        this.addMessage(
          fridgeAgent.id,
          `🥤 ${response.data.status}`,
          "service_delivered"
        );
      } catch (error) {
        this.addMessage(
          fridgeAgent.id,
          "🥤 Here's your ice-cold soda! Enjoy this refreshing treat!",
          "service_delivered"
        );
      }

      // Final system message
      setTimeout(() => {
        this.addMessage(
          "host",
          "🎉 Agent-to-Agent transaction completed successfully!",
          "success"
        );
      }, 1500);
    }, 8500);
  }

  async handleManualMessage(data) {
    const { agentId, message } = data;
    this.addMessage(agentId, message, "manual");
  }

  getHostUI() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>A2A Host Agent - Agent Communication Hub</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                background: #fafbfc; 
                color: #2d3748;
                line-height: 1.5;
            }
            
            .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
            .header { text-align: center; margin-bottom: 32px; }
            .header h1 { 
                color: #1a202c; 
                margin-bottom: 8px; 
                font-weight: 600;
                font-size: 28px;
            }
            .header p { 
                color: #718096; 
                font-size: 16px; 
                font-weight: 400;
            }
            
            .main-content { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
            
            .sidebar { 
                background: #ffffff; 
                border-radius: 8px; 
                padding: 24px; 
                height: fit-content; 
                border: 1px solid #e2e8f0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            }
            .sidebar h3 { 
                color: #2d3748; 
                margin-bottom: 16px; 
                font-size: 16px;
                font-weight: 600;
            }
            
            .agent-card { 
                background: #f7fafc; 
                border: 1px solid #e2e8f0; 
                border-radius: 6px; 
                padding: 16px; 
                margin-bottom: 8px;
                transition: all 0.2s;
            }
            .agent-card:hover { background: #edf2f7; }
            .agent-card.buyer { border-left: 3px solid #3182ce; }
            .agent-card.seller { border-left: 3px solid #38a169; }
            .agent-card.host { border-left: 3px solid #d69e2e; }
            
            .agent-status { 
                display: inline-block; 
                width: 8px; 
                height: 8px; 
                border-radius: 50%; 
                margin-right: 8px; 
            }
            .agent-status.connected { background: #38a169; }
            .agent-status.disconnected { background: #e53e3e; }
            
            .controls { margin-top: 24px; }
            .btn { 
                background: #4a5568; 
                color: white; 
                border: none; 
                padding: 12px 16px; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 14px; 
                font-weight: 500;
                margin: 4px 0; 
                width: 100%;
                transition: background 0.2s;
            }
            .btn:hover { background: #2d3748; }
            .btn.primary { background: #3182ce; }
            .btn.primary:hover { background: #2c5aa0; }
            .btn.danger { background: #e53e3e; }
            .btn.danger:hover { background: #c53030; }
            
            .chat-container { 
                background: #ffffff; 
                border-radius: 8px; 
                height: 600px; 
                display: flex; 
                flex-direction: column; 
                border: 1px solid #e2e8f0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            }
            .chat-header { 
                background: #f7fafc; 
                color: #2d3748; 
                padding: 20px; 
                border-radius: 8px 8px 0 0; 
                border-bottom: 1px solid #e2e8f0;
            }
            .chat-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
            .chat-header p { margin: 4px 0 0 0; font-size: 14px; color: #718096; }
            
            .chat-messages { 
                flex: 1; 
                overflow-y: auto; 
                padding: 20px; 
                background: #fafbfc;
            }
            .chat-input { 
                padding: 16px; 
                border-top: 1px solid #e2e8f0; 
                display: flex; 
                gap: 12px;
                background: #ffffff;
            }
            .chat-input select {
                padding: 10px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                background: white;
                color: #2d3748;
                font-size: 14px;
            }
            .chat-input input { 
                flex: 1; 
                padding: 10px 12px; 
                border: 1px solid #e2e8f0; 
                border-radius: 6px; 
                font-size: 14px;
                background: white;
            }
            .chat-input input:focus { 
                outline: none; 
                border-color: #3182ce; 
                box-shadow: 0 0 0 3px rgba(49,130,206,0.1);
            }
            .chat-input button { 
                padding: 10px 16px; 
                background: #3182ce; 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer;
                font-weight: 500;
                transition: background 0.2s;
            }
            .chat-input button:hover { background: #2c5aa0; }
            
            .message { 
                margin-bottom: 16px; 
                padding: 12px 16px; 
                border-radius: 8px; 
                max-width: 75%;
                word-wrap: break-word;
            }
            .message.buyer { 
                background: #ebf8ff; 
                margin-left: auto; 
                border: 1px solid #bee3f8;
            }
            .message.seller { 
                background: #f0fff4; 
                border: 1px solid #c6f6d5;
            }
            .message.host { 
                background: #fffbeb; 
                margin: 0 auto; 
                text-align: center;
                border: 1px solid #fed7aa;
                max-width: 60%;
            }
            .message.system { 
                background: #f7fafc; 
                border: 1px solid #e2e8f0; 
                margin: 0 auto; 
                text-align: center; 
                font-style: italic;
                color: #718096;
                max-width: 60%;
            }
            
            .message-header { 
                font-weight: 600; 
                font-size: 12px; 
                margin-bottom: 4px; 
                color: #4a5568;
                text-transform: uppercase;
                letter-spacing: 0.025em;
            }
            .message-content { 
                font-size: 14px; 
                line-height: 1.5; 
                color: #2d3748;
            }
            .message-time { 
                font-size: 11px; 
                color: #a0aec0; 
                margin-top: 6px;
                font-weight: 400;
            }
            
            .message-type-payment_request { 
                border-left: 3px solid #d69e2e;
                background: #fffbeb;
            }
            .message-type-payment_sent { 
                border-left: 3px solid #38a169;
                background: #f0fff4;
            }
            .message-type-service_delivered { 
                border-left: 3px solid #3182ce;
                background: #ebf8ff;
            }
            
            @keyframes slideIn { 
                from { opacity: 0; transform: translateY(8px); } 
                to { opacity: 1; transform: translateY(0); } 
            }
            .message { animation: slideIn 0.25s ease-out; }
            
            /* Scrollbar styling */
            .chat-messages::-webkit-scrollbar { width: 6px; }
            .chat-messages::-webkit-scrollbar-track { background: #f7fafc; }
            .chat-messages::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 3px; }
            .chat-messages::-webkit-scrollbar-thumb:hover { background: #a0aec0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 A2A Host Agent</h1>
                <p>Agent-to-Agent Communication Hub</p>
            </div>
            
            <div class="main-content">
                <div class="sidebar">
                    <h3>🔗 Connected Agents</h3>
                    <div id="agents-list">
                        <div class="agent-card host">
                            <div class="agent-status connected"></div>
                            <strong>Host Agent</strong><br>
                            <small>Orchestrator • Always Active</small>
                        </div>
                    </div>
                    
                    <div class="controls">
                        <h3>🎮 Controls</h3>
                        <button class="btn primary" onclick="startDemo()">Start A2A Demo</button>
                        <button class="btn" onclick="refreshAgents()">Refresh Agents</button>
                        <button class="btn danger" onclick="clearConversation()">Clear Chat</button>
                    </div>
                </div>
                
                <div class="chat-container">
                    <div class="chat-header">
                        <h3>💬 Live Agent Conversation</h3>
                        <p>Watch agents communicate in real-time</p>
                    </div>
                    <div class="chat-messages" id="chat-messages">
                        <div class="message system">
                            <div class="message-content">🌐 A2A Host Agent ready. Waiting for agent connections...</div>
                        </div>
                    </div>
                    <div class="chat-input">
                        <select id="agent-select">
                            <option value="host">Host Agent</option>
                        </select>
                        <input type="text" id="message-input" placeholder="Type a message..." onkeypress="if(event.key==='Enter') sendMessage()">
                        <button onclick="sendMessage()">Send</button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            const socket = io();
            let connectedAgents = [];

            // Socket event handlers
            socket.on('agents_update', (agents) => {
                connectedAgents = agents;
                updateAgentsList(agents);
                updateAgentSelect(agents);
            });

            socket.on('conversation_history', (history) => {
                const container = document.getElementById('chat-messages');
                container.innerHTML = '';
                history.forEach(addMessageToChat);
            });

            socket.on('new_message', addMessageToChat);

            socket.on('conversation_cleared', () => {
                document.getElementById('chat-messages').innerHTML = 
                    '<div class="message system"><div class="message-content">💬 Conversation cleared</div></div>';
            });

            // UI update functions
            function updateAgentsList(agents) {
                const container = document.getElementById('agents-list');
                const hostCard = '<div class="agent-card host"><div class="agent-status connected"></div><strong>Host Agent</strong><br><small>Orchestrator • Always Active</small></div>';
                
                const agentCards = agents.map(agent => \`
                    <div class="agent-card \${agent.type}">
                        <div class="agent-status \${agent.status === 'connected' ? 'connected' : 'disconnected'}"></div>
                        <strong>\${agent.name}</strong><br>
                        <small>\${agent.type} • \${agent.description || 'No description'}</small>
                    </div>
                \`).join('');

                container.innerHTML = hostCard + agentCards;
            }

            function updateAgentSelect(agents) {
                const select = document.getElementById('agent-select');
                select.innerHTML = '<option value="host">Host Agent</option>';
                agents.forEach(agent => {
                    select.innerHTML += \`<option value="\${agent.id}">\${agent.name}</option>\`;
                });
            }

            function addMessageToChat(message) {
                const container = document.getElementById('chat-messages');
                const messageDiv = document.createElement('div');
                const agentClass = message.agentType || 'system';
                const typeClass = message.messageType ? \`message-type-\${message.messageType}\` : '';
                
                messageDiv.className = \`message \${agentClass} \${typeClass}\`;
                messageDiv.innerHTML = \`
                    <div class="message-header">\${message.agentName || message.agentId}</div>
                    <div class="message-content">\${message.message}</div>
                    <div class="message-time">\${new Date(message.timestamp).toLocaleTimeString()}</div>
                \`;
                
                container.appendChild(messageDiv);
                container.scrollTop = container.scrollHeight;
            }

            // Action functions
            async function startDemo() {
                try {
                    const response = await fetch('/api/start-demo', { method: 'POST' });
                    const result = await response.json();
                    if (!result.success) {
                        alert('Demo failed: ' + result.error);
                    }
                } catch (error) {
                    alert('Demo failed: ' + error.message);
                }
            }

            async function refreshAgents() {
                try {
                    const response = await fetch('/api/agents');
                    const agents = await response.json();
                    updateAgentsList(agents);
                    updateAgentSelect(agents);
                } catch (error) {
                    console.error('Failed to refresh agents:', error);
                }
            }

            async function clearConversation() {
                try {
                    await fetch('/api/conversation', { method: 'DELETE' });
                } catch (error) {
                    console.error('Failed to clear conversation:', error);
                }
            }

            function sendMessage() {
                const agentSelect = document.getElementById('agent-select');
                const messageInput = document.getElementById('message-input');
                
                if (messageInput.value.trim()) {
                    socket.emit('send_message', {
                        agentId: agentSelect.value,
                        message: messageInput.value.trim()
                    });
                    messageInput.value = '';
                }
            }

            // Initialize
            window.onload = () => {
                refreshAgents();
            };
        </script>
    </body>
    </html>`;
  }

  start(port = 4000) {
    // Register host agent with itself
    this.registerAgent({
      id: "host",
      name: "Host Agent",
      type: "host",
      description: "Orchestrates communication between agents",
      endpoint: `http://localhost:${port}`,
    });

    this.server.listen(port, () => {
      console.log(
        "==============================================================="
      );
      console.log(`🌐 A2A Host Agent running on http://localhost:${port}`);
      console.log("🤖 Ready to orchestrate agent communication");
      console.log("📡 WebSocket interface active for real-time updates");
      console.log(
        "==============================================================="
      );
    });
  }
}

// Export for use as module
module.exports = A2AHostAgent;

// Start server if run directly
if (require.main === module) {
  const hostAgent = new A2AHostAgent();
  hostAgent.start();
}
