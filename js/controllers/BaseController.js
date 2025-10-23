/**
 * Base Controller Class
 * Provides common functionality for all controllers
 */

import Config from '../config.js';
import PdfService from '../services/PdfService.js';
import EmailService from '../services/EmailService.js';

class BaseController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.isInitialized = false;
        this.refreshTimer = null;
        
        // Bind methods to maintain context
        this.handleDataChange = this.handleDataChange.bind(this);
        this.handleError = this.handleError.bind(this);
        this.setupAutoRefresh = this.setupAutoRefresh.bind(this);
    }

    /**
     * Initialize the controller
     */
    async init() {
        if (this.isInitialized) return;

        try {
            // Set up model listeners
            this.model.addListener(this.handleDataChange);
            
            // Set up view event handlers
            this.setupViewHandlers();
            
            // Load initial data
            await this.loadData();
            
            this.isInitialized = true;
            this.setupAutoRefresh();
            
        } catch (error) {
            console.error('Controller initialization failed:', error);
            this.handleError('Failed to initialize dashboard');
        }
    }

    /**
     * Load data for the controller (must be implemented by child classes)
     */
    async loadData() {
        throw new Error('loadData method must be implemented by child class');
    }

    /**
     * Set up view event handlers (must be implemented by child classes)
     */
    setupViewHandlers() {
        throw new Error('setupViewHandlers method must be implemented by child class');
    }

    /**
     * Handle data changes from model
     */
    handleDataChange(data) {
        try {
            this.view.update(data);
            
            // Additional processing for chart data
            if (data && this.processChartData) {
                const chartData = this.processChartData(data);
                this.view.updateCharts(chartData);
            }
            
        } catch (error) {
            console.error('Error handling data change:', error);
            this.handleError('Failed to update view with new data');
        }
    }

    /**
     * Handle errors
     */
    handleError(message, error = null) {
        console.error(message, error);
        this.view.showError(message);
        
        // Show notification if available
        if (this.showNotification) {
            this.showNotification(message, 'error');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        console.log('Success:', message);
        
        // Show notification if available
        if (this.showNotification) {
            this.showNotification(message, 'success');
        }
    }

    /**
     * Refresh data
     */
    async refreshData() {
        try {
            this.view.showLoading();
            await this.loadData();
        } catch (error) {
            this.handleError('Failed to refresh data', error);
        }
    }

    /**
     * Export to PDF
     */
    async exportToPDF() {
        try {
            this.showNotification('Generating PDF...', 'info');

            const pdfService = new PdfService(this.apiService);
            const filters = typeof this.model.getFilters === 'function' ? this.model.getFilters() : {};
            const response = await pdfService.generateDashboardPDF(this.dashboardType, this.model.getData(), filters);

            if (response && response.id) {
                await this.apiService.downloadPDF(response.id);
            }
            this.showSuccess('PDF exported successfully!');
            
        } catch (error) {
            this.handleError('Failed to export PDF', error);
        }
    }

    /**
     * Send email report
     */
    async sendEmailReport(emailData) {
        try {
            this.showNotification('Sending email...', 'info');

            const emailService = new EmailService(this.apiService);
            await emailService.sendDashboardReport(this.dashboardType, emailData);
            this.showSuccess('Email sent successfully!');
            
        } catch (error) {
            this.handleError('Failed to send email', error);
        }
    }

    /**
     * Show notification (to be implemented by child classes or app)
     */
    showNotification(message, type = 'info') {
        if (window.crmApp && typeof window.crmApp.showNotification === 'function') {
            window.crmApp.showNotification(message, type);
            return;
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * Clean up controller
     */
    destroy() {
        if (this.model) {
            this.model.removeListener(this.handleDataChange);
        }
        
        if (this.view) {
            this.view.destroy();
        }

        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        
        this.isInitialized = false;
    }

    /**
     * Set up auto refresh based on config
     */
    setupAutoRefresh() {
        try {
            if (!this.dashboardType) return;
            const dashboardCfg = Config?.DASHBOARDS?.[this.dashboardType];
            if (!dashboardCfg) return;

            const enable = Config?.UI?.autoRefresh && dashboardCfg?.features?.realTimeUpdates;
            const intervalMs = dashboardCfg?.refreshInterval || 300000;

            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }

            if (enable) {
                this.refreshTimer = setInterval(() => {
                    // Avoid overlapping refreshes
                    if (!this.model.getIsLoading()) {
                        this.refreshData();
                    }
                }, intervalMs);
            }
        } catch (e) {
            console.warn('Failed to set up auto refresh', e);
        }
    }
}

export default BaseController;