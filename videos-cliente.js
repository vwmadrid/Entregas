// ==========================================
// 🎥 SISTEMA MULTIMEDIA Y GUÍAS DE VÍDEO (CLIENTES)
// ==========================================

window.videoDictionary = {
    "POLO": [ { id: "bxk6-Y1IYqI", title: "Presentación" } ],
    "TCROSS": [ { id: "GgMFWXoIrow", title: "Presentación" }, { id: "X3Na5dnsg-U", title: "Frenada de emergencia" } ],
    "GOLF": [ { id: "_KGEUPY1_L4", title: "Presentación" } ],
    "PASSAT": [ { id: "xg5yWdxLjnQ", title: "Presentación" } ],
    "TIGUAN": [ { id: "UOqeK51kriw", title: "Presentación" } ],
    "TAYRON": [ { id: "A-12YvB_kdg", title: "Presentación" } ],
    "TROC": [ { id: "s2OTyfxNcWY", title: "Presentación" } ],
    "TOUAREG": [ { id: "azQz9t26XPU", title: "Presentación" }, { id: "npcvuUCBo1U", title: "Suspensión neumática" } ],
    "TAIGO": [ { id: "V_ySP0h4G5o", title: "Presentación" } ],
    "CADDY": [ { id: "uJZhDE0BTHM", title: "Presentación" } ],
    "MULTIVAN": [ { id: "7sfAIGUnnas", title: "Presentación" } ],
    "CRAFTER": [ { id: "RP_QlToJxvM", title: "Presentación" } ],
    "TRANSPORTER": [ { id: "7sfAIGUnnas", title: "Presentación" } ],
    "IDBUZZ": [ { id: "1VOEbyTnlnA", title: "Volante" }, { id: "PoDRglz1958", title: "Control Batería" }, { id: "T8dHxbyFS7k", title: "Recargas" } ],
    "ID3": [ { id: "oFA1YxoDbJo", title: "Presentación" }, { id: "1VOEbyTnlnA", title: "Volante" }, { id: "PoDRglz1958", title: "Control Batería" }, { id: "T8dHxbyFS7k", title: "Recargas" }, { id: "S3SreCeLKRo", title: "I.D Light" }, { id: "hyt0zJ1xDx0", title: "Side Assist" } ],
    "ID4": [ { id: "ucX88AZTWwM", title: "Presentación" }, { id: "GEqyViG2zVo", title: "Interior" }, { id: "1VOEbyTnlnA", title: "Volante" }, { id: "WNvKN_z8Bc0", title: "Pantalla" }, { id: "PoDRglz1958", title: "Control Batería" }, { id: "T8dHxbyFS7k", title: "Recargas" }, { id: "V9yGN6fSPvU", title: "Programar cargas" }, { id: "JXrs7-ZyZbo", title: "Encendido auto" }, { id: "S3SreCeLKRo", title: "I.D Light" }, { id: "hyt0zJ1xDx0", title: "Side Assist" } ],
    "ID5": [ { id: "JdA5gJ3XuiM", title: "Presentación" }, { id: "1VOEbyTnlnA", title: "Volante" }, { id: "PoDRglz1958", title: "Control Batería" }, { id: "T8dHxbyFS7k", title: "Recargas" }, { id: "S3SreCeLKRo", title: "I.D Light" }, { id: "hyt0zJ1xDx0", title: "Side Assist" } ],
    "ID7": [ { id: "XExc18DHRY0", title: "Presentación" }, { id: "1VOEbyTnlnA", title: "Volante" }, { id: "PoDRglz1958", title: "Control Batería" }, { id: "T8dHxbyFS7k", title: "Recargas" }, { id: "S3SreCeLKRo", title: "I.D Light" }, { id: "hyt0zJ1xDx0", title: "Side Assist" } ]
};

window.generalVideos = [
    { id: "VtiRnquehO4", title: "Volante" }, 
    { id: "aG0tZ1ak_l0", title: "Lane Assist" }, 
    { id: "HshiH9iLKLE", title: "ACC" },
    { id: "G-MVoj-hGuI", title: "I.Q Drive" }, 
    { id: "lJW0Gh4x20M", title: "AutoHold" }, 
    { id: "AEGgI493F5U", title: "Inclinación Auto" },
    { id: "3v7GssFV5Oo", title: "FrontAssist" }, 
    { id: "eylMv9Xtzts", title: "Iluminación Inteligente" }, 
    { id: "gce49dlqN8U", title: "Coming Home Light" },
    { id: "lPDD5P8byFE", title: "PreCrash 360" }, 
    { id: "GQ0Sub5OXrE", title: "Emergency Assist" }, 
    { id: "JnxjHCTiNGU", title: "Posición volante" },
    { id: "JUVxojdu4CE", title: "Travel Assist" }, 
    { id: "_Oy5TkGj5E0", title: "Ángulo muerto" }
];

window.esVideoValido = function(id) {
    return !!(id && id !== 'ID_AQUI' && /^[a-zA-Z0-9_-]{11}$/.test(id));
};

window.resolverVideoId = function(vid) {
    return window.esVideoValido(vid) ? vid : window.generalVideos[0].id;
};

window.htmlTarjetaVideo = function(v) {
    if (!window.esVideoValido(v.id)) return '';
    const id = escapeForJsString(v.id);
    const titleJs = escapeForJsString(v.title);
    const titleHtml = escapeHtml(v.title);
    return `
        <div class="video-mini-card" onclick="window.playQuickVideo('${id}', '${titleJs}')">
            <div class="thumb" style="background: url('https://img.youtube.com/vi/${v.id}/0.jpg');">
                <div class="thumb-overlay"><i class="fas fa-play"></i></div>
            </div>
            <p style="font-size: 11px; text-align: center; margin-top: 8px; font-weight: 600; color: white;">${titleHtml}</p>
        </div>`;
};

window.generarVideosPorModelo = function() {
    if (!user || !user.car || !user.car.name) return;
    
    const carNameKey = user.car.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const videosToLoad = window.videoDictionary[carNameKey]; 

    const containerSpecific = document.getElementById('dynamic-shorts-specific');
    const containerGeneral = document.getElementById('dynamic-shorts-general');
    const tituloEspecifico = document.getElementById('titulo-conoce-modelo');

    if (videosToLoad && videosToLoad.length > 1) {
        if (containerSpecific) {
            containerSpecific.style.display = 'grid'; 
            if (tituloEspecifico) tituloEspecifico.style.display = 'block';
            
            containerSpecific.innerHTML = ''; 
            for (let i = 1; i < videosToLoad.length; i++) {
                containerSpecific.innerHTML += window.htmlTarjetaVideo(videosToLoad[i]);
            }
        }
    } else {
        if (containerSpecific) containerSpecific.style.display = 'none';
        if (tituloEspecifico) tituloEspecifico.style.display = 'none';
    }

    if (containerGeneral) {
        containerGeneral.innerHTML = '';
        window.generalVideos.forEach(v => {
            containerGeneral.innerHTML += window.htmlTarjetaVideo(v);
        });
    }
};

window.playQuickVideo = function(id, title) {
    if (!window.esVideoValido(id)) {
        showToast("Vídeo no disponible para este modelo", 3000);
        return;
    }
    if (typeof playVibration === 'function') playVibration();
    const frame = document.getElementById('video-frame');
    if(frame) frame.src = "https://www.youtube.com/embed/" + id + "?autoplay=1";
    if (typeof showToast === 'function') showToast("Reproduciendo: " + title);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};