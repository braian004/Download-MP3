import os
import time
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.database import guardar_descarga
from app.downloader import download_media, get_available_formats

app = FastAPI(title="Media Downloader API", version="2.0.0")

# Permitir CORS explícito para desarrollo local sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FormatRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    download_type: str  
    quality: str        

@app.post("/api/formats")
async def api_get_formats(request: FormatRequest):
    resultado = get_available_formats(request.url)
    if resultado["status"] == "error":
        raise HTTPException(status_code=400, detail=resultado["message"])
    return resultado

@app.post("/api/download")
async def api_download(request: DownloadRequest, req_raw: Request, background_tasks: BackgroundTasks):
    try:
        inicio_tiempo = time.time()
        
        download_info = download_media(
            video_url=request.url,
            download_type=request.download_type,
            quality_option=request.quality
        )
        
        url_directa = download_info["direct_url"]
        if not url_directa:
            raise ValueError("No se pudo generar la URL de streaming.")

        tiempo_total = time.time() - inicio_tiempo
        
        # Captura de IP e información del cliente de forma segura para Supabase
        user_ip = req_raw.client.host if req_raw.client else "127.0.0.1"
        
        # Registrar de forma asíncrona en Supabase para no retrasar la descarga del usuario
        background_tasks.add_task(
            guardar_descarga,
            url=request.url,
            video_title=download_info["title"],
            tipo="audio",
            calidad=f"{request.quality}kbps",
            estado="success",
            file_size_mb=0.1,  # Estimación por streaming directo
            download_time_seconds=tiempo_total,
            user_ip=user_ip,
            user_zone="Local_App",
            video_id=download_info["video_id"],
            duration_seconds=download_info["duration"]
        )

        return {
            "status": "success",
            "title": download_info["title"],
            "download_url": url_directa,
            "video_id": download_info["video_id"]
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))