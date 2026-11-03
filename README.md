# CitaClara

Prototipo de app de **cita previa para un centro de salud de atención primaria**. Es la aplicación práctica del trabajo grupal de la asignatura *Diseño y Mantenimiento de Servicios*.

**Autoras:** Paula Nieto y Aranzazu Herraiz · Noviembre 2026

## Qué problema resuelve

Conseguir cita en el centro de salud cuesta: teléfono saturado, colas en el mostrador, huecos que se pierden porque cancelar es difícil e incertidumbre sobre los tiempos de espera. CitaClara propone **una sola agenda con tres puertas de entrada** (app, teléfono y mostrador) que libera los huecos cancelados al momento y avisa al paciente de lo que va a pasar.

## Cómo probarla

- **En línea:** abre la versión publicada en GitHub Pages (enlace en la descripción del repositorio).
- **En local:** descarga el repositorio y abre `index.html` en el navegador. No necesita instalar nada.

Pacientes de ejemplo (datos ficticios, sin login real):

| Tarjeta sanitaria | Paciente | Qué probar |
| --- | --- | --- |
| `MADR000000001` | Lucía, 34 años | Pedir cita para hoy, cambiarla y cancelarla |
| `MADR000000002` | Manuel, 76 años | Se abre en modo fácil (letra grande, menos texto) |

## Pantallas

| Pantalla | Qué hace | Principio de diseño |
| --- | --- | --- |
| Identificación | Entra con la tarjeta sanitaria; los datos se cargan solos | Evitar la entrada manual de datos |
| Inicio | Próxima cita, tipo y aviso de retraso | Diseño *outside-in*; reducir la demanda de fallo (Seddon) |
| Pedir cita | Motivo y hora en dos pasos, con huecos para hoy | Diseñar según demanda y capacidad (Murray y Berwick) |
| Confirmación | Resumen y recordatorio por SMS | Evidencia física del *blueprint* (Shostack, Bitner) |
| Mis citas | Cambiar o cancelar en un toque; el hueco pasa a la lista de espera | Minimizar interrupciones y retrasos |
| Centro | Panel para el personal: citas, lista de espera e indicadores | Medir solo lo que importa |
| Modo fácil | Letra más grande para personas mayores | Versiones del proceso para distintas necesidades |

*Recetas* y *Resultados* se asignan como cita telefónica para no ocupar la consulta presencial.

## Arquitectura (principios SOA)

La lógica está separada en servicios pequeños, cada uno con su propio contrato, en `js/services/`:

| Servicio | Archivo | Principio SOA |
| --- | --- | --- |
| Identidad | `identidad.js` | Ausencia de estado: valida la tarjeta y devuelve un token |
| Agenda | `agenda.js` | Contrato estandarizado y autonomía: huecos, reservar, cancelar |
| Avisos | `avisos.js` | Reutilización: cualquier servicio notifica por push, SMS o email |
| Lista de espera | `listaEspera.js` | Componibilidad: combina Agenda y Avisos |

La interfaz (`js/app.js`) solo pinta pantallas y llama a los servicios (abstracción). En un sistema real, Identidad y Agenda encapsularían la historia clínica del centro sin reescribirla.

## Estructura

```
index.html
css/styles.css
js/app.js
js/services/identidad.js
js/services/agenda.js
js/services/avisos.js
js/services/listaEspera.js
docs/prompt-codex.md
```

## Créditos

El prompt de partida para Codex está en [`docs/prompt-codex.md`](docs/prompt-codex.md). Lecturas de referencia: Shostack (1984), Bitner, Ostrom y Morgan (2008), Stickdorn y Schneider (2011), Seddon (2008), Murray y Berwick (2003) y Erl (2007).

Todos los datos son de ejemplo. La app no envía ni guarda datos fuera del navegador.
