// ===== UI MANAGEMENT =====
class UIManager {
    constructor(dataManager, googleSheets, cartManager, receiptManager, bluetoothPrinter) {
        this.dataManager = dataManager;
        this.googleSheets = googleSheets;
        this.cartManager = cartManager;
        this.receiptManager = receiptManager;
        this.bluetoothPrinter = bluetoothPrinter;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateShopInfo();
    }

    bindEvents() {
        // Page navigation
        document.getElementById('adminBtn').addEventListener('click', () => this.showAdminPage());
        document.getElementById('backToUser').addEventListener('click', () => this.showUserPage());
        document.getElementById('showPreview').addEventListener('click', () => this.showPreviewPage());
        document.getElementById('backToCart').addEventListener('click', () => this.showUserPage());

        // Admin login
        document.getElementById('loginBtn').addEventListener('click', () => this.login());

        // Shop info
        document.getElementById('shopInfoBtn').addEventListener('click', () => this.toggleShopInfo());
        document.getElementById('saveShopInfo').addEventListener('click', () => this.saveShopInfo());

        // Product management
        document.getElementById('showProductList').addEventListener('click', () => this.showProductList());
        document.getElementById('addNewProductBtn').addEventListener('click', () => this.showAddProductForm());
        document.getElementById('addProductConfirm').addEventListener('click', () => this.addNewProduct());

        // Sync products
        document.getElementById('syncProducts').addEventListener('click', () => this.syncProducts());

        // Receipt actions
        document.getElementById('saveReceipt').addEventListener('click', () => this.saveReceipt());
        document.getElementById('viewHistory').addEventListener('click', () => this.viewHistory());
        document.getElementById('downloadReceipt').addEventListener('click', () => this.downloadReceipt());
        document.getElementById('printSystem').addEventListener('click', () => this.printReceipt());
        document.getElementById('printBluetooth').addEventListener('click', () => this.printBluetoothReceipt());

        // History modal
        document.getElementById('closeHistory').addEventListener('click', () => this.closeHistory());

        // Auto-calculate price
        document.getElementById('newProductCost').addEventListener('input', () => this.calculatePrice());
        document.getElementById('newProductProfit').addEventListener('input', () => this.calculatePrice());

        // Clear data
        document.getElementById('clearData').addEventListener('click', () => this.clearLocalData());
    }

