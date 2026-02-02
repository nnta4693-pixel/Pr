

// ===== RECEIPT MANAGEMENT =====
class ReceiptManager {
    constructor(dataManager, uiManager) {
        this.dataManager = dataManager;
        this.uiManager = uiManager;
    }

    // Generate receipt data
    generateReceipt() {
        const cartSummary = this.dataManager.cart;
        const serviceFee = parseInt(document.getElementById('serviceFee').value) || 0;
        
        return {
            id: Date.now(),
            shopName: this.dataManager.shopInfo.name,
            address: this.dataManager.shopInfo.address,
            phone: this.dataManager.shopInfo.phone,
            invoiceNo: this.dataManager.shopInfo.invoiceNo,
            date: new Date().toISOString(),
            items: [...cartSummary],
            subtotal: this.dataManager.calculateSubtotal(),
            serviceFee: serviceFee,
            grandTotal: this.dataManager.calculateTotal(serviceFee)
        };
    }

    // Save receipt to history
    saveReceipt() {
        if (this.dataManager.cart.length === 0) {
            this.uiManager.showAlert('ဘောင်ချာထဲတွင် ကုန်ပစ္စည်းမရှိပါ!', 'error');
            return false;
        }

        try {
            const receipt = this.generateReceipt();
            this.dataManager.saveReceipt(receipt);
            this.dataManager.clearCart();
            
            this.uiManager.showAlert('ဘောင်ချာသိမ်းဆည်းပြီးပါပြီ!', 'success');
            return true;
            
        } catch (error) {
            this.uiManager.showAlert(`Error saving receipt: ${error.message}`, 'error');
            return false;
        }
    }

    // Update preview display
    updatePreview() {
        const receipt = this.generateReceipt();
        
        // Update shop info
        document.getElementById('previewShopName').textContent = receipt.shopName;
        document.getElementById('previewAddress').textContent = receipt.address;
        document.getElementById('previewPhone').textContent = receipt.phone;
        document.getElementById('previewInvoiceNo').textContent = receipt.invoiceNo.toString().padStart(3, '0');
        document.getElementById('previewInvoiceDate').textContent = new Date(receipt.date).toLocaleDateString();
        
        // Update items
        const previewItemsDiv = document.getElementById('previewItems');
        previewItemsDiv.innerHTML = '';
        
        receipt.items.forEach(item => {
            const itemTotal = item.product.price * item.quantity;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.product.name}</td>
                <td>${item.quantity} x ${item.product.price}</td>
                <td><strong>${itemTotal} ks</strong></td>
            `;
            previewItemsDiv.appendChild(tr);
        });
        
        // Update totals
        document.getElementById('previewSubtotal').textContent = receipt.subtotal + ' ks';
        document.getElementById('previewServiceFee').textContent = receipt.serviceFee + ' ks';
        document.getElementById('previewGrandTotal').textContent = receipt.grandTotal + ' ks';
    }

    // Export receipt to Excel
    exportReceiptToExcel(receiptData = null) {
        const receipt = receiptData || this.generateReceipt();
        
        try {
            const excelData = [
                [receipt.shopName],
                [receipt.address],
                [receipt.phone],
                [`ဘောင်ချာအမှတ်: ${receipt.invoiceNo.toString().padStart(3, '0')}`],
                [`ရက်စွဲ: ${new Date(receipt.date).toLocaleDateString()}`],
                [],
                ['ကုန်ပစ္စည်း', 'အရေအတွက်', 'ဈေးနှုန်း', 'စုစုပေါင်း']
            ];

            receipt.items.forEach(item => {
                excelData.push([
                    item.product.name,
                    item.quantity,
                    item.product.price + ' ks',
                    (item.quantity * item.product.price) + ' ks'
                ]);
            });

            excelData.push([]);
            excelData.push(['စုစုပေါင်း:', '', '', receipt.subtotal + ' ks']);
            excelData.push(['ဝန်ဆောင်ခ:', '', '', receipt.serviceFee + ' ks']);
            excelData.push(['ကျသင့်ငွေ:', '', '', receipt.grandTotal + ' ks']);

            const ws = XLSX.utils.aoa_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Receipt');

            const timestamp = new Date(receipt.date).toISOString().replace(/[:.]/g, '-');
            const filename = `${receipt.shopName.replace(/\s+/g, '_')}_Receipt_${receipt.invoiceNo}_${timestamp}`;

            XLSX.writeFile(wb, `${filename}.xlsx`);
            this.uiManager.showAlert('Excel ဖိုင်ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ!', 'success');
            
        } catch (error) {
            this.uiManager.showAlert(`Error exporting receipt: ${error.message}`, 'error');
        }
    }

    // View receipt history
    viewHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.dataManager.receiptHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>မှတ်တမ်းမရှိသေးပါ</p>
                </div>
            `;
        } else {
            historyList.innerHTML = '';
            this.dataManager.receiptHistory.forEach(receipt => {
                const receiptDate = new Date(receipt.date);
                const formattedDate = receiptDate.toLocaleDateString() + ' ' + receiptDate.toLocaleTimeString();
                
                const receiptDiv = document.createElement('div');
                receiptDiv.className = 'card';
                receiptDiv.style.marginBottom = '10px';
                receiptDiv.style.cursor = 'pointer';
                receiptDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="font-weight: 700;">${receipt.shopName}</div>
                        <div style="font-size: 12px; color: #666;">${formattedDate}</div>
                    </div>
                    <div style="margin-top: 8px;">
                        <span>ဘောင်ချာ #${receipt.invoiceNo.toString().padStart(3, '0')}</span>
                        <span style="float: right; font-weight: 700; color: #4CAF50;">${receipt.grandTotal} ks</span>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">
                        ကုန်ပစ္စည်း ${receipt.items.length} ခု
                    </div>
                `;
                
                receiptDiv.addEventListener('click', () => {
                    this.exportReceiptToExcel(receipt);
                });
                
                historyList.appendChild(receiptDiv);
            });
        }
        
        document.getElementById('historyModal').classList.remove('hidden');
    }

    // Close history modal
    closeHistory() {
        document.getElementById('historyModal').classList.add('hidden');
    }
}