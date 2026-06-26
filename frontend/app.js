const API_BASE_URL = "https://mp3-downloader-backend-qyz8.onrender.coms";

// Cargar historial persistente local en la inicialización
document.addEventListener("DOMContentLoaded", actualizarHistorialUI);

async function analizarVideo() {
    const urlInputEl = document.getElementById('urlInput');
    let urlInput = urlInputEl ? urlInputEl.value.trim() : "";
    
    if (!urlInput) {
        alert("Por favor, ingresa una URL de YouTube válida.");
        return;
    }
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultCard = document.getElementById('resultCard');
    const optionsContainer = document.getElementById('optionsContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    
    // Cambiar estado visual a carga
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> ANALYZING...`;

    resultCard.classList.add('hidden');
    loadingContainer.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/formats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlInput })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "El servidor rechazó la solicitud.");
        }

        const data = await response.json();
        
        if (data.status === 'success') {
            const titleEl = document.getElementById('videoTitle');
            titleEl.innerText = data.title;
            titleEl.setAttribute('data-video-id', data.video_id);
            document.getElementById('videoThumbnail').src = `https://img.youtube.com/vi/${data.video_id}/mqdefault.jpg`;

            // Inyectar el botón de acción de música HQ
            const audioQualitiesBlock = document.getElementById('audioQualitiesBlock');
            audioQualitiesBlock.innerHTML = `
                <button onclick="descargarMedia('320', 'audio')" class="w-full bg-[#05070c] hover:bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/30 text-slate-300 text-[11px] font-semibold uppercase px-4 py-3.5 rounded-xl flex justify-between items-center transition-all duration-300">
                    <span class="flex items-center gap-2"><i class="fa-solid fa-file-audio text-emerald-400"></i> MP3 Audio Estándar Max (320kbps)</span> 
                    <span class="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-[9px] tracking-wider shadow-[0_2px_10px_rgba(16,185,129,0.3)]">EXTRAER</span>
                </button>
            `;

            optionsContainer.classList.remove('hidden');
            resultCard.classList.remove('hidden'); 
        } else {
            throw new Error(data.message || "Error al procesar formatos multimedia.");
        }
    } catch (error) {
        console.error(error);
        alert("Fallo de Análisis: " + error.message + "\nVerifica que tu API en el puerto 8000 esté encendida.");
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass text-xs"></i> Analizar`;
    }
}

async function descargarMedia(qualityOption, tipoDescarga) {
    let urlInput = document.getElementById('urlInput').value.trim();
    const videoTitle = document.getElementById('videoTitle').innerText;
    const videoId = document.getElementById('videoTitle').getAttribute('data-video-id') || "";
    
    const optionsContainer = document.getElementById('optionsContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    const mainCard = document.getElementById('mainContainerCard');
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');
    
    const playerContainer = document.getElementById('playerContainer');
    const inlineAudioPlayer = document.getElementById('inlineAudioPlayer');
    
    const soundElectricity = document.getElementById('soundElectricity');
    const soundSuccess = document.getElementById('soundSuccess');

    document.getElementById('downloadingFileName').innerText = `${videoTitle}.mp3`;

    optionsContainer.classList.add('hidden');
    loadingContainer.classList.remove('hidden');
    mainCard.classList.remove('card-success-flash');
    
    progressBar.style.width = "40%"
    statusText.innerText = "AISLANDO SEÑAL MULTIMEDIA...";

    if (soundElectricity) {
        soundElectricity.currentTime = 0;
        soundElectricity.play().catch(() => {});
    }

    try {
        const response = await fetch(`${API_BASE_URL}/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                url: urlInput, 
                download_type: "1", 
                quality: qualityOption 
            })
        });

        if (!response.ok) throw new Error("Fallo en la descarga del Stream.");
        const enlacesMedia = await response.json();
        
        if (!enlacesMedia.download_url) throw new Error("No se obtuvo una URL de descarga válida.");

        // Detener sonidos eléctricos e iniciar el de éxito
        if (soundElectricity) soundElectricity.pause();
        if (soundSuccess) {
            soundSuccess.currentTime = 0;
            soundSuccess.play().catch(() => {});
        }

        // Animación dorada de éxito al 100%
        progressBar.style.width = "100%";
        statusText.innerText = "¡AUDIO EXTRAÍDO CON ÉXITO! ✅";
        statusText.className = "text-xs font-bold text-yellow-400";
        mainCard.classList.add('card-success-flash');

        guardarEnHistorial(videoTitle, videoId);
        
        // Cargar audio directamente en el reproductor nativo de tu página
        if (inlineAudioPlayer && playerContainer) {
            inlineAudioPlayer.src = enlacesMedia.download_url;
            inlineAudioPlayer.load();
            playerContainer.classList.remove('hidden');
        }
        
        // Forzar descarga de archivo de fondo
        const linkInvisible = document.createElement('a');
        linkInvisible.href = enlacesMedia.download_url;
        linkInvisible.download = `${videoTitle}.mp3`;
        document.body.appendChild(linkInvisible);
        linkInvisible.click();
        linkInvisible.remove();

        setTimeout(() => {
            loadingContainer.classList.add('hidden');
            optionsContainer.classList.remove('hidden');
            statusText.className = "text-xs font-bold text-emerald-400";
        }, 4000);

    } catch (error) {
        if (soundElectricity) soundElectricity.pause();
        alert("Error de Descarga: " + error.message);
        loadingContainer.classList.add('hidden');
        optionsContainer.classList.remove('hidden');
    }
}

function guardarEnHistorial(titulo, videoId) {
    let historial = JSON.parse(localStorage.getItem('yt_music_history')) || [];
    historial = historial.filter(item => item.titulo !== titulo);
    
    historial.unshift({
        titulo,
        videoId,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    if (historial.length > 4) historial.pop();
    localStorage.setItem('yt_music_history', JSON.stringify(historial));
    actualizarHistorialUI();
}

function actualizarHistorialUI() {
    const recentContainer = document.getElementById('recentDownloads');
    if (!recentContainer) return;

    const historial = JSON.parse(localStorage.getItem('yt_music_history')) || [];
    recentContainer.innerHTML = "";

    if (historial.length === 0) {
        recentContainer.innerHTML = `
            <div class="col-span-2 text-center py-4 bg-[#121929]/20 border border-white/[0.02] rounded-xl text-[10px] text-slate-500 uppercase tracking-wider">
                Sin pistas grabadas en esta sesión.
            </div>
        `;
        return;
    }

    historial.forEach(item => {
        const card = document.createElement('div');
        card.className = "bg-[#121929]/40 border border-white/[0.04] p-3 rounded-2xl flex items-center gap-3.5 hover:border-emerald-500/20 transition-all duration-300";
        
        card.innerHTML = `
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs text-emerald-400 flex-shrink-0">
                <i class="fa-solid fa-headphones"></i>
            </div>
            <div class="min-w-0 flex-grow">
                <h4 class="text-[11px] font-semibold text-white truncate pr-2">${item.titulo}</h4>
                <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[8px] font-bold text-emerald-400 uppercase bg-[#05070c] px-1.5 py-0.5 rounded border border-white/[0.04]">MP3 HQ</span>
                    <span class="text-[8px] font-medium text-slate-500"><i class="fa-solid fa-clock mr-0.5"></i> ${item.fecha}</span>
                </div>
            </div>
        `;
        recentContainer.appendChild(card);
    });
}