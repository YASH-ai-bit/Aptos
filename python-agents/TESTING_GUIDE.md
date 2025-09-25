# 🧪 Python ADK Agents Testing Guide

This guide shows you how to test your Python ADK agents step by step.

## 🚀 Quick Start Testing

### 1. Start the Fridge Agent Server

```bash
cd /home/yash/aptos-x402/python-agents
/home/yash/aptos-x402/.venv/bin/python fridge_agent_adk.py
```

You should see:

```
🤖 Smart Fridge Agent is running using Python ADK patterns
🔗 Agent ID: fridge_001
💡 Capabilities: soda_dispensing, payment_verification, ai_responses
🌐 HTTP API: http://localhost:3001
```

### 2. Test the Agent Status (Basic Health Check)

Open a new terminal and run:

```bash
curl http://localhost:3001/api/status
```

Expected response:

```json
{
  "agent_id": "fridge_001",
  "name": "Smart Fridge Agent",
  "description": "AI-powered smart fridge with payment verification",
  "capabilities": ["soda_dispensing", "payment_verification", "ai_responses"],
  "status": "active"
}
```

### 3. Test Soda Dispensing Without Payment

```bash
curl http://localhost:3001/api/dispense/soda
```

Expected response (HTTP 402 - Payment Required):

```json
{
  "message": "🤖 Hey there! I'd love to help you with that soda, but I need a payment of 0.1 APT first. Thanks!",
  "price": 0.1,
  "recipient": null
}
```

### 4. Test Soda Dispensing With Invalid Payment

```bash
curl -H "x-payment-proof: invalid_payment" http://localhost:3001/api/dispense/soda
```

Expected response (HTTP 400 - Payment Invalid):

```json
{
  "error": "Payment verification failed"
}
```

### 5. Test Soda Dispensing With Valid Payment (Simulation)

```bash
curl -H "x-payment-proof: 0x123abc456def789valid_payment_hash" http://localhost:3001/api/dispense/soda
```

Expected response (HTTP 200 - Success):

```json
{
  "status": "🎉 Payment verified! Here's your ice-cold soda. Enjoy this refreshing treat!"
}
```

## 🤖 Test the HomeHub Agent

In a new terminal, run:

```bash
cd /home/yash/aptos-x402/python-agents
/home/yash/aptos-x402/.venv/bin/python homehub_agent_adk.py
```

You should see the agent:

1. Start up and display its capabilities
2. Automatically request a soda from the Fridge Agent
3. Receive a payment request
4. Make an AI decision about whether to pay
5. Attempt to process payment (will fail due to missing keys - this is expected)

## 🧪 Run Comprehensive Tests

Use the automated test script:

```bash
cd /home/yash/aptos-x402/python-agents
/home/yash/aptos-x402/.venv/bin/python test_agents.py
```

This will test:

- Agent status endpoints
- Payment request workflow
- Payment validation
- Agent imports and creation
- All core functionality

## 🌐 Browser Testing

Open your web browser and visit:

- `http://localhost:3001/api/status` - View agent status
- `http://localhost:3001/api/dispense/soda` - See payment request

## 🔧 Advanced Testing

### Test Agent Communication (Message Passing)

```python
# Create a simple test script
import asyncio
from fridge_agent_adk import FridgeAgent, Message

async def test_messaging():
    fridge = FridgeAgent()

    # Create a test message
    test_message = Message(
        id="test_001",
        sender_id="test_client",
        recipient_id="fridge_001",
        message_type="service_request",
        content={"service": "soda", "payment_proof": None}
    )

    # Handle the message
    response = await fridge.handle_message(test_message)
    print(f"Response: {response}")

asyncio.run(test_messaging())
```

### Test AI Decision Making

```python
from homehub_agent_adk import HomeHubAgent
import asyncio

async def test_ai_decisions():
    homehub = HomeHubAgent()

    # Test different price points
    decision1 = await homehub.ai_service.should_purchase("soda", 0.1)  # Should accept
    decision2 = await homehub.ai_service.should_purchase("soda", 2.0)  # Should reject

    print(f"Decision for 0.1 APT: {decision1}")
    print(f"Decision for 2.0 APT: {decision2}")

asyncio.run(test_ai_decisions())
```

## 📊 Expected Test Results

### ✅ Successful Tests Should Show:

- ✅ Agent servers starting without errors
- ✅ HTTP endpoints responding correctly
- ✅ Payment workflow functioning (request → validate → respond)
- ✅ AI decision making working
- ✅ Message handling operational
- ✅ Proper error responses for invalid inputs

### ❌ Common Issues and Solutions:

**Port already in use:**

```
OSError: [Errno 98] address already in use
```

Solution: Change port in `fridge_agent_adk.py` or kill existing process

**Missing dependencies:**

```
ModuleNotFoundError: No module named 'aiohttp'
```

Solution: Install dependencies:

```bash
/home/yash/aptos-x402/.venv/bin/pip install aiohttp python-dotenv
```

**Import errors:**
Make sure you're in the correct directory and using the virtual environment.

## 🎯 What Each Test Validates

1. **Status Endpoint** → Agent is running and responsive
2. **Payment Request** → AI response generation working
3. **Payment Validation** → Blockchain simulation working
4. **Agent Communication** → Message handling functional
5. **AI Decisions** → Autonomous logic working
6. **Error Handling** → Proper error responses

## 🚀 Production Testing

For production deployment, you'll also want to test:

- Real Aptos blockchain integration
- Google Gemini API responses
- Database persistence
- Load testing with multiple concurrent requests
- Agent discovery and registry
- Monitoring and logging systems

---

**🎉 That's it! Your Python ADK agents are now fully tested and ready to use!**
