import google.generativeai as genai
import logging
from typing import Optional
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class LLMAdapter:
    """Service for adapting CVs using Large Language Models."""
    
    def __init__(self):
        # Initialize Google AI Studio client
        self.google_api_key = os.getenv("GOOGLE_AI_API_KEY")
        if self.google_api_key:
            genai.configure(api_key=self.google_api_key)
            self.model = genai.GenerativeModel(os.getenv("GOOGLE_AI_MODEL", "gemini-pro"))
        else:
            self.model = None
        
        # Model configuration
        self.generation_config = {
            "temperature": 0.7,
            "top_p": 1,
            "top_k": 1,
            "max_output_tokens": 2048,
        }
        
        # Alternative: You can also use free/local models like Ollama
        self.use_local_model = os.getenv("USE_LOCAL_MODEL", "false").lower() == "true"
        self.local_model_url = os.getenv("LOCAL_MODEL_URL", "http://localhost:11434")
    
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
            if self.use_local_model:
                return await self._adapt_with_local_model(cv_content, job_description)
            else:
                return await self._adapt_with_google_ai(cv_content, job_description)
                
        except Exception as e:
            logger.error(f"Error adapting CV with LLM: {str(e)}")
            # Fallback to basic adaptation
            return self._basic_adaptation_fallback(cv_content, job_description)
    
    async def _adapt_with_google_ai(self, cv_content: str, job_description: str) -> str:
        """Adapt CV using Google AI Studio API."""
        try:
            if not self.google_api_key or not self.model:
                raise Exception("Google AI API key not configured")
            
            prompt = self._create_adaptation_prompt(cv_content, job_description)
            full_prompt = f"{self._get_system_prompt()}\n\n{prompt}"
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=self.generation_config
            )
            
            if not response.text:
                raise Exception("Empty response from Google AI")
            
            adapted_cv = response.text.strip()
            return self._format_as_markdown(adapted_cv)
            
        except Exception as e:
            logger.error(f"Google AI API error: {str(e)}")
            raise Exception(f"Failed to adapt CV using Google AI: {str(e)}")
    
    async def _adapt_with_local_model(self, cv_content: str, job_description: str) -> str:
        """Adapt CV using local model (e.g., Ollama)."""
        try:
            import aiohttp
            
            prompt = self._create_adaptation_prompt(cv_content, job_description)
            
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": "llama2",  # or another local model
                    "prompt": f"{self._get_system_prompt()}\n\n{prompt}",
                    "stream": False
                }
                
                async with session.post(f"{self.local_model_url}/api/generate", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        adapted_cv = result.get("response", "").strip()
                        return self._format_as_markdown(adapted_cv)
                    else:
                        raise Exception(f"Local model API returned status {response.status}")
                        
        except ImportError:
            logger.error("aiohttp not available for local model integration")
            raise Exception("Local model support requires aiohttp dependency")
        except Exception as e:
            logger.error(f"Local model error: {str(e)}")
            raise Exception(f"Failed to adapt CV using local model: {str(e)}")
    
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

Please provide an adapted version of this CV that:
1. Emphasizes skills and experience most relevant to this job
2. Uses keywords from the job description appropriately
3. Reorganizes content to highlight the best matches
4. Maintains all factual accuracy
5. Is formatted in clean markdown

ADAPTED CV:"""
    
    def _format_as_markdown(self, content: str) -> str:
        """Ensure content is properly formatted as markdown."""
        if not content.startswith('#'):
            # Add a header if none exists
            lines = content.split('\n')
            if lines:
                content = f"# {lines[0]}\n\n" + '\n'.join(lines[1:])
        
        return content
    
    def _basic_adaptation_fallback(self, cv_content: str, job_description: str) -> str:
        """Fallback method for basic CV adaptation without LLM."""
        logger.info("Using fallback adaptation method")
        
        # Extract key terms from job description
        job_keywords = self._extract_keywords(job_description)
        
        # Create a basic adapted version
        adapted_cv = f"""# Adapted CV
*CV adapted on {datetime.now().strftime('%B %d, %Y')}*

## Profile Summary
This CV has been tailored to match the requirements for this position, emphasizing relevant skills and experience.

**Key Skills Alignment:**
{', '.join(job_keywords[:10])}

---

## Original CV Content

{cv_content}

---

*Note: This CV was adapted using a basic algorithm. For better results, please configure an LLM service.*
"""
        
        return adapted_cv
    
    def _extract_keywords(self, text: str) -> list:
        """Extract potential keywords from job description."""
        import re
        
        # Simple keyword extraction
        words = re.findall(r'\b[A-Za-z]{3,}\b', text.lower())
        
        # Filter out common words
        common_words = {
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 
            'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 
            'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 
            'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'will', 'work',
            'with', 'this', 'that', 'they', 'have', 'from', 'been', 'would', 'there'
        }
        
        keywords = [word for word in set(words) if word not in common_words and len(word) > 3]
        return sorted(keywords)[:20]  # Return top 20 keywords