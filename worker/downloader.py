import yt_dlp
import os

def download_video(video_id: str, output_dir: str = "downloads", quality: str = "1080p") -> str:
    """
    Downloads a YouTube video using yt-dlp.
    Returns the path to the downloaded video file.
    quality: e.g., "1080p", "720p", "480p", "360p"
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    # Extract height number from quality string (e.g., "1080p" -> 1080)
    try:
        height = int(quality.replace('p', ''))
    except ValueError:
        height = 1080 # Default fallback
        
    # Suffix filename with quality to avoid collision if different qualities are requested
    output_template = os.path.join(output_dir, f"{video_id}_{quality}.%(ext)s")
    
    # yt-dlp format string: Best video with height <= X + Best Audio
    # Removed strict extension checks to avoid "Requested format not available" errors
    # We rely on merge_output_format to convert to mp4 if needed
    format_str = f'bestvideo[height<={height}]+bestaudio/best[height<={height}]/best'
    
    # Look for cookies.txt in the project root (one level up from worker)
    # Or current directory, or specified via env var
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cookies_path = os.path.join(project_root, "cookies.txt")
    
    if not os.path.exists(cookies_path):
        # Fallback to current directory
        cookies_path = "cookies.txt"

    ydl_opts = {
        'format': format_str,
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'merge_output_format': 'mp4', # Ensure output is mp4
    }
    
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info_dict)
        
    return filename

def download_audio(video_id: str, output_dir: str = "downloads") -> str:
    """
    Downloads the audio of a YouTube video using yt-dlp.
    Returns the path to the downloaded audio file.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    url = f"https://www.youtube.com/watch?v={video_id}"
    # Download best audio, prefer m4a for compatibility
    output_template = os.path.join(output_dir, f"{video_id}.%(ext)s")
    
    # Look for cookies.txt
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cookies_path = os.path.join(project_root, "cookies.txt")
    
    if not os.path.exists(cookies_path):
        cookies_path = "cookies.txt"
    
    ydl_opts = {
        'format': 'bestaudio/best', # Relaxed from [ext=m4a]
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'm4a',
        }],
    }
    
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info_dict)
        
    # Post-processor converts to m4a, so update filename extension
    base, _ = os.path.splitext(filename)
    return f"{base}.m4a"
