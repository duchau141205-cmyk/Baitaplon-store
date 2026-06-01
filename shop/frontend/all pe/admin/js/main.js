const API_URL = 'http://localhost:5000/api';
let currentToken = localStorage.getItem('adminToken');

// View management
const views = {
    dashboard: document.getElementById('dashboard-view'),
    products: document.getElementById('products-view'),
    orders: document.getElementById('orders-view')
};

const viewTitle = document.getElementById('view-title');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadDashboardStats();
    
    // Check if logged in
    if (!currentToken) {
        // Redirect to login (to be implemented)
        console.log('No token found, please login');
    }
});

function setupNavigation() {
    document.querySelectorAll('.menu-item[data-view]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.getAttribute('data-view');
            switchView(viewName);
        });
    });
}

function switchView(viewName) {
    // Hide all views
    Object.values(views).forEach(view => {
        if (view) view.style.display = 'none';
    });

    // Show selected view
    if (views[viewName]) {
        views[viewName].style.display = 'block';
        viewTitle.innerText = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    }

    // Update active state in sidebar
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.menu-item[data-view="${viewName}"]`).classList.add('active');

    // Load data based on view
    if (viewName === 'products') loadProducts();
    if (viewName === 'orders') loadOrders();
}

// --- Data Fetching ---

async function loadDashboardStats() {
    // In a real app, you'd have a specific stats endpoint
    // For now, we'll fetch products and orders to count
    try {
        const products = await fetchData('/products');
        const orders = await fetchData('/orders');
        
        // Update UI (simplified)
        document.querySelectorAll('.stat-card .value')[1].innerText = orders.length || 0;
        document.querySelectorAll('.stat-card .value')[2].innerText = products.length || 0;
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

async function loadProducts() {
    const tableBody = document.getElementById('product-table-body');
    tableBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

    try {
        const products = await fetchData('/products');
        tableBody.innerHTML = '';
        products.forEach(p => {
            const row = `
                <tr>
                    <td><img src="${p.image}" style="width: 40px; height: 40px; border-radius: 4px;"></td>
                    <td>${p.name}</td>
                    <td>${p.category ? p.category.name : 'N/A'}</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td>${p.countInStock}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="editProduct('${p._id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p._id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="6">Error loading products.</td></tr>';
    }
}

async function loadOrders() {
    const tableBody = document.getElementById('order-table-body');
    tableBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

    try {
        const orders = await fetchData('/orders');
        tableBody.innerHTML = '';
        orders.forEach(o => {
            const row = `
                <tr>
                    <td>#${o._id.slice(-6)}</td>
                    <td>${o.user ? o.user.name : 'Guest'}</td>
                    <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>$${o.totalPrice.toFixed(2)}</td>
                    <td><span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="viewOrder('${o._id}')">View</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="6">Error loading orders.</td></tr>';
    }
}

// --- Helpers ---

async function fetchData(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}

// Modal functions
function showProductModal() {
    document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

// Add more functions for CRUD as needed...
