// Myanmar E-Shop Main Application JavaScript
// Supabase Configuration
const SUPABASE_URL = 'https://hxpdutgjvxjidszvqkko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cGR1dGdqdnhqaWRzenZxa2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MzcyNTEsImV4cCI6MjA3MzAxMzI1MX0.ZlwqwpMOGkkPADEkD4-T1ZZdozW873ON4mDH7mO8awg';

class EShopApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.selectedProduct = null;
        this.selectedPaymentMethod = null;
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
        const textElement = document.getElementById('statusContent');
        
        if (connected) {
            statusElement.className = 'fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-medium bg-green-500 text-white transition-all duration-300';
            textElement.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
        } else {
            statusElement.className = 'fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-medium bg-red-500 text-white transition-all duration-300';
            textElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>${message}</span>`;
        }
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusElement.classList.add('opacity-0', 'pointer-events-none');
        }, 3000);
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Auth tabs
        document.getElementById('loginTab').addEventListener('click', () => this.switchAuthTab('login'));
        document.getElementById('signupTab').addEventListener('click', () => this.switchAuthTab('signup'));
        
        // Auth forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(item => {
            item.addEventListener('click', () => this.navigateTo(item.dataset.page));
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Profile form
        document.getElementById('profileForm').addEventListener('submit', (e) => this.updateProfile(e));
        
        // Modals
        document.getElementById('closeProductModal').addEventListener('click', () => this.closeModal('productModal'));
        document.getElementById('closePaymentModal').addEventListener('click', () => this.closeModal('paymentModal'));
        document.getElementById('closeOrderModal').addEventListener('click', () => this.closeModal('orderModal'));
        
        // Order form
        document.getElementById('orderForm').addEventListener('submit', (e) => this.submitOrder(e));
    }

    // Authentication
    switchAuthTab(tab) {
        const loginTab = document.getElementById('loginTab');
        const signupTab = document.getElementById('signupTab');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (tab === 'login') {
            loginTab.classList.add('bg-primary/20');
            loginTab.classList.remove('bg-gray-100/10');
            signupTab.classList.remove('bg-primary/20');
            signupTab.classList.add('bg-gray-100/10');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            signupTab.classList.add('bg-primary/20');
            signupTab.classList.remove('bg-gray-100/10');
            loginTab.classList.remove('bg-primary/20');
            loginTab.classList.add('bg-gray-100/10');
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const input = document.getElementById('loginInput').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            // Check user by email or username
            const response = await fetch(`${SUPABASE_URL}/rest/v1/users?or=(email.eq.${input},username.eq.${input})`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const users = await response.json();
            
            if (users.length > 0 && users[0].password === password) {
                this.currentUser = users[0];
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showAuthSection(false);
                this.showMessage('အကောင့်ဝင်ရောက်မှု အောင်မြင်ပါတယ်', 'success');
                this.loadUserProfile();
                this.loadProducts();
                this.loadOrderHistory();
                this.loadNews();
            } else {
                this.showMessage('အီးမေးလ်/အသုံးပြုသူနာမည် သို့မဟုတ် စကားဝှက် မမှန်ကန်ပါ', 'error');
            }
        } catch (error) {
            this.showMessage('အကောင့်ဝင်ရောက်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            console.error('Login error:', error);
        }
        
        this.showLoading(false);
    }

    async handleSignup(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const name = document.getElementById('signupName').value;
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        try {
            // Check if username or email already exists
            const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?or=(email.eq.${email},username.eq.${username})`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const existingUsers = await checkResponse.json();
            
            if (existingUsers.length > 0) {
                const existingUser = existingUsers[0];
                if (existingUser.email === email && existingUser.username === username) {
                    this.showMessage('ဒီအီးမေးလ်နဲ့ အသုံးပြုသူနာမည် နှစ်ခုလုံး အသုံးပြုပြီးသားဖြစ်နေပါတယ်', 'error');
                } else if (existingUser.email === email) {
                    this.showMessage('ဒီအီးမေးလ်လိပ်စာကို အသုံးပြုပြီးသားဖြစ်နေပါတယ်', 'error');
                } else if (existingUser.username === username) {
                    this.showMessage('ဒီအသုံးပြုသူနာမည်ကို အသုံးပြုပြီးသားဖြစ်နေပါတယ်', 'error');
                }
                this.showLoading(false);
                return;
            }
            
            // Create new user
            const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    username,
                    email,
                    password,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });
            
            if (createResponse.ok) {
                const newUser = await createResponse.json();
                this.currentUser = newUser[0];
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showMessage('အကောင့်ဖွင့်မှု အောင်မြင်ပါတယ်', 'success');
                this.showAuthSection(false);
                this.loadUserProfile();
                this.loadProducts();
                this.loadOrderHistory();
                this.loadNews();
            } else {
                this.showMessage('အကောင့်ဖွင့်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
        } catch (error) {
            this.showMessage('အကောင့်ဖွင့်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            console.error('Signup error:', error);
        }
        
        this.showLoading(false);
    }

    checkExistingLogin() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showAuthSection(false);
            this.loadUserProfile();
            this.loadProducts();
            this.loadOrderHistory();
            this.loadNews();
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuthSection(true);
        this.showMessage('အကောင့်မှ ထွက်ခွာပြီးပါပြီ', 'success');
    }

    // UI Functions
    showAuthSection(show) {
        const authSection = document.getElementById('authSection');
        const appSection = document.getElementById('appSection');
        
        if (show) {
            authSection.classList.remove('hidden');
            appSection.classList.add('hidden');
        } else {
            authSection.classList.add('hidden');
            appSection.classList.remove('hidden');
        }
    }

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
        
        let bgColor = '';
        let icon = '';
        let borderColor = '';
        
        if (type === 'success') {
            bgColor = 'bg-green-500';
            icon = 'fa-check-circle';
            borderColor = 'border-green-500';
        } else {
            bgColor = 'bg-red-500';
            icon = 'fa-exclamation-circle';
            borderColor = 'border-red-500';
        }
        
        messageDiv.className = `glass-effect p-4 rounded-lg border-l-4 ${borderColor} max-w-sm animate-fadeIn`;
        messageDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${icon} mr-3 text-lg text-white"></i>
                <div class="text-white">
                    <p class="font-semibold">${message}</p>
                </div>
                <button class="ml-auto text-gray-400 hover:text-white" onclick="this.closest('.glass-effect').remove()">
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


    // Navigation
    navigateTo(page) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-page="${page}"]`);
        activeItem.classList.add('active');
        
        // Show page
        document.querySelectorAll('#pageContent > div').forEach(pageDiv => {
            pageDiv.classList.add('hidden');
        });
        
        document.getElementById(`${page}Page`).classList.remove('hidden');
        this.currentPage = page;
        
        // Load page specific data
        if (page === 'history') {
            this.loadOrderHistory();
        } else if (page === 'news') {
            this.loadNews();
        }
    }

    // Data Loading Functions
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
        const container = document.getElementById('productsGrid');
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">ထုတ်ကုန်များ မရှိသေးပါ</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = products.map(product => {
            const contactInfo = typeof product.contact_info === 'string' 
                ? JSON.parse(product.contact_info || '{}') 
                : product.contact_info || {};
            
            return `
                <div class="bg-gray-800 rounded-2xl p-4 card-hover overflow-hidden">
                    <img src="${product.icon_url || 'https://via.placeholder.com/300x200/1f2937/9ca3af?text=No+Image'}" 
                         alt="${product.name}" class="w-full h-48 object-cover rounded-xl mb-4">
                    <div class="p-2">
                        <h3 class="font-bold text-lg text-white mb-2">${product.name}</h3>
                        <p class="text-gray-400 text-sm mb-3 line-clamp-2">${product.description}</p>
                        <div class="flex items-center justify-between">
                            <span class="text-2xl font-bold text-accent">${product.price} <span class="currency-symbol">ကျပ်</span></span>
                            <button onclick="app.viewProduct('${product.id}')" class="bg-primary/20 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/40 transition-all">
                                ကြည့်ရှုမည်
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async viewProduct(productId) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const products = await response.json();
            if (products.length > 0) {
                this.selectedProduct = products[0];
                this.showProductModal();
            }
        } catch (error) {
            console.error('Error loading product:', error);
        }
    }

    showProductModal() {
        const modal = document.getElementById('productModal');
        const content = document.getElementById('productModalContent');
        
        const contactInfo = typeof this.selectedProduct.contact_info === 'string' 
            ? JSON.parse(this.selectedProduct.contact_info || '{}') 
            : this.selectedProduct.contact_info || {};
        
        content.innerHTML = `
            <img src="${this.selectedProduct.icon_url || 'https://via.placeholder.com/400x300/1f2937/9ca3af?text=No+Image'}" 
                 alt="${this.selectedProduct.name}" class="w-full h-64 object-cover rounded-lg mb-4">
            <h3 class="text-xl font-bold text-white mb-2">${this.selectedProduct.name}</h3>
            <p class="text-gray-400 mb-4">${this.selectedProduct.description}</p>
            <div class="flex items-center justify-between mb-4">
                <span class="text-2xl font-bold text-accent">${this.selectedProduct.price} <span class="currency-symbol">ကျပ်</span></span>
                ${contactInfo.telegram ? `
                    <a href="${contactInfo.telegram}" target="_blank" class="text-accent hover:underline">
                        <i class="fab fa-telegram text-xl mr-1"></i>
                        ဆက်သွယ်ပါ
                    </a>
                ` : ''}
            </div>
            <button onclick="app.buyProduct()" class="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-medium hover:from-primary/80 hover:to-secondary/80 transition-all">
                ဝယ်ယူမည်
            </button>
        `;
        
        modal.classList.remove('hidden');
    }

    async buyProduct() {
        this.closeModal('productModal');
        await this.loadPaymentMethods();
        this.showPaymentModal();
    }

    async loadPaymentMethods() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            this.paymentMethods = await response.json();
        } catch (error) {
            console.error('Error loading payment methods:', error);
            this.paymentMethods = [];
        }
    }

    showPaymentModal() {
        const modal = document.getElementById('paymentModal');
        const content = document.getElementById('paymentModalContent');
        
        if (this.paymentMethods.length === 0) {
            content.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-credit-card text-6xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400">ငွေပေးချေမှုနည်းလမ်းများ မရှိသေးပါ</p>
                </div>
            `;
        } else {
            content.innerHTML = `
                <h4 class="text-lg font-semibold mb-4 text-white">ငွေပေးချေမှုနည်းလမ်းရွေးချယ်ပါ</h4>
                <div class="space-y-3">
                    ${this.paymentMethods.map(method => `
                        <div class="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-all" onclick="app.selectPaymentMethod('${method.id}')">
                            <div class="flex items-center">
                                <img src="${method.icon_url || 'https://via.placeholder.com/40x40/1f2937/9ca3af?text=Pay'}" 
                                     alt="${method.name}" class="w-10 h-10 rounded-lg mr-3">
                                <div>
                                    <p class="font-medium text-white">${method.name}</p>
                                    <p class="text-sm text-gray-400">${method.description}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        modal.classList.remove('hidden');
    }

    selectPaymentMethod(methodId) {
        this.selectedPaymentMethod = this.paymentMethods.find(m => m.id === methodId);
        this.showPaymentDetails();
    }

    showPaymentDetails() {
        const content = document.getElementById('paymentModalContent');
        
        content.innerHTML = `
            <div class="text-center">
                <img src="${this.selectedPaymentMethod.icon_url}" alt="${this.selectedPaymentMethod.name}" class="w-16 h-16 rounded-lg mx-auto mb-4">
                <h4 class="text-xl font-semibold mb-2 text-white">${this.selectedPaymentMethod.name}</h4>
                <p class="text-gray-400 mb-4">${this.selectedPaymentMethod.description}</p>
                
                <div class="bg-gray-800 rounded-lg p-4 mb-4">
                    <p class="text-sm text-gray-400 mb-2">ငွေလွှဲရမည့်လိပ်စာ:</p>
                    <p class="font-mono text-lg font-semibold text-white">${this.selectedPaymentMethod.address}</p>
                </div>
                
                ${this.selectedPaymentMethod.qr_code_url ? `
                    <div class="mb-4">
                        <p class="text-sm text-gray-400 mb-2">QR ကုဒ်:</p>
                        <img src="${this.selectedPaymentMethod.qr_code_url}" alt="QR Code" class="w-48 h-48 mx-auto border border-gray-700 rounded-lg">
                    </div>
                ` : ''}
                
                <div class="bg-blue-800/20 rounded-lg p-4 mb-4">
                    <p class="text-sm text-blue-300">
                        <i class="fas fa-info-circle mr-1"></i>
                        ငွေပေးချေမှုပြီးပါက အောက်ပါခလုပ်ကို နှိပ်ပြီး မှာယူမှုတင်ပြပါ
                    </p>
                </div>
                
                <button onclick="app.proceedToOrder()" class="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-medium hover:from-primary/80 hover:to-secondary/80 transition-all">
                    မှာယူမှုတင်ပြမည်
                </button>
            </div>
        `;
    }

    proceedToOrder() {
        this.closeModal('paymentModal');
        document.getElementById('orderModal').classList.remove('hidden');
    }

    async submitOrder(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const telegram = document.getElementById('orderTelegram').value;
        const transactionId = document.getElementById('orderTransactionId').value;
        const senderName = document.getElementById('orderSenderName').value;
        
        try {
            // Generate order number
            const orderNumber = 'OPPER' + Math.floor(Math.random() * 99999999 + 1).toString().padStart(8, '0');
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_number: orderNumber,
                    user_id: this.currentUser.id,
                    product_id: this.selectedProduct.id,
                    payment_method_id: this.selectedPaymentMethod.id,
                    buyer_telegram: telegram,
                    transaction_id: transactionId,
                    sender_name: senderName,
                    status: 'pending',
                    created_at: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                this.showMessage('မှာယူမှုကို အောင်မြင်စွာ တင်ပြပြီးပါပြီ', 'success');
                this.closeModal('orderModal');
                document.getElementById('orderForm').reset();
                this.loadOrderHistory();
            } else {
                this.showMessage('မှာယူမှု တင်ပြမှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
        } catch (error) {
            this.showMessage('မှာယူမှု တင်ပြမှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            console.error('Order submission error:', error);
        }
        
        this.showLoading(false);
    }

    async loadOrderHistory() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?user_id=eq.${this.currentUser.id}&select=*,products(*),payment_methods(*)&order=created_at.desc`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const orders = await response.json();
            this.displayOrderHistory(orders);
        } catch (error) {
            console.error('Error loading order history:', error);
        }
    }

    displayOrderHistory(orders) {
        const container = document.getElementById('ordersHistory');
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-shopping-cart text-6xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400 text-lg">မှာယူမှုမှတ်တမ်းများ မရှိသေးပါ</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="glass-effect rounded-2xl p-6 mb-4">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <p class="font-semibold text-lg">Order #${order.order_number}</p>
                        <p class="text-sm text-gray-400">${new Date(order.created_at).toLocaleDateString('my-MM')}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                        order.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                    }">
                        ${order.status === 'confirmed' ? 'အတည်ပြုပြီး' : 
                          order.status === 'rejected' ? 'ငြင်းဆိုထား' : 'စောင့်ဆိုင်းနေ'}
                    </span>
                </div>
                
                ${order.products ? `
                    <div class="flex items-center mb-4">
                        <img src="${order.products.icon_url || 'https://via.placeholder.com/60x60/1f2937/9ca3af?text=Product'}" 
                             alt="${order.products.name}" class="w-15 h-15 rounded-lg mr-4">
                        <div>
                            <p class="font-medium">${order.products.name}</p>
                            <p class="text-blue-300 font-semibold">${order.products.price} <span class="currency-symbol">ကျပ်</span></p>
                        </div>
                    </div>
                ` : ''}
                
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                        <p class="text-gray-400">Telegram:</p>
                        <p class="font-medium">${order.buyer_telegram}</p>
                    </div>
                    <div>
                        <p class="text-gray-400">Transaction ID:</p>
                        <p class="font-medium">${order.transaction_id}</p>
                    </div>
                </div>
                
                ${order.status === 'confirmed' ? `
                    <div class="mt-4">
                        <button onclick="app.downloadOrderPDF('${order.id}')" class="bg-secondary/20 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary/40 transition-all">
                            <i class="fas fa-download mr-1"></i>
                            Order List ဒေါင်းလုဒ်လုပ်ပါ
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    async downloadOrderPDF(orderId) {
        try {
            // Get order details
            const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=*,products(*),payment_methods(*)`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const orders = await response.json();
            if (orders.length > 0) {
                this.generateOrderPDF(orders[0]);
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    }

    generateOrderPDF(order) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text('Myanmar E-Shop', 20, 30);
        doc.setFontSize(16);
        doc.text('Order Receipt', 20, 45);
        
        // Order details
        doc.setFontSize(12);
        doc.text(`Order Number: ${order.order_number}`, 20, 65);
        doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 75);
        doc.text(`Customer: ${this.currentUser.name}`, 20, 85);
        doc.text(`Email: ${this.currentUser.email}`, 20, 95);
        
        // Product details
        if (order.products) {
            doc.text('Product Details:', 20, 115);
            doc.text(`Name: ${order.products.name}`, 30, 125);
            doc.text(`Price: ${order.products.price} MMK`, 30, 135);
        }
        
        // Payment details
        if (order.payment_methods) {
            doc.text('Payment Method:', 20, 155);
            doc.text(`Method: ${order.payment_methods.name}`, 30, 165);
            doc.text(`Transaction ID: ${order.transaction_id}`, 30, 175);
            doc.text(`Sender: ${order.sender_name}`, 30, 185);
        }
        
        // Footer
        doc.text('Thank you for your purchase!', 20, 220);
        doc.text('Myanmar E-Shop - Online Shopping Platform', 20, 230);
        
        // Download
        doc.save(`Order-${order.order_number}.pdf`);
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
        const container = document.getElementById('newsContainer');
        
        if (news.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-newspaper text-6xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400 text-lg">သတင်းများ မရှိသေးပါ</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = news.map(item => {
            const contactInfo = typeof item.contact_info === 'string' 
                ? JSON.parse(item.contact_info || '{}') 
                : item.contact_info || {};
            
            const images = Array.isArray(item.images) ? item.images : [];
            
            return `
                <div class="glass-effect rounded-2xl p-6">
                    <h3 class="text-xl font-bold text-white mb-3">${item.title}</h3>
                    
                    ${item.video_url ? `
                        <div class="mb-4">
                            <iframe src="${item.video_url.replace('watch?v=', 'embed/')}" 
                                    width="100%" height="315" frameborder="0" allowfullscreen class="rounded-lg">
                            </iframe>
                        </div>
                    ` : ''}
                    
                    ${images.length > 0 ? `
                        <div class="grid grid-cols-2 gap-2 mb-4">
                            ${images.map(img => `
                                <img src="${img}" alt="News Image" class="w-full h-32 object-cover rounded-lg">
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <p class="text-gray-400 mb-4">${item.content}</p>
                    
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-500">${new Date(item.created_at).toLocaleDateString('my-MM')}</span>
                        ${contactInfo.telegram ? `
                            <a href="${contactInfo.telegram}" target="_blank" class="text-accent hover:underline">
                                <i class="fab fa-telegram mr-1"></i>
                                ဆက်သွယ်ပါ
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    loadUserProfile() {
        document.getElementById('profileName').value = this.currentUser.name;
        document.getElementById('profileUsername').value = this.currentUser.username;
        document.getElementById('profileEmail').value = this.currentUser.email;
    }

    async updateProfile(e) {
        e.preventDefault();
        this.showLoading(true);
        
        const name = document.getElementById('profileName').value;
        const username = document.getElementById('profileUsername').value;
        const email = document.getElementById('profileEmail').value;
        
        try {
            // Check if new username/email already exists (excluding current user)
            const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?and=(or(email.eq.${email},username.eq.${username}),id.neq.${this.currentUser.id})`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            const existingUsers = await checkResponse.json();
            
            if (existingUsers.length > 0) {
                const existingUser = existingUsers[0];
                if (existingUser.email === email) {
                    this.showMessage('ဒီအီးမေးလ်လိပ်စာကို အသုံးပြုပြီးသားဖြစ်နေပါတယ်', 'error');
                } else if (existingUser.username === username) {
                    this.showMessage('ဒီအသုံးပြုသူနာမည်ကို အသုံးပြုပြီးသားဖြစ်နေပါတယ်', 'error');
                }
                this.showLoading(false);
                return;
            }
            
            // Update user profile
            const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${this.currentUser.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    username,
                    email,
                    updated_at: new Date().toISOString()
                })
            });
            
            if (updateResponse.ok) {
                this.currentUser = { ...this.currentUser, name, username, email };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showMessage('ကိုယ်ရေးအချက်အလက်များ အပ်ဒိတ်လုပ်ပြီးပါပြီ', 'success');
            } else {
                this.showMessage('အပ်ဒိတ်လုပ်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            }
        } catch (error) {
            this.showMessage('အပ်ဒိတ်လုပ်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error');
            console.error('Profile update error:', error);
        }
        
        this.showLoading(false);
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }
}

// Initialize app
const app = new EShopApp();

