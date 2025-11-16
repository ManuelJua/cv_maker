from pydantic import BaseModel

class AdaptCVResponse(BaseModel):
    adapted_cv: str
    job_description: str
    original_cv_length: int
    job_description_length: int

class CoverLetterResponse(BaseModel):
    cover_letter: str
    job_description: str
    original_cv_length: int
    job_description_length: int

class GeneralPurposeResponse(BaseModel):
    processed_content: str
    job_description: str
    original_cv_length: int
    job_description_length: int
    
class ErrorResponse(BaseModel):
    detail: str