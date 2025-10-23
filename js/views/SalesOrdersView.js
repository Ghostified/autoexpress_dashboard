/**
 * Sales Orders View
 * Handles the UI for the sales orders dashboard
 */

import BaseView from './BaseView.js';

class SalesOrdersView extends BaseView {
    constructor() {
        super('dashboardContainer');
    }

    /**
     * Generate HTML for sales orders dashboard
     */
    generateHTML(data) {
        const summary = data?.summary || {};
        const orders = data?.orders || [];

        return `
            <div class="dashboard-sales-orders">
                <div class="dashboard-header">
                    <h1>Sales Orders Dashboard</h1>
                    <p>Track and manage all sales orders</p>
                </div>

                <!-- KPI Cards -->
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <h3>Total Order Value</h3>
                        <div class="kpi-value">${this.formatCurrencyK(summary.totalOrderValue || 0)}</div>
                        <div class="kpi-trend trend-up">↑ 12% vs last quarter</div>
                    </div>
                    <div class="kpi-card">
                        <h3>Total Orders</h3>
                        <div class="kpi-value">${summary.totalOrders || 0}</div>
                        <div class="kpi-trend trend-up">↑ 8% vs last month</div>
                    </div>
                    <div class="kpi-card">
                        <h3>Avg Order Value</h3>
                        <div class="kpi-value">${this.formatCurrency(summary.avgOrderValue || 0)}</div>
                        <div class="kpi-trend trend-up">↑ 5% vs last quarter</div>
                    </div>
                    <div class="kpi-card">
                        <h3>Fulfillment Rate</h3>
                        <div class="kpi-value">${summary.fulfillmentRate || 0}%</div>
                        <div class="kpi-trend trend-up">↑ 3% vs last month</div>
                    </div>
                </div>

                <!-- Coming Soon Message -->
                <div class="coming-soon">
                    <div class="coming-soon-icon">🚀</div>
                    <h2>Sales Orders Dashboard Coming Soon</h2>
                    <p>We're working hard to bring you comprehensive sales order analytics.</p>
                    <div class="features-list">
                        <div class="feature-item">
                            <span class="feature-icon">📊</span>
                            <span>Order trend analysis</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">📦</span>
                            <span>Inventory tracking</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">🚚</span>
                            <span>Shipping analytics</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">💰</span>
                            <span>Revenue forecasting</span>
                        </div>
                    </div>
                </div>

                <!-- Sample Table -->
                <div class="table-container">
                    <h2>Recent Sales Orders</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Items</th>
                                <th>Total Value</th>
                                <th>Assigned To</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(order => `
                                <tr>
                                    <td>${order.order_number}</td>
                                    <td>${order.customer_name}</td>
                                    <td>${this.formatDate(order.date_created)}</td>
                                    <td>
                                        <span class="status-badge status-${order.status}">
                                            ${this.formatStatus(order.status)}
                                        </span>
                                    </td>
                                    <td>${order.items}</td>
                                    <td>${this.formatCurrency(order.total_order_value)}</td>
                                    <td>${order.assigned_to}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Format status for display
     */
    formatStatus(status) {
        if (!status) return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Sales orders specific event listeners would go here
    }
}

export default SalesOrdersView;