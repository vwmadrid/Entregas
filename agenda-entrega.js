import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCRfERugbIVfAXtKa7mGdLLTm6xwxb5wlE",
    authDomain: "gestion-flotas-vw.firebaseapp.com",
    projectId: "gestion-flotas-vw",
    storageBucket: "gestion-flotas-vw.firebasestorage.app",
    messagingSenderId: "1070891769268",
    appId: "1:1070891769268:web:47b04e6d62e576038966e1"
};

const API_URL = atob("aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4UTVtTUNDN0RBMHdybHBhWlM2RWtzVUFJa29EZ3djZUljRk9iZXZFWGVpOG16RXcxV1ZmT3pnS2RycUJJaTc2cC1DUS9leGVj");

const HORAS_ENTREGA = ["10:00", "11:00", "12:00", "13:00", "16:00", "17:00", "18:00", "19:00"];
const HORAS_DEVOLUCION = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"];
const AGENTES = ["MANUEL", "ANTONIO"];
const ESTADO = {
    tipoCita: "SOLO_DEVOLUCION",
    fechaIso: "",
    fechaLabel: "",
    hora: ""
};

let db;

function esHostLocal() {
    const host = String(location.hostname || "").toLowerCase();
    return host === "localhost" || host === "127.0.0.1";
}

