class CVAdapter {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080/api';
        console.log('CVAdapter constructor: this.apiBaseUrl =', this.apiBaseUrl);
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const cvFileInput = document.getElementById('cv-file');
        const jobUrlInput = document.getElementById('job-url');
        const adaptBtn = document.getElementById('adapt-btn');
        const downloadMdBtn = document.getElementById('download-md-btn');
        const downloadPdfBtn = document.getElementById('download-pdf-btn');

        cvFileInput.addEventListener('change', this.handleFileSelect.bind(this));
        adaptBtn.addEventListener('click', this.handleAdaptCV.bind(this));
        downloadMdBtn.addEventListener('click', this.handleDownloadMarkdown.bind(this));
        downloadPdfBtn.addEventListener('click', this.handleDownloadPDF.bind(this));

        // Enable/disable adapt button based on inputs
        [cvFileInput, jobUrlInput].forEach(input => {
            input.addEventListener('change', this.validateInputs.bind(this));
            input.addEventListener('input', this.validateInputs.bind(this));
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        const fileInfo = document.querySelector('.file-info');
        
        if (file) {
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            fileInfo.textContent = `Selected: ${file.name} (${fileSize} MB)`;
            
            // Validate file type
            const allowedTypes = ['application/pdf', 'text/plain'];
            if (!allowedTypes.includes(file.type)) {
                this.showError('Please select a PDF or TXT file.');
                event.target.value = '';
                fileInfo.textContent = '';
            }
        } else {
            fileInfo.textContent = '';
        }
    }

    validateInputs() {
        const cvFile = document.getElementById('cv-file').files[0];
        const jobUrl = document.getElementById('job-url').value.trim();
        const adaptBtn = document.getElementById('adapt-btn');

        const isValid = cvFile && jobUrl && this.isValidUrl(jobUrl);
        adaptBtn.disabled = !isValid;
    }

    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            const allowedDomains = ['linkedin.com', 'indeed.com', 'reed.co.uk'];
            return allowedDomains.some(domain => urlObj.hostname.includes(domain));
        } catch {
            return false;
        }
    }

    async handleAdaptCV() {
        console.log('handleAdaptCV: this.apiBaseUrl =', this.apiBaseUrl);

        const cvFile = document.getElementById('cv-file').files[0];
        const jobUrl = document.getElementById('job-url').value.trim();

        if (!cvFile || !jobUrl) {
            this.showError('Please provide both a CV file and job URL.');
            return;
        }

        this.showLoading(true);
        this.hideError();

        const apiUrl = `${this.apiBaseUrl}/adapt-cv`;
        console.log(`Attempting to fetch from: ${apiUrl}`);

        try {
            const formData = new FormData();
            formData.append('cv_file', cvFile);
            formData.append('job_url', jobUrl);

            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to adapt CV');
            }

            const result = await response.json();
            this.displayResults(result);
            this.currentAdaptedCV = result.adapted_cv;

        } catch (error) {
            console.error('Error adapting CV:', error);
            this.showError(error.message || 'An error occurred while adapting your CV. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(result) {
        const resultsSection = document.querySelector('.results-section');
        const cvContent = document.getElementById('cv-content');
        const jobDescriptionContent = document.getElementById('job-description-content');
        
        // Display the adapted CV and make it editable
        cvContent.innerHTML = this.markdownToHtml(result.adapted_cv);
        cvContent.contentEditable = true;
        cvContent.setAttribute('spellcheck', 'true');
        
        // Add visual feedback for editable content
        cvContent.style.border = '1px dashed #ccc';
        cvContent.style.padding = '10px';
        cvContent.style.minHeight = '300px';
        
        // Add event listener to update currentAdaptedCV when content changes
        cvContent.addEventListener('input', () => {
            this.currentAdaptedCV = this.htmlToMarkdown(cvContent.innerHTML);
        });
        
        // Display the extracted job description
        if (result.job_description) {
            jobDescriptionContent.innerHTML = this.formatJobDescription(result.job_description);
        } else {
            jobDescriptionContent.innerHTML = '<p class="no-content">No job description could be extracted from the provided URL.</p>';
        }
        
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayAdaptedCV(adaptedCV) {
        const resultsSection = document.querySelector('.results-section');
        const cvContent = document.getElementById('cv-content');
        
        // Convert markdown to HTML for better display
        cvContent.innerHTML = this.markdownToHtml(adaptedCV);
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    formatJobDescription(jobDescription) {
        // Clean and format the job description text
        if (!jobDescription || jobDescription.trim() === '') {
            return '<p class="no-content">No job description available.</p>';
        }
        
        // Split into paragraphs and format
        const paragraphs = jobDescription.split('\n').filter(line => line.trim() !== '');
        let formattedContent = '';
        
        paragraphs.forEach(paragraph => {
            const trimmed = paragraph.trim();
            if (trimmed) {
                // Check if it looks like a heading (short line, might be all caps or title case)
                if (trimmed.length < 100 && (trimmed === trimmed.toUpperCase() || this.isTitleCase(trimmed))) {
                    formattedContent += `<h3>${trimmed}</h3>`;
                } else {
                    formattedContent += `<p>${trimmed}</p>`;
                }
            }
        });
        
        return formattedContent || '<p class="no-content">Unable to format job description.</p>';
    }

    isTitleCase(str) {
        return str === str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    markdownToHtml(markdown) {
        // Simple markdown to HTML conversion
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
            .replace(/\n/gim, '<br>');
    }

    htmlToMarkdown(html) {
        // Simple HTML to markdown conversion
        return html
            .replace(/<h1>(.*?)<\/h1>/gim, '# $1')
            .replace(/<h2>(.*?)<\/h2>/gim, '## $1')
            .replace(/<h3>(.*?)<\/h3>/gim, '### $1')
            .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
            .replace(/<em>(.*?)<\/em>/gim, '*$1*')
            .replace(/<ul>(.*?)<\/ul>/gims, '$1')
            .replace(/<li>(.*?)<\/li>/gim, '* $1')
            .replace(/<br>/gim, '\n')
            .replace(/<\/?p>/gim, '');
    }

    handleDownloadMarkdown() {
        if (!this.currentAdaptedCV) {
            this.showError('No adapted CV available for download.');
            return;
        }

        const blob = new Blob([this.currentAdaptedCV], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'adapted_cv.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async handleDownloadPDF() {
        if (!this.currentAdaptedCV) {
            this.showError('No adapted CV available for download.');
            return;
        }

        try {
            const apiUrl = `${this.apiBaseUrl}/convert-to-pdf`;
            
            const formData = new FormData();
            formData.append('markdown_content', this.currentAdaptedCV);

            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate PDF');
            }

            // Create blob from response
            const blob = await response.blob();
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'adapted_cv.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error downloading PDF:', error);
            this.showError(error.message || 'Failed to generate PDF. Please try again or download as markdown.');
        }
    }

    showLoading(show) {
        const loadingSection = document.querySelector('.loading-section');
        const uploadSection = document.querySelector('.upload-section');
        
        if (show) {
            loadingSection.style.display = 'block';
            uploadSection.style.display = 'none';
        } else {
            loadingSection.style.display = 'none';
            uploadSection.style.display = 'block';
        }
    }

    showError(message) {
        this.hideError();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const main = document.querySelector('main');
        main.insertBefore(errorDiv, main.firstChild);
    }

    hideError() {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CVAdapter();
});                    