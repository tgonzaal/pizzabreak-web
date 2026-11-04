# Pizza Break: diseño del nuevo sitio (HTML/CSS/JS)

Prototipo **solo de diseño e interacción**, con estilo de app de pedidos (tipo PedidosYa).

## Flujo

1. **Portada**: "¿Dónde quieres pedir?", con dos tarjetas compactas (Mendoza / Av. Oriente). En el celular las dos caben en la primera pantalla.
2. **Carta del local** elegido (`carta.html?local=...`): destacados, categorías y productos con foto.
3. En el carrito se elige **una sola vez** el tipo de pedido:
   - **Delivery**: a domicilio.
   - **Retiro**: lo antes posible.
   - **Reservar**: retiro programado. El cliente elige el día (hoy o mañana) y la hora, en bloques de 30 minutos, con al menos 60 minutos de anticipación y dentro del horario del local. Paga en el momento y el pedido está listo cuando llega.
4. **Checkout** (simulado).

`carta.html` **sin** `?local=` no supone ningún local: antes de mostrar la carta abre "¿Dónde quieres pedir?".

Si en la portada se toca un plato de "Lo más pedido", primero se pregunta desde qué local y después se abre ese producto en la carta.

No hay backend ni medios de pago integrados. Todo funciona en el navegador para que se pueda revisar la experiencia completa: elegir local, armar el pedido, ver el carrito y el checkout.

## Cómo abrirlo

- Doble clic en `index.html` (funciona sin servidor), o
- servir la carpeta: `python3 -m http.server 8000` y abrir http://localhost:8000

## Publicarlo: GitHub Pages + Apps Script + Google Sites

El sitio vive en **GitHub Pages**. La web app de **Apps Script** (`appscript/Code.gs`) lo lee desde ahí y lo sirve, y esa web app se inserta en **Google Sites**. Si subes cambios a GitHub, se ven en Apps Script y en Sites sin tocar nada más.

**1. GitHub Pages**
1. En github.com, crea un repositorio **público** llamado `pizzabreak-web`.
2. Sube esta carpeta, por ejemplo:
   ```bash
   git remote add origin https://github.com/TU-USUARIO/pizzabreak-web.git
   git push -u origin main
   ```
3. En el repo ve a **Settings → Pages → Branch: `main` / `(root)` → Save**.
4. En 1 o 2 minutos el sitio queda en `https://TU-USUARIO.github.io/pizzabreak-web/`. Este link ya sirve para probar el responsive en el celular.

**2. Apps Script**
1. Entra a script.google.com y crea un **Proyecto nuevo**.
2. Pega el contenido de `appscript/Code.gs` en `Código.gs`.
3. Cambia `BASE` por tu link de GitHub Pages (con `/` al final).
4. Ve a **Implementar → Nueva implementación → tipo Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
5. Autoriza el permiso para "conectarse a un servicio externo", que se usa para leer GitHub.
6. Copia la URL que termina en `/exec`.

**3. Google Sites**
1. En tu sitio de Google Sites, usa **Insertar → Incorporar → Por URL** y pega la URL `/exec`.
2. Elige **Página completa** y ajusta el alto del recuadro.

Notas:
- Google Sites muestra la web app dentro de un recuadro de alto fijo. Para ver el responsive real en el celular, abre directamente la URL `/exec` o el link de GitHub Pages.
- Al pasar de la portada a la carta (o al revés), la navegación sale de Sites y abre la web app a pantalla completa. Es una restricción de Apps Script.
- Si cambias `Code.gs`, ve a **Implementar → Gestionar implementaciones → editar → Versión nueva**. Si solo cambias el sitio en GitHub, no tienes que hacer nada.

## Estructura

```
index.html                 Portada: hero, elegir local, categorías, promos, favoritas, nosotros, servicios, contacto
carta.html                 Carta + pedido (estilo app de delivery). ?local=mendoza | ?local=oriente
css/styles.css             Todos los estilos. Variables de diseño en :root (colores, tipografías, radios)
js/data.js                 Copia de /data/*.json como variable global (solo para abrir sin servidor)
js/illustrations.js        Ilustraciones SVG de productos (placeholder hasta tener fotos)
js/common.js               Íconos, formato CLP, local elegido, horario abierto/cerrado, toast
js/home.js                 Pinta las secciones dinámicas de la portada
js/carta.js                Carta, modal de producto, carrito, checkout (marcas ">>> API")
appscript/Code.gs          Web app de Apps Script que sirve el sitio desde GitHub Pages (para Google Sites)
data/locales.json          Locales, horarios, teléfonos, cafeterías, redes
data/carta-mendoza.json    Carta completa Mendoza 109
data/carta-oriente.json    Carta completa Resto Break Av. Oriente 1290
assets/                    Logo Break en SVG (rojo y blanco)
assets/productos/          Fotos de producto en WebP (fondo transparente, ~900 px)
```

## Modelo de datos (JSON)

Cada carta tiene `categorias[]`, y cada categoría tiene `productos[]`:

```json
{
  "id": "pz-break",
  "nombre": "Break",
  "descripcion": "Carne, Jamón, Queso, Tomate, Salame",
  "precio": null,                      // precio fijo si no hay variantes
  "variantes": [                       // tamaño / proteína; el cliente elige 1
    { "id": "familiar", "nombre": "Familiar", "detalle": "30–35 cm", "precio": 12990 },
    { "id": "xl", "nombre": "XL", "detalle": "40–45 cm", "precio": 15990 }
  ],
  "opciones": ["base-pizza", "agregados-pizza"],   // ids de gruposOpciones
  "tags": ["La más pedida"],
  "destacado": true,                   // aparece en "Destacados"
  "imagen": null,                      // URL de la foto. Si existe, reemplaza la ilustración
  "ilustracion": "pizza",              // pizza | burger | sandwich | burrito | taco | fries | quesadilla | bowl | nuggets | combo | can | bottle | juice | mocktail | cocktail | beer | coffee | breakfast
  "toppings": ["Carne", "Jamón", "Queso", "Tomate", "Salame"]  // solo para dibujar la pizza
}
```

