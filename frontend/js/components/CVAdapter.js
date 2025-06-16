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
        
        this.fileHandler = new FileHandler(this.handleFileSelect.bind(this));
        this.urlValidator = new UrlValidator(this.handleUrlChange.bind(this));
        this.resultsDisplay = new ResultsDisplay(this.handleContentChange.bind(this));
        this.downloadManager = new DownloadManager(this.apiService, this.uiController.showError.bind(this.uiController));
        
        this.currentState = {
            hasValidFile: false,
            hasValidUrl: false,
            adaptedCV: null
        };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const adaptBtn = document.getElementById('adapt-btn');
        adaptBtn.addEventListener('click', this.handleAdaptCV.bind(this));
    }

    handleFileSelect(file) {
        this.currentState.hasValidFile = !!file;
        this.updateAdaptButton();
    }

    handleUrlChange(url, isValid) {
        this.currentState.hasValidUrl = isValid;
        this.updateAdaptButton();
    }

    handleContentChange(content) {
        this.currentState.adaptedCV = content;
        this.downloadManager.setCurrentCV(content);
    }

    updateAdaptButton() {
        const isEnabled = this.currentState.hasValidFile && this.currentState.hasValidUrl;
        this.uiController.updateAdaptButton(isEnabled);
    }

    async handleAdaptCV() {
        console.log('handleAdaptCV: API Base URL =', CONFIG.API_BASE_URL);

        const cvFile = this.fileHandler.getSelectedFile();
        const jobUrl = this.urlValidator.getJobUrl();

        if (!cvFile || !jobUrl) {
            this.uiController.showError('Please provide both a CV file and job URL.');
            return;
        }

        this.uiController.showLoading(true);
        this.uiController.hideError();

        try {
            const result = await this.apiService.adaptCV(cvFile, jobUrl);
            this.resultsDisplay.displayResults(result);
            this.currentState.adaptedCV = result.adapted_cv;
            this.downloadManager.setCurrentCV(result.adapted_cv);

        } catch (error) {
            console.error('Error adapting CV:', error);
            this.uiController.showError(error.message || 'An error occurred while adapting your CV. Please try again.');
        } finally {
            this.uiController.showLoading(false);
        }
    }
}
