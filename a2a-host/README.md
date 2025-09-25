# 🤖 A2A Host Agent System

Agent-to-Agent communication orchestrator based on the [agent2agent pattern](https://github.com/bhancockio/agent2agent/tree/main/a2a_friend_scheduling). This host agent connects your existing Fridge and HomeHub agents, enabling them to communicate through a centralized UI interface.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                A2A Host Agent (Port 4000)              │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │  WebSocket UI   │    │   Agent Orchestrator        │ │
│  │  Real-time Chat │    │   Message Routing           │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
            │                           │
    ┌───────────────┐           ┌──────────────┐
    │  Fridge Agent │           │ HomeHub Agent│
    │  (Port 3000)  │           │ (Your impl.) │
    │  Seller/AI    │           │ Buyer/AI     │
    └───────────────┘           └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

1. **Fridge Agent** must be running on port 3000
2. **Node.js** 16+ installed
3. **Environment variables** configured (.env files)

### Launch the A2A System

```bash
# Navigate to a2a-host directory
cd a2a-host

# Install dependencies
npm install

# Start the complete A2A system
npm start
```

This will:

1. 🌐 Start the Host Agent on port 4000
2. 🔗 Connect your Fridge Agent (port 3000)
3. 🤖 Register your HomeHub Agent
4. 📡 Open WebSocket UI for real-time monitoring

### Access the Interface

Open http://localhost:4000 in your browser to see:

- **Live Agent Registry** - All connected agents
- **Real-time Chat** - Watch agents communicate
- **Demo Controls** - Trigger automated conversations
- **Manual Messaging** - Send messages as any agent

## 🎮 Usage

### Automated Demo

1. Click **"Start A2A Demo"** button
2. Watch the complete x402 protocol flow:
   - 🤖 HomeHub requests soda
   - 💳 Fridge requires payment
   - ✅ HomeHub pays with blockchain
   - 🥤 Fridge delivers service

### Manual Testing

1. Select an agent from the dropdown
2. Type a message
3. Watch other agents respond in real-time

### Agent Monitoring

- View connection status of all agents
- See conversation history
- Monitor message flow and types

## 🔧 Components

### Host Agent (`host-agent.js`)

- **Central orchestrator** for all agent communication
- **WebSocket server** for real-time UI updates
- **Message routing** between agents
- **Conversation history** management

### Agent Connectors

- **`fridge-connector.js`** - Connects existing fridge agent
- **`homehub-connector.js`** - Connects existing homehub agent
- **Heartbeat monitoring** and status tracking

### System Launcher (`launcher.js`)

- **Automated startup** of all components
- **Agent registration** with proper sequencing
- **Error handling** and troubleshooting guidance

## 🌟 Features

### Real-time Communication

- **Live chat interface** showing all agent messages
- **Message types** (requests, payments, responses, errors)
- **Agent status indicators** (connected/disconnected)
- **Conversation persistence** during session

### Agent Integration

- **Seamless wrapping** of existing agents
- **No code changes** required to existing agents
- **Protocol translation** between A2A and your x402 implementation
- **Metadata and capabilities** advertisement

### Demo & Testing

- **Automated demonstrations** of complete workflows
- **Manual message sending** for testing scenarios
- **Conversation clearing** and history management
- **Error handling** and status reporting

## 🛠️ Development

### Running Components Separately

```bash
# Host agent only
npm run host

# With auto-restart for development
npm run dev
```

### Adding New Agents

1. Create a new connector (see existing examples)
2. Register agent with host using `hostAgent.registerAgent()`
3. Handle message routing if needed

### Customizing the UI

- Edit the HTML template in `host-agent.js`
- Modify styles and JavaScript as needed
- WebSocket events are already wired up

## 🐛 Troubleshooting

### Common Issues

**"Fridge Agent not accessible"**

- Ensure fridge-agent is running on port 3000
- Check that .env files are configured
- Verify network connectivity

**"Port 4000 already in use"**

- Kill existing processes: `lsof -ti:4000 | xargs kill`
- Or modify port in launcher configuration

**"No agents showing in UI"**

- Check browser console for WebSocket errors
- Ensure host agent started successfully
- Refresh the agents list

### Debug Mode

Check console logs for detailed connection and message information.

## 🎯 Benefits of A2A Pattern

1. **Centralized Orchestration** - Single point for managing all agent interactions
2. **Real-time Visibility** - Live monitoring of agent conversations
3. **Protocol Abstraction** - Agents don't need to know about each other directly
4. **Scalability** - Easy to add new agents to the ecosystem
5. **Testing & Debugging** - Built-in tools for development and troubleshooting

## 📈 Next Steps

- Add more specialized agents (weather, calendar, etc.)
- Implement agent discovery protocols
- Add authentication and security layers
- Create persistent conversation storage
- Build agent performance analytics

---

**Perfect for demonstrating autonomous AI-to-AI commerce with real-time visibility!** 🚀
