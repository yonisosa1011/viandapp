/***********************
 /***********************
 VARIABLES Y CARGA
***********************/
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let pedidosPendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
let indice = 0;

const carrusel = document.getElementById("carrusel");
const viewport = document.querySelector(".carrusel-viewport");
const totalSpan = document.getElementById("total-precio");
const contador = document.querySelector(".carrito-contador");
const productosDiv = document.querySelector(".carrito-productos");
const envioCheckbox = document.getElementById("envioCheckbox");
const ubicacionInput = document.getElementById("ubicacion");
const panelAdmin = document.getElementById("panel-admin");
const modoBtn = document.getElementById("modoOscuroBtn");
const fondoColorInput = document.getElementById("fondoColor");

/***********************
  CARGA DE PRODUCTOS
***********************/
async function cargarProductos() {
    try {
        const res = await fetch("productos.json");
        const data = await res.json();
        const stockLocal = JSON.parse(localStorage.getItem("stockProductos")) || [];

        productos = data.map(pj => {
            const guardado = stockLocal.find(s => s.id === pj.id);
            return { ...pj, stock: guardado ? guardado.stock : pj.stock };
        });

        renderProductos();
        actualizarCarrito();
        renderPanelAdmin();
    } catch (e) {
        console.error("Error cargando productos:", e);
    }
}

/***********************
  CARRUSEL (CORREGIDO)
***********************/
function renderProductos() {
    carrusel.innerHTML = "";

    productos.forEach(prod => {
        const div = document.createElement("div");
        div.classList.add("producto");
        div.innerHTML = `
            <img src="${prod.imagen}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${prod.nombre}</h3>
            <p>$${prod.precio}</p>
            <p class="stock">Stock: ${prod.stock}</p>
            <button onclick="agregarAlCarrito(${prod.id})" ${prod.stock <= 0 ? "disabled" : ""}>
                ${prod.stock <= 0 ? "Sin stock" : "Agregar"}
            </button>
        `;
        carrusel.appendChild(div);
    });

    indice = 0;
    moverCarrusel();
}

function getAnchoTarjeta() {
    const tarjeta = carrusel.querySelector(".producto");
    if (!tarjeta) return 0;
    const gap = 20; // el mismo gap del CSS
    return tarjeta.offsetWidth + gap;
}

function getTarjetasVisibles() {
    return Math.floor(viewport.offsetWidth / getAnchoTarjeta());
}

function moverCarrusel() {
    const ancho = getAnchoTarjeta();
    carrusel.style.transform = `translateX(-${indice * ancho}px)`;
}

document.getElementById("next").onclick = () => {
    const total = productos.length;
    const visibles = getTarjetasVisibles();
    const maxIndice = total - visibles;

    if (indice < maxIndice) {
        indice++;
        moverCarrusel();
    }
};

document.getElementById("prev").onclick = () => {
    if (indice > 0) {
        indice--;
        moverCarrusel();
    }
};

/***********************
  CARRITO
***********************/
function agregarAlCarrito(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod || prod.stock <= 0) return;

    prod.stock--;
    const item = carrito.find(c => c.id === id);
    if (item) item.cantidad++;
    else carrito.push({ ...prod, cantidad: 1 });

    actualizarTodo();
}

function eliminarDelCarrito(id) {
    const idx = carrito.findIndex(c => c.id === id);
    if (idx === -1) return;

    const prod = productos.find(p => p.id === id);
    if (prod) prod.stock += carrito[idx].cantidad;

    carrito.splice(idx, 1);
    actualizarTodo();
}

function actualizarTodo() {
    localStorage.setItem("stockProductos", JSON.stringify(productos));
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderProductos();
    actualizarCarrito();
}

function actualizarCarrito() {
    productosDiv.innerHTML = "";
    let total = 0;
    let cant = 0;

    carrito.forEach(i => {
        total += i.precio * i.cantidad;
        cant += i.cantidad;
        const p = document.createElement("p");
        p.innerHTML = `<span>${i.nombre} x${i.cantidad}</span> <button onclick="eliminarDelCarrito(${i.id})">🗑️</button>`;
        productosDiv.appendChild(p);
    });

    if (envioCheckbox.checked) total += 1000;
    totalSpan.innerText = total;
    contador.innerText = cant;
    contador.style.display = cant > 0 ? "block" : "none";
}

/***********************
  ADMIN
***********************/
document.getElementById("formPedido").onsubmit = (e) => {
    e.preventDefault();
    if (carrito.length === 0) return;

    const pedido = {
        id: Date.now(),
        nombre: document.getElementById("nombre").value,
        items: [...carrito],
        total: totalSpan.innerText
    };

    pedidosPendientes.push(pedido);
    localStorage.setItem("pedidosPendientes", JSON.stringify(pedidosPendientes));
    window.open(`https://wa.me/5493765213556?text=Pedido de ${pedido.nombre}`, "_blank");

    carrito = [];
    actualizarTodo();
    renderPanelAdmin();
};

