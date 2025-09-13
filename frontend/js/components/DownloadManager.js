export class DownloadManager {
    constructor(apiService, onError = null) {
        this.apiService = apiService;
        this.onError = onError;
        this.currentAdaptedCV = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const downloadMdBtn = document.getElementById('download-md-btn');
        const downloadPdfBtn = document.getElementById('download-pdf-btn');
        const previewPdfBtn = document.getElementById('preview-pdf-btn');

        downloadMdBtn.addEventListener('click', () => {
            try {
                this.handleDownloadMarkdown();
            } catch (error) {
                console.error('Error downloading markdown:', error);
                if (this.onError) {
                    this.onError(error.message);
                }
            }
        });

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
            throw new Error(error.message || 'Failed to generate PDF preview. Please try again.');
        }
    }

    setCurrentCV(cvContent) {
        this.currentAdaptedCV = cvContent;
    }

    extractNameAndRole(cvContent) {
        if (!cvContent) return { name: 'CV', role: 'Document' };

        const lines = cvContent.split('\n').filter(line => line.trim());
        
        let name = lines[0] ? lines[0].trim() : 'CV';
        let role = lines[1] ? lines[1].trim() : 'Document';

        // Remove markdown formatting if present
        name = name.replace(/^#+\s*/, '').trim();
        role = role.replace(/^#+\s*/, '').trim();

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

    handleDownloadMarkdown() {
        if (!this.currentAdaptedCV) {
            throw new Error('No adapted CV available for download.');
        }

        const blob = new Blob([this.currentAdaptedCV], { type: 'text/markdown' });
        this.downloadBlob(blob, this.generateFilename('.md'));
    }

    async handleDownloadPDF() {
        if (!this.currentAdaptedCV) {
            throw new Error('No adapted CV available for download.');
        }

        try {
            const blob = await this.apiService.convertToPDF(this.currentAdaptedCV);
            this.downloadBlob(blob, this.generateFilename('.pdf'));
        } catch (error) {
            throw new Error(error.message || 'Failed to generate PDF. Please try again or download as markdown.');
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
