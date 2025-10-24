/**
 * Admin View - Scheduler configuration
 */

import BaseView from './BaseView.js';

class AdminView extends BaseView {
    constructor() {
        super('dashboardContainer');
    }

    generateHTML() {
        const jobs = this.getJobs();
        return `
            <div class="dashboard-admin">
                <div class="kpi-grid">
                    <div class="kpi-card"><h3>Scheduled Jobs</h3><div class="kpi-value">${jobs.length}</div></div>
                </div>

                <div class="filters-section">
                    <form id="jobForm" class="filters-form">
                        <div class="filter-group">
                            <label for="dashboardType">Dashboard</label>
                            <select id="dashboardType" name="dashboardType" required>
                                <option value="opportunities">Opportunities</option>
                                <option value="salesOrders">Sales Orders</option>
                                <option value="helpdesk">Helpdesk</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="recipients">Recipients (comma separated)</label>
                            <input id="recipients" name="recipients" placeholder="alice@companya.com,bob@companya.com" required />
                        </div>
                        <div class="filter-group">
                            <label for="subject">Subject</label>
                            <input id="subject" name="subject" value="Company A - Dashboard Report" required />
                        </div>
                        <div class="filter-group">
                            <label for="message">Message</label>
                            <input id="message" name="message" value="Please find attached the latest dashboard report." />
                        </div>
                        <div class="filter-group">
                            <label for="hourUTC">Send Hour (UTC)</label>
                            <input id="hourUTC" name="hourUTC" type="number" min="0" max="23" value="6" />
                        </div>
                        <button type="submit" class="btn btn-primary">Add Job</button>
                    </form>
                </div>

                <div class="table-container">
                    <h2>Scheduled Jobs</h2>
                    <table class="data-table" id="jobsTable">
                        <thead>
                            <tr>
                                <th>Dashboard</th>
                                <th>Recipients</th>
                                <th>Hour (UTC)</th>
                                <th>Last Run</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${jobs.map(j => `
                                <tr data-id="${j.id}">
                                    <td>${j.dashboardType}</td>
                                    <td>${Array.isArray(j.recipients) ? j.recipients.join(', ') : j.recipients}</td>
                                    <td>${j.hourUTC}</td>
                                    <td>${j.lastRun || '-'}</td>
                                    <td><button class="btn btn-secondary btn-delete">Delete</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    bindElements() {
        this.elements = {
            jobForm: document.getElementById('jobForm'),
            jobsTable: document.getElementById('jobsTable')
        };
    }

    bindEvents() {
        if (this.elements.jobForm) {
            this.elements.jobForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const payload = Object.fromEntries(formData);
                payload.recipients = payload.recipients.split(',').map(s => s.trim()).filter(Boolean);
                this.onAddJob?.(payload);
            });
        }
        if (this.elements.jobsTable) {
            this.elements.jobsTable.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-delete');
                if (!btn) return;
                const tr = e.target.closest('tr');
                const id = tr?.dataset?.id;
                if (id) this.onDeleteJob?.(id);
            });
        }
    }

    getJobs() {
        try {
            const raw = localStorage.getItem('crm_scheduled_reports_v1');
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }
}

export default AdminView;
