from google import genai
import logging
from typing import Optional
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class LLMAdapter:
    """Service for adapting CVs and generating cover letters using Large Language Models."""

    def __init__(self):
        # Initialize Google AI Studio client
        self.google_api_key = os.getenv("GOOGLE_AI_API_KEY")
        if self.google_api_key:
            self.client = genai.Client(api_key=self.google_api_key)
            self.model="gemini-2.0-flash"
        else:
            raise ValueError("Google API key was not retrieved")

    async def adapt_cv(self, cv_content: str, job_description: str) -> str:
        """
        Adapt CV content to match job description using LLM.

        Args:
            cv_content: Original CV text
            job_description: Job description text

        Returns:
            str: Adapted CV in markdown format
        """
        try:
            return await self._adapt_with_google_ai(cv_content, job_description)

        except Exception as e:
            logger.error(f"Error adapting CV with LLM: {str(e)}")
            raise Exception(f"{str(e)}") 

    async def generate_cover_letter(self, cv_content: str, job_description: str) -> str:
        """
        Generate a cover letter based on CV content and job description.

        Args:
            cv_content: Original CV text
            job_description: Job description text

        Returns:
            str: Generated cover letter in markdown format
        """
        try:
            return await self._generate_cover_letter_with_google_ai(cv_content, job_description)

        except Exception as e:
            logger.error(f"Error generating cover letter with LLM: {str(e)}")
            raise Exception(f"{str(e)}")

    async def _adapt_with_google_ai(self, cv_content: str, job_description: str) -> str:
        """Adapt CV using Google AI Studio API."""
        try:
            if not self.google_api_key:
                raise Exception("Google AI API key not configured")

            prompt = self._create_adaptation_prompt(
                cv_content, job_description)
            full_prompt = f"{self._get_cv_system_prompt()}\n\n{prompt}"

            response = self.client.models.generate_content(
                model=self.model, contents=full_prompt
            )

            if not response.text:
                raise Exception("Empty response from Google AI")

            adapted_cv = response.text.strip()
            # return self._format_as_markdown(adapted_cv)
            return adapted_cv
           

        except Exception as e:
            logger.error(f"Google AI API error: {str(e)}")
            raise Exception(f"Failed to adapt CV using Google AI: {str(e)}")

    async def _generate_cover_letter_with_google_ai(self, cv_content: str, job_description: str) -> str:
        """Generate cover letter using Google AI Studio API."""
        try:
            if not self.google_api_key:
                raise Exception("Google AI API key not configured")

            prompt = self._create_cover_letter_prompt(cv_content, job_description)
            full_prompt = f"{self._get_cover_letter_system_prompt()}\n\n{prompt}"

            response = self.client.models.generate_content(
                model=self.model, contents=full_prompt
            )

            if not response.text:
                raise Exception("Empty response from Google AI")

            cover_letter = response.text.strip()
            return cover_letter
           
        except Exception as e:
            logger.error(f"Google AI API error: {str(e)}")
            raise Exception(f"Failed to generate cover letter using Google AI: {str(e)}")

    def _get_cv_system_prompt(self) -> str:
        """Get the system prompt for CV adaptation."""
        return """You are an expert CV/resume writer and career counselor. Your task is to adapt a CV to better match a specific job description while maintaining truthfulness and accuracy.

Guidelines:
1. Keep all factual information accurate - do not fabricate experience or skills
2. Reorganize and emphasize relevant sections to match job requirements
3. Use keywords from the job description where appropriate
4. Enhance descriptions of relevant experience and skills
5. Format the output as a professional CV in markdown
6. Maintain a professional and concise tone
7. Focus on achievements and quantifiable results where possible

The adapted CV should highlight the candidate's most relevant qualifications for the specific role."""

    def _get_cover_letter_system_prompt(self) -> str:
        """Get the system prompt for cover letter generation."""
        return """You are an expert cover letter writer and career counselor. Your task is to create a compelling, personalized cover letter based on a candidate's CV and a specific job description.

Guidelines:
1. Write in a professional, engaging tone
2. Keep the letter concise (3-4 paragraphs maximum)
3. Address the specific role and company mentioned in the job description
4. Highlight the most relevant experience and skills from the CV
5. Show enthusiasm for the role and company
6. Include a strong opening and compelling closing
7. Use keywords from the job description naturally
8. Format the output in markdown
9. Do not include placeholder text like [Company Name] - use actual details from the job description
10. Make it personal and specific to avoid generic language

The cover letter should demonstrate why the candidate is an excellent fit for this specific position."""

    def _create_adaptation_prompt(self, cv_content: str, job_description: str) -> str:
        """Create the adaptation prompt."""
        return f"""Please adapt the following CV to better match the job description provided. 

JOB DESCRIPTION:
{job_description}

ORIGINAL CV:
{cv_content}

Provide de CV adapted only.
Remove the "markdown" words.
Match the CV role with the Job description role.
Match the CV location with the Job description location.
All the section titles must be written with heading level 2 
The name mut be in heading title level 1
The role title, location, phone number, email, linkedin and github at the beggining must be written with a breakdown and heading level 4


ADAPTED CV:"""

    def _format_as_markdown(self, content: str) -> str:
        """Ensure content is properly formatted as markdown."""
        if not content.startswith('#'):
            # Add a header if none exists
            lines = content.split('\n')
            if lines:
                content = f"# {lines[0]}\n\n" + '\n'.join(lines[1:])

        return content

    def _get_cover_letter_system_prompt(self) -> str:
        """Get the system prompt for cover letter generation."""
        return """You are an expert cover letter writer and career counselor. Your task is to create a compelling, personalized cover letter based on a candidate's CV and a specific job description.

Guidelines:
1. Write in a professional, engaging tone
2. Keep the letter concise (3-4 paragraphs maximum)
3. Address the specific role and company mentioned in the job description
4. Highlight the most relevant experience and skills from the CV
5. Show enthusiasm for the role and company
6. Include a strong opening and compelling closing
7. Use keywords from the job description naturally
8. Format the output in markdown
9. Do not include placeholder text like [Company Name] - use actual details from the job description
10. Make it personal and specific to avoid generic language

The cover letter should demonstrate why the candidate is an excellent fit for this specific position."""

    def _create_cover_letter_prompt(self, cv_content: str, job_description: str) -> str:
        """Create the cover letter generation prompt."""
        return f"""Based on the CV and job description provided, create a compelling cover letter for this specific position.

JOB DESCRIPTION:
{job_description}

CANDIDATE'S CV:
{cv_content}

Requirements:
- Address the specific role and company from the job description
- Highlight the most relevant experience and achievements from the CV
- Keep it concise but impactful (3-4 paragraphs)
- Show genuine interest in the role and company
- Use a professional yet engaging tone
- Include specific examples that demonstrate fit for the role
- Format in markdown with proper structure

COVER LETTER:"""