#!/usr/bin/env python3
"""
Fridge Agent using Python ADK (Agent Development Kit) Pattern
This demonstrates how to build agents using established Python frameworks
"""

import asyncio
import os
import json
from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional
from datetime import datetime
import aiohttp
from aiohttp import web
import logging

# ADK-style base classes (simplified version of frameworks like uAgents, autogen, etc.)

@dataclass
class Message:
    """Standard message format for agent communication"""
    id: str
    sender_id: str
    recipient_id: str
    message_type: str
    content: Dict[str, Any]
    timestamp: str = None
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

class Agent:
    """Base Agent class following ADK patterns"""
    
    def __init__(self, agent_id: str, name: str, description: str):
        self.agent_id = agent_id
        self.name = name
        self.description = description
        self.capabilities = []
        self.message_handlers = {}
        self.logger = self._setup_logger()
        
    def _setup_logger(self):
        logger = logging.getLogger(f"Agent-{self.agent_id}")
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                f'[{self.name}] %(asctime)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        return logger
        
    def add_capability(self, capability: str):
        """Add a capability to this agent"""
        self.capabilities.append(capability)
        
    def register_handler(self, message_type: str, handler):
        """Register a message handler for specific message types"""
        self.message_handlers[message_type] = handler
        
    async def handle_message(self, message: Message) -> Optional[Message]:
        """Handle incoming messages based on registered handlers"""
        handler = self.message_handlers.get(message.message_type)
        if handler:
            return await handler(message)
        else:
            self.logger.warning(f"No handler for message type: {message.message_type}")
            return None
            
    async def send_message(self, recipient_id: str, message_type: str, content: Dict[str, Any]) -> Message:
        """Send a message to another agent"""
        message = Message(
            id=f"msg_{datetime.now().timestamp()}",
            sender_id=self.agent_id,
            recipient_id=recipient_id,
            message_type=message_type,
            content=content
        )
        self.logger.info(f"Sending {message_type} to {recipient_id}")
        return message

# Blockchain Integration (using your Aptos setup)
class AptosPaymentService:
    """Service for handling Aptos blockchain payments"""
    
    def __init__(self, network: str = "devnet"):
        self.network = network
        self.service_price = 0.1  # APT
        self.seller_address = os.getenv("SELLER_ADDRESS")
        
    async def verify_payment(self, tx_hash: str) -> bool:
        """Verify payment transaction on Aptos blockchain"""
        # This would integrate with Aptos SDK
        # For demo purposes, we'll simulate verification
        if tx_hash and tx_hash.startswith("0x") and len(tx_hash) > 10:
            return True
        return False
        
    def get_payment_info(self) -> Dict[str, Any]:
        return {
            "price": self.service_price,
            "currency": "APT",
            "recipient": self.seller_address,
            "network": self.network
        }

