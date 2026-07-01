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
// 📅 SISTEMA DE RESERVAS Y CITAS (CLIENTES)
// ==========================================

// Variables globales para la reserva
window.fechaSeleccionadaParaReserva = null;
window.horaSeleccionadaParaReserva = null;
window.datosCocheReserva = null;

window.verificarVehiculoParaCita = async function() {
    const { value: matriculaInput } = await Swal.fire({
        title: 'TU NUEVO VOLKSWAGEN',
        html: `
            <div style="font-size:13px; font-weight:300; opacity:0.8; margin-bottom:10px; line-height:1.4;">
                Para acceder al calendario de citas, introduce tu matrícula o bastidor y verificaremos si tu coche ya está en la campa.
            </div>
            <input id="swal-mat-verif" class="swal2-input text-center uppercase" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.2); color:white; border-radius:15px; font-weight:900; letter-spacing:2px;" placeholder="MATRÍCULA / BASTIDOR">
        `,
        background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
        color: '#fff',
        showCancelButton: true,
        confirmButtonColor: '#00B0F0',
        cancelButtonColor: 'rgba(255,255,255,0.1)',
        confirmButtonText: 'VERIFICAR',
        cancelButtonText: 'VOLVER',
        heightAuto: false, 
        backdrop: `rgba(0,0,0,0.85)`,
        customClass: { popup: 'border border-gray-600 rounded-3xl shadow-2xl' },
        preConfirm: () => {
            const m = document.getElementById('swal-mat-verif').value.toUpperCase().replace(/\s/g, '');
            if (!m || m.length < 3) {
                Swal.showValidationMessage('Introduce un dato válido');
                return false;
            }
            return m;
        }
    });

    if (matriculaInput) {
        Swal.fire({ 
            title: 'Conectando con Castellana Wagen...', 
            html: '<p style="font-size:12px; opacity:0.7;">Buscando tu vehículo en nuestras instalaciones</p>',
            background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
            color: '#fff',
            heightAuto: false,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading() 
        });

        try {
            const querySnapshot = await window.getDocs(window.collection(window.db, "vehiculos"));
            let encontrado = false;
            let enConcesionario = false;
            let yaTieneCita = false;
            let fechaExistente = "";
            let cocheEncontradoParaCita = null;

            querySnapshot.forEach((doc) => {
                const c = doc.data();
                const mat = (c.matricula || c.Matricula || "").toUpperCase().replace(/\s/g, '');
                const bas = (c.bastidor || "").toUpperCase();

                if ((mat === matriculaInput || bas === matriculaInput) && (c.entregado !== true && c.entregado !== "true")) {
                    encontrado = true;
                    cocheEncontradoParaCita = c;
                    cocheEncontradoParaCita.id = doc.id; 
                    
                    if (c.pasoAInventario !== false) {
                        enConcesionario = true;
                    }
                    
                    if (c.fechaCita && c.fechaCita.trim() !== "") {
                        yaTieneCita = true;
                        fechaExistente = c.fechaCita;
                    }
                }
            });

            if (encontrado && yaTieneCita) {
                Swal.fire({
                    title: 'CITA YA RESERVADA',
                    html: `<p style="font-size:13px; font-weight:300;">Este vehículo ya tiene una cita asignada para el:<br><b style="color:var(--vw-light); font-size:15px;">${escapeHtml(fechaExistente)}</b>.<br><br>Si necesitas cambiar el día o la hora, vuelve atrás y entra a través del botón <b>'YA TENGO MI CITA'</b> para modificarla desde tu panel.</p>`,
                    icon: 'warning',
                    background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
                    color: '#fff',
                    heightAuto: false,
                    confirmButtonColor: '#00B0F0',
                    confirmButtonText: 'ENTENDIDO'
                });
            } else if (encontrado && enConcesionario) {
                Swal.fire({
                    title: '¡VEHÍCULO PREPARADO!',
                    html: '<p style="font-size:13px; font-weight:300;">Tu Volkswagen ya se encuentra en nuestro concesionario. Te redirigimos para que elijas el día de tu entrega.</p>',
                    icon: 'success',
                    iconColor: '#25D366',
                    background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
                    color: '#fff',
                    heightAuto: false,
                    confirmButtonColor: '#00B0F0',
                    confirmButtonText: 'AGENDAR CITA AHORA'
                }).then(() => {
                    window.iniciarMotorAgenda(cocheEncontradoParaCita);
                });
            } else if (encontrado && !enConcesionario) {
                Swal.fire({
                    title: 'AÚN EN TRÁNSITO',
                    html: '<p style="font-size:13px; font-weight:300;">Tenemos constancia de tu vehículo, pero aún se encuentra en fase de logística o transporte. Te avisaremos en cuanto llegue a nuestras instalaciones para poder agendar la cita.</p>',
                    icon: 'info',
                    iconColor: '#00B0F0',
                    background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
                    color: '#fff',
                    heightAuto: false,
                    confirmButtonColor: '#001E50',
                    confirmButtonText: 'ENTENDIDO'
                });
            } else {
                Swal.fire({
                    title: 'NO ENCONTRADO',
                    html: '<p style="font-size:13px; font-weight:300;">No localizamos esta matrícula o bastidor en nuestra campa actual. Por favor, asegúrate de que el dato es correcto o contacta con tu asesor.</p>',
                    icon: 'error',
                    background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
                    color: '#fff',
                    heightAuto: false,
                    confirmButtonColor: '#001E50',
                    confirmButtonText: 'VOLVER'
                });
            }
        } catch (error) {
            console.error("Error al verificar:", error);
            Swal.fire({
                title: 'ERROR DE CONEXIÓN',
                text: 'No hemos podido conectar con el servidor. Inténtalo de nuevo más tarde.',
                icon: 'error',
                background: '#001E50',
                color: '#fff',
                heightAuto: false,
                confirmButtonColor: '#00B0F0'
            });
        }
    }
};

