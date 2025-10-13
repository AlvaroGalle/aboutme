/* ======= Estado ======= */
const state = {
  cwd: "~",
  theme: localStorage.getItem("theme") || "monokai",
  history: JSON.parse(localStorage.getItem("history") || "[]"),
  histIndex: null,
  projects: [],
  commands: {},
};

const $wrap = document.querySelector(".wrap");
const $screen = document.querySelector(".screen");
const $output = document.getElementById("output");
const $form = document.getElementById("terminal");
const $input = document.getElementById("cmd-input");
const $cwd = document.getElementById("cwd");
const $ps1 = document.getElementById("ps1");

/* ======= Utilidades ======= */
const print = (nodeOrText, cls="stdout") => {
  if (nodeOrText === "__CLEAR__") { $output.innerHTML = ""; return; }
  const line = document.createElement("div");
  line.className = `line ${cls}`;
  if (nodeOrText instanceof Node) line.appendChild(nodeOrText);
  else line.textContent = String(nodeOrText);
  $output.appendChild(line);
  $screen.scrollTop = $screen.scrollHeight;
};
function printCmd(cmd) {
  const line = document.createElement("div");
  line.className = "line";
  line.innerHTML = `<span class="ps">${$ps1.textContent}:${$cwd.textContent}$</span> ${escapeHtml(cmd)}`;
  $output.appendChild(line);
}
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const setTheme = (t) => { $wrap.dataset.theme = t; localStorage.setItem("theme", t); state.theme = t; };
const saveHistory = () => localStorage.setItem("history", JSON.stringify(state.history.slice(-200)));

/* ======= Autocomplete ======= */
const baseCmds = ["help","about","skills","projects","project","man","contact","cv","theme","history","clear"];
function candidates() {
  const projSlugs = state.projects.map(p => p.slug);
  return [...new Set([...baseCmds, ...projSlugs])];
}
function autocomplete(current) {
  if (!current) return "";
  const list = candidates().filter(x => x.startsWith(current));
  if (list.length === 1) return list[0];
  if (list.length > 1) {
    print(list.join("  "));
  }
  return current;
}

/* ======= Comandos ======= */
const commands = {
  help() {
    return (
`Comandos:
  help              Muestra esta ayuda
  about             Bio breve
  skills            Habilidades
  projects          Lista proyectos
  project <slug>    Info de un proyecto
  man <cmd>         Descripción de un comando
  contact           Formas de contacto
  cv                Enlace a CV
  theme <t>         monokai | solarized | high-contrast
  history           Muestra historial
  clear             Limpia la pantalla

Atajos: ↑/↓ historial · Tab autocompletar`
    );
  },

  about() {
    return "AlvaroGalle — Desarrollador. Me encanta la X y construir UIs con intención.";
  },

  skills() {
    const lines = [
      ["JavaScript/TS", 90],
      ["HTML/CSS", 90],
      ["Angular", 70],
      ["Node/Spring (API)", 60]
    ].map(([name, pct]) => {
      const wrap = document.createElement("div");
      wrap.innerHTML = `<span class="badge">${name}</span>
        <span class="progress" aria-label="${name} ${pct}%"><span style="width:${pct}%;"></span></span>`;
      return wrap;
    });
    lines.forEach(el => print(el));
    return "";
  },

  async projects() {
    if (!state.projects.length) return "Sin proyectos.";
    const lines = state.projects.map(p => `- ${p.slug} — ${p.title} (${p.year})`);
    return `Proyectos:\n${lines.join("\n")}\nUsa: project <slug>`;
  },

  async project(args) {
    const slug = args[0];
    if (!slug) return "Uso: project <slug>";
    const p = state.projects.find(x => x.slug === slug);
    if (!p) return `Proyecto no encontrado: ${slug}`;
    const a = document.createElement("div");
    a.innerHTML =
`${p.title} — ${p.summary}
Tech: ${p.tech.join(", ")}
Repo: <a href="${p.repo}" target="_blank" rel="noopener">GitHub</a>
Demo: <a href="${p.demo}" target="_blank" rel="noopener">Abrir</a>`;
    print(a);
    return "";
  },

  man(args) {
    const map = {
      help:"Lista los comandos.",
      about:"Bio breve.",
      skills:"Muestra habilidades con barras.",
      projects:"Lista proyectos disponibles.",
      project:"Detalle de un proyecto por slug.",
      contact:"Muestra enlaces de contacto.",
      cv:"Enlace a CV PDF.",
      theme:"Cambia el tema visual.",
      history:"Muestra los últimos comandos.",
      clear:"Limpia la salida."
    };
    const c = args[0];
    if (!c) return "Uso: man <comando>";
    return map[c] || "Comando no encontrado.";
  },

  contact() {
    const n = document.createElement("div");
    n.innerHTML = `Email: <a href="mailto:hola@alvarogalle.dev">hola@alvarogalle.dev</a> · GitHub: <a href="https://github.com/alvarogalle" target="_blank" rel="noopener">@alvarogalle</a> · LinkedIn: <a href="https://linkedin.com/in/alvarogalle" target="_blank" rel="noopener">/in/alvarogalle</a>`;
    print(n);
    return "";
  },

  cv() {
    const url = "cv.pdf"; // coloca tu PDF en la raíz
    const n = document.createElement("div");
    n.innerHTML = `Descargar CV: <a href="${url}" target="_blank" rel="noopener">cv.pdf</a>`;
    print(n);
    return "";
  },

  theme(args) {
    const t = args[0];
    const allowed = ["monokai","solarized","high-contrast"];
    if (!t || !allowed.includes(t)) return `Temas disponibles: ${allowed.join(", ")}`;
    setTheme(t);
    return `Tema cambiado a: ${t}`;
  },

  history() {
    if (!state.history.length) return "Sin historial.";
    return state.history.map((c,i)=>`${i+1}  ${c}`).slice(-30).join("\n");
  },

  clear() { return "__CLEAR__"; }
};

