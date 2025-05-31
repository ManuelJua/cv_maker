from fastapi import UploadFile
import PyPDF2
import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class CVProcessor:
    """Service for processing CV files and extracting text content."""
    
    def __init__(self):
        self.supported_formats = ["application/pdf", "text/plain"]
    
    async def extract_text_from_file(self, file: UploadFile) -> str:
        """
        Extract text content from uploaded CV file.
        
        Args:
            file: Uploaded file (PDF or TXT)
            
        Returns:
            str: Extracted text content
        """
        try:
            content = await file.read()
            
            if file.content_type == "application/pdf":
                return self._extract_text_from_pdf(content)
            elif file.content_type == "text/plain":
                return self._extract_text_from_txt(content)
            else:
                raise ValueError(f"Unsupported file type: {file.content_type}")
                
        except Exception as e:
            logger.error(f"Error extracting text from file: {str(e)}")
            raise
    
    def _extract_text_from_pdf(self, content: bytes) -> str:
        """Extract text from PDF file content."""
        try:
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error reading PDF: {str(e)}")
            raise ValueError("Could not read PDF file. Please ensure it's not corrupted or password-protected.")
    
    def _extract_text_from_txt(self, content: bytes) -> str:
        """Extract text from TXT file content."""
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    return content.decode(encoding).strip()
                except UnicodeDecodeError:
                    continue
            
            raise ValueError("Could not decode text file with supported encodings")
            
        except Exception as e:
            logger.error(f"Error reading TXT file: {str(e)}")
            raise
    
    def validate_cv_content(self, text: str) -> bool:
        """
        Validate that extracted text contains CV-like content.
        
        Args:
            text: Extracted text from CV
            
        Returns:
            bool: True if content appears to be a valid CV
        """
        if not text or len(text.strip()) < 100:
            return False
        
        # Look for common CV sections/keywords
        cv_indicators = [
            'experience', 'education', 'skills', 'work', 'employment',
            'university', 'college', 'degree', 'qualification',
            'email', 'phone', 'address', 'linkedin'
        ]
        
        text_lower = text.lower()
        found_indicators = sum(1 for indicator in cv_indicators if indicator in text_lower)
        
        return found_indicators >= 3