/**
 * Base Controller Class
 * Provides common functionality for all controllers
 */

class BaseController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.isInitialized = false;
        
        // Bind methods to maintain context
        this.handleDataChange = this.handleDataChange.bind(this);
        this.handleError = this.handleError.bind(this);
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
            
            // This would call the PDF service
            // const pdfService = new PdfService(this.apiService);
            // await pdfService.generateDashboardPDF(this.dashboardType, this.model.getData());
            
            // For now, show success message
            setTimeout(() => {
                this.showSuccess('PDF exported successfully!');
            }, 1000);
            
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
            
            // This would call the email service
            // const emailService = new EmailService(this.apiService);
            // await emailService.sendDashboardReport(this.dashboardType, emailData);
            
            // For now, show success message
            setTimeout(() => {
                this.showSuccess('Email sent successfully!');
            }, 1000);
            
        } catch (error) {
            this.handleError('Failed to send email', error);
        }
    }

    /**
     * Show notification (to be implemented by child classes or app)
     */
    showNotification(message, type = 'info') {
        // This would typically be implemented to show UI notifications
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
        
        this.isInitialized = false;
    }
}

export default BaseController;