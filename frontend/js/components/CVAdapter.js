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
            adaptedContent: null,
            actionType: 'adapt-cv',
            additionalInstructions: ''
        };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const processBtn = document.getElementById('process-btn');
        const actionSelect = document.getElementById('action-type');
        const addInstructionsBtn = document.getElementById('add-instructions-btn');
        const modal = document.getElementById('instructions-modal');
        const closeBtn = document.getElementById('instructions-close-btn');
        const cancelBtn = document.getElementById('instructions-cancel-btn');
        const saveBtn = document.getElementById('instructions-save-btn');
        const textarea = document.getElementById('instructions-textarea');
        
        processBtn.addEventListener('click', this.handleProcess.bind(this));
        actionSelect.addEventListener('change', this.handleActionChange.bind(this));

        // Modal open/close handlers
        addInstructionsBtn?.addEventListener('click', () => {
            textarea.value = this.currentState.additionalInstructions || '';
            modal.classList.remove('hidden');
        });
        closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));
        cancelBtn?.addEventListener('click', () => modal.classList.add('hidden'));
        saveBtn?.addEventListener('click', () => {
            this.currentState.additionalInstructions = textarea.value.trim();
            modal.classList.add('hidden');
        });
    }

    handleActionChange() {
        const actionSelect = document.getElementById('action-type');
        this.currentState.actionType = actionSelect.value;
        
        // Update UI text based on selected action
        const processBtn = document.getElementById('process-btn');
        const loadingText = document.getElementById('loading-text');
        
        if (this.currentState.actionType === 'cover-letter') {
            processBtn.textContent = 'Generate Cover Letter';
            loadingText.textContent = 'Generating your cover letter...';
        } else if (this.currentState.actionType === 'general-purpose') {
            processBtn.textContent = 'Process';
            loadingText.textContent = 'Processing your request...';
        } else {
            processBtn.textContent = 'Adapt CV';
            loadingText.textContent = 'Processing your CV adaptation...';
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
        this.downloadManager.setCurrentCV(content);
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
                result = await this.apiService.generateCoverLetter(cvFile, jobUrl, this.currentState.additionalInstructions);
                result.adapted_cv = result.cover_letter; // Normalize the response
            } else if (this.currentState.actionType === 'general-purpose') {
                // Validate that instructions are provided for general purpose
                if (!this.currentState.additionalInstructions || !this.currentState.additionalInstructions.trim()) {
                    this.uiController.showError('Please provide instructions for general purpose processing. Click "Add instructions" button.');
                    this.uiController.showLoading(false);
                    return;
                }
                result = await this.apiService.generalPurpose(cvFile, jobUrl, this.currentState.additionalInstructions);
                result.adapted_cv = result.processed_content; // Normalize the response
            } else {
                result = await this.apiService.adaptCV(cvFile, jobUrl, this.currentState.additionalInstructions);
            }
            
            this.resultsDisplay.displayResults(result, this.currentState.actionType);
            this.currentState.adaptedContent = result.adapted_cv || result.cover_letter || result.processed_content;
            this.downloadManager.setCurrentCV(this.currentState.adaptedContent);

        } catch (error) {
            console.error('Error processing request:', error);
            this.uiController.showError(error.message || 'An error occurred while processing your request. Please try again.');
        } finally {
            this.uiController.showLoading(false);
        }
    }
}
