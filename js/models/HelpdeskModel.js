/**
 * Helpdesk Data Model
 * Handles helpdesk tickets data and business logic
 */

import BaseModel from './BaseModel.js';

class HelpdeskModel extends BaseModel {
    constructor(apiService) {
        super(apiService);
        this.summary = null;
        this.tickets = [];
        this.filters = {
            dateRange: '30',
            status: 'all',
            priority: 'all',
            assignedTo: 'all',
            category: 'all'
        };
    }

    async fetchTickets(filters = {}) {
        this.filters = { ...this.filters, ...filters };
        try {
            const data = await this.apiService.get('/helpdesk-tickets', this.filters);
            this.tickets = this.normalizeTickets(data.tickets || data || []);
        } catch (e) {
            // Fallback minimal mock
            this.tickets = this.normalizeTickets([
                {
                    customer_name: 'John Doe',
                    customer_email: 'johndoe@example.com',
                    customer_phone: '12345678',
                    customer_type: 'grages',
                    customer_rating: '4.5',
                    company: 'ABC',
                    ticket_id: '12334',
                    location: 'General Mathenge',
                    age: '12',
                    status: 'Closed',
                    source: 'email',
                    category: 'general inquiry',
                    disposition: 'job inquiry',
                    sub_disposition: 'internship',
                    comments: 'This is an example',
                    date_created: '2025-08-14 09:35:00',
                    ticket_closure_date: '2025-08-15 14:20:00',
                    created_by: 'Jane Doe',
                    assigned_to: 'John Dalton',
                    asset_name: 'KBY105R',
                    additional_variables: [{ 'Response Type': 'Open' }]
                }
            ]);
        }

        this.summary = this.calculateSummary(this.tickets);
        this.data = {
            tickets: this.applyFilters(this.tickets),
            summary: this.summary,
            filters: this.filters,
            lastUpdated: new Date().toISOString()
        };
        this.notifyListeners();
        return this.data;
    }

    normalizeTickets(list) {
        return list.map(t => ({
            customer_name: t.customer_name || 'Unknown',
            customer_email: t.customer_email || '',
            customer_phone: t.customer_phone || '',
            customer_type: t.customer_type || '',
            customer_rating: t.customer_rating || '',
            company: t.company || '',
            ticket_id: t.ticket_id || t.id || '',
            location: t.location || '',
            age: String(t.age || '').replace(/[^0-9.]/g, ''),
            status: (t.status || 'Open').toLowerCase().replace(/\s+/g,'_'),
            source: t.source || '',
            category: t.category || '',
            disposition: t.disposition || '',
            sub_disposition: t.sub_disposition || '',
            comments: t.comments || '',
            date_created: this.parseDateToTs(t.date_created),
            ticket_closure_date: this.parseDateToTs(t.ticket_closure_date),
            created_by: t.created_by || '',
            assigned_to: t.assigned_to || 'Unassigned',
            asset_name: t.asset_name || '',
            additional_variables: t.additional_variables || []
        }));
    }

    parseDateToTs(value) {
        if (!value) return null;
        const ts = Date.parse(value);
        return isNaN(ts) ? null : String(ts);
    }

    applyFilters(tickets) {
        const { dateRange, status, assignedTo, category } = this.filters;
        const now = Date.now();
        const rangeDays = parseInt(dateRange || '30', 10);
        const minTs = now - rangeDays * 86400000;

        return tickets.filter(t => {
            const created = parseInt(t.date_created, 10);
            const within = isNaN(created) ? true : created >= minTs;
            const statusOk = status === 'all' || t.status === status;
            const assignedOk = assignedTo === 'all' || t.assigned_to === assignedTo;
            const categoryOk = category === 'all' || (t.category || '').toLowerCase() === category.toLowerCase();
            return within && statusOk && assignedOk && categoryOk;
        });
    }

    calculateSummary(tickets) {
        if (!tickets || tickets.length === 0) {
            return { totalTickets: 0, openTickets: 0, closedTickets: 0, avgAgeHours: 0, avgClosureHours: 0 };
        }
        const total = tickets.length;
        const open = tickets.filter(t => ['open','in_progress','pending'].includes(t.status)).length;
        const closed = tickets.filter(t => ['closed','resolved','closed_won','closed_lost'].includes(t.status)).length;
        const avgAge = Math.round(
            tickets.reduce((sum, t) => sum + (parseFloat(t.age) || 0), 0) / total
        );
        const avgClosure = Math.round(
            tickets.reduce((sum, t) => {
                const start = parseInt(t.date_created, 10);
                const end = parseInt(t.ticket_closure_date, 10);
                if (!isNaN(start) && !isNaN(end)) {
                    return sum + Math.max(0, (end - start) / 3600000);
                }
                return sum;
            }, 0) / total
        );
        return { totalTickets: total, openTickets: open, closedTickets: closed, avgAgeHours: avgAge, avgClosureHours: avgClosure };
    }

    getFilters() {
        return { ...this.filters };
    }

    async updateFilters(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
        return await this.fetchTickets();
    }

    getChartData() {
        return {
            byStatus: this.groupBy(t => t.status),
            byCategory: this.groupBy(t => (t.category || 'General')),
            byAssignee: this.groupByAssignee()
        };
    }

    groupBy(keyFn) {
        const map = {};
        this.tickets.forEach(t => {
            const key = keyFn(t);
            map[key] = (map[key] || 0) + 1;
        });
        return map;
    }

    groupByAssignee() {
        const map = {};
        this.tickets.forEach(t => {
            const name = t.assigned_to || 'Unassigned';
            map[name] = (map[name] || 0) + 1;
        });
        return map;
    }
}

export default HelpdeskModel;
