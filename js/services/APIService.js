/**
 * API Service - Handles all HTTP requests to the backend
 * Provides centralized API communication with error handling and retry logic
 */

class ApiService {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('crm_auth_token');
        this.pendingRequests = new Map();
        this.requestCounter = 0;
        this.mockMode = this.shouldUseMockMode(baseURL);
    }

    /**
     * Determine mock mode based on URL or local setting
     */
    shouldUseMockMode(baseURL) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('mock') === '1') return true;
            const stored = localStorage.getItem('crm_mock_mode');
            if (stored === 'true') return true;
            if (!baseURL || baseURL === 'mock') return true;
            // In file:// contexts, avoid network
            if (window.location.protocol === 'file:') return true;
        } catch {}
        return false;
    }

    /**
     * Make a generic HTTP request with error handling and retry logic
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise} - Resolves with parsed JSON response
     */
    async request(endpoint, options = {}) {
        const requestId = this.generateRequestId();
        const url = `${this.baseURL}${endpoint}`;
        
        // Default headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        // Add authorization header if token exists
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Add company identification
        headers['X-Company-ID'] = 'company_a';
        headers['X-Request-ID'] = requestId;

        const config = {
            method: 'GET',
            timeout: 30000, // 30 seconds
            ...options,
            headers
        };

        // Remove headers from options to avoid duplication
        delete config.headers;

        try {
            console.log(`API Request [${requestId}]: ${config.method} ${url}`);

            // Create abort controller for timeout
            const abortController = new AbortController();
            const timeoutId = setTimeout(() => abortController.abort(), config.timeout);
            
            const response = await fetch(url, {
                ...config,
                headers: headers,
                signal: abortController.signal
            });

            clearTimeout(timeoutId);

            // Handle HTTP errors
            if (!response.ok) {
                throw await this.handleHTTPError(response, requestId);
            }

            // Parse response
            const data = await this.parseResponse(response, requestId);
            
            console.log(`API Response [${requestId}]: Success`);
            return data;

        } catch (error) {
            console.error(`API Request [${requestId}] failed:`, error);
            
            // Retry logic for certain error types
            if (this.shouldRetry(error) && (!options.retryCount || options.retryCount < 3)) {
                console.log(`Retrying request [${requestId}]...`);
                return this.retryRequest(endpoint, options, requestId, error);
            }

            throw this.normalizeError(error, requestId);
        }
    }

    /**
     * Handle HTTP error responses
     */
    async handleHTTPError(response, requestId) {
        const status = response.status;
        let message = `HTTP ${status}`;
        let details = null;

        try {
            const errorData = await response.json();
            message = errorData.message || message;
            details = errorData.details || null;
        } catch {
            // If response is not JSON, use status text
            message = response.statusText || message;
        }

        const error = new Error(message);
        error.status = status;
        error.details = details;
        error.requestId = requestId;

        // Handle specific status codes
        switch (status) {
            case 401:
                error.type = 'AUTH_ERROR';
                this.handleAuthError();
                break;
            case 403:
                error.type = 'FORBIDDEN';
                break;
            case 404:
                error.type = 'NOT_FOUND';
                break;
            case 429:
                error.type = 'RATE_LIMIT';
                break;
            case 500:
                error.type = 'SERVER_ERROR';
                break;
            case 502:
            case 503:
            case 504:
                error.type = 'NETWORK_ERROR';
                break;
            default:
                error.type = 'HTTP_ERROR';
        }

        return error;
    }

    /**
     * Parse API response
     */
    async parseResponse(response, requestId) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType && contentType.includes('text/')) {
            return await response.text();
        } else {
            // For other content types (like PDF), return blob
            return await response.blob();
        }
    }

    /**
     * Determine if a request should be retried
     */
    shouldRetry(error) {
        const retryableErrors = [
            'NETWORK_ERROR',
            'TIMEOUT',
            'SERVER_ERROR',
            'RATE_LIMIT'
        ];
        
        return retryableErrors.includes(error.type) || 
               error.message.includes('Network') ||
               error.message.includes('Failed to fetch');
    }

    /**
     * Retry a failed request
     */
    async retryRequest(endpoint, options, requestId, originalError) {
        const retryCount = (options.retryCount || 0) + 1;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s
        
        console.log(`Retry ${retryCount} for request [${requestId}] after ${delay}ms`);

        await new Promise(resolve => setTimeout(resolve, delay));

        return this.request(endpoint, {
            ...options,
            retryCount: retryCount
        });
    }

    /**
     * Normalize error object
     */
    normalizeError(error, requestId) {
        // If it's already our error type, return it
        if (error.type && error.requestId) {
            return error;
        }

        // Create normalized error
        const normalizedError = new Error(error.message || 'Unknown API error');
        normalizedError.type = this.determineErrorType(error);
        normalizedError.requestId = requestId;
        normalizedError.originalError = error;

        return normalizedError;
    }

    /**
     * Determine error type from various error conditions
     */
    determineErrorType(error) {
        if (error.name === 'AbortError') {
            return 'TIMEOUT';
        }
        if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
            return 'NETWORK_ERROR';
        }
        if (error.message.includes('JSON')) {
            return 'PARSE_ERROR';
        }
        return 'UNKNOWN_ERROR';
    }

    /**
     * Handle authentication errors (token expired, invalid, etc.)
     */
    handleAuthError() {
        // Clear invalid token
        this.clearToken();
        
        // Redirect to login or show auth modal
        this.triggerAuthRequired();
    }

    /**
     * Trigger authentication required event
     */
    triggerAuthRequired() {
        const event = new CustomEvent('auth-required', {
            detail: { message: 'Please log in again' }
        });
        window.dispatchEvent(event);
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${++this.requestCounter}`;
    }

    // ===== SPECIFIC API METHODS =====

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        if (this.mockMode) {
            return this.mockGet(endpoint, params);
        }
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data) {
        if (this.mockMode) {
            return this.mockPost(endpoint, data);
        }
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data) {
        if (this.mockMode) {
            // Simulate preferences save locally
            if (endpoint === '/user/preferences') {
                localStorage.setItem('crm_user_preferences', JSON.stringify(data));
                return { success: true, preferences: data };
            }
        }
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ===== BUSINESS SPECIFIC METHODS =====

    /**
     * Fetch opportunities data with filters
     */
    async getOpportunities(filters = {}) {
        return this.get('/opportunities', {
            date_range: filters.dateRange || '90',
            status: filters.status || 'all',
            assigned_to: filters.assignedTo || 'all',
            category: filters.category || 'all',
            page: filters.page || 1,
            limit: filters.limit || 100
        });
    }

    /**
     * Fetch sales orders data with filters
     */
    async getSalesOrders(filters = {}) {
        return this.get('/sales-orders', {
            date_range: filters.dateRange || '90',
            status: filters.status || 'all',
            page: filters.page || 1,
            limit: filters.limit || 100
        });
    }

    /**
     * Fetch helpdesk tickets data
     */
    async getHelpdeskTickets(filters = {}) {
        return this.get('/helpdesk-tickets', {
            date_range: filters.dateRange || '30',
            status: filters.status || 'open',
            priority: filters.priority || 'all',
            page: filters.page || 1,
            limit: filters.limit || 50
        });
    }

    /**
     * Generate PDF report for dashboard
     */
    async generatePDF(dashboardType, data, filters = {}) {
        return this.post('/pdf/generate', {
            dashboard_type: dashboardType,
            data: data,
            filters: filters,
            company: 'company_a',
            timestamp: new Date().toISOString(),
            options: {
                format: 'A4',
                orientation: 'portrait',
                include_charts: true,
                include_tables: true
            }
        });
    }

    /**
     * Download generated PDF
     */
    async downloadPDF(pdfId) {
        if (this.mockMode) {
            // Simulate immediate download success
            const blob = new Blob([`Mock PDF ${pdfId}`], { type: 'application/pdf' });
            return this.handleFileDownload(blob, `dashboard-report-${pdfId}.pdf`);
        }
        const response = await this.request(`/pdf/download/${pdfId}`);
        
        // Handle blob response for file download
        if (response instanceof Blob) {
            return this.handleFileDownload(response, `dashboard-report-${pdfId}.pdf`);
        }
        
        return response;
    }

    /**
     * Send email with dashboard report
     */
    async sendEmail(emailData) {
        return this.post('/email/send', {
            to: Array.isArray(emailData.recipient) ? emailData.recipient : [emailData.recipient],
            subject: emailData.subject,
            message: emailData.message,
            dashboard_type: emailData.dashboardType,
            company: 'company_a',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get dashboard summary data
     */
    async getDashboardSummary() {
        return this.get('/dashboard/summary');
    }

    /**
     * Get user preferences
     */
    async getUserPreferences() {
        return this.get('/user/preferences');
    }

    /**
     * Update user preferences
     */
    async updateUserPreferences(preferences) {
        return this.put('/user/preferences', preferences);
    }

    // ===== AUTH METHODS =====

    /**
     * Login user
     */
    async login(credentials) {
        const response = await this.post('/auth/login', credentials);
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            console.warn('Logout API call failed, clearing token locally:', error);
        } finally {
            this.clearToken();
        }
    }

    /**
     * Refresh authentication token
     */
    async refreshToken() {
        const response = await this.post('/auth/refresh');
        
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('crm_auth_token', token);
        
        // Notify about token change
        window.dispatchEvent(new CustomEvent('auth-token-changed', {
            detail: { hasToken: !!token }
        }));
    }

    /**
     * Clear authentication token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('crm_auth_token');
        
        // Notify about token removal
        window.dispatchEvent(new CustomEvent('auth-token-changed', {
            detail: { hasToken: false }
        }));
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token;
    }

    // ===== UTILITY METHODS =====

    /**
     * Handle file download from blob
     */
    handleFileDownload(blob, filename) {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true, filename };
    }

    /**
     * Cancel pending request by ID
     */
    cancelRequest(requestId) {
        // In a real implementation, we might use AbortController
        console.log(`Canceling request: ${requestId}`);
        // This would need to be implemented with actual abort logic
    }

    /**
     * Get request statistics
     */
    getStats() {
        return {
            totalRequests: this.requestCounter,
            pendingRequests: this.pendingRequests.size
        };
    }

    /**
     * Health check - test API connectivity
     */
    async healthCheck() {
        try {
            const response = await this.get('/health', {}, { timeout: 5000 });
            return {
                status: 'healthy',
                responseTime: response.responseTime,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Mock data for development/demo purposes
     */
    async getMockOpportunities() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            opportunities: [
                {
                    opportunity_id: "OP 662800",
                    opportunity_number: "1755066275263x905617189420662800",
                    customer_name: "John Smith",
                    customer_email: "john.smith@example.com",
                    customer_phone: "+1234567890",
                    customer_type: "Existing",
                    customer_rating: "A",
                    company: "Company A",
                    location: "New York",
                    age: "1154.2",
                    status: "progress",
                    source: "Chat",
                    campaign: "Web Chat",
                    product_details: [
                        {
                            name: "Enterprise Suite",
                            category: "Software",
                            quantity: 1,
                            unit_price: 50000,
                            total_price: 50000
                        }
                    ],
                    services_details: [
                        {
                            name: "Implementation",
                            category: "Professional Services",
                            quantity: 1,
                            unit_price: 15000,
                            total_price: 15000
                        }
                    ],
                    comments: "Opp Created from Chat. Subject: Do you have Archie comics been looking for them for a while 🙂",
                    date_created: "1755066206661",
                    created_by: "Sharon Kwamboka",
                    assigned_to: "Sharon Kwamboka",
                    Asset_Name: [],
                    amount: 65000
                },
                {
                    opportunity_id: "OP 849600",
                    opportunity_number: "1755066281548x628851611965849600",
                    customer_name: "Sarah Johnson",
                    customer_email: "sarah.j@example.com",
                    customer_phone: "+1234567891",
                    customer_type: "New",
                    customer_rating: "B",
                    company: "Company A",
                    location: "Chicago",
                    age: "1154.2",
                    status: "new",
                    source: "Referral",
                    campaign: "Partner Program",
                    product_details: [
                        {
                            name: "Business Pro",
                            category: "Software",
                            quantity: 2,
                            unit_price: 25000,
                            total_price: 50000
                        }
                    ],
                    services_details: [],
                    comments: "Referred by existing customer Mark Wilson",
                    date_created: "1755066212909",
                    created_by: "David Chen",
                    assigned_to: "David Chen",
                    Asset_Name: [],
                    amount: 50000
                },
                {
                    opportunity_id: "OP 491810",
                    opportunity_number: "1755066298765x123456789012345678",
                    customer_name: "Mike Thompson",
                    customer_email: "mike.t@example.com",
                    customer_phone: "+1234567892",
                    customer_type: "Existing",
                    customer_rating: "A+",
                    company: "Company A",
                    location: "San Francisco",
                    age: "20.5",
                    status: "closed_won",
                    source: "Website",
                    campaign: "Enterprise Campaign",
                    product_details: [
                        {
                            name: "Enterprise Platform",
                            category: "Software",
                            quantity: 1,
                            unit_price: 120000,
                            total_price: 120000
                        }
                    ],
                    services_details: [
                        {
                            name: "Custom Development",
                            category: "Professional Services",
                            quantity: 1,
                            unit_price: 45000,
                            total_price: 45000
                        },
                        {
                            name: "Training",
                            category: "Education",
                            quantity: 1,
                            unit_price: 15000,
                            total_price: 15000
                        }
                    ],
                    comments: "Enterprise customer expanding their usage",
                    date_created: "1755066221234",
                    created_by: "Maria Garcia",
                    assigned_to: "Maria Garcia",
                    Asset_Name: [],
                    amount: 180000
                }
            ],
            summary: {
                totalPipelineValue: 295000,
                activeOpportunities: 3,
                averageDealSize: 98333,
                averageDealAge: 776,
                winRate: 33,
                totalOpportunities: 3
            },
            pagination: {
                page: 1,
                limit: 100,
                total: 3,
                pages: 1
            }
        };
    }

    /**
     * Mock GET router
     */
    async mockGet(endpoint, params = {}) {
        // Normalize endpoint (strip query)
        const path = endpoint.split('?')[0];
        // Simulated small network latency
        await new Promise(r => setTimeout(r, 200));

        if (path === '/opportunities') {
            const mock = await this.getMockOpportunities();
            return mock;
        }
        if (path === '/sales-orders') {
            return this.getMockSalesOrders();
        }
        if (path === '/dashboard/summary') {
            const opp = await this.getMockOpportunities();
            const so = await this.getMockSalesOrders();
            return {
                opportunities: opp.summary,
                salesOrders: this.summarizeSalesOrders(so.orders)
            };
        }
        if (path === '/helpdesk-tickets') {
            return {
                tickets: [
                    { id: 'HD-1001', status: 'open', priority: 'high', subject: 'Login issue', created_at: Date.now() - 86400000 },
                    { id: 'HD-1002', status: 'in_progress', priority: 'medium', subject: 'Billing discrepancy', created_at: Date.now() - 43200000 }
                ],
                pagination: { page: 1, total: 2 }
            };
        }
        if (path === '/user/preferences') {
            const prefs = localStorage.getItem('crm_user_preferences');
            return prefs ? JSON.parse(prefs) : { theme: 'light', pageSize: 25 };
        }
        // Default empty
        return {};
    }

    /**
     * Mock POST router
     */
    async mockPost(endpoint, data) {
        await new Promise(r => setTimeout(r, 200));
        if (endpoint === '/pdf/generate') {
            return { id: `pdf_${Date.now()}`, status: 'generated' };
        }
        if (endpoint === '/email/send') {
            return { success: true };
        }
        if (endpoint === '/auth/login') {
            const token = `mock_${Date.now()}`;
            this.setToken(token);
            return { token };
        }
        if (endpoint === '/auth/logout') {
            this.clearToken();
            return { success: true };
        }
        if (endpoint === '/auth/refresh') {
            const token = `mock_${Date.now()}`;
            this.setToken(token);
            return { token };
        }
        return { success: true };
    }

    /**
     * Mock sales orders data
     */
    getMockSalesOrders() {
        return {
            orders: [
                {
                    order_id: 'SO-2024-001',
                    order_number: 'SO-2024-001',
                    customer_name: 'Global Tech Inc',
                    date_created: String(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    status: 'delivered',
                    total_order_value: 18450,
                    items: 3,
                    assigned_to: 'David Chen'
                },
                {
                    order_id: 'SO-2024-002',
                    order_number: 'SO-2024-002', 
                    customer_name: 'Nexus Solutions',
                    date_created: String(Date.now() - 4 * 24 * 60 * 60 * 1000),
                    status: 'shipped',
                    total_order_value: 12800,
                    items: 2,
                    assigned_to: 'Sarah Jones'
                },
                {
                    order_id: 'SO-2024-003',
                    order_number: 'SO-2024-003',
                    customer_name: 'Inghb Corporation',
                    date_created: String(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    status: 'processing',
                    total_order_value: 24300,
                    items: 5,
                    assigned_to: 'Maria Garcia'
                }
            ]
        };
    }

    summarizeSalesOrders(orders) {
        if (!orders || orders.length === 0) return { totalOrderValue: 0, totalOrders: 0, deliveredOrders: 0, avgOrderValue: 0, fulfillmentRate: 0 };
        const totalValue = orders.reduce((s, o) => s + (o.total_order_value || 0), 0);
        const delivered = orders.filter(o => o.status === 'delivered').length;
        return {
            totalOrderValue: totalValue,
            totalOrders: orders.length,
            deliveredOrders: delivered,
            avgOrderValue: Math.round(totalValue / orders.length),
            fulfillmentRate: Math.round((delivered / orders.length) * 100)
        };
    }
}

export default ApiService;