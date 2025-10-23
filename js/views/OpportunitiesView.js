/**
 * Opportunities View
 * Handles the UI for the opportunities dashboard
 */

import BaseView from './BaseView.js';

class OpportunitiesView extends BaseView {
    constructor() {
        super('dashboardContainer');
        this.charts = {};
    }

    /**
     * Generate HTML for opportunities dashboard
     */
    generateHTML(data) {
        const summary = data?.summary || {};
        const opportunities = data?.opportunities || [];
        const filters = data?.filters || {};

        return `
            <div class="dashboard-opportunities">
                <!-- Filters Section -->
                <div class="filters-section">
                    <form id="opportunitiesFilters" class="filters-form">
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
                            <label for="statusFilter">Status:</label>
                            <select id="statusFilter" name="status">
                                <option value="all" ${filters.status === 'all' ? 'selected' : ''}>All Statuses</option>
                                <option value="new" ${filters.status === 'new' ? 'selected' : ''}>New</option>
                                <option value="progress" ${filters.status === 'progress' ? 'selected' : ''}>In Progress</option>
                                <option value="closed_won" ${filters.status === 'closed_won' ? 'selected' : ''}>Closed Won</option>
                                <option value="closed_lost" ${filters.status === 'closed_lost' ? 'selected' : ''}>Closed Lost</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Apply Filters</button>
                    </form>
                </div>

                <!-- KPI Cards -->
                <div class="kpi-grid" id="kpiContainer">
                    ${this.generateKPICards(summary)}
                </div>

                <!-- Charts Grid -->
                <div class="charts-grid">
                    <div class="chart-container">
                        <h2>Pipeline Trend</h2>
                        <div class="chart-wrapper">
                            <canvas id="trendChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-container">
                        <h2>Opportunities by Status</h2>
                        <div class="chart-wrapper">
                            <canvas id="statusChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-container">
                        <h2>Opportunities by Category</h2>
                        <div class="chart-wrapper">
                            <canvas id="categoryChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-container">
                        <h2>Performance by Assignee</h2>
                        <div class="chart-wrapper">
                            <canvas id="assigneeChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Opportunities Table -->
                <div class="table-container">
                    <div class="table-header">
                        <h2>Recent Opportunities</h2>
                        <div class="table-actions">
                            <span class="table-count">Showing ${opportunities.length} opportunities</span>
                        </div>
                    </div>
                    <div class="table-scroll">
                        <table class="data-table" id="opportunitiesTable">
                            <thead>
                                <tr>
                                    <th>Opportunity ID</th>
                                    <th>Date Created</th>
                                    <th>Customer</th>
                                    <th>Category</th>
                                    <th>Assigned To</th>
                                    <th>Status</th>
                                    <th>Age</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateTableRows(opportunities)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate KPI cards HTML
     */
    generateKPICards(summary) {
        return `
            <div class="kpi-card">
                <h3>Total Pipeline Value</h3>
                <div class="kpi-value">${this.formatCurrencyK(summary.totalPipelineValue || 0)}</div>
                <div class="kpi-trend trend-up">↑ 15% vs last quarter</div>
            </div>
            <div class="kpi-card">
                <h3>Active Opportunities</h3>
                <div class="kpi-value">${summary.activeOpportunities || 0}</div>
                <div class="kpi-trend">→ Stable vs last month</div>
            </div>
            <div class="kpi-card">
                <h3>Average Deal Size</h3>
                <div class="kpi-value">${this.formatCurrencyK(summary.averageDealSize || 0)}</div>
                <div class="kpi-trend trend-up">↑ 8% vs last quarter</div>
            </div>
            <div class="kpi-card">
                <h3>Average Deal Age</h3>
                <div class="kpi-value">${summary.averageDealAge || 0} days</div>
                <div class="kpi-trend trend-down">↓ 2 days vs last month</div>
            </div>
            <div class="kpi-card">
                <h3>Win Rate</h3>
                <div class="kpi-value">${summary.winRate || 0}%</div>
                <div class="kpi-trend trend-up">↑ 5% year-to-date</div>
            </div>
        `;
    }

    /**
     * Generate table rows HTML
     */
    generateTableRows(opportunities) {
        if (!opportunities || opportunities.length === 0) {
            return `
                <tr>
                    <td colspan="8" class="text-center">
                        No opportunities found matching current filters
                    </td>
                </tr>
            `;
        }

        return opportunities.map(opp => `
            <tr>
                <td>${opp.opportunity_id || 'N/A'}</td>
                <td>${this.formatDate(opp.date_created)}</td>
                <td>${opp.customer_name || 'Unknown Customer'}</td>
                <td>${this.getOpportunityCategory(opp)}</td>
                <td>${opp.assigned_to || 'Unassigned'}</td>
                <td>
                    <span class="status-badge status-${opp.status || 'new'}">
                        ${this.formatStatus(opp.status)}
                    </span>
                </td>
                <td>${Math.round(opp.age || 0)} days</td>
                <td>${this.formatCurrency(opp.amount || 0)}</td>
            </tr>
        `).join('');
    }

    /**
     * Get opportunity category
     */
    getOpportunityCategory(opportunity) {
        if (opportunity.product_details && opportunity.product_details.length > 0) return 'Products';
        if (opportunity.services_details && opportunity.services_details.length > 0) return 'Services';
        return 'General';
    }

    /**
     * Format status for display
     */
    formatStatus(status) {
        if (!status) return 'New';
        return status.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        this.elements = {
            filtersForm: document.getElementById('opportunitiesFilters'),
            kpiContainer: document.getElementById('kpiContainer'),
            trendChart: document.getElementById('trendChart'),
            statusChart: document.getElementById('statusChart'),
            categoryChart: document.getElementById('categoryChart'),
            assigneeChart: document.getElementById('assigneeChart'),
            opportunitiesTable: document.getElementById('opportunitiesTable')
        };
    }

    /**
     * Bind event listeners
     */
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

    /**
     * Initialize charts with data
     */
    initCharts(chartData) {
        if (!chartData) return;

        this.initTrendChart(chartData.trend);
        this.initStatusChart(chartData.byStatus);
        this.initCategoryChart(chartData.byCategory);
        this.initAssigneeChart(chartData.byAssignee);
    }

    /**
     * Initialize trend chart
     */
    initTrendChart(trendData) {
        if (!this.elements.trendChart) return;

        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        this.charts.trend = new Chart(this.elements.trendChart, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [
                    {
                        label: 'Pipeline Value ($)',
                        data: trendData.values,
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Opportunity Count',
                        data: trendData.counts,
                        borderColor: '#4cc9f0',
                        backgroundColor: 'rgba(76, 201, 240, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Pipeline Value ($)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Opportunity Count'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.dataset.label.includes('Value')) {
                                    label += '$' + context.parsed.y.toLocaleString();
                                } else {
                                    label += context.parsed.y;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize status chart
     */
    initStatusChart(statusData) {
        if (!this.elements.statusChart) return;

        if (this.charts.status) {
            this.charts.status.destroy();
        }

        const labels = Object.keys(statusData);
        const data = Object.values(statusData);
        const backgroundColors = this.generateColors(labels.length);

        this.charts.status = new Chart(this.elements.statusChart, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label;
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize category chart
     */
    initCategoryChart(categoryData) {
        if (!this.elements.categoryChart) return;

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);

        this.charts.category = new Chart(this.elements.categoryChart, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Opportunities',
                    data: data,
                    backgroundColor: '#4361ee',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Opportunities'
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize assignee chart
     */
    initAssigneeChart(assigneeData) {
        if (!this.elements.assigneeChart) return;

        if (this.charts.assignee) {
            this.charts.assignee.destroy();
        }

        const labels = Object.keys(assigneeData);
        const counts = labels.map(name => assigneeData[name].count);
        const values = labels.map(name => assigneeData[name].totalValue / 1000); // Convert to K

        this.charts.assignee = new Chart(this.elements.assigneeChart, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Opportunity Count',
                        data: counts,
                        backgroundColor: '#4361ee',
                        borderWidth: 0,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Pipeline Value ($K)',
                        data: values,
                        backgroundColor: '#4cc9f0',
                        borderWidth: 0,
                        type: 'line',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Opportunity Count'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Pipeline Value ($K)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Generate colors for charts
     */
    generateColors(count) {
        const baseColors = [
            '#4361ee', '#4cc9f0', '#2ecc71', '#f39c12', '#e74c3c',
            '#9b59b6', '#1abc9c', '#34495e', '#e67e22', '#95a5a6'
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }

    /**
     * Update charts with new data
     */
    updateCharts(chartData) {
        this.initCharts(chartData);
    }

    /**
     * Clean up charts and event listeners
     */
    destroy() {
        // Destroy all charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};

        // Call parent destroy
        super.destroy();
    }
}

export default OpportunitiesView;