# AI Service Integration (using Google Gemini)
class AIResponseService:
    """Service for generating AI responses"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        
    async def generate_payment_request(self, price: float) -> str:
        """Generate AI-powered payment request message"""
        # In a real implementation, this would call Google Gemini API
        responses = [
            f"🤖 Hey there! I'd love to help you with that soda, but I need a payment of {price} APT first. Thanks!",
            f"💰 Payment required: {price} APT for your refreshing soda. Please complete the payment to proceed!",
            f"🥤 I've got ice-cold sodas ready! Just need {price} APT to dispense one for you."
        ]
        return responses[hash(str(price)) % len(responses)]
        
    async def generate_success_message(self) -> str:
        """Generate AI-powered success message"""
        responses = [
            "🎉 Payment verified! Here's your ice-cold soda. Enjoy this refreshing treat!",
            "✅ Soda dispensed successfully! Stay hydrated and have a great day!",
            "🥤 Fizzy goodness coming right up! Thanks for your payment - enjoy!"
        ]
        import random
        return random.choice(responses)

# The Fridge Agent Implementation
class FridgeAgent(Agent):
    """Smart Fridge Agent using ADK patterns"""
    
    def __init__(self):
        super().__init__(
            agent_id="fridge_001",
            name="Smart Fridge Agent",
            description="AI-powered smart fridge with payment verification"
        )
        
        # Add capabilities
        self.add_capability("soda_dispensing")
        self.add_capability("payment_verification")
        self.add_capability("ai_responses")
        
        # Initialize services
        self.payment_service = AptosPaymentService()
        self.ai_service = AIResponseService()
        
        # Register message handlers
        self.register_handler("service_request", self.handle_service_request)
        self.register_handler("payment_proof", self.handle_payment_proof)
        
        # Web server for HTTP API
        self.app = web.Application()
        self._setup_routes()
        
    def _setup_routes(self):
        """Setup HTTP routes for external API access"""
        self.app.router.add_get('/api/dispense/soda', self.http_dispense_soda)
        self.app.router.add_get('/api/status', self.http_status)
        
    async def handle_service_request(self, message: Message) -> Message:
        """Handle service requests from other agents"""
        service = message.content.get("service")
        payment_proof = message.content.get("payment_proof")
        
        if not payment_proof:
            # Request payment
            payment_info = self.payment_service.get_payment_info()
            ai_message = await self.ai_service.generate_payment_request(payment_info["price"])
            
            return await self.send_message(
                recipient_id=message.sender_id,
                message_type="payment_required",
                content={
                    "message": ai_message,
                    "payment_info": payment_info
                }
            )
        else:
            # Verify payment and provide service
            is_valid = await self.payment_service.verify_payment(payment_proof)
            if is_valid:
                success_message = await self.ai_service.generate_success_message()
                return await self.send_message(
                    recipient_id=message.sender_id,
                    message_type="service_delivered",
                    content={
                        "status": success_message,
                        "service": service
                    }
                )
            else:
                return await self.send_message(
                    recipient_id=message.sender_id,
                    message_type="payment_invalid",
                    content={
                        "error": "Payment verification failed"
                    }
                )
    
    async def http_dispense_soda(self, request):
        """HTTP endpoint for soda dispensing (compatible with your current API)"""
        payment_proof = request.headers.get("x-payment-proof")
        
        if not payment_proof:
            payment_info = self.payment_service.get_payment_info()
            ai_message = await self.ai_service.generate_payment_request(payment_info["price"])
            
            return web.json_response(
                {
                    "message": ai_message,
                    "price": payment_info["price"],
                    "recipient": payment_info["recipient"]
                },
                status=402
            )
        else:
            is_valid = await self.payment_service.verify_payment(payment_proof)
            if is_valid:
                success_message = await self.ai_service.generate_success_message()
                return web.json_response({"status": success_message})
            else:
                return web.json_response(
                    {"error": "Payment verification failed"},
                    status=400
                )
    
    async def http_status(self, request):
        """HTTP endpoint for agent status"""
        return web.json_response({
            "agent_id": self.agent_id,
            "name": self.name,
            "description": self.description,
            "capabilities": self.capabilities,
            "status": "active"
        })
    
    async def start_server(self, host="localhost", port=3000):
        """Start the HTTP server"""
        self.logger.info(f"🌐 Starting Fridge Agent server on http://{host}:{port}")
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, host, port)
        await site.start()
        self.logger.info("✅ Fridge Agent server started successfully")

# Agent Registry (ADK pattern for agent discovery)
class AgentRegistry:
    """Registry for managing multiple agents"""
    
    def __init__(self):
        self.agents = {}
        
    def register_agent(self, agent: Agent):
        """Register an agent with the registry"""
        self.agents[agent.agent_id] = agent
        
    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get an agent by ID"""
        return self.agents.get(agent_id)
        
    def list_agents(self):
        """List all registered agents"""
        return list(self.agents.values())

# Main execution
async def main():
    """Main function to start the Fridge Agent"""
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create and start the fridge agent
    fridge_agent = FridgeAgent()
    
    # Start the HTTP server
    await fridge_agent.start_server()
    
    print("===============================================================")
    print(f"🤖 {fridge_agent.name} is running using Python ADK patterns")
    print(f"🔗 Agent ID: {fridge_agent.agent_id}")
    print(f"💡 Capabilities: {', '.join(fridge_agent.capabilities)}")
    print(f"🌐 HTTP API: http://localhost:3000")
    print("===============================================================")
    
    # Keep the server running
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Fridge Agent...")

if __name__ == "__main__":
    asyncio.run(main())