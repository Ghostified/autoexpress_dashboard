import BaseController from './BaseController.js';
import AdminView from '../views/AdminView.js';
import SchedulerService from '../services/SchedulerService.js';

class AdminController extends BaseController {
    constructor(apiService) {
        const view = new AdminView();
        super({
            addListener: () => {},
            removeListener: () => {},
            getIsLoading: () => false
        }, view);
        this.apiService = apiService;
        this.scheduler = new SchedulerService(apiService);
        this.dashboardType = 'admin';
    }

    setupViewHandlers() {
        this.view.onAddJob = (payload) => {
            this.scheduler.addJob(payload);
            this.view.render();
            this.showSuccess('Job added');
        };
        this.view.onDeleteJob = (id) => {
            this.scheduler.removeJob(id);
            this.view.render();
            this.showSuccess('Job deleted');
        };
    }

    async loadData() {
        this.view.render();
        const isAdmin = this.checkAdmin();
        if (!isAdmin) {
            this.view.showError('Unauthorized. Admin only.');
            return;
        }
        this.scheduler.start();
    }

    checkAdmin() {
        try {
            const role = localStorage.getItem('crm_role');
            return role === 'admin';
        } catch { return false; }
    }
}

export default AdminController;
