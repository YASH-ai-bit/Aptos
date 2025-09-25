#!/usr/bin/env python3
"""
HomeHub Agent using Python ADK (Agent Development Kit) Pattern
This demonstrates autonomous agent behavior with decision-making capabilities
"""

import asyncio
import os
import json
import aiohttp
from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional
from datetime import datetime
import logging

# Import base classes from fridge_agent_adk (in real ADK, these would be separate modules)
from fridge_agent_adk import Agent, Message

# AI Decision Making Service
class AIDecisionService:
    """Service for AI-powered decision making"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.decision_threshold = 1.0  # Maximum price willing to pay in APT
        
    async def should_purchase(self, service: str, price: float) -> Dict[str, Any]:
        """AI decides whether to purchase a service"""
        # In a real implementation, this would use Gemini API for complex decisions
        decision = price <= self.decision_threshold
        
        reasoning = (
            f"💭 The price of {price} APT for {service} is {'acceptable' if decision else 'too expensive'}. "
            f"My budget threshold is {self.decision_threshold} APT."
        )
        
        return {
            "decision": decision,
            "reasoning": reasoning,
            "confidence": 0.85 if decision else 0.95
        }
    
    async def generate_request_message(self, service: str) -> str:
        """Generate a natural request message"""
        requests = [
            f"🏠 Hi there! I'd like to request {service} service. Can you help me?",
            f"🤖 Hello! I need {service}. What do I need to do to get it?",
            f"👋 Good day! I'm interested in your {service} service. Please let me know how to proceed."
        ]
        return requests[hash(service) % len(requests)]
    
    async def generate_success_message(self, service: str) -> str:
        """Generate success confirmation message"""
        messages = [
            f"🎉 Perfect! Successfully obtained {service}. Mission accomplished!",
            f"✅ Great! The {service} transaction completed successfully. Very satisfied!",
            f"🌟 Excellent! {service} acquired as planned. Everything went smoothly!"
        ]
        import random
        return random.choice(messages)

# Blockchain Payment Service (for HomeHub as buyer)
class AptosPaymentClient:
    """Client for making payments on Aptos blockchain"""
    
    def __init__(self):
        self.private_key = os.getenv("BUYER_PRIVATE_KEY")
        self.network = "devnet"
        
    async def make_payment(self, amount: float, recipient: str) -> Dict[str, Any]:
        """Make a payment transaction"""
        # In a real implementation, this would use Aptos SDK
        # For demo purposes, we simulate a successful transaction
        if self.private_key and recipient:
            # Simulate transaction hash
            tx_hash = f"0x{''.join(f'{ord(c):02x}' for c in f'{amount}{recipient}{datetime.now().timestamp()}')[:64]}"
            
            return {
                "success": True,
                "transaction_hash": tx_hash,
                "amount": amount,
                "recipient": recipient,
                "network": self.network
            }
        else:
            return {
                "success": False,
                "error": "Missing private key or recipient address"
            }
    
    def get_wallet_info(self) -> Dict[str, Any]:
        """Get wallet information"""
        return {
            "network": self.network,
            "has_private_key": bool(self.private_key),
            "supported_currencies": ["APT"]
        }

# The HomeHub Agent Implementation
class HomeHubAgent(Agent):
    """Autonomous Home Assistant Agent using ADK patterns"""
    
    def __init__(self):
        super().__init__(
            agent_id="homehub_001",
            name="HomeHub Agent",
            description="Autonomous home assistant with payment capabilities"
        )
        
        # Add capabilities
        self.add_capability("autonomous_purchasing")
        self.add_capability("blockchain_payments")
        self.add_capability("ai_decision_making")
        self.add_capability("service_integration")
        
        # Initialize services
        self.ai_service = AIDecisionService()
        self.payment_client = AptosPaymentClient()
        
        # Register message handlers
        self.register_handler("payment_required", self.handle_payment_required)
        self.register_handler("service_delivered", self.handle_service_delivered)
        self.register_handler("payment_invalid", self.handle_payment_invalid)
        
        # Task queue for autonomous operations
        self.task_queue = asyncio.Queue()
        self.active_transactions = {}
        
    async def handle_payment_required(self, message: Message) -> Optional[Message]:
        """Handle payment requests from service providers"""
        payment_info = message.content.get("payment_info", {})
        price = payment_info.get("price", 0)
        recipient = payment_info.get("recipient")
        service_name = self.active_transactions.get(message.sender_id, {}).get("service", "unknown service")
        
        self.logger.info(f"💳 Payment required: {price} APT for {service_name}")
        
        # Use AI to decide whether to pay
        decision_info = await self.ai_service.should_purchase(service_name, price)
        self.logger.info(decision_info["reasoning"])
        
        if decision_info["decision"]:
            # AI decided to pay - execute payment
            payment_result = await self.payment_client.make_payment(price, recipient)
            
            if payment_result["success"]:
                self.logger.info(f"✅ Payment successful: {payment_result['transaction_hash']}")
                
                # Store transaction info
                if message.sender_id not in self.active_transactions:
                    self.active_transactions[message.sender_id] = {}
                self.active_transactions[message.sender_id]["payment_hash"] = payment_result["transaction_hash"]
                
                # Send service request with payment proof
                return await self.send_message(
                    recipient_id=message.sender_id,
                    message_type="service_request",
                    content={
                        "service": service_name,
                        "payment_proof": payment_result["transaction_hash"]
                    }
                )
            else:
                self.logger.error(f"❌ Payment failed: {payment_result.get('error')}")
                return None
        else:
            self.logger.info("🚫 AI decided not to purchase - price too high")
            return await self.send_message(
                recipient_id=message.sender_id,
                message_type="purchase_declined",
                content={
                    "reason": decision_info["reasoning"],
                    "max_budget": self.ai_service.decision_threshold
                }
            )
    
    async def handle_service_delivered(self, message: Message) -> Optional[Message]:
        """Handle successful service delivery"""
        service_status = message.content.get("status", "Service delivered")
        self.logger.info(f"🎉 Service delivered: {service_status}")
        
        # Generate AI success message
        service_name = self.active_transactions.get(message.sender_id, {}).get("service", "service")
        success_msg = await self.ai_service.generate_success_message(service_name)
        self.logger.info(success_msg)
        
        # Clean up transaction tracking
        if message.sender_id in self.active_transactions:
            del self.active_transactions[message.sender_id]
            
        return None  # Transaction complete
    
    async def handle_payment_invalid(self, message: Message) -> Optional[Message]:
        """Handle payment validation failures"""
        error = message.content.get("error", "Payment verification failed")
        self.logger.error(f"❌ Payment issue: {error}")
        
        # Could implement retry logic here
        return None
    
    async def request_service_from_agent(self, agent_endpoint: str, service: str):
        """Request a service from another agent via direct communication"""
        try:
            # Store transaction context
            agent_id = f"agent_{hash(agent_endpoint) % 10000}"
            self.active_transactions[agent_id] = {"service": service}
            
            # Generate AI request message
            request_msg = await self.ai_service.generate_request_message(service)
            self.logger.info(f"🤖 {request_msg}")
            
            # Send initial service request
            await self.send_message(
                recipient_id=agent_id,
                message_type="service_request",
                content={
                    "service": service,
                    "payment_proof": None  # No payment yet
                }
            )
            
        except Exception as e:
            self.logger.error(f"Failed to request service: {e}")
    
    async def request_service_via_http(self, endpoint_url: str, service: str = "soda"):
        """Request a service via HTTP API (compatible with your current setup)"""
        try:
            self.logger.info(f"🌐 Requesting {service} from {endpoint_url}")
            
            # Generate AI request message
            request_msg = await self.ai_service.generate_request_message(service)
            self.logger.info(f"🤖 {request_msg}")
            
            async with aiohttp.ClientSession() as session:
                # First request without payment
                async with session.get(endpoint_url) as response:
                    if response.status == 402:  # Payment required
                        payment_info = await response.json()
                        self.logger.info(f"💳 Payment required: {payment_info}")
                        
                        # Use AI to decide on payment
                        decision_info = await self.ai_service.should_purchase(
                            service, payment_info.get("price", 0)
                        )
                        self.logger.info(decision_info["reasoning"])
                        
                        if decision_info["decision"]:
                            # Make payment
                            payment_result = await self.payment_client.make_payment(
                                payment_info["price"], 
                                payment_info["recipient"]
                            )
                            
                            if payment_result["success"]:
                                self.logger.info(f"✅ Payment sent: {payment_result['transaction_hash']}")
                                
                                # Retry request with payment proof
                                headers = {"x-payment-proof": payment_result["transaction_hash"]}
                                async with session.get(endpoint_url, headers=headers) as retry_response:
                                    if retry_response.status == 200:
                                        result = await retry_response.json()
                                        success_msg = await self.ai_service.generate_success_message(service)
                                        self.logger.info(f"🎉 {success_msg}")
                                        self.logger.info(f"📦 Service response: {result.get('status')}")
                                    else:
                                        self.logger.error(f"❌ Service request failed: {retry_response.status}")
                            else:
                                self.logger.error(f"❌ Payment failed: {payment_result.get('error')}")
                        else:
                            self.logger.info("🚫 AI declined to purchase - budget exceeded")
                    else:
                        # Service available without payment
                        result = await response.json()
                        self.logger.info(f"🎉 Service obtained: {result}")
                        
        except Exception as e:
            self.logger.error(f"Failed to request service via HTTP: {e}")
    
    async def start_autonomous_mode(self):
        """Start autonomous operation mode"""
        self.logger.info("🚀 Starting autonomous mode...")
        
        # Example autonomous task: regularly check for soda availability
        while True:
            try:
                await asyncio.sleep(10)  # Wait 10 seconds between checks
                
                # Autonomous decision: do I need a soda?
                if len(self.active_transactions) == 0:  # No pending transactions
                    self.logger.info("🤔 Checking if I need any services...")
                    
                    # In a real implementation, this could be based on schedules,
                    # sensor data, user preferences, etc.
                    import random
                    if random.random() < 0.1:  # 10% chance to request service
                        await self.request_service_via_http(
                            "http://localhost:3001/api/dispense/soda", 
                            "soda"
                        )
                        
            except KeyboardInterrupt:
                self.logger.info("🛑 Stopping autonomous mode")
                break
            except Exception as e:
                self.logger.error(f"Error in autonomous mode: {e}")
                await asyncio.sleep(5)  # Wait before retrying

# Task Management System
class TaskManager:
    """Manages autonomous agent tasks"""
    
    def __init__(self, agent: HomeHubAgent):
        self.agent = agent
        self.scheduled_tasks = []
        
    async def schedule_service_request(self, delay: float, endpoint: str, service: str):
        """Schedule a service request for later execution"""
        await asyncio.sleep(delay)
        await self.agent.request_service_via_http(endpoint, service)
        
    async def run_demo_sequence(self):
        """Run a demonstration sequence"""
        self.agent.logger.info("🎬 Starting demo sequence...")
        
        # Wait a moment, then request a soda
        await asyncio.sleep(2)
        await self.agent.request_service_via_http(
            "http://localhost:3001/api/dispense/soda", 
            "soda"
        )

# Main execution
async def main():
    """Main function to start the HomeHub Agent"""
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create the HomeHub agent
    homehub_agent = HomeHubAgent()
    task_manager = TaskManager(homehub_agent)
    
    print("===============================================================")
    print(f"🤖 {homehub_agent.name} is active using Python ADK patterns")
    print(f"🔗 Agent ID: {homehub_agent.agent_id}")
    print(f"💡 Capabilities: {', '.join(homehub_agent.capabilities)}")
    print(f"🎯 Goal: Autonomous service acquisition with AI decision-making")
    print("===============================================================")
    
    # Start demo sequence
    await task_manager.run_demo_sequence()
    
    print("\n🏁 Demo sequence completed. Agent is now in standby mode.")
    print("💡 In a real implementation, this would run autonomously 24/7")

if __name__ == "__main__":
    asyncio.run(main())