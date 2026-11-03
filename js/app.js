// Interfaz de CitaClara. Solo pinta pantallas y llama a los servicios;
// la lógica del servicio vive en js/services/ (principio de abstracción).
(function () {
  const { identidad, agenda, listaEspera, avisos } = CitaClara;
  const view = document.getElementById("view");
  const tabs = document.getElementById("tabs");
  const toast = document.getElementById("toast");
  const btnFacil = document.getElementById("facil");
  const btnSalir = document.getElementById("salir");

  const MOTIVOS = [
    ["Consulta", "Algo nuevo o que no mejora"],
    ["Revisión", "Seguimiento o enfermedad crónica"],
    ["Recetas", "Renovar medicación (por teléfono)"],
    ["Resultados", "Analíticas o pruebas (por teléfono)"]
  ];

  const S = { sesion: null, pantalla: "entrar", motivo: null, hueco: null, ultima: null, error: "" };

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function mostrarAviso(texto) {
    toast.textContent = texto;
    toast.hidden = false;
    clearTimeout(mostrarAviso.t);
    mostrarAviso.t = setTimeout(function () { toast.hidden = true; }, 4500);
  }
  avisos.escuchar(function (a) { mostrarAviso("Aviso por " + a.canal + " a " + a.destino + ": " + a.mensaje); });

  function ir(pantalla) { S.pantalla = pantalla; S.error = ""; pintar(); window.scrollTo(0, 0); }

  function pintar() {
    const p = S.pantalla;
    tabs.hidden = !S.sesion;
    btnSalir.hidden = !S.sesion;
    tabs.querySelectorAll(".tab").forEach(function (t) {
      const activa = t.dataset.go === p || (p === "hecho" && t.dataset.go === "pedir");
      t.setAttribute("aria-current", activa ? "page" : "false");
    });
    view.innerHTML = ({ entrar: vEntrar, inicio: vInicio, pedir: vPedir, hecho: vHecho, mis: vMis, centro: vCentro })[p]();
  }

  // Identificación con la tarjeta sanitaria (evitar la entrada manual de datos).
  function vEntrar() {
    return '<h1>Pide tu cita</h1>' +
      '<p class="muted">Identifícate con tu tarjeta sanitaria. Tus datos y tu médico se cargan solos.</p>' +
      '<form id="f-entrar" class="card fila" style="flex-direction:column">' +
      '<label class="campo" for="tarjeta">Número de tarjeta sanitaria<input id="tarjeta" autocomplete="off" value="' + identidad.demo + '"></label>' +
      (S.error ? '<p class="error">' + esc(S.error) + '</p>' : '') +
      '<button class="btn" type="submit">Entrar</button></form>' +
      '<div class="card"><div class="label">Pacientes de ejemplo</div>' +
      '<p class="muted">MADR000000001 · Lucía, 34 años<br>MADR000000002 · Manuel, 76 años (se abre en modo fácil)</p></div>';
  }

  function vInicio() {
    const pac = S.sesion.paciente;
    const citas = agenda.citasDe(pac.tarjeta);
    const c = citas[0];
    let html = '<h1>Hola, ' + esc(pac.nombre) + '</h1>';
    if (c) {
      html += '<div class="card destacada"><div class="label">Tu próxima cita</div>' +
        '<div class="grande">' + esc(c.dia) + ' · ' + esc(c.hora) + '</div>' +
        '<div>' + esc(pac.medico) + ' · ' + esc(pac.especialidad) + '</div>' +
        '<p class="muted">' + esc(c.tipo) + ' · ' + esc(c.motivo) + (c.tipo === "Presencial" ? ' · Consulta 4, planta 1' : ' · Te llamaremos a tu teléfono') + '</p></div>';
      if (c.retraso) html += '<div class="aviso"><b>La consulta va con ' + c.retraso + ' min de retraso.</b> Te avisaremos si cambia.</div>';
      html += '<div class="fila"><button class="btn borde" data-go="mis">Cambiar o cancelar</button></div>';
    } else {
      html += '<div class="card"><div class="label">Sin citas</div><p class="muted">No tienes ninguna cita pendiente.</p></div>';
    }
    const hoy = agenda.huecos()["Hoy"] || [];
    html += '<div class="card"><div class="label">¿Necesitas otra cita?</div><p class="muted">' +
      (hoy.length ? 'Hay ' + hoy.length + (hoy.length === 1 ? ' hueco libre' : ' huecos libres') + ' hoy con ' + esc(pac.medico) + '.' : 'Hoy no quedan huecos; mira mañana o apúntate a la lista de espera.') +
      '</p><div class="fila" style="margin-top:10px"><button class="btn" data-go="pedir">Pedir cita</button></div></div>';
    return html;
  }

  function vPedir() {
    const pac = S.sesion.paciente;
    let html = '<h1>Pedir cita</h1><p class="muted">Paso 1 de 2 · ¿Para qué es?</p><div class="chips">' +
      MOTIVOS.map(function (m) {
        return '<button class="chip" data-motivo="' + m[0] + '" aria-pressed="' + (S.motivo === m[0]) + '">' + m[0] + '<small>' + m[1] + '</small></button>';
      }).join("") + '</div>';
    if (!S.motivo) return html;
    const libres = agenda.liberados();
    html += '<p class="muted">Paso 2 de 2 · Elige hora con ' + esc(pac.medico) + ' (cita ' + agenda.tipoPara(S.motivo).toLowerCase() + ')</p>';
    const huecos = agenda.huecos();
    Object.keys(huecos).forEach(function (dia) {
      if (!huecos[dia].length) return;
      html += '<div class="label">' + esc(dia) + '</div><div class="huecos">' + huecos[dia].map(function (h) {
        const id = dia + "|" + h;
        const lib = libres.some(function (l) { return l.dia === dia && l.hora === h; });
        return '<button class="hueco' + (lib ? ' liberado' : '') + '" data-hueco="' + esc(id) + '" aria-pressed="' + (S.hueco === id) + '"' + (lib ? ' title="Hueco liberado por otra persona"' : '') + '>' + esc(h) + '</button>';
      }).join("") + '</div>';
    });
    if (libres.length) html += '<p class="muted">Los huecos con borde naranja los acaba de liberar otra persona.</p>';
    if (S.error) html += '<p class="error">' + esc(S.error) + '</p>';
    html += '<div class="fila"><button class="btn" id="confirmar"' + (S.hueco ? '' : ' disabled') + '>Confirmar cita</button></div>' +
      '<div class="fila"><button class="btn borde" id="espera">No me viene bien ninguna: avisadme si se libera algo antes</button></div>';
    return html;
  }

  function vHecho() {
    const c = S.ultima;
    return '<div class="ok" aria-hidden="true">✓</div><h1>Cita confirmada</h1>' +
      '<div class="card destacada"><div class="label">' + esc(c.tipo) + ' · ' + esc(c.motivo) + '</div>' +
      '<div class="grande">' + esc(c.dia) + ' · ' + esc(c.hora) + '</div><div>' + esc(S.sesion.paciente.medico) + '</div></div>' +
      '<p class="muted">Te enviaremos un recordatorio el día antes. Si no puedes ir, cancélala en Mis citas y el hueco pasará a otra persona.</p>' +
      '<div class="fila"><button class="btn borde" data-go="mis">Ver mis citas</button><button class="btn" data-go="inicio">Inicio</button></div>';
  }

  function vMis() {
    const citas = agenda.citasDe(S.sesion.paciente.tarjeta);
    let html = '<h1>Mis citas</h1>';
    if (!citas.length) html += '<p class="muted">No tienes citas pendientes.</p>';
    citas.forEach(function (c) {
      html += '<div class="card"><div class="grande" style="font-size:1.2em">' + esc(c.dia) + ' · ' + esc(c.hora) + '</div>' +
        '<div>' + esc(S.sesion.paciente.medico) + '</div><p class="muted">' + esc(c.tipo) + ' · ' + esc(c.motivo) + '</p>' +
        '<div class="fila" style="margin-top:10px"><button class="btn borde" data-cambiar="' + c.id + '">Cambiar</button>' +
        '<button class="btn peligro" data-cancelar="' + c.id + '">Cancelar</button></div></div>';
    });
    html += '<div class="fila"><button class="btn" data-go="pedir">Pedir otra cita</button></div>';
    return html;
  }

  // Vista del centro (persona: Carmen, administrativa). "Medir solo lo que importa".
  function vCentro() {
    const k = agenda.indicadores();
    const citas = agenda.todasLasCitas();
    const cola = listaEspera.personas();
    return '<h1>Panel del centro</h1><p class="muted">Lo que ve el personal de mostrador. Usa la misma agenda que la app y el teléfono.</p>' +
      '<div class="kpis"><div class="kpi"><b>' + k.reservas + '</b><span class="muted">reservas</span></div>' +
      '<div class="kpi"><b>' + k.cancelaciones + '</b><span class="muted">cancelaciones</span></div>' +
      '<div class="kpi"><b>' + k.reaprovechados + '</b><span class="muted">huecos reaprovechados</span></div></div>' +
      '<div class="card"><div class="label">Citas</div><table class="tabla"><thead><tr><th>Día</th><th>Hora</th><th>Motivo</th><th>Tipo</th></tr></thead><tbody>' +
      citas.map(function (c) { return '<tr><td>' + esc(c.dia) + '</td><td class="num">' + esc(c.hora) + '</td><td>' + esc(c.motivo) + '</td><td>' + esc(c.tipo) + '</td></tr>'; }).join("") +
      '</tbody></table></div>' +
      '<div class="card"><div class="label">Lista de espera</div>' +
      (cola.length ? '<ol class="muted">' + cola.map(function (p) { return '<li>' + esc(p.nombre) + ' · aviso por ' + esc(p.telefono) + '</li>'; }).join("") + '</ol>' : '<p class="muted">Nadie en espera.</p>') +
      '</div><div class="fila"><button class="btn borde" id="reiniciar">Reiniciar datos de ejemplo</button></div>';
  }

  document.addEventListener("submit", function (e) {
    if (e.target.id !== "f-entrar") return;
    e.preventDefault();
    const r = identidad.validar(document.getElementById("tarjeta").value.trim().toUpperCase());
    if (!r.ok) { S.error = r.error; pintar(); return; }
    S.sesion = r;
    ponerFacil(r.paciente.nombre === "Manuel");
    ir("inicio");
  });

  function ponerFacil(on) {
    btnFacil.setAttribute("aria-pressed", on);
    document.body.classList.toggle("facil", on);
  }

  document.addEventListener("click", function (e) {
    const b = e.target.closest("button");
    if (!b) return;
    if (b === btnFacil) { ponerFacil(b.getAttribute("aria-pressed") !== "true"); return; }
    if (b === btnSalir) { S.sesion = null; ir("entrar"); return; }
    if (b.dataset.go) { if (b.dataset.go === "pedir") { S.motivo = null; S.hueco = null; } ir(b.dataset.go); return; }
    if (b.dataset.motivo) { S.motivo = b.dataset.motivo; S.hueco = null; pintar(); return; }
    if (b.dataset.hueco) { S.hueco = b.dataset.hueco; pintar(); return; }
    if (b.id === "confirmar" && S.hueco) {
      const partes = S.hueco.split("|");
      const r = agenda.reservar(S.sesion.paciente.tarjeta, partes[0], partes[1], S.motivo);
      if (!r.ok) { S.error = r.error; S.hueco = null; pintar(); return; }
      S.ultima = r.cita; S.motivo = null; S.hueco = null;
      avisos.enviar(S.sesion.paciente.nombre, "SMS", "Cita confirmada: " + r.cita.dia + " a las " + r.cita.hora + ".");
      ir("hecho"); return;
    }
    if (b.id === "espera") {
      const nuevo = listaEspera.apuntar(S.sesion.paciente.nombre);
      mostrarAviso(nuevo ? "Te hemos apuntado a la lista de espera. Te avisaremos si se libera un hueco." : "Ya estás en la lista de espera.");
      return;
    }
    if (b.dataset.cancelar || b.dataset.cambiar) {
      const id = Number(b.dataset.cancelar || b.dataset.cambiar);
      const r = listaEspera.cancelarYOfrecer(id);
      if (!r.ok) { mostrarAviso(r.error); return; }
      if (b.dataset.cambiar) { S.motivo = r.cita.motivo; S.hueco = null; ir("pedir"); }
      else { pintar(); if (!r.ofrecidoA) mostrarAviso("Cita cancelada. El hueco queda libre para otra persona."); }
      return;
    }
    if (b.id === "reiniciar") { agenda.reiniciar(); mostrarAviso("Datos de ejemplo reiniciados."); pintar(); }
  });

  pintar();
})();
