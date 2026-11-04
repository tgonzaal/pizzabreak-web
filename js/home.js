/* ==========================================================================
   Pizza Break · Home (index.html)
   Flujo: 1) ¿Dónde quieres pedir?  2) carta del local elegido
   ========================================================================== */
(function () {
  "use strict";
  const { ICON, fmt, D, store, estadoLocal } = window.Break;
  const Art = window.BreakArt;
  const $ = (sel) => document.querySelector(sel);

  const todos = (cartaId) => D.cartas[cartaId].categorias.flatMap((c) => c.productos);
  const buscar = (cartaId, id) => todos(cartaId).find((p) => p.id === id);
  const precioDesde = (p) => (p.variantes ? Math.min(...p.variantes.map((v) => v.precio)) : p.precio);

  // Tarjeta compacta de local (estilo fila de tienda en app de delivery)
  const fotoLocal = { mendoza: "assets/productos/pizza-break.webp", oriente: "assets/productos/pizza-pollo-bbq.webp" };
  function tienda(l, productoId) {
    const e = estadoLocal(l);
    const href = `carta.html?local=${l.id}${productoId ? "&producto=" + productoId : ""}`;
    return `
      <a class="tienda" href="${href}" data-local="${l.id}">
        <span class="tienda__img"><img src="${fotoLocal[l.id]}" alt=""></span>
        <span class="tienda__info">
          <span class="tienda__fila"><strong>${l.nombre}</strong><span class="tienda__estado ${e.abierto ? "on" : ""}">${e.abierto ? "Abierto" : "Cerrado"}</span></span>
          <span class="tienda__dir">${l.direccion.replace(", Los Ángeles", "")}</span>
          <span class="tienda__meta"><span>${ICON.moto} ${l.tiempoDelivery}</span><span>${ICON.bolsa} Retiro ${l.tiempoRetiro}</span><span>${ICON.calendario} Reserva</span></span>
        </span>
        <span class="tienda__ir">${ICON.chevDer}</span>
      </a>`;
  }
  const locales = D.locales.locales;
  $("#tiendas").innerHTML = locales.map((l) => tienda(l)).join("");
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-local]"); if (a) store.local = a.dataset.local; });

  // Lo más pedido (con foto, sin precio: el precio depende del local)
  const ids = ["pz-break", "pz-pepperoni", "pz-pollo-bbq", "pz-mechada-tocino", "pz-carnivora", "pz-3-quesos", "pz-camarones", "sw-break"];
  const lista = ids.map((id) => buscar("mendoza", id)).filter(Boolean);
  $("#mas-pedido-lista").innerHTML = lista.map((p) => `
    <button class="plato" data-elegir="${p.id}">
      <span class="plato__img">${Art.product(p)}</span>
      <span class="plato__nombre">${p.nombre}</span>
      <span class="plato__desc">${p.descripcion}</span>
      <span class="plato__pie"><span class="plato__cta">Pedir</span><span class="btn-mas" aria-hidden="true">${ICON.mas}</span></span>
    </button>`).join("");

  const car = $("#mas-pedido-lista");
  document.querySelectorAll("[data-carrusel]").forEach((b) => b.addEventListener("click", () => {
    car.scrollBy({ left: Number(b.dataset.carrusel) * car.clientWidth * 0.8, behavior: "smooth" });
  }));

  // Al tocar un producto: primero elegir local (hoja inferior)
  const ov = $("#ov-local");
  car.addEventListener("click", (e) => {
    const b = e.target.closest("[data-elegir]");
    if (!b) return;
    const p = buscar("mendoza", b.dataset.elegir);
    $("#ol-prod").innerHTML = `<span class="hoja__img">${Art.product(p)}</span><span><strong>${p.nombre}</strong><small>${p.descripcion}</small></span>`;
    $("#ol-tiendas").innerHTML = locales.map((l) => {
      const existe = buscar(l.id, p.id) || (p.id === "pz-camarones" && buscar(l.id, "pz-camaron"));
      return tienda(l, existe ? existe.id : null);
    }).join("");
    ov.classList.add("abierto");
    document.body.style.overflow = "hidden";
  });
  const cerrar = () => { ov.classList.remove("abierto"); document.body.style.overflow = ""; };
  ov.addEventListener("click", (e) => { if (e.target === ov || e.target.closest("[data-cerrar]")) cerrar(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrar(); });

  // Cafeterías
  $("#cafeterias").innerHTML = D.locales.cafeterias.map((c) => `
    <li>${c.nombre} · ${c.direccion.replace(", Los Ángeles", "")}</li>`).join("");
})();
