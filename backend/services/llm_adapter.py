from google import genai
import logging
from typing import Optional
import os
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
            self.model = "gemini-3-pro-preview"
        else:
            raise ValueError("Google API key was not retrieved")

    async def adapt_cv(self, cv_content: str, job_description: str, additional_instructions: Optional[str] = None) -> str:
        """
        Adapt CV content to match job description using LLM.

        Args:
            cv_content: Original CV text
            job_description: Job description text

        Returns:
            str: Adapted CV in HTML format
        """
        try:
            return await self._adapt_with_google_ai(cv_content, job_description, additional_instructions)

        except Exception as e:
            logger.error(f"Error adapting CV with LLM: {str(e)}")
            raise Exception(f"{str(e)}")

    async def generate_cover_letter(self, cv_content: str, job_description: str, additional_instructions: Optional[str] = None) -> str:
        """
        Generate a cover letter based on CV content and job description.

        Args:
            cv_content: Original CV text
            job_description: Job description text

        Returns:
            str: Generated cover letter in HTML format
        """
        try:
            return await self._generate_cover_letter_with_google_ai(cv_content, job_description, additional_instructions)

        except Exception as e:
            logger.error(f"Error generating cover letter with LLM: {str(e)}")
            raise Exception(f"{str(e)}")

    async def general_purpose_process(self, cv_content: str, job_description: str, additional_instructions: str) -> str:
        """
        Process CV and job description with custom user instructions.

        Args:
            cv_content: Original CV text
            job_description: Job description text
            additional_instructions: Custom user instructions for processing

        Returns:
            str: Processed content in HTML format based on user instructions
        """
        try:
            return await self._general_purpose_with_google_ai(cv_content, job_description, additional_instructions)

        except Exception as e:
            logger.error(
                f"Error in general purpose processing with LLM: {str(e)}")
            raise Exception(f"{str(e)}")

    async def _adapt_with_google_ai(self, cv_content: str, job_description: str, additional_instructions: Optional[str] = None) -> str:
        """Adapt CV using Google AI Studio API."""
        try:
            if not self.google_api_key:
                raise Exception("Google AI API key not configured")

            prompt = self._create_adaptation_prompt(
                cv_content, job_description, additional_instructions)
            full_prompt = f"{self._get_cv_system_prompt()}\n\n{prompt}"

            response = self.client.models.generate_content(
                model=self.model, contents=full_prompt
            )

            if not response.text:
                raise Exception("Empty response from Google AI")

            adapted_cv = response.text.strip()

            # Check if the response is markdown instead of HTML
            # If it starts with # or contains markdown patterns, it's likely markdown
            if adapted_cv.startswith('#') or '\n#' in adapted_cv[:200]:
                logger.warning(
                    "LLM returned markdown instead of HTML, converting...")
                # Convert markdown to HTML
                import markdown as md
                adapted_cv = md.markdown(adapted_cv, extensions=['extra'])

            return adapted_cv

        except Exception as e:
            logger.error(f"Google AI API error: {str(e)}")
            raise Exception(f"Failed to adapt CV using Google AI: {str(e)}")

    async def _generate_cover_letter_with_google_ai(self, cv_content: str, job_description: str, additional_instructions: Optional[str] = None) -> str:
        """Generate cover letter using Google AI Studio API."""
        try:
            if not self.google_api_key:
                raise Exception("Google AI API key not configured")

            prompt = self._create_cover_letter_prompt(
                cv_content, job_description, additional_instructions)
            full_prompt = f"{self._get_cover_letter_system_prompt()}\n\n{prompt}"

            response = self.client.models.generate_content(
                model=self.model, contents=full_prompt
            )

            if not response.text:
                raise Exception("Empty response from Google AI")

            cover_letter = response.text.strip()

            # Check if the response is markdown instead of HTML
            if cover_letter.startswith('#') or '\n#' in cover_letter[:200]:
                logger.warning(
                    "LLM returned markdown instead of HTML for cover letter, converting...")
                import markdown as md
                cover_letter = md.markdown(cover_letter, extensions=['extra'])

            return cover_letter

        except Exception as e:
            logger.error(f"Google AI API error: {str(e)}")
            raise Exception(
                f"Failed to generate cover letter using Google AI: {str(e)}")

    async def _general_purpose_with_google_ai(self, cv_content: str, job_description: str, additional_instructions: str) -> str:
        """Process with custom instructions using Google AI Studio API."""
        try:
            if not self.google_api_key:
                raise Exception("Google AI API key not configured")

            prompt = self._create_general_purpose_prompt(
                cv_content, job_description, additional_instructions)
            full_prompt = f"{self._get_general_purpose_system_prompt()}\n\n{prompt}"

            response = self.client.models.generate_content(
                model=self.model, contents=full_prompt
            )

            if not response.text:
                raise Exception("Empty response from Google AI")

            processed_content = response.text.strip()

            # Check if the response is markdown instead of HTML
            if processed_content.startswith('#') or '\n#' in processed_content[:200]:
                logger.warning(
                    "LLM returned markdown instead of HTML for general purpose, converting...")
                import markdown as md
                processed_content = md.markdown(
                    processed_content, extensions=['extra'])

            return processed_content

        except Exception as e:
            logger.error(f"Google AI API error: {str(e)}")
            raise Exception(
                f"Failed to process with custom instructions using Google AI: {str(e)}")

    def _get_cv_system_prompt(self) -> str:
        """Get the system prompt for CV adaptation."""
        return """You are an expert CV/resume writer and career counselor. Your task is to adapt a CV to better match a specific job description while maintaining truthfulness and accuracy.

Guidelines:
1. Keep all factual information accurate - do not fabricate experience or skills
2. Reorganize and emphasize relevant sections to match job requirements
3. Use keywords from the job description where appropriate
4. Enhance descriptions of relevant experience and skills
5. Format the output as a professional CV in HTML format
6. Maintain a professional and concise tone
7. Focus on achievements and quantifiable results where possible
8. Use semantic HTML tags: <h1> for name, <h2> for section titles, <h4> for subsections, <p> for paragraphs, <ul>/<li> for lists, <strong> for emphasis
9. Do not include <!DOCTYPE>, <html>, <head>, or <body> tags - only the content HTML

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
8. Format the output in HTML format using semantic tags: <h1> for title, <p> for paragraphs, <strong> for emphasis
9. Do not include placeholder text like [Company Name] - use actual details from the job description
10. Make it personal and specific to avoid generic language
11. Do not include <!DOCTYPE>, <html>, <head>, or <body> tags - only the content HTML

The cover letter should demonstrate why the candidate is an excellent fit for this specific position."""

    def _get_general_purpose_system_prompt(self) -> str:
        """Get the system prompt for general purpose processing."""
        return """You are an expert career counselor and content writer. Your task is to process a CV and job description according to the specific instructions provided by the user.

Guidelines:
1. Follow the user's instructions precisely
2. Keep all factual information from the CV accurate - do not fabricate information
3. Use information from both the CV and job description as needed
4. Format the output in HTML format using semantic tags appropriately
5. Maintain a professional tone unless instructed otherwise
6. Be creative and flexible based on user requirements
7. If the instructions are unclear, do your best to interpret them reasonably
8. Do not include <!DOCTYPE>, <html>, <head>, or <body> tags - only the content HTML

The output should fulfill the user's specific requirements while maintaining professional quality."""

    def _create_adaptation_prompt(self, cv_content: str, job_description: str, additional_instructions: Optional[str] = None) -> str:
        """Create the adaptation prompt."""
        extra = f"\n\nADDITIONAL INSTRUCTIONS FROM USER:\n{additional_instructions.strip()}\n" if additional_instructions and additional_instructions.strip(
        ) else ""
        return f"""Please adapt the following CV to better match the job description provided. 

JOB DESCRIPTION:
{job_description}

ORIGINAL CV:
{cv_content}

Output the adapted CV in HTML format with the following requirements:
- Use <h1> for the candidate's name
- Use <h4> for role title, location, phone number, email, linkedin and github at the beginning
- Use <h2> for all section titles (e.g., Experience, Education, Skills)
- Use <p> for paragraphs
- Use <ul> and <li> for lists
- Use <strong> for emphasis
- Do not include <!DOCTYPE>, <html>, <head>, or <body> tags - only the content HTML
- Match the CV role with the Job description role
- Match the CV location with the Job description location

{extra}


ADAPTED CV (HTML):"""

    def _create_cover_letter_prompt(self, cv_content: str, job_description: str, additional_instructions: Optional[str] = None) -> str:
        """Create the cover letter generation prompt."""
        extra = f"\n\nADDITIONAL INSTRUCTIONS FROM USER:\n{additional_instructions.strip()}\n" if additional_instructions and additional_instructions.strip(
        ) else ""
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
- Format in HTML using <h1> for title, <p> for paragraphs, <strong> for emphasis
- Do not include <!DOCTYPE>, <html>, <head>, or <body> tags - only the content HTML

{extra}

COVER LETTER (HTML):"""

    def _create_general_purpose_prompt(self, cv_content: str, job_description: str, additional_instructions: str) -> str:
        """Create the general purpose processing prompt."""
        return f"""Process the following CV and job description according to the user's specific instructions.

JOB DESCRIPTION:
{job_description}

CANDIDATE'S CV:
{cv_content}

USER INSTRUCTIONS:
{additional_instructions.strip()}

Please follow the user's instructions carefully and provide the output in HTML format (using semantic tags, without <!DOCTYPE>, <html>, <head>, or <body> tags - only the content HTML).

OUTPUT (HTML):"""
