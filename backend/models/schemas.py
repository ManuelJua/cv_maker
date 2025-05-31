from pydantic import BaseModel, HttpUrl
from typing import Optional

class AdaptCVRequest(BaseModel):
    job_url: HttpUrl
    
class AdaptCVResponse(BaseModel):
    adapted_cv: str
    job_description: str
    original_cv_length: int
    job_description_length: int
    
class ErrorResponse(BaseModel):
    detail: str
    
class JobDescription(BaseModel):
    title: str
    company: str
    description: str
    requirements: list[str]
    url: str
    
class CVData(BaseModel):
    raw_text: str
    file_type: str
    file_size: int