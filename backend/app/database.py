import os
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions

# Leemos las credenciales desde el archivo .env externo
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Falta configurar las variables SUPABASE_URL o SUPABASE_KEY en el archivo .env")
    
    # Forzamos las cabeceras globales para que la API use la Anon Key correctamente
    options = ClientOptions(
        headers={
            "ApiKey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
    )
    return create_client(SUPABASE_URL, SUPABASE_KEY, options=options)

def guardar_descarga(
    url, video_title, tipo, calidad, estado, 
    file_size_mb, download_time_seconds, 
    user_ip, user_zone, video_id, duration_seconds
):
    try:
        supabase = get_supabase_client()
        
        # Estructura JSON exacta para la API de Supabase
        data = {
            "url": url,
            "video_title": video_title,
            "tipo": tipo,
            "calidad": calidad,
            "estado": estado,
            "file_size_mb": float(file_size_mb),
            "download_time_seconds": float(download_time_seconds),
            "user_ip": user_ip,
            "user_zone": user_zone,
            "video_id": video_id,
            "duration_seconds": int(duration_seconds)
        }
        
        # Insertar fila mediante la API Web
        supabase.table("downloads").insert(data).execute()
        print("[DATABASE] ¡Fila guardada con éxito en Supabase vía API HTTP! 🎉")
        
    except Exception as e:
        print("\n❌ ❌ ❌ ERROR EN LA API DE SUPABASE ❌ ❌ ❌")
        print(f"Detalle del error: {e}\n")