from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import uvicorn
from typing import Optional
import logging

from services.cv_processor import CVProcessor
from services.job_scraper import JobScraper
from services.llm_adapter import LLMAdapter
from services.pdf_generator import PDFGenerator
from models.schemas import AdaptCVResponse, CoverLetterResponse, ErrorResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CV Adapter API",
    description="API for adapting CVs and generating cover letters using LLM",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
cv_processor = CVProcessor()
job_scraper = JobScraper()
llm_adapter = LLMAdapter()
pdf_generator = PDFGenerator()

@app.get("/")
async def root():
    return {"message": "CV Adapter API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/api/adapt-cv", response_model=AdaptCVResponse)
async def adapt_cv(
    cv_file: UploadFile = File(...),
    job_url: str = Form(...),
    additional_instructions: Optional[str] = Form(None)
):
    """
    Adapt a CV to match a job description from a given URL.
    
    Args:
        cv_file: PDF or TXT file containing the CV
        job_url: URL to the job description (LinkedIn, Indeed, Reed)
    
    Returns:
        AdaptCVResponse: Contains the adapted CV in markdown format
    """
    try:
        logger.info(f"Processing CV adaptation request for URL: {job_url}")
        
        # Validate file type
        if cv_file.content_type not in ["application/pdf", "text/plain"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload a PDF or TXT file."
            )
        
        # Read and process CV file
        cv_content = await cv_processor.extract_text_from_file(cv_file)
        if not cv_content.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the CV file."
            )
        
        # Scrape job description
        job_description = await job_scraper.scrape_job_description(job_url)
        if not job_description.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract job description from the provided URL."
            )
        
        # Adapt CV using LLM
        adapted_cv = await llm_adapter.adapt_cv(cv_content, job_description, additional_instructions=additional_instructions)
        
        logger.info("CV adaptation completed successfully")
        return AdaptCVResponse(
            adapted_cv=adapted_cv,
            job_description=job_description,
            original_cv_length=len(cv_content),
            job_description_length=len(job_description)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adapting CV: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/api/generate-cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(
    cv_file: UploadFile = File(...),
    job_url: str = Form(...),
    additional_instructions: Optional[str] = Form(None)
):
    """
    Generate a cover letter based on a CV and job description from a given URL.
    
    Args:
        cv_file: PDF or TXT file containing the CV
        job_url: URL to the job description (LinkedIn, Indeed, Reed)
    
    Returns:
        CoverLetterResponse: Contains the generated cover letter in markdown format
    """
    try:
        logger.info(f"Processing cover letter generation request for URL: {job_url}")
        
        # Validate file type
        if cv_file.content_type not in ["application/pdf", "text/plain"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload a PDF or TXT file."
            )
        
        # Read and process CV file
        cv_content = await cv_processor.extract_text_from_file(cv_file)
        if not cv_content.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the CV file."
            )
        
        # Scrape job description
        job_description = await job_scraper.scrape_job_description(job_url)
        if not job_description.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract job description from the provided URL."
            )
        
        # Generate cover letter using LLM
        cover_letter = await llm_adapter.generate_cover_letter(cv_content, job_description, additional_instructions=additional_instructions)
        
        logger.info("Cover letter generation completed successfully")
        return CoverLetterResponse(
            cover_letter=cover_letter,
            job_description=job_description,
            original_cv_length=len(cv_content),
            job_description_length=len(job_description)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating cover letter: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/api/convert-to-pdf")
async def convert_markdown_to_pdf(
    markdown_content: str = Form(...)
):
    """
    Convert markdown content to PDF.
    
    Args:
        markdown_content: CV content in markdown format
    
    Returns:
        PDF file as bytes
    """
    try:
        logger.info("Converting markdown to PDF")
        
        if not markdown_content.strip():
            raise HTTPException(
                status_code=400,
                detail="Markdown content cannot be empty"
            )
        
        # Generate PDF from markdown
        pdf_bytes = pdf_generator.markdown_to_pdf(markdown_content)
        
        logger.info("PDF generation completed successfully")
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=adapted_cv.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting to PDF: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF: {str(e)}"
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info"
    )