state.commands = commands;

/* ======= Entrada / Historial ======= */
$form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const raw = $input.value;
  if (!raw.trim()) return;
  printCmd(raw);
  state.history.push(raw);
  saveHistory();
  state.histIndex = null;

  const { cmd, args } = parse(raw);
  const fn = state.commands[cmd];
  if (!fn) {
    print(`Comando desconocido: ${cmd}. Escribe 'help'.`, "stderr");
  } else {
    const out = await fn(args);
    if (out === "__CLEAR__") print("__CLEAR__");
    else if (typeof out === "string" && out) print(out);
  }

  $input.value = "";
  updateInputWidth();
  focusInput();
});

function parse(input) {
  const t = input.trim().split(/\s+/);
  return { cmd: (t[0]||"").toLowerCase(), args: t.slice(1) };
}

function focusInput() { $input.focus(); }
$screen.addEventListener("click", focusInput);

/* Flechas historial */
$input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (state.histIndex === null) state.histIndex = state.history.length - 1;
    else state.histIndex = Math.max(0, state.histIndex - 1);
    $input.value = state.history[state.histIndex] || "";
    updateInputWidth();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (state.histIndex === null) return;
    state.histIndex = Math.min(state.history.length, state.histIndex + 1);
    $input.value = state.history[state.histIndex] || "";
    updateInputWidth();
    if (state.histIndex >= state.history.length) state.histIndex = null;
  } else if (e.key === "Tab") {
    e.preventDefault();
    const val = $input.value.trim();
    const ac = autocomplete(val);
    $input.value = ac;
    updateInputWidth();
  }
});

const mirror = document.getElementById('input-mirror');

function updateInputWidth() {
  mirror.textContent = $input.value || ' ';
  $input.style.width = mirror.offsetWidth + 'px';
}
$input.addEventListener('input', updateInputWidth);

/* ======= Carga inicial ======= */
(async function init() {
  setTheme(state.theme);
  $cwd.textContent = state.cwd;
  updateInputWidth();
  try {
    const res = await fetch("./content/projects.json");
    state.projects = await res.json();
  } catch { state.projects = []; }

  // MOTD
  const ascii = [
"  ___    _                                _____",
" / _ \\  | |                              /  ___\\         _   _   ",
"/ /_\\ \\ | | __    __  ____   ___   ___   | | __   ____  | | | |  _____",
"|  _  | | | \\ \\  / / / _  | |  _| / _ \\  | | | | / _  | | | | | / |_)_\\",
"| | | | | |  \\ \\/ /  |(_| | | |  | |_| | | |_| | |(_| | | | | | | |___",
"\\_| |_/ |_|   \\__/   \\__,_| |_|   \\___/  \\_____| \\__,_| |_| |_| |_____|",
  ].join("\n");
  print(ascii);
  print("Bienvenido a mi porfolio. Escribe 'help' para empezar.");
  focusInput();
})();
/*
    ___    _                                _____
   / _ \  | |                              /  ___\         _   _   
  / /_\ \ | | __    __  ____   ___   ___   | | __   ____  | | | |  _____
  |  _  | | | \ \  / / / _  | |  _| / _ \  | | | | / _  | | | | | / |_)_\ 
  | | | | | |  \ \/ /  |(_| | | |  | (_) | | |_| | |(_| | | | | | | \___
  \_| |_/ |_|   \__/   \__,_| |_|   \___/  \_____| \__,_| |_| |_| \_____|
*/
