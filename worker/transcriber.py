import os
import subprocess
from groq import Groq
from typing import List, Dict

def get_groq_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set")
    return Groq(api_key=api_key)

def compress_audio(input_path: str, output_dir: str = "downloads") -> str:
    """
    Compresses audio using ffmpeg to reduce file size for API limits.
    Converts to 16kHz mono mp3 at 32k bitrate.
    """
    filename = os.path.basename(input_path)
    name, _ = os.path.splitext(filename)
    output_path = os.path.join(output_dir, f"{name}_compressed.mp3")

    if os.path.exists(output_path):
        os.remove(output_path)

    command = [
        "ffmpeg",
        "-i", input_path,
        "-ar", "16000",       # 16kHz sampling rate
        "-ac", "1",           # Mono
        "-vn",                # No video (just in case)
        "-c:a", "libmp3lame", # MP3 codec
        "-b:a", "32k",        # 32k bitrate
        "-y",                 # Overwrite output file
        output_path
    ]

    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"Error compressing audio: {e}")
        raise e

def transcribe_audio(audio_path: str) -> List[Dict]:
    """
    Transcribes audio using Groq's Whisper API.
    Returns a list of segments with 'text', 'start', 'duration'.
    """
    client = get_groq_client()
    
    with open(audio_path, "rb") as file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), file.read()),
            model="whisper-large-v3",
            response_format="verbose_json",
        )
    
    # Normalize result to match youtube_transcript_api format
    # Groq/Whisper returns: {'text': ..., 'segments': [{'start': 0.0, 'end': 1.0, 'text': ...}, ...]}
    
    segments = transcription.segments
    formatted_transcript = []
    
    for segment in segments:
        formatted_transcript.append({
            "text": segment["text"].strip(),
            "start": segment["start"],
            "duration": segment["end"] - segment["start"]
        })
        
    return formatted_transcript
