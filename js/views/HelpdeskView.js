/**
 * Helpdesk View - Full dashboard for helpdesk
 */

import BaseView from './BaseView.js';

class HelpdeskView extends BaseView {
    constructor() {
        super('dashboardContainer');
        this.charts = {};
    }

    generateHTML(data = {}) {
        const summary = data?.summary || {};
        const tickets = data?.tickets || [];
        const filters = data?.filters || {};
        const assignees = this.getUniqueAssignees(tickets);

        return `
            <div class="dashboard-helpdesk">
                <!-- KPI Cards -->
                <div class="kpi-grid">
                    ${this.generateKPICards(summary)}
                </div>

                <!-- Filters -->
                <div class="filters-section">
                    <form id="helpdeskFilters" class="filters-form">
                        <div class="filter-group">
                            <label for="dateRange">Date Range:</label>
                            <select id="dateRange" name="dateRange">
                                <option value="7" ${filters.dateRange === '7' ? 'selected' : ''}>Last 7 Days</option>
                                <option value="30" ${filters.dateRange === '30' ? 'selected' : ''}>Last 30 Days</option>
                                <option value="90" ${filters.dateRange === '90' ? 'selected' : ''}>Last Quarter</option>
                                <option value="365" ${filters.dateRange === '365' ? 'selected' : ''}>Last Year</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="status">Status:</label>
                            <select id="status" name="status">
                                <option value="all" ${filters.status === 'all' ? 'selected' : ''}>All Statuses</option>
                                <option value="open" ${filters.status === 'open' ? 'selected' : ''}>Open</option>
                                <option value="in_progress" ${filters.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                <option value="pending" ${filters.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="closed" ${filters.status === 'closed' ? 'selected' : ''}>Closed</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="assignedTo">Assigned To:</label>
                            <select id="assignedTo" name="assignedTo">
                                <option value="all" ${filters.assignedTo === 'all' ? 'selected' : ''}>All Assignees</option>
                                ${assignees.map(name => `<option value="${name}" ${filters.assignedTo === name ? 'selected' : ''}>${name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="category">Category:</label>
                            <input type="text" id="category" name="category" value="${filters.category || ''}" placeholder="e.g. general inquiry">
                        </div>
                        <button type="submit" class="btn btn-primary">Apply Filters</button>
                    </form>
                </div>

                <!-- Charts -->
                <div class="charts-grid">
                    <div class="chart-container">
                        <h2>Tickets by Status</h2>
                        <div class="chart-wrapper">
                            <canvas id="statusChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-container">
                        <h2>Tickets by Category</h2>
                        <div class="chart-wrapper">
                            <canvas id="categoryChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-container">
                        <h2>Tickets by Assignee</h2>
                        <div class="chart-wrapper">
                            <canvas id="assigneeChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Tickets Table -->
                <div class="table-container">
                    <div class="table-header">
                        <h2>Recent Tickets</h2>
                        <div class="table-actions">
                            <span class="table-count">Showing ${tickets.length} tickets</span>
                        </div>
                    </div>
                    <div class="table-scroll">
                        <table class="data-table" id="ticketsTable">
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Date Created</th>
                                    <th>Customer</th>
                                    <th>Assigned To</th>
                                    <th>Status</th>
                                    <th>Category</th>
                                    <th>Age (hrs)</th>
                                    <th>Comments</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tickets.map(t => `
                                    <tr>
                                        <td>${t.ticket_id}</td>
                                        <td>${this.formatDate(t.date_created)}</td>
                                        <td>${t.customer_name}</td>
                                        <td>${t.assigned_to}</td>
                                        <td><span class="status-badge status-${t.status}">${this.formatStatus(t.status)}</span></td>
                                        <td>${t.category || 'General'}</td>
                                        <td>${t.age || '0'}</td>
                                        <td>${t.comments || ''}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    generateKPICards(summary) {
        return `
            <div class="kpi-card">
                <h3>Total Tickets</h3>
                <div class="kpi-value">${summary.totalTickets || 0}</div>
            </div>
            <div class="kpi-card">
                <h3>Open Tickets</h3>
                <div class="kpi-value">${summary.openTickets || 0}</div>
            </div>
            <div class="kpi-card">
                <h3>Closed Tickets</h3>
                <div class="kpi-value">${summary.closedTickets || 0}</div>
            </div>
            <div class="kpi-card">
                <h3>Avg Age</h3>
                <div class="kpi-value">${summary.avgAgeHours || 0} hrs</div>
            </div>
            <div class="kpi-card">
                <h3>Avg Closure Time</h3>
                <div class="kpi-value">${summary.avgClosureHours || 0} hrs</div>
            </div>
        `;
    }

    bindElements() {
        this.elements = {
            filtersForm: document.getElementById('helpdeskFilters'),
            statusChart: document.getElementById('statusChart'),
            categoryChart: document.getElementById('categoryChart'),
            assigneeChart: document.getElementById('assigneeChart'),
            ticketsTable: document.getElementById('ticketsTable')
        };
    }

    bindEvents() {
        if (this.elements.filtersForm) {
            this.elements.filtersForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const filters = Object.fromEntries(formData);
                if (this.onFiltersChange) {
                    this.onFiltersChange(filters);
                }
            });
        }
    }

    updateCharts(chartData) {
        this.initStatusChart(chartData.byStatus);
        this.initCategoryChart(chartData.byCategory);
        this.initAssigneeChart(chartData.byAssignee);
    }

    initStatusChart(statusData) {
        if (!this.elements.statusChart) return;
        if (this.charts.status) this.charts.status.destroy();
        const labels = Object.keys(statusData);
        const data = Object.values(statusData);
        this.charts.status = new Chart(this.elements.statusChart, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: this.generateColors(labels.length) }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    initCategoryChart(categoryData) {
        if (!this.elements.categoryChart) return;
        if (this.charts.category) this.charts.category.destroy();
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        this.charts.category = new Chart(this.elements.categoryChart, {
            type: 'bar',
            data: { labels, datasets: [{ data, label: 'Tickets', backgroundColor: '#4361ee' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    initAssigneeChart(assigneeData) {
        if (!this.elements.assigneeChart) return;
        if (this.charts.assignee) this.charts.assignee.destroy();
        const labels = Object.keys(assigneeData);
        const data = Object.values(assigneeData);
        this.charts.assignee = new Chart(this.elements.assigneeChart, {
            type: 'bar',
            data: { labels, datasets: [{ data, label: 'Tickets', backgroundColor: '#4cc9f0' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    generateColors(count) {
        const base = ['#4361ee','#4cc9f0','#2ecc71','#f39c12','#e74c3c','#9b59b6','#1abc9c','#34495e','#e67e22','#95a5a6'];
        return Array.from({ length: count }, (_, i) => base[i % base.length]);
    }

    getUniqueAssignees(tickets) {
        const set = new Set();
        tickets.forEach(t => { if (t.assigned_to) set.add(t.assigned_to); });
        return Array.from(set).sort();
    }

    destroy() {
        Object.values(this.charts).forEach(c => c?.destroy?.());
        this.charts = {};
        super.destroy();
    }

    formatStatus(status) {
        if (!status) return 'Open';
        return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
}

export default HelpdeskView;
