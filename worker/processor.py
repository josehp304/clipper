import subprocess
import os

def hex_to_bgr(hex_color: str) -> str:
    """Converts hex #RRGGBB to &HBBGGRR format for ASS/FFmpeg."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 6:
        r, g, b = hex_color[0:2], hex_color[2:4], hex_color[4:6]
        return f"&H{b}{g}{r}"
    return "&HFFFFFF" # Default white

def process_video(input_path: str, start_time: float, end_time: float, output_path: str, aspect_ratio: str = "16:9", srt_path: str = None, caption_style: dict = None):
    """
    Cuts and optionally crops a video.
    If srt_path is provided, burns captions into the video.
    """
    duration = end_time - start_time
    
    vf_filters = []
    
    if aspect_ratio == "9:16":
        # Center crop to 9:16
        vf_filters.append('crop=ih*(9/16):ih')
    elif aspect_ratio == "1:1":
        # Center crop to 1:1
        vf_filters.append('crop=ih:ih')
    # Default is 16:9, no crop needed
    
    if srt_path:
        # Defaults
        # Scale font for vertical video
        font_size = 14 if aspect_ratio == "9:16" else 24
        primary_color = "&HFFFFFF" # White
        back_color = "&H80000000" # Semi-transparent black
        
        if caption_style:
            if 'fontSize' in caption_style:
                font_size = caption_style['fontSize']
            if 'fontColor' in caption_style:
                primary_color = hex_to_bgr(caption_style['fontColor'])
            if 'bgColor' in caption_style:
                # Assuming simple semi-transparent for now if custom color provided
                # Or user provides hex, we add &H80 prefix for alpha or just full opaque &H00
                # Let's use opacity separately if needed, but for MVP assumes opaque hex -> BGR 
                # but adds default Alpha if not specified? 
                # Let's assume input is #RRGGBB and we make it opaque background like logic &H00BBGGRR
                bgr = hex_to_bgr(caption_style['bgColor'])
                back_color = f"&H80{bgr[2:]}" # Add semi-transparency? OR just opaque?
                # Actually, standard is AABBGGRR. &H80 is 50% transparent.
                # Let's stick to user inputs #RRGGBB and we convert to &H00BBGGRR (Opaque) or &H80... (Translucent)
                # Let's map bgColor key to OutlineColour/BackColour
                back_color = f"&H00{bgr[2:]}" # Opaque background box if desired
            
        # Escape path for filter
        # Note: Windows might need different escaping, but this is Linux environment
        escaped_srt_path = srt_path.replace(":", "\\:")
        
        # Build style string
        # Outline=1 + BorderStyle=3 makes a "Box" background
        style = f"FontSize={font_size},PrimaryColour={primary_color},OutlineColour=&H00000000,BackColour={back_color},BorderStyle=3,Outline=1,Shadow=0,MarginV=20"
        
        vf_filters.append(f"subtitles='{escaped_srt_path}':force_style='{style}'")

    command = [
        'ffmpeg',
        '-y',
        '-ss', str(start_time),
        '-t', str(duration),
        '-i', input_path,
    ]
    
    if vf_filters:
        command.extend(['-vf', ','.join(vf_filters)])
        
    command.extend([
        '-c:v', 'libx264',
        '-c:a', 'aac',
        output_path
    ])
    
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"Error processing video: {e}")
        # Print stderr for debugging
        print(f"FFmpeg stderr: {e.stderr.decode()}")
        raise e
