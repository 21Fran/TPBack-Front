const categoryButtons = document.querySelectorAll('.categories-bar button, .categories button');
const productGrid = document.getElementById('product-grid');
const categoryTitle = document.getElementById('category-title');
const productCount = document.getElementById('product-count');
const userGreeting = document.getElementById('user-greeting');
const addressInput = document.getElementById('delivery-address');
const historyList = document.getElementById('purchase-history-list');
const historyEmpty = document.getElementById('purchase-history-empty');
const API_BASE_URL = (() => {
  if (window.location.protocol === 'file:') {
    return 'http://localhost:3000';
  }

  if (window.location.port === '3000') {
    return window.location.origin;
  }

  return `${window.location.protocol}//${window.location.hostname}:3000`;
})();
let loggedUser = null;
const productsById = new Map();
const CART_STORAGE_PREFIX = 'cart_user_';
const LEGACY_CART_KEY = 'cart';
const GUEST_CART_KEY = 'cart_guest';

let cart = [];

function getCartStorageKey() {
  if (loggedUser && loggedUser.id !== undefined && loggedUser.id !== null) {
    return `${CART_STORAGE_PREFIX}${loggedUser.id}`;
  }

  return GUEST_CART_KEY;
}

function loadCartFromStorage() {
  // Remove old shared cart key to avoid mixing carts across users.
  if (localStorage.getItem(LEGACY_CART_KEY) !== null) {
    localStorage.removeItem(LEGACY_CART_KEY);
  }

  try {
    const storedCart = JSON.parse(localStorage.getItem(getCartStorageKey()) || '[]');
    cart = Array.isArray(storedCart) ? storedCart : [];
  } catch (error) {
    cart = [];
  }

  updateCartCount();
  renderCart();
}

function getLoggedUser() {
  const rawUser = sessionStorage.getItem('usuario');
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    return null;
  }
}

function loadLoggedUserName() {
  if (!userGreeting) {
    return;
  }

  loggedUser = getLoggedUser();

  if (!loggedUser) {
    userGreeting.textContent = 'Hola, invitado';
    return;
  }

  userGreeting.textContent = `Hola, ${loggedUser.nombre || 'invitado'}`;
}

function filterCategory(category, btn) {
  categoryButtons.forEach(b => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  }

  const allProducts = productGrid.querySelectorAll('.product-card');
  let visibleCount = 0;

  allProducts.forEach(p => {
    if (category === 'todos' || p.dataset.category === category) {
      p.style.display = 'block';
      visibleCount++;
    } else {
      p.style.display = 'none';
    }
  });

  categoryTitle.textContent = btn ? btn.textContent : 'Todos los productos';
  productCount.textContent = visibleCount + ' productos encontrados';
}

function logout() {
  sessionStorage.removeItem('usuario');
  window.location.href = '../index.html';
}

// Buscador
document.getElementById('search').addEventListener('input', function() {
  const term = this.value.toLowerCase();
  const allProducts = productGrid.querySelectorAll('.product-card');
  let visibleCount = 0;

  allProducts.forEach(p => {
    if (p.dataset.name.toLowerCase().includes(term)) {
      p.style.display = 'block';
      visibleCount++;
    } else {
      p.style.display = 'none';
    }
  });

  productCount.textContent = visibleCount + ' productos encontrados';
});

function saveCart() {
  localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
}

function clearCart() {
  const currentKey = getCartStorageKey();

  cart = [];
  localStorage.removeItem(currentKey);
  localStorage.removeItem(LEGACY_CART_KEY);
  localStorage.removeItem(GUEST_CART_KEY);
  localStorage.setItem(currentKey, '[]');

  updateCartCount();
  renderCart();

  const cartTotal = document.getElementById('cart-total');
  if (cartTotal) {
    cartTotal.textContent = 'Total: $0.00';
  }
}

function updateCartCount() {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  document.getElementById('cart-count').textContent = totalItems;
}

function toggleCart() {
  const cartEl = document.getElementById('cart');
  cartEl.style.display = cartEl.style.display === 'none' ? 'block' : 'none';
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  cartItems.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.style.marginBottom = '0.5rem';
    li.innerHTML = `
      ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}
      <button onclick="removeFromCart(${index})" style="margin-left:0.5rem;">X</button>
    `;
    cartItems.appendChild(li);

    total += item.price * item.quantity;
  });

  document.getElementById('cart-total').textContent = 'Total: $' + total.toFixed(2);
}

function addToCart(id, name, price) {
  const existingProduct = cart.find(item => item.id === id);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }

  saveCart();
  updateCartCount();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartCount();
  renderCart();
}

