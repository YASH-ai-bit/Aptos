# 🎭 AI Agent Communication Demo

A real-time chat UI that visualizes the communication between your AI agents (Fridge Agent & HomeHub Agent).

## 🚀 Quick Start

### 1. Start Your Agents

```bash
# Terminal 1: Start Fridge Agent
cd /home/yash/aptos-x402/fridge-agent
npm start

# Terminal 2: Start HomeHub Agent (if you have a server version)
cd /home/yash/aptos-x402/homehub-agent
npm start
```

### 2. Start Chat Demo

```bash
# Terminal 3: Start Chat UI
cd /home/yash/aptos-x402/chat-demo
npm start
```

### 3. Open Demo

Visit: **http://localhost:4001**

## 🎬 How It Works

1. **Agent Status**: See real-time status of your agents
2. **Start Interaction**: Click "Start Soda Request" to trigger agent communication
3. **Real-time Chat**: Watch agents communicate in real-time
4. **Blockchain Transactions**: See actual Aptos transactions when they occur

## 🤖 Agent Flow Visualization

```
HomeHub Agent                    Fridge Agent
     |                               |
     |-- "I want a soda" ----------->|
     |                               |
     |<-- "Pay 0.1 APT first" -------|
     |                               |
     |-- "Processing payment..." --->|
     |                               |
     |-- [Aptos Transaction] ------->|
     |                               |
     |<-- "Here's your soda!" -------|
     |                               |
     |-- "Thanks! 🥤" -------------->|
```

## 🎨 Features

- ✅ **Real-time messaging** via WebSocket
- ✅ **Agent status monitoring**
- ✅ **Transaction visualization**
- ✅ **AI response display**
- ✅ **Mobile responsive**
- ✅ **Beautiful UI animations**

## 🔧 Configuration

The demo automatically detects your agents on:

- **Fridge Agent**: `http://localhost:3000`
- **HomeHub Agent**: `http://localhost:3001` (if running as server)

## 📱 Demo Controls

- **🥤 Start Soda Request**: Triggers full agent interaction
- **🧹 Clear Chat**: Clears conversation history
- **🔄 Refresh Status**: Updates agent connection status

## 💡 Perfect for Presentations

This demo is perfect for showing:

- AI agent autonomy
- Blockchain payment integration
- Real-time agent communication
- Professional agent architecture

## 🎯 Next Steps

1. Connect real HomeHub agent as server
2. Add more interaction types
3. Show actual blockchain explorer links
4. Add agent performance metrics

---

**🎉 Your AI agents are now ready for demo!**
