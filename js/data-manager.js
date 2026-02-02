// ===== DATA MANAGEMENT =====
class DataManager {
    constructor() {
        this.products = this.loadData(CONFIG.get('STORAGE_KEYS').PRODUCTS) || [];
        this.cart = this.loadData(CONFIG.get('STORAGE_KEYS').CART) || [];
        this.shopInfo = this.loadData(CONFIG.get('STORAGE_KEYS').SHOP_INFO) || this.getDefaultShopInfo();
        this.receiptHistory = this.loadData(CONFIG.get('STORAGE_KEYS').RECEIPT_HISTORY) || [];
        this.pendingSync = this.loadData(CONFIG.get('STORAGE_KEYS').PENDING_SYNC) || [];
    }

    // Default shop information
    getDefaultShopInfo() {
        return {
            name: CONFIG.get('DEFAULT_SHOP_NAME'),
            address: CONFIG.get('DEFAULT_ADDRESS'),
            phone: CONFIG.get('DEFAULT_PHONE'),
            invoiceNo: 1,
            password: CONFIG.get('DEFAULT_PASSWORD'),
            googleSheetId: ''
        };
    }

    // Data persistence methods
    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return null;
        }
    }

    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            return false;
        }
    }

    saveAll() {
        this.saveData(CONFIG.get('STORAGE_KEYS').PRODUCTS, this.products);
        this.saveData(CONFIG.get('STORAGE_KEYS').CART, this.cart);
        this.saveData(CONFIG.get('STORAGE_KEYS').SHOP_INFO, this.shopInfo);
        this.saveData(CONFIG.get('STORAGE_KEYS').RECEIPT_HISTORY, this.receiptHistory);
        this.saveData(CONFIG.get('STORAGE_KEYS').PENDING_SYNC, this.pendingSync);
    }

    // Product management
    findProductById(productId) {
        return this.products.find(product => product.id === productId);
    }

    findProductBySearchTerm(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.products.filter(product => 
            product.id.toLowerCase().includes(term) || 
            product.name.toLowerCase().includes(term)
        );
    }

    addProduct(product) {
        // Check for duplicate ID
        if (this.products.some(p => p.id === product.id)) {
            throw new Error('Product ID already exists');
        }
        
        this.products.push(product);
        this.saveData(CONFIG.get('STORAGE_KEYS').PRODUCTS, this.products);
        return true;
    }

    updateProduct(productId, updates) {
        const productIndex = this.products.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            throw new Error('Product not found');
        }
        
        this.products[productIndex] = { ...this.products[productIndex], ...updates };
        this.saveData(CONFIG.get('STORAGE_KEYS').PRODUCTS, this.products);
        return true;
    }

    deleteProduct(productId) {
        const productIndex = this.products.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            throw new Error('Product not found');
        }
        
        this.products.splice(productIndex, 1);
        this.saveData(CONFIG.get('STORAGE_KEYS').PRODUCTS, this.products);
        return true;
    }

    // Cart management
    addToCart(product, quantity = 1) {
        const existingItem = this.cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ product, quantity });
        }
        
        this.saveData(CONFIG.get('STORAGE_KEYS').CART, this.cart);
    }

    updateCartItem(productId, quantity) {
        const item = this.cart.find(item => item.product.id === productId);
        if (item) {
            item.quantity = quantity;
            this.saveData(CONFIG.get('STORAGE_KEYS').CART, this.cart);
        }
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.product.id !== productId);
        this.saveData(CONFIG.get('STORAGE_KEYS').CART, this.cart);
    }

    clearCart() {
        this.cart = [];
        this.saveData(CONFIG.get('STORAGE_KEYS').CART, this.cart);
    }

    // Calculations
    calculateSubtotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    }

    calculateTotal(serviceFee = 0) {
        return this.calculateSubtotal() + parseInt(serviceFee);
    }

    // Receipt management
    saveReceipt(receiptData) {
        this.receiptHistory.unshift(receiptData);
        this.shopInfo.invoiceNo++;
        this.saveAll();
    }

    // Sync management
    addPendingSync(action, data) {
        this.pendingSync.push({
            action,
            data,
            timestamp: new Date().toISOString(),
            attempts: 0
        });
        this.saveData(CONFIG.get('STORAGE_KEYS').PENDING_SYNC, this.pendingSync);
    }

    removePendingSync(index) {
        this.pendingSync.splice(index, 1);
        this.saveData(CONFIG.get('STORAGE_KEYS').PENDING_SYNC, this.pendingSync);
    }
}

