import markdown
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class PDFGenerator:
    """Service for converting markdown content to PDF."""
    
    def __init__(self):
        self.font_config = FontConfiguration()
        
    def markdown_to_pdf(self, markdown_content: str, filename: Optional[str] = None) -> bytes:
        """
        Convert markdown content to PDF.
        
        Args:
            markdown_content: CV content in markdown format
            filename: Optional filename for the PDF
            
        Returns:
            bytes: PDF file content
        """
        try:
            # Convert markdown to HTML
            html_content = self._markdown_to_html(markdown_content)
            
            # Generate PDF from HTML
            pdf_bytes = self._html_to_pdf(html_content)
            
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            raise Exception(f"Failed to generate PDF: {str(e)}")
    
    def _markdown_to_html(self, markdown_content: str) -> str:
        """Convert markdown to HTML with proper styling."""
        try:
            # Convert markdown to HTML
            html_body = markdown.markdown(markdown_content, extensions=['extra'])
            
            # Create complete HTML document with styling
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    {self._get_cv_styles()}
                </style>
            </head>
            <body>
                {html_body}
            </body>
            </html>
            """
            
            return html_content
            
        except Exception as e:
            logger.error(f"Error converting markdown to HTML: {str(e)}")
            raise
    
    def _html_to_pdf(self, html_content: str) -> bytes:
        """Convert HTML to PDF using WeasyPrint."""
        try:
            html_doc = HTML(string=html_content)
            pdf_buffer = io.BytesIO()
            
            html_doc.write_pdf(
                pdf_buffer,
                font_config=self.font_config
            )
            
            pdf_buffer.seek(0)
            return pdf_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Error converting HTML to PDF: {str(e)}")
            raise
    
    def _get_cv_styles(self) -> str:
        """Get CSS styles for CV PDF formatting."""
        return """
        @page {
            size: A4;
            margin: 2cm;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        h1 {
            font-size: 24pt;
            font-weight: bold;
            margin: 0 0 10pt 0;
            padding-bottom: 8pt;
            border-bottom: 2pt solid #333;
            color: #000;
        }
        
        h2 {
            font-size: 16pt;
            font-weight: bold;
            margin: 20pt 0 8pt 0;
            color: #333;
            border-bottom: 1pt solid #666;
            padding-bottom: 4pt;
        }
        
        h3 {
            font-size: 14pt;
            font-weight: bold;
            margin: 15pt 0 6pt 0;
            color: #444;
        }
        
        h4 {
            font-size: 12pt;
            font-weight: bold;
            margin: 10pt 0 4pt 0;
            color: #555;
        }
        
        p {
            margin: 6pt 0;
            text-align: justify;
        }
        
        ul, ol {
            margin: 8pt 0;
            padding-left: 20pt;
        }
        
        li {
            margin: 3pt 0;
        }
        
        strong {
            font-weight: bold;
        }
        
        em {
            font-style: italic;
        }
        
        a {
            color: #0066cc;
            text-decoration: none;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        /* Contact information styling */
        h4:first-of-type {
            margin-top: 0;
        }
        """