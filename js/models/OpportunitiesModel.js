/**
 * Opportunities Data Model
 * Handles opportunities data and business logic
 */

import BaseModel from './BaseModel.js';

class OpportunitiesModel extends BaseModel {
    constructor(apiService) {
        super(apiService);
        this.summary = null;
        this.opportunities = [];
        this.filters = {
            dateRange: '90',
            status: 'all',
            assignedTo: 'all',
            category: 'all'
        };
    }

    /**
     * Fetch opportunities data with current filters
     */
    async fetchOpportunities(filters = {}) {
        // Merge new filters with existing ones
        this.filters = { ...this.filters, ...filters };

        try {
            // Call API directly to control when listeners are notified
            const data = await this.apiService.get('/opportunities', this.filters);

            // Process the data
            this.opportunities = data.opportunities || [];
            this.summary = this.calculateSummary(this.opportunities);
        } catch (error) {
            console.warn('Opportunities API failed, falling back to mock data:', error);
            const mock = await this.apiService.getMockOpportunities();
            this.opportunities = mock.opportunities || [];
            this.summary = mock.summary || this.calculateSummary(this.opportunities);
        }

        // Update main data reference and notify listeners once
        this.data = {
            opportunities: this.opportunities,
            summary: this.summary,
            filters: this.filters,
            lastUpdated: new Date().toISOString()
        };

        this.notifyListeners();
        return this.data;
    }

    /**
     * Calculate summary statistics from opportunities data
     */
    calculateSummary(opportunities) {
        if (!opportunities || opportunities.length === 0) {
            return this.getEmptySummary();
        }

        // Calculate total pipeline value
        const totalValue = opportunities.reduce((sum, opp) => {
            return sum + (this.parseAmount(opp.amount) || 0);
        }, 0);

        // Count active opportunities (not closed)
        const activeOpps = opportunities.filter(opp => 
            opp.status && !['closed_lost', 'closed_won'].includes(opp.status)
        );

        // Calculate averages
        const avgDealSize = totalValue / opportunities.length;
        const avgAge = opportunities.reduce((sum, opp) => {
            return sum + (parseFloat(opp.age) || 0);
        }, 0) / opportunities.length;

        return {
            totalPipelineValue: totalValue,
            activeOpportunities: activeOpps.length,
            averageDealSize: avgDealSize,
            averageDealAge: Math.round(avgAge),
            winRate: this.calculateWinRate(opportunities),
            totalOpportunities: opportunities.length
        };
    }

    /**
     * Calculate win rate from historical data
     */
    calculateWinRate(opportunities) {
        const closedWon = opportunities.filter(opp => opp.status === 'closed_won').length;
        const totalClosed = opportunities.filter(opp => 
            ['closed_won', 'closed_lost'].includes(opp.status)
        ).length;
        
        return totalClosed > 0 ? Math.round((closedWon / totalClosed) * 100) : 0;
    }

    /**
     * Parse amount string to number
     */
    parseAmount(amount) {
        if (typeof amount === 'number') return amount;
        if (typeof amount === 'string') {
            // Remove currency symbols and commas
            const cleaned = amount.replace(/[$,]/g, '');
            return parseFloat(cleaned) || 0;
        }
        return 0;
    }

    /**
     * Get empty summary for no data state
     */
    getEmptySummary() {
        return {
            totalPipelineValue: 0,
            activeOpportunities: 0,
            averageDealSize: 0,
            averageDealAge: 0,
            winRate: 0,
            totalOpportunities: 0
        };
    }

    /**
     * Get opportunities by status
     */
    getOpportunitiesByStatus() {
        const statusCount = {};
        this.opportunities.forEach(opp => {
            const status = opp.status || 'unknown';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });
        return statusCount;
    }

    /**
     * Get opportunities by category
     */
    getOpportunitiesByCategory() {
        const categoryCount = {};
        this.opportunities.forEach(opp => {
            const category = this.getOpportunityCategory(opp);
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        return categoryCount;
    }

    /**
     * Determine opportunity category based on products/services
     */
    getOpportunityCategory(opportunity) {
        if (opportunity.product_details && opportunity.product_details.length > 0) {
            return 'Products';
        }
        if (opportunity.services_details && opportunity.services_details.length > 0) {
            return 'Services';
        }
        return 'General';
    }

    /**
     * Get opportunities grouped by assigned person
     */
    getOpportunitiesByAssignee() {
        const assigneeData = {};
        this.opportunities.forEach(opp => {
            const assignee = opp.assigned_to || 'Unassigned';
            if (!assigneeData[assignee]) {
                assigneeData[assignee] = {
                    count: 0,
                    totalValue: 0,
                    opportunities: []
                };
            }
            assigneeData[assignee].count++;
            assigneeData[assignee].totalValue += this.parseAmount(opp.amount);
            assigneeData[assignee].opportunities.push(opp);
        });
        return assigneeData;
    }

    /**
     * Get current filters
     */
    getFilters() {
        return { ...this.filters };
    }

    /**
     * Update filters and refresh data
     */
    async updateFilters(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
        return await this.fetchOpportunities();
    }

    /**
     * Get opportunities data for charts
     */
    getChartData() {
        return {
            byStatus: this.getOpportunitiesByStatus(),
            byCategory: this.getOpportunitiesByCategory(),
            byAssignee: this.getOpportunitiesByAssignee(),
            trend: this.generateTrendData()
        };
    }

    /**
     * Generate mock trend data (in real app, this would come from API)
     */
    generateTrendData() {
        // This would normally come from historical API data
        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            values: [450000, 520000, 480000, 610000, 580000, 630000, 590000, 680000, 720000, 631640],
            counts: [8, 10, 7, 12, 9, 11, 8, 14, 13, 9]
        };
    }
}

export default OpportunitiesModel;