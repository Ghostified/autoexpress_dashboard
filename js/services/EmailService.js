/**
 * Email Service - Handles sending dashboard reports via email
 */

class EmailService {
    constructor(apiService) {
        this.apiService = apiService;
    }

    /**
     * Send dashboard report via email
     */
    async sendDashboardReport(dashboardType, emailData) {
        try {
            const response = await this.apiService.post('/email/send', {
                dashboard_type: dashboardType,
                recipient: emailData.recipient,
                subject: emailData.subject,
                message: emailData.message,
                timestamp: new Date().toISOString(),
                company: 'Company A'
            });

            return response;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error('Failed to send email report');
        }
    }

    /**
     * Get email templates
     */
    async getEmailTemplates() {
        return this.apiService.get('/email/templates');
    }

    /**
     * Validate email address
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Get default email recipients
     */
    getDefaultRecipients() {
        return [
            'executive@companya.com',
            'sales@companya.com',
            'management@companya.com'
        ];
    }
}

export default EmailService;