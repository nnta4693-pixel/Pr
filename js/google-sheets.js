// ===== GOOGLE SHEETS SERVICE =====
class GoogleSheetsService {
    constructor() {
        this.baseURL = CONFIG.get('GOOGLE_SCRIPT_URL');
        this.isOnline = true;
    }

    // Network status check
    async checkNetworkStatus() {
        try {
            const testUrl = `${this.baseURL}?action=testConnection`;
            
            const response = await fetch(testUrl, {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            this.isOnline = result.success;
            return this.isOnline;
            
        } catch (error) {
            this.isOnline = false;
            return false;
        }
    }

    // Generic request method - GET only to avoid CORS
    async makeRequest(action, data = {}) {
        // Check if we have sheet ID for relevant actions
        if (!data.sheetId && action !== 'getProducts' && action !== 'testConnection') {
            throw new Error('Google Sheet ID is required');
        }

        try {
            const url = new URL(this.baseURL);
            url.searchParams.append('action', action);
            
            // Add all data as URL parameters
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    if (typeof data[key] === 'object') {
                        url.searchParams.append(key, JSON.stringify(data[key]));
                    } else {
                        url.searchParams.append(key, data[key]);
                    }
                }
            });

            console.log(`Making ${action} request to:`, url.toString());

            const response = await fetch(url.toString(), {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Request failed');
            }

            return result;

        } catch (error) {
            console.error(`Google Sheets ${action} error:`, error);
            
            // More specific error messages
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network connection failed. Please check your internet connection.');
            } else if (error.message.includes('HTTP 404')) {
                throw new Error('Google Apps Script not found. Please check the script URL.');
            } else if (error.message.includes('HTTP 500')) {
                throw new Error('Server error. Please try again later.');
            } else {
                throw new Error(`Network error: ${error.message}`);
            }
        }
    }

    // Specific API methods
    async getProducts(sheetId) {
        return await this.makeRequest('getProducts', { sheetId });
    }

    async addProduct(sheetId, product) {
        return await this.makeRequest('addProduct', { sheetId, product });
    }

    async updateProduct(sheetId, product) {
        return await this.makeRequest('updateProduct', { sheetId, product });
    }

    async deleteProduct(sheetId, productId) {
        return await this.makeRequest('deleteProduct', { sheetId, productId });
    }

    async testConnection() {
        return await this.makeRequest('testConnection');
    }
}