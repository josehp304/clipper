from typing import List, Dict

# Fetch transcript removed in favor of Groq Whisper pipeline

def group_transcript_into_chunks(transcript: List[Dict], max_chars: int = 5000) -> List[str]:
    """
    Groups transcript segments into chunks suitable for LLM context.
    Using character count as a rough proxy for token limit/context window.
    """
    chunks = []
    current_chunk = ""
    
    for segment in transcript:
        text = segment['text']
        # Add space if not empty
        if current_chunk:
            current_chunk += " "
            
        current_chunk += text
        
        # Approximate chunking based on characters
        if len(current_chunk) > max_chars:
            chunks.append(current_chunk)
            current_chunk = ""
            
    if current_chunk:
        chunks.append(current_chunk)
        
    return chunks

def format_timestamp(seconds: float) -> str:
    """Format seconds to SRT timestamp format (HH:MM:SS,mmm)."""
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hrs:02}:{mins:02}:{secs:02},{millis:03}"

def generate_srt(captions: List[Dict], clip_start_time: float) -> str:
    """
    Generates SRT content from transcript segments.
    Adjusts timestamps relative to clip_start_time.
    """
    srt_content = ""
    counter = 1
    
    for cap in captions:
        start = cap.get('start', 0)
        duration = cap.get('duration', 0)
        text = cap.get('text', '')
        
        # Adjust relative to clip start
        rel_start = start - clip_start_time
        rel_end = rel_start + duration
        
        # Skip if ends before clip starts
        if rel_end < 0:
            continue
            
        # Clamp start to 0 if it starts before clip
        if rel_start < 0:
            rel_start = 0
            
        srt_content += f"{counter}\n"
        srt_content += f"{format_timestamp(rel_start)} --> {format_timestamp(rel_end)}\n"
        srt_content += f"{text}\n\n"
        counter += 1
        
    return srt_content
