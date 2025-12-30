# Academic YouTube Clipper MVP

## Overview
This is a research prototype demonstrating an AI-driven pipeline for extracting engaging short-form clips from long-form YouTube videos. It emphasizes explainability and modular architecture over production scalability.

## System Architecture
The system consists of two main components:
1. **Frontend & Orchestrator (Next.js)**: Handles user interaction, transcript retrieval, and AI reasoning (via Groq).
2. **Worker Service (Python)**: Performs heavy media processing (downloading, cutting, cropping) using `yt-dlp` and `ffmpeg`.

### Data Flow
1. User inputs YouTube URL.
2. Next.js fetches transcript and sends chunks to Groq LLM.
3. LLM identifies "clip-worthy" segments with reasoning.
4. User clicks "Generate" on a specific segment.
5. Setup: Worker service downloads video and processes the specific timestamp.
6. Worker serves the processed file back to the user.

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.8+
- FFmpeg installed (`sudo apt install ffmpeg` or brew)
- Groq API Key

### 1. Frontend Setup
```bash
npm install
# Create .env.local with:
# GROQ_API_KEY=your_key_here
npm run dev
```

### 2. Worker Setup
```bash
cd worker
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
The worker runs on `http://localhost:8000`.

## Notes for Evaluators
- The video processing is done locally to avoid serverless timeouts and costs.
- The `clips/` directory in `worker/` will contain generated video files.
