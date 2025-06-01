from google import genai
import logging
from typing import Optional
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class LLMAdapter:
    """Service for adapting CVs using Large Language Models."""

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
            # Fallback to basic adaptation
            # return self._basic_adaptation_fallback(cv_content, job_description)

    async def _adapt_with_google_ai(self, cv_content: str, job_description: str) -> str:
        """Adapt CV using Google AI Studio API."""
        try:
            if not self.google_api_key:
                raise Exception("Google AI API key not configured")

            prompt = self._create_adaptation_prompt(
                cv_content, job_description)
            full_prompt = f"{self._get_system_prompt()}\n\n{prompt}"

            response = self.client.models.generate_content(
                model=self.model, contents=full_prompt
            )

            # if not response.text:
            #     raise Exception("Empty response from Google AI")

            adapted_cv = response.text.strip()
            return self._format_as_markdown(adapted_cv)
           

        except Exception as e:
            logger.error(f"Google AI API error: {str(e)}")
            raise Exception(f"Failed to adapt CV using Google AI: {str(e)}")

    def _get_system_prompt(self) -> str:
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

    def _create_adaptation_prompt(self, cv_content: str, job_description: str) -> str:
        """Create the adaptation prompt."""
        return f"""Please adapt the following CV to better match the job description provided. 

JOB DESCRIPTION:
{job_description}

ORIGINAL CV:
{cv_content}

Provide de CV adapted only.
ADAPTED CV:"""

    def _format_as_markdown(self, content: str) -> str:
        """Ensure content is properly formatted as markdown."""
        if not content.startswith('#'):
            # Add a header if none exists
            lines = content.split('\n')
            if lines:
                content = f"# {lines[0]}\n\n" + '\n'.join(lines[1:])

        return content