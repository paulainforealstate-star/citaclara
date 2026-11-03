// Servicio de Identidad.
// Principio SOA: ausencia de estado. Recibe la tarjeta sanitaria y devuelve
// un token y los datos del paciente; no guarda sesión entre llamadas.
window.CitaClara = window.CitaClara || {};

CitaClara.identidad = (function () {
  // Pacientes de ejemplo. En un sistema real vendrían de la historia clínica.
  const pacientes = {
    "MADR000000001": { nombre: "Lucía", apellidos: "Gómez Pardo", medico: "Dra. Ruiz", especialidad: "Medicina de familia" },
    "MADR000000002": { nombre: "Manuel", apellidos: "Sanz Ortega", medico: "Dra. Ruiz", especialidad: "Medicina de familia" }
  };

  function validar(tarjeta) {
    const p = pacientes[tarjeta];
    if (!p) return { ok: false, error: "No encontramos esa tarjeta sanitaria. Revisa el número." };
    return { ok: true, token: "tk-" + tarjeta, paciente: Object.assign({ tarjeta: tarjeta }, p) };
  }

  return { validar: validar, demo: "MADR000000001" };
})();
