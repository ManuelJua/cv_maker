export class UIController {
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

    updateProcessButton(isEnabled) {
        const processBtn = document.getElementById('process-btn');
        processBtn.disabled = !isEnabled;
    }

    // Keep backward compatibility
    updateAdaptButton(isEnabled) {
        this.updateProcessButton(isEnabled);
    }
}
