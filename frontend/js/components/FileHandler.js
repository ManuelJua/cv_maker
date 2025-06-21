import { CONFIG } from '../config/config.js';
import { CacheManager } from '../utils/CacheManager.js';

export class FileHandler {
    constructor(onFileSelect) {
        this.onFileSelect = onFileSelect;
        this.cacheManager = new CacheManager();
        this.initializeEventListeners();
        this.initializeCachedFiles();
    }

    initializeEventListeners() {
        const cvFileInput = document.getElementById('cv-file');
        cvFileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Add click handler for cached file items
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('cached-file-item')) {
                this.selectCachedFile(event.target.dataset.fileName);
            }
        });
    }

    initializeCachedFiles() {
        this.displayCachedFiles();
    }

    displayCachedFiles() {
        const cachedCVs = this.cacheManager.getOriginalCVCache();
        if (cachedCVs.length === 0) return;

        // Create cached files display
        const fileInputGroup = document.querySelector('.input-group:has(#cv-file)');
        let cachedFilesContainer = document.querySelector('.cached-files-container');
        
        if (!cachedFilesContainer) {
            cachedFilesContainer = document.createElement('div');
            cachedFilesContainer.className = 'cached-files-container';
            cachedFilesContainer.innerHTML = `
                <div class="cached-files-header">
                    <span>Recently uploaded CVs:</span>
                    <button type="button" class="clear-cache-btn" title="Clear all cached files">🗑️</button>
                </div>
                <div class="cached-files-list"></div>
            `;
            fileInputGroup.appendChild(cachedFilesContainer);
            
            // Add clear cache event listener
            cachedFilesContainer.querySelector('.clear-cache-btn').addEventListener('click', () => {
                this.clearCache();
            });
        }

        const filesList = cachedFilesContainer.querySelector('.cached-files-list');
        filesList.innerHTML = cachedCVs.map(cv => `
            <div class="cached-file-item" data-file-name="${cv.fileName}">
                <span class="file-name">${cv.fileName}</span>
                <span class="file-date">${this.formatDate(cv.timestamp)}</span>
            </div>
        `).join('');
    }

    async selectCachedFile(fileName) {
        const cachedCV = this.cacheManager.getOriginalCV(fileName);
        if (!cachedCV) return;

        // Create a virtual file object from cached data
        const blob = this.base64ToBlob(cachedCV.originalContent, cachedCV.metadata.type);
        const file = new File([blob], cachedCV.fileName, { 
            type: cachedCV.metadata.type,
            lastModified: cachedCV.timestamp 
        });

        // Update UI to show selected cached file
        const fileInfo = document.querySelector('.file-info');
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        fileInfo.innerHTML = `
            <span class="cached-indicator">📁 From cache:</span> 
            ${file.name} (${fileSize} MB)
        `;
        fileInfo.style.color = '#2e7d32'; // Green color for cached files

        // Clear the file input since we're using cached file
        document.getElementById('cv-file').value = '';
        
        // Store the virtual file for processing
        this.cachedFile = file;
        this.onFileSelect(file);
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        const fileInfo = document.querySelector('.file-info');
        
        if (file) {
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            fileInfo.innerHTML = `Selected: ${file.name} (${fileSize} MB)`;
            fileInfo.style.color = ''; // Reset color for new uploads
            
            // Validate file type
            if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
                this.showFileError('Please select a PDF or TXT file.');
                event.target.value = '';
                fileInfo.textContent = '';
                return;
            }

            // Validate file size
            if (file.size > CONFIG.MAX_FILE_SIZE) {
                this.showFileError('File size must be less than 10MB.');
                event.target.value = '';
                fileInfo.textContent = '';
                return;
            }

            // Cache the file content
            await this.cacheFileContent(file);
            this.displayCachedFiles(); // Refresh cached files display
        } else {
            fileInfo.textContent = '';
        }

        // Clear any cached file reference when new file is selected
        this.cachedFile = null;
        this.onFileSelect(file);
    }

    async cacheFileContent(file) {
        try {
            // Convert file to base64 for storage
            const base64Content = await this.fileToBase64(file);
            
            // Check if file already exists in cache
            const existingCache = this.cacheManager.getOriginalCV(file.name);
            if (!existingCache) {
                // Save to cache
                this.cacheManager.saveOriginalCV(base64Content, file.name, {
                    type: file.type,
                    size: file.size
                });
            }
        } catch (error) {
            console.error('Error caching file:', error);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    base64ToBlob(base64, mimeType) {
        const base64Data = base64.split(',')[1]; // Remove data URL prefix
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    showFileError(message) {
        const fileInfo = document.querySelector('.file-info');
        fileInfo.textContent = message;
        fileInfo.style.color = '#d32f2f';
        
        setTimeout(() => {
            fileInfo.style.color = '';
        }, 3000);
    }

    clearCache() {
        if (confirm('Are you sure you want to clear all cached CV files?')) {
            localStorage.removeItem('cv_original_cache');
            const cachedFilesContainer = document.querySelector('.cached-files-container');
            if (cachedFilesContainer) {
                cachedFilesContainer.remove();
            }
            
            // Reset file selection if it was from cache
            if (this.cachedFile) {
                this.cachedFile = null;
                const fileInfo = document.querySelector('.file-info');
                fileInfo.textContent = '';
                this.onFileSelect(null);
            }
        }
    }

    getSelectedFile() {
        // Return cached file if one was selected, otherwise return uploaded file
        return this.cachedFile || document.getElementById('cv-file').files[0];
    }
}
