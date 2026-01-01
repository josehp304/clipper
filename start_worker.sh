#!/bin/bash
# Script to setup and run the clipper worker

# Ensure we are in the project root or handle paths correctly
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR/worker" || exit 1

echo "Setting up Python environment..."

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Created venv."
fi

# Activate venv
source venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the worker
echo "Starting worker..."
python main.py
