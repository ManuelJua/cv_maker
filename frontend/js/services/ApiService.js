import { CONFIG } from '../config/config.js';

export class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
    }

    async adaptCV(cvFile, jobUrl, additionalInstructions = '') {
        const formData = new FormData();
        formData.append('cv_file', cvFile);
        formData.append('job_url', jobUrl);
        if (additionalInstructions) formData.append('additional_instructions', additionalInstructions);

        const response = await fetch(`${this.baseUrl}/adapt-cv`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to adapt CV');
        }

        return await response.json();
    }

    async generateCoverLetter(cvFile, jobUrl, additionalInstructions = '') {
        const formData = new FormData();
        formData.append('cv_file', cvFile);
        formData.append('job_url', jobUrl);
        if (additionalInstructions) formData.append('additional_instructions', additionalInstructions);

        const response = await fetch(`${this.baseUrl}/generate-cover-letter`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to generate cover letter');
        }

        return await response.json();
    }

    async generalPurpose(cvFile, jobUrl, additionalInstructions) {
        const formData = new FormData();
        formData.append('cv_file', cvFile);
        formData.append('job_url', jobUrl);
        formData.append('additional_instructions', additionalInstructions);

        const response = await fetch(`${this.baseUrl}/general-purpose`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to process request');
        }

        return await response.json();
    }

    async convertToPDF(markdownContent) {
        const formData = new FormData();
        formData.append('markdown_content', markdownContent);

        const response = await fetch(`${this.baseUrl}/convert-to-pdf`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to generate PDF');
        }

        return await response.blob();
    }
}