window.abrirModificarCita = async function() {
    if(!user) return;
    window.modoEdicion = true;
    
    const snapshot = await window.getDocs(window.query(window.collection(window.db, "citas_agenda"), window.where("matricula", "==", user.matricula)));
    if(!snapshot.empty) {
        window.datosEdicion = snapshot.docs[0].data();
    } else {
        window.datosEdicion = { cliente: user.name, entregaVO: user.entregaVO };
    }

    let cocheParaReagendar = {
        id: user.vehiculoDocId, 
        matricula: user.matricula,
        modelo: user.car.name,
        cliente: user.name,
        entregaVO: user.entregaVO || "NO",
        bastidor: user.car.bastidor || "S/B"
    };
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
    document.getElementById('s-welcome').classList.add('active');
    window.scrollTo(0,0);
    window.iniciarMotorAgenda(cocheParaReagendar);
};

window.iniciarMotorAgenda = function(cocheData) {
    window.datosCocheReserva = cocheData;
    
    document.getElementById('botones-inicio').style.display = 'none';
    document.getElementById('mi-agenda-privada').style.display = 'block';
    
    const contenedorDias = document.getElementById('contenedor-dias-agenda');
    contenedorDias.innerHTML = '';
    
    let fechaCalculo = new Date(); 
    let diasDeMargen = 0;
    
    while (diasDeMargen < 2) {
        fechaCalculo.setDate(fechaCalculo.getDate() + 1);
        let diaSemanaMargen = fechaCalculo.getDay();
        if (diaSemanaMargen !== 0 && diaSemanaMargen !== 6) {
            diasDeMargen++;
        }
    }

    let diasPintados = 0;
    while (diasPintados < 21) {
        fechaCalculo.setDate(fechaCalculo.getDate() + 1);
        let diaSemana = fechaCalculo.getDay(); 
        
        if (diaSemana !== 0 && diaSemana !== 6) {
            let fechaFormatoBBDD = fechaCalculo.getFullYear() + "-" + String(fechaCalculo.getMonth() + 1).padStart(2, '0') + "-" + String(fechaCalculo.getDate()).padStart(2, '0');
            let diaAbreviado = fechaCalculo.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
            let diaNumero = String(fechaCalculo.getDate()).padStart(2, '0');

            contenedorDias.innerHTML += `
                <div onclick="mostrarHoras('${fechaFormatoBBDD}', '${diaAbreviado} ${diaNumero}')" style="scroll-snap-align: start; min-width: 75px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 15px; padding: 15px 10px; text-align: center; cursor: pointer; transition: 0.2s; flex-shrink: 0;" onmouseover="this.style.background='rgba(0,176,240,0.2)'; this.style.borderColor='#00B0F0'" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='rgba(255,255,255,0.2)'">
                    <div style="font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase;">${diaAbreviado}</div>
                    <div style="font-size: 26px; font-weight: 900; color: white; margin-top: 5px;">${diaNumero}</div>
                </div>
            `;
            diasPintados++;
        }
    }

    if(!document.getElementById('aviso-deslizar')) {
        contenedorDias.insertAdjacentHTML('afterend', '<div id="aviso-deslizar" style="font-size:9px; color:rgba(255,255,255,0.4); text-align:right; margin-top:5px; text-transform:uppercase; letter-spacing:1px; font-weight:bold;">Desliza para ver más fechas ➔</div>');
    }
};

