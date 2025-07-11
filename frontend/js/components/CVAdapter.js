import { ApiService } from '../services/ApiService.js';
import { FileHandler } from './FileHandler.js';
import { UrlValidator } from './UrlValidator.js';
import { ResultsDisplay } from './ResultsDisplay.js';
import { DownloadManager } from './DownloadManager.js';
import { UIController } from './UIController.js';
import { CONFIG } from '../config/config.js';

export class CVAdapter {
    constructor() {
        console.log('CVAdapter constructor: API Base URL =', CONFIG.API_BASE_URL);
        
        this.apiService = new ApiService();
        this.uiController = new UIController();
        
        // Store DOM element references
        this.actionSelect = document.getElementById('action-type');
        this.processBtn = document.getElementById('process-btn');
        this.loadingText = document.getElementById('loading-text');
        
        this.fileHandler = new FileHandler(this.handleFileSelect.bind(this));
        this.urlValidator = new UrlValidator(this.handleUrlChange.bind(this));
        this.resultsDisplay = new ResultsDisplay(this.handleContentChange.bind(this));
        this.downloadManager = new DownloadManager(this.apiService, this.uiController.showError.bind(this.uiController));
        
        this.currentState = {
            hasValidFile: false,
            hasValidUrl: false,
            adaptedContent: null,
            actionType: 'adapt-cv'
        };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.processBtn.addEventListener('click', this.handleProcess.bind(this));
        this.actionSelect.addEventListener('change', this.handleActionChange.bind(this));
    }

    handleActionChange() {
        this.currentState.actionType = this.actionSelect.value;
        
        // Update UI text based on selected action
        if (this.currentState.actionType === 'cover-letter') {
            this.processBtn.textContent = 'Generate Cover Letter';
            this.loadingText.textContent = 'Generating your cover letter...';
        } else {
            this.processBtn.textContent = 'Adapt CV';
            this.loadingText.textContent = 'Processing your CV adaptation...';
        }
    }

    handleFileSelect(file) {
        this.currentState.hasValidFile = !!file;
        this.updateProcessButton();
    }

    handleUrlChange(url, isValid) {
        this.currentState.hasValidUrl = isValid;
        this.updateProcessButton();
    }

    handleContentChange(content) {
        this.currentState.adaptedContent = content;
        this.downloadManager.setCurrentCV(content, this.currentState.actionType);
    }

    updateProcessButton() {
        const isEnabled = this.currentState.hasValidFile && this.currentState.hasValidUrl;
        this.uiController.updateProcessButton(isEnabled);
    }

    async handleProcess() {
        console.log('handleProcess: API Base URL =', CONFIG.API_BASE_URL);

        const cvFile = this.fileHandler.getSelectedFile();
        const jobUrl = this.urlValidator.getJobUrl();

        if (!cvFile || !jobUrl) {
            this.uiController.showError('Please provide both a CV file and job URL.');
            return;
        }

        this.uiController.showLoading(true);
        this.uiController.hideError();

        try {
            let result;
            if (this.currentState.actionType === 'cover-letter') {
                result = await this.apiService.generateCoverLetter(cvFile, jobUrl);
                result.adapted_cv = result.cover_letter; // Normalize the response
            } else {
                result = await this.apiService.adaptCV(cvFile, jobUrl);
            }
            
            this.resultsDisplay.displayResults(result, this.currentState.actionType);
            this.currentState.adaptedContent = result.adapted_cv || result.cover_letter;
            this.downloadManager.setCurrentCV(this.currentState.adaptedContent, this.currentState.actionType);

        } catch (error) {
            console.error('Error processing request:', error);
            this.uiController.showError(error.message || 'An error occurred while processing your request. Please try again.');
        } finally {
            this.uiController.showLoading(false);
        }
    }
}
