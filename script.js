// Data Storage
let menuItems = JSON.parse(localStorage.getItem('hotelMenuItems')) || [];
let transactions = JSON.parse(localStorage.getItem('hotelTransactions')) || [];
let cashOnHand = parseFloat(localStorage.getItem('hotelCashOnHand')) || 0;
let cart = JSON.parse(localStorage.getItem('hotelCart')) || [];
let orders = JSON.parse(localStorage.getItem('hotelOrders')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Navigation
    setupNavigation();
    
    // Menu management
    setupMenuManagement();
    
    // Money counter
    setupMoneyCounter();
    
    // Customer menu
    setupCustomerMenu();
    
    // Render initial data
    renderMenuItems();
    renderTransactions();
    renderCustomerMenu();
    updateCartDisplay();
    updateDashboard();
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
    
    // Update dashboard if switching to it
    if (sectionId === 'dashboard') {
        updateDashboard();
    }
    
    // Show/hide cart icon based on section
    const cartIconContainer = document.getElementById('cart-icon-container');
    if (sectionId === 'customer-menu' && cart.length > 0) {
        cartIconContainer.style.display = 'block';
    } else if (sectionId !== 'customer-menu') {
        cartIconContainer.style.display = 'none';
    }
    
    // Render customer menu if switching to it
    if (sectionId === 'customer-menu') {
        renderCustomerMenu();
        updateCartDisplay();
    }
}

// Menu Management
function setupMenuManagement() {
    const menuForm = document.getElementById('menu-form');
    const filterButtons = document.querySelectorAll('[data-category]');
    
    // Menu form submission
    menuForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveMenuItem();
    });
    
    // Category filter buttons
    filterButtons.forEach(btn => {
        if (btn.dataset.category) {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterMenuItems(btn.dataset.category);
            });
        }
    });
}

function openMenuModal(itemId = null) {
    const modal = document.getElementById('menu-modal');
    const form = document.getElementById('menu-form');
    const modalTitle = document.getElementById('menu-modal-title');
    
    if (itemId) {
        // Edit mode
        const item = menuItems.find(i => i.id === itemId);
        if (item) {
            modalTitle.textContent = 'Edit Menu Item';
            document.getElementById('item-name').value = item.name;
            document.getElementById('item-category').value = item.category;
            document.getElementById('item-price').value = item.price;
            document.getElementById('item-description').value = item.description || '';
            form.dataset.editId = itemId;
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add Menu Item';
        form.reset();
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
}

function closeMenuModal() {
    const modal = document.getElementById('menu-modal');
    modal.classList.remove('active');
    document.getElementById('menu-form').reset();
}

function saveMenuItem() {
    const form = document.getElementById('menu-form');
    const editId = form.dataset.editId;
    
    const itemData = {
        name: document.getElementById('item-name').value.trim(),
        category: document.getElementById('item-category').value,
        price: parseFloat(document.getElementById('item-price').value),
        description: document.getElementById('item-description').value.trim()
    };
    
    if (editId) {
        // Update existing item
        const index = menuItems.findIndex(i => i.id === editId);
        if (index !== -1) {
            menuItems[index] = { ...menuItems[index], ...itemData };
        }
    } else {
        // Add new item
        const newItem = {
            id: Date.now().toString(),
            ...itemData,
            createdAt: new Date().toISOString()
        };
        menuItems.push(newItem);
    }
    
    localStorage.setItem('hotelMenuItems', JSON.stringify(menuItems));
    renderMenuItems();
    closeMenuModal();
    updateDashboard();
}

function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        menuItems = menuItems.filter(item => item.id !== itemId);
        localStorage.setItem('hotelMenuItems', JSON.stringify(menuItems));
        renderMenuItems();
        updateDashboard();
    }
}

function filterMenuItems(category) {
    const grid = document.getElementById('menu-grid');
    const items = grid.querySelectorAll('.menu-item');
    
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'grid';
        } else {
            item.style.display = 'none';
        }
    });
}

