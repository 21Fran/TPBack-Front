const categoryButtons = document.querySelectorAll('.categories-bar button, .categories button');
const productGrid = document.getElementById('product-grid');
const categoryTitle = document.getElementById('category-title');
const productCount = document.getElementById('product-count');
const userGreeting = document.getElementById('user-greeting');

function loadLoggedUserName() {
  if (!userGreeting) {
    return;
  }

  const rawUser = sessionStorage.getItem('usuario');
  if (!rawUser) {
    userGreeting.textContent = 'Hola, invitado';
    return;
  }

  try {
    const user = JSON.parse(rawUser);
    userGreeting.textContent = `Hola, ${user.nombre || 'invitado'}`;
  } catch (error) {
    userGreeting.textContent = 'Hola, invitado';
  }
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

// Carrito con localStorage
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function updateCartCount() {
  document.getElementById('cart-count').textContent = cart.length;
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
      ${item.name} - ${item.price} 
      <button onclick="removeFromCart(${index})" style="margin-left:0.5rem;">X</button>
    `;
    cartItems.appendChild(li);

    total += parseFloat(item.price.replace('$',''));
  });

  document.getElementById('cart-total').textContent = 'Total: $' + total.toFixed(2);
}

function addToCart(name, price) {
  cart.push({ name, price });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function checkout() {
  alert('Compraste ' + cart.length + ' productos por un total de ' + document.getElementById('cart-total').textContent);
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

// Inicializar contador
updateCartCount();


//Creacion desde json
document.addEventListener("DOMContentLoaded", () => {
  loadLoggedUserName();

  Promise.all([
    fetch("../data/productos.json").then(res => res.json()),
    fetch("../data/ventas.json").then(res => res.json())
  ])
    .then(([productosData, ventasData]) => {
      mostrarProductos(productosData);
      validarRelacionVentasProductos(productosData, ventasData);
    })
    .catch(err => console.error("Error cargando JSON:", err));
});

function obtenerMapaProductosPorId(dataProductos) {
  const mapa = new Map();

  for (const categoria in dataProductos) {
    dataProductos[categoria].forEach(producto => {
      mapa.set(Number(producto.id), producto);
    });
  }

  return mapa;
}

function validarRelacionVentasProductos(dataProductos, dataVentas) {
  const productosPorId = obtenerMapaProductosPorId(dataProductos);
  const inconsistencias = [];

  dataVentas.forEach(venta => {
    venta.productos.forEach(productoVenta => {
      const productoCatalogo = productosPorId.get(Number(productoVenta.id));

      if (!productoCatalogo) {
        inconsistencias.push(
          `Venta ${venta.id}: el producto con id ${productoVenta.id} no existe en productos.json`
        );
        return;
      }

      if (productoCatalogo.nombre !== productoVenta.nombre) {
        inconsistencias.push(
          `Venta ${venta.id}: el nombre no coincide para id ${productoVenta.id} (${productoVenta.nombre} vs ${productoCatalogo.nombre})`
        );
      }

      if (Number(productoCatalogo.precio) !== Number(productoVenta.precio)) {
        inconsistencias.push(
          `Venta ${venta.id}: el precio no coincide para id ${productoVenta.id} (${productoVenta.precio} vs ${productoCatalogo.precio})`
        );
      }
    });
  });

  if (inconsistencias.length > 0) {
    console.warn("Validacion ventas-productos: se detectaron inconsistencias");
    inconsistencias.forEach(item => console.warn(item));
    return;
  }

  console.info("Validacion ventas-productos: OK, todas las referencias son consistentes.");
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
          <button class="button-sm" onclick="addToCart('${prod.nombre}', '$${prod.precio}')">Agregar</button>
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
