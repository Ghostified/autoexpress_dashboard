/**
 * Main Application Entry Point
 * Initializes the CRM dashboard and manages dashboard switching
 */

import Config from './config.js';
import ApiService from './services/ApiService.js';
import OpportunitiesController from './controllers/OpportunitiesController.js';
import SalesOrdersController from './controllers/SalesOrdersController.js';

class CRMApplication {
    constructor() {
        this.currentController = null;
        this.apiService = null;
        this.isInitialized = false;
        this.currentDashboard = 'opportunities';
        
        // Bind methods to maintain context
        this.init = this.init.bind(this);
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleGlobalActions = this.handleGlobalActions.bind(this);
        this.showError = this.showError.bind(this);
        this.hideError = this.hideError.bind(this);
        this.openEmailModal = this.openEmailModal.bind(this);
        this.handleEmailSubmit = this.handleEmailSubmit.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.showLoading();
            
            // Initialize API service
            this.apiService = new ApiService(Config.API.baseURL);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load default dashboard (Opportunities)
            await this.loadDashboard('opportunities');
            
            this.hideLoading();
            this.isInitialized = true;
            
            console.log('CRM Application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize the application. Please refresh the page.');
        }
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Dashboard navigation
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const dashboardType = e.target.dataset.dashboard;
                this.handleNavigation(dashboardType);
            });
        });

        // Global actions
        document.getElementById('refreshData').addEventListener('click', this.handleGlobalActions);
        document.getElementById('exportPdf').addEventListener('click', this.handleGlobalActions);
        document.getElementById('emailReport').addEventListener('click', this.handleGlobalActions);
        document.getElementById('retryButton').addEventListener('click', this.init);

        // Modal handlers
        this.setupModalHandlers();
    }

    /**
     * Set up modal event handlers
     */
    setupModalHandlers() {
        const modal = document.getElementById('emailModal');
        const closeBtn = document.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelEmail');

        [closeBtn, cancelBtn].forEach(btn => {
            btn?.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });

        // Handle form submission
        document.getElementById('emailForm').addEventListener('submit', this.handleEmailSubmit);
    }

    /**
     * Handle dashboard navigation
     */
    async handleNavigation(dashboardType) {
        if (!this.isInitialized) return;

        try {
            // Update active navigation
            this.updateActiveNav(dashboardType);
            
            // Load the selected dashboard
            await this.loadDashboard(dashboardType);
            
        } catch (error) {
            console.error(`Failed to load ${dashboardType} dashboard:`, error);
            this.showError(`Failed to load ${dashboardType} dashboard`);
        }
    }

    /**
     * Update active navigation state
     */
    updateActiveNav(activeDashboard) {
        this.currentDashboard = activeDashboard;
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.dashboard === activeDashboard);
        });
    }

    /**
     * Load and initialize a dashboard
     */
    async loadDashboard(dashboardType) {
        // Clean up current controller
        if (this.currentController) {
            await this.currentController.destroy();
        }

        this.showLoading();

        try {
            // Initialize the appropriate controller based on dashboard type
            switch (dashboardType) {
                case 'opportunities':
                    this.currentController = new OpportunitiesController(this.apiService);
                    break;
                case 'sales-orders':
                    this.currentController = new SalesOrdersController(this.apiService);
                    break;
                case 'helpdesk':
                    // Show placeholder for helpdesk
                    this.showHelpdeskPlaceholder();
                    this.hideLoading();
                    return;
                default:
                    throw new Error(`Unknown dashboard type: ${dashboardType}`);
            }

            // Initialize the dashboard
            await this.currentController.init();
            
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            throw error;
        }
    }

    /**
     * Show helpdesk placeholder
     */
    showHelpdeskPlaceholder() {
        const container = document.getElementById('dashboardContainer');
        container.innerHTML = `
            <div class="dashboard-helpdesk">
                <div class="coming-soon">
                    <div class="coming-soon-icon">🎫</div>
                    <h2>Helpdesk Dashboard Coming Soon</h2>
                    <p>We're building a comprehensive helpdesk analytics dashboard to track support tickets and customer service metrics.</p>
                    <div class="features-list">
                        <div class="feature-item">
                            <span class="feature-icon">📞</span>
                            <span>Ticket volume tracking</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">⏱️</span>
                            <span>Response time analytics</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">✅</span>
                            <span>Resolution rate monitoring</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">😊</span>
                            <span>Customer satisfaction scores</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Handle global actions (refresh, export, email)
     */
    handleGlobalActions(e) {
        if (!this.currentController && this.currentDashboard !== 'helpdesk') return;

        const action = e.target.id;

        switch (action) {
            case 'refreshData':
                if (this.currentController) {
                    this.currentController.refreshData();
                }
                break;
            case 'exportPdf':
                if (this.currentController) {
                    this.currentController.exportToPDF();
                } else {
                    this.showNotification('PDF export not available for this dashboard', 'info');
                }
                break;
            case 'emailReport':
                this.openEmailModal();
                break;
        }
    }

    /**
     * Open email modal
     */
    openEmailModal() {
        const modal = document.getElementById('emailModal');
        
        // Set default subject based on current dashboard
        const subjectInput = document.getElementById('emailSubject');
        const dashboardName = this.getDashboardName(this.currentDashboard);
        subjectInput.value = `Company A - ${dashboardName} Report - ${new Date().toLocaleDateString()}`;
        
        // Pre-fill recipient if available
        const recipientInput = document.getElementById('recipientEmail');
        const storedEmail = localStorage.getItem('user_email');
        if (storedEmail) {
            recipientInput.value = storedEmail;
        }
        
        modal.classList.remove('hidden');
    }

    /**
     * Get display name for dashboard
     */
    getDashboardName(dashboardType) {
        const names = {
            'opportunities': 'Opportunities',
            'sales-orders': 'Sales Orders',
            'helpdesk': 'Helpdesk'
        };
        return names[dashboardType] || 'Dashboard';
    }

    /**
     * Handle email form submission
     */
    async handleEmailSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const emailData = {
            recipient: formData.get('recipientEmail'),
            subject: formData.get('emailSubject'),
            message: formData.get('emailMessage')
        };

        // Validate email
        if (!this.validateEmail(emailData.recipient)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        try {
            this.showNotification('Sending email...', 'info');
            
            if (this.currentController) {
                await this.currentController.sendEmailReport(emailData);
            } else {
                // Fallback for dashboards without controllers
                await this.sendGenericEmailReport(emailData);
            }
            
            document.getElementById('emailModal').classList.add('hidden');
            this.showNotification('Email sent successfully!', 'success');
            
        } catch (error) {
            this.showNotification('Failed to send email', 'error');
        }
    }

    /**
     * Validate email address
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Send generic email report (fallback)
     */
    async sendGenericEmailReport(emailData) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Email sent:', emailData);
                resolve({ success: true });
            }, 1500);
        });
    }

    /**
     * Show loading state
     */
    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('dashboardContainer').classList.add('hidden');
        document.getElementById('errorState').classList.add('hidden');
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('dashboardContainer').classList.remove('hidden');
    }

    /**
     * Show error state
     */
    showError(message) {
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorState.classList.remove('hidden');
        document.getElementById('dashboardContainer').classList.add('hidden');
        this.hideLoading();
    }

    /**
     * Hide error state
     */
    hideError() {
        document.getElementById('errorState').classList.add('hidden');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Get icon for notification type
     */
    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    /**
     * Clean up application
     */
    destroy() {
        if (this.currentController) {
            this.currentController.destroy();
        }
        
        // Remove event listeners
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        
        console.log('CRM Application destroyed');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new CRMApplication();
    app.init();

    // Make app globally available for debugging
    window.crmApp = app;
});

export default CRMApplication;