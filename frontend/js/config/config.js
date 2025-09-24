export const CONFIG = {
    API_BASE_URL: `${window.APP_URL || 'http://localhost:8080'}/api`,
    ALLOWED_FILE_TYPES: ['application/pdf', 'text/plain'],
    ALLOWED_DOMAINS: ['linkedin.com', 'indeed.com', 'reed.co.uk'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};
