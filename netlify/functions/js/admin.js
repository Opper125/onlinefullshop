// Myanmar E-Shop Admin Panel JavaScript
// Supabase Configuration
const SUPABASE_URL = 'https://hxpdutgjvxjidszvqkko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cGR1dGdqdnhqaWRzenZxa2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MzcyNTEsImV4cCI6MjA3MzAxMzI1MX0.ZlwqwpMOGkkPADEkD4-T1ZZdozW873ON4mDH7mO8awg';

class AdminPanel {
    constructor() {
        this.adminPassword = 'Zarchiver786';
        this.isLoggedIn = false;
        this.currentSection = 'products';
        this.isConnected = false;
        
        this.init();
    }

    async init() {
        this.checkDatabaseConnection();
        this.setupEventListeners();
        this.checkExistingLogin();
    }

    // Database Connection
    async checkDatabaseConnection() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count&limit=1`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (response.ok) {
                this.isConnected = true;
                this.updateConnectionStatus(true, 'ဒေတာဘေ့စ် ချိတ်ဆက်ပြီးပါပြီ');
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            this.isConnected = false;
            this.updateConnectionStatus(false, 'ဒေတာဘေ့စ် ချိတ်ဆက်မှု မရှိပါ');
            console.error('Database connection error:', error);
        }
    }

    updateConnectionStatus(connected, message) {
        const statusElement = document.getElementById('connectionStatus');
        const textElement = document.getElementById('connectionText');
        
        if (connected) {
            statusElement.className = 'connection-status status-connected';
        } else {
            statusElement.className = 'connection-status status-disconnected';
        }
        
        textElement.textContent = message;
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Admin login
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => this.handleAdminLogin(e));
        
        // Sidebar navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => this.switchSection(item.dataset.section));
        });
        
        // Logout
        document.getElementById('adminLogoutBtn').addEventListener('click', () => this.adminLogout());
        
        // Forms
        document.getElementById('addProductForm').addEventListener('submit', (e) => this.addProduct(e));
        document.getElementById('addPaymentForm').addEventListener('submit', (e) => this.addPaymentMethod(e));
        document.getElementById('addNewsForm').addEventListener('submit', (e) => this.addNews(e));
        
        // Edit forms
        document.getElementById('editProductForm').addEventListener('submit', (e) => this.updateProduct(e));
        document.getElementById('editPaymentForm').addEventListener('submit', (e) => this.updatePaymentMethod(e));
        document.getElementById('editNewsForm').addEventListener('submit', (e) => this.updateNews(e));
        
        // Modal close buttons
        document.getElementById('closeEditProductModal').addEventListener('click', () => this.closeModal('editProductModal'));
        document.getElementById('closeEditPaymentModal').addEventListener('click', () => this.closeModal('editPaymentModal'));
        document.getElementById('closeEditNewsModal').addEventListener('click', () => this.closeModal('editNewsModal'));
    }

    // Authentication
    handleAdminLogin(e) {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        
        if (password === this.adminPassword) {
            this.isLoggedIn = true;
            localStorage.setItem('adminLoggedIn', 'true');
            this.showDashboard();
            this.showMessage('Admin login လုပ်မှု အောင်မြင်ပါတယ်', 'success');
            this.loadAllData();
        } else {
            this.showMessage('Admin password မမှန်ကန်ပါ', 'error');
        }
    }

    checkExistingLogin() {
        const savedLogin = localStorage.getItem('adminLoggedIn');
        if (savedLogin === 'true') {
            this.isLoggedIn = true;
            this.showDashboard();
            this.loadAllData();
        }
    }

    adminLogout() {
        this.isLoggedIn = false;
        localStorage.removeItem('adminLoggedIn');
        document.getElementById('adminLoginSection').classList.remove('hidden');
        document.getElementById('adminDashboard').classList.add('hidden');
        document.getElementById('adminPassword').value = '';
        this.showMessage('Admin logout လုပ်ပြီးပါပြီ', 'success');
    }

    showDashboard() {
        document.getElementById('adminLoginSection').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
    }

    // UI Functions
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showMessage(message, type) {
        const container = document.getElementById('messageContainer');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `${type}-message p-4 rounded-lg shadow-lg animate-slide-up`;
        messageDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
                <span>${message}</span>
                <button class="ml-4 hover:opacity-75" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Section Navigation
    switchSection(section) {
        // Update sidebar
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Show section
        document.querySelectorAll('.section').forEach(sectionDiv => {
            sectionDiv.classList.add('hidden');
        });
        
        document.getElementById(`${section}Section`).classList.remove('hidden');
        this.currentSection = section;
        
        // Load section specific data
        this.loadSectionData(section);
    }

    async loadAllData() {
        await this.loadProducts();
        await this.loadPaymentMethods();
        await this.loadOrders();
        await this.loadNews();
    }

    async loadSectionData(section) {
        switch (section) {
            case 'products':
                await this.loadProducts();
                break;
            case 'payments':
                await this.loadPaymentMethods();
                break;
            case 'orders':
                await this.loadOrders();
                break;
            case 'news':
                await this.loadNews();
                break;
        }
    }

    // Products Management
    async addProduct(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const name = document.getElementById('productName').value;
        const iconUrl = document.getElementById('productIcon').value;
        const description = document.getElementById('productDescription').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const contactInfo = document.getElementById('productContact').value;
        
        try {
            // Validate JSON
            JSON.parse(contactInfo);
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    icon_url: iconUrl,
                    description,
                    price,
                    contact_info: contactInfo,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                this.showMessage('ထုတ်ကုန်အသစ် ထည့်ပြီးပါပြီ', 'success');
                document.getElementById('addProductForm').reset();
                await this.loadProducts();
            } else {
                this.showMessage('ထုတ်ကုန် ထည့်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.showMessage('Contact Info JSON format မမှန်ကန်ပါ', 'error');
            } else {
                this.showMessage('ထုတ်ကုန် ထည့်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
            console.error('Add product error:', error);
        }
        
        this.showLoading(false);
    }

    async loadProducts() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/products?order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const products = await response.json();
            this.displayProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    displayProducts(products) {
        const container = document.getElementById('productsList');
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">ထုတ်ကုန်များ မရှိသေးပါ</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = products.map(product => `
            <div class="border rounded-lg p-4 bg-gray-50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${product.icon_url || 'https://via.placeholder.com/60x60'}" 
                             alt="${product.name}" class="w-15 h-15 rounded-lg mr-4">
                        <div>
                            <h4 class="font-semibold text-lg">${product.name}</h4>
                            <p class="text-gray-600 text-sm">${product.description}</p>
                            <p class="text-blue-600 font-semibold">${product.price} ကျပ်</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="admin.editProduct('${product.id}')" class="btn-warning text-white px-3 py-2 rounded text-sm">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="admin.deleteProduct('${product.id}')" class="btn-danger text-white px-3 py-2 rounded text-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async editProduct(productId) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const products = await response.json();
            if (products.length > 0) {
                const product = products[0];
                this.populateEditProductForm(product);
                document.getElementById('editProductModal').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading product for edit:', error);
        }
    }

    populateEditProductForm(product) {
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductIcon').value = product.icon_url;
        document.getElementById('editProductDescription').value = product.description;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductContact').value = typeof product.contact_info === 'string' ? product.contact_info : JSON.stringify(product.contact_info);
    }

    async updateProduct(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const id = document.getElementById('editProductId').value;
        const name = document.getElementById('editProductName').value;
        const iconUrl = document.getElementById('editProductIcon').value;
        const description = document.getElementById('editProductDescription').value;
        const price = parseFloat(document.getElementById('editProductPrice').value);
        const contactInfo = document.getElementById('editProductContact').value;
        
        try {
            // Validate JSON
            JSON.parse(contactInfo);
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    icon_url: iconUrl,
                    description,
                    price,
                    contact_info: contactInfo,
                    updated_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                this.showMessage('ထုတ်ကုန် ပြင်ဆင်ပြီးပါပြီ', 'success');
                this.closeModal('editProductModal');
                await this.loadProducts();
            } else {
                this.showMessage('ထုတ်ကုန် ပြင်ဆင်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.showMessage('Contact Info JSON format မမှန်ကန်ပါ', 'error');
            } else {
                this.showMessage('ထုတ်ကုန် ပြင်ဆင်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
            console.error('Update product error:', error);
        }
        
        this.showLoading(false);
    }

    async deleteProduct(productId) {
        if (confirm('ဒီထုတ်ကုန်ကို အမှန်တကယ် ဖျက်မှာလား?')) {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                });
                
                if (response.ok) {
                    this.showMessage('ထုတ်ကုန် ဖျက်ပြီးပါပြီ', 'success');
                    await this.loadProducts();
                } else {
                    this.showMessage('ထုတ်ကုန် ဖျက်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
                }
            } catch (error) {
                this.showMessage('ထုတ်ကုန် ဖျက်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
                console.error('Delete product error:', error);
            }
            
            this.showLoading(false);
        }
    }

    // Payment Methods Management
    async addPaymentMethod(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const name = document.getElementById('paymentName').value;
        const iconUrl = document.getElementById('paymentIcon').value;
        const description = document.getElementById('paymentDescription').value;
        const address = document.getElementById('paymentAddress').value;
        const qrCodeUrl = document.getElementById('paymentQR').value;
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    icon_url: iconUrl,
                    description,
                    address,
                    qr_code_url: qrCodeUrl,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                this.showMessage('ငွေပေးချေမှုနည်းလမ်း ထည့်ပြီးပါပြီ', 'success');
                document.getElementById('addPaymentForm').reset();
                await this.loadPaymentMethods();
            } else {
                this.showMessage('ငွေပေးချေမှုနည်းလမ်း ထည့်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
        } catch (error) {
            this.showMessage('ငွေပေးချေမှုနည်းလမ်း ထည့်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            console.error('Add payment method error:', error);
        }
        
        this.showLoading(false);
    }

    async loadPaymentMethods() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const paymentMethods = await response.json();
            this.displayPaymentMethods(paymentMethods);
        } catch (error) {
            console.error('Error loading payment methods:', error);
        }
    }

    displayPaymentMethods(paymentMethods) {
        const container = document.getElementById('paymentsList');
        
        if (paymentMethods.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-credit-card text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">ငွေပေးချေမှုနည်းလမ်းများ မရှိသေးပါ</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = paymentMethods.map(method => `
            <div class="border rounded-lg p-4 bg-gray-50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${method.icon_url || 'https://via.placeholder.com/60x60'}" 
                             alt="${method.name}" class="w-15 h-15 rounded-lg mr-4">
                        <div>
                            <h4 class="font-semibold text-lg">${method.name}</h4>
                            <p class="text-gray-600 text-sm">${method.description}</p>
                            <p class="text-blue-600 font-mono">${method.address}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="admin.editPaymentMethod('${method.id}')" class="btn-warning text-white px-3 py-2 rounded text-sm">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="admin.deletePaymentMethod('${method.id}')" class="btn-danger text-white px-3 py-2 rounded text-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async editPaymentMethod(methodId) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?id=eq.${methodId}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const methods = await response.json();
            if (methods.length > 0) {
                const method = methods[0];
                this.populateEditPaymentForm(method);
                document.getElementById('editPaymentModal').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading payment method for edit:', error);
        }
    }

    populateEditPaymentForm(method) {
        document.getElementById('editPaymentId').value = method.id;
        document.getElementById('editPaymentName').value = method.name;
        document.getElementById('editPaymentIcon').value = method.icon_url;
        document.getElementById('editPaymentDescription').value = method.description;
        document.getElementById('editPaymentAddress').value = method.address;
        document.getElementById('editPaymentQR').value = method.qr_code_url;
    }

    async updatePaymentMethod(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const id = document.getElementById('editPaymentId').value;
        const name = document.getElementById('editPaymentName').value;
        const iconUrl = document.getElementById('editPaymentIcon').value;
        const description = document.getElementById('editPaymentDescription').value;
        const address = document.getElementById('editPaymentAddress').value;
        const qrCodeUrl = document.getElementById('editPaymentQR').value;
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    icon_url: iconUrl,
                    description,
                    address,
                    qr_code_url: qrCodeUrl,
                    updated_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                this.showMessage('ငွေပေးချေမှုနည်းလမ်း ပြင်ဆင်ပြီးပါပြီ', 'success');
                this.closeModal('editPaymentModal');
                await this.loadPaymentMethods();
            } else {
                this.showMessage('ငွေပေးချေမှုနည်းလမ်း ပြင်ဆင်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
        } catch (error) {
            this.showMessage('ငွေပေးချေမှုနည်းလမ်း ပြင်ဆင်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            console.error('Update payment method error:', error);
        }
        
        this.showLoading(false);
    }

    async deletePaymentMethod(methodId) {
        if (confirm('ဒီငွေပေးချေမှုနည်းလမ်းကို အမှန်တကယ် ဖျက်မှာလား?')) {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods?id=eq.${methodId}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                });
                
                if (response.ok) {
                    this.showMessage('ငွေပေးချေမှုနည်းလမ်း ဖျက်ပြီးပါပြီ', 'success');
                    await this.loadPaymentMethods();
                } else {
                    this.showMessage('ငွေပေးချေမှုနည်းလမ်း ဖျက်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
                }
            } catch (error) {
                this.showMessage('ငွေပေးချေမှုနည်းလမ်း ဖျက်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
                console.error('Delete payment method error:', error);
            }
            
            this.showLoading(false);
        }
    }

    // Orders Management
    async loadOrders() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,users(*),products(*),payment_methods(*)&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const orders = await response.json();
            this.displayOrders(orders);
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    displayOrders(orders) {
        const container = document.getElementById('ordersList');
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">မှာယူမှုများ မရှိသေးပါ</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="border rounded-lg p-4 bg-gray-50">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-semibold text-lg">Order #${order.order_number}</h4>
                        <p class="text-sm text-gray-600">${new Date(order.created_at).toLocaleDateString('my-MM')}</p>
                        
                        ${order.users ? `
                            <div class="mt-2">
                                <p class="text-sm"><strong>Customer:</strong> ${order.users.name}</p>
                                <p class="text-sm"><strong>Email:</strong> ${order.users.email}</p>
                            </div>
                        ` : ''}
                        
                        ${order.products ? `
                            <div class="mt-2">
                                <p class="text-sm"><strong>Product:</strong> ${order.products.name}</p>
                                <p class="text-sm"><strong>Price:</strong> ${order.products.price} MMK</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div>
                        <p class="text-sm"><strong>Telegram:</strong> ${order.buyer_telegram}</p>
                        <p class="text-sm"><strong>Transaction ID:</strong> ${order.transaction_id}</p>
                        <p class="text-sm"><strong>Sender Name:</strong> ${order.sender_name}</p>
                        
                        <div class="mt-3">
                            <span class="px-3 py-1 rounded-full text-sm font-medium ${
                                order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }">
                                ${order.status === 'confirmed' ? 'အတည်ပြုပြီး' : 
                                  order.status === 'rejected' ? 'ငြင်းဆိုထား' : 'စောင့်ဆိုင်းနေ'}
                            </span>
                        </div>
                        
                        ${order.status === 'pending' ? `
                            <div class="mt-3 flex gap-2">
                                <button onclick="admin.confirmOrder('${order.id}')" class="btn-success text-white px-3 py-2 rounded text-sm">
                                    <i class="fas fa-check mr-1"></i>
                                    အတည်ပြု
                                </button>
                                <button onclick="admin.rejectOrder('${order.id}')" class="btn-danger text-white px-3 py-2 rounded text-sm">
                                    <i class="fas fa-times mr-1"></i>
                                    ငြင်းဆို
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async confirmOrder(orderId) {
        if (confirm('ဒီမှာယူမှုကို အတည်ပြုမှာလား?')) {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'confirmed',
                        confirmed_at: new Date().toISOString()
                    })
                });
                
                if (response.ok) {
                    this.showMessage('မှာယူမှု အတည်ပြုပြီးပါပြီ', 'success');
                    await this.loadOrders();
                } else {
                    this.showMessage('မှာယူမှု အတည်ပြုမှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
                }
            } catch (error) {
                this.showMessage('မှာယူမှု အတည်ပြုမှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
                console.error('Confirm order error:', error);
            }
            
            this.showLoading(false);
        }
    }

    async rejectOrder(orderId) {
        if (confirm('ဒီမှာယူမှုကို ငြင်းဆိုမှာလား?')) {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'rejected'
                    })
                });
                
                if (response.ok) {
                    this.showMessage('မှာယူမှု ငြင်းဆိုပြီးပါပြီ', 'success');
                    await this.loadOrders();
                } else {
                    this.showMessage('မှာယူမှု ငြင်းဆိုမှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
                }
            } catch (error) {
                this.showMessage('မှာယူမှု ငြင်းဆိုမှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
                console.error('Reject order error:', error);
            }
            
            this.showLoading(false);
        }
    }

    // News Management
    async addNews(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const title = document.getElementById('newsTitle').value;
        const content = document.getElementById('newsContent').value;
        const imagesInput = document.getElementById('newsImages').value;
        const videoUrl = document.getElementById('newsVideo').value;
        const contactInfo = document.getElementById('newsContact').value;
        
        try {
            // Validate JSON
            JSON.parse(contactInfo);
            
            // Process images
            const images = imagesInput ? imagesInput.split(',').map(img => img.trim()).filter(img => img) : [];
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/news`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content,
                    images: JSON.stringify(images),
                    video_url: videoUrl || null,
                    contact_info: contactInfo,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                this.showMessage('သတင်းအသစ် ထည့်ပြီးပါပြီ', 'success');
                document.getElementById('addNewsForm').reset();
                await this.loadNews();
            } else {
                this.showMessage('သတင်း ထည့်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.showMessage('Contact Info JSON format မမှန်ကန်ပါ', 'error');
            } else {
                this.showMessage('သတင်း ထည့်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
            console.error('Add news error:', error);
        }
        
        this.showLoading(false);
    }

    async loadNews() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/news?order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const news = await response.json();
            this.displayNews(news);
        } catch (error) {
            console.error('Error loading news:', error);
        }
    }

    displayNews(news) {
        const container = document.getElementById('newsList');
        
        if (news.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-newspaper text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">သတင်းများ မရှိသေးပါ</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = news.map(item => {
            const images = typeof item.images === 'string' ? JSON.parse(item.images || '[]') : item.images || [];
            
            return `
                <div class="border rounded-lg p-4 bg-gray-50">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h4 class="font-semibold text-lg mb-2">${item.title}</h4>
                            <p class="text-gray-600 text-sm mb-2">${item.content}</p>
                            
                            ${images.length > 0 ? `
                                <div class="flex gap-2 mb-2">
                                    ${images.slice(0, 3).map(img => `
                                        <img src="${img}" alt="News Image" class="w-12 h-12 object-cover rounded">
                                    `).join('')}
                                    ${images.length > 3 ? `<span class="text-xs text-gray-500">+${images.length - 3} more</span>` : ''}
                                </div>
                            ` : ''}
                            
                            ${item.video_url ? `
                                <p class="text-xs text-blue-600 mb-2"><i class="fas fa-video mr-1"></i> Video ပါဝင်သည်</p>
                            ` : ''}
                            
                            <p class="text-xs text-gray-500">${new Date(item.created_at).toLocaleDateString('my-MM')}</p>
                        </div>
                        
                        <div class="flex gap-2 ml-4">
                            <button onclick="admin.editNews('${item.id}')" class="btn-warning text-white px-3 py-2 rounded text-sm">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="admin.deleteNews('${item.id}')" class="btn-danger text-white px-3 py-2 rounded text-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async editNews(newsId) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/news?id=eq.${newsId}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const news = await response.json();
            if (news.length > 0) {
                const newsItem = news[0];
                this.populateEditNewsForm(newsItem);
                document.getElementById('editNewsModal').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading news for edit:', error);
        }
    }

    populateEditNewsForm(newsItem) {
        document.getElementById('editNewsId').value = newsItem.id;
        document.getElementById('editNewsTitle').value = newsItem.title;
        document.getElementById('editNewsContent').value = newsItem.content;
        
        const images = typeof newsItem.images === 'string' ? JSON.parse(newsItem.images || '[]') : newsItem.images || [];
        document.getElementById('editNewsImages').value = images.join(', ');
        
        document.getElementById('editNewsVideo').value = newsItem.video_url || '';
        document.getElementById('editNewsContact').value = typeof newsItem.contact_info === 'string' ? newsItem.contact_info : JSON.stringify(newsItem.contact_info);
    }

    async updateNews(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const id = document.getElementById('editNewsId').value;
        const title = document.getElementById('editNewsTitle').value;
        const content = document.getElementById('editNewsContent').value;
        const imagesInput = document.getElementById('editNewsImages').value;
        const videoUrl = document.getElementById('editNewsVideo').value;
        const contactInfo = document.getElementById('editNewsContact').value;
        
        try {
            // Validate JSON
            JSON.parse(contactInfo);
            
            // Process images
            const images = imagesInput ? imagesInput.split(',').map(img => img.trim()).filter(img => img) : [];
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/news?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content,
                    images: JSON.stringify(images),
                    video_url: videoUrl || null,
                    contact_info: contactInfo,
                    updated_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                this.showMessage('သတင်း ပြင်ဆင်ပြီးပါပြီ', 'success');
                this.closeModal('editNewsModal');
                await this.loadNews();
            } else {
                this.showMessage('သတင်း ပြင်ဆင်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.showMessage('Contact Info JSON format မမှန်ကန်ပါ', 'error');
            } else {
                this.showMessage('သတင်း ပြင်ဆင်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
            console.error('Update news error:', error);
        }
        
        this.showLoading(false);
    }

    async deleteNews(newsId) {
        if (confirm('ဒီသတင်းကို အမှန်တကယ် ဖျက်မှာလား?')) {
            this.showLoading(true);
            
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/news?id=eq.${newsId}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                });
                
                if (response.ok) {
                    this.showMessage('သတင်း ဖျက်ပြီးပါပြီ', 'success');
                    await this.loadNews();
                } else {
                    this.showMessage('သတင်း ဖျက်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
                }
            } catch (error) {
                this.showMessage('သတင်း ဖျက်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
                console.error('Delete news error:', error);
            }
            
            this.showLoading(false);
        }
    }

    // Utility Functions
    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }
}

// Initialize admin panel
const admin = new AdminPanel();