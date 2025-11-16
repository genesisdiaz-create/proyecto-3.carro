// Global Variables
let vehiclesData = [];
let cart = [];
let currentVehicle = null;

// DOM Elements
const productsContainer = document.getElementById('productsContainer');
const searchInput = document.getElementById('searchInput');
const cartCount = document.getElementById('cartCount');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');
const cartButton = document.getElementById('cartButton');
const loadingSpinner = document.getElementById('loadingSpinner');

// Modals
let quantityModal, cartModal, paymentModal, vehicleDetailModal;

// Initialize Modals
document.addEventListener('DOMContentLoaded', () => {
    quantityModal = new bootstrap.Modal(document.getElementById('quantityModal'));
    cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    vehicleDetailModal = new bootstrap.Modal(document.getElementById('vehicleDetailModal'));

    // Load vehicles data
    loadVehicles();

    // Event Listeners
    searchInput.addEventListener('input', filterVehicles);
    cartButton.addEventListener('click', () => cartModal.show());

    // Add event listener to products container for dynamic elements
    productsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('viewDetailsBtn') || e.target.closest('.viewDetailsBtn')) {
            const button = e.target.classList.contains('viewDetailsBtn') ? e.target : e.target.closest('.viewDetailsBtn');
            const codigo = parseInt(button.getAttribute('data-codigo'));
            showVehicleDetail(codigo);
        } else if (e.target.classList.contains('addToCartBtn') || e.target.closest('.addToCartBtn')) {
            const button = e.target.classList.contains('addToCartBtn') ? e.target : e.target.closest('.addToCartBtn');
            const codigo = parseInt(button.getAttribute('data-codigo'));
            const vehicle = vehiclesData.find(v => v.codigo === codigo);
            if (vehicle) {
                currentVehicle = vehicle;
                showQuantityModal(vehicle);
            }
        }
    });

    // Checkout button
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        cartModal.hide();
        paymentModal.show();
    });

    // Process payment button
    document.getElementById('processPaymentBtn').addEventListener('click', processPayment);
});

// Load vehicles from JSON
async function loadVehicles() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json');
        if (!response.ok) throw new Error('Error al cargar los datos');
        vehiclesData = await response.json();
        displayVehicles(vehiclesData);
    } catch (error) {
        productsContainer.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Display vehicles in the container
function displayVehicles(vehicles) {
    productsContainer.innerHTML = '';
    if (vehicles.length === 0) {
        productsContainer.innerHTML = '<div class="col-12 text-center"><p class="lead">No se encontraron vehículos</p></div>';
        return;
    }

    vehicles.forEach(vehicle => {
        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <img src="${vehicle.imagen}" class="card-img-top" alt="${vehicle.marca} ${vehicle.modelo}" loading="lazy">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                    <p class="card-text">${vehicle.categoria}</p>
                    <p class="card-text">${vehicle.tipo.replace(/[^\w\s]/gi, '')}</p>
                    <p class="card-price">$${vehicle.precio_venta.toLocaleString()}</p>
                    <button class="btn btn-primary mt-auto addToCartBtn" data-codigo="${vehicle.codigo}">Añadir al Carrito</button>
                    <button class="btn btn-outline-secondary mt-2 viewDetailsBtn" data-codigo="${vehicle.codigo}">Ver Detalle</button>
                </div>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

// Filter vehicles by search input
function filterVehicles() {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = vehiclesData.filter(vehicle =>
        vehicle.marca.toLowerCase().includes(searchTerm) ||
        vehicle.modelo.toLowerCase().includes(searchTerm) ||
        vehicle.categoria.toLowerCase().includes(searchTerm)
    );
    displayVehicles(filtered);
}

// Show vehicle detail modal
function showVehicleDetail(codigo) {
    const vehicle = vehiclesData.find(v => v.codigo === codigo);
    if (!vehicle) return;

    document.getElementById('detailVehicleImage').src = vehicle.imagen;
    document.getElementById('detailVehicleTitle').textContent = `${vehicle.marca} ${vehicle.modelo}`;
    document.getElementById('detailVehicleBrand').textContent = vehicle.marca;
    document.getElementById('detailVehicleModel').textContent = vehicle.modelo;
    document.getElementById('detailVehicleCategory').textContent = vehicle.categoria;
    document.getElementById('detailVehicleType').textContent = vehicle.tipo.replace(/[^\w\s]/gi, '');
    document.getElementById('detailVehiclePrice').textContent = vehicle.precio_venta.toLocaleString();
    document.querySelector('#vehicleDetailModal .addToCartBtn').setAttribute('data-codigo', vehicle.codigo);

    vehicleDetailModal.show();
}

// Show quantity modal
function showQuantityModal(vehicle) {
    quantityModal.show();
    document.getElementById('addToCartBtn').onclick = () => {
        const quantity = parseInt(document.getElementById('quantityInput').value);
        if (quantity > 0) {
            addItemToCart(vehicle, quantity);
            quantityModal.hide();
        } else {
            alert('La cantidad debe ser mayor que 0');
        }
    };
}

// Add item to cart
function addItemToCart(vehicle, quantity) {
    const existingItem = cart.find(item => item.codigo === vehicle.codigo);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            imagen: vehicle.imagen,
            logo: vehicle.logo,
            codigo: vehicle.codigo,
            marca: vehicle.marca,
            modelo: vehicle.modelo,
            precio: vehicle.precio_venta,
            quantity: quantity
        });
    }
    updateCartUI();
    cartCount.classList.add('pulse');
    setTimeout(() => cartCount.classList.remove('pulse'), 500);
}

// Update cart UI
function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.precio * item.quantity;
        total += subtotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'd-flex mb-3';
        itemElement.innerHTML = `
            <img src="${item.imagen}" alt="${item.marca} ${item.modelo}" class="me-3" style="width: 80px; height: 60px; object-fit: cover;">
            <div class="flex-grow-1">
                <h6>${item.marca} ${item.modelo}</h6>
                <p class="mb-1">Cantidad: ${item.quantity}</p>
                <p class="mb-0">Subtotal: $${subtotal.toLocaleString()}</p>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    cartTotalSpan.textContent = total.toLocaleString();
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Process payment
function processPayment() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }

    alert('¡Pago procesado con éxito!');
    generateInvoice();
    cart = [];
    updateCartUI();
    paymentModal.hide();
}

// Generate invoice PDF
function generateInvoice() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('GarageOnline - Factura de Compra', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total de artículos: ${cart.reduce((sum, item) => sum + item.quantity, 0)}`, 20, 40);

    let y = 60;
    doc.text('Detalle de Compra:', 20, y);
    y += 10;

    cart.forEach(item => {
        doc.text(`${item.marca} ${item.modelo} - Cantidad: ${item.quantity} - Subtotal: $${(item.precio * item.quantity).toLocaleString()}`, 20, y);
        y += 10;
    });

    const total = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    doc.text(`TOTAL: $${total.toLocaleString()}`, 20, y + 10);

    doc.save(`factura_garageonline_${new Date().toISOString().slice(0, 10)}.pdf`);
}
