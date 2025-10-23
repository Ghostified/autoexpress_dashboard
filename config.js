/**
 * Company A Configuration
 * Contains all company-specific settings and API endpoints
 */

const Config = {
    // Company Information
    COMPANY: {
        id: 'company_a',
        name: 'Company A',
        logo: '/assets/images/company-a-logo.png',
        primaryColor: '#4361ee',
        supportEmail: 'support@companya.com'
    },

    // API Configuration
    API: {
        baseURL: 'https://api.companya.com/v1',
        endpoints: {
            opportunities: '/opportunities',
            salesOrders: '/sales-orders',
            helpdesk: '/helpdesk-tickets',
            pdf: '/pdf/generate',
            email: '/email/send'
        },
        timeout: 30000, // 30 seconds
        retryAttempts: 3
    },

    // Dashboard Settings
    DASHBOARDS: {
        opportunities: {
            name: 'Sales Opportunities',
            refreshInterval: 300000, // 5 minutes
            features: {
                pdfExport: true,
                emailReports: true,
                realTimeUpdates: true
            }
        },
        salesOrders: {
            name: 'Sales Orders',
            refreshInterval: 300000,
            features: {
                pdfExport: true,
                emailReports: true,
                realTimeUpdates: true
            }
        },
        helpdesk: {
            name: 'Helpdesk Tickets',
            refreshInterval: 60000, // 1 minute
            features: {
                pdfExport: false,
                emailReports: false,
                realTimeUpdates: true
            }
        }
    },

    // PDF Export Settings
    PDF: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: {
            top: 20,
            right: 15,
            bottom: 20,
            left: 15
        },
        header: {
            enabled: true,
            text: 'Company A - Executive Dashboard'
        },
        footer: {
            enabled: true,
            text: 'Confidential - Generated on {{date}}'
        }
    },

    // Email Settings
    EMAIL: {
        defaultRecipients: [
            'ceo@companya.com',
            'sales-director@companya.com',
            'operations@companya.com'
        ],
        defaultSubject: 'Company A - Dashboard Report',
        defaultMessage: 'Please find attached the latest dashboard report.',
        allowedDomains: ['companya.com']
    },

    // Feature Flags
    FEATURES: {
        advancedCharts: true,
        dataExport: true,
        customFilters: true,
        notifications: true
    },

    // UI Settings
    UI: {
        theme: 'light', // 'light' or 'dark'
        chartAnimations: true,
        pageTransitions: true,
        autoRefresh: true
    }
};

// Freeze configuration to prevent accidental modifications
Object.freeze(Config);

export default Config;