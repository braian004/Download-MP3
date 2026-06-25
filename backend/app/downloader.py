import yt_dlp

def download_media(video_url: str, download_type: str, quality_option: str) -> dict:
    """
    Extrae los metadatos completos y la URL directa filtrando por el tipo y calidad seleccionados.
    """
    # Si download_type es "1" (Audio), descarga el mejor audio disponible.
    # Si es Video, busca el formato de video que coincida con la altura (height) solicitada.
    if download_type == "1":
        formato_seleccionado = 'bestaudio/best'
    else:
        # Pide el formato que tenga la calidad elegida (ej. 1080p) con audio integrado, o el mejor en su defecto
        formato_seleccionado = f'bestvideo[height<={quality_option}]+bestaudio/best[height<={quality_option}]/best'

    ydl_opts = {
        'format': formato_seleccionado,
        'cookiefile': 'cookies.txt',  
        'noplaylist': True,
        'extract_flat': False,
        # Evita descargar archivos de descripción pesados
        'skip_download': True, 
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(video_url, download=False)
        
        # Intentar extraer la URL del formato seleccionado de manera precisa
        direct_url = info_dict.get("url")
        if not direct_url and info_dict.get("formats"):
            # Si no está en la raíz, busca el último formato que coincide (el de mejor calidad procesado)
            direct_url = info_dict["formats"][-1].get("url")

    return {
        "direct_url": direct_url,
        "title": info_dict.get("title", "Sin título"),
        "video_id": info_dict.get("id"),
        "duration": info_dict.get("duration", 0),
        "file_size_mb": 0.0,
        "download_time_seconds": 0.1
    }

def get_available_formats(video_url: str) -> dict:
    ydl_opts = {
        'noplaylist': True,
        'extract_flat': False,
        'cookiefile': 'cookies.txt',
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            formats = info.get('formats', [])
            
            available_heights = set()
            for f in formats:
                height = f.get('height')
                # Solo tomamos formatos válidos que incluyan video continuo
                if height and height in [144, 240, 360, 480, 720, 1080, 1440, 2160]:
                    available_heights.add(str(height))
            
            return {
                "status": "success",
                "title": info.get('title', 'Video'),
                "available_video_qualities": sorted(list(available_heights), key=int, reverse=True)
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}