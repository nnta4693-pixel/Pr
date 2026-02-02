// ===== CART MANAGEMENT =====
class CartManager {
    constructor(dataManager, uiManager) {
        this.dataManager = dataManager;
        this.uiManager = uiManager;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderCart();
    }

    bindEvents() {
        // Add product to cart
        document.getElementById('addProduct').addEventListener('click', () => this.addProductToCart());
        
        // Product ID input with suggestions
        document.getElementById('productId').addEventListener('input', () => this.showSuggestions());
        document.getElementById('productId').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addProductToCart();
        });
        
        // Quantity input
        document.getElementById('quantity').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addProductToCart();
        });

        // Service fee change
        document.getElementById('serviceFee').addEventListener('input', () => this.updateTotals());
    }

    addProductToCart() {
        const productId = document.getElementById('productId').value.trim();
        const quantity = parseInt(document.getElementById('quantity').value) || 1;

        if (!productId) {
            this.uiManager.showAlert('ကုန်ပစ္စည်း ID ထည့်ပါ!', 'error');
            return;
        }

        const product = this.dataManager.findProductById(productId);
        if (!product) {
            this.uiManager.showAlert('ကုန်ပစ္စည်းမတွေ့ပါ!', 'error');
            return;
        }

        try {
            this.dataManager.addToCart(product, quantity);
            this.renderCart();
            this.updateTotals();
            
            // Reset form
            document.getElementById('productId').value = '';
            document.getElementById('quantity').value = '1';
            document.getElementById('productId').focus();
            
            this.hideSuggestions();
            
        } catch (error) {
            this.uiManager.showAlert(`Error: ${error.message}`, 'error');
        }
    }

    showSuggestions() {
        const searchTerm = document.getElementById('productId').value.trim();
        const suggestionsDiv = document.getElementById('suggestions');
        
        if (searchTerm.length === 0) {
            this.hideSuggestions();
            return;
        }

        const matchedProducts = this.dataManager.findProductBySearchTerm(searchTerm);

        if (matchedProducts.length > 0) {
            suggestionsDiv.innerHTML = '';
            matchedProducts.forEach(product => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `
                    <div style="font-weight: 600;">${product.id} - ${product.name}</div>
                    <div style="font-size: 12px; color: #666;">${product.price} ks</div>
                `;
                div.addEventListener('click', () => {
                    document.getElementById('productId').value = product.id;
                    this.hideSuggestions();
                    document.getElementById('quantity').focus();
                });
                suggestionsDiv.appendChild(div);
            });
            suggestionsDiv.style.display = 'block';
        } else {
            this.hideSuggestions();
        }
    }

    hideSuggestions() {
        document.getElementById('suggestions').style.display = 'none';
    }

    renderCart() {
        const productListDiv = document.getElementById('productList');
        
        if (this.dataManager.cart.length === 0) {
            productListDiv.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>ကုန်ပစ္စည်းမရှိသေးပါ</p>
                </div>
            `;
            return;
        }

        productListDiv.innerHTML = '';
        this.dataManager.cart.forEach((item, index) => {
            const itemTotal = item.product.price * item.quantity;
            const div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = `
                <button class="delete-item" data-index="${index}">
                    <i class="fas fa-trash-alt"></i>
                </button>
                <div class="product-details">
                    <div class="product-name">${item.product.name}</div>
                    <div class="product-meta">${item.product.price} ks x ${item.quantity}</div>
                </div>
                <div class="product-price">${itemTotal} ks</div>
            `;
            productListDiv.appendChild(div);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                this.dataManager.removeFromCart(this.dataManager.cart[index].product.id);
                this.renderCart();
                this.updateTotals();
            });
        });
    }

    updateTotals() {
        const serviceFee = parseInt(document.getElementById('serviceFee').value) || 0;
        const subtotal = this.dataManager.calculateSubtotal();
        const total = this.dataManager.calculateTotal(serviceFee);
        
        document.getElementById('totalAmount').textContent = subtotal + ' ks';
        document.getElementById('grandTotalValue').textContent = total + ' ks';
    }

    getCartSummary() {
        return {
            items: [...this.dataManager.cart],
            subtotal: this.dataManager.calculateSubtotal(),
            serviceFee: parseInt(document.getElementById('serviceFee').value) || 0,
            total: this.dataManager.calculateTotal()
        };
    }
}

