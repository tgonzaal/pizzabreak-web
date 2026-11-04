/* ==========================================================================
   Pizza Break · Ilustraciones de producto (SVG)
   Se usan como placeholder mientras no haya fotografías reales.
   Si un producto tiene "imagen" en el JSON, se muestra la foto en su lugar.
   ========================================================================== */
(function () {
  "use strict";

  // Generador pseudoaleatorio con semilla: la misma pizza siempre se dibuja igual
  function rng(seedStr) {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6D2B79F5; let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // Cómo se dibuja cada ingrediente sobre la pizza
  const TOPPING = {
    pepperoni: (x, y, r) => `<circle cx="${x}" cy="${y}" r="${7 * r}" fill="#b8242a"/><circle cx="${x - 2}" cy="${y - 2}" r="${2 * r}" fill="#d6463f" opacity=".7"/>`,
    salame: (x, y, r) => `<circle cx="${x}" cy="${y}" r="${7.5 * r}" fill="#8f1d2c"/><circle cx="${x + 2}" cy="${y + 1}" r="${1.4}" fill="#f3d2c4"/><circle cx="${x - 3}" cy="${y - 2}" r="${1.1}" fill="#f3d2c4"/>`,
    choricillo: (x, y, r) => `<circle cx="${x}" cy="${y}" r="${5 * r}" fill="#a3361c"/><circle cx="${x - 1}" cy="${y - 1}" r="${1.5}" fill="#e2885b"/>`,
    jamon: (x, y, r, a) => `<rect x="${x - 6}" y="${y - 5}" width="12" height="10" rx="2" fill="#f2a1a6" transform="rotate(${a} ${x} ${y})"/><rect x="${x - 6}" y="${y - 5}" width="12" height="3" rx="1.5" fill="#f8c9cb" transform="rotate(${a} ${x} ${y})"/>`,
    tocino: (x, y, r, a) => `<g transform="rotate(${a} ${x} ${y})"><rect x="${x - 10}" y="${y - 4}" width="20" height="8" rx="2.5" fill="#a83a26"/><rect x="${x - 10}" y="${y - 1.2}" width="20" height="2.4" fill="#f3c2a6"/><rect x="${x - 10}" y="${y - 4}" width="20" height="8" rx="2.5" fill="none" stroke="#7d2516" stroke-width="1"/></g>`,
    carne: (x, y) => `<path d="M${x - 5} ${y - 2} q3 -5 7 -2 q4 2 1 6 q-3 4 -7 1 q-3 -2 -1 -5z" fill="#6b3a25"/>`,
    mechada: (x, y, r, a) => `<g transform="rotate(${a} ${x} ${y})" stroke-linecap="round" fill="none"><path d="M${x - 7} ${y - 3} l12 2" stroke="#6e3a22" stroke-width="3"/><path d="M${x - 5} ${y + 1} l11 -1" stroke="#8a4a2b" stroke-width="2.6"/><path d="M${x - 6} ${y + 4} l9 2" stroke="#5c2f1b" stroke-width="2.4"/></g>`,
    pollo: (x, y, r, a) => `<rect x="${x - 6}" y="${y - 4}" width="12" height="8" rx="3.5" fill="#f0d29a" transform="rotate(${a} ${x} ${y})"/><rect x="${x - 4}" y="${y - 2}" width="8" height="2.2" rx="1" fill="#d9a85e" transform="rotate(${a} ${x} ${y})"/>`,
    camaron: (x, y, r, a) => `<path d="M${x - 6} ${y + 3} a7 7 0 1 1 12 -4" stroke="#f08a5d" stroke-width="4.5" fill="none" stroke-linecap="round" transform="rotate(${a} ${x} ${y})"/><path d="M${x - 6} ${y + 3} a7 7 0 1 1 12 -4" stroke="#fbd2b8" stroke-width="1.2" stroke-dasharray="2 3" fill="none" transform="rotate(${a} ${x} ${y})"/>`,
    atun: (x, y) => `<path d="M${x - 5} ${y} q2 -5 6 -3 q4 3 0 6 q-4 2 -6 -3z" fill="#d7b9a0"/>`,
    champinon: (x, y, r, a) => `<g transform="rotate(${a} ${x} ${y})"><path d="M${x - 7} ${y} a7 6 0 0 1 14 0z" fill="#e8d6bd" stroke="#b39673" stroke-width="1"/><rect x="${x - 2.2}" y="${y}" width="4.4" height="5" rx="1.5" fill="#e8d6bd" stroke="#b39673" stroke-width="1"/></g>`,
    aceituna: (x, y) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#2b2523"/><circle cx="${x}" cy="${y}" r="1.8" fill="#f7e2b0"/>`,
    tomate: (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="#e2412f"/><circle cx="${x}" cy="${y}" r="5.5" fill="#f26b4f"/><circle cx="${x - 2}" cy="${y - 1}" r="1" fill="#ffe7a8"/><circle cx="${x + 2}" cy="${y + 1}" r="1" fill="#ffe7a8"/><circle cx="${x + 1}" cy="${y - 2.5}" r="1" fill="#ffe7a8"/>`,
    morron: (x, y, r, a) => `<path d="M${x - 8} ${y} q8 -6 16 0" stroke="#d92d2d" stroke-width="3.2" fill="none" stroke-linecap="round" transform="rotate(${a} ${x} ${y})"/>`,
    pimenton: (x, y, r, a) => `<path d="M${x - 8} ${y} q8 -6 16 0" stroke="#e5432a" stroke-width="3.2" fill="none" stroke-linecap="round" transform="rotate(${a} ${x} ${y})"/>`,
    cebolla: (x, y, r, a) => `<path d="M${x - 7} ${y + 2} a7 7 0 0 1 14 0" stroke="#a45a9b" stroke-width="2" fill="none" transform="rotate(${a} ${x} ${y})"/><path d="M${x - 4} ${y + 2} a4 4 0 0 1 8 0" stroke="#c89bc2" stroke-width="1.5" fill="none" transform="rotate(${a} ${x} ${y})"/>`,
    maiz: (x, y) => `<rect x="${x - 2.6}" y="${y - 2.6}" width="5.2" height="5.2" rx="1.8" fill="#f6c534"/>`,
    pina: (x, y, r, a) => `<path d="M${x} ${y - 6} L${x + 6} ${y + 5} L${x - 6} ${y + 5}z" fill="#f9d548" stroke="#e1ae22" stroke-width="1" stroke-linejoin="round" transform="rotate(${a} ${x} ${y})"/>`,
    palta: (x, y, r, a) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="4.5" fill="#9cc26a" stroke="#5f8c39" stroke-width="1.4" transform="rotate(${a} ${x} ${y})"/>`,
    palmito: (x, y) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#f4eed9" stroke="#d6caa2" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="2.4" fill="none" stroke="#d6caa2" stroke-width="1"/>`,
    albahaca: (x, y, r, a) => `<path d="M${x - 8} ${y} q8 -9 16 0 q-8 9 -16 0z" fill="#3f8f3a" transform="rotate(${a} ${x} ${y})"/><path d="M${x - 6} ${y} L${x + 7} ${y}" stroke="#6fb85f" stroke-width="1" transform="rotate(${a} ${x} ${y})"/>`,
    ciboulette: (x, y, r, a) => `<path d="M${x - 5} ${y} L${x + 5} ${y}" stroke="#4f9a3d" stroke-width="2" stroke-linecap="round" transform="rotate(${a} ${x} ${y})"/>`,
    merken: (x, y) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#8c1d12"/>`,
    poroto: (x, y, r, a) => `<rect x="${x - 6}" y="${y - 1.8}" width="12" height="3.6" rx="1.8" fill="#4f9a3d" transform="rotate(${a} ${x} ${y})"/>`,
    pepinillo: (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="#7da34b" stroke="#4d6e2a" stroke-width="1.2"/>`,
    bbq: (x, y, r, a) => `<path d="M${x - 10} ${y} q5 -6 10 0 t10 0" stroke="#5a2412" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85" transform="rotate(${a} ${x} ${y})"/>`,
  };

  // Ingrediente de la carta -> [tipo de dibujo, cantidad]
  function mapTopping(name) {
    const n = norm(name);
    const rules = [
      ["pepperoni", "pepperoni", 9], ["salame", "salame", 8], ["choricillo", "choricillo", 9], ["jamon", "jamon", 8],
      ["tocino", "tocino", 6], ["mechada", "mechada", 9], ["pollo bbq", "pollo", 9], ["pollo", "pollo", 8], ["carne", "carne", 11],
      ["vacuno", "carne", 11], ["camaron", "camaron", 7], ["atun", "atun", 8], ["champinon", "champinon", 7],
      ["aceituna", "aceituna", 9], ["tomate", "tomate", 6], ["morron", "morron", 7], ["pimenton", "pimenton", 7],
      ["cebolla", "cebolla", 7], ["maiz", "maiz", 22], ["pina", "pina", 9], ["palta", "palta", 6], ["palmito", "palmito", 7],
      ["albahaca", "albahaca", 6], ["ciboulette", "ciboulette", 14], ["merken", "merken", 26], ["poroto", "poroto", 8],
      ["pepinillo", "pepinillo", 7], ["salsa bbq", "bbq", 4],
    ];
    for (const [k, t, c] of rules) if (n.includes(k)) return [t, c];
    return null;
  }

  let uidN = 0;
  function pizza(product, opts) {
    const seed = (product && product.id) || "pizza";
    const uid = seed + "-" + (++uidN); // ids únicos: la misma pizza puede aparecer varias veces en la página
    const R = rng(seed);
    const toppings = ((product && product.toppings) || []).map(mapTopping).filter(Boolean);
    const cheeseOnly = toppings.length === 0;
    const isCream = ((product && product.descripcion) || "").toLowerCase().includes("crema");
    const sauce = isCream ? "#f6e7c8" : "#d8452c";
    let s = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${(product && product.nombre) || "Pizza"}">`;
    s += `<defs><radialGradient id="cr-${uid}" cx="50%" cy="45%" r="55%"><stop offset="80%" stop-color="#e9a24b"/><stop offset="100%" stop-color="#b8692a"/></radialGradient>
          <radialGradient id="ch-${uid}" cx="45%" cy="40%" r="60%"><stop offset="0%" stop-color="#ffe9a6"/><stop offset="100%" stop-color="#f6c85b"/></radialGradient></defs>`;
    s += `<ellipse cx="100" cy="106" rx="92" ry="90" fill="#000" opacity=".12"/>`;
    s += `<circle cx="100" cy="100" r="90" fill="url(#cr-${uid})"/>`;
    // burbujas de horno en el borde
    for (let i = 0; i < 16; i++) {
      const a = R() * Math.PI * 2, rr = 82 + R() * 5;
      s += `<circle cx="${(100 + Math.cos(a) * rr).toFixed(1)}" cy="${(100 + Math.sin(a) * rr).toFixed(1)}" r="${(1.5 + R() * 2.5).toFixed(1)}" fill="#8e4a1c" opacity=".35"/>`;
    }
    s += `<circle cx="100" cy="100" r="76" fill="${sauce}"/>`;
    // queso derretido
    let cheese = "";
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2, rr = 70 + R() * 6;
      cheese += `${i ? "L" : "M"}${(100 + Math.cos(a) * rr).toFixed(1)} ${(100 + Math.sin(a) * rr).toFixed(1)}`;
    }
    s += `<path d="${cheese}Z" fill="url(#ch-${uid})"/>`;
    for (let i = 0; i < 14; i++) {
      const a = R() * Math.PI * 2, rr = R() * 60;
      s += `<circle cx="${(100 + Math.cos(a) * rr).toFixed(1)}" cy="${(100 + Math.sin(a) * rr).toFixed(1)}" r="${(3 + R() * 6).toFixed(1)}" fill="#e9a93c" opacity=".35"/>`;
    }
    if (cheeseOnly) {
      for (let i = 0; i < 10; i++) {
        const a = R() * Math.PI * 2, rr = R() * 55;
        s += `<circle cx="${(100 + Math.cos(a) * rr).toFixed(1)}" cy="${(100 + Math.sin(a) * rr).toFixed(1)}" r="${(2 + R() * 3).toFixed(1)}" fill="#fff6d8" opacity=".7"/>`;
      }
    }
    // ingredientes: repartidos en anillos para que se vean naturales
    toppings.forEach(([t, count], ti) => {
      const k = Math.max(3, Math.round(count * (toppings.length > 3 ? 0.65 : 1)));
      for (let i = 0; i < k; i++) {
        const a = R() * Math.PI * 2 + ti;
        const rr = Math.sqrt(R()) * 60;
        const x = 100 + Math.cos(a) * rr, y = 100 + Math.sin(a) * rr;
        s += TOPPING[t](x.toFixed(1), y.toFixed(1), 1, Math.round(R() * 360));
      }
    });
    // cortes
    if (!(opts && opts.noSlices)) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        s += `<line x1="${(100 + Math.cos(a) * 88).toFixed(1)}" y1="${(100 + Math.sin(a) * 88).toFixed(1)}" x2="${(100 - Math.cos(a) * 88).toFixed(1)}" y2="${(100 - Math.sin(a) * 88).toFixed(1)}" stroke="#7a3d14" stroke-width="1.2" opacity=".25"/>`;
      }
    }
    return s + `</svg>`;
  }

  // Ilustraciones planas para el resto de categorías
  const OUT = 'stroke="#3a2418" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  const SIMPLE = {
    burger: `<ellipse cx="100" cy="168" rx="70" ry="10" fill="#000" opacity=".1"/>
      <path d="M38 92 Q40 40 100 38 Q160 40 162 92 Z" fill="#e3a14a" ${OUT}/>
      <g fill="#fff4d6"><ellipse cx="80" cy="62" rx="4" ry="2.4"/><ellipse cx="104" cy="54" rx="4" ry="2.4"/><ellipse cx="124" cy="66" rx="4" ry="2.4"/><ellipse cx="95" cy="76" rx="4" ry="2.4"/><ellipse cx="138" cy="80" rx="4" ry="2.4"/><ellipse cx="66" cy="80" rx="4" ry="2.4"/></g>
      <path d="M32 96 q10 12 22 2 q10 12 22 0 q10 12 22 0 q10 12 22 0 q10 12 22 0 q10 12 24 -2 L168 102 L32 102z" fill="#7bbf4a" ${OUT}/>
      <rect x="36" y="100" width="128" height="12" rx="4" fill="#e2412f" ${OUT}/>
      <path d="M34 112 L166 112 L160 124 L40 124z" fill="#f6c534" ${OUT}/>
      <rect x="34" y="118" width="132" height="22" rx="10" fill="#6b3a25" ${OUT}/>
      <path d="M40 140 L160 140 Q160 162 100 162 Q40 162 40 140z" fill="#e3a14a" ${OUT}/>`,
    sandwich: `<ellipse cx="100" cy="168" rx="76" ry="10" fill="#000" opacity=".1"/>
      <path d="M26 100 Q30 58 100 56 Q170 58 174 100 Z" fill="#edc07a" ${OUT}/>
      <path d="M48 76 q8 -6 16 0 M86 66 q8 -6 16 0 M124 72 q8 -6 16 0" stroke="#c98d43" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M22 104 q12 12 26 0 q12 12 26 0 q12 12 26 0 q12 12 26 0 q12 12 26 0 q12 12 26 0 L178 110 L22 110z" fill="#7bbf4a" ${OUT}/>
      <path d="M26 110 L174 110 L170 120 L30 120z" fill="#9cc26a" ${OUT}/>
      <rect x="28" y="118" width="144" height="16" rx="7" fill="#c47a4c" ${OUT}/>
      <path d="M30 134 L170 134 Q168 152 100 154 Q32 152 30 134z" fill="#edc07a" ${OUT}/>
      <g stroke="#f6c534" stroke-width="7" stroke-linecap="round"><path d="M150 150 L176 118"/><path d="M160 156 L186 130"/></g>`,
    burrito: `<ellipse cx="100" cy="168" rx="70" ry="10" fill="#000" opacity=".1"/>
      <g transform="rotate(-28 100 100)"><rect x="34" y="70" width="132" height="62" rx="31" fill="#f2deb0" ${OUT}/>
      <path d="M58 72 Q70 100 58 130 M82 71 Q94 100 82 131 M106 71 Q118 100 106 131" stroke="#d9bd84" stroke-width="3" fill="none"/>
      <ellipse cx="160" cy="101" rx="16" ry="30" fill="#f7e9c8" ${OUT}/>
      <circle cx="156" cy="92" r="5" fill="#e2412f"/><circle cx="164" cy="104" r="4" fill="#f6c534"/><circle cx="154" cy="110" r="5" fill="#7bbf4a"/><circle cx="163" cy="88" r="3" fill="#f6c534"/><circle cx="160" cy="116" r="3.5" fill="#6b3a25"/></g>`,
    taco: `<ellipse cx="100" cy="166" rx="72" ry="10" fill="#000" opacity=".1"/>
      <path d="M30 150 A70 70 0 0 1 170 150 Z" fill="#f2c460" ${OUT}/>
      <path d="M40 132 q10 -22 26 -24 q8 -18 26 -14 q12 -14 28 -4 q18 -4 26 14 q16 6 14 28" fill="#7bbf4a" ${OUT}/>
      <circle cx="74" cy="118" r="7" fill="#e2412f" ${OUT}/><circle cx="104" cy="106" r="7" fill="#e2412f" ${OUT}/><circle cx="128" cy="120" r="6" fill="#6b3a25" ${OUT}/>
      <rect x="90" y="118" width="10" height="7" rx="2" fill="#f6c534"/><rect x="58" y="128" width="9" height="6" rx="2" fill="#f6c534"/>
      <path d="M44 150 A56 56 0 0 1 156 150" stroke="#d9a33e" stroke-width="3" fill="none"/>`,
    fries: `<ellipse cx="100" cy="170" rx="56" ry="9" fill="#000" opacity=".1"/>
      <g stroke="#3a2418" stroke-width="3" stroke-linejoin="round"><rect x="58" y="40" width="14" height="90" rx="3" fill="#f6c534" transform="rotate(-10 65 85)"/>
      <rect x="76" y="30" width="14" height="96" rx="3" fill="#f9d548"/><rect x="94" y="36" width="14" height="94" rx="3" fill="#f6c534" transform="rotate(6 101 83)"/>
      <rect x="112" y="28" width="14" height="96" rx="3" fill="#f9d548" transform="rotate(-4 119 76)"/><rect x="128" y="42" width="14" height="88" rx="3" fill="#f6c534" transform="rotate(12 135 86)"/></g>
      <path d="M50 92 L150 92 L138 166 L62 166 Z" fill="#ea3237" ${OUT}/>
      <path d="M66 112 h68" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M70 124 h60" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`,
    quesadilla: `<ellipse cx="100" cy="168" rx="76" ry="10" fill="#000" opacity=".1"/>
      <path d="M100 100 L28 120 A74 74 0 0 1 74 32 Z" fill="#efcf8a" ${OUT}/>
      <path d="M100 100 L80 30 A74 74 0 0 1 168 70 Z" fill="#f2d593" ${OUT}/>
      <path d="M100 100 L172 78 A74 74 0 0 1 132 166 Z" fill="#efcf8a" ${OUT}/>
      <path d="M40 112 q14 4 30 -6 M92 42 q4 16 18 20 M146 98 q-4 18 -18 26" stroke="#f6c534" stroke-width="6" fill="none" stroke-linecap="round"/>
      <g stroke="#c98d43" stroke-width="3" stroke-linecap="round"><path d="M52 66 l14 8"/><path d="M58 90 l14 8"/><path d="M110 52 l12 -8"/><path d="M130 64 l12 -8"/><path d="M128 120 l12 8"/><path d="M118 138 l12 8"/></g>
      <circle cx="60" cy="150" r="22" fill="#fff8ea" ${OUT}/><circle cx="60" cy="150" r="14" fill="#e9eedd"/>`,
    bowl: `<ellipse cx="100" cy="168" rx="70" ry="10" fill="#000" opacity=".1"/>
      <path d="M36 92 q6 -26 30 -20 q10 -22 34 -12 q22 -14 36 8 q24 -2 28 24z" fill="#7bbf4a" ${OUT}/>
      <circle cx="78" cy="78" r="10" fill="#f2deb0" ${OUT}/><circle cx="122" cy="80" r="9" fill="#e9692f" ${OUT}/>
      <g fill="#f6c534"><circle cx="98" cy="74" r="3.5"/><circle cx="106" cy="80" r="3.5"/><circle cx="100" cy="86" r="3.5"/><circle cx="92" cy="84" r="3.5"/></g>
      <path d="M26 92 L174 92 Q170 156 100 158 Q30 156 26 92Z" fill="#fff" ${OUT}/>
      <path d="M40 112 Q100 122 160 112" stroke="#ea3237" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    nuggets: `<ellipse cx="100" cy="166" rx="74" ry="10" fill="#000" opacity=".1"/>
      <path d="M26 112 L174 112 L160 160 L40 160z" fill="#ea3237" ${OUT}/>
      <path d="M44 112 q-4 -26 20 -28 q20 -2 20 22z" fill="#e3a14a" ${OUT}/>
      <path d="M86 112 q-2 -34 26 -30 q24 4 14 30z" fill="#d68f3c" ${OUT}/>
      <path d="M126 112 q2 -24 22 -22 q18 4 12 22z" fill="#e3a14a" ${OUT}/>
      <g fill="#a85e22" opacity=".6"><circle cx="60" cy="98" r="2"/><circle cx="70" cy="104" r="2"/><circle cx="104" cy="94" r="2"/><circle cx="116" cy="100" r="2"/><circle cx="144" cy="102" r="2"/></g>
      <path d="M50 134 h100" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    combo: `<ellipse cx="100" cy="170" rx="80" ry="10" fill="#000" opacity=".1"/>
      <circle cx="78" cy="104" r="58" fill="#e9a24b" ${OUT}/><circle cx="78" cy="104" r="46" fill="#f6c85b"/>
      <g fill="#b8242a"><circle cx="62" cy="88" r="7"/><circle cx="92" cy="84" r="7"/><circle cx="70" cy="118" r="7"/><circle cx="98" cy="114" r="7"/><circle cx="80" cy="102" r="6"/></g>
      <rect x="128" y="62" width="44" height="98" rx="10" fill="#1d1d1b" ${OUT}/>
      <rect x="128" y="96" width="44" height="30" fill="#ea3237"/><rect x="140" y="46" width="20" height="18" rx="4" fill="#ea3237" ${OUT}/>
      <path d="M137 112 h26" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    can: `<ellipse cx="100" cy="168" rx="40" ry="8" fill="#000" opacity=".1"/>
      <rect x="66" y="40" width="68" height="124" rx="12" fill="#ea3237" ${OUT}/>
      <path d="M68 52 h64 M68 152 h64" stroke="#c8c8c8" stroke-width="8"/>
      <path d="M78 80 q22 -14 44 0 q-22 14 -44 0z" fill="#fff"/><rect x="80" y="100" width="40" height="34" rx="6" fill="#fff" opacity=".9"/>
      <rect x="86" y="30" width="28" height="12" rx="4" fill="#d0d0d0" ${OUT}/>`,
    bottle: `<ellipse cx="100" cy="170" rx="34" ry="7" fill="#000" opacity=".1"/>
      <path d="M86 28 h28 v18 q16 12 16 32 v76 q0 12 -12 12 h-36 q-12 0 -12 -12 v-76 q0 -20 16 -32z" fill="#bfe3ee" ${OUT}/>
      <rect x="84" y="20" width="32" height="12" rx="3" fill="#ea3237" ${OUT}/>
      <rect x="70" y="92" width="60" height="38" fill="#ea3237"/><path d="M80 112 h40" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <path d="M80 60 q-6 10 -6 26" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>`,
    juice: `<ellipse cx="100" cy="170" rx="44" ry="8" fill="#000" opacity=".1"/>
      <path d="M58 54 L142 54 L132 164 L68 164 Z" fill="#fff8ea" ${OUT}/>
      <path d="M62 82 L138 82 L131 160 L69 160 Z" fill="#f6c534"/>
      <circle cx="136" cy="56" r="20" fill="#9cc26a" ${OUT}/><circle cx="136" cy="56" r="13" fill="#d7ea8c"/>
      <path d="M92 26 L106 120" stroke="#ea3237" stroke-width="7" stroke-linecap="round"/>
      <path d="M78 46 q8 -14 18 -6 q4 -12 14 -4" stroke="#3f8f3a" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    mocktail: `<ellipse cx="100" cy="170" rx="44" ry="8" fill="#000" opacity=".1"/>
      <path d="M60 46 L140 46 L130 164 L70 164 Z" fill="#fff8ea" ${OUT}/>
      <path d="M63 76 L137 76 L131 160 L69 160 Z" fill="#f08a5d"/><path d="M66 112 L134 112 L131 160 L69 160 Z" fill="#ea3237" opacity=".7"/>
      <rect x="78" y="90" width="16" height="16" rx="3" fill="#fff" opacity=".6" transform="rotate(14 86 98)"/><rect x="104" y="96" width="16" height="16" rx="3" fill="#fff" opacity=".6" transform="rotate(-10 112 104)"/>
      <path d="M112 20 L96 130" stroke="#1d1d1b" stroke-width="6" stroke-linecap="round"/>
      <path d="M70 52 q10 -18 24 -8 q-6 16 -24 8z" fill="#3f8f3a"/><circle cx="136" cy="50" r="16" fill="#f6c534" ${OUT}/>`,
    cocktail: `<ellipse cx="100" cy="172" rx="40" ry="7" fill="#000" opacity=".1"/>
      <path d="M40 44 L160 44 L100 110 Z" fill="#fff8ea" ${OUT}/><path d="M54 58 L146 58 L100 108 Z" fill="#9cc26a"/>
      <path d="M100 110 L100 160 M72 164 L128 164" ${OUT} fill="none"/>
      <circle cx="146" cy="44" r="16" fill="#f6c534" ${OUT}/><path d="M146 30 L146 58 M132 44 L160 44" stroke="#e1ae22" stroke-width="2"/>
      <circle cx="88" cy="74" r="7" fill="#ea3237"/>`,
    beer: `<ellipse cx="96" cy="170" rx="44" ry="8" fill="#000" opacity=".1"/>
      <path d="M58 56 L130 56 L126 164 L62 164 Z" fill="#f2a529" ${OUT}/>
      <path d="M130 80 q28 0 28 26 q0 26 -30 26" stroke="#3a2418" stroke-width="10" fill="none"/><path d="M130 80 q28 0 28 26 q0 26 -30 26" stroke="#fff8ea" stroke-width="4" fill="none"/>
      <path d="M52 60 q0 -22 22 -18 q8 -16 26 -8 q18 -10 28 8 q16 2 8 22z" fill="#fff" ${OUT}/>
      <g fill="#fff" opacity=".6"><circle cx="80" cy="100" r="3"/><circle cx="104" cy="120" r="2.5"/><circle cx="90" cy="140" r="3"/><circle cx="110" cy="92" r="2"/></g>`,
    coffee: `<ellipse cx="100" cy="166" rx="66" ry="10" fill="#000" opacity=".1"/>
      <ellipse cx="100" cy="156" rx="66" ry="12" fill="#fff8ea" ${OUT}/>
      <path d="M52 82 L148 82 L140 148 Q100 160 60 148 Z" fill="#ea3237" ${OUT}/>
      <path d="M146 96 q26 0 24 22 q-2 20 -30 18" stroke="#3a2418" stroke-width="10" fill="none"/><path d="M146 96 q26 0 24 22 q-2 20 -30 18" stroke="#ea3237" stroke-width="4" fill="none"/>
      <ellipse cx="100" cy="82" rx="48" ry="9" fill="#6b3a25" ${OUT}/>
      <path d="M80 62 q-8 -12 2 -22 q8 -10 0 -22 M104 62 q-8 -12 2 -22 q8 -10 0 -22" stroke="#c9b8a6" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    breakfast: `<ellipse cx="100" cy="168" rx="80" ry="10" fill="#000" opacity=".1"/>
      <ellipse cx="100" cy="112" rx="84" ry="52" fill="#fff8ea" ${OUT}/>
      <path d="M48 96 q-4 -28 26 -28 q30 -4 30 22 q4 30 -26 30 q-28 2 -30 -24z" fill="#fff" ${OUT}/><circle cx="76" cy="94" r="12" fill="#f6b52b"/>
      <rect x="114" y="80" width="56" height="52" rx="12" fill="#d9954a" ${OUT}/><rect x="122" y="88" width="40" height="36" rx="8" fill="#edc07a"/>
      <ellipse cx="138" cy="104" rx="14" ry="8" fill="#9cc26a" stroke="#5f8c39" stroke-width="2"/>`,
    promo: `<circle cx="100" cy="100" r="70" fill="#ea3237" ${OUT}/>
      <path d="M100 40 l14 30 33 4 -24 23 6 33 -29 -16 -29 16 6 -33 -24 -23 33 -4z" fill="#f6c534" ${OUT}/>`,
  };

  function simple(kind) {
    const body = SIMPLE[kind] || SIMPLE.promo;
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${body}</svg>`;
  }

  // API pública
  window.BreakArt = {
    product(p, opts) {
      if (p && p.imagen) return `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy">`;
      const kind = (p && p.ilustracion) || "pizza";
      return kind === "pizza" ? pizza(p, opts) : simple(kind);
    },
    pizza,
    icon: simple,
  };
})();
