#!/usr/bin/env python3
"""
Simulation Mode Demo - Python ADK Agents with Mock Payments
This demonstrates the full workflow without requiring real blockchain credentials
"""

import asyncio
import os
import json
from datetime import datetime

# Set simulation environment variables
os.environ['SIMULATION_MODE'] = 'true'
os.environ['BUYER_PRIVATE_KEY'] = 'simulation_key_12345'
os.environ['SELLER_ADDRESS'] = '0xsimulation_seller_address'

from homehub_agent_adk import HomeHubAgent
from fridge_agent_adk import FridgeAgent

async def simulation_demo():
    """Run a complete simulation of agent interaction"""
    
    print("🎬 Python ADK Agents - Full Simulation Demo")
    print("=" * 60)
    
    # Start Fridge Agent (without HTTP server for this demo)
    print("🚀 Initializing Fridge Agent...")
    fridge_agent = FridgeAgent()
    
    print("🚀 Initializing HomeHub Agent...")  
    homehub_agent = HomeHubAgent()
    
    print("\n📋 Agent Capabilities:")
    print(f"Fridge Agent: {', '.join(fridge_agent.capabilities)}")
    print(f"HomeHub Agent: {', '.join(homehub_agent.capabilities)}")
    
    print("\n🎭 Starting Agent-to-Agent Interaction...")
    print("-" * 40)
    
    # Simulate the full workflow with direct agent communication
    from fridge_agent_adk import Message
    
    # Step 1: HomeHub requests soda without payment
    print("1️⃣ HomeHub requesting soda service...")
    request_msg = Message(
        id="msg_001",
        sender_id=homehub_agent.agent_id,
        recipient_id=fridge_agent.agent_id,
        message_type="service_request",
        content={"service": "soda", "payment_proof": None}
    )
    
    # Fridge Agent processes the request
    payment_response = await fridge_agent.handle_message(request_msg)
    print(f"💰 Fridge Agent response: {payment_response.content.get('message', 'Payment required')}")
    
    # Step 2: HomeHub receives payment request and decides
    print("\n2️⃣ HomeHub making AI-powered purchase decision...")
    payment_info = payment_response.content.get('payment_info', {})
    price = payment_info.get('price', 0.1)
    
    decision = await homehub_agent.ai_service.should_purchase('soda', price)
    print(f"🤖 AI Decision: {decision['reasoning']}")
    
    if decision['decision']:
        # Step 3: HomeHub makes simulated payment
        print("\n3️⃣ HomeHub processing payment...")
        payment_result = await homehub_agent.payment_client.make_payment(
            price, 
            payment_info.get('recipient', 'simulation_address')
        )
        
        if payment_result['success']:
            print(f"✅ Payment successful: {payment_result['transaction_hash']}")
            
            # Step 4: Request service with payment proof
            print("\n4️⃣ HomeHub requesting soda with payment proof...")
            paid_request_msg = Message(
                id="msg_002",
                sender_id=homehub_agent.agent_id,
                recipient_id=fridge_agent.agent_id,
                message_type="service_request",
                content={
                    "service": "soda", 
                    "payment_proof": payment_result['transaction_hash']
                }
            )
            
            # Fridge Agent verifies payment and delivers service
            service_response = await fridge_agent.handle_message(paid_request_msg)
            print(f"🥤 Service delivered: {service_response.content.get('status', 'Soda dispensed!')}")
            
            # Step 5: HomeHub celebrates success
            success_msg = await homehub_agent.ai_service.generate_success_message('soda')
            print(f"🎉 HomeHub: {success_msg}")
            
    print("\n" + "=" * 60)
    print("✅ Complete ADK Agent Workflow Demonstrated!")
    print("🔄 In production, this would run continuously with real blockchain")
    print("💡 Both agents operated autonomously using AI decision-making")

if __name__ == "__main__":
    asyncio.run(simulation_demo())