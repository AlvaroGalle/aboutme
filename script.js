function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
    ["backToTop", "btnConsole2"].forEach(id => {
        const button = document.getElementById(id);
        if (window.scrollY > 300) {
            button.classList.remove('opacity-0', 'translate-y-4');
            button.classList.add('opacity-100', 'translate-y-0');
        } else {
            button.classList.remove('opacity-100', 'translate-y-0');
            button.classList.add('opacity-0', 'translate-y-4');
        }
    })
});


window.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('darkModeToggle');
    const htmlElement = document.documentElement;
    const toggleIcon = document.getElementById('toggleIcon');

    // Detecta preferencia del sistema
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Obtiene tema actual de localStorage o sistema
    const savedTheme = localStorage.getItem('theme');
    const currentTheme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light');

    // Aplica el tema
    if (currentTheme === 'dark') {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }
    updateIcon(currentTheme); // asegúrate de que esta función existe

    // Listener para cambios en el sistema SOLO si no hay preferencia guardada
    if (!savedTheme) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            const newTheme = e.matches ? 'dark' : 'light';
            htmlElement.classList.toggle('dark', newTheme === 'dark');
            updateIcon(newTheme);
        });
    }

    // Toggle manual del botón
    toggleButton.addEventListener('click', () => {
        const isDark = htmlElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateIcon(isDark ? 'dark' : 'light');
    });

});

function updateIcon(theme) {
    toggleIcon.innerHTML = theme === 'dark'
        ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                   </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                   </svg>`;
}


const btn = document.getElementById('btnConsole');
const btn2 = document.getElementById('btnConsole2');
const btn3 = document.getElementById('btnConsole3');

const wrapper = document.getElementById('consoleWrapper');
const resizeBar = document.getElementById('resizeBar');

let abierto = false;
let isResizing = false;

[btn, btn2, btn3].forEach(button => {
    button.addEventListener('click', () => {
        abierto = !abierto;
        wrapper.classList.toggle('translate-y-full', !abierto);
        wrapper.classList.toggle('translate-y-0', abierto);
        btn.innerHTML = abierto ? '<i class="fa-solid fa-circle-xmark"></i> Cerrar Terminal' : ' <i class="fas fa-terminal"></i> Abrir Terminal';
    });
});

resizeBar.addEventListener('mousedown', () => {
    isResizing = true;
    document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight >= 100 && newHeight <= window.innerHeight * 0.8) {
        wrapper.style.height = newHeight + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.userSelect = '';
});

const background = document.getElementById('background');
const triangleWidth = 100; // 50px a cada lado
const triangleHeight = 60;

function getPageSize() {
    const width = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.body.clientWidth,
        document.documentElement.clientWidth
    );
    const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
    );
    return { width, height };
}

function createTriangles() {
    background.innerHTML = '';
    const { width, height } = getPageSize();
    const cols = Math.ceil(width / triangleWidth);
    const rows = Math.ceil(height / (triangleHeight / 2));
    const total = cols * rows;

    for (let i = 0; i < total; i++) {
        const triangle = document.createElement('div');
        triangle.className = i % 2 === 0 ? 'triangle-up' : 'triangle-down';
        // Añadir estilos inline para facilitar cálculo de posición si hace falta
        background.appendChild(triangle);
    }
}

createTriangles();

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(createTriangles, 300);
});

// Importante: Para que el fondo no bloquee los eventos del mouse a elementos sobrepuestos:
background.style.pointerEvents = 'none';

// Detectar movimiento del ratón y aplicar efecto hover simulado
document.addEventListener('mousemove', (e) => {
    const triangles = background.children;
    // Limpiar transformaciones previas
    for (const tri of triangles) {
        tri.style.transform = '';
        tri.style.filter = '';
    }

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    let closest = null;
    let minDistance = Infinity;

    for (const tri of triangles) {
        const rect = tri.getBoundingClientRect();
        // Centro aproximado para cálculo de distancia
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = centerX - mouseX;
        const dy = centerY - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
            minDistance = distance;
            closest = tri;
        }
    }

    if (closest && minDistance < 100) {
        closest.style.transform = 'scale(0.9)';
        closest.style.filter = 'brightness(0.8)';
    }
});


const flashlight = document.querySelector('.flashlight');

window.addEventListener('mousemove', e => {
    flashlight.style.left = e.clientX + 'px';
    flashlight.style.top = e.clientY + 'px';
});

// Opcional: Si quieres ocultar la linterna cuando el puntero salga de la ventana
window.addEventListener('mouseout', () => {
    flashlight.style.opacity = 0;
});

window.addEventListener('mouseover', () => {
    flashlight.style.opacity = 1;
});


async function loadTranslations(lang) {
  try {
    const res = await fetch(`/traductor/${lang}.json`);
    if (!res.ok) throw new Error('No se pudo cargar las traducciones');
    return await res.json();
  } catch (error) {
    console.error(error);
    return {};
  }
}

function updateTexts(translations) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const keys = key.split('.');
    let value = translations;
    for (let k of keys) {
      value = value ? value[k] : null;
    }
    if (value !== null && value !== undefined) {
      if (el.placeholder !== undefined) {
        el.placeholder = value;
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = value;
      } else {
        el.textContent = value;
      }
    }
  });
}

const urlParams = new URLSearchParams(window.location.search);
const lang = urlParams.get('lang') || 'es';
document.getElementById("language-selector").value = lang;

loadTranslations(lang).then(translations => {
  
  updateTexts(translations);
});

function changeLanguage(l){
    window.location = window.location.origin + "?lang=" + l;
}

// Añadir comportamiento del dropdown
document.querySelectorAll('#language-dropdown-menu a').forEach(item => {
    console.log(item);
  item.addEventListener('click', event => {
    event.preventDefault();
    const lang = item.dataset.lang;
    const name = item.dataset.name;
    const flagSvg = item.querySelector('svg').outerHTML;

    // Actualizar botón principal con nueva bandera y texto
    document.getElementById('language-flag').outerHTML = flagSvg.replace('h-4 w-4', 'w-5 h-5');
    document.getElementById('language-name').textContent = name;

    // Cambiar idioma
    changeLanguage(lang);
  });
});

