/**
 * Scheduler Service
 * Client-side daily scheduler using localStorage + setInterval
 * Intended for admin-only view to configure periodic email reports.
 */

class SchedulerService {
    constructor(apiService) {
        this.apiService = apiService;
        this.storageKey = 'crm_scheduled_reports_v1';
        this.timer = null;
    }

    getAllJobs() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    saveAllJobs(jobs) {
        localStorage.setItem(this.storageKey, JSON.stringify(jobs));
    }

    addJob({ dashboardType, recipients, subject, message, hourUTC = 6 }) {
        const jobs = this.getAllJobs();
        const id = `job_${Date.now()}`;
        jobs.push({ id, dashboardType, recipients, subject, message, hourUTC, lastRun: null });
        this.saveAllJobs(jobs);
        return id;
    }

    removeJob(jobId) {
        const jobs = this.getAllJobs().filter(j => j.id !== jobId);
        this.saveAllJobs(jobs);
    }

    start() {
        if (this.timer) return;
        this.timer = setInterval(() => this.tick(), 60 * 1000); // check every minute
        this.tick();
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async tick() {
        const now = new Date();
        const utcHour = now.getUTCHours();
        const today = now.toISOString().slice(0, 10);
        const jobs = this.getAllJobs();
        for (const job of jobs) {
            const alreadyRanToday = job.lastRun === today;
            if (!alreadyRanToday && utcHour === Number(job.hourUTC)) {
                try {
                    await this.apiService.sendEmail({
                        recipient: job.recipients,
                        subject: job.subject,
                        message: job.message,
                        dashboardType: job.dashboardType
                    });
                    job.lastRun = today;
                } catch (e) {
                    console.error('Scheduled email failed', e);
                }
            }
        }
        this.saveAllJobs(jobs);
    }
}

export default SchedulerService;
