/**
 * ============================================================================
 * PROYECTO: GesCar OS
 * COMPONENTES: GesCar OS Core, App GesCar OS Clientes, GesCar OS Renting
 * AUTORES: Manuel Arjona Carrera y Miriam Olmo Fernández (M2 Code Systems)
 * AÑO: 2026
 * ============================================================================
 * 
 * Todos los derechos reservados.
 * Este código fuente es propiedad intelectual de M2 Code Systems.
 * Queda estrictamente prohibida su copia, distribución, modificación 
 * o uso no autorizado, total o parcial, sin el consentimiento expreso 
 * de los autores originales.
 * 
 * ============================================================================
 */
// ==========================================
// 🧠 NÚCLEO DE LA APLICACIÓN (CLIENTES)
// ==========================================

// 1. UTILIDADES GLOBALES
window.escapeJS = function(str) { return String(str || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;"); };
window.escapeHtml = function(str) { return String(str || '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"'); };
window.escapeForJsString = function(str) { return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"); };

var API_URL = atob("aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4UTVtTUNDN0RBMHdybHBhWlM2RWtzVUFJa29EZ3djZUljRk9iZXZFWGVpOG16RXcxV1ZmT3pnS2RycUJJaTc2cC1DUS9leGVj");

// 2. BASE DE DATOS LOCAL DE VEHÍCULOS
var cars = [
   {name: "Golf", file: "Golf.png", vid: "_KGEUPY1_L4"}, 
   {name: "Tiguan", file: "Tiguan.png", vid: "UOqeK51kriw"}, 
   {name: "Passat", file: "Passat.png", vid: "xg5yWdxLjnQ"},
   {name: "Tayron", file: "Tayron.png", vid: "A-12YvB_kdg"},
   {name: "Polo", file: "Polo.png", vid: "bxk6-Y1IYqI"},
   {name: "T-Cross", file: "T-Cross.png", vid: "GgMFWXoIrow"},
   {name: "TCross", file: "T-Cross.png", vid: "GgMFWXoIrow"},
   {name: "T-Roc", file: "T-Roc.png", vid: "s2OTyfxNcWY"},
   {name: "TRoc", file: "T-Roc.png", vid: "s2OTyfxNcWY"},
   {name: "Touareg", file: "Touareg.png", vid: "azQz9t26XPU"},
   {name: "Taigo", file: "Taigo.png", vid: "V_ySP0h4G5o"},
   {name: "Caddy", file: "Caddy.png", vid: "uJZhDE0BTHM"},
   {name: "Multivan", file: "Multivan.png", vid: "7sfAIGUnnas"},
   {name: "Crafter", file: "Crafter.png", vid: "RP_QlToJxvM"},
   {name: "Transporter", file: "Transporter.png", vid: "7sfAIGUnnas"},
   {name: "ID.3", file: "ID.3.png", vid: "oFA1YxoDbJo"},
   {name: "ID3", file: "ID.3.png", vid: "oFA1YxoDbJo"},
   {name: "ID.4", file: "ID.4.png", vid: "ucX88AZTWwM"},
   {name: "ID4", file: "ID.4.png", vid: "ucX88AZTWwM"},
   {name: "ID.5", file: "ID.5.png", vid: "JdA5gJ3XuiM"},
   {name: "ID5", file: "ID.5.png", vid: "JdA5gJ3XuiM"},
   {name: "ID.7", file: "ID.7.png", vid: "XExc18DHRY0"},
   {name: "ID7", file: "ID.7.png", vid: "XExc18DHRY0"},
   {name: "ID. Buzz", file: "ID. Buzz.png", vid: "1VOEbyTnlnA"},
   {name: "IDBuzz", file: "ID. Buzz.png", vid: "1VOEbyTnlnA"}
];

// 3. VARIABLES DE SESIÓN GLOBALES
var user = null;
var deferredPrompt;
var parametrosURL = new URLSearchParams(window.location.search);
var modoPruebaActivado = parametrosURL.get('test') === 'true';

window.modoEdicion = false;
window.datosEdicion = null;
window.alertaEnviada = false;

let unsubscribeVehiculo = null;
let unsubscribeCita = null;
window.tInt = null;

// 4. INICIALIZACIÓN DE LA APP
window.onload = function() {
    setTimeout(() => { 
        const splash = document.getElementById('s-splash');
        if (splash) splash.style.display = 'none'; 
    }, 2000);

    if (modoPruebaActivado) {
        document.getElementById('panel-pruebas').style.display = 'block';
        if(typeof window.cargarModeloPrueba === 'function') window.cargarModeloPrueba();
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const editar = urlParams.get('editar');
    const matricula = urlParams.get('matricula');

    if (editar === "true" && matricula) {
        window.modoEdicion = true;

        window.getDocs(window.query(window.collection(window.db, "citas_agenda"), window.where("matricula", "==", matricula)))
        .then(snapshot => {
            if (!snapshot.empty) {
                let docData = snapshot.docs[0].data();
                window.datosEdicion = docData; 

                let cocheParaReagendar = {
                    matricula: docData.matricula,
                    modelo: docData.modelo,
                    cliente: docData.cliente,
                    bastidor: docData.bastidor || "S/B"
                };

                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                document.getElementById('s-welcome').classList.add('active');
                if(typeof window.iniciarMotorAgenda === 'function') window.iniciarMotorAgenda(cocheParaReagendar);

                Swal.fire({
                    title: 'MODIFICAR CITA',
                    text: 'Tus datos están guardados de forma segura. Selecciona tu nuevo día y hora de entrega.',
                    icon: 'info',
                    background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)', 
                    color: '#fff', 
                    confirmButtonColor: '#00b0f0'
                });
            } else {
                Swal.fire('Aviso', 'No se encontró ninguna cita activa para esta matrícula.', 'warning');
                window.verificarSesionLocal();
            }
        }).catch(err => console.log("Error al buscar cita:", err));
        return;
    }

    window.verificarSesionLocal();
};

window.verificarSesionLocal = async function() {
    try {
        const saved = localStorage.getItem('vw_user_data');
        if(saved) { 
            user = JSON.parse(saved); 
            if(!user || !user.car || !user.car.name) {
                localStorage.removeItem('vw_user_data');
                user = null;
                window.navTo('s-welcome', false, true); 
                return;
            }
            await window.sincronizarUsuarioDesdeFirebase();
            window.loadDash(); 
        } else { 
            window.navTo('s-welcome', false, true); 
        }
    } catch(e) {
        console.error("Error cargando sesión. Reseteando...", e);
        localStorage.removeItem('vw_user_data');
        window.navTo('s-welcome', false, true); 
    }
};

window.doLogin = async function() {
    try { window.playVibration(); } catch(e){}
    
    var mat = document.getElementById('username').value.trim().toUpperCase().replace(/\s/g, '');
    if(mat.length < 3) return;
    
    let btn = document.querySelector('#s-login .btn-glow');
    btn.innerText = "VERIFICANDO...";
    
    try {
        const encontrado = await window.buscarVehiculoEnFirebase(mat);

       if (encontrado) {
            const cocheF = encontrado.data;
            let estaEntregado = (cocheF.entregado === true || cocheF.entregado === "true");
            
            if (!cocheF.fechaCita && !estaEntregado) {
                Swal.fire({
                    title: 'SIN CITA PREVIA',
                    html: '<p style="font-size:13px; font-weight:300;">Aún no tienes una fecha de entrega programada para este vehículo.<br><br>Por favor, vuelve a la pantalla de inicio y pulsa en <b>RESERVAR CITA ENTREGA</b>.</p>',
                    icon: 'warning',
                    background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
                    color: '#fff',
                    confirmButtonColor: '#00B0F0',
                    confirmButtonText: 'ENTENDIDO',
                    customClass: { popup: 'border border-gray-600 rounded-3xl' }
                });
                btn.innerText = "ACCEDER";
                return; 
            }

            user = window.buildUserFromVehiculo(cocheF, mat, null);
            user.vehiculoDocId = encontrado.id;
            if (!user.deliveryDate && !user.entregado) {
                const deliveryFromAgenda = await window.sincronizarDesdeCitasAgenda(user.matricula)
                    || await window.sincronizarDesdeCitasAgenda(mat);
                if (deliveryFromAgenda) user.deliveryDate = deliveryFromAgenda;
            }

            localStorage.setItem('vw_user_data', JSON.stringify(user));
            document.getElementById('trans-name').innerText = (user.name || "").toUpperCase();
            window.navTo('s-transition');
            setTimeout(window.loadDash, 2000);
        } else {
            Swal.fire({
                title: 'NO ENCONTRADO',
                text: 'Matrícula o bastidor no encontrado en la base de datos de vehículos.',
                icon: 'warning',
                background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
                color: '#fff',
                confirmButtonColor: '#00B0F0'
            });
            btn.innerText = "ACCEDER";
        }
    } catch (e) {
        console.error("Error leyendo los datos:", e);
        Swal.fire({
            title: 'ERROR DE RED',
            text: 'Comprueba tu conexión a internet.',
            icon: 'error',
            background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
            color: '#fff',
            confirmButtonColor: '#00B0F0'
        });
        btn.innerText = "ACCEDER";
    }
};

window.loadDash = function() {
    window.navTo('s-dash', false, true); 
    
    try {
        const currentHour = new Date().getHours();
        let greetingText = "HOLA,";
        if(currentHour < 12) { greetingText = "BUENOS DÍAS,"; } 
        else if (currentHour < 20) { greetingText = "BUENAS TARDES,"; } 
        else { greetingText = "BUENAS NOCHES,"; }
        document.getElementById('greeting-time').innerText = greetingText;

        document.getElementById('dash-name').innerText = user.name.split(' ')[0];
        document.getElementById('real-car-img').src = "https://raw.githubusercontent.com/vwmadrid/Entregas/main/images/" + user.car.file;
        
        if(typeof window.resolverVideoId === 'function'){
            document.getElementById('video-frame').src = "https://www.youtube.com/embed/" + window.resolverVideoId(user.car.vid);
        }
        
        var esAle = user.agente && user.agente.includes("ANTONIO");
        document.getElementById('agent-name').innerText = esAle ? "Antonio Bermejo" : "Manuel Arjona";
        document.getElementById('agent-avatar').innerText = esAle ? "AB" : "MA";
        
        window.renderTimer();
        if(typeof window.generarVideosPorModelo === 'function') window.generarVideosPorModelo(); 

        const checkVO = document.getElementById('checklist-vo');
        if (checkVO) {
            let voStatus = String(user.entregaVO || 'NO').toUpperCase().trim();
            voStatus = voStatus.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            checkVO.style.display = (voStatus === 'SI' || voStatus === 'TRUE') ? 'block' : 'none'; 
        }

        window.iniciarEscuchaTiempoReal();

    } catch(e) {
        console.error("Error en Dashboard:", e);
        window.detenerEscuchaTiempoReal();
        localStorage.clear();
        window.navTo('s-welcome', false, true);
    }
};

// 5. FUNCIONES DE BASE DE DATOS Y SINCRONIZACIÓN
window.buscarVehiculoEnFirebase = async function(identificador) {
    const mat = String(identificador).toUpperCase().replace(/\s/g, '');
    const querySnapshot = await window.getDocs(window.collection(window.db, "vehiculos"));
    let resultado = null;
    querySnapshot.forEach((docSnap) => {
        const c = docSnap.data();
        const matDB = (c.matricula || c.Matricula || "").toUpperCase().replace(/\s/g, '');
        const basDB = (c.bastidor || "").toUpperCase();
        if (matDB === mat || basDB === mat) {
            resultado = { data: c, id: docSnap.id };
        }
    });
    return resultado;
};

window.sincronizarDesdeCitasAgenda = async function(matricula) {
    const snapshot = await window.getDocs(window.query(
        window.collection(window.db, "citas_agenda"),
        window.where("matricula", "==", matricula)
    ));
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0].data();
    if (docData.fecha && docData.hora) {
        return `${docData.fecha}T${docData.hora}:00`;
    }
    return null;
};

window.sincronizarUsuarioDesdeFirebase = async function() {
    const identificador = (user.matricula || "").trim();
    if (!identificador || identificador.length < 3) return false;

    try {
        const encontrado = await window.buscarVehiculoEnFirebase(identificador);
        if (!encontrado) return false;

        const cocheF = encontrado.data;
        const matriculaLimpia = String(cocheF.matricula || cocheF.Matricula || identificador).toUpperCase().replace(/\s/g, '');
        const usuarioAnterior = user;
        user = window.buildUserFromVehiculo(cocheF, matriculaLimpia, usuarioAnterior);
        user.vehiculoDocId = encontrado.id;

        if (!user.entregado && !user.deliveryDate) {
            const deliveryFromAgenda = await window.sincronizarDesdeCitasAgenda(user.matricula)
                || await window.sincronizarDesdeCitasAgenda(matriculaLimpia);
            if (deliveryFromAgenda) user.deliveryDate = deliveryFromAgenda;
        }

        localStorage.setItem('vw_user_data', JSON.stringify(user));
        return true;
    } catch (e) {
        console.warn("No se pudo sincronizar con Firebase, usando datos locales.", e);
        return false;
    }
};

window.buildUserFromVehiculo = function(cocheF, matriculaFallback, previousUser) {
    const car = cars.find(c => (cocheF.modelo || "").toUpperCase().includes(c.name.toUpperCase()))
        || (previousUser && previousUser.car)
        || cars[0];
    const matricula = cocheF.matricula || cocheF.Matricula || matriculaFallback;
    return {
        name: cocheF.cliente || (previousUser && previousUser.name) || "Cliente",
        car: car,
        deliveryDate: window.parseFechaCita(cocheF.fechaCita),
        agente: cocheF.agente || (previousUser && previousUser.agente) || "MANUEL",
        entregaVO: cocheF.entregaVO || (previousUser && previousUser.entregaVO) || "NO",
        matricula: matricula,
        entregado: cocheF.entregado === true || cocheF.entregado === "true"
    };
};

window.parseFechaCita = function(fechaCita) {
    if (!fechaCita || !String(fechaCita).trim()) return null;
    const partes = String(fechaCita).split(' - ');
    if (partes.length !== 2) return null;
    const f = partes[0].split('/');
    const h = partes[1].replace('h', '').trim();
    if (f.length !== 3 || !h) return null;
    return `${f[2]}-${f[1]}-${f[0]}T${h}:00`;
};

window.iniciarEscuchaTiempoReal = async function() {
    window.detenerEscuchaTiempoReal();

    if (modoPruebaActivado || !user || !user.matricula) return;
    if (!window.onSnapshot || !window.db) return;

    if (!user.vehiculoDocId) {
        const encontrado = await window.buscarVehiculoEnFirebase(user.matricula);
        if (encontrado) {
            user.vehiculoDocId = encontrado.id;
            localStorage.setItem('vw_user_data', JSON.stringify(user));
        }
    }

    if (user.vehiculoDocId) {
        unsubscribeVehiculo = window.onSnapshot(
            window.doc(window.db, "vehiculos", user.vehiculoDocId),
            async (snap) => {
                if (!snap.exists() || !user) return;
                const deliveryAnterior = user.deliveryDate;
                const entregadoAnterior = user.entregado;
                await window.aplicarDatosVehiculoRemotos(snap.data());
                window.refrescarPanelSiActivo(
                    deliveryAnterior !== user.deliveryDate || entregadoAnterior !== user.entregado
                );
            },
            (err) => console.warn("Error escucha vehículo:", err)
        );
    }

    const q = window.query(window.collection(window.db, "citas_agenda"), window.where("matricula", "==", user.matricula));
    let primeraLecturaCita = true;
    unsubscribeCita = window.onSnapshot(q, (snapshot) => {
            if (primeraLecturaCita) { primeraLecturaCita = false; return; }
            if (!user || user.entregado || snapshot.empty) return;
            const docData = snapshot.docs[0].data();
            if (!docData.fecha || !docData.hora) return;

            const nuevaFecha = `${docData.fecha}T${docData.hora}:00`;
            if (user.deliveryDate === nuevaFecha) return;

            user.deliveryDate = nuevaFecha;
            localStorage.setItem('vw_user_data', JSON.stringify(user));
            window.refrescarPanelSiActivo(true);
        },
        (err) => console.warn("Error escucha cita:", err)
    );
};

window.detenerEscuchaTiempoReal = function() {
    if (unsubscribeVehiculo) { unsubscribeVehiculo(); unsubscribeVehiculo = null; }
    if (unsubscribeCita) { unsubscribeCita(); unsubscribeCita = null; }
};

window.refrescarPanelSiActivo = function(mostrarAviso) {
    const dash = document.getElementById('s-dash');
    if (!dash || !dash.classList.contains('active') || !user) return;

    try {
        document.getElementById('dash-name').innerText = user.name.split(' ')[0];
        const esAle = user.agente && user.agente.includes("ANTONIO");
        document.getElementById('agent-name').innerText = esAle ? "Antonio Bermejo" : "Manuel Arjona";
        document.getElementById('agent-avatar').innerText = esAle ? "AB" : "MA";

        const checkVO = document.getElementById('checklist-vo');
        if (checkVO) {
            let voStatus = String(user.entregaVO || 'NO').toUpperCase().trim();
            voStatus = voStatus.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            checkVO.style.display = (voStatus === 'SI' || voStatus === 'TRUE') ? 'block' : 'none';
        }

        window.renderTimer();
        if (mostrarAviso) window.showToast("📅 Tu cita ha sido actualizada", 3500);
    } catch (e) { console.warn("No se pudo refrescar el panel:", e); }
};

window.aplicarDatosVehiculoRemotos = async function(cocheF) {
    if (!user) return;
    const matriculaLimpia = String(cocheF.matricula || cocheF.Matricula || user.matricula || "").toUpperCase().replace(/\s/g, '');
    const usuarioAnterior = user;
    user = window.buildUserFromVehiculo(cocheF, matriculaLimpia, usuarioAnterior);
    if (usuarioAnterior.vehiculoDocId) user.vehiculoDocId = usuarioAnterior.vehiculoDocId;

    if (!user.entregado && !user.deliveryDate) {
        const deliveryFromAgenda = await window.sincronizarDesdeCitasAgenda(user.matricula) || await window.sincronizarDesdeCitasAgenda(matriculaLimpia);
        if (deliveryFromAgenda) user.deliveryDate = deliveryFromAgenda;
    }
    localStorage.setItem('vw_user_data', JSON.stringify(user));
};

// 6. FUNCIONES DE INTERFAZ Y NAVEGACIÓN
window.navTo = function(id, guardarHistorial = true, omitirVibracion = false) { 
    if (!omitirVibracion && typeof window.playVibration === 'function') window.playVibration();
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
    document.getElementById(id).classList.add('active'); 
    window.scrollTo(0,0);

    if (id === 's-welcome' || id === 's-login') { window.detenerEscuchaTiempoReal(); }
    
    if (guardarHistorial) {
        try { history.pushState({ pantalla: id }, "", "#" + id); } catch(e) { }
    }

    if (id === 's-shop') {
        const iframe = document.getElementById('mi-iframe-catalogo');
        if (iframe && iframe.getAttribute('src') === "") {
            iframe.setAttribute('src', "https://docs.google.com/viewer?url=https://raw.githubusercontent.com/vwmadrid/Entregas/main/catalogo.pdf&embedded=true");
        }
    }

    if (id === 's-dash' && user) {
        try {
            document.getElementById('dash-name').innerText = user.name.split(' ')[0];
            window.renderTimer();
        } catch (e) {}
    }
};

window.addEventListener('popstate', function(evento) {
    if (evento.state && evento.state.pantalla) {
        window.navTo(evento.state.pantalla, false);
    } else {
        if (user) { window.navTo('s-dash', false); } else { window.navTo('s-welcome', false); }
    }
});

// 7. RELOJ, ALERTAS Y UTILIDADES
window.renderTimer = function() {
    const w = document.getElementById('status-widget');
    
    if (user && user.entregado) {
        w.className = "premium-countdown";
        w.style.background = "linear-gradient(145deg, rgba(0, 176, 240, 0.08) 0%, rgba(5, 10, 20, 0.9) 100%)";
        w.style.borderColor = "rgba(0, 176, 240, 0.3)";
        w.innerHTML = `
            <div class="pc-header" style="margin-bottom: 0;">
                <div style="width: 65px; height: 65px; border-radius: 50%; background: linear-gradient(135deg, #00B0F0, #001E50); display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto; box-shadow: 0 8px 25px rgba(0,176,240,0.4); border: 2px solid rgba(255,255,255,0.2);">
                    <i class="fas fa-car" style="font-size: 28px; color: white;"></i>
                </div>
                <div class="pc-title" style="color: #00B0F0; font-size: 11px; letter-spacing: 3px;">ENTREGA COMPLETADA</div>
                <div class="pc-datetime" style="font-size: 20px; font-weight: 800; margin-top: 8px;">¡A disfrutar de tu ${window.escapeJS(user.car.name)}!</div>
                <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 18px 0;"></div>
                <p style="font-size: 12px; opacity: 0.8; font-weight: 300; line-height: 1.5; margin: 0; padding: 0 5px;">
                    Para <b>Castellana Wagen</b> ha sido un placer acompañarte. Recuerda que tienes los manuales y la asistencia en carretera disponibles en esta app para cuando los necesites. ¡Buen viaje!
                </p>
            </div>
        `;
        
        const surveyCard = document.getElementById('tarjeta-encuesta');
        if (surveyCard) surveyCard.style.display = 'block';
        
        const linkModificar = document.getElementById('linkModificarCita');
        if (linkModificar) linkModificar.style.display = 'none';
        
        return;
    }
        
    if(!user.deliveryDate) { w.innerHTML = "<div style='padding:20px; color:rgba(255,255,255,0.5); text-align:center; font-weight:300; letter-spacing:1px;'>CITA PENDIENTE DE CONFIRMAR</div>"; return; }
    
    const dDate = new Date(user.deliveryDate);
    const dateStr = dDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    const timeStr = dDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    w.className = "premium-countdown"; 
    w.style.background = "linear-gradient(145deg, rgba(20, 30, 50, 0.8) 0%, rgba(5, 10, 20, 0.9) 100%)";
    w.style.borderColor = "rgba(255, 255, 255, 0.08)";
    w.innerHTML = `
        <div class="pc-header">
            <div class="pc-title">TU CITA DE ENTREGA</div>
            <div class="pc-datetime">${dateStr}  •  ${timeStr} h</div>
        </div>
        <div class="pc-divider"></div>
        <div class="pc-timer-grid">
            <div class="pc-time-unit"><div id="d-days">0</div><div>DÍAS</div></div>
            <div class="pc-time-unit"><div id="d-hours">0</div><div>HRS</div></div>
            <div class="pc-time-unit"><div id="d-mins">0</div><div>MIN</div></div>
            <div class="pc-time-unit"><div id="d-secs">0</div><div>SEG</div></div>
        </div>
    `;

    if(window.tInt) clearInterval(window.tInt);
    window.tInt = setInterval(window.updateTimer, 1000);
    window.updateTimer();
};

window.updateTimer = function() {
    if(!user || !user.deliveryDate) return;
    const diff = new Date(user.deliveryDate).getTime() - new Date().getTime();
    const btnLlegada = document.getElementById('btnLlegada');
    
    if(diff <= 0) { 
        const grid = document.querySelector('.pc-timer-grid');
        if(grid) { 
            grid.innerHTML = "<div style='grid-column: span 4; font-size: 18px; font-weight: 300; color: #25D366; padding: 10px 0; letter-spacing:1px;'>VEHÍCULO LISTO PARA ENTREGA</div>"; 
        }
        if (btnLlegada && !window.alertaEnviada) { btnLlegada.style.display = 'flex'; }
        if(window.tInt) clearInterval(window.tInt);
        return; 
    }
    
    if (btnLlegada) { btnLlegada.style.display = 'none'; }

    const elDays = document.getElementById('d-days');
    if(elDays) {
        elDays.innerText = Math.floor(diff / 86400000);
        document.getElementById('d-hours').innerText = Math.floor((diff % 86400000) / 3600000);
        document.getElementById('d-mins').innerText = Math.floor((diff % 3600000) / 60000);
        document.getElementById('d-secs').innerText = Math.floor((diff % 60000) / 1000);
    }
};

window.notifyArrival = async function() { 
    window.playVibration();
    try {
        let mat = user.matricula || document.getElementById('username').value;
        if(!mat) throw new Error("Sin matrícula");

        let matriculaLimpia = mat.toUpperCase().replace(/\s/g, '');
        let docIdEncontrado = null;

        const querySnapshot = await window.getDocs(window.collection(window.db, "vehiculos"));
        querySnapshot.forEach((doc) => {
            const c = doc.data();
            const matDB = (c.matricula || c.Matricula || "").toUpperCase().replace(/\s/g, '');
            const basDB = (c.bastidor || "").toUpperCase();
            if (matDB === matriculaLimpia || basDB === matriculaLimpia) {
                docIdEncontrado = doc.id;
            }
        });
        
        if (docIdEncontrado) {
            const btnLlegada = document.getElementById('btnLlegada');
            await window.updateDoc(window.doc(window.db, "vehiculos", docIdEncontrado), { 
                clienteEnPuerta: true,
                alertaAtendida: false 
            });
            
            Swal.fire({
                title: '¡AVISO ENVIADO!',
                html: '<p style="font-size:14px; font-weight:300; opacity:0.9;">Tu asesor ha sido notificado. Por favor, toma asiento y saldremos a recibirte en breves instantes.</p>',
                icon: 'success',
                iconColor: '#25D366',
                background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
                color: '#fff',
                confirmButtonColor: '#00B0F0',
                confirmButtonText: 'ENTENDIDO',
                customClass: { popup: 'border border-gray-600 rounded-3xl shadow-2xl' }
            });

            if(btnLlegada) {
                btnLlegada.innerHTML = '<i class="fas fa-check-circle"></i> ASESOR AVISADO';
                btnLlegada.style.background = 'linear-gradient(135deg, #001E50, #0044a0)';
                btnLlegada.style.color = '#fff';
                btnLlegada.style.boxShadow = 'none';
                btnLlegada.onclick = null; 
                window.alertaEnviada = true;
            }
        } else { throw new Error("Coche no encontrado en Firebase"); }
    } catch(e) { 
        console.log("Error al notificar llegada:", e); 
        Swal.fire({
            title: 'ERROR DE CONEXIÓN',
            text: 'No hemos podido notificar al asesor de forma automática debido a un fallo de red. Por favor, acércate a recepción.',
            icon: 'error', background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)', color: '#fff', confirmButtonColor: '#00B0F0', confirmButtonText: 'ENTENDIDO'
        });
    }
};

window.cargarModeloPrueba = function() {
    if(typeof cars === 'undefined') return;
    const nombreModelo = document.getElementById('selector-modelo').value;
    const carObj = cars.find(c => c.name === nombreModelo) || cars[0];
    let fechaSimulada = new Date(); fechaSimulada.setMinutes(fechaSimulada.getMinutes() + 5); 

    user = { name: "Cliente de Prueba", car: carObj, deliveryDate: fechaSimulada.toISOString(), agente: "MANUEL", entregaVO: "NO", matricula: "0000 TST", entregado: false };
    window.navTo('s-dash'); window.loadDash(); window.alertaEnviada = true; 
};

window.appRatings = { q1: 0, q2: 0 };
window.rateAppMulti = function(question, stars) {
    try { window.playVibration(30); } catch(e) {}
    window.appRatings[question] = stars;
    const starElements = document.querySelectorAll('#stars-' + question + ' i');
    starElements.forEach((star, index) => {
        if (index < stars) { star.classList.add('active'); } else { star.classList.remove('active'); }
    });
};

window.sendAppFeedbackMulti = async function() {
    if (window.appRatings.q1 === 0 || window.appRatings.q2 === 0) { return window.showToast("Por favor, puntúa ambas preguntas antes de enviar.", 3000); }
    try { window.playVibration(); } catch(e) {}
    const text = document.getElementById('app-feedback-text').value.trim();
    const btn = document.querySelector('#tarjeta-encuesta button');
    btn.innerText = "ENVIANDO...";
    
    try {
        let feedbackId = new Date().getTime().toString();
        await window.setDoc(window.doc(window.db, "app_feedback", feedbackId), {
            facilidadUso: window.appRatings.q1, utilidadVideos: window.appRatings.q2, comentario: text,
            cliente: user && user.name ? user.name : "Desconocido", modelo: user && user.car ? user.car.name : "N/A", fecha: new Date().toLocaleString('es-ES')
        });
        
        document.getElementById('tarjeta-encuesta').innerHTML = `<i class="fas fa-check-circle" style="font-size: 45px; color: #a855f7; margin-bottom:15px; filter: drop-shadow(0 0 15px rgba(168,85,247,0.5));"></i><h4 style="margin:0 0 10px 0; font-size:18px; font-weight:800; color:white;">¡Mil gracias!</h4><p style="font-size:12px; font-weight:300; opacity:0.8; line-height:1.5;">Tus comentarios nos ayudan a mejorar el servicio cada día.</p>`;
        try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 }, colors: ['#a855f7', '#c084fc', '#ffffff'] }); } catch(e) {}
    } catch(e) {
        console.error("Error guardando encuesta:", e);
        window.showToast("Error de conexión. Revisa los permisos de Firebase.", 4000); btn.innerText = "ENVIAR OPINIÓN AL EQUIPO";
    }
};

