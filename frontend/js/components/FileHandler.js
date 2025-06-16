import { CONFIG } from '../config/config.js';

export class FileHandler {
    constructor(onFileSelect) {
        this.onFileSelect = onFileSelect;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const cvFileInput = document.getElementById('cv-file');
        cvFileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        const fileInfo = document.querySelector('.file-info');
        
        if (file) {
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            fileInfo.textContent = `Selected: ${file.name} (${fileSize} MB)`;
            
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
        } else {
            fileInfo.textContent = '';
        }

        this.onFileSelect(file);
    }

    showFileError(message) {
        const fileInfo = document.querySelector('.file-info');
        fileInfo.textContent = message;
        fileInfo.style.color = '#d32f2f';
        
        setTimeout(() => {
            fileInfo.style.color = '';
        }, 3000);
    }

    getSelectedFile() {
        return document.getElementById('cv-file').files[0];
    }
}
