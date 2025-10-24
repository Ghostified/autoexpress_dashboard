/**
 * Helpdesk Controller
 * Manages the helpdesk dashboard business logic
 */

import BaseController from './BaseController.js';
import HelpdeskModel from '../models/HelpdeskModel.js';
import HelpdeskView from '../views/HelpdeskView.js';

class HelpdeskController extends BaseController {
    constructor(apiService) {
        const model = new HelpdeskModel(apiService);
        const view = new HelpdeskView();
        super(model, view);
        this.apiService = apiService;
        this.dashboardType = 'helpdesk';
    }

    setupViewHandlers() {
        this.view.onFiltersChange = (filters) => this.handleFiltersChange(filters);
    }

    async loadData() {
        try {
            this.view.showLoading();
            await this.model.fetchTickets();
        } catch (e) {
            this.handleError('Failed to load helpdesk data', e);
        }
    }

    async handleFiltersChange(filters) {
        try {
            this.view.showLoading();
            await this.model.updateFilters(filters);
            this.showSuccess('Filters applied successfully');
        } catch (e) {
            this.handleError('Failed to apply filters', e);
        }
    }

    processChartData() {
        return this.model.getChartData();
    }
}

export default HelpdeskController;
