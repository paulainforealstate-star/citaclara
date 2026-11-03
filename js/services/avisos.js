// Servicio de Avisos.
// Principio SOA: reutilización. Cualquier servicio (Agenda, Lista de espera)
// lo usa para notificar al paciente o al centro por push, SMS o email.
window.CitaClara = window.CitaClara || {};

CitaClara.avisos = (function () {
  const oyentes = [];
  const historial = [];

  function enviar(destino, canal, mensaje) {
    const aviso = { destino: destino, canal: canal, mensaje: mensaje, hora: new Date() };
    historial.unshift(aviso);
    oyentes.forEach(function (fn) { fn(aviso); });
    return aviso;
  }

  function escuchar(fn) { oyentes.push(fn); }

  return { enviar: enviar, escuchar: escuchar, historial: historial };
})();
