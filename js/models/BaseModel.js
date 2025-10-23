/**
 * Base Model Class
 * Provides common functionality for all data models
 */

class BaseModel {
    constructor(apiService) {
        this.apiService = apiService;
        this.data = null;
        this.listeners = [];
        this.isLoading = false;
    }

    /**
     * Fetch data from API endpoint
     */
    async fetchData(endpoint, params = {}) {
        if (this.isLoading) return;

        this.isLoading = true;
        try {
            this.data = await this.apiService.get(endpoint, params);
            this.isLoading = false;
            this.notifyListeners();
            return this.data;
        } catch (error) {
            this.isLoading = false;
            console.error(`Error fetching data from ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Post data to API endpoint
     */
    async postData(endpoint, data) {
        try {
            const result = await this.apiService.post(endpoint, data);
            this.notifyListeners();
            return result;
        } catch (error) {
            console.error(`Error posting data to ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Add data change listener
     */
    addListener(listener) {
        this.listeners.push(listener);
    }

    /**
     * Remove data change listener
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    /**
     * Notify all listeners of data changes
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.data);
            } catch (error) {
                console.error('Error in model listener:', error);
            }
        });
    }

    /**
     * Get current data
     */
    getData() {
        return this.data;
    }

    /**
     * Check if data is currently loading
     */
    getIsLoading() {
        return this.isLoading;
    }

    /**
     * Clear all data and listeners
     */
    destroy() {
        this.data = null;
        this.listeners = [];
        this.isLoading = false;
    }
}

export default BaseModel;