async function checkout() {
  if (cart.length === 0) {
    alert('El carrito está vacío.');
    return;
  }

  if (!loggedUser) {
    alert('Debes iniciar sesión para comprar.');
    window.location.href = '../index.html';
    return;
  }

  const direccion = addressInput?.value.trim();
  if (!direccion) {
    alert('Ingresa una dirección de entrega.');
    return;
  }

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const productos = cart.flatMap(item => Array(item.quantity).fill(item.id));

  try {
    const response = await fetch(`${API_BASE_URL}/ventas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_usuario: loggedUser.id,
        fecha: new Date().toISOString().slice(0, 10),
        total,
        dirección: direccion,
        productos
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'No se pudo generar la compra.');
      return;
    }

    clearCart();

    if (addressInput) {
      addressInput.value = '';
    }

    alert(`Compra realizada con éxito. Orden #${data.venta.id}`);
    loadPurchaseHistory();
  } catch (error) {
    alert('No se pudo conectar con el servidor para procesar la compra.');
  }
}

// Inicializar contador
updateCartCount();


//Creacion desde json
document.addEventListener("DOMContentLoaded", () => {
  loadLoggedUserName();
  loadCartFromStorage();

  fetch(`${API_BASE_URL}/productos`)
    .then(res => res.json())
    .then((productosData) => {
      buildProductMap(productosData);
      mostrarProductos(productosData);
      loadPurchaseHistory();
    })
    .catch(err => console.error("Error cargando productos:", err));

});

function buildProductMap(productData) {
  productsById.clear();

  for (const categoria in productData) {
    productData[categoria].forEach((product) => {
      productsById.set(Number(product.id), product.nombre);
    });
  }
}

function formatProductsSummary(productIds) {
  const countByProduct = new Map();

  productIds.forEach((id) => {
    const numericId = Number(id);
    countByProduct.set(numericId, (countByProduct.get(numericId) || 0) + 1);
  });

  return Array.from(countByProduct.entries())
    .map(([id, qty]) => {
      const productName = productsById.get(id) || `Producto #${id}`;
      return `${productName} x${qty}`;
    })
    .join(' | ');
}

async function loadPurchaseHistory() {
  if (!historyList || !historyEmpty) {
    return;
  }

  if (!loggedUser) {
    historyList.innerHTML = '';
    historyEmpty.textContent = 'Inicia sesión para ver tu historial.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ventas`);
    const sales = await response.json();

    if (!response.ok) {
      historyEmpty.textContent = 'No se pudo cargar el historial.';
      return;
    }

    const userSales = sales
      .filter(sale => Number(sale.id_usuario) === Number(loggedUser.id))
      .sort((a, b) => Number(b.id) - Number(a.id));

    if (userSales.length === 0) {
      historyList.innerHTML = '';
      historyEmpty.textContent = 'Todavía no tienes compras registradas.';
      return;
    }

    historyEmpty.textContent = '';
    historyList.innerHTML = '';

    userSales.forEach((sale) => {
      const li = document.createElement('li');
      li.className = 'history-item';

      const productsText = formatProductsSummary(Array.isArray(sale.productos) ? sale.productos : []);
      li.innerHTML = `
        <div class="history-row">
          <strong>Orden #${sale.id}</strong>
          <span>${sale.fecha}</span>
        </div>
        <div class="history-row">
          <span>Total: $${Number(sale.total).toFixed(2)}</span>
          <span>${sale.dirección || ''}</span>
        </div>
        <p class="history-products">${productsText || 'Sin detalle de productos'}</p>
      `;

      historyList.appendChild(li);
    });
  } catch (error) {
    historyEmpty.textContent = 'No se pudo cargar el historial.';
  }
}

function mostrarProductos(data) {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = ""; // limpiar

  for (const categoria in data) {
    data[categoria].forEach(prod => {
      const card = document.createElement("div");
      card.classList.add("product-card");

      //Busqueda 
      card.dataset.name = prod.nombre.toLowerCase();
      card.dataset.category = categoria.toLowerCase();

      card.innerHTML = `
        <div class="product-placeholder">
          <img src="${prod.imagen}" alt="${prod.nombre}">
        </div>
        <h4>${prod.nombre}</h4>
        <div class="flex">${prod.desc}</div>
        <div class="flex">${prod.en_oferta ? 'En oferta' : 'Precio regular'}</div>
        <div class="flex justify-between">
          <span>$${prod.precio}</span>
          <button class="button-sm" onclick="addToCart(${prod.id}, '${prod.nombre}', ${prod.precio})">Agregar</button>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  actualizarContadorProductos();
}

function actualizarContadorProductos() {
  const total = document.querySelectorAll(".product-card").length;
  document.getElementById("product-count").textContent = `${total} productos encontrados`;
}
