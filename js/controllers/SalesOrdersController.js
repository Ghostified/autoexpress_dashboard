/**
 * Sales Orders Controller
 * Manages the sales orders dashboard business logic
 */

import BaseController from './BaseController.js';
import SalesOrdersModel from '../models/SalesOrdersModel.js';
import SalesOrdersView from '../views/SalesOrdersView.js';

class SalesOrdersController extends BaseController {
    constructor(apiService) {
        const model = new SalesOrdersModel(apiService);
        const view = new SalesOrdersView();
        super(model, view);
        
        this.apiService = apiService;
        this.dashboardType = 'salesOrders';
    }

    /**
     * Set up view event handlers
     */
    setupViewHandlers() {
        // Sales orders specific event handlers would go here
    }

    /**
     * Load sales orders data
     */
    async loadData() {
        try {
            this.view.showLoading();
            await this.model.fetchSalesOrders();
        } catch (error) {
            this.handleError('Failed to load sales orders data', error);
        }
    }
}

export default SalesOrdersController;