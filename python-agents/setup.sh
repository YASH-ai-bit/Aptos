#!/bin/bash
# Python ADK Setup Script
# This script sets up the Python Agent Development Kit environment

echo "==============================================================="
echo "🐍 Setting up Python Agent Development Kit (ADK)"
echo "==============================================================="

# Check if Python 3.8+ is available
python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "📋 Python version: $python_version"

if (( $(echo "$python_version < 3.8" | bc -l) )); then
    echo "❌ Python 3.8+ required. Please upgrade your Python installation."
    exit 1
fi

# Create virtual environment
echo "🔧 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing Python ADK requirements..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️ Creating environment configuration file..."
    cat > .env << EOF
# Python Agent ADK Configuration
# Copy your values from the main project

# Aptos Configuration
SELLER_ADDRESS=0x93c19685e270b91d7c7ae30fb09d63bac55775cb26f1485bc7b1fa22d9c9354b
BUYER_PRIVATE_KEY=0x0538f9785138cb0da5a3cf44c258e165d10a229d92c70444dae0aef58f385bbc

# AI Configuration  
GEMINI_API_KEY=AIzaSyC-xlGJuwt5vo5VGF-8rgkOOXGGdlDgV10

# Agent Configuration
DEFAULT_NETWORK=devnet
LOG_LEVEL=INFO
AGENT_PORT_FRIDGE=3000
AGENT_PORT_HOMEHUB=3001

# Optional: Additional AI APIs
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
EOF
    echo "📝 Created .env file - please update with your actual API keys"
else
    echo "✅ Environment file already exists"
fi

echo ""
echo "==============================================================="
echo "✅ Python ADK setup completed!"
echo "==============================================================="
echo "📋 Next steps:"
echo "   1. Activate virtual environment: source venv/bin/activate"
echo "   2. Update .env file with your API keys"
echo "   3. Run fridge agent: python fridge_agent_adk.py"
echo "   4. Run homehub agent: python homehub_agent_adk.py"
echo "   5. Try advanced demo: python advanced_adk_example.py"
echo ""
echo "🔗 Your existing Node.js agents will continue to work alongside these!"
echo "==============================================================="