window.reveal = function() { 
    window.playVibration(100);
    document.getElementById('cover').classList.add('open'); 
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#00B0F0', '#FFFFFF', '#001E50'] }); 
    setTimeout(() => {
        const carImg = document.getElementById('real-car-img');
        if(carImg) carImg.classList.add('float-animation');
    }, 1500);
};

window.toggleCheck = function(e) { window.playVibration(30); e.classList.toggle('checked'); };
window.showToast = function(t, time = 3000) { var x = document.getElementById("toast"); x.className = "show"; x.innerText = t; setTimeout(()=>x.className="", time); };
window.whatsappMe = function() { var t = (user && user.agente && user.agente.includes("ANTONIO")) ? "34618969208" : "34660050228"; window.open("https://wa.me/"+t); };
window.sendWishlist = function() { var t = (user && user.agente && user.agente.includes("ANTONIO")) ? "34618969208" : "34660050228"; window.open("https://wa.me/"+t+"?text=Interés accesorio: " + document.getElementById('wishlist').value); };
window.playVibration = function(duration = 40) { try { if (navigator.vibrate) { navigator.vibrate(duration); } } catch(e) {} };
window.showProduct = function(title, desc, itemName, iconClass) { window.playVibration(); document.getElementById('pm-title').innerText = title; document.getElementById('pm-desc').innerText = desc; document.getElementById('pm-icon').className = iconClass; document.getElementById('pm-add').onclick = function() { window.addAccesorio(itemName); document.getElementById('product-modal').style.display = 'none'; }; document.getElementById('product-modal').style.display = 'flex'; };
window.addAccesorio = function(item) { window.playVibration(30); const wishlist = document.getElementById('wishlist'); if (wishlist.value.trim().length > 0) { wishlist.value += ", " + item; } else { wishlist.value = item; } window.showToast("✅ Añadido: " + item, 2000); };
window.downloadVWApp = function() { try { var ua = navigator.userAgent || navigator.vendor || window.opera; if (/android/i.test(ua)) { window.open('https://play.google.com/store/apps/details?id=com.volkswagen.weconnect', '_blank'); } else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) { window.open('https://apps.apple.com/es/app/volkswagen/id1517566572', '_blank'); } else { window.open('https://www.volkswagen.es/es/conectividad/vw-connect/activacion.html', '_blank'); } } catch(e) {} };
window.installApp = function() { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then((choice) => { if (choice.outcome === 'accepted') { document.getElementById('toast').className = ""; } deferredPrompt = null; }); } else { if(/iPhone|iPad|iPod/i.test(navigator.userAgent)) { alert("En iPhone: Pulsa el botón 'Compartir' (cuadrado con flecha) y elige 'Añadir a la pantalla de inicio'"); } } };