function renderMenuItems() {
    const grid = document.getElementById('menu-grid');
    
    if (menuItems.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">No menu items yet. Add your first item to get started!</p>';
        return;
    }
    
    grid.innerHTML = menuItems.map(item => `
        <div class="menu-item ${item.category}" data-category="${item.category}">
            <div class="menu-item-header">
                <div>
                    <span class="menu-item-category">${item.category}</span>
                    <h3 class="menu-item-name">${escapeHtml(item.name)}</h3>
                </div>
                <div class="menu-item-price">₹${item.price.toFixed(2)}</div>
            </div>
            ${item.description ? `<p class="menu-item-description">${escapeHtml(item.description)}</p>` : ''}
            <div class="menu-item-actions">
                <button class="btn btn-primary btn-sm" onclick="openMenuModal('${item.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteMenuItem('${item.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Money Counter
function setupMoneyCounter() {
    const transactionForm = document.getElementById('transaction-form');
    
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTransaction();
    });
    
    // Set default date to now
    const dateInput = document.getElementById('transaction-date');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.value = now.toISOString().slice(0, 16);
    
    // Transaction type filter
    const typeFilters = document.querySelectorAll('[data-type]');
    typeFilters.forEach(btn => {
        if (btn.dataset.type) {
            btn.addEventListener('click', () => {
                typeFilters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterTransactions(btn.dataset.type);
            });
        }
    });
}

function openTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    const form = document.getElementById('transaction-form');
    form.reset();
    
    // Set default date to now
    const dateInput = document.getElementById('transaction-date');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.value = now.toISOString().slice(0, 16);
    
    modal.classList.add('active');
}

function closeTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    modal.classList.remove('active');
    document.getElementById('transaction-form').reset();
}

function saveTransaction() {
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value.trim();
    const date = document.getElementById('transaction-date').value;
    
    const transaction = {
        id: Date.now().toString(),
        type: type,
        amount: amount,
        description: description,
        date: new Date(date).toISOString(),
        createdAt: new Date().toISOString()
    };
    
    transactions.unshift(transaction);
    
    // Update cash on hand
    if (type === 'income') {
        cashOnHand += amount;
    } else {
        cashOnHand -= amount;
    }
    
    localStorage.setItem('hotelTransactions', JSON.stringify(transactions));
    localStorage.setItem('hotelCashOnHand', cashOnHand.toString());
    
    renderTransactions();
    updateMoneyDisplay();
    closeTransactionModal();
    updateDashboard();
}

function updateManualCash() {
    const input = document.getElementById('manual-cash');
    const amount = parseFloat(input.value);
    
    if (isNaN(amount) || amount < 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    cashOnHand = amount;
    localStorage.setItem('hotelCashOnHand', cashOnHand.toString());
    
    updateMoneyDisplay();
    input.value = '';
    updateDashboard();
}

function deleteTransaction(transactionId) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
            // Revert cash on hand
            if (transaction.type === 'income') {
                cashOnHand -= transaction.amount;
            } else {
                cashOnHand += transaction.amount;
            }
        }
        
        transactions = transactions.filter(t => t.id !== transactionId);
        localStorage.setItem('hotelTransactions', JSON.stringify(transactions));
        localStorage.setItem('hotelCashOnHand', cashOnHand.toString());
        
        renderTransactions();
        updateMoneyDisplay();
        updateDashboard();
    }
}

function filterTransactions(type) {
    const list = document.getElementById('transactions-list');
    const items = list.querySelectorAll('.transaction-item');
    
    items.forEach(item => {
        if (type === 'all' || item.dataset.type === type) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function renderTransactions() {
    const list = document.getElementById('transactions-list');
    
    if (transactions.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No transactions yet. Add your first transaction to get started!</p>';
        return;
    }
    
    list.innerHTML = transactions.map(transaction => {
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="transaction-item ${transaction.type}" data-type="${transaction.type}">
                <div class="transaction-info">
                    <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                    <div class="transaction-date">${formattedDate}</div>
                </div>
                <div class="transaction-amount">${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}</div>
                <div class="transaction-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteTransaction('${transaction.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateMoneyDisplay() {
    document.getElementById('money-display').textContent = `₹${cashOnHand.toFixed(2)}`;
    
    // Calculate totals
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    document.getElementById('total-income').textContent = `₹${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `₹${totalExpenses.toFixed(2)}`;
}

// Dashboard
function updateDashboard() {
    document.getElementById('total-menu-items').textContent = menuItems.length;
    
    const totalRevenue = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    document.getElementById('total-revenue').textContent = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById('cash-on-hand').textContent = `₹${cashOnHand.toFixed(2)}`;
    document.getElementById('total-transactions').textContent = transactions.length;
}

// Utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Customer Menu & Cart Functions
function setupCustomerMenu() {
    // Customer menu filter buttons
    const customerFilters = document.querySelectorAll('.customer-filter-bar .filter-btn');
    customerFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            customerFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterCustomerMenu(btn.dataset.category);
        });
    });
}

function renderCustomerMenu() {
    const grid = document.getElementById('customer-menu-grid');
    
    if (menuItems.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">No menu items available yet. Please add items from Menu Management.</p>';
        return;
    }
    
    grid.innerHTML = menuItems.map(item => {
        const cartItem = cart.find(c => c.id === item.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        
        return `
            <div class="customer-menu-item" data-category="${item.category}">
                <div class="customer-menu-item-header">
                    <div>
                        <span class="customer-menu-item-category">${item.category}</span>
                        <h3 class="customer-menu-item-name">${escapeHtml(item.name)}</h3>
                    </div>
                    <div class="customer-menu-item-price">₹${item.price.toFixed(2)}</div>
                </div>
                ${item.description ? `<p class="customer-menu-item-description">${escapeHtml(item.description)}</p>` : ''}
                <div class="customer-menu-item-actions">
                    ${quantity > 0 ? `
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', -1)">−</button>
                            <span class="quantity-display">${quantity}</span>
                            <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                        </div>
                    ` : `
                        <button class="btn btn-primary btn-sm" onclick="addToCart('${item.id}')">Add to Cart</button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function filterCustomerMenu(category) {
    const grid = document.getElementById('customer-menu-grid');
    const items = grid.querySelectorAll('.customer-menu-item');
    
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'grid';
        } else {
            item.style.display = 'none';
        }
    });
}

function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const existingItem = cart.find(c => c.id === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            category: item.category,
            quantity: 1
        });
    }
    
    localStorage.setItem('hotelCart', JSON.stringify(cart));
    renderCustomerMenu();
    updateCartDisplay();
    showCartIcon();
}