window.mostrarHoras = async function(fechaBBDD, textoDia) {
    window.fechaSeleccionadaParaReserva = fechaBBDD;
    document.getElementById('contenedor-horas-agenda').style.display = 'block';
    document.getElementById('titulo-fecha-elegida').innerText = "Horas disponibles para el " + textoDia;
    
    const gridHoras = document.getElementById('grid-horas');
    gridHoras.innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; color: white;"></i></div>`;

    try {
        // 1. Cargamos las citas existentes
        const q = window.query(window.collection(window.db, "citas_agenda"), window.where("fecha", "==", fechaBBDD));
        const snapshotCitas = await window.getDocs(q);
        
        let conteoHoras = {};
        snapshotCitas.forEach(doc => { 
            let horaCita = doc.data().hora;
            if (!conteoHoras[horaCita]) conteoHoras[horaCita] = 0;
            conteoHoras[horaCita]++;
        });

        // 🔥 2. RADAR DE BLOQUEOS Y VACACIONES (Nuevo)
        const snapshotBloqueos = await window.getDocs(window.collection(window.db, "bloqueos_agenda"));
        let ausenciasDia = { MANUEL: false, ANTONIO: false, AMBOS: false };
        let ausenciasHora = {}; 

        snapshotBloqueos.forEach(doc => {
            let b = doc.data();
            
            // Si es un día de vacaciones entero
            if (b.tipo === "vacaciones" && fechaBBDD >= b.fechaInicio && fechaBBDD <= b.fechaFin) {
                ausenciasDia[b.operarioAfectado] = true;
            } 
            // Si es una hora suelta o un rango de horas
            else if (b.tipo === "hora_suelta" && fechaBBDD === b.fechaInicio) {
                const horasArray = ['10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00'];
                horasArray.forEach(h => {
                    // Calculamos si la hora actual choca con el inicio o fin del bloqueo
                    if(h >= b.horaInicio && h <= b.horaFin) {
                        if (!ausenciasHora[h]) ausenciasHora[h] = [];
                        ausenciasHora[h].push(b.operarioAfectado);
                    }
                });
            }
        });

        // 3. Pintamos los botones calculando la disponibilidad real
        const horasBase = ['10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00'];
        gridHoras.innerHTML = '';

        horasBase.forEach(hora => {
            let ocupadas = conteoHoras[hora] || 0;
            let capacidadMaxima = (hora === '19:00') ? 1 : 2; // Capacidad base (2 agentes, excepto a las 19:00h)

            // 🛑 Restamos capacidad si están de vacaciones todo el día
            if (ausenciasDia['AMBOS']) capacidadMaxima = 0;
            else {
                if (ausenciasDia['MANUEL']) capacidadMaxima--;
                if (ausenciasDia['ANTONIO']) capacidadMaxima--;
            }

            // 🛑 Restamos capacidad si tienen esa hora bloqueada por médico, curso, etc.
            if (ausenciasHora[hora]) {
                if (ausenciasHora[hora].includes('AMBOS')) capacidadMaxima = 0;
                else {
                    if (ausenciasHora[hora].includes('MANUEL')) capacidadMaxima--;
                    if (ausenciasHora[hora].includes('ANTONIO')) capacidadMaxima--;
                }
            }

            // Control de seguridad (nunca bajar de 0) y regla estricta para las 19:00h
            if (capacidadMaxima < 0) capacidadMaxima = 0;
            if (hora === '19:00' && capacidadMaxima > 1) capacidadMaxima = 1;

            // 4. Decidimos qué botón pintar (Abierto o Cerrado)
            if (ocupadas >= capacidadMaxima || capacidadMaxima === 0) {
                gridHoras.innerHTML += `
                    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); padding: 15px; border-radius: 12px; text-align: center; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: not-allowed;">
                        <i class="fas fa-lock" style="font-size: 12px;"></i> ${hora}
                    </div>
                `;
            } else {
                gridHoras.innerHTML += `
                    <button onclick="confirmarCitaFirebase('${hora}')" style="background: transparent; border: 1px solid var(--vw-light); color: var(--vw-light); padding: 15px; border-radius: 12px; text-align: center; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: 0.2s; box-shadow: 0 0 10px rgba(0,176,240,0.1);" onmouseover="this.style.background='var(--vw-light)'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='var(--vw-light)'">
                        <i class="far fa-clock"></i> ${hora}
                    </button>
                `;
            }
        });
    } catch (e) {
        console.error("Error al cargar las horas:", e);
        gridHoras.innerHTML = `<div style="grid-column: span 2; text-align: center; color: #ff4444; font-weight: bold; font-size: 12px;">Error de conexión. Inténtalo de nuevo.</div>`;
    }
};

