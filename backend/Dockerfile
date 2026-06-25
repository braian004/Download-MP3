# 1. Usamos una imagen oficial de Python basada en Linux Debian
FROM python:3.11-slim

# 2. Configurar variables de entorno para que Python sea eficiente en Docker
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# 4. INSTALACIÓN DE FFMPEG Y NODE.JS (Crucial para firmas de YouTube y conversiones)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 5. 🛠️ RUTA CORREGIDA: Especificamos el directorio relativo de origen y destino
COPY ./requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# 6. 🛠️ RUTA CORREGIDA: Copiar todo el contenido de backend a /app
COPY ./ ./

# 7. Exponer el puerto en el que correrá FastAPI
EXPOSE 8000

# 8. 🛠️ AJUSTE DE ENTORNO: Registramos la raíz /app para las importaciones de Python
ENV PYTHONPATH=/app

# 9. 🛠️ RUTA CORREGIDA: Apuntamos al módulo 'app.main' de forma interna
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]