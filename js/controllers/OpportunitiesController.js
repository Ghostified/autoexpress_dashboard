/**
 * Opportunities Controller
 * Manages the opportunities dashboard business logic
 */

import BaseController from './BaseController.js';
import OpportunitiesModel from '../models/OpportunitiesModel.js';
import OpportunitiesView from '../views/OpportunitiesView.js';

class OpportunitiesController extends BaseController {
    constructor(apiService) {
        const model = new OpportunitiesModel(apiService);
        const view = new OpportunitiesView();
        super(model, view);
        
        this.apiService = apiService;
        this.dashboardType = 'opportunities';
    }

    /**
     * Set up view event handlers
     */
    setupViewHandlers() {
        // Handle filter changes
        this.view.onFiltersChange = (filters) => {
            this.handleFiltersChange(filters);
        };

        // Handle PDF export
        this.view.onExportPDF = () => {
            this.exportToPDF();
        };

        // Handle email reports
        this.view.onEmailReport = () => {
            this.openEmailModal();
        };
    }

    /**
     * Load opportunities data
     */
    async loadData() {
        try {
            this.view.showLoading();
            await this.model.fetchOpportunities();
        } catch (error) {
            this.handleError('Failed to load opportunities data', error);
        }
    }

    /**
     * Handle filter changes
     */
    async handleFiltersChange(filters) {
        try {
            this.view.showLoading();
            await this.model.updateFilters(filters);
            this.showSuccess('Filters applied successfully');
        } catch (error) {
            this.handleError('Failed to apply filters', error);
        }
    }

    /**
     * Process data for charts
     */
    processChartData(data) {
        return this.model.getChartData();
    }

    /**
     * Open email modal (would be handled by main app)
     */
    openEmailModal() {
        // This would typically trigger the main app to open the email modal
        if (window.crmApp && window.crmApp.openEmailModal) {
            window.crmApp.openEmailModal();
        } else {
            // Fallback: direct call to send email
            this.sendEmailReport({
                recipient: 'executive@companya.com',
                subject: 'Opportunities Dashboard Report',
                message: 'Please find attached the latest opportunities dashboard report.'
            });
        }
    }

    /**
     * Get current dashboard data
     */
    getDashboardData() {
        return this.model.getData();
    }

    /**
     * Get current filters
     */
    getCurrentFilters() {
        return this.model.getFilters();
    }

    /**
     * Clean up controller
     */
    destroy() {
        super.destroy();
        console.log('OpportunitiesController destroyed');
    }
}

export default OpportunitiesController;