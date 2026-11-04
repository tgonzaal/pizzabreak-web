/* ==========================================================================
   Pizza Break · Carta y pedido (carta.html)
   Prototipo de interacción: todo vive en el navegador (localStorage).
   Puntos de integración marcados con  >>> API
   ========================================================================== */
(function () {
  "use strict";
  const { ICON, fmt, D, getLocal, store, estadoLocal, toast } = window.Break;
  const Art = window.BreakArt;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------------------------------------------------------------- estado
  // window.__QS lo pone Apps Script (la página corre dentro de un iframe sin la query original)
  const params = new URLSearchParams(window.__QS || location.search);
  // El local SIEMPRE lo elige el cliente: si la URL no trae ?local=, se le pregunta antes de mostrar la carta
  let elegido = !!(params.get("local") && D.cartas[params.get("local")]);
  if (elegido) store.local = params.get("local");

  let local = getLocal(elegido ? params.get("local") : "mendoza");
  let carta = D.cartas[local.id];     // >>> API: GET /api/locales/{id}/carta  (mismo formato que data/carta-*.json)
  let grupos = {};
  let carrito = [];
  let filtro = "";

  const cargarCarrito = () => { try { carrito = JSON.parse(localStorage.getItem("break.carrito." + local.id)) || []; } catch { carrito = []; } };
  const guardarCarrito = () => localStorage.setItem("break.carrito." + local.id, JSON.stringify(carrito));

  const dirCorta = (l) => l.direccion.split(",")[0];

  // ---------------------------------------------------------------- reserva (retiro programado)
  // El cliente elige día y hora; paga ahora y el pedido está listo cuando llega.
  const RESERVA = { anticipacionMin: 60, intervaloMin: 30, dias: 2 }; // >>> API: configurable por local
  let reserva = null;     // { dia: 0|1, hora: "20:30" }
  let reservaDia = null;  // día que se está mirando en el selector
  const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const aHora = (min) => String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
  function horarios(dia) {
    const f = new Date(); f.setDate(f.getDate() + dia);
    const h = local.horario[f.getDay() === 0 ? 1 : 0];
    let desde = aMin(h.abre) + RESERVA.intervaloMin;
    if (dia === 0) {
      const ahora = new Date().getHours() * 60 + new Date().getMinutes() + RESERVA.anticipacionMin;
      desde = Math.max(desde, Math.ceil(ahora / RESERVA.intervaloMin) * RESERVA.intervaloMin);
    }
    const out = [];
    for (let m = desde; m <= aMin(h.cierra) - RESERVA.intervaloMin; m += RESERVA.intervaloMin) out.push(aHora(m));
    return out;
  }
  const nombreDia = (d) => (d === 0 ? "Hoy" : d === 1 ? "Mañana" : "En " + d + " días");
  const textoReserva = () => (reserva ? `${nombreDia(reserva.dia).toLowerCase()} a las ${reserva.hora}` : "");  // "Mendoza 109", "Av. Oriente 1290"

  function setLocal(id) {
    elegido = true;
    document.body.classList.remove("sin-local");
    store.local = id;
    local = getLocal(id);
    carta = D.cartas[id];
    grupos = Object.fromEntries(carta.gruposOpciones.map((g) => [g.id, g]));
    cargarCarrito();
    const u = new URL(location.href); u.searchParams.set("local", id); u.searchParams.delete("producto"); history.replaceState(null, "", u);
    renderTodo();
  }

  const productos = () => carta.categorias.flatMap((c) => c.productos);
  const buscarProd = (id) => productos().find((p) => p.id === id);
  const precioDesde = (p) => (p.variantes ? Math.min(...p.variantes.map((v) => v.precio)) : p.precio);
  const tieneVarios = (p) => p.variantes && new Set(p.variantes.map((v) => v.precio)).size > 1;

  // ---------------------------------------------------------------- header / banner
  function renderHeader() {
    $("#sel-local").textContent = elegido ? dirCorta(local) : "Elige un local";
    $("#btn-local").setAttribute("aria-label", elegido ? "Cambiar local. Actual: " + dirCorta(local) : "Elegir local");
    $("#sel-modo").textContent = elegido ? "Pidiendo en" : "¿Dónde pides?";
    $$(".segmento [data-modo]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === store.modo)));
  }

  function renderBanner() {
    const e = estadoLocal(local);
    $("#local-nombre").innerHTML = `${esc(dirCorta(local))} <small>Desde 2011</small>`;
    $("#local-meta").innerHTML = `
      <span>${ICON.clock} ${e.texto}</span>
      <span>${ICON.phone} <a href="tel:${local.telefono}">${local.telefonoTexto}</a></span>`;
    $("#local-info").innerHTML = `
      <div class="banner-dato"><small>Delivery</small><strong>${local.tiempoDelivery}</strong></div>
      <div class="banner-dato"><small>Retiro</small><strong>${local.tiempoRetiro}</strong></div>
      <div class="banner-dato"><small>Reserva</small><strong>Tú eliges la hora</strong></div>
      <div class="banner-dato"><small>Estado</small><strong style="color:${e.abierto ? "#7ddc8f" : "#f6b52b"}">${e.abierto ? "Abierto" : "Cerrado"}</strong></div>`;
    const fotoBanner = buscarProd(local.id === "oriente" ? "pz-pollo-bbq" : "pz-break");
    $("#banner-pz").innerHTML = Art.product(fotoBanner);
    document.title = `Carta ${dirCorta(local)} · Pizza Break`;
  }

  // ---------------------------------------------------------------- carta
  function iconoCat(c) {
    if (c.icono === "pizza") return Art.pizza({ id: "cat-" + c.id, toppings: c.id.includes("clasica") ? ["Pepperoni"] : ["Carne", "Tomate", "Salame"] }, { noSlices: true });
    if (c.icono === "promo") return Art.icon("combo");
    return Art.icon(c.icono);
  }

  function cardProducto(p) {
    const enCarrito = carrito.filter((i) => i.productoId === p.id).reduce((a, i) => a + i.cant, 0);
    const tags = p.tags.filter((t) => t !== "Desde").map((t) => {
      const cls = /vegan|vegetar/i.test(t) ? "chip--verde" : /\+18|solo|junaeb/i.test(t) ? "chip--amarillo" : "";
      return `<span class="chip ${cls}">${esc(t)}</span>`;
    }).join("");
    return `
      <button class="producto ${enCarrito ? "producto--en-carrito" : ""}" data-producto="${p.id}" aria-label="${esc(p.nombre)}, ${fmt(precioDesde(p))}">
        ${enCarrito ? `<span class="producto__qty">${enCarrito}</span>` : ""}
        <div class="producto__info">
          <span class="producto__nombre">${esc(p.nombre)}</span>
          ${p.descripcion ? `<span class="producto__desc">${esc(p.descripcion)}</span>` : ""}
          ${tags ? `<span class="producto__tags">${tags}</span>` : ""}
          <span class="producto__precio">${tieneVarios(p) || p.tags.includes("Desde") ? "<small>desde</small>" : ""}${fmt(precioDesde(p))}</span>
        </div>
        <div class="producto__img">${Art.product(p, { noSlices: true })}</div>
        <span class="btn-mas" aria-hidden="true">${ICON.mas}</span>
      </button>`;
  }

  function renderCarta() {
    const q = filtro.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const match = (p) => !q || (p.nombre + " " + p.descripcion + " " + p.tags.join(" ")).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q);
    const cats = carta.categorias.map((c) => ({ ...c, productos: c.productos.filter(match) })).filter((c) => c.productos.length);

    $("#lista-cats").innerHTML = carta.categorias.map((c) => `<a href="#${c.id}" data-cat="${c.id}">${iconoCat(c)}<span>${esc(c.nombre)}</span><span class="n">${c.productos.length}</span></a>`).join("");
    $("#chips").innerHTML = carta.categorias.map((c) => `<a href="#${c.id}" data-cat="${c.id}">${esc(c.nombre)}</a>`).join("");

    const dest = productos().filter((p) => p.destacado);
    $("#destacados-wrap").hidden = !!q || !dest.length;
    $("#destacados").innerHTML = dest.map((p) => `
      <button class="dest-card" data-producto="${p.id}">
        <div class="dest-card__img">${Art.product(p, { noSlices: true })}${p.tags[0] && p.tags[0] !== "Desde" ? `<span class="chip">${esc(p.tags[0])}</span>` : ""}</div>
        <strong>${esc(p.nombre)}</strong><span>${tieneVarios(p) ? "desde " : ""}${fmt(precioDesde(p))}</span>
      </button>`).join("");

    $("#secciones").innerHTML = cats.length ? cats.map((c) => `
      <section class="cat-seccion" id="${c.id}" aria-labelledby="h-${c.id}">
        <div class="cat-seccion__head"><h2 id="h-${c.id}">${esc(c.nombre)}</h2></div>
        <p class="cat-seccion__desc">${esc(c.descripcion)}</p>
        <div class="productos">${c.productos.map(cardProducto).join("")}</div>
      </section>`).join("")
      : `<div class="sin-resultados">${Art.icon("fries")}<strong>No encontramos “${esc(filtro)}”</strong><p>Prueba con otra palabra, por ejemplo “pollo” o “vegetariana”.</p></div>`;
    observarCats();
  }

  // Categoría activa según scroll
  let obs;
  function observarCats() {
    obs && obs.disconnect();
    obs = new IntersectionObserver((ents) => {
      ents.filter((e) => e.isIntersecting).forEach((e) => {
        $$("[data-cat]").forEach((a) => a.classList.toggle("activo", a.dataset.cat === e.target.id));
        const chip = $(`#chips [data-cat="${e.target.id}"]`);
        // Centra el chip moviendo SOLO la barra de chips (scrollIntoView también movía la página y cortaba el salto a la categoría)
        if (chip) { const bar = chip.parentElement; bar.scrollTo({ left: chip.offsetLeft - bar.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" }); }
      });
    }, { rootMargin: "-30% 0px -65% 0px" });
    $$(".cat-seccion").forEach((s) => obs.observe(s));
  }

  // ---------------------------------------------------------------- modal de producto
  let actual = null; // { p, cant, editKey }

  function abrirProducto(id, editKey) {
    const p = buscarProd(id);
    if (!p) return;
    const previo = editKey ? carrito.find((i) => i.key === editKey) : null;
    actual = { p, cant: previo ? previo.cant : 1, editKey };
    const gruposP = p.opciones.map((gid) => grupos[gid]).filter(Boolean);
    const esPizza = p.ilustracion === "pizza";

    actual.gruposPizza = gruposP.filter((g) => g.eligePizza);
    $("#mp-media").innerHTML = `<div id="mp-arte">${Art.product(p)}</div>${esPizza && p.variantes ? `<span class="tag-tam" id="mp-tag"></span>` : ""}`;

    let h = `<h2 id="mp-titulo">${esc(p.nombre)}</h2>`;
    if (p.descripcion) h += `<p class="modal__desc">${esc(p.descripcion)}</p>`;
    if (p.tags.length) h += `<div class="producto__tags" style="margin-top:10px">${p.tags.filter((t) => t !== "Desde").map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>`;
    if (!p.variantes) h += `<p class="modal__precio-base">${fmt(p.precio)}</p>`;

    if (p.variantes) {
      const titulo = esPizza ? "Elige el tamaño" : p.id.startsWith("sw") || p.id.startsWith("cp-desafio") ? "Elige la proteína" : "Elige una opción";
      h += `<div class="grupo"><div class="grupo__head"><div><strong>${titulo}</strong><small>Elige 1</small></div><span class="chip">Obligatorio</span></div>`;
      if (esPizza) {
        h += `<div class="tamanos" style="padding-top:6px">` + p.variantes.map((v, i) => `
          <label class="tamano"><input type="radio" name="variante" value="${v.id}" ${previo ? (previo.varianteId === v.id ? "checked" : "") : i === 0 ? "checked" : ""}>
            <span class="circ" style="width:${i ? 30 : 22}px;height:${i ? 30 : 22}px"></span>
            <strong>${esc(v.nombre)}</strong><small>${esc(v.detalle || "")}</small><span>${fmt(v.precio)}</span></label>`).join("") + `</div>`;
      } else {
        h += p.variantes.map((v, i) => `
          <label class="opcion"><input type="radio" name="variante" value="${v.id}" ${previo ? (previo.varianteId === v.id ? "checked" : "") : i === 0 ? "checked" : ""}><span class="opcion__check"></span>
            <span class="opcion__txt">${esc(v.nombre)}${v.detalle ? `<small>${esc(v.detalle)}</small>` : ""}</span><span class="opcion__precio">${fmt(v.precio)}</span></label>`).join("");
      }
      h += `</div>`;
    }

    gruposP.forEach((g) => {
      const reglas = g.tipo === "unica" ? "Elige 1" : g.tipo === "cantidad" ? "Agrega las porciones que quieras" : g.min ? `Elige ${g.min}${g.max && g.max > g.min ? ` (máx. ${g.max})` : ""}` : g.max ? `Hasta ${g.max}` : "Opcional";
      const prevSel = previo ? (previo.opciones.find((o) => o.grupoId === g.id) || { items: [] }).items : [];
      h += `<div class="grupo" data-grupo="${g.id}"><div class="grupo__head"><div><strong>${esc(g.nombre)}</strong><small>${reglas}</small></div>${g.min ? `<span class="chip" data-estado>Obligatorio</span>` : `<span class="chip chip--amarillo">Opcional</span>`}</div>`;
      let ultimoPrecio = null;
      g.items.forEach((it, i) => {
        const sel = prevSel.find((x) => x.id === it.id);
        if (g.tipo === "multiple" && it.precio !== ultimoPrecio && g.items.some((x) => x.precio !== it.precio)) {
          h += `<div style="font-size:12px;font-weight:700;color:var(--tinta-2);padding:12px 14px 2px">${it.precio ? "+ " + fmt(it.precio) : "Incluidos"}</div>`;
        }
        ultimoPrecio = it.precio;
        if (g.tipo === "cantidad") {
          h += `<div class="opcion" style="cursor:default"><span class="opcion__txt">${esc(it.nombre)}<small>+ ${fmt(it.precio)} c/u</small></span>
            <span class="stepper" data-cant-item="${it.id}"><button type="button" data-d="-1" aria-label="Quitar ${esc(it.nombre)}">${ICON.menos}</button><span>${sel ? sel.cant : 0}</span><button type="button" data-d="1" aria-label="Agregar ${esc(it.nombre)}">${ICON.mas}</button></span></div>`;
        } else {
          const tipo = g.tipo === "unica" ? "radio" : "checkbox";
          const chk = sel || (!previo && g.tipo === "unica" && i === 0);
          const chkFinal = chk && !g.eligePizza; // en promos el cliente elige la pizza, no se preselecciona
          h += `<label class="opcion"><input type="${tipo}" name="g-${g.id}" value="${it.id}" ${chkFinal || (g.eligePizza && sel) ? "checked" : ""}><span class="opcion__check"></span>
            ${g.eligePizza ? `<span class="opcion__img">${it.imagen ? `<img src="${it.imagen}" alt="" loading="lazy">` : Art.pizza({ id: it.id, toppings: (it.detalle || "").split(",") }, { noSlices: true })}</span>` : ""}
            <span class="opcion__txt">${esc(it.nombre)}${g.eligePizza && it.detalle ? `<small>${esc(it.detalle)}</small>` : ""}</span>${g.tipo === "multiple" && it.precio ? `<span class="opcion__precio">+${fmt(it.precio)}</span>` : ""}</label>`;
        }
      });
      h += `</div>`;
    });

    h += `<div class="grupo"><div class="grupo__head"><div><strong>Comentarios</strong><small>¿Algo que debamos saber?</small></div></div>
      <textarea class="nota" id="mp-nota" placeholder="Ej: sin cebolla, bien cocida, cortar en 12…">${esc(previo ? previo.nota : "")}</textarea></div>`;

    $("#mp-scroll").innerHTML = h;
    $("#mp-scroll").scrollTop = 0;
    $("#mp-agregar span").innerHTML = editKey ? "Guardar<span class=\"solo-desk\"> cambios</span>" : "Agregar<span class=\"solo-desk\"> al pedido</span>";
    recalcular();
    abrir("#ov-producto");
  }

  function seleccion() {
    const { p } = actual;
    const form = $("#form-producto");
    const vId = p.variantes ? (form.querySelector('input[name="variante"]:checked') || {}).value : null;
    const variante = p.variantes ? p.variantes.find((v) => v.id === vId) : null;
    const opciones = p.opciones.map((gid) => grupos[gid]).filter(Boolean).map((g) => {
      let items;
      if (g.tipo === "cantidad") {
        items = $$(`[data-grupo="${g.id}"] [data-cant-item]`).map((st) => {
          const it = g.items.find((x) => x.id === st.dataset.cantItem);
          return { ...it, cant: Number(st.querySelector("span").textContent) };
        }).filter((x) => x.cant > 0);
      } else {
        items = $$(`input[name="g-${g.id}"]:checked`, form).map((inp) => ({ ...g.items.find((x) => x.id === inp.value), cant: 1 }));
      }
      return { grupoId: g.id, grupo: g.nombre, items, ok: items.length >= (g.min || 0) };
    });
    const unit = (variante ? variante.precio : p.precio) + opciones.reduce((a, o) => a + o.items.reduce((b, i) => b + i.precio * i.cant, 0), 0);
    return { variante, opciones, unit, valido: opciones.every((o) => o.ok) };
  }

  function recalcular() {
    const sel = seleccion();
    $("#mp-cant").textContent = actual.cant;
    $("#mp-total").textContent = fmt(sel.unit * actual.cant);
    $("#mp-agregar").disabled = !sel.valido;
    $("#mp-agregar").style.opacity = sel.valido ? "" : ".5";
    // máximos y estado de grupos obligatorios
    actual.p.opciones.map((gid) => grupos[gid]).filter(Boolean).forEach((g) => {
      const box = $(`[data-grupo="${g.id}"]`);
      if (!box) return;
      const n = $$("input:checked", box).length;
      if (g.tipo === "multiple" && g.max) $$("input:not(:checked)", box).forEach((i) => { i.disabled = n >= g.max; i.closest(".opcion").classList.toggle("opcion--disabled", n >= g.max); });
      const est = $("[data-estado]", box);
      if (est && g.min) { const ok = n >= g.min; est.textContent = ok ? "Listo" : `${n}/${g.min}`; est.className = "chip " + (ok ? "chip--verde" : ""); }
    });
    // promos: la imagen muestra las pizzas que va eligiendo el cliente
    if (actual.gruposPizza && actual.gruposPizza.length) {
      const elegidas = actual.gruposPizza.map((g) => {
        const o = sel.opciones.find((x) => x.grupoId === g.id);
        return o && o.items[0];
      });
      if (elegidas.some(Boolean)) {
        $("#mp-arte").innerHTML = `<div class="mp-elegidas">${elegidas.map((it, i) => it
          ? `<figure>${it.imagen ? `<img src="${it.imagen}" alt="${esc(it.nombre)}">` : Art.pizza({ id: it.id, toppings: (it.detalle || "").split(",") })}<figcaption>${esc(it.nombre)}</figcaption></figure>`
          : `<figure><div class="vacia">Pizza ${i + 1}</div><figcaption>Por elegir</figcaption></figure>`).join("")}</div>`;
      } else {
        $("#mp-arte").innerHTML = Art.product(actual.p);
      }
    }
    // pizza XL se ve un poco más grande
    const tag = $("#mp-tag");
    if (tag && sel.variante) { tag.textContent = `${sel.variante.nombre} · ${sel.variante.detalle || ""}`; $("#mp-arte").className = sel.variante.id === "xl" ? "tamano-xl" : ""; }
  }

  $("#form-producto").addEventListener("change", recalcular);
  $("#form-producto").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cant-item] button");
    if (!b) return;
    const span = b.parentElement.querySelector("span");
    span.textContent = Math.max(0, Number(span.textContent) + Number(b.dataset.d));
    recalcular();
  });
  $("#mp-menos").addEventListener("click", () => { actual.cant = Math.max(1, actual.cant - 1); recalcular(); });
  $("#mp-mas").addEventListener("click", () => { actual.cant = Math.min(20, actual.cant + 1); recalcular(); });

  $("#form-producto").addEventListener("submit", (e) => {
    e.preventDefault();
    const sel = seleccion();
    if (!sel.valido) return;
    const { p } = actual;
    const item = {
      key: actual.editKey || p.id + "-" + Date.now(),
      productoId: p.id,
      nombre: p.nombre,
      varianteId: sel.variante ? sel.variante.id : null,
      variante: sel.variante ? sel.variante.nombre : null,
      opciones: sel.opciones.filter((o) => o.items.length).map(({ grupoId, grupo, items }) => ({ grupoId, grupo, items: items.map(({ id, nombre, precio, cant }) => ({ id, nombre, precio, cant })) })),
      nota: $("#mp-nota").value.trim(),
      unit: sel.unit,
      cant: actual.cant,
    };
    if (actual.editKey) carrito = carrito.map((i) => (i.key === actual.editKey ? item : i));
    else carrito.push(item);
    guardarCarrito();
    cerrar("#ov-producto");
    toast(actual.editKey ? "Pedido actualizado" : `${p.nombre} agregado al pedido`);
    renderCarrito(); renderCarta();
  });

  // ---------------------------------------------------------------- carrito
  const subtotal = () => carrito.reduce((a, i) => a + i.unit * i.cant, 0);
  const unidades = () => carrito.reduce((a, i) => a + i.cant, 0);
  const envio = () => (store.modo === "delivery" && carrito.length ? local.costoDelivery : 0);

  function detalleItem(i) {
    const partes = [];
    if (i.variante) partes.push(i.variante);
    i.opciones.forEach((o) => o.items.forEach((x) => partes.push((x.cant > 1 ? x.cant + "× " : "") + x.nombre)));
    if (i.nota) partes.push(`“${i.nota}”`);
    return partes.join(" · ");
  }

  function htmlItems() {
    if (!carrito.length) return `<div class="carrito__vacio">${Art.pizza({ id: "vacio", toppings: [] }, { noSlices: false })}<strong>Tu pedido está vacío</strong>Agrega tus favoritos de la carta para comenzar.</div>`;
    return carrito.map((i) => {
      const p = buscarProd(i.productoId) || {};
      return `<div class="item">
        <div class="item__img">${Art.product(p, { noSlices: true })}</div>
        <div><div class="item__nombre">${esc(i.nombre)}</div><div class="item__det">${esc(detalleItem(i))}</div></div>
        <div class="item__precio">${fmt(i.unit * i.cant)}</div>
        <div class="item__ctrl">
          <button class="item__editar" data-editar="${i.key}">Editar</button>
          <span class="stepper"><button data-item="${i.key}" data-d="-1" aria-label="Quitar uno">${i.cant === 1 ? ICON.x : ICON.menos}</button><span>${i.cant}</span><button data-item="${i.key}" data-d="1" aria-label="Agregar uno">${ICON.mas}</button></span>
        </div>
      </div>`;
    }).join("");
  }

  function htmlTotales(boton = true) {
    if (!carrito.length) return boton ? `<button class="btn btn--primario btn--bloque btn--lg" disabled style="opacity:.45">Ir a pagar</button>` : "";
    return `
      <div class="fila"><span>Subtotal</span><span>${fmt(subtotal())}</span></div>
      <div class="fila"><span>${store.modo === "delivery" ? "Envío" : store.modo === "reserva" ? "Reserva · retiro en local" : "Retiro en local"}</span><span>${store.modo === "delivery" ? fmt(envio()) : "Gratis"}</span></div>
      <div class="fila fila--total"><span>Total</span><span>${fmt(subtotal() + envio())}</span></div>
      ${boton ? `<button class="btn btn--primario btn--bloque btn--lg" data-checkout>Ir a pagar ${ICON.flecha}</button>` : ""}`;
  }

  function renderCarrito() {
    $("#carrito-items").innerHTML = htmlItems();
    $("#carrito-pie").innerHTML = htmlTotales();
    $("#vaciar").hidden = !carrito.length;
    const n = unidades();
    $("#badge").hidden = !n; $("#badge").textContent = n;
    $("#barra-pedido").hidden = !n;
    $("#barra-cant").textContent = n;
    $("#barra-total").textContent = fmt(subtotal() + envio());
    if (panelVista === "carrito" && $("#panel").classList.contains("abierto")) vistaCarrito();
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-producto],[data-item],[data-editar],[data-checkout]");
    if (!t) return;
    if (t.dataset.producto) abrirProducto(t.dataset.producto);
    else if (t.dataset.editar) { cerrarPanel(); abrirProducto(carrito.find((i) => i.key === t.dataset.editar).productoId, t.dataset.editar); }
    else if (t.dataset.item) {
      carrito = carrito.map((i) => (i.key === t.dataset.item ? { ...i, cant: i.cant + Number(t.dataset.d) } : i)).filter((i) => i.cant > 0);
      guardarCarrito(); renderCarrito(); renderCarta();
    } else if ("checkout" in t.dataset) { abrirPanel(); vistaCheckout(); }
  });
  $("#vaciar").addEventListener("click", () => { carrito = []; guardarCarrito(); renderCarrito(); renderCarta(); });

  // ---------------------------------------------------------------- panel (carrito móvil + checkout)
  let panelVista = "carrito";
  function abrirPanel() { $("#panel").classList.add("abierto"); $("#panel").setAttribute("aria-hidden", "false"); $("#velo").classList.add("abierto"); document.body.style.overflow = "hidden"; }
  function cerrarPanel() { $("#panel").classList.remove("abierto"); $("#panel").setAttribute("aria-hidden", "true"); $("#velo").classList.remove("abierto"); document.body.style.overflow = ""; }
  $("#velo").addEventListener("click", cerrarPanel);
  $$("[data-cerrar-panel]").forEach((b) => b.addEventListener("click", cerrarPanel));

  function vistaCarrito() {
    panelVista = "carrito";
    $("#panel-titulo").textContent = "Tu pedido";
    $("#panel-atras").hidden = true;
    $("#panel-cuerpo").innerHTML = `<div class="segmento" style="width:100%;margin:12px 0 4px" id="seg-panel">
        <button data-modo="delivery" aria-pressed="${store.modo === "delivery"}" style="flex:1;justify-content:center">${ICON.moto} Delivery</button>
        <button data-modo="retiro" aria-pressed="${store.modo === "retiro"}" style="flex:1;justify-content:center">${ICON.bolsa} Retiro</button>
        <button data-modo="reserva" aria-pressed="${store.modo === "reserva"}" style="flex:1;justify-content:center">${ICON.calendario} Reservar</button></div>` + htmlItems();
    $("#panel-pie").innerHTML = htmlTotales();
  }

  function vistaCheckout() {
    panelVista = "checkout";
    $("#panel-titulo").textContent = "Finalizar pedido";
    $("#panel-atras").hidden = false;
    const del = store.modo === "delivery";
    const res = store.modo === "reserva";
    const e = estadoLocal(local);
    $("#panel-cuerpo").innerHTML = `
      <div class="pasos"><span class="on"></span><span class="on"></span><span></span></div>
      <form id="form-checkout" onsubmit="return false">
        <div class="form-bloque">
          <h3><i>1</i> ${del ? "¿Dónde te lo llevamos?" : res ? "¿Cuándo pasas a buscarlo?" : "¿Dónde lo retiras?"}</h3>
          ${del ? `<div class="campos">
              <div class="campo campo--full"><label for="c-dir">Dirección</label><input id="c-dir" placeholder="Calle y número" autocomplete="street-address"></div>
              <div class="campo"><label for="c-depto">Depto / casa</label><input id="c-depto" placeholder="Opcional"></div>
              <div class="campo"><label for="c-comuna">Comuna</label><select id="c-comuna"><option>Los Ángeles</option></select></div>
              <div class="campo campo--full"><label for="c-ref">Referencia para el repartidor</label><input id="c-ref" placeholder="Ej: portón negro, frente a la plaza"></div>
            </div>`
          : res ? `<p class="reserva-ayuda">Elige a qué hora llegas y tendremos tu pedido recién salido del horno en <strong>${esc(dirCorta(local))}</strong>.</p>
              <div class="reserva" id="reserva-picker"></div>`
          : `<div class="op-local activo" style="cursor:default"><span class="op-local__ico"><img src="assets/productos/${local.id === "oriente" ? "pizza-pollo-bbq" : "pizza-break"}.webp" alt=""></span><span><strong>${esc(dirCorta(local))}</strong><small>Listo en ${local.tiempoRetiro} aprox.</small></span><span class="chip chip--verde">Retiro</span></div>
             <p class="reserva-ayuda" style="margin-top:10px">¿Vas más tarde? <button type="button" class="link" data-modo-ir="reserva">Reserva tu pedido para una hora</button></p>`}
        </div>
        <div class="form-bloque">
          <h3><i>2</i> Tus datos</h3>
          <div class="campos">
            <div class="campo"><label for="c-nom">Nombre</label><input id="c-nom" autocomplete="given-name"></div>
            <div class="campo"><label for="c-tel">Teléfono</label><input id="c-tel" type="tel" placeholder="+56 9" autocomplete="tel"></div>
            <div class="campo campo--full"><label for="c-mail">Email (para la boleta)</label><input id="c-mail" type="email" autocomplete="email"></div>
          </div>
        </div>
        <div class="form-bloque">
          <h3><i>3</i> Método de pago</h3>
          <div class="pago">
            <label><input type="radio" name="pago" value="tarjeta" checked>${ICON.tarjeta}<div>Tarjeta de débito o crédito<small>Pago online seguro${res ? " · tu reserva queda pagada" : ""}</small></div><span class="logo-pago">Mercado Pago</span></label>
          </div>
        </div>
        <div class="form-bloque">
          <h3><i>4</i> Resumen</h3>
          <div class="resumen-mini">
            ${carrito.map((i) => `<div class="fila" style="color:var(--tinta)"><span>${i.cant}× ${esc(i.nombre)}${i.variante ? " · " + esc(i.variante) : ""}</span><span>${fmt(i.unit * i.cant)}</span></div>`).join("")}
          </div>
          ${res ? `<div class="reserva-resumen" id="reserva-resumen">${ICON.clock}<span></span></div>` : ""}
          ${!e.abierto && !res ? `<p class="envio-progreso" style="margin-top:10px">El local está cerrado ahora. Tu pedido quedará programado para cuando abra (${e.horario.abre} hrs).</p>` : ""}
        </div>
      </form>`;
    $("#panel-pie").innerHTML = htmlTotales(false) + `<button class="btn btn--primario btn--bloque btn--lg" id="confirmar">${res ? "Reservar y pagar" : "Confirmar y pagar"} ${fmt(subtotal() + envio())}</button>`;
    $("#confirmar").addEventListener("click", vistaExito);
    if (res) pintarReserva();
  }

  // Selector de día y hora de la reserva
  function pintarReserva() {
    const box = $("#reserva-picker");
    if (!box) return;
    if (reservaDia === null) reservaDia = reserva ? reserva.dia : (horarios(0).length ? 0 : 1);
    const dia = reservaDia;
    box.innerHTML = `
      <div class="reserva__dias">${Array.from({ length: RESERVA.dias }, (_, d) => {
        const n = horarios(d).length;
        return `<button type="button" class="reserva__dia" data-dia="${d}" aria-pressed="${d === dia}" ${n ? "" : "disabled"}>${nombreDia(d)}<small>${n ? n + " horarios" : "Sin horarios"}</small></button>`;
      }).join("")}</div>
      <div class="reserva__horas">${horarios(dia).map((h) => `<button type="button" class="reserva__hora" data-hora="${h}" aria-pressed="${!!reserva && reserva.dia === dia && reserva.hora === h}">${h}</button>`).join("")}</div>`;
    const ok = !!reserva;
    $("#confirmar").disabled = !ok;
    $("#confirmar").style.opacity = ok ? "" : ".5";
    const r = $("#reserva-resumen");
    if (r) r.querySelector("span").innerHTML = ok ? `Retiras <strong>${textoReserva()}</strong> en ${esc(dirCorta(local))}` : "Elige el día y la hora para continuar";
  }
  document.addEventListener("click", (e) => {
    const d = e.target.closest("[data-dia]"), h = e.target.closest("[data-hora]"), ir = e.target.closest("[data-modo-ir]");
    if (d) { reservaDia = Number(d.dataset.dia); reserva = null; pintarReserva(); }
    else if (h) { reserva = { dia: reservaDia, hora: h.dataset.hora }; pintarReserva(); }
    else if (ir) { store.modo = ir.dataset.modoIr; renderHeader(); renderCarrito(); vistaCheckout(); }
  });

  function vistaExito() {
    // >>> API: POST /api/pedidos  { local, modo, items: carrito, cliente, pago }  -> { numero, estado, urlPago }
    panelVista = "exito";
    const del = store.modo === "delivery";
    const res = store.modo === "reserva";
    const numero = "B-" + String(Math.floor(1000 + Math.random() * 9000));
    $("#panel-titulo").textContent = res ? "Tu reserva" : "¡Pedido recibido!";
    $("#panel-atras").hidden = true;
    $("#panel-cuerpo").innerHTML = `
      <div class="exito">
        <div class="exito__icono">${ICON.check}</div>
        <h3>${res ? "¡Reserva confirmada!" : "¡Gracias!"}</h3>
        <p>${res
          ? `Tu reserva <strong>${numero}</strong> está pagada. Tu pedido estará listo <strong>${textoReserva()}</strong> en ${esc(dirCorta(local))}. Al llegar, solo da tu número.`
          : `Tu pedido <strong>${numero}</strong> ya está en ${esc(dirCorta(local))}. Te avisaremos por WhatsApp cuando ${del ? "vaya en camino" : "esté listo para retirar"}.`}</p>
        <div class="seguimiento">
          <div class="on"><i></i> ${res ? "Reserva confirmada" : "Pedido recibido"}</div>
          <div><i></i> ${res ? "Lo metemos al horno antes de que llegues" : "En preparación · el horno ya está caliente"}</div>
          <div><i></i> ${del ? "En camino" : "Listo para retirar"}</div>
          <div><i></i> ${del ? "Entregado" : "Retirado"}</div>
        </div>
      </div>`;
    $("#panel-pie").innerHTML = `<a class="btn btn--wsp btn--bloque btn--lg" href="https://wa.me/${local.whatsapp.replace("+", "")}" target="_blank" rel="noopener">${ICON.whatsapp} Escribir al local</a>
      <button class="btn btn--claro btn--bloque" data-cerrar-panel id="nuevo">Volver a la carta</button>`;
    carrito = []; reserva = null; reservaDia = null; guardarCarrito(); renderCarrito(); renderCarta();
    $("#nuevo").addEventListener("click", cerrarPanel);
  }

  $("#panel-atras").addEventListener("click", vistaCarrito);
  $("#btn-carrito").addEventListener("click", () => { abrirPanel(); vistaCarrito(); });
  $("#btn-barra").addEventListener("click", () => { abrirPanel(); vistaCarrito(); });

  // ---------------------------------------------------------------- delivery / retiro y elegir local
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".segmento [data-modo]");
    if (!b) return;
    store.modo = b.dataset.modo;
    renderHeader(); renderBanner(); renderCarrito();
    if (panelVista === "carrito" && $("#panel").classList.contains("abierto")) vistaCarrito();
  });

  function renderListaLocales() {
    $("#ml-lista").innerHTML = D.locales.locales.map((l) => {
      const e = estadoLocal(l);
      const actual = elegido && l.id === local.id;
      const foto = l.id === "oriente" ? "pizza-pollo-bbq" : "pizza-break";
      return `<button class="op-local ${actual ? "activo" : ""}" data-elegir="${l.id}">
        <span class="op-local__ico"><img src="assets/productos/${foto}.webp" alt=""></span>
        <span><strong>${esc(dirCorta(l))}</strong><small>${e.texto}</small><small>Delivery ${l.tiempoDelivery} · Retiro ${l.tiempoRetiro}</small></span>
        ${actual ? `<span class="chip">Actual</span>` : ICON.chevDer.replace("<svg", '<svg width="20" height="20"')}
      </button>`;
    }).join("");
  }
  $("#btn-local").addEventListener("click", () => { renderListaLocales(); abrir("#ov-local"); });
  $("#ml-lista").addEventListener("click", (e) => {
    const b = e.target.closest("[data-elegir]");
    if (!b) return;
    const primeraVez = !elegido;
    if (primeraVez || b.dataset.elegir !== local.id) {
      setLocal(b.dataset.elegir);
      cerrar("#ov-local");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (!primeraVez) toast(`Estás viendo la carta de ${dirCorta(local)}`);
    } else cerrar("#ov-local");
  });

  // ---------------------------------------------------------------- overlays genéricos
  let ultimoFoco = null;
  function abrir(sel) { ultimoFoco = document.activeElement; $(sel).classList.add("abierto"); document.body.style.overflow = "hidden"; setTimeout(() => { const f = $(sel + " [data-cerrar]"); f && f.focus(); }, 50); }
  function cerrar(sel) { if (sel === "#ov-local" && !elegido) return; $(sel).classList.remove("abierto"); document.body.style.overflow = ""; ultimoFoco && ultimoFoco.focus && ultimoFoco.focus(); }
  $$(".overlay").forEach((ov) => {
    ov.addEventListener("click", (e) => { if (e.target === ov || e.target.closest("[data-cerrar]")) cerrar("#" + ov.id); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const ov = $(".overlay.abierto");
    if (ov) cerrar("#" + ov.id); else if ($("#panel").classList.contains("abierto")) cerrarPanel();
  });

  // ---------------------------------------------------------------- búsqueda
  let tBusq;
  $("#buscar").addEventListener("input", (e) => { clearTimeout(tBusq); tBusq = setTimeout(() => { filtro = e.target.value; renderCarta(); }, 150); });

  // ---------------------------------------------------------------- inicio
  function renderTodo() { renderHeader(); renderBanner(); renderCarta(); renderCarrito(); }
  if (elegido) setLocal(local.id);
  else {
    document.body.classList.add("sin-local");
    renderHeader();
    renderListaLocales();
    $("#ml-titulo").textContent = "¿Dónde quieres pedir?";
    abrir("#ov-local");
  }
  if (params.get("producto") && elegido) setTimeout(() => abrirProducto(params.get("producto")), 200);
  if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); t && t.scrollIntoView(); }, 100);
})();
