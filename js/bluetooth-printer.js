// ===== BLUETOOTH PRINTER SERVICE - FINAL WORKING VERSION =====
class BluetoothPrinter {
    constructor() {
        this.device = null;
        this.server = null;
        this.characteristic = null;
        this.isConnected = false;
        this.isPrinting = false;
        this.printQueue = [];
        this.init();
    }

    init() {
        this.checkBluetoothSupport();
        this.updateStatus();
    }

    // Check Bluetooth availability
    checkBluetoothSupport() {
        if (!navigator.bluetooth) {
            console.error('❌ Bluetooth is not supported');
            this.showStatus('Bluetooth မပါဝင်ပါ', 'error');
            return false;
        }
        return true;
    }

    // Update status display
    updateStatus() {
        const statusElement = document.getElementById('bluetoothStatus');
        if (!statusElement) return;

        if (this.isConnected && this.device) {
            statusElement.innerHTML = `<i class="fas fa-bluetooth"></i> <span>${this.device.name}</span>`;
            statusElement.className = 'status-indicator bluetooth-status connected';
        } else {
            statusElement.innerHTML = '<i class="fas fa-bluetooth"></i> <span>မချိတ်ဆက်ရသေး</span>';
            statusElement.className = 'status-indicator bluetooth-status';
        }
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('bluetoothStatus');
        if (statusElement) {
            const icon = type === 'error' ? 'fa-exclamation-triangle' : 
                        type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
            statusElement.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
            statusElement.className = `status-indicator bluetooth-status ${type}`;
            
            // Auto clear after 3 seconds
            if (type !== 'connected') {
                setTimeout(() => this.updateStatus(), 3000);
            }
        }
    }

    // SIMPLIFIED CONNECTION - NO COMPLEX LOGIC
    async connect() {
        if (!this.checkBluetoothSupport()) {
            throw new Error('Bluetooth not supported');
        }

        try {
            this.showStatus('Printer ရွေးချယ်နေသည်...', 'info');
            
            // Step 1: Select device (VERY SIMPLE)
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [] // Empty - let browser handle it
            });

            if (!this.device) {
                throw new Error('No device selected');
            }

            this.showStatus('Printer နှင့်ချိတ်ဆက်နေသည်...', 'info');
            
            // Step 2: Connect to GATT (NO TIMEOUT - let it work naturally)
            this.server = await this.device.gatt.connect();
            
            // Step 3: Find ANY service that works
            const services = await this.server.getPrimaryServices();
            
            for (const service of services) {
                try {
                    const characteristics = await service.getCharacteristics();
                    
                    for (const char of characteristics) {
                        // Just try to find ANY write characteristic
                        if (char.properties.write || char.properties.writeWithoutResponse) {
                            this.characteristic = char;
                            this.isConnected = true;
                            this.updateStatus();
                            
                            console.log(`✅ Connected to service: ${service.uuid}`);
                            console.log(`✅ Using characteristic: ${char.uuid}`);
                            
                            // Setup disconnect handler
                            this.device.addEventListener('gattserverdisconnected', () => {
                                this.isConnected = false;
                                this.device = null;
                                this.server = null;
                                this.characteristic = null;
                                this.updateStatus();
                                console.log('⚠️ Printer disconnected');
                            });
                            
                            this.showStatus('Printer ချိတ်ဆက်ပြီးပါပြီ', 'success');
                            return true;
                        }
                    }
                } catch (e) {
                    continue; // Try next service
                }
            }
            