function limpiarDebugAppCheckEnProduccion() {
    if (esHostLocal()) return;

    try { delete self.FIREBASE_APPCHECK_DEBUG_TOKEN; } catch (_) {}
    try { self.FIREBASE_APPCHECK_DEBUG_TOKEN = undefined; } catch (_) {}

    // Limpieza defensiva por si quedó persistido desde pruebas locales.
    try { localStorage.removeItem("firebase-app-check-debug-token"); } catch (_) {}
    try { sessionStorage.removeItem("firebase-app-check-debug-token"); } catch (_) {}
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function normalizarMatricula(value) {
    return String(value || "").toUpperCase().replace(/\s/g, "").trim();
}

function esEmailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function fechaVisualDesdeIso(fechaIso) {
    const p = String(fechaIso).split("-");
    if (p.length !== 3) return fechaIso;
    return `${p[2]}/${p[1]}/${p[0]}`;
}

function normalizarFechaIso(valor) {
    if (valor && typeof valor === "object") {
        if (typeof valor.toDate === "function") {
            const d = valor.toDate();
            if (d && !isNaN(d.getTime())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                return `${y}-${m}-${dd}`;
            }
        }
        if (typeof valor.seconds === "number") {
            const d = new Date(valor.seconds * 1000);
            if (!isNaN(d.getTime())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                return `${y}-${m}-${dd}`;
            }
        }
    }

    const txt = String(valor || "").trim();
    if (!txt) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(txt)) return txt;

    const isoConHora = txt.match(/^(\d{4})-(\d{2})-(\d{2})[T\s].*$/);
    if (isoConHora) {
        return `${isoConHora[1]}-${isoConHora[2]}-${isoConHora[3]}`;
    }

    const ddmmyyyy = txt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
        const dd = String(Number(ddmmyyyy[1])).padStart(2, "0");
        const mm = String(Number(ddmmyyyy[2])).padStart(2, "0");
        const yyyy = ddmmyyyy[3];
        return `${yyyy}-${mm}-${dd}`;
    }

    const alt = new Date(txt.replace(" ", "T"));
    if (isNaN(alt.getTime())) return "";
    const y = alt.getFullYear();
    const m = String(alt.getMonth() + 1).padStart(2, "0");
    const d = String(alt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function extraerFechaIsoDesdeFechaHoraRaw(valor) {
    if (!valor) return "";
    let f = null;

    if (typeof valor?.toDate === "function") {
        f = valor.toDate();
    } else if (typeof valor?.seconds === "number") {
        f = new Date(valor.seconds * 1000);
    } else {
        const txt = String(valor).trim();
        if (!txt) return "";
        f = new Date(txt.replace(" ", "T"));
    }

    if (!f || isNaN(f.getTime())) return "";
    const y = f.getFullYear();
    const m = String(f.getMonth() + 1).padStart(2, "0");
    const d = String(f.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function extraerHoraHHMMDesdeFechaHoraRaw(valor) {
    if (!valor) return "";
    let f = null;

    if (typeof valor?.toDate === "function") {
        f = valor.toDate();
    } else if (typeof valor?.seconds === "number") {
        f = new Date(valor.seconds * 1000);
    } else {
        const txt = String(valor).trim();
        if (!txt) return "";
        f = new Date(txt.replace(" ", "T"));
    }

    if (!f || isNaN(f.getTime())) return "";
    return `${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
}

function obtenerMinutosHora(hhmm) {
    const m = String(hhmm || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return NaN;
    return Number(m[1]) * 60 + Number(m[2]);
}

function normalizarHoraHHMM(valor) {
    const t = String(valor || "")
        .trim()
        .toLowerCase()
        .replace(/\./g, ":")
        .replace(/\s+/g, " ");

    const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*h?\b/);
    if (!m) return "";
    const h = String(Number(m[1])).padStart(2, "0");
    const mm = String(Number(m[2] || "0")).padStart(2, "0");
    return `${h}:${mm}`;
}

function normalizarTextoPlano(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
}

function esSoloDevolucion() {
    return ESTADO.tipoCita === "SOLO_DEVOLUCION";
}

function obtenerDiasLaborables(limit = 21, diasMinimosLaborables = 3) {
    const dias = [];
    const cursor = new Date();

    let margen = 0;
    while (margen < diasMinimosLaborables) {
        cursor.setDate(cursor.getDate() + 1);
        const dia = cursor.getDay();
        if (dia !== 0 && dia !== 6) margen++;
    }

    let primeraIteracion = true;
    while (dias.length < limit) {
        if (!(diasMinimosLaborables === 0 && primeraIteracion)) {
            cursor.setDate(cursor.getDate() + 1);
        }
        primeraIteracion = false;

        const dia = cursor.getDay();
        if (dia === 0 || dia === 6) continue;

        const yyyy = cursor.getFullYear();
        const mm = String(cursor.getMonth() + 1).padStart(2, "0");
        const dd = String(cursor.getDate()).padStart(2, "0");
        const iso = `${yyyy}-${mm}-${dd}`;
        const shortWeek = cursor.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase().replace(".", "");

        dias.push({
            iso,
            shortWeek,
            dayNum: dd
        });
    }

    return dias;
}

async function cargarDatosDia(fechaIso) {
    const citasPorFechaSnap = await getDocs(query(collection(db, "citas_agenda"), where("fecha", "==", fechaIso)));
    const citasTotalesSnap = await getDocs(collection(db, "citas_agenda"));
    const bloqueosSnap = await getDocs(collection(db, "bloqueos_agenda"));

    const citasMap = new Map();

    const fechaIsoDeCita = (cita = {}) => {
        const fechaCandidata = cita.fecha
            || cita.fechaCita
            || cita.fechaProgramada
            || cita.fecha_cita
            || "";

        // Soporta 'DD/MM/YYYY - HH:MMh' sin romper 'YYYY-MM-DD'.
        const fechaCandidataTxt = String(fechaCandidata || "").trim();
        const fechaSolo = fechaCandidataTxt.includes(" - ")
            ? fechaCandidataTxt.split(" - ")[0].trim()
            : fechaCandidataTxt;
        const fechaNormalizada = normalizarFechaIso(fechaSolo || fechaCandidata || "");
        if (fechaNormalizada) return fechaNormalizada;

        const fechaHoraRaw = cita.fechaHora || cita.fecha_hora || cita.fechaProgramada || null;
        return extraerFechaIsoDesdeFechaHoraRaw(fechaHoraRaw);
    };

    const horaHHMMDeCita = (cita = {}) => {
        const horaTxt = normalizarHoraHHMM(
            cita.hora
            || cita.horaCita
            || cita.horaProgramada
            || cita.hora_programada
            || cita.horaCitaProgramada
            || ""
        );
        if (horaTxt) return horaTxt;

        const textoFecha = String(cita.fechaCita || cita.fechaProgramada || cita.fecha || "");
        if (textoFecha) {
            const m = textoFecha.match(/(\d{1,2}:\d{2})\s*h?/i);
            if (m && m[1]) {
                const horaEnTexto = normalizarHoraHHMM(m[1]);
                if (horaEnTexto) return horaEnTexto;
            }
        }

        const fechaHoraRaw = cita.fechaHora || cita.fecha_hora || cita.fechaProgramada || null;
        return extraerHoraHHMMDesdeFechaHoraRaw(fechaHoraRaw);
    };

    const registrarCita = (docSnap) => {
        const base = { id: docSnap.id, ...(docSnap.data() || {}) };
        const fechaNorm = fechaIsoDeCita(base);
        if (fechaNorm !== fechaIso) return;

        const horaNorm = horaHHMMDeCita(base);
        const enriquecida = {
            ...base,
            fecha: fechaNorm,
            hora: horaNorm || String(base.hora || "")
        };
        citasMap.set(docSnap.id, enriquecida);
    };

    citasPorFechaSnap.forEach(registrarCita);
    citasTotalesSnap.forEach(registrarCita);

    const citas = Array.from(citasMap.values());

    const bloqueos = [];
    bloqueosSnap.forEach((d) => bloqueos.push({ id: d.id, ...(d.data() || {}) }));

    return { citas, bloqueos };
}

function esCitaDevolucion(cita = {}) {
    const modelo = String(cita.modelo || "").toUpperCase();
    const tipo = String(cita.tipoCita || "").toUpperCase();
    const servicio = String(cita.servicioCliente || "").toUpperCase();
    return tipo === "SOLO_DEVOLUCION_CLIENTE"
        || servicio === "SOLO_DEVOLUCION"
        || modelo.includes("DEVOLUCION")
        || modelo.includes("DEVOLUCIÓN");
}

function bloqueoAfectaAgente(bloqueo, agente) {
    const agenteTxt = normalizarTextoPlano(bloqueo.operarioAfectado || bloqueo.agente || "AMBOS");
    const agenteNorm = normalizarTextoPlano(agente);

    if (!agenteTxt || agenteTxt === "AMBOS") return true;
    if (agenteTxt.includes("AMBOS")) return true;
    if (agenteNorm === "MANUEL" && agenteTxt.includes("MANUEL")) return true;
    if (agenteNorm === "ANTONIO" && agenteTxt.includes("ANTONIO")) return true;
    return false;
}

function fechaBloqueoEnRango(bloqueo, fechaIso) {
    const inicio = String(bloqueo.fechaInicio || bloqueo.fecha || "");
    const fin = String(bloqueo.fechaFin || bloqueo.fechaInicio || bloqueo.fecha || "");
    return !!inicio && fechaIso >= inicio && fechaIso <= fin;
}

function esBloqueoDiaCompletoOTipoLibre(bloqueo) {
    const tipoPlano = normalizarTextoPlano(bloqueo.tipo || "vacaciones");
    return tipoPlano === "VACACIONES"
        || tipoPlano === "DIA_COMPLETO"
        || tipoPlano === "DIA COMPLETO"
        || tipoPlano === "DIA_LIBRE"
        || tipoPlano === "DIA LIBRE"
        || tipoPlano === "LIBRE";
}

    function esTipoHoraSuelta(bloqueo) {
        const tipoPlano = normalizarTextoPlano(bloqueo.tipo || "");
        return tipoPlano === "HORA_SUELTA"
        || tipoPlano === "HORA SUELTA"
        || tipoPlano === "HORA"
        || tipoPlano === "TRAMO_HORA"
        || tipoPlano === "TRAMO HORA";
    }

function estaBloqueadoAgenteEnSlot(bloqueo, agente, fechaIso, slotHora) {
    if (!bloqueoAfectaAgente(bloqueo, agente)) return false;

    const tipo = String(bloqueo.tipo || "vacaciones").toLowerCase();
    const slotNorm = normalizarHoraHHMM(slotHora);

    if (tipo === "dia_completo" || tipo === "vacaciones" || esBloqueoDiaCompletoOTipoLibre(bloqueo)) {
        return fechaBloqueoEnRango(bloqueo, fechaIso);
    }

    if (tipo === "hora_suelta" || esTipoHoraSuelta(bloqueo)) {
        const fechaBloqueo = String(bloqueo.fecha || bloqueo.fechaInicio || "");
        if (fechaBloqueo !== fechaIso) return false;

        if (bloqueo.hora) {
            const horaBloqueoNorm = normalizarHoraHHMM(bloqueo.hora);
            if (!horaBloqueoNorm) return false;

            if (horaBloqueoNorm.endsWith(":00") && mismaHoraBase(horaBloqueoNorm, slotNorm)) {
                return true;
            }

            return horaBloqueoNorm === slotNorm;
        }

        if (bloqueo.horaInicio && bloqueo.horaFin) {
            const slot = obtenerMinutosHora(slotNorm);
            const horaIniNorm = normalizarHoraHHMM(bloqueo.horaInicio);
            const horaFinNorm = normalizarHoraHHMM(bloqueo.horaFin);
            const ini = obtenerMinutosHora(horaIniNorm);
            const fin = obtenerMinutosHora(horaFinNorm);
            if (Number.isNaN(slot) || Number.isNaN(ini) || Number.isNaN(fin)) return false;

            // Si el rango viene en una hora exacta (16:00-16:00), se bloquea
            // también la media hora de ese tramo.
            if (horaIniNorm === horaFinNorm && horaIniNorm.endsWith(":00") && mismaHoraBase(horaIniNorm, slotNorm)) {
                return true;
            }

            return slot >= ini && slot <= fin;
        }
    }

    return false;
}

function agenteConDiaLibreCompleto(agente, bloqueos, fechaIso) {
    return (Array.isArray(bloqueos) ? bloqueos : []).some((b) => {
        if (!bloqueoAfectaAgente(b, agente)) return false;
        if (!esBloqueoDiaCompletoOTipoLibre(b)) return false;
        return fechaBloqueoEnRango(b, fechaIso);
    });
}

function agenteDisponiblePorReglaHorario(agente, horaSlot) {
    const minutos = obtenerMinutosHora(horaSlot);
    if (Number.isNaN(minutos)) return false;

    // Antonio no puede aceptar devoluciones más allá de las 19:00.
    if (normalizarTextoPlano(agente) === "ANTONIO" && minutos > obtenerMinutosHora("19:00")) {
        return false;
    }

    return true;
}

function horaRaiz(horaSlot) {
    const horaNormalizada = normalizarHoraHHMM(horaSlot);
    const [h] = String(horaNormalizada || "").split(":");
    return `${String(h || "00").padStart(2, "0")}:00`;
}

function mismaHoraBase(h1, h2) {
    return horaRaiz(h1) === horaRaiz(h2);
}

function obtenerDisponibilidadSlot(citas, bloqueos, fechaIso, horaSlot) {
    const isDev = esSoloDevolucion();
    const horaSlotNorm = normalizarHoraHHMM(horaSlot);
    const horaBase = horaRaiz(horaSlotNorm);

    const bloqueoGlobalFranja = (Array.isArray(bloqueos) ? bloqueos : []).some((b) => {
        const agenteAfectado = normalizarTextoPlano(b.operarioAfectado || b.agente || "AMBOS");
        const esGlobal = !agenteAfectado || agenteAfectado.includes("AMBOS");
        if (!esGlobal) return false;

        const fechaBloqueo = String(b.fecha || b.fechaInicio || "");
        if (fechaBloqueo !== fechaIso) return false;
        if (!esTipoHoraSuelta(b) && String(b.tipo || "").toLowerCase() !== "hora_suelta") return false;

        if (b.hora) {
            const horaBloqueoNorm = normalizarHoraHHMM(b.hora);
            if (!horaBloqueoNorm) return false;
            if (horaBloqueoNorm.endsWith(":00") && mismaHoraBase(horaBloqueoNorm, horaSlotNorm)) return true;
            return horaBloqueoNorm === horaSlotNorm;
        }

        if (b.horaInicio && b.horaFin) {
            const iniNorm = normalizarHoraHHMM(b.horaInicio);
            const finNorm = normalizarHoraHHMM(b.horaFin);
            if (!iniNorm || !finNorm) return false;

            if (iniNorm === finNorm && iniNorm.endsWith(":00") && mismaHoraBase(iniNorm, horaSlotNorm)) return true;

            const slot = obtenerMinutosHora(horaSlotNorm);
            const ini = obtenerMinutosHora(iniNorm);
            const fin = obtenerMinutosHora(finNorm);
            if (Number.isNaN(slot) || Number.isNaN(ini) || Number.isNaN(fin)) return false;
            return slot >= ini && slot <= fin;
        }

        return false;
    });

    if (bloqueoGlobalFranja) {
        return { disponible: false, razon: "Bloqueo manual global" };
    }

    const entregasHora = citas.filter((c) => {
        if (!c) return false;
        const horaCitaNorm = normalizarHoraHHMM(c.hora || "");
        if (!horaCitaNorm) return false;
        if (horaRaiz(horaCitaNorm) !== horaBase) return false;
        return !esCitaDevolucion(c);
    });

    const devolucionesExactas = citas.filter((c) => {
        if (!c) return false;
        const horaCitaNorm = normalizarHoraHHMM(c.hora || "");
        if (horaCitaNorm !== horaSlotNorm) return false;
        return esCitaDevolucion(c);
    });

    if (isDev && entregasHora.length > 0) {
        return { disponible: false, razon: "Hay una entrega en esa hora" };
    }

    const agentesLibres = AGENTES.filter((agente) => {
        if (!agenteDisponiblePorReglaHorario(agente, horaSlot)) return false;

        const bloqueado = bloqueos.some((b) => estaBloqueadoAgenteEnSlot(b, agente, fechaIso, horaSlot));
        if (bloqueado) return false;

        const ocupadoPorEntrega = entregasHora.some((c) => normalizarTextoPlano(c.agente || "") === normalizarTextoPlano(agente));
        if (ocupadoPorEntrega) return false;

        if (isDev) {
            const ocupadoPorDevolucion = devolucionesExactas.some((c) => normalizarTextoPlano(c.agente || "") === normalizarTextoPlano(agente));
            if (ocupadoPorDevolucion) return false;
        }

        return true;
    });

    if (isDev) {
        if (devolucionesExactas.length >= 1) {
            return { disponible: false, razon: "Hueco de devolucion ocupado" };
        }
        if (agentesLibres.length === 0) {
            return { disponible: false, razon: "Bloqueado por agenda" };
        }
        return { disponible: true, agentesLibres };
    }

    // Recogida de coche nuevo: 1 coche por hora en total.
    if (entregasHora.length >= 1) {
        return { disponible: false, razon: "Hora ocupada por otra entrega" };
    }
    if (agentesLibres.length === 0) {
        return { disponible: false, razon: "Bloqueado por agenda" };
    }

    return { disponible: true, agentesLibres };
}

function elegirAgente(agentesLibres = []) {
    if (!Array.isArray(agentesLibres) || agentesLibres.length === 0) return "MANUEL";
    if (agentesLibres.length === 1) return agentesLibres[0];
    return Math.random() < 0.5 ? agentesLibres[0] : agentesLibres[1];
}

function actualizarEstado(texto, isError = false) {
    const el = document.getElementById("agenda-status");
    if (!el) return;
    el.textContent = texto;
    el.style.color = isError ? "#fecaca" : "#9db4cf";
}

function actualizarBotonReserva() {
    const btn = document.getElementById("btn-reservar");
    if (!btn) return;
    btn.disabled = !(ESTADO.fechaIso && ESTADO.hora);
}

function esSlotPasado(fechaIso, horaSlot) {
    if (!fechaIso || !horaSlot) return false;
    const ahora = new Date();
    const yyyy = ahora.getFullYear();
    const mm = String(ahora.getMonth() + 1).padStart(2, "0");
    const dd = String(ahora.getDate()).padStart(2, "0");
    const hoyIso = `${yyyy}-${mm}-${dd}`;
    if (fechaIso !== hoyIso) return false;

    const minSlot = obtenerMinutosHora(horaSlot);
    const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
    return !Number.isNaN(minSlot) && minSlot <= minAhora;
}

function renderDias() {
    const container = document.getElementById("days-grid");
    if (!container) return;

    const dias = obtenerDiasLaborables(21, 0);
    container.innerHTML = dias.map((d) => `
        <button class="day" data-fecha="${d.iso}" type="button">
            <span>${escapeHtml(d.shortWeek)}</span>
            <strong>${escapeHtml(d.dayNum)}</strong>
        </button>
    `).join("");

    container.querySelectorAll(".day").forEach((btn) => {
        btn.addEventListener("click", async () => {
            ESTADO.fechaIso = btn.getAttribute("data-fecha") || "";
            ESTADO.fechaLabel = fechaVisualDesdeIso(ESTADO.fechaIso);
            ESTADO.hora = "";

            container.querySelectorAll(".day").forEach((x) => x.classList.remove("selected"));
            btn.classList.add("selected");

            await renderHoras();
            actualizarBotonReserva();
        });
    });
}

async function renderHoras() {
    const grid = document.getElementById("hours-grid");
    if (!grid) return;

    if (!ESTADO.fechaIso) {
        grid.innerHTML = "";
        return;
    }

    actualizarEstado("Cargando huecos disponibles...");
    grid.innerHTML = "";

    try {
        const { citas, bloqueos } = await cargarDatosDia(ESTADO.fechaIso);
        const slots = HORAS_DEVOLUCION;

        slots.forEach((hora) => {
            const disponibilidad = obtenerDisponibilidadSlot(citas, bloqueos, ESTADO.fechaIso, hora);
            const libreBase = disponibilidad.disponible === true;
            const libre = libreBase && !esSlotPasado(ESTADO.fechaIso, hora);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = libre ? "btn btn-hour" : "btn btn-hour locked";
            btn.textContent = libre ? `${hora}` : `${hora} (completo)`;
            btn.disabled = !libre;

            if (libre) {
                btn.addEventListener("click", () => {
                    ESTADO.hora = hora;
                    grid.querySelectorAll(".btn-hour").forEach((x) => x.classList.remove("selected"));
                    btn.classList.add("selected");
                    actualizarEstado(`Fecha ${ESTADO.fechaLabel} a las ${ESTADO.hora} seleccionada.`);
                    actualizarBotonReserva();
                });
            }

            grid.appendChild(btn);
        });

        actualizarEstado(`Selecciona una hora libre para el ${ESTADO.fechaLabel}.`);
    } catch (error) {
        console.error(error);
        actualizarEstado("No se pudieron cargar los huecos disponibles.", true);
    }
}

function leerFormulario() {
    const nombre = String(document.getElementById("cliente-nombre")?.value || "").trim();
    const email = String(document.getElementById("cliente-email")?.value || "").trim();
    const telefono = String(document.getElementById("cliente-telefono")?.value || "").trim();
    const matricula = normalizarMatricula(document.getElementById("cliente-matricula")?.value || "");

    if (!nombre || nombre.length < 3) throw new Error("Introduce nombre y apellidos.");
    if (!esEmailValido(email)) throw new Error("Introduce un email valido.");
    if (!telefono || telefono.length < 9) throw new Error("Introduce un telefono valido.");
    if (!matricula || matricula.length < 5) throw new Error("Introduce la matricula del vehiculo a entregar.");
    if (!ESTADO.fechaIso || !ESTADO.hora) throw new Error("Selecciona fecha y hora.");

    return { nombre, email, telefono, matricula };
}

async function enviarCorreoConfirmacion(payload) {
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.warn("No se pudo lanzar el correo de confirmacion.", error);
    }
}

async function reservar() {
    let form;
    try {
        form = leerFormulario();
    } catch (error) {
        await Swal.fire({ icon: "warning", title: "Revisa los datos", text: String(error.message || "Completa la informacion") });
        return;
    }

    const btn = document.getElementById("btn-reservar");
    if (btn) btn.disabled = true;

    await Swal.fire({ title: "Guardando cita...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const { citas, bloqueos } = await cargarDatosDia(ESTADO.fechaIso);
        const disponibilidad = obtenerDisponibilidadSlot(citas, bloqueos, ESTADO.fechaIso, ESTADO.hora);

        if (!disponibilidad.disponible) {
            await Swal.fire({ icon: "error", title: "Hora no disponible", text: "Ese hueco acaba de ocuparse. Elige otra hora." });
            await renderHoras();
            actualizarBotonReserva();
            return;
        }

        const agenteAsignado = elegirAgente(disponibilidad.agentesLibres || []);

        const idCita = Date.now().toString();
        const payload = {
            fecha: ESTADO.fechaIso,
            hora: ESTADO.hora,
            cliente: form.nombre,
            telefono: form.telefono,
            email: form.email,
            matricula: form.matricula,
            modelo: "DEVOLUCION VEHICULO CLIENTE",
            bastidor: "",
            renting: "",
            entregaVO: "NO",
            agente: agenteAsignado,
            estado: "confirmada",
            tipoCita: "SOLO_DEVOLUCION_CLIENTE",
            servicioCliente: "SOLO_DEVOLUCION",
            origen: "CLIENTES_ENTREGA_WEB",
            creadoEn: new Date().toISOString(),
            lopdAceptada: true
        };

        await setDoc(doc(db, "citas_agenda", idCita), payload);

        const fechaVisual = fechaVisualDesdeIso(ESTADO.fechaIso);
        await enviarCorreoConfirmacion({
            action: "enviar_correo",
            email: form.email,
            cliente: form.nombre,
            modelo: payload.modelo,
            matricula: form.matricula,
            renting: "",
            bastidor: "",
            fecha: fechaVisual,
            hora: ESTADO.hora,
            agente: agenteAsignado
        });

        await Swal.fire({
            icon: "success",
            title: "Cita confirmada",
            html: `Te hemos enviado el comprobante a <b>${escapeHtml(form.email)}</b>.<br><br>Fecha: <b>${escapeHtml(fechaVisual)}</b> a las <b>${escapeHtml(ESTADO.hora)}h</b>.`
        });

        document.getElementById("cliente-nombre").value = "";
        document.getElementById("cliente-email").value = "";
        document.getElementById("cliente-telefono").value = "";
        document.getElementById("cliente-matricula").value = "";
        ESTADO.hora = "";
        actualizarBotonReserva();
        await renderHoras();
    } catch (error) {
        console.error(error);
        await Swal.fire({ icon: "error", title: "No se pudo guardar", text: "Ha ocurrido un error al reservar la cita." });
    } finally {
        actualizarBotonReserva();
    }
}

function iniciar() {
    const app = initializeApp(firebaseConfig);

    // En esta landing de agenda de clientes se desactiva App Check temporalmente
    // para evitar bloqueos 403 de exchangeDebugToken en navegadores con políticas estrictas.
    limpiarDebugAppCheckEnProduccion();

    db = getFirestore(app);

    renderDias();
    actualizarEstado("Solo devolucion: puedes reservar hoy si hay hueco libre y sin entregas en esa hora.");
    actualizarBotonReserva();

    const btn = document.getElementById("btn-reservar");
    if (btn) btn.addEventListener("click", reservar);
}

window.addEventListener("load", iniciar);
