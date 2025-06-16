import { CONFIG } from '../config/config.js';

export class UrlValidator {
    constructor(onUrlChange) {
        this.onUrlChange = onUrlChange;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const jobUrlInput = document.getElementById('job-url');
        jobUrlInput.addEventListener('change', this.handleUrlChange.bind(this));
        jobUrlInput.addEventListener('input', this.handleUrlChange.bind(this));
    }

    handleUrlChange() {
        const url = this.getJobUrl();
        const isValid = this.isValidUrl(url);
        this.onUrlChange(url, isValid);
    }

    isValidUrl(url) {
        if (!url) return false;
        
        try {
            const urlObj = new URL(url);
            return CONFIG.ALLOWED_DOMAINS.some(domain => 
                urlObj.hostname.includes(domain)
            );
        } catch {
            return false;
        }
    }

    getJobUrl() {
        return document.getElementById('job-url').value.trim();
    }
}