            throw new Error('No suitable characteristic found');
            
        } catch (error) {
            console.error('Connection error:', error);
            this.showStatus(`ချိတ်ဆက်မရ: ${error.message}`, 'error');
            throw error;
        }
    }

    // SIMPLE DATA SENDING - NO COMPLEX CHUNKING
    async sendData(data) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('Not connected to printer');
        }

        try {
            console.log(`📤 Sending ${data.length} characters...`);
            
            // Convert to Uint8Array
            const encoder = new TextEncoder();
            const dataArray = encoder.encode(data);
            
            console.log(`📦 Data array: ${dataArray.length} bytes`);
            
            // SIMPLE SEND - just send it all at once
            if (this.characteristic.properties.write) {
                await this.characteristic.writeValue(dataArray);
            } else if (this.characteristic.properties.writeWithoutResponse) {
                await this.characteristic.writeValueWithoutResponse(dataArray);
            } else {
                throw new Error('No write capability');
            }
            
            console.log('✅ Data sent successfully');
            return true;
            
        } catch (error) {
            console.error('Send error:', error);
            
            // Try ONE retry with smaller data
            console.log('🔄 Trying retry with simple text...');
            try {
                // Send simpler test data
                const testData = 'Test\n';
                const encoder = new TextEncoder();
                const testArray = encoder.encode(testData);
                
                if (this.characteristic.properties.write) {
                    await this.characteristic.writeValue(testArray);
                } else {
                    await this.characteristic.writeValueWithoutResponse(testArray);
                }
                
                console.log('✅ Retry successful with test data');
                
                // Now try original data in VERY small chunks
                await this.sendDataInTinyChunks(data);
                return true;
                
            } catch (retryError) {
                console.error('Retry failed:', retryError);
                throw new Error(`ပို့မရ: ${error.message}`);
            }
        }
    }

    // Send data in tiny chunks (fallback)
    async sendDataInTinyChunks(data) {
        const encoder = new TextEncoder();
        const dataArray = encoder.encode(data);
        const chunkSize = 10; // VERY small
        
        console.log(`🔀 Sending in ${chunkSize} byte chunks...`);
        
        for (let i = 0; i < dataArray.length; i += chunkSize) {
            const chunk = dataArray.slice(i, i + chunkSize);
            
            if (this.characteristic.properties.write) {
                await this.characteristic.writeValue(chunk);
            } else {
                await this.characteristic.writeValueWithoutResponse(chunk);
            }
            
            // Tiny delay
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        console.log('✅ All chunks sent');
    }

    // GENERATE SIMPLE RECEIPT - PLAIN TEXT ONLY
    generateReceipt(receipt) {
        console.log('Generating receipt...');
        
        let receiptText = '';
        
        // Header
        receiptText += '\n\n'; // Start with blank lines
        receiptText += '==============================\n';
        receiptText += centerText(receipt.shopName, 30) + '\n';
        receiptText += '==============================\n\n';
        
        receiptText += centerText(receipt.address, 30) + '\n';
        receiptText += centerText(receipt.phone, 30) + '\n\n';
        
        receiptText += `ဘောင်ချာအမှတ်: ${receipt.invoiceNo.toString().padStart(3, '0')}\n`;
        receiptText += `ရက်စွဲ: ${new Date(receipt.date).toLocaleDateString('my-MM')}\n`;
        receiptText += `အချိန်: ${new Date(receipt.date).toLocaleTimeString('my', {hour: '2-digit', minute:'2-digit'})}\n\n`;
        
        receiptText += '------------------------------\n';
        receiptText += 'ကုန်ပစ္စည်း'.padEnd(18) + 'Qty'.padEnd(5) + 'စုစုပေါင်း\n';
        receiptText += '------------------------------\n';
        
        // Items
        receipt.items.forEach(item => {
            const name = item.product.name.length > 16 ? 
                        item.product.name.substring(0, 13) + '...' : 
                        item.product.name;
            const total = item.product.price * item.quantity;
            
            receiptText += name.padEnd(18) + 
                          item.quantity.toString().padEnd(5) + 
                          total.toString().padStart(8) + ' ks\n';
        });
        
        receiptText += '------------------------------\n';
        
        // Totals
        receiptText += 'စုစုပေါင်း:'.padEnd(23) + receipt.subtotal.toString().padStart(7) + ' ks\n';
        receiptText += 'ဝန်ဆောင်ခ:'.padEnd(23) + receipt.serviceFee.toString().padStart(7) + ' ks\n';
        receiptText += 'ကျသင့်ငွေ:'.padEnd(23) + receipt.grandTotal.toString().padStart(7) + ' ks\n\n';
        
        receiptText += '******************************\n';
        receiptText += centerText('ကျေးဇူးတင်ပါသည်', 30) + '\n';
        receiptText += '******************************\n\n\n\n\n\n\n';
        
        // Add many blank lines for paper cutting
        receiptText += '\n\n\n\n\n';
        
        console.log('Receipt generated:', receiptText.length, 'chars');
        return receiptText;
        
        function centerText(text, width) {
            if (text.length >= width) return text;
            const left = Math.floor((width - text.length) / 2);
            const right = width - text.length - left;
            return ' '.repeat(left) + text + ' '.repeat(right);
        }
    }

    // MAIN PRINT FUNCTION - WITH PROGRESS INDICATOR
    async printReceipt(receipt) {
        if (this.isPrinting) {
            throw new Error('Already printing, please wait...');
        }
        
        this.isPrinting = true;
        this.showStatus('ပုံနှိပ်နေသည်...', 'info');
        
        try {
            // Ensure connected
            if (!this.isConnected) {
                this.showStatus('Printer ချိတ်ဆက်နေသည်...', 'info');
                await this.connect();
            }
            
            // Generate receipt
            const receiptText = this.generateReceipt(receipt);
            
            // Send to printer
            console.log('Starting print...');
            await this.sendData(receiptText);
            
            this.showStatus('ပုံနှိပ်ပြီးပါပြီ', 'success');
            console.log('✅ Print completed successfully');
            
            return true;
            
        } catch (error) {
            console.error('Print failed:', error);
            this.showStatus(`ပုံနှိပ်မရ: ${error.message}`, 'error');
            throw error;
            
        } finally {
            this.isPrinting = false;
        }
    }

    // TEST FUNCTION - SIMPLE
    async testPrint() {
        try {
            this.showStatus('Test ပုံနှိပ်နေသည်...', 'info');
            
            if (!this.isConnected) {
                await this.connect();
            }
            
            const testText = '\n\n' +
                           'TEST PRINT SUCCESSFUL\n' +
                           '=====================\n' +
                           'POS System Test\n' +
                           new Date().toLocaleString() + '\n' +
                           '✅ Working correctly!\n\n\n\n\n\n\n';
            
            await this.sendData(testText);
            
            this.showStatus('Test အောင်မြင်ပါသည်', 'success');
            return true;
            
        } catch (error) {
            this.showStatus(`Test မအောင်မြင်: ${error.message}`, 'error');
            throw error;
        }
    }

    // Disconnect
    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.characteristic = null;
        this.updateStatus();
        console.log('✅ Disconnected from printer');
    }

    // Quick status check
    getStatus() {
        return {
            connected: this.isConnected,
            printing: this.isPrinting,
            deviceName: this.device ? this.device.name : 'None'
        };
    }
}