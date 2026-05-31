#!/bin/bash
# BioLens AI local backend startup script

# Make sure we are in the backend directory
cd "$(dirname "$0")"

# Start the uvicorn development server
echo "Starting BioLens AI FastAPI backend development server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
