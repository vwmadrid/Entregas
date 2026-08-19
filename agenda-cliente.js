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
window.citaEdicionId = null;

function normalizarTextoPlano(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();
}

function normalizarFechaIso(valor) {
    if (!valor && valor !== 0) return "";

    if (valor && typeof valor === "object") {
        if (typeof valor.toDate === "function") {
            const d = valor.toDate();
            if (d && !Number.isNaN(d.getTime())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                return `${y}-${m}-${dd}`;
            }
        }
        if (typeof valor.seconds === "number") {
            const d = new Date(valor.seconds * 1000);
            if (!Number.isNaN(d.getTime())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                return `${y}-${m}-${dd}`;
            }
        }
    }

    const txt = String(valor || "").trim();
    if (!txt) return "";

    const iso = txt.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

    const dmy = txt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
        const dd = String(Number(dmy[1])).padStart(2, "0");
        const mm = String(Number(dmy[2])).padStart(2, "0");
        return `${dmy[3]}-${mm}-${dd}`;
    }

    const fechaHora = txt.match(/^(\d{4})-(\d{2})-(\d{2})[T\s].*$/);
    if (fechaHora) return `${fechaHora[1]}-${fechaHora[2]}-${fechaHora[3]}`;

    const fecha = new Date(txt.replace(" ", "T"));
    if (!Number.isNaN(fecha.getTime())) {
        const y = fecha.getFullYear();
        const m = String(fecha.getMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
    }

    return "";
}

function normalizarHoraHHMM(valor) {
    if (!valor && valor !== 0) return "";

    const txt = String(valor || "").trim();
    if (!txt) return "";

    const m = txt.match(/(\d{1,2})\s*[:.]\s*(\d{2})/);
    if (m) {
        const h = String(Number(m[1])).padStart(2, "0");
        const min = String(Number(m[2])).padStart(2, "0");
        return `${h}:${min}`;
    }

    const hSimple = txt.match(/(\d{1,2})\s*h?/i);
    if (hSimple) {
        const h = String(Number(hSimple[1])).padStart(2, "0");
        return `${h}:00`;
    }

    return "";
}

function obtenerMinutosHora(hora) {
    const h = normalizarHoraHHMM(hora);
    if (!h) return Number.NaN;
    const [horas, mins] = h.split(":");
    return Number(horas) * 60 + Number(mins);
}

function normalizarTipoBloqueo(valor) {
    const txt = normalizarTextoPlano(valor || "");
    if (["VACACIONES", "DIA_COMPLETO", "DIA COMPLETO", "DIA_LIBRE", "DIA LIBRE", "LIBRE"].includes(txt)) return "dia_completo";
    if (["HORA_SUELTA", "HORA SUELTA", "HORA", "TRAMO_HORA", "TRAMO HORA"].includes(txt)) return "hora_suelta";
    return "";
}

function esBloqueoDiaCompleto(bloqueo) {
    return normalizarTipoBloqueo(bloqueo?.tipo || bloqueo?.motivo || bloqueo?.tipoBloqueo || "") === "dia_completo";
}

function bloqueoAfectaFecha(bloqueo, fechaIso) {
    const tipo = normalizarTipoBloqueo(bloqueo?.tipo || bloqueo?.motivo || bloqueo?.tipoBloqueo || "");
    if (!tipo) return false;

    const inicio = normalizarFechaIso(bloqueo?.fechaInicio || bloqueo?.fecha || bloqueo?.fechaInicioBloqueo || "");
    const fin = normalizarFechaIso(bloqueo?.fechaFin || bloqueo?.fechaFinBloqueo || "");

    if (inicio && fin) return fechaIso >= inicio && fechaIso <= fin;
    if (inicio) return fechaIso === inicio;
    if (fin) return fechaIso === fin;
    return false;
}

