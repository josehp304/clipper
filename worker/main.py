from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import uuid
from downloader import download_video
from processor import process_video
from utils import fetch_transcript, group_transcript_into_chunks, generate_srt
from llm import analyze_transcript_chunk
from firebase_utils import upload_to_firebase
from typing import List, Dict, Optional, Any

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For MVP, allow all. In prod, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for serving clips
if not os.path.exists("clips"):
    os.makedirs("clips")
app.mount("/clips", StaticFiles(directory="clips"), name="clips")

class ClipRequest(BaseModel):
    video_id: str
    start_time: float
    end_time: float
    aspect_ratio: str = "16:9"
    captions: Optional[List[Dict]] = None
    # Caption Style Options
    caption_style: Optional[Dict[str, Any]] = None

class AnalyzeRequest(BaseModel):
    video_id: str

@app.post("/analyze")
async def analyze_video(request: AnalyzeRequest):
    try:
        # 1. Fetch Transcript
        print(f"Fetching transcript for {request.video_id}...")
        transcript = fetch_transcript(request.video_id)
        
        # 2. Chunk Transcript
        print(f"Transcript length: {len(transcript)} segments. Chunking...")
        chunks = group_transcript_into_chunks(transcript)
        
        # Limit to first 3 chunks to avoid timeouts/rate limits for MVP
        processing_chunks = chunks[:3]
        
        # 3. Analyze with Groq
        print(f"Analyzing {len(processing_chunks)} chunks with Groq...")
        all_clips = []
        
        for chunk in processing_chunks:
            result = await analyze_transcript_chunk(chunk)
            if result and "clips" in result:
               all_clips.extend(result["clips"])
               
        return {
            "videoId": request.video_id,
            "clips": all_clips,
            "transcript": transcript
        }

    except Exception as e:
        print(f"Error analyzing video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clip")
async def create_clip(request: ClipRequest):
    try:
        # 1. Download Video
        raw_video_path = download_video(request.video_id)
        
        # 2. Process Clip
        clip_filename = f"{request.video_id}_{request.start_time}_{request.end_time}.mp4"
        output_path = os.path.join("clips", clip_filename)
        
        # Check if clip already exists
        if not os.path.exists(output_path):
             srt_path = None
             if request.captions:
                 print("Generating SRT for captions...")
                 srt_filename = f"temp_{uuid.uuid4()}.srt"
                 srt_path = os.path.join("clips", srt_filename)
                 srt_content = generate_srt(request.captions, request.start_time)
                 with open(srt_path, "w") as f:
                     f.write(srt_content)
             
             try:
                process_video(
                    raw_video_path, 
                    request.start_time, 
                    request.end_time, 
                    output_path, 
                    request.aspect_ratio, 
                    srt_path,
                    request.caption_style
                )
             finally:
                 # Cleanup SRT
                 if srt_path and os.path.exists(srt_path):
                     os.remove(srt_path)
        
        # 3. Upload to Firebase
        print(f"Uploading {clip_filename} to Firebase Storage...")
        firebase_url = upload_to_firebase(output_path, f"clips/{clip_filename}")
        
        # 4. Return URL
        final_url = firebase_url if firebase_url else f"http://localhost:8000/clips/{clip_filename}"
        return {"url": final_url, "status": "completed"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_video_endpoint(filename: str):
    file_path = os.path.join("clips", filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=filename
    )

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