window.mostrarPoliticaPrivacidad = function(event) {
    event.preventDefault();
    Swal.fire({
        title: 'POLÍTICA DE PRIVACIDAD',
        html: `
            <div style="text-align:left; font-size:12px; line-height:1.6; height:250px; overflow-y:auto; padding-right:10px; color:rgba(255,255,255,0.8);">
                <strong style="color:var(--vw-light);">1. Responsable:</strong> Castellana Wagen M-40.<br><br>
                <strong style="color:var(--vw-light);">2. Finalidad:</strong> Gestión operativa de tu cita de entrega.<br><br>
                <strong style="color:var(--vw-light);">3. Legitimación:</strong> Tu consentimiento expreso.<br><br>
                <strong style="color:var(--vw-light);">4. Destinatarios:</strong> Tus datos no serán cedidos a terceros comerciales.<br><br>
                <strong style="color:var(--vw-light);">5. Derechos:</strong> Puedes ejercer tus derechos físicos o digitales.
            </div>
        `,
        background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
        color: '#fff',
        confirmButtonColor: '#00b0f0',
        confirmButtonText: 'ENTENDIDO'
    });
};

window.confirmarCitaFirebase = async function(hora) {
    window.horaSeleccionadaParaReserva = hora;
    
    if (!window.datosCocheReserva) {
        Swal.fire({ title: 'Error', text: 'Los datos del vehículo se han perdido. Vuelve a iniciar.', icon: 'error', background: '#001E50', color: '#fff' })
        .then(() => location.reload());
        return;
    }

    let matOficial = window.datosCocheReserva.matricula || window.datosCocheReserva.Matricula || "S/M";
    let modeloCoche = window.datosCocheReserva.modelo || "Vehículo";
    let bastidorCoche = window.datosCocheReserva.bastidor || "S/B";
    let fechaVisual = window.fechaSeleccionadaParaReserva.split('-').reverse().join('/');

    let vNombre = window.modoEdicion && window.datosEdicion ? window.datosEdicion.cliente : (window.datosCocheReserva.cliente || '');
    let vTlf = window.modoEdicion && window.datosEdicion && window.datosEdicion.telefono ? window.datosEdicion.telefono : '';
    let vEmail = window.modoEdicion && window.datosEdicion && window.datosEdicion.email ? window.datosEdicion.email : '';
    let vVO = window.modoEdicion && window.datosEdicion && window.datosEdicion.entregaVO ? window.datosEdicion.entregaVO : 'NO';
    
    let lockStyle = window.modoEdicion ? 'readonly style="opacity:0.6; pointer-events:none;' : 'style="';
    let lockSelect = window.modoEdicion ? 'disabled style="opacity:0.6;' : 'style="';
    let lockCheck = window.modoEdicion ? 'checked disabled' : '';

    Swal.fire({
        title: window.modoEdicion ? 'CONFIRMA EL CAMBIO' : 'COMPLETA TU RESERVA',
        html: `
            <div style="font-size:12px; font-weight:300; opacity:0.9; margin-bottom:20px; line-height:1.5; text-align:left; background:rgba(255,255,255,0.05); padding:15px; border-radius:18px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:10px; font-weight:800; color:var(--vw-light); letter-spacing:1px; margin-bottom:5px; text-transform:uppercase;">Vehículo Verificado</div>
                🚗 Cita para tu <b style="color:white; text-transform:uppercase;">${modeloCoche}</b><br>
                📌 Matrícula: <b style="color:white;">${matOficial}</b><br>
                📅 ${window.modoEdicion ? 'Nuevo Horario' : 'Horario'}: <b style="color:white;">${fechaVisual} a las ${window.horaSeleccionadaParaReserva}h</b>
            </div>

            <div style="text-align:left;">
                <label style="display:block; font-size:10px; font-weight:800; color:rgba(255,255,255,0.5); margin-bottom:5px; text-transform:uppercase;">Nombre y Apellidos</label>
                <input id="form-nombre" class="swal2-input" ${lockStyle} width:100% !important; margin:0 0 15px 0 !important; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.2); color:white; border-radius:12px; font-size:14px; padding:12px;" value="${vNombre}" placeholder="Tu nombre completo">

                <label style="display:block; font-size:10px; font-weight:800; color:rgba(255,255,255,0.5); margin-bottom:5px; text-transform:uppercase;">Número de Teléfono</label>
                <input id="form-telefono" type="tel" class="swal2-input" ${lockStyle} width:100% !important; margin:0 0 15px 0 !important; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.2); color:white; border-radius:12px; font-size:14px; padding:12px;" value="${vTlf}" placeholder="Ej: 600000000" maxlength="15">

                <label style="display:block; font-size:10px; font-weight:800; color:rgba(255,255,255,0.5); margin-bottom:5px; text-transform:uppercase;">Correo Electrónico</label>
                <input id="form-email" type="email" class="swal2-input" ${lockStyle} width:100% !important; margin:0 0 15px 0 !important; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.2); color:white; border-radius:12px; font-size:14px; padding:12px;" value="${vEmail}" placeholder="ejemplo@correo.com">

                <label style="display:block; font-size:10px; font-weight:800; color:rgba(255,255,255,0.5); margin-bottom:5px; text-transform:uppercase;">¿Entregas un vehículo usado (VO)?</label>
                <select id="form-vo" class="swal2-select" ${lockSelect} width:100% !important; margin:0 0 15px 0 !important; background:#001E50; border:1px solid rgba(255,255,255,0.2); color:white; border-radius:12px; font-size:13px; padding:12px; font-weight:bold;">
                    <option value="NO" ${vVO === 'NO' ? 'selected' : ''}>NO, SOLO RECOJO EL NUEVO VOLKSWAGEN</option>
                    <option value="SI" ${vVO === 'SI' ? 'selected' : ''}>SÍ, ENTREGO MI VEHÍCULO ANTIGUO</option>
                </select>

                <div style="display:flex; align-items:flex-start; gap:10px; margin-top:5px; background:rgba(0,0,0,0.2); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
                    <input type="checkbox" id="form-lopd" ${lockCheck} style="margin-top:2px; width:18px; height:18px; cursor:pointer;">
                    <label for="form-lopd" style="font-size:10px; color:rgba(255,255,255,0.7); line-height:1.4; text-align:left; cursor:pointer; margin:0;">
                        He leído y acepto la <a href="#" onclick="window.mostrarPoliticaPrivacidad(event)" style="color:var(--vw-light); text-decoration:underline;">Política de Privacidad</a>.
                    </label>
                </div>
            </div>
        `,
        background: 'linear-gradient(145deg, #001E50 0%, #000510 100%)',
        color: '#fff',
        showCancelButton: true,
        confirmButtonColor: '#00b0f0',
        cancelButtonColor: 'transparent',
        confirmButtonText: 'CONFIRMAR CITA 📅',
        cancelButtonText: 'CANCELAR',
        customClass: { cancelButton: 'border border-gray-500 text-gray-500', popup: 'border border-gray-600 rounded-3xl' },
        preConfirm: () => {
            const nombre = document.getElementById('form-nombre').value.trim();
            const telefono = document.getElementById('form-telefono').value.trim();
            const email = document.getElementById('form-email').value.trim();
            const vo = document.getElementById('form-vo').value;
            const lopd = document.getElementById('form-lopd').checked;

            if (!nombre || nombre.length < 3) return Swal.showValidationMessage('Introduce tu nombre completo');
            if (!telefono || telefono.length < 9) return Swal.showValidationMessage('Teléfono no válido');
            if (!lopd) return Swal.showValidationMessage('Debes aceptar la Política de Privacidad');

            return { nombre, telefono, email, vo };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const { nombre, telefono, email, vo } = result.value;
            Swal.fire({title: 'Procesando tu reserva...', didOpen: () => Swal.showLoading(), allowOutsideClick: false, background: '#001E50', color: '#fff'});
            
            try {
                const qCheck = window.query(window.collection(window.db, "citas_agenda"), window.where("fecha", "==", window.fechaSeleccionadaParaReserva));
                const snapCheck = await window.getDocs(qCheck);
                
                let ocupadas = 0;
                let agentesOcupados = [];
                snapCheck.forEach(doc => {
                    let data = doc.data();
                    if (data.hora === window.horaSeleccionadaParaReserva) {
                        ocupadas++;
                        if (data.agente) agentesOcupados.push(data.agente);
                    }
                });

                let capacidadMaxima = (window.horaSeleccionadaParaReserva === '19:00') ? 1 : 2;

                if (ocupadas >= capacidadMaxima) {
                    Swal.fire('¡Lo sentimos!', 'Esta hora acaba de ser reservada por otro cliente.', 'error');
                    window.mostrarHoras(window.fechaSeleccionadaParaReserva, "el día seleccionado");
                    return;
                }

                let agenteAsignado = "MANUEL";
                if (window.horaSeleccionadaParaReserva !== '19:00' && ocupadas === 1) {
                    agenteAsignado = (agentesOcupados[0] === "MANUEL") ? "ANTONIO" : "MANUEL";
                } else if (ocupadas === 0) {
                    agenteAsignado = Math.random() < 0.5 ? "MANUEL" : "ANTONIO";
                }

                const qAntigua = window.query(window.collection(window.db, "citas_agenda"), window.where("matricula", "==", matOficial));
                const snapAntigua = await window.getDocs(qAntigua);
                for (const docAntiguo of snapAntigua.docs) {
                    await window.deleteDoc(window.doc(window.db, "citas_agenda", docAntiguo.id));
                }

                let idCita = new Date().getTime().toString();
                await window.setDoc(window.doc(window.db, "citas_agenda", idCita), {
                    fecha: window.fechaSeleccionadaParaReserva,
                    hora: window.horaSeleccionadaParaReserva,
                    matricula: matOficial,
                    modelo: modeloCoche,
                    bastidor: bastidorCoche,
                    cliente: nombre,
                    telefono: telefono,
                    email: email,
                    entregaVO: vo,
                    agente: agenteAsignado,
                    creadoEn: new Date().toISOString(),
                    lopdAceptada: true
                });

                if (window.datosCocheReserva.id) {
                    await window.updateDoc(window.doc(window.db, "vehiculos", window.datosCocheReserva.id), {
                        fechaCita: `${fechaVisual} - ${window.horaSeleccionadaParaReserva}h`,
                        agente: agenteAsignado,
                        cliente: nombre,
                        entregaVO: vo
                    });
                }
                
                if (email && email.includes('@')) {
                    try {
                        let accionCorreo = window.modoEdicion ? "modificar_correo" : "enviar_correo";
                        
                        fetch(API_URL, {
                            method: 'POST',
                            mode: 'no-cors', 
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({
                                action: accionCorreo, 
                                email: email, 
                                cliente: nombre,
                                modelo: modeloCoche, 
                                matricula: matOficial,
                                fecha: fechaVisual, 
                                hora: window.horaSeleccionadaParaReserva, 
                                agente: agenteAsignado
                            })
                        });
                        
                        window.modoEdicion = false;
                    } catch(err) {
                        console.error("Error en el bloque de correo:", err);
                    }
                }

                Swal.fire({
                    title: '¡CITA RESERVADA!', 
                    html: `<div style="font-size:14px; font-weight:300;">Se ha enviado un comprobante a:<br><b style="color:var(--vw-light);">${email}</b>.<br><br>Tu especialista asignado es: <b>${agenteAsignado}</b>.</div>`, 
                    icon: 'success', background: '#001E50', color: '#fff', confirmButtonColor: '#00b0f0'
                }).then(() => {
                    document.getElementById('mi-agenda-privada').style.display = 'none';
                    document.getElementById('botones-inicio').style.display = 'block';
                    
                    user = {
                        name: nombre,
                        car: typeof cars !== 'undefined' ? cars.find(c => modeloCoche.toUpperCase().includes(c.name.toUpperCase())) || cars[0] : {name: modeloCoche},
                        deliveryDate: `${window.fechaSeleccionadaParaReserva}T${window.horaSeleccionadaParaReserva}:00`,
                        agente: agenteAsignado,
                        entregaVO: vo,
                        matricula: matOficial
                    };
                    localStorage.setItem('vw_user_data', JSON.stringify(user));
                    location.reload();
                });

            } catch (e) {
                console.error("Error al procesar reserva:", e);
                Swal.fire('Error de Red', 'No se ha podido procesar la reserva. Revisa tu conexión.', 'error');
            }
        }
    });
};