function bloqueoAfectaHora(bloqueo, fechaIso, horaSlot, agente = null) {
    const tipo = normalizarTipoBloqueo(bloqueo?.tipo || bloqueo?.motivo || bloqueo?.tipoBloqueo || "");
    if (!tipo) return false;
    if (!bloqueoAfectaFecha(bloqueo, fechaIso)) return false;

    const agenteBloqueado = normalizarTextoPlano(bloqueo?.agente || bloqueo?.operarioAfectado || bloqueo?.operario || "");
    if (agenteBloqueado && agenteBloqueado !== "AMBOS" && agente !== null && agenteBloqueado !== agente) {
        return false;
    }
    if (agenteBloqueado && agenteBloqueado !== "AMBOS" && agente === null) {
        return false;
    }

    const horaSlotNorm = normalizarHoraHHMM(horaSlot);

    if (tipo === "dia_completo") return true;
    if (tipo !== "hora_suelta") return false;

    if (bloqueo?.hora) {
        const horaBloqueo = normalizarHoraHHMM(bloqueo.hora);
        return !!horaBloqueo && horaBloqueo === horaSlotNorm;
    }

    if (bloqueo?.horaInicio && bloqueo?.horaFin) {
        const ini = normalizarHoraHHMM(bloqueo.horaInicio);
        const fin = normalizarHoraHHMM(bloqueo.horaFin);
        const slotMin = obtenerMinutosHora(horaSlotNorm);
        const iniMin = obtenerMinutosHora(ini);
        const finMin = obtenerMinutosHora(fin);
        return !Number.isNaN(slotMin) && !Number.isNaN(iniMin) && !Number.isNaN(finMin) && slotMin >= iniMin && slotMin <= finMin;
    }

    return false;
}

