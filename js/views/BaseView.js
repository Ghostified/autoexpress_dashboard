/**
 * Base View Class
 * Provides common functionality for all views
 */

class BaseView {
    constructor(containerId) {
        this.containerId = containerId;
        this.elements = {};
        this.isRendered = false;
    }

    /**
     * Render the view with data
     */
    render(data = {}) {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container #${this.containerId} not found`);
            return;
        }

        try {
            const html = this.generateHTML(data);
            container.innerHTML = html;
            this.bindElements();
            this.bindEvents();
            this.isRendered = true;
            this.onRenderComplete(data);
        } catch (error) {
            console.error('Error rendering view:', error);
            this.showError('Failed to render view');
        }
    }

    /**
     * Generate HTML for the view (must be implemented by child classes)
     */
    generateHTML(data) {
        throw new Error('generateHTML method must be implemented by child class');
    }

    /**
     * Bind DOM elements to this.elements (can be overridden by child classes)
     */
    bindElements() {
        // Child classes can override this to cache DOM elements
    }

    /**
     * Bind event listeners (must be implemented by child classes)
     */
    bindEvents() {
        throw new Error('bindEvents method must be implemented by child class');
    }

    /**
     * Called after successful render
     */
    onRenderComplete(data) {
        // Can be overridden by child classes
    }

    /**
     * Show loading state
     */
    showLoading() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading data...</p>
                </div>
            `;
        }
    }

    /**
     * Show error state
     */
    showError(message) {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Error Loading Data</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Show empty state
     */
    showEmptyState(message = 'No data available') {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h3>No Data</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    /**
     * Update specific parts of the view without full re-render
     */
    update(data) {
        if (!this.isRendered) {
            this.render(data);
            return;
        }

        try {
            this.onUpdate(data);
        } catch (error) {
            console.error('Error updating view:', error);
            // Fall back to full render
            this.render(data);
        }
    }

    /**
     * Handle view updates (can be overridden by child classes)
     */
    onUpdate(data) {
        // Child classes can implement partial updates here
    }

    /**
     * Format currency amount
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    }

    /**
     * Format currency in thousands (K)
     */
    formatCurrencyK(amount) {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        }
        return `$${(amount / 1000).toFixed(1)}K`;
    }

    /**
     * Format date from timestamp
     */
    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        
        try {
            const date = new Date(parseInt(timestamp));
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    /**
     * Format relative time (e.g., "2 days ago")
     */
    formatRelativeTime(timestamp) {
        if (!timestamp) return 'N/A';
        
        try {
            const date = new Date(parseInt(timestamp));
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            return `${Math.floor(diffDays / 30)} months ago`;
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * Clean up view and remove event listeners
     */
    destroy() {
        this.isRendered = false;
        this.elements = {};
        // Child classes should override to clean up specific event listeners
    }
}

export default BaseView;