function updateCartQuantity(itemId, change) {
    const cartItem = cart.find(c => c.id === itemId);
    if (!cartItem) return;
    
    cartItem.quantity += change;
    
    if (cartItem.quantity <= 0) {
        cart = cart.filter(c => c.id !== itemId);
    }
    
    localStorage.setItem('hotelCart', JSON.stringify(cart));
    renderCustomerMenu();
    updateCartDisplay();
    
    if (cart.length === 0) {
        hideCartIcon();
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(c => c.id !== itemId);
    localStorage.setItem('hotelCart', JSON.stringify(cart));
    renderCustomerMenu();
    updateCartDisplay();
    
    if (cart.length === 0) {
        hideCartIcon();
    }
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.toggle('active');
}

function updateCartDisplay() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    const cartCountHeader = document.getElementById('cart-count-header');
    
    if (cartCountElement) cartCountElement.textContent = cartCount;
    if (cartCountHeader) cartCountHeader.textContent = cartCount;
    
    const cartEmpty = document.getElementById('cart-empty');
    const cartItems = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-footer');
    
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartItems.style.display = 'none';
        cartFooter.style.display = 'none';
        hideCartIcon();
    } else {
        cartEmpty.style.display = 'none';
        cartItems.style.display = 'block';
        cartFooter.style.display = 'block';
        showCartIcon();
        
        renderCartItems();
        updateCartTotals();
    }
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    
    cartItemsContainer.innerHTML = cart.map(item => {
        const total = item.price * item.quantity;
        return `
            <div class="cart-item">
                <div class="cart-item-header">
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">₹${total.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', -1)">−</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    
    document.getElementById('cart-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `₹${total.toFixed(2)}`;
}

function placeOrder() {
    const customerName = document.getElementById('customer-name').value.trim();
    const customerTable = document.getElementById('customer-table').value.trim();
    
    if (!customerName) {
        alert('Please enter your name');
        return;
    }
    
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    
    const order = {
        id: Date.now().toString(),
        orderNumber: 'ORD-' + Date.now().toString().slice(-6),
        customerName: customerName,
        tableNumber: customerTable || 'N/A',
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    orders.unshift(order);
    localStorage.setItem('hotelOrders', JSON.stringify(orders));
    
    // Add order as income transaction
    const transaction = {
        id: Date.now().toString() + '-txn',
        type: 'income',
        amount: total,
        description: `Order ${order.orderNumber} - ${customerName}`,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    transactions.unshift(transaction);
    cashOnHand += total;
    
    localStorage.setItem('hotelTransactions', JSON.stringify(transactions));
    localStorage.setItem('hotelCashOnHand', cashOnHand.toString());
    
    // Clear cart
    cart = [];
    localStorage.removeItem('hotelCart');
    
    // Reset form
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-table').value = '';
    
    // Update displays
    renderCustomerMenu();
    updateCartDisplay();
    updateMoneyDisplay();
    renderTransactions();
    updateDashboard();
    
    // Close cart
    toggleCart();
    
    // Show success message
    alert(`Order placed successfully!\nOrder Number: ${order.orderNumber}\nTotal: ₹${total.toFixed(2)}`);
}

function showCartIcon() {
    const cartIconContainer = document.getElementById('cart-icon-container');
    const currentSection = document.querySelector('.section.active');
    if (currentSection && currentSection.id === 'customer-menu') {
        cartIconContainer.style.display = 'block';
    }
}

function hideCartIcon() {
    const cartIconContainer = document.getElementById('cart-icon-container');
    cartIconContainer.style.display = 'none';
}

function openOrdersModal() {
    const modal = document.getElementById('orders-modal');
    renderOrders();
    modal.classList.add('active');
}

function closeOrdersModal() {
    const modal = document.getElementById('orders-modal');
    modal.classList.remove('active');
}

function renderOrders() {
    const container = document.getElementById('orders-list-container');
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No orders yet.</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt);
        const formattedDate = date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-number">${order.orderNumber}</div>
                    <div class="order-status ${order.status}">${order.status}</div>
                </div>
                <div class="order-info">
                    <div><strong>Customer:</strong> ${escapeHtml(order.customerName)}</div>
                    <div><strong>Table:</strong> ${escapeHtml(order.tableNumber)}</div>
                    <div><strong>Date:</strong> ${formattedDate}</div>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <div>
                                <span class="order-item-name">${escapeHtml(item.name)}</span>
                                <span class="order-item-quantity">× ${item.quantity}</span>
                            </div>
                            <div class="order-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <span>Total: ₹${order.total.toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});