async function cargarDatosDia(fechaIso) {
    const [citasSnap, bloqueosSnap] = await Promise.all([
        window.getDocs(window.collection(window.db, "citas_agenda")),
        window.getDocs(window.collection(window.db, "bloqueos_agenda"))
    ]);

    const citas = [];
    citasSnap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const fechaCita = normalizarFechaIso(
            data.fecha
            || data.fechaCita
            || data.fechaProgramada
            || data.fechaHora
            || data.fecha_hora
            || data.fechaProgramacion
            || data.fechaProgramadaCita
            || ""
        );
        if (!fechaCita || fechaCita !== fechaIso) return;

        const horaCita = normalizarHoraHHMM(
            data.hora
            || data.horaCita
            || data.horaProgramada
            || data.hora_programada
            || data.horaCitaProgramada
            || data.horaProgramacion
            || ""
        );
        citas.push({
            id: docSnap.id,
            ...data,
            fecha: fechaCita,
            hora: horaCita || data.hora || ""
        });
    });

    const bloqueos = [];
    bloqueosSnap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        if (!bloqueoAfectaFecha(data, fechaIso)) return;
        bloqueos.push({ id: docSnap.id, ...data });
    });

    return { citas, bloqueos };
}

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
            // 🔥 1. PREPARACIÓN DE VARIANTES DE BÚSQUEDA
            // El input ya viene sin espacios desde el preConfirm (Ej: "1234ABC")
            let matLimpia = matriculaInput; 
            let matConEspacio = matLimpia;
            
            // Si el cliente metió una matrícula estándar (4 números + 3 letras), preparamos la versión con espacio (Ej: "1234 ABC")
            if (/^\d{4}[A-Z]{3}$/.test(matLimpia)) {
                matConEspacio = matLimpia.substring(0,4) + ' ' + matLimpia.substring(4);
            }

            const vehRef = window.collection(window.db, "vehiculos");
            
            // 🔥 2. BÚSQUEDA DE FRANCOTIRADOR
            // Preparamos las consultas exactas al servidor para no descargar la base de datos entera
            const busquedas = [
                window.getDocs(window.query(vehRef, window.where("matricula", "==", matLimpia))),
                window.getDocs(window.query(vehRef, window.where("Matricula", "==", matLimpia))),
                window.getDocs(window.query(vehRef, window.where("bastidor", "==", matLimpia)))
            ];

            // Si hay versión con espacio, la añadimos a los disparos
            if (matConEspacio !== matLimpia) {
                busquedas.push(window.getDocs(window.query(vehRef, window.where("matricula", "==", matConEspacio))));
                busquedas.push(window.getDocs(window.query(vehRef, window.where("Matricula", "==", matConEspacio))));
            }

            // Ejecutamos todos los disparos a la vez (muchísimo más rápido y barato)
            const resultados = await Promise.all(busquedas);

            let encontrado = false;
            let enConcesionario = false;
            let yaTieneCita = false;
            let fechaExistente = "";
            let cocheEncontradoParaCita = null;

            // 🔥 3. PROCESAMIENTO EXCLUSIVO DE LOS RESULTADOS
            resultados.forEach(querySnapshot => {
                querySnapshot.forEach((doc) => {
                    const c = doc.data();
                    
                    // Si el coche ya fue entregado en el pasado, lo ignoramos para que no pueda volver a pedir cita
                    if (c.entregado === true || c.entregado === "true") return;

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
                });
            });

            // ==========================================
            // RESTO DE TU LÓGICA DE ALERTAS (INTACTA)
            // ==========================================
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
        window.citaEdicionId = snapshot.docs[0].id;
    } else {
        window.datosEdicion = { cliente: user.name, entregaVO: user.entregaVO, telefono: user.telefono || '', email: user.email || '' };
        window.citaEdicionId = null;
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
    const agendaUrgenteActiva = Boolean(
        cocheData && (
            cocheData.agendaClienteUrgente === true ||
            cocheData.agendaClienteUrgente === 'true' ||
            cocheData.agendaClienteUrgente === 1 ||
            cocheData.agendaClienteUrgente === '1'
        )
    );
    const diasMinimosLaborables = agendaUrgenteActiva ? 0 : 2;
    let diasDeMargen = 0;

    while (diasDeMargen < diasMinimosLaborables) {
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
        const { citas, bloqueos } = await cargarDatosDia(fechaBBDD);

        const horasBase = ['10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00'];
        const horasOcupadas = new Set();

        citas.forEach(cita => {
            const horaCita = normalizarHoraHHMM(cita.hora);
            if (!horaCita) return;
            const fechaCita = normalizarFechaIso(cita.fecha || cita.fechaCita || cita.fechaProgramada || "");
            if (fechaCita && fechaCita !== fechaBBDD) return;
            horasOcupadas.add(horaCita);
        });

        gridHoras.innerHTML = '';

        horasBase.forEach(hora => {
            const agentesLibres = ['MANUEL', 'ANTONIO'].filter((agente) => !bloqueos.some((bloqueo) => bloqueoAfectaHora(bloqueo, fechaBBDD, hora, agente)));
            const bloqueado = agentesLibres.length === 0;
            const ocupado = horasOcupadas.has(hora);
            const completo = bloqueado || ocupado;

            if (completo) {
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

    const usuarioActual = (typeof user !== 'undefined' && user) ? user : {};

    let matOficial = window.datosCocheReserva.matricula || window.datosCocheReserva.Matricula || "S/M";
    let modeloCoche = window.datosCocheReserva.modelo || "Vehículo";
    let bastidorCoche = window.datosCocheReserva.bastidor || "S/B";
    let rentingCoche = window.datosCocheReserva.renting || usuarioActual.renting || "";
    let fechaVisual = window.fechaSeleccionadaParaReserva.split('-').reverse().join('/');

    let vNombre = window.modoEdicion && window.datosEdicion ? window.datosEdicion.cliente : (window.datosCocheReserva.cliente || '');
    let vTlf = window.modoEdicion && window.datosEdicion && window.datosEdicion.telefono ? window.datosEdicion.telefono : (usuarioActual.telefono || '');
    let vEmail = window.modoEdicion && window.datosEdicion && window.datosEdicion.email ? window.datosEdicion.email : (usuarioActual.email || '');
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
                await window.ensureFirebaseAuth();
                const { citas, bloqueos } = await cargarDatosDia(window.fechaSeleccionadaParaReserva);
                const horaReserva = normalizarHoraHHMM(window.horaSeleccionadaParaReserva);
                const ocupada = citas.some((cita) => {
                    const horaCita = normalizarHoraHHMM(cita.hora);
                    const fechaCita = normalizarFechaIso(cita.fecha || cita.fechaCita || cita.fechaProgramada || "");
                    return fechaCita === window.fechaSeleccionadaParaReserva && horaCita === horaReserva;
                });
                const agentesLibres = ['MANUEL', 'ANTONIO'].filter((agente) => !bloqueos.some((bloqueo) => bloqueoAfectaHora(bloqueo, window.fechaSeleccionadaParaReserva, window.horaSeleccionadaParaReserva, agente)));
                const bloqueado = agentesLibres.length === 0;

                if (ocupada || bloqueado) {
                    Swal.fire('¡Lo sentimos!', 'Esta hora acaba de estar ocupada o está bloqueada en la agenda.', 'error');
                    window.mostrarHoras(window.fechaSeleccionadaParaReserva, "el día seleccionado");
                    return;
                }

                const agenteAsignado = agentesLibres[Math.floor(Math.random() * agentesLibres.length)];

                let idCita = window.citaEdicionId || new Date().getTime().toString();
                const citaPayload = {
                    fecha: window.fechaSeleccionadaParaReserva,
                    hora: window.horaSeleccionadaParaReserva,
                    cliente: nombre,
                    telefono: telefono,
                    email: email,
                    matricula: matOficial,
                    modelo: modeloCoche,
                    bastidor: bastidorCoche,
                    renting: rentingCoche,
                    entregaVO: 'NO',
                    agente: agenteAsignado,
                    estado: 'confirmada',
                    tipoCita: 'SOLO_DEVOLUCION_CLIENTE',
                    servicioCliente: 'SOLO_DEVOLUCION',
                    origen: 'CLIENTES_ENTREGA_WEB',
                    creadoEn: new Date().toISOString(),
                    lopdAceptada: true
                };

                if (window.modoEdicion && window.citaEdicionId) {
                    await window.updateDoc(window.doc(window.db, "citas_agenda", window.citaEdicionId), citaPayload);
                } else {
                    const qAntigua = window.query(window.collection(window.db, "citas_agenda"), window.where("matricula", "==", matOficial));
                    const snapAntigua = await window.getDocs(qAntigua);
                    for (const docAntiguo of snapAntigua.docs) {
                        await window.deleteDoc(window.doc(window.db, "citas_agenda", docAntiguo.id));
                    }
                    await window.setDoc(window.doc(window.db, "citas_agenda", idCita), citaPayload);
                }

                let vehiculoDocId = window.datosCocheReserva.id || null;
                if (!vehiculoDocId && typeof window.buscarVehiculoEnFirebase === 'function') {
                    const encontradoVehiculo = await window.buscarVehiculoEnFirebase(matOficial);
                    vehiculoDocId = encontradoVehiculo && encontradoVehiculo.id ? encontradoVehiculo.id : null;
                }

                if (vehiculoDocId) {
                    await window.updateDoc(window.doc(window.db, "vehiculos", vehiculoDocId), {
                        fechaCita: `${fechaVisual} - ${window.horaSeleccionadaParaReserva}h`,
                        agente: agenteAsignado,
                        cliente: nombre,
                        entregaVO: vo,
                        renting: rentingCoche,
                        bastidor: bastidorCoche
                    });
                }
                
                // 🔥 AQUÍ ESTÁ EL BLOQUE DE CORREO ORIGINAL RESTAURADO
                if (email && email.includes('@')) {
                    try {
                        let accionCorreo = window.modoEdicion ? "modificar_correo" : "enviar_correo";
                        
                        await fetch(API_URL, {
                            method: 'POST',
                            mode: 'no-cors', 
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({
                                action: accionCorreo, 
                                email: email, 
                                cliente: nombre,
                                modelo: modeloCoche, 
                                matricula: matOficial,
                                renting: rentingCoche,
                                bastidor: bastidorCoche,
                                fecha: fechaVisual, 
                                hora: window.horaSeleccionadaParaReserva, 
                                agente: agenteAsignado
                            })
                        });
                        
                        window.modoEdicion = false;
                        window.citaEdicionId = null;
                    } catch(err) {
                        console.error("Error en el bloque de correo:", err);
                    }
                }

                window.modoEdicion = false;
                window.citaEdicionId = null;

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
                        matricula: matOficial,
                        telefono: telefono,
                        email: email
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