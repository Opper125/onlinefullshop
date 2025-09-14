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
        this.switchAuthTab('login'); // Set initial active tab
        this.navigateTo('home'); // Set initial active page
    }

    // Database Connection
    async checkDatabaseConnection() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count&limit=1`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            if (response.ok) {
                this.isConnected = true;
                this.updateConnectionStatus(true, 'ချိတ်ဆက်ပြီးပါပြီ');
            } else { throw new Error('Connection failed'); }
        } catch (error) {
            this.isConnected = false;
            this.updateConnectionStatus(false, 'ချိတ်ဆက်မှု မရှိပါ');
            console.error('Database connection error:', error);
        }
    }

    updateConnectionStatus(connected, message) {
        const statusElement = document.getElementById('connectionStatus');
        const textElement = document.getElementById('connectionText');
        statusElement.style.color = connected ? '#00b4d8' : '#e63946';
        textElement.textContent = message;
    }

    setupEventListeners() {
        document.getElementById('loginTab').addEventListener('click', () => this.switchAuthTab('login'));
        document.getElementById('signupTab').addEventListener('click', () => this.switchAuthTab('signup'));
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.navigateTo(item.dataset.page));
        });
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('profileForm').addEventListener('submit', (e) => this.updateProfile(e));
        document.getElementById('closeProductModal').addEventListener('click', () => this.closeModal('productModal'));
        document.getElementById('closePaymentModal').addEventListener('click', () => this.closeModal('paymentModal'));
        document.getElementById('closeOrderModal').addEventListener('click', () => this.closeModal('orderModal'));
        document.getElementById('orderForm').addEventListener('submit', (e) => this.submitOrder(e));
    }

    switchAuthTab(tab) {
        const loginTab = document.getElementById('loginTab');
        const signupTab = document.getElementById('signupTab');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        const activeClasses = ['bg-white', 'text-black', 'shadow-md'];
        const inactiveClasses = ['bg-transparent', 'text-gray-500'];

        if (tab === 'login') {
            loginTab.classList.add(...activeClasses);
            loginTab.classList.remove(...inactiveClasses);
            signupTab.classList.remove(...activeClasses);
            signupTab.classList.add(...inactiveClasses);
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            signupTab.classList.add(...activeClasses);
            signupTab.classList.remove(...inactiveClasses);
            loginTab.classList.remove(...activeClasses);
            loginTab.classList.add(...inactiveClasses);
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
            const response = await fetch(`${SUPABASE_URL}/rest/v1/users?or=(email.eq.${input},username.eq.${input})`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            const users = await response.json();
            if (users.length > 0 && users[0].password === password) {
                this.currentUser = users[0];
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showAuthSection(false);
                this.showMessage('အကောင့်ဝင်ရောက်မှု အောင်မြင်ပါတယ်', 'success');
                this.loadAllData();
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
            const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?or=(email.eq.${email},username.eq.${username})`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            const existingUsers = await checkResponse.json();
            if (existingUsers.length > 0) {
                this.showMessage('ဤအီးမေးလ် သို့မဟုတ် အသုံးပြုသူနာမည်ကို အသုံးပြုပြီးသားဖြစ်နေပါသည်', 'error');
                this.showLoading(false); return;
            }
            const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, email, password, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            });
            if (createResponse.ok) {
                const newUser = await createResponse.json();
                this.currentUser = newUser[0];
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showMessage('အကောင့်ဖွင့်မှု အောင်မြင်ပါတယ်', 'success');
                this.showAuthSection(false);
                this.loadAllData();
            } else { this.showMessage('အကောင့်ဖွင့်မှုမှာ ပြဿနာရှိနေပါတယ်', 'error'); }
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
            this.loadAllData();
        }
    }
    
    loadAllData() {
        this.loadUserProfile();
        this.loadProducts();
        this.loadOrderHistory();
        this.loadNews();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuthSection(true);
        this.showMessage('အကောင့်မှ ထွက်ခွာပြီးပါပြီ', 'success');
    }

    showAuthSection(show) {
        document.getElementById('authSection').classList.toggle('hidden', !show);
        document.getElementById('appSection').classList.toggle('hidden', show);
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
    }

    showMessage(message, type) {
        const container = document.getElementById('messageContainer');
        const messageDiv = document.createElement('div');
        const bgColor = type === 'success' ? 'linear-gradient(45deg, #2a9d8f, #4cc9f0)' : 'linear-gradient(45deg, #e63946, #f72585)';
        
        messageDiv.className = 'text-white p-4 rounded-2xl shadow-lg flex items-center content-item';
        messageDiv.style.background = bgColor;
        
        messageDiv.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-3 text-xl"></i>
            <span class="flex-1">${message}</span>
            <button class="ml-4" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 5000);
    }

    navigateTo(page) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');
        document.querySelectorAll('#pageContent > div').forEach(div => div.classList.add('hidden'));
        document.getElementById(`${page}Page`).classList.remove('hidden');
        this.currentPage = page;
    }

    async loadProducts() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/products?order=created_at.desc`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            const products = await response.json();
            this.displayProducts(products);
        } catch (error) { console.error('Error loading products:', error); }
    }

    displayProducts(products) {
        const container = document.getElementById('productsGrid');
        if (products.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500"><i class="fas fa-box-open text-6xl mb-4"></i><p>ထုတ်ကုန်များ မရှိသေးပါ</p></div>`; return;
        }
        container.innerHTML = products.map((product, i) => `
            <div class="frosted-card overflow-hidden content-item" style="animation-delay: ${i * 100}ms" onclick="app.viewProduct('${product.id}')">
                <img src="${product.icon_url || 'https://placehold.co/600x400/e0e0e0/333?text=Image'}" alt="${product.name}" class="w-full h-56 object-cover">
                <div class="p-5">
                    <h3 class="font-bold text-lg truncate">${product.name}</h3>
                    <p class="text-gray-600 text-sm h-10 my-2 overflow-hidden">${product.description}</p>
                    <div class="flex items-center justify-between mt-4">
                        <span class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)]">${product.price} ကျပ်</span>
                        <button class="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">ကြည့်ရှုမည်</button>
                    </div>
                </div>
            </div>`).join('');
    }

    async viewProduct(productId) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            const products = await response.json();
            if (products.length > 0) {
                this.selectedProduct = products[0];
                const modal = document.getElementById('productModal');
                const content = document.getElementById('productModalContent');
                const contactInfo = typeof this.selectedProduct.contact_info === 'string' ? JSON.parse(this.selectedProduct.contact_info || '{}') : this.selectedProduct.contact_info || {};
                content.innerHTML = `
                    <img src="${this.selectedProduct.icon_url || 'https://placehold.co/600x400/e0e0e0/333?text=Image'}" alt="${this.selectedProduct.name}" class="w-full h-64 object-cover rounded-lg mb-4">
                    <h3 class="text-2xl font-bold mb-2">${this.selectedProduct.name}</h3>
                    <p class="text-gray-600 mb-4">${this.selectedProduct.description}</p>
                    <div class="flex items-center justify-between mb-6">
                        <span class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)]">${this.selectedProduct.price} ကျပ်</span>
                        ${contactInfo.telegram ? `<a href="${contactInfo.telegram}" target="_blank" class="text-[var(--secondary-color)] font-semibold"><i class="fab fa-telegram mr-1"></i>ဆက်သွယ်ပါ</a>` : ''}
                    </div>
                    <button onclick="app.buyProduct()" class="w-full btn-fancy">ဝယ်ယူမည်</button>`;
                modal.classList.remove('hidden');
            }
        } catch (error) { console.error('Error viewing product:', error); }
    }
    
    async buyProduct() {
        this.closeModal('productModal');
        await this.loadPaymentMethods();
        const modal = document.getElementById('paymentModal');
        const content = document.getElementById('paymentModalContent');
        if (this.paymentMethods.length === 0) {
            content.innerHTML = `<div class="text-center py-8 text-gray-500"><i class="fas fa-credit-card text-6xl mb-4"></i><p>ငွေပေးချေမှုနည်းလမ်းများ မရှိသေးပါ</p></div>`;
        } else {
            content.innerHTML = `
                <h4 class="text-lg font-semibold mb-4 text-center">ငွေပေးချေမှုနည်းလမ်းရွေးချယ်ပါ</h4>
                <div class="space-y-3">
                    ${this.paymentMethods.map(method => `
                        <div class="frosted-card !bg-white/80 p-4 cursor-pointer hover:!border-[var(--primary-color)]" onclick="app.selectPaymentMethod('${method.id}')">
                            <div class="flex items-center"><img src="${method.icon_url}" alt="${method.name}" class="w-10 h-10 rounded-lg mr-4">
                                <div><p class="font-medium">${method.name}</p><p class="text-sm text-gray-500">${method.description}</p></div>
                            </div>
                        </div>`).join('')}
                </div>`;
        }
        modal.classList.remove('hidden');
    }

    async loadPaymentMethods() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_methods`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }});
            this.paymentMethods = await response.json();
        } catch (error) { console.error('Error loading payment methods:', error); this.paymentMethods = []; }
    }

    selectPaymentMethod(methodId) {
        this.selectedPaymentMethod = this.paymentMethods.find(m => m.id === methodId);
        const content = document.getElementById('paymentModalContent');
        content.innerHTML = `
            <div class="text-center">
                <img src="${this.selectedPaymentMethod.icon_url}" alt="${this.selectedPaymentMethod.name}" class="w-20 h-20 rounded-2xl mx-auto mb-4 p-1 bg-white shadow-md">
                <h4 class="text-xl font-semibold mb-2">${this.selectedPaymentMethod.name}</h4>
                <div class="bg-gray-100 rounded-lg p-4 my-4"><p class="text-sm text-gray-500 mb-1">ငွေလွှဲရန်:</p><p class="font-mono text-lg">${this.selectedPaymentMethod.address}</p></div>
                ${this.selectedPaymentMethod.qr_code_url ? `<img src="${this.selectedPaymentMethod.qr_code_url}" alt="QR" class="w-48 h-48 mx-auto border-4 border-white rounded-lg shadow-md mb-4">` : ''}
                <div class="bg-blue-100 text-blue-800 rounded-lg p-3 my-4 text-sm"><i class="fas fa-info-circle mr-2"></i>ငွေလွှဲပြီးပါက မှာယူမှုတင်ပြရန် ခလုတ်ကိုနှိပ်ပါ။</div>
                <button onclick="app.proceedToOrder()" class="w-full btn-fancy">မှာယူမှုတင်ပြမည်</button>
            </div>`;
    }

    proceedToOrder() {
        this.closeModal('paymentModal');
        document.getElementById('orderModal').classList.remove('hidden');
    }

    async submitOrder(e) {
        e.preventDefault(); this.showLoading(true);
        const orderData = {
            order_number: 'OPPER' + Math.floor(Math.random() * 99999999 + 1).toString().padStart(8, '0'),
            user_id: this.currentUser.id,
            product_id: this.selectedProduct.id,
            payment_method_id: this.selectedPaymentMethod.id,
            buyer_telegram: document.getElementById('orderTelegram').value,
            transaction_id: document.getElementById('orderTransactionId').value,
            sender_name: document.getElementById('orderSenderName').value,
            status: 'pending', created_at: new Date().toISOString()
        };
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
                method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            if (response.ok) {
                this.showMessage('မှာယူမှု အောင်မြင်စွာ တင်ပြပြီးပါပြီ', 'success');
                this.closeModal('orderModal'); document.getElementById('orderForm').reset(); this.loadOrderHistory();
            } else { this.showMessage('မှာယူမှု တင်ပြရာတွင် ပြဿနာရှိနေသည်', 'error'); }
        } catch (error) { this.showMessage('မှာယူမှု တင်ပြရာတွင် ပြဿနာရှိနေသည်', 'error'); console.error('Order submission error:', error); }
        this.showLoading(false);
    }
    
    async loadOrderHistory() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?user_id=eq.${this.currentUser.id}&select=*,products(*),payment_methods(*)&order=created_at.desc`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }});
            const orders = await response.json();
            this.displayOrderHistory(orders);
        } catch (error) { console.error('Error loading order history:', error); }
    }

    displayOrderHistory(orders) {
        const container = document.getElementById('ordersHistory');
        if (orders.length === 0) {
            container.innerHTML = `<div class="text-center py-12 text-gray-500"><i class="fas fa-receipt text-6xl mb-4"></i><p>မှာယူမှုမှတ်တမ်းများ မရှိသေးပါ</p></div>`; return;
        }
        container.innerHTML = orders.map((order, i) => {
            const statusStyles = { confirmed: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', pending: 'bg-yellow-100 text-yellow-800' };
            const statusText = { confirmed: 'အတည်ပြုပြီး', rejected: 'ငြင်းဆိုထား', pending: 'စောင့်ဆိုင်းနေ' };
            return `
            <div class="frosted-card p-5 content-item" style="animation-delay: ${i * 100}ms">
                <div class="flex justify-between mb-4"><p class="font-semibold text-lg">Order #${order.order_number}</p><span class="px-3 py-1 rounded-full text-xs font-medium ${statusStyles[order.status]}">${statusText[order.status]}</span></div>
                ${order.products ? `<div class="flex items-center mb-4 p-3 bg-white/50 rounded-lg"><img src="${order.products.icon_url}" alt="${order.products.name}" class="w-12 h-12 rounded-lg mr-4"><div><p class="font-medium">${order.products.name}</p><p class="font-semibold text-[var(--secondary-color)]">${order.products.price} ကျပ်</p></div></div>` : ''}
                <div class="grid grid-cols-2 gap-4 text-sm"><p class="text-gray-500">Telegram: <strong class="text-gray-800">${order.buyer_telegram}</strong></p><p class="text-gray-500">Transaction ID: <strong class="text-gray-800 break-all">${order.transaction_id}</strong></p></div>
                ${order.status === 'confirmed' ? `<div class="mt-4"><button onclick="app.downloadOrderPDF('${order.id}')" class="w-full btn-fancy !py-2 !px-4 !text-sm"><i class="fas fa-download mr-1"></i>PDF ဒေါင်းလုဒ်လုပ်ပါ</button></div>` : ''}
            </div>`}).join('');
    }
    
    async loadNews() {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/news?order=created_at.desc`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }});
            const news = await response.json();
            this.displayNews(news);
        } catch (error) { console.error('Error loading news:', error); }
    }
    
    displayNews(news) {
        const container = document.getElementById('newsContainer');
        if (news.length === 0) {
            container.innerHTML = `<div class="text-center py-12 text-gray-500"><i class="fas fa-newspaper text-6xl mb-4"></i><p>သတင်းများ မရှိသေးပါ</p></div>`; return;
        }
        container.innerHTML = news.map((item, i) => `
            <div class="frosted-card p-5 content-item" style="animation-delay: ${i * 100}ms">
                <h3 class="text-xl font-bold mb-3">${item.title}</h3>
                ${item.video_url ? `<div class="mb-4 aspect-video"><iframe src="${item.video_url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen class="rounded-lg w-full h-full"></iframe></div>` : ''}
                ${(item.images || []).length > 0 ? `<div class="grid grid-cols-2 gap-2 mb-4">${item.images.map(img => `<img src="${img}" alt="News Image" class="w-full h-32 object-cover rounded-lg">`).join('')}</div>` : ''}
                <p class="text-gray-600 mb-4">${item.content}</p>
                <div class="flex items-center justify-between text-sm text-gray-500"><span>${new Date(item.created_at).toLocaleDateString('my-MM')}</span>${(item.contact_info || {}).telegram ? `<a href="${item.contact_info.telegram}" target="_blank" class="text-[var(--secondary-color)] font-semibold"><i class="fab fa-telegram mr-1"></i>ဆက်သွယ်ပါ</a>` : ''}</div>
            </div>`).join('');
    }

    loadUserProfile() {
        document.getElementById('profileName').value = this.currentUser.name;
        document.getElementById('profileUsername').value = this.currentUser.username;
        document.getElementById('profileEmail').value = this.currentUser.email;
    }

    async updateProfile(e) {
        e.preventDefault(); this.showLoading(true);
        const profileData = { name: document.getElementById('profileName').value, username: document.getElementById('profileUsername').value, email: document.getElementById('profileEmail').value, updated_at: new Date().toISOString() };
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${this.currentUser.id}`, {
                method: 'PATCH', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            if (response.ok) {
                this.currentUser = { ...this.currentUser, ...profileData };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showMessage('ကိုယ်ရေးအချက်အလက်များ အပ်ဒိတ်လုပ်ပြီးပါပြီ', 'success');
            } else { this.showMessage('အပ်ဒိတ်လုပ်ရာတွင် ပြဿနာရှိနေသည်', 'error'); }
        } catch (error) { this.showMessage('အပ်ဒိတ်လုပ်ရာတွင် ပြဿနာရှိနေသည်', 'error'); console.error('Profile update error:', error); }
        this.showLoading(false);
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    // Unchanged PDF generation logic
    async downloadOrderPDF(orderId) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=*,products(*),payment_methods(*)`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }});
            const orders = await response.json();
            if (orders.length > 0) this.generateOrderPDF(orders[0]);
        } catch (error) { console.error('Error downloading PDF:', error); }
    }
    generateOrderPDF(order) {
        const { jsPDF } = window.jspdf; const doc = new jsPDF();
        doc.setFontSize(20); doc.text('Myanmar E-Shop', 20, 30);
        doc.setFontSize(16); doc.text('Order Receipt', 20, 45);
        doc.setFontSize(12);
        doc.text(`Order Number: ${order.order_number}`, 20, 65);
        doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 75);
        doc.text(`Customer: ${this.currentUser.name}`, 20, 85);
        doc.text(`Email: ${this.currentUser.email}`, 20, 95);
        if (order.products) {
            doc.text('Product Details:', 20, 115); doc.text(`Name: ${order.products.name}`, 30, 125); doc.text(`Price: ${order.products.price} MMK`, 30, 135);
        }
        if (order.payment_methods) {
            doc.text('Payment Method:', 20, 155); doc.text(`Method: ${order.payment_methods.name}`, 30, 165); doc.text(`Transaction ID: ${order.transaction_id}`, 30, 175); doc.text(`Sender: ${order.sender_name}`, 30, 185);
        }
        doc.text('Thank you for your purchase!', 20, 220);
        doc.save(`Order-${order.order_number}.pdf`);
    }
}

const app = new EShopApp();


