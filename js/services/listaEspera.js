// Servicio de Lista de espera.
// Principio SOA: componibilidad. Combina Agenda y Avisos: cuando alguien
// cancela, ofrece el hueco liberado a la primera persona de la lista.
window.CitaClara = window.CitaClara || {};

CitaClara.listaEspera = (function () {
  const agenda = CitaClara.agenda;
  const avisos = CitaClara.avisos;

  // Pacientes de ejemplo que esperan un hueco antes de su cita actual.
  const cola = [
    { nombre: "Rosa M.", telefono: "SMS" },
    { nombre: "Javier P.", telefono: "SMS" }
  ];

  function apuntar(nombre) {
    if (cola.some(function (p) { return p.nombre === nombre; })) return false;
    cola.push({ nombre: nombre, telefono: "push" });
    return true;
  }

  function personas() { return cola; }

  // Cancela en Agenda y avisa a la siguiente persona de la cola.
  function cancelarYOfrecer(id) {
    const r = agenda.cancelar(id);
    if (!r.ok) return r;
    const siguiente = cola.shift();
    if (siguiente) {
      avisos.enviar(siguiente.nombre, siguiente.telefono,
        "Se ha liberado un hueco: " + r.cita.dia + " a las " + r.cita.hora + ". Resérvalo en CitaClara.");
    }
    return { ok: true, cita: r.cita, ofrecidoA: siguiente ? siguiente.nombre : null };
  }

  return { apuntar: apuntar, personas: personas, cancelarYOfrecer: cancelarYOfrecer };
})();
