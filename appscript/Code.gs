/**
 * Pizza Break · Web App de Apps Script
 *
 * Sirve el sitio que está publicado en GitHub Pages, para poder insertarlo en Google Sites.
 * Las páginas, fotos, CSS y JS se leen desde GitHub: si subes cambios a GitHub,
 * se ven aquí sin tocar este archivo.
 *
 * Única configuración: cambia BASE por la dirección de tu GitHub Pages (con / al final).
 */
var BASE = 'https://TU-USUARIO.github.io/pizzabreak-web/';

function doGet(e) {
  var params = (e && e.parameter) || {};
  var pagina = params.p === 'carta' ? 'carta' : 'index';
  var html = UrlFetchApp.fetch(BASE + pagina + '.html').getContentText('UTF-8');
  var app = ScriptApp.getService().getUrl();

  return HtmlService.createHtmlOutput(armarPagina(html, BASE, app, params))
    .setTitle(pagina === 'carta' ? 'Carta · Pizza Break' : 'Pizza Break · Más que pizza · Los Ángeles')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // necesario para Google Sites
}

/**
 * Ajusta el HTML para que funcione dentro del iframe de Apps Script:
 * - <base href> apunta a GitHub Pages, así cargan fotos, CSS y JS.
 * - window.__QS le pasa a la carta el ?local= (el iframe no recibe la query original).
 * - Los enlaces entre páginas (index.html / carta.html) vuelven a pasar por esta web app.
 * - Los enlaces a secciones (#nosotros) hacen scroll dentro de la misma página.
 */
function armarPagina(html, base, app, params) {
  var qs = Object.keys(params)
    .filter(function (k) { return k !== 'p'; })
    .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
    .join('&');

  var inyectar =
    '<base href="' + base + '">' +
    '<script>' +
    'window.__QS=' + JSON.stringify(qs) + ';' +
    'window.__APP=' + JSON.stringify(app) + ';' +
    '(' + enlaces.toString() + ')(window.__APP);' +
    '</script>';

  return html.replace(/<head>/i, '<head>' + inyectar);
}

// Se ejecuta en el navegador (se inserta como texto en la página)
function enlaces(APP) {
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href');
    if (h.charAt(0) === '#') {
      // Con <base href> el enlace iría a GitHub; cambiar el hash da el mismo salto que un enlace normal
      ev.preventDefault();
      if (location.hash === h) { var t = document.getElementById(h.slice(1)); if (t) t.scrollIntoView(); }
      else location.hash = h;
      return;
    }
    var m = h.match(/^(index|carta)\.html(?:\?([^#]*))?(?:#.*)?$/);
    if (m) {
      a.href = APP + '?p=' + m[1] + (m[2] ? '&' + m[2] : '');
      a.target = '_top';
    } else if (!a.target) {
      a.target = '_top'; // tel:, mailto:, etc.
    }
  }, true);
}
