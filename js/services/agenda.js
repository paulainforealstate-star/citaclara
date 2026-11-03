// Servicio de Agenda.
// Principio SOA: contrato estandarizado y autonomía. La app, el teléfono y el
// mostrador usan estas mismas operaciones: huecos, reservar, cambiar, cancelar.
window.CitaClara = window.CitaClara || {};

CitaClara.agenda = (function () {
  const CLAVE = "citaclara-agenda-v1";
  // Motivos que se atienden por teléfono para no ocupar la consulta presencial.
  const TELEFONICOS = ["Recetas", "Resultados"];

  function huecosIniciales() {
    return {
      "Hoy": ["12:40", "13:20"],
      "Mañana": ["09:00", "09:40", "11:10", "12:00", "17:30", "18:10"],
      "Pasado mañana": ["08:20", "10:00", "10:40", "16:50"]
    };
  }

  function estadoInicial() {
    return {
      huecos: huecosIniciales(),
      liberados: [],
      citas: [
        { id: 1, tarjeta: "MADR000000001", dia: "Jueves", hora: "10:20", motivo: "Revisión", tipo: "Presencial", retraso: 10 },
        { id: 2, tarjeta: "MADR000000002", dia: "Hoy", hora: "11:00", motivo: "Revisión", tipo: "Presencial", retraso: 0 }
      ],
      indicadores: { reservas: 0, cancelaciones: 0, reaprovechados: 0 }
    };
  }

  // Guardado local opcional: si el navegador no lo permite, la app sigue funcionando.
  let estado;
  try { estado = JSON.parse(localStorage.getItem(CLAVE)) || estadoInicial(); }
  catch (e) { estado = estadoInicial(); }

  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ }
  }

  function huecos() { return estado.huecos; }
  function liberados() { return estado.liberados; }
  function indicadores() { return estado.indicadores; }
  function todasLasCitas() { return estado.citas; }
  function citasDe(tarjeta) { return estado.citas.filter(function (c) { return c.tarjeta === tarjeta; }); }
  function tipoPara(motivo) { return TELEFONICOS.indexOf(motivo) >= 0 ? "Telefónica" : "Presencial"; }

  function reservar(tarjeta, dia, hora, motivo) {
    const lista = estado.huecos[dia] || [];
    const i = lista.indexOf(hora);
    if (i < 0) return { ok: false, error: "Ese hueco ya no está libre. Elige otra hora." };
    lista.splice(i, 1);
    const esLiberado = estado.liberados.some(function (l) { return l.dia === dia && l.hora === hora; });
    if (esLiberado) {
      estado.liberados = estado.liberados.filter(function (l) { return !(l.dia === dia && l.hora === hora); });
      estado.indicadores.reaprovechados++;
    }
    const cita = { id: Date.now(), tarjeta: tarjeta, dia: dia, hora: hora, motivo: motivo, tipo: tipoPara(motivo), retraso: 0 };
    estado.citas.push(cita);
    estado.indicadores.reservas++;
    guardar();
    return { ok: true, cita: cita };
  }

  function cancelar(id) {
    const cita = estado.citas.find(function (c) { return c.id === id; });
    if (!cita) return { ok: false, error: "No encontramos esa cita." };
    estado.citas = estado.citas.filter(function (c) { return c.id !== id; });
    if (!estado.huecos[cita.dia]) estado.huecos[cita.dia] = [];
    estado.huecos[cita.dia].unshift(cita.hora);
    estado.liberados.push({ dia: cita.dia, hora: cita.hora });
    estado.indicadores.cancelaciones++;
    guardar();
    return { ok: true, cita: cita };
  }

  function reiniciar() { estado = estadoInicial(); guardar(); }

  return {
    huecos: huecos, liberados: liberados, indicadores: indicadores,
    todasLasCitas: todasLasCitas, citasDe: citasDe, tipoPara: tipoPara,
    reservar: reservar, cancelar: cancelar, reiniciar: reiniciar
  };
})();
