/***********************
  VARIABLES Y CARGA
***********************/
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let pedidosPendientes = JSON.parse(localStorage.getItem("pedidosPendientes")) || [];
let indice = 0;

const carrusel = document.getElementById("carrusel");
const totalSpan = document.getElementById("total-precio");
const contador = document.querySelector(".carrito-contador");
const productosDiv = document.querySelector(".carrito-productos");
const envioCheckbox = document.getElementById("envioCheckbox");
const ubicacionInput = document.getElementById("ubicacion");
const panelAdmin = document.getElementById("panel-admin");
const modoBtn = document.getElementById("modoOscuroBtn");
const fondoColorInput = document.getElementById("fondoColor");

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
    } catch (e) { console.error("Error cargando productos:", e); }
}

/***********************
  PERSONALIZACIÓN (MODO OSCURO Y COLOR)
***********************/
// Modo Oscuro
if (localStorage.getItem("modo") === "oscuro") {
    document.body.classList.add("oscuro");
    modoBtn.textContent = "☀️";
}

modoBtn.onclick = () => {
    document.body.classList.toggle("oscuro");
    const esOscuro = document.body.classList.contains("oscuro");
    localStorage.setItem("modo", esOscuro ? "oscuro" : "claro");
    modoBtn.textContent = esOscuro ? "☀️" : "🌙";
};

// Selector de Color de Fondo
const colorGuardado = localStorage.getItem('colorFondo');
if (colorGuardado) {
    document.body.style.backgroundColor = colorGuardado;
    fondoColorInput.value = colorGuardado;
}

fondoColorInput.addEventListener('input', (e) => {
    const nuevoColor = e.target.value;
    document.body.style.backgroundColor = nuevoColor;
    localStorage.setItem('colorFondo', nuevoColor);
});

/***********************
  CARRUSEL (ESTABLE)
***********************/
function renderProductos() {
    if (!carrusel) return;
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
    moverCarrusel();
}

function moverCarrusel() {
    const anchoTarjetaTotal = 270; // 250px + 20px gap
    carrusel.style.transform = `translateX(-${indice * anchoTarjetaTotal}px)`;
}

document.getElementById("next").onclick = () => {
    if (indice < productos.length - 1) {
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
  CARRITO Y STORAGE
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
  ADMINISTRACIÓN
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
    if (!panelAdmin) return;
    panelAdmin.innerHTML = "<h3>Pedidos Pendientes</h3>";
    pedidosPendientes.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("pedido-pendiente");
        div.innerHTML = `
            <p><strong>${p.nombre}</strong> - $${p.total}</p>
            <button onclick="confirmarPedido(${p.id})">✅ Completar</button>
            <button onclick="cancelarPedido(${p.id})">❌ Rechazar (Devuelve Stock)</button>
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

// ATAJO ADMIN
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyA") {
        if (prompt("Clave:") === "181222") {
            panelAdmin.classList.toggle("mostrar");
        }
    }
});

/***********************
  UI FINAL
***********************/
setInterval(() => { 
    const r = document.getElementById("reloj");
    if(r) r.innerText = new Date().toLocaleTimeString(); 
}, 1000);

document.querySelector(".carrito-btn").onclick = () => {
    document.querySelector(".carrito-panel").classList.toggle("oculto");
};

envioCheckbox.onchange = () => {
    ubicacionInput.disabled = !envioCheckbox.checked;
    actualizarCarrito();
};

cargarProductos();

function crearFondoEmojis() {
    const contenedor = document.getElementById("fondo-emojis");
    const emojis = ["🍎", "🥗", "🍱", "🍗", "🥑", "🥩", "🍲", "🥘", "🥦", "🍎", "🍝"];
    const cantidad = 200; // Ajusta cuánta comida quieres ver

    for (let i = 0; i < cantidad; i++) {
        const span = document.createElement("span");
        span.classList.add("emoji-flotante");
        span.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        
        // Posiciones aleatorias
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Rotación aleatoria para que no se vea tan simétrico
        const rotacion = Math.random() * 360;

        span.style.left = `${x}vw`;
        span.style.top = `${y}vh`;
        span.style.transform = `rotate(${rotacion}deg)`;
        
        contenedor.appendChild(span);
    }
}

// Llamar a la función al iniciar
crearFondoEmojis();