function renderPanelAdmin() {
    panelAdmin.innerHTML = "<h3>Pedidos Pendientes</h3>";
    pedidosPendientes.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("pedido-pendiente");
        div.innerHTML = `
            <p><strong>${p.nombre}</strong> - $${p.total}</p>
            <button onclick="confirmarPedido(${p.id})">✅ Completar</button>
            <button onclick="cancelarPedido(${p.id})">❌ Rechazar</button>
        `;
        panelAdmin.appendChild(div);
    });
}

function confirmarPedido(id) {
    pedidosPendientes = pedidosPendientes.filter(p => p.id !== id);
    localStorage.setItem("pedidosPendientes", JSON.stringify(pedidosPendientes));
    renderPanelAdmin();
}

function cancelarPedido(id) {
    const pedido = pedidosPendientes.find(p => p.id === id);
    if (pedido) {
        pedido.items.forEach(item => {
            const prod = productos.find(pr => pr.id === item.id);
            if (prod) prod.stock += item.cantidad;
        });
    }

    pedidosPendientes = pedidosPendientes.filter(p => p.id !== id);
    localStorage.setItem("pedidosPendientes", JSON.stringify(pedidosPendientes));
    actualizarTodo();
    renderPanelAdmin();
}

/***********************
  UI
***********************/
setInterval(() => {
    const r = document.getElementById("reloj");
    if (r) r.innerText = new Date().toLocaleTimeString();
}, 1000);

document.querySelector(".carrito-btn").onclick = () => {
    document.querySelector(".carrito-panel").classList.toggle("oculto");
};

envioCheckbox.onchange = () => {
    ubicacionInput.disabled = !envioCheckbox.checked;
    actualizarCarrito();
};

cargarProductos();

/***********************
  FONDO EMOJIS
***********************/
function crearFondoEmojis() {
    const contenedor = document.getElementById("fondo-emojis");
    const emojis = ["🍎", "🥗", "🍱", "🍗", "🥑", "🥩", "🍲", "🥘", "🥦", "🍝"];

    for (let i = 0; i < 150; i++) {
        const span = document.createElement("span");
        span.classList.add("emoji-flotante");
        span.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        span.style.left = `${Math.random() * 100}vw`;
        span.style.top = `${Math.random() * 100}vh`;
        span.style.transform = `rotate(${Math.random() * 360}deg)`;
        contenedor.appendChild(span);
    }
}

crearFondoEmojis();

// === MODO OSCURO ===
if (localStorage.getItem("modo") === "oscuro") {
    document.body.classList.add("oscuro");
    modoBtn.textContent = "☀️";
}

modoBtn.addEventListener("click", () => {
    document.body.classList.toggle("oscuro");
    const esOscuro = document.body.classList.contains("oscuro");
    localStorage.setItem("modo", esOscuro ? "oscuro" : "claro");
    modoBtn.textContent = esOscuro ? "☀️" : "🌙";
});


// === COLOR DE FONDO ===
const colorGuardado = localStorage.getItem("colorFondo");

if (colorGuardado) {
    document.body.style.backgroundColor = colorGuardado;
    fondoColorInput.value = colorGuardado;
}

fondoColorInput.addEventListener("input", (e) => {
    const nuevoColor = e.target.value;
    document.body.style.backgroundColor = nuevoColor;
    localStorage.setItem("colorFondo", nuevoColor);
});

// === ATAJO ADMIN (CORREGIDO) ===
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyA") {
        e.preventDefault();

        const clave = prompt("Clave:");
        if (clave === "181222") {
            panelAdmin.classList.remove("oculto");
            panelAdmin.classList.toggle("mostrar");
        }
    }
});
document.getElementById("formPedido").onsubmit = (e) => {
    e.preventDefault();
    if (carrito.length === 0) return;

    const nombre = document.getElementById("nombre").value.trim();
    const envio = envioCheckbox.checked;
    const ubicacion = ubicacionInput.value.trim();

    let mensaje = ` *Nuevo pedido *%0A%0A`;
    mensaje += ` *Cliente:* ${nombre}%0A%0A`;
    mensaje += ` *Productos:*%0A`;

    carrito.forEach(item => {
        mensaje += `• ${item.nombre} x${item.cantidad} — $${item.precio * item.cantidad}%0A`;
    });

    mensaje += `%0A *Total:* $${totalSpan.innerText}%0A`;

    if (envio) {
        mensaje += ` *Envío a domicilio:* Sí (+$1000)%0A`;
        if (ubicacion) {
            mensaje += `*Ubicación:* ${ubicacion}%0A`;
        }
    } else {
        mensaje += ` *Retiro en local*%0A`;
    }

    const url = `https://wa.me/5493764624509?text=${mensaje}`;
    window.open(url, "_blank");

    // Guardar pedido en admin
    const pedido = {
        id: Date.now(),
        nombre,
        items: [...carrito],
        total: totalSpan.innerText
    };

    pedidosPendientes.push(pedido);
    localStorage.setItem("pedidosPendientes", JSON.stringify(pedidosPendientes));

    carrito = [];
    actualizarTodo();
    renderPanelAdmin();
};

function actualizarReloj() {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');

  document.getElementById("reloj").innerHTML = `⏰ ${horas}:${minutos}:${segundos}`;
}

setInterval(actualizarReloj, 1000);
actualizarReloj();
