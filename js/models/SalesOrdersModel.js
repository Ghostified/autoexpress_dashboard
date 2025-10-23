/**
 * Sales Orders Data Model
 * Handles sales orders data and business logic
 */

import BaseModel from './BaseModel.js';

class SalesOrdersModel extends BaseModel {
    constructor(apiService) {
        super(apiService);
        this.summary = null;
        this.orders = [];
        this.filters = {
            dateRange: '90',
            status: 'all',
            category: 'all'
        };
    }

    /**
     * Fetch sales orders data with current filters
     */
    async fetchSalesOrders(filters = {}) {
        this.filters = { ...this.filters, ...filters };
        try {
            const data = await this.apiService.get('/sales-orders', this.filters);
            this.orders = (data && data.orders) ? data.orders : [];
            if (!this.orders.length && data && Array.isArray(data)) {
                // Some APIs might return array directly
                this.orders = data;
            }
        } catch (e) {
            const mock = this.generateMockData();
            this.orders = mock.orders;
        }

        this.summary = this.calculateSummary(this.orders);
        
        this.data = {
            orders: this.orders,
            summary: this.summary,
            filters: this.filters,
            lastUpdated: new Date().toISOString()
        };
        
        this.notifyListeners();
        return this.data;
    }

    /**
     * Generate mock sales orders data
     */
    generateMockData() {
        return {
            orders: [
                {
                    order_id: 'SO-2024-001',
                    order_number: 'SO-2024-001',
                    customer_name: 'Global Tech Inc',
                    date_created: '1704067200000',
                    status: 'delivered',
                    total_order_value: 18450,
                    items: 3,
                    assigned_to: 'David Chen'
                },
                {
                    order_id: 'SO-2024-002',
                    order_number: 'SO-2024-002', 
                    customer_name: 'Nexus Solutions',
                    date_created: '1703980800000',
                    status: 'shipped',
                    total_order_value: 12800,
                    items: 2,
                    assigned_to: 'Sarah Jones'
                },
                {
                    order_id: 'SO-2024-003',
                    order_number: 'SO-2024-003',
                    customer_name: 'Inghb Corporation',
                    date_created: '1703894400000',
                    status: 'processing',
                    total_order_value: 24300,
                    items: 5,
                    assigned_to: 'Maria Garcia'
                }
                // Add more mock orders as needed
            ]
        };
    }

    /**
     * Calculate summary statistics
     */
    calculateSummary(orders) {
        if (!orders || orders.length === 0) {
            return this.getEmptySummary();
        }

        const totalValue = orders.reduce((sum, order) => sum + (order.total_order_value || 0), 0);
        const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
        const avgOrderValue = totalValue / orders.length;

        return {
            totalOrderValue: totalValue,
            totalOrders: orders.length,
            deliveredOrders: deliveredOrders,
            avgOrderValue: avgOrderValue,
            fulfillmentRate: Math.round((deliveredOrders / orders.length) * 100)
        };
    }

    /**
     * Get empty summary
     */
    getEmptySummary() {
        return {
            totalOrderValue: 0,
            totalOrders: 0,
            deliveredOrders: 0,
            avgOrderValue: 0,
            fulfillmentRate: 0
        };
    }

    /**
     * Update filters and refresh data
     */
    async updateFilters(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
        return await this.fetchSalesOrders();
    }
}

export default SalesOrdersModel;