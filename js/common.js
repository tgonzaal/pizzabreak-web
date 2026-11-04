/* ==========================================================================
   Pizza Break · utilidades compartidas (íconos, formato, local elegido)
   ========================================================================== */
(function () {
  "use strict";

  const s = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

  const ICON = {
    pin: s('<path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    phone: s('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z"/></svg>',
    clock: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    moto: s('<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-2-6h-3M13 11l2-4h3M15 7h-2M6 14l3-3"/>'),
    bolsa: s('<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    local: s('<path d="M4 10h16M5 10l1-5h12l1 5M6 10v10h12V10M10 20v-5h4v5"/>'),
    buscar: s('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    carrito: s('<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    mas: s('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.6"'),
    menos: s('<path d="M5 12h14"/>', 'stroke-width="2.6"'),
    x: s('<path d="M6 6l12 12M18 6 6 18"/>'),
    chevAbajo: s('<path d="m6 9 6 6 6-6"/>'),
    chevIzq: s('<path d="m15 6-6 6 6 6"/>'),
    chevDer: s('<path d="m9 6 6 6-6 6"/>'),
    flecha: s('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    check: s('<path d="m5 12 5 5 9-10"/>', 'stroke-width="2.6"'),
    menu: s('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    instagram: s('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>'),
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z"/></svg>',
    mail: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    trigo: s('<path d="M12 21V9M12 9c0-3 2-5 4-6 0 3-1 5-4 6zM12 9c0-3-2-5-4-6 0 3 1 5 4 6zM12 14c2-2 4-2 6-2-1 2-3 3-6 2zM12 14c-2-2-4-2-6-2 1 2 3 3 6 2z"/>'),
    horno: s('<path d="M3 20V11a9 9 0 0 1 18 0v9z"/><path d="M8 20v-5a4 4 0 0 1 8 0v5M9 18c1-1 2-1 3 0s2 1 3 0"/>'),
    queso: s('<path d="M3 15 15 5l6 4v10H3z"/><path d="M3 15h18"/><circle cx="9" cy="17" r="1"/><circle cx="15" cy="12" r="1.3"/>'),
    camion: s('<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'),
    chef: s('<path d="M7 14v6h10v-6M7 14a4 4 0 0 1-1-7.9A4 4 0 0 1 12 4a4 4 0 0 1 6 2.1A4 4 0 0 1 17 14z"/><path d="M7 17h10"/>'),
    cubiertos: s('<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1-3 4-3 7h3v11"/>'),
    fiesta: s('<path d="M4 20 9 7l8 8-13 5zM14 4l1 2M19 9l2-1M17 3l-1 3 3-1"/>'),
    estrella: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    tarjeta: s('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>'),
    efectivo: s('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>'),
    transferencia: s('<path d="M4 9h13l-3-3M20 15H7l3 3"/>'),
    calendario: s('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 14v3l2 1"/>'),
    cafe: s('<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3c-1 1 1 2 0 3M12 3c-1 1 1 2 0 3"/>'),
    editar: s('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  };

  const fmt = (n) => "$" + Math.round(n).toLocaleString("es-CL");

  const D = window.BREAK_DATA;
  const getLocal = (id) => D.locales.locales.find((l) => l.id === id) || D.locales.locales[0];

  // Local y modo elegidos se recuerdan entre páginas (en producción: sesión / cookie)
  const store = {
    get local() { return localStorage.getItem("break.local") || "mendoza"; },
    set local(v) { localStorage.setItem("break.local", v); },
    get modo() { return localStorage.getItem("break.modo") || "delivery"; },
    set modo(v) { localStorage.setItem("break.modo", v); },
  };

  // Estado abierto/cerrado según horario (hora local del navegador)
  function estadoLocal(local, ahora = new Date()) {
    const dia = ahora.getDay(); // 0 domingo
    const h = local.horario[dia === 0 ? 1 : 0];
    const [ah, am] = h.abre.split(":").map(Number), [ch, cm] = h.cierra.split(":").map(Number);
    const min = ahora.getHours() * 60 + ahora.getMinutes();
    const abierto = min >= ah * 60 + am && min < ch * 60 + cm;
    return { abierto, texto: abierto ? `Abierto · cierra ${h.cierra}` : `Cerrado · abre ${h.abre}`, horario: h };
  }

  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.innerHTML = ICON.check + `<span>${msg}</span>`;
    t.classList.add("visible");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("visible"), 2200);
  }

  // Íconos declarativos: <span data-icon="pin"></span>
  function pintarIconos(root = document) {
    root.querySelectorAll("[data-icon]").forEach((el) => { el.outerHTML = ICON[el.dataset.icon] || ""; });
  }

  window.Break = { ICON, fmt, D, getLocal, store, estadoLocal, toast, pintarIconos };
  document.addEventListener("DOMContentLoaded", () => pintarIconos());
})();