    // Page navigation methods
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    }

    showUserPage() {
        this.showPage('userPage');
    }

    showAdminPage() {
        this.showPage('adminPage');
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('adminSection').classList.add('hidden');
    }

    showPreviewPage() {
        if (this.dataManager.cart.length === 0) {
            this.showAlert('ဘောင်ချာထဲတွင် ကုန်ပစ္စည်းမရှိပါ!', 'error');
            return;
        }
        this.receiptManager.updatePreview();
        this.showPage('previewPage');
    }

    // Admin login
    login() {
        const password = document.getElementById('password').value;
        
        if (password === this.dataManager.shopInfo.password) {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('adminSection').classList.remove('hidden');
            document.getElementById('password').value = '';
            this.renderAdminProductList();
        } else {
            this.showAlert('လျှို့ဝှက်နံပါတ်မှားယွင်းနေပါသည်!', 'error');
        }
    }

    // Shop info management
    toggleShopInfo() {
        const shopInfoCard = document.getElementById('shopInfoCard');
        shopInfoCard.classList.toggle('hidden');
        
        if (!shopInfoCard.classList.contains('hidden')) {
            document.getElementById('editShopName').value = this.dataManager.shopInfo.name;
            document.getElementById('editShopAddress').value = this.dataManager.shopInfo.address;
            document.getElementById('editShopPhone').value = this.dataManager.shopInfo.phone;
            document.getElementById('googleSheetId').value = this.dataManager.shopInfo.googleSheetId || '';
        }
    }

    saveShopInfo() {
        const name = document.getElementById('editShopName').value.trim();
        const address = document.getElementById('editShopAddress').value.trim();
        const phone = document.getElementById('editShopPhone').value.trim();
        const newPassword = document.getElementById('newPassword').value;
        const googleSheetId = document.getElementById('googleSheetId').value.trim();

        if (!name) {
            this.showAlert('ဆိုင်အမည်ထည့်ပါ!', 'error');
            return;
        }

        this.dataManager.shopInfo.name = name;
        this.dataManager.shopInfo.address = address || CONFIG.get('DEFAULT_ADDRESS');
        this.dataManager.shopInfo.phone = phone || CONFIG.get('DEFAULT_PHONE');
        this.dataManager.shopInfo.googleSheetId = googleSheetId;

        if (newPassword) {
            this.dataManager.shopInfo.password = newPassword;
        }

        this.dataManager.saveAll();
        this.updateShopInfo();
        this.showAlert('ဆိုင်အချက်အလက်သိမ်းဆည်းပြီးပါပြီ!', 'success');
    }

    updateShopInfo() {
        document.getElementById('shopName').textContent = this.dataManager.shopInfo.name;
    }

    // Product management
    showProductList() {
        document.getElementById('productListSection').classList.remove('hidden');
        document.getElementById('addProductSection').classList.add('hidden');
        this.renderAdminProductList();
    }

    showAddProductForm() {
        document.getElementById('productListSection').classList.add('hidden');
        document.getElementById('addProductSection').classList.remove('hidden');
        this.resetProductForm();
    }

    resetProductForm() {
        document.getElementById('newProductId').value = '';
        document.getElementById('newProductName').value = '';
        document.getElementById('newProductCost').value = '';
        document.getElementById('newProductProfit').value = '';
        document.getElementById('newProductPrice').value = '';
        
        const confirmBtn = document.getElementById('addProductConfirm');
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> အတည်ပြုမည်';
        confirmBtn.onclick = () => this.addNewProduct();
    }

    calculatePrice() {
        const cost = parseFloat(document.getElementById('newProductCost').value) || 0;
        const profit = parseFloat(document.getElementById('newProductProfit').value) || 0;
        
        if (cost > 0 && profit > 0) {
            const price = cost + (cost * profit / 100);
            document.getElementById('newProductPrice').value = Math.round(price);
        }
    }

    async addNewProduct() {
        const id = document.getElementById('newProductId').value.trim();
        const name = document.getElementById('newProductName').value.trim();
        const cost = parseFloat(document.getElementById('newProductCost').value) || 0;
        const profit = parseFloat(document.getElementById('newProductProfit').value) || 0;
        const price = parseFloat(document.getElementById('newProductPrice').value) || 0;

        if (!id || !name || cost <= 0 || profit <= 0 || price <= 0) {
            this.showAlert('အချက်အလက်အားလုံးဖြည့်ပါ!', 'error');
            return;
        }

        // Check for duplicate ID locally first
        if (this.dataManager.findProductById(id)) {
            this.showAlert('ဤကုန်ပစ္စည်း ID ရှိပြီးသားဖြစ်နေပါသည်!', 'error');
            return;
        }

        const product = { id, name, cost, profit, price };

        try {
            // Try to save to Google Sheets if configured
            if (this.dataManager.shopInfo.googleSheetId) {
                this.showLoading('addProductConfirm', true);
                
                // First check if product already exists in Google Sheets
                try {
                    const existingProducts = await this.googleSheets.getProducts(this.dataManager.shopInfo.googleSheetId);
                    const existsInSheet = existingProducts.products?.some(p => p.id === id);
                    
                    if (existsInSheet) {
                        this.showAlert('ဤကုန်ပစ္စည်း ID သည် Google Sheet တွင်ရှိပြီးသားဖြစ်နေပါသည်!', 'error');
                        return;
                    }
                } catch (error) {
                    console.warn('Cannot check Google Sheets for duplicates, proceeding with local save only');
                }
                
                // Save to Google Sheets
                await this.googleSheets.addProduct(this.dataManager.shopInfo.googleSheetId, product);
                
                // Only save locally after successful Google Sheets save
                this.dataManager.addProduct(product);
                this.showAlert('ကုန်ပစ္စည်းထည့်သွင်းပြီးပါပြီ!', 'success');
            } else {
                // No Google Sheet configured, just save locally
                this.dataManager.addProduct(product);
                this.showAlert('ကုန်ပစ္စည်းထည့်သွင်းပြီးပါပြီ!', 'success');
            }

            this.showProductList();

        } catch (error) {
            console.error('Error adding product:', error);
            
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                this.showAlert('ဤကုန်ပစ္စည်း ID ရှိပြီးသားဖြစ်နေပါသည်!', 'error');
                return;
            }
            
            // Fallback: Save locally only and add to pending sync
            this.dataManager.addProduct(product);
            if (this.dataManager.shopInfo.googleSheetId) {
                this.dataManager.addPendingSync('addProduct', {
                    sheetId: this.dataManager.shopInfo.googleSheetId,
                    product: product
                });
            }
            
            this.showProductList();
            this.showAlert('ကုန်ပစ္စည်းကို local မှာသိမ်းထားပါပြီ။ Internet ရှိရင် Google Sheets ကိုအလိုအလျောက်တင်ပေးပါမယ်။', 'warning');
        } finally {
            this.showLoading('addProductConfirm', false);
        }
    }

    renderAdminProductList() {
        const tbody = document.getElementById('adminProductList');
        tbody.innerHTML = '';

        this.dataManager.products.forEach((product, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.cost} ks</td>
                <td>${product.profit}%</td>
                <td><strong>${product.price} ks</strong></td>
                <!-- Action buttons column removed -->
            `;
            tbody.appendChild(tr);
        });
    }

    // Sync products from Google Sheets
    async syncProducts() {
        if (!this.dataManager.shopInfo.googleSheetId) {
            this.showAlert('Google Sheet ID ထည့်သွင်းပါ!', 'error');
            return;
        }

        try {
            this.showLoading('syncProducts', true);
            const syncStatus = document.getElementById('syncStatus');
            
            const result = await this.googleSheets.getProducts(this.dataManager.shopInfo.googleSheetId);
            
            if (result.products && result.products.length > 0) {
                this.dataManager.products = result.products;
                this.dataManager.saveData(CONFIG.get('STORAGE_KEYS').PRODUCTS, this.dataManager.products);
                
                syncStatus.innerHTML = `<i class="fas fa-check-circle"></i> ကုန်ပစ္စည်း ${result.products.length} ခု ဆွဲချပြီးပါပြီ`;
                syncStatus.className = 'sync-status success';
                
                this.renderAdminProductList();
                this.showAlert('Google Sheet မှ ဒေတာများ ဆွဲချပြီးပါပြီ!', 'success');
            } else {
                syncStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ကုန်ပစ္စည်းမရှိပါ';
                syncStatus.className = 'sync-status error';
            }
            
        } catch (error) {
            console.error('Sync error:', error);
            const syncStatus = document.getElementById('syncStatus');
            syncStatus.innerHTML = `<i class="fas fa-times-circle"></i> ${error.message}`;
            syncStatus.className = 'sync-status error';
            this.showAlert(`Sync failed: ${error.message}`, 'error');
        } finally {
            this.showLoading('syncProducts', false);
        }
    }

    // Export products
    exportProducts(format) {
        if (this.dataManager.products.length === 0) {
            this.showAlert('တင်ပို့ရန် ကုန်ပစ္စည်းမရှိပါ!', 'error');
            return;
        }

        try {
            let content, mimeType, filename;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            switch (format) {
                case 'txt':
                    content = this.dataManager.products.map(p => 
                        `${p.id},${p.name},${p.cost},${p.profit},${p.price}`
                    ).join('\n');
                    mimeType = 'text/plain';
                    filename = `products_${timestamp}.txt`;
                    break;

                case 'json':
                    content = JSON.stringify(this.dataManager.products, null, 2);
                    mimeType = 'application/json';
                    filename = `products_${timestamp}.json`;
                    break;

                case 'excel':
                    const ws = XLSX.utils.json_to_sheet(this.dataManager.products.map(p => ({
                        'ID': p.id,
                        'Name': p.name,
                        'Cost': p.cost,
                        'Profit %': p.profit,
                        'Price': p.price
                    })));
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Products');
                    XLSX.writeFile(wb, `products_${timestamp}.xlsx`);
                    this.showAlert('Excel ဖိုင်ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ!', 'success');
                    return;
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showAlert(`${format.toUpperCase()} ဖိုင်ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ!`, 'success');

        } catch (error) {
            this.showAlert(`Export error: ${error.message}`, 'error');
        }
    }

    // Receipt methods
    saveReceipt() {
        if (this.receiptManager.saveReceipt()) {
            this.cartManager.renderCart();
            this.cartManager.updateTotals();
            this.showUserPage();
        }
    }

    viewHistory() {
        this.receiptManager.viewHistory();
    }

    downloadReceipt() {
        this.receiptManager.exportReceiptToExcel();
    }

    async printBluetoothReceipt() {
        try {
            this.showLoading('printBluetooth', true);
            const receipt = this.receiptManager.generateReceipt();
            await this.bluetoothPrinter.printReceipt(receipt);
            this.showAlert('ဘောင်ချာပုံနှိပ်ပြီးပါပြီ!', 'success');
        } catch (error) {
            this.showAlert(`Print error: ${error.message}`, 'error');
        } finally {
            this.showLoading('printBluetooth', false);
        }
    }

    printReceipt() {
        const receipt = this.receiptManager.generateReceipt();
        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt ${receipt.invoiceNo}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .shop-name { font-size: 24px; font-weight: bold; }
                    .receipt-info { margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .total-row { font-weight: bold; }
                    .thank-you { text-align: center; margin-top: 20px; font-style: italic; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="shop-name">${receipt.shopName}</div>
                    <div class="receipt-info">${receipt.address}</div>
                    <div class="receipt-info">${receipt.phone}</div>
                    <div class="receipt-info">Invoice: ${receipt.invoiceNo.toString().padStart(3, '0')}</div>
                    <div class="receipt-info">Date: ${new Date(receipt.date).toLocaleDateString()}</div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${receipt.items.map(item => `
                            <tr>
                                <td>${item.product.name}</td>
                                <td>${item.quantity}</td>
                                <td>${item.product.price} ks</td>
                                <td>${item.product.price * item.quantity} ks</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="text-align: right;">
                    <div>Subtotal: ${receipt.subtotal} ks</div>
                    <div>Service Fee: ${receipt.serviceFee} ks</div>
                    <div style="font-weight: bold; font-size: 18px;">Total: ${receipt.grandTotal} ks</div>
                </div>
                
                <div class="thank-you">
                    Thank you for your business!
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    }

    closeHistory() {
        document.getElementById('historyModal').classList.add('hidden');
    }

    // Clear local data
    async clearLocalData() {
        const isConfirmed = await this.showConfirmDialog(
            'သေချာပါသလား?',
            `Local storage ထဲက data အားလုံးကိုဖျက်မည်သေချာပါသလား?<br><br>
            <strong>ဖျက်သွားမယ့်အရာများ:</strong><br>
            • ကုန်ပစ္စည်းစာရင်း (${this.dataManager.products.length} ခု)<br>
            • ဘောင်ချာမှတ်တမ်း (${this.dataManager.receiptHistory.length} ခု)<br>
            • လက်ရှိခြင်းတောင်း<br>
            • Pending sync data<br><br>
            ဤလုပ်ဆောင်ချက်ကိုပြန်လည်ရယူ၍မရပါ။`
        );
        
        if (!isConfirmed) return;

        try {
            // Clear all local storage data
            localStorage.removeItem(CONFIG.get('STORAGE_KEYS').PRODUCTS);
            localStorage.removeItem(CONFIG.get('STORAGE_KEYS').CART);
            localStorage.removeItem(CONFIG.get('STORAGE_KEYS').RECEIPT_HISTORY);
            localStorage.removeItem(CONFIG.get('STORAGE_KEYS').PENDING_SYNC);
            
            // Reset shop info but keep basic settings
            const shopInfo = {
                ...this.dataManager.getDefaultShopInfo(),
                name: this.dataManager.shopInfo.name, // Keep shop name
                address: this.dataManager.shopInfo.address, // Keep address
                phone: this.dataManager.shopInfo.phone, // Keep phone
                googleSheetId: this.dataManager.shopInfo.googleSheetId // Keep Google Sheet ID
            };
            localStorage.setItem(CONFIG.get('STORAGE_KEYS').SHOP_INFO, JSON.stringify(shopInfo));
            
            // Reload the data manager to reset all data
            this.dataManager.products = [];
            this.dataManager.cart = [];
            this.dataManager.receiptHistory = [];
            this.dataManager.pendingSync = [];
            this.dataManager.shopInfo = shopInfo;
            
            // Update UI
            this.renderAdminProductList();
            this.cartManager.renderCart();
            this.cartManager.updateTotals();
            
            this.showAlert('Local data အားလုံးဖျက်ပြီးပါပြီ!', 'success');
            
        } catch (error) {
            console.error('Error clearing local data:', error);
            this.showAlert(`Data ဖျက်ရာတွင်အမှားဖြစ်နေပါသည်: ${error.message}`, 'error');
        }
    }

    // Utility methods
    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;

        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };

        alertDiv.style.backgroundColor = colors[type] || colors.info;
        alertDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info'}-circle"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(alertDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    showLoading(buttonId, show) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (show) {
            button.disabled = true;
            button.innerHTML = '<div class="loading"></div> Loading...';
        } else {
            button.disabled = false;
            // Reset button text based on ID
            if (buttonId === 'syncProducts') {
                button.innerHTML = '<i class="fas fa-sync-alt"></i> Google Sheet မှ ဒေတာများ ဆွဲချမည်';
            } else if (buttonId === 'addProductConfirm') {
                button.innerHTML = '<i class="fas fa-check"></i> အတည်ပြုမည်';
            } else if (buttonId === 'printBluetooth') {
                button.innerHTML = '<i class="fas fa-bluetooth"></i> Bluetooth';
            } else if (buttonId === 'clearData') {
                button.innerHTML = '<i class="fas fa-trash-alt"></i> Local Data အားလုံးဖျက်မည်';
            }
        }
    }

    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 3000;
            `;

            // Create dialog
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                padding: 24px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            `;

            dialog.innerHTML = `
                <h3 style="margin-bottom: 16px; color: #333;">${title}</h3>
                <p style="margin-bottom: 24px; color: #666; line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn btn-secondary" id="confirmCancel" style="padding: 10px 20px;">
                        <i class="fas fa-times"></i> မလုပ်တော့ပါ
                    </button>
                    <button class="btn btn-primary" id="confirmOk" style="padding: 10px 20px;">
                        <i class="fas fa-check"></i> အတည်ပြုမည်
                    </button>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Handle button clicks
            document.getElementById('confirmCancel').onclick = () => {
                document.body.removeChild(overlay);
                resolve(false);
            };

            document.getElementById('confirmOk').onclick = () => {
                document.body.removeChild(overlay);
                resolve(true);
            };
        });
    }
}

// Add CSS for slideIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);