`gruposOpciones[]` define los agregados, salsas, pan, etc.:

- `tipo`: `unica` (radio), `multiple` (checkbox) o `cantidad` (contador, se usa en el bowl).
- `min` / `max`: reglas de selección. Si `min > 0`, el botón "Agregar" queda deshabilitado hasta cumplirlas.
- `items[]`: `{ id, nombre, precio }`.
- `eligePizza: true`: el grupo se arma con el **banco de pizzas del local**. Cada ítem trae `id` de la pizza, `detalle` (ingredientes) e `imagen`. Se usa en las promos "pizza a elección" (Combo Familiar, 2 Pizzas Familiares/XL, Mini Pizza + vaso). La ficha muestra las pizzas que va eligiendo el cliente.

**Precios en CLP, enteros, IVA incluido.** Se formatean con `toLocaleString("es-CL")`.

## Puntos de integración (buscar `>>> API` en `js/carta.js`)

1. **Carta por local**: `GET /api/locales/{id}/carta`, que debe devolver el mismo formato que `data/carta-*.json`. Hoy se lee de `window.BREAK_DATA`.
2. **Crear pedido**: `POST /api/pedidos` con `{ local, modo, items, cliente, pago }`. Cada ítem del carrito ya trae `productoId`, `varianteId`, opciones elegidas, nota, precio unitario y cantidad.
3. **Pago**: el único medio es **tarjeta de débito o crédito, vía Mercado Pago** (todavía no confirmado). No se acepta efectivo, transferencia ni Junaeb. Los botones "Confirmar y pagar" / "Reservar y pagar" muestran hoy la pantalla de éxito; en producción deben abrir el checkout de Mercado Pago.
   - En una reserva, el pedido debe incluir `reserva: { fecha, hora }`. El servidor tiene que validar que el horario siga disponible. La configuración (`anticipacionMin`, `intervaloMin`, `dias`) está en `locales.json → reserva`.
4. **Carrito**: se guarda en `localStorage` (`break.carrito.{local}`). En producción, guardarlo en sesión o en el servidor.
5. **Abierto/cerrado**: se calcula con el horario de `locales.json` y la hora del navegador. Conviene que lo entregue el servidor (feriados, cierres especiales).

**Importante: el total que muestra el front es solo referencial. El precio final siempre debe recalcularse en el servidor.**

## Valores de ejemplo que hay que confirmar

Estos datos **no estaban en la web actual** y se pusieron como ejemplo:

- Costo de delivery (`costoDelivery: 2000`) y tiempos (`35–45 min` delivery, `20 min` retiro).
- Opciones de verduras del **Bowl** (la carta solo dice "100 g de verduras").
- Proveedor de pago (Mercado Pago, todavía no confirmado).
- Reglas de la reserva: 60 minutos de anticipación mínima, bloques de 30 minutos, hasta mañana. Falta definir si se limita la cantidad de reservas por bloque.
- Se quitó de la carta online la promo "Fajita Junaeb", porque solo se pagaba con beca Junaeb.
- Sabores de bebida en las promos (Coca-Cola, Coca-Cola Sin Azúcar, Fanta, Sprite).
- En las promos de 2 pizzas se puede elegir **cualquier** pizza (clásica o de la casa) sin recargo. Hay que confirmar si las de la casa tienen diferencia de precio.
- Cocktails y cervezas de Av. Oriente marcados `+18` y "Solo consumo en local".

Los productos y precios se transcribieron de las cartas publicadas hoy en pizzabreak.cl (carta.asp y cartave.asp). Conviene que el local los revise.

## Diseño

- **Colores**: rojo de marca `#ea3237`, crema/papel `#fbf4e8`, pizarra `#1c1916`, amarillo de la carta `#f6b52b`.
- **Tipografías** (Google Fonts): *Anton* para los títulos (como la carta impresa), *Poppins* para el texto y *Kaushan Script* para los acentos ("más que pizza").
- **Detalles de pizzería tradicional**: franja de mantel cuadrillé, fondo pizarra con dibujos de ingredientes, sello "Masa artesanal" y cinta "Desde 2011".
- **Header rojo con logo blanco** en todas las páginas.
- **Responsive**: escritorio con 3 columnas (categorías, productos, carrito), tablet y móvil con chips de categorías fijos arriba, barra flotante "Ver mi pedido" y ficha de producto como hoja inferior.
- **Accesibilidad**: foco visible, roles `dialog`, cierre con Escape y `prefers-reduced-motion`.

### Fotos

- Hay 30 fotos en `assets/productos/`: 23 pizzas, combos y 3 sándwiches. Están asignadas en el campo `imagen` del JSON.
- Los productos **sin foto** muestran una ilustración SVG provisoria (`ilustracion`).
- Para agregar una foto: un PNG o WebP con fondo transparente, de unos 900 px de ancho, en `assets/productos/`. Luego se completa `imagen` en el JSON del local.
- Faltan fotos de: pizza Margarita, burgers, la mayoría de los sándwiches, mexicanos, para compartir, bebidas y cafetería.
