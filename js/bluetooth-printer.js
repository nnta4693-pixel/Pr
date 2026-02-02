// ===== BLUETOOTH PRINTER SERVICE =====
class BluetoothPrinter {
    constructor() {
        this.device = null;
        this.server = null;
        this.characteristic = null;
        this.isConnected = false;
        this.init();
    }

    init() {
        this.checkBluetoothSupport();
        this.updateStatus();
    }

    // Check Bluetooth availability
    checkBluetoothSupport() {
        if (!navigator.bluetooth) {
            console.warn('Bluetooth is not supported in this browser');
            return false;
        }
        return true;
    }

    // Update connection status display
    updateStatus() {
        const statusElement = document.getElementById('bluetoothStatus');
        if (!statusElement) return;

        if (this.isConnected && this.device) {
            statusElement.innerHTML = '<i class="fas fa-bluetooth"></i> <span>' + this.device.name + '</span>';
            statusElement.className = 'status-indicator bluetooth-status connected';
        } else {
            statusElement.innerHTML = '<i class="fas fa-bluetooth"></i> <span>မချိတ်ဆက်ရသေး</span>';
            statusElement.className = 'status-indicator bluetooth-status';
        }
    }

    // Connect to Bluetooth printer
    async connect() {
        if (!this.checkBluetoothSupport()) {
            throw new Error('ဤ browser တွင် Bluetooth ကိုမပံ့ပိုးပါ');
        }

        try {
            console.log('Requesting Bluetooth device...');
            
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: [CONFIG.get('BLUETOOTH_SERVICE_UUID')] }
                ],
                optionalServices: [
                    'battery_service',
                    'device_information'
                ]
            });

            console.log('Connecting to GATT server...');
            this.server = await this.device.gatt.connect();

            console.log('Getting service...');
            const service = await this.server.getPrimaryService(CONFIG.get('BLUETOOTH_SERVICE_UUID'));

            console.log('Getting characteristic...');
            this.characteristic = await service.getCharacteristic(CONFIG.get('BLUETOOTH_CHARACTERISTIC_UUID'));

            this.isConnected = true;
            this.updateStatus();

            // Add device disconnect listener
            this.device.addEventListener('gattserverdisconnected', () => {
                this.handleDisconnect();
            });

            console.log('Bluetooth printer connected successfully');
            return true;

        } catch (error) {
            console.error('Bluetooth connection error:', error);
            
            if (error.name === 'NotFoundError') {
                throw new Error('Bluetooth printer မတွေ့ပါ။ Printer ဖွင့်ထားကြောင်းသေချာပါစေ။');
            } else if (error.name === 'NetworkError') {
                throw new Error('Network error occurred while connecting to printer');
            } else {
                throw new Error(`Bluetooth ချိတ်ဆက်ရာတွင် အမှားဖြစ်နေပါသည်: ${error.message}`);
            }
        }
    }

    // Handle device disconnect
    handleDisconnect() {
        console.log('Bluetooth device disconnected');
        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.characteristic = null;
        this.updateStatus();
    }

    // Disconnect from printer
    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.handleDisconnect();
    }

    // Send data to printer
    async sendData(data) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('Printer နှင့် မချိတ်ဆက်ရသေးပါ');
        }

        try {
            const encoder = new TextEncoder();
            const dataArray = encoder.encode(data);
            
            await this.characteristic.writeValue(dataArray);
            console.log('Data sent to printer successfully');
            return true;

        } catch (error) {
            console.error('Error sending data to printer:', error);
            throw new Error(`ပုံနှိပ်ရာတွင် အမှားဖြစ်နေပါသည်: ${error.message}`);
        }
    }

    // Generate receipt data for thermal printer
    generateReceiptData(receipt) {
        const commands = CONFIG.get('PRINTER_COMMANDS');
        let printData = '';

        // Initialize printer
        printData += commands.INIT;
        
        // Shop header (Center aligned)
        printData += commands.ALIGN_CENTER;
        printData += commands.BOLD_ON;
        printData += `${receipt.shopName}${commands.LINE_FEED}`;
        printData += commands.BOLD_OFF;
        printData += commands.LINE_FEED;

        // Shop info
        printData += `${receipt.address}${commands.LINE_FEED}`;
        printData += `${receipt.phone}${commands.LINE_FEED}`;
        printData += `ဘောင်ချာအမှတ်: ${receipt.invoiceNo.toString().padStart(3, '0')}${commands.LINE_FEED}`;
        printData += `ရက်စွဲ: ${new Date(receipt.date).toLocaleDateString()}${commands.LINE_FEED}`;
        
        // Separator line
        printData += '--------------------------------';
        printData += commands.LINE_FEED;
        printData += commands.LINE_FEED;

        // Items (Left aligned)
        printData += commands.ALIGN_LEFT;
        receipt.items.forEach(item => {
            const itemTotal = item.product.price * item.quantity;
            
            // Product name
            printData += `${item.product.name}${commands.LINE_FEED}`;
            
            // Quantity and price
            printData += `${item.quantity} x ${item.product.price} = ${itemTotal} ks${commands.LINE_FEED}`;
            printData += commands.LINE_FEED;
        });

        // Separator line
        printData += '--------------------------------';
        printData += commands.LINE_FEED;

        // Totals (Right aligned)
        printData += commands.ALIGN_RIGHT;
        printData += `စုစုပေါင်း: ${receipt.subtotal} ks${commands.LINE_FEED}`;
        printData += `ဝန်ဆောင်ခ: ${receipt.serviceFee} ks${commands.LINE_FEED}`;
        printData += commands.BOLD_ON;
        printData += `ကျသင့်ငွေ: ${receipt.grandTotal} ks${commands.LINE_FEED}`;
        printData += commands.BOLD_OFF;
        
        printData += commands.LINE_FEED;
        printData += commands.LINE_FEED;

        // Thank you message (Center aligned)
        printData += commands.ALIGN_CENTER;
        printData += 'ကျေးဇူးတင်ပါသည်';
        printData += commands.LINE_FEED;
        printData += commands.LINE_FEED;

        // Cut paper
        printData += commands.CUT_PAPER;

        return printData;
    }

    // Print receipt
    async printReceipt(receipt) {
        try {
            // Connect if not connected
            if (!this.isConnected) {
                await this.connect();
            }

            // Generate receipt data
            const receiptData = this.generateReceiptData(receipt);
            
            // Send to printer
            await this.sendData(receiptData);
            
            console.log('Receipt printed successfully');
            return true;

        } catch (error) {
            console.error('Print error:', error);
            throw error;
        }
    }

    // Test printer connection
    async testPrint() {
        const testReceipt = {
            shopName: 'TEST SHOP',
            address: 'Test Address',
            phone: '09-123456789',
            invoiceNo: 999,
            date: new Date().toISOString(),
            items: [
                {
                    product: { name: 'Test Product 1', price: 1000 },
                    quantity: 2
                },
                {
                    product: { name: 'Test Product 2', price: 2000 },
                    quantity: 1
                }
            ],
            subtotal: 4000,
            serviceFee: 0,
            grandTotal: 4000
        };

        return await this.printReceipt(testReceipt);
    }
}

