

// ===== MAIN APPLICATION =====
class POSApplication {
    constructor() {
        this.dataManager = null;
        this.googleSheets = null;
        this.cartManager = null;
        this.receiptManager = null;
        this.bluetoothPrinter = null;
        this.uiManager = null;
        
        this.init();
    }

    async init() {
    try {
        console.log('Initializing POS System...');
        
        // Initialize core components
        this.dataManager = new DataManager();
        this.googleSheets = new GoogleSheetsService();
        this.bluetoothPrinter = new BluetoothPrinter();
        
        // Initialize UI manager first
        this.uiManager = new UIManager(
            this.dataManager,
            this.googleSheets,
            null, // cartManager will be set next
            null, // receiptManager will be set next
            this.bluetoothPrinter
        );
        
        // Initialize remaining components
        this.cartManager = new CartManager(this.dataManager, this.uiManager);
        this.receiptManager = new ReceiptManager(this.dataManager, this.uiManager);
        
        // Update UI manager references
        this.uiManager.cartManager = this.cartManager;
        this.uiManager.receiptManager = this.receiptManager;
        
        // Check network status
        await this.googleSheets.checkNetworkStatus();
        
        console.log('POS System initialized successfully');
        console.log('Version:', CONFIG.get('VERSION'));
        
    } catch (error) {
        console.error('Failed to initialize POS System:', error);
        this.showFatalError('System initialization failed. Please refresh the page.');
    }
}

    showFatalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-size: 1.2rem;
            text-align: center;
            padding: 20px;
        `;
        errorDiv.innerHTML = `
            <div style="background: #f44336; padding: 30px; border-radius: 12px; max-width: 400px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 15px;">System Error</h3>
                <p style="margin-bottom: 20px;">${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Refresh Page
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Global application instance
let posApp;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    posApp = new POSApplication();
});

// Global functions for HTML event handlers
function exportProducts(format) {
    if (posApp && posApp.uiManager) {
        posApp.uiManager.exportProducts(format);
    }
}

// Make components available globally for debugging
window.posApp = posApp;
window.CONFIG = CONFIG;