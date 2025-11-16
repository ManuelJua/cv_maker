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

    async convertToPDF(htmlContent) {
        try {
            const formData = new FormData();
            formData.append('content', htmlContent);

            console.log('Sending PDF conversion request...');
            console.log('HTML content length:', htmlContent?.length);
            console.log('HTML content preview:', htmlContent?.substring(0, 200));
            
            const response = await fetch(`${this.baseUrl}/convert-to-pdf`, {
                method: 'POST',
                body: formData
            });

            console.log('PDF conversion response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Failed to generate PDF';
                try {
                    const errorData = await response.json();
                    console.error('PDF conversion error data:', errorData);
                    // Handle FastAPI validation errors
                    if (errorData.detail && Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
                    } else {
                        errorMessage = errorData.detail || errorMessage;
                    }
                } catch (e) {
                    // If JSON parsing fails, use status text
                    errorMessage = `${errorMessage}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            return await response.blob();
        } catch (error) {
            console.error('convertToPDF error:', error);
            throw error;
        }
    }
}
