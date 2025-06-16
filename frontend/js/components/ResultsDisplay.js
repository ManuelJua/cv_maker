import { MarkdownConverter } from '../utils/MarkdownConverter.js';

export class ResultsDisplay {
    constructor(onContentChange) {
        this.onContentChange = onContentChange;
    }

    displayResults(result) {
        const resultsSection = document.querySelector('.results-section');
        const cvContent = document.getElementById('cv-content');
        const jobDescriptionContent = document.getElementById('job-description-content');
        
        // Display the adapted CV and make it editable
        cvContent.innerHTML = MarkdownConverter.markdownToHtml(result.adapted_cv);
        cvContent.contentEditable = true;
        cvContent.setAttribute('spellcheck', 'true');
        
        this.styleEditableContent(cvContent);
        
        // Add event listener to update content when changes occur
        cvContent.addEventListener('input', () => {
            const markdownContent = MarkdownConverter.htmlToMarkdown(cvContent.innerHTML);
            this.onContentChange(markdownContent);
        });
        
        // Display the extracted job description
        if (result.job_description) {
            jobDescriptionContent.innerHTML = this.formatJobDescription(result.job_description);
        } else {
            jobDescriptionContent.innerHTML = '<p class="no-content">No job description could be extracted from the provided URL.</p>';
        }
        
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    styleEditableContent(element) {
        element.style.border = '1px dashed #ccc';
        element.style.padding = '10px';
        element.style.minHeight = '300px';
    }

    formatJobDescription(jobDescription) {
        if (!jobDescription || jobDescription.trim() === '') {
            return '<p class="no-content">No job description available.</p>';
        }
        
        const paragraphs = jobDescription.split('\n').filter(line => line.trim() !== '');
        let formattedContent = '';
        
        paragraphs.forEach(paragraph => {
            const trimmed = paragraph.trim();
            if (trimmed) {
                if (trimmed.length < 100 && (trimmed === trimmed.toUpperCase() || MarkdownConverter.isTitleCase(trimmed))) {
                    formattedContent += `<h3>${trimmed}</h3>`;
                } else {
                    formattedContent += `<p>${trimmed}</p>`;
                }
            }
        });
        
        return formattedContent || '<p class="no-content">Unable to format job description.</p>';
    }
}
