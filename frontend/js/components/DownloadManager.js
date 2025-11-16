export class DownloadManager {
    constructor(apiService, onError = null) {
        this.apiService = apiService;
        this.onError = onError;
        this.currentAdaptedCV = null; // This will now store HTML content
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const downloadPdfBtn = document.getElementById('download-pdf-btn');
        const previewPdfBtn = document.getElementById('preview-pdf-btn');

        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', async () => {
                try {
                    await this.handleDownloadPDF();
                } catch (error) {
                    console.error('Error downloading PDF:', error);
                    if (this.onError) {
                        this.onError(error.message);
                    }
                }
            });
        }

        if (previewPdfBtn) {
            previewPdfBtn.addEventListener('click', async () => {
                try {
                    await this.handlePreviewPDF();
                } catch (error) {
                    console.error('Error previewing PDF:', error);
                    if (this.onError) {
                        this.onError(error.message);
                    }
                }
            });
        }
    }

    async handlePreviewPDF() {
        if (!this.currentAdaptedCV) {
            throw new Error('No adapted CV available for preview.');
        }
        try {
            const blob = await this.apiService.convertToPDF(this.currentAdaptedCV);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Optionally, revokeObjectURL after some time
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (error) {
            console.error('Preview PDF error details:', error);
            const errorMessage = error?.message || error?.detail || String(error) || 'Failed to generate PDF preview. Please try again.';
            throw new Error(errorMessage);
        }
    }

    setCurrentCV(cvContent) {
        this.currentAdaptedCV = cvContent;
    }

    extractNameAndRole(cvContent) {
        if (!cvContent) return { name: 'CV', role: 'Document' };

        // Create a temporary element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cvContent;
        
        // Try to extract from h1 and h4 tags (based on backend formatting)
        const h1 = tempDiv.querySelector('h1');
        const h4 = tempDiv.querySelector('h4');
        
        let name = h1 ? h1.textContent.trim() : 'CV';
        let role = h4 ? h4.textContent.trim() : 'Document';

        // Clean up the extracted values
        name = name.replace(/[^\w\s-]/g, '').trim();
        role = role.replace(/[^\w\s-]/g, '').trim();

        // Fallback if extraction failed
        if (!name || name.length < 2) name = 'CV';
        if (!role || role.length < 2) role = 'Document';

        return { name, role };
    }

    generateFilename(extension = '') {
        const { name, role } = this.extractNameAndRole(this.currentAdaptedCV);
        
        const cleanName = name.replace(/\s+/g, '_').toLowerCase();
        const cleanRole = role.replace(/\s+/g, '_').toLowerCase();
        
        return `${cleanName}_${cleanRole}${extension}`;
    }

    async handleDownloadPDF() {
        if (!this.currentAdaptedCV) {
            throw new Error('No adapted CV available for download.');
        }

        try {
            const blob = await this.apiService.convertToPDF(this.currentAdaptedCV);
            this.downloadBlob(blob, this.generateFilename('.pdf'));
        } catch (error) {
            console.error('Download PDF error details:', error);
            const errorMessage = error?.message || error?.detail || String(error) || 'Failed to generate PDF. Please try again.';
            throw new Error(errorMessage);
        }
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
