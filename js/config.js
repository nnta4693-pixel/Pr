
// ===== CONFIGURATION SETTINGS =====
class Config {
    constructor() {
        this.settings = {
            // Google Apps Script URL (သင့်ရဲ့ URL နဲ့အစားထိုးပါ)
            GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby0sMcLvypnF01FKZ5Ndhk0fSt_NPZN3gtdF5SJtHJdeotTrhmtkdBFWBYeUJUmATff/exec',
            
            // Default Settings
            DEFAULT_PASSWORD: '200056',
            DEFAULT_SHOP_NAME: 'Aung Ko',
            DEFAULT_ADDRESS: 'address: Tada',
            DEFAULT_PHONE: 'ph: 09790222504',
            
            // Bluetooth Printer Settings
            BLUETOOTH_SERVICE_UUID: '000018f0-0000-1000-8000-00805f9b34fb',
            BLUETOOTH_CHARACTERISTIC_UUID: '00002af0-0000-1000-8000-00805f9b34fb',
            
            // Thermal Printer Commands
            PRINTER_COMMANDS: {
                INIT: '\x1B\x40',
                ALIGN_LEFT: '\x1B\x61\x00',
                ALIGN_CENTER: '\x1B\x61\x01',
                ALIGN_RIGHT: '\x1B\x61\x02',
                BOLD_ON: '\x1B\x45\x01',
                BOLD_OFF: '\x1B\x45\x00',
                CUT_PAPER: '\x1D\x56\x41\x10',
                LINE_FEED: '\x0A'
            },
            
            // App Version
            VERSION: '2.0.0',
            
            // Storage Keys
            STORAGE_KEYS: {
                PRODUCTS: 'pos_products',
                CART: 'pos_cart',
                SHOP_INFO: 'pos_shop_info',
                RECEIPT_HISTORY: 'pos_receipt_history',
                PENDING_SYNC: 'pos_pending_sync'
            }
        };
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        return this;
    }
}

// Global configuration instance
const CONFIG = new Config();
