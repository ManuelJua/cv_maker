import aiohttp
import asyncio
from bs4 import BeautifulSoup
import logging
from urllib.parse import urlparse
import re
from typing import Optional

logger = logging.getLogger(__name__)

class JobScraper:
    """Service for scraping job descriptions from various job sites."""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.timeout = aiohttp.ClientTimeout(total=30)
    
    async def scrape_job_description(self, url: str) -> str:
        """
        Scrape job description from the provided URL.
        
        Args:
            url: Job posting URL from LinkedIn, Indeed, or Reed
            
        Returns:
            str: Extracted job description text
        """
        try:
            domain = self._get_domain(url)
            
            if 'linkedin.com' in domain:
                return await self._scrape_linkedin(url)
            elif 'indeed.com' in domain:
                return await self._scrape_indeed(url)
            elif 'reed.co.uk' in domain:
                return await self._scrape_reed(url)
            else:
                raise ValueError(f"Unsupported job site: {domain}")
                
        except Exception as e:
            logger.error(f"Error scraping job description from {url}: {str(e)}")
            raise
    
    def _get_domain(self, url: str) -> str:
        """Extract domain from URL."""
        parsed_url = urlparse(url)
        return parsed_url.netloc.lower()
    
    async def _fetch_page(self, url: str) -> str:
        """Fetch webpage content."""
        try:
            async with aiohttp.ClientSession(headers=self.headers, timeout=self.timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        return await response.text()
                    else:
                        raise Exception(f"HTTP {response.status}: Failed to fetch page")
                        
        except asyncio.TimeoutError:
            raise Exception("Request timeout - the job site may be slow to respond")
        except Exception as e:
            raise Exception(f"Failed to fetch page: {str(e)}")
    
    async def _scrape_linkedin(self, url: str) -> str:
        """Scrape job description from LinkedIn."""
        try:
            html = await self._fetch_page(url)
            soup = BeautifulSoup(html, 'html.parser')
            
            # LinkedIn job description selectors
            selectors = [
                '.description__text',
                '.jobs-description__content',
                '.jobs-box__html-content',
                '[data-job-description]'
            ]
            
            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    text = self._clean_text(element.get_text())
                    if len(text) > 100:  # Ensure we got substantial content
                        return text
            
            # Fallback: try to find any substantial text content
            return self._extract_fallback_content(soup)
            
        except Exception as e:
            logger.error(f"Error scraping LinkedIn: {str(e)}")
            raise Exception(f"Failed to extract job description from LinkedIn: {str(e)}")
    
    async def _scrape_indeed(self, url: str) -> str:
        """Scrape job description from Indeed."""
        try:
            html = await self._fetch_page(url)
            soup = BeautifulSoup(html, 'html.parser')
            
            # Indeed job description selectors
            selectors = [
                '#jobDescriptionText',
                '.jobsearch-jobDescriptionText',
                '.jobsearch-JobMetadataHeader-item'
            ]
            
            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    text = self._clean_text(element.get_text())
                    if len(text) > 100:
                        return text
            
            return self._extract_fallback_content(soup)
            
        except Exception as e:
            logger.error(f"Error scraping Indeed: {str(e)}")
            raise Exception(f"Failed to extract job description from Indeed: {str(e)}")
    
    async def _scrape_reed(self, url: str) -> str:
        """Scrape job description from Reed."""
        try:
            html = await self._fetch_page(url)
            soup = BeautifulSoup(html, 'html.parser')
            
            # Reed job description selectors
            selectors = [
                '.description',
                '.job-description',
                '[data-qa="job-description"]'
            ]
            
            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    text = self._clean_text(element.get_text())
                    if len(text) > 100:
                        return text
            
            return self._extract_fallback_content(soup)
            
        except Exception as e:
            logger.error(f"Error scraping Reed: {str(e)}")
            raise Exception(f"Failed to extract job description from Reed: {str(e)}")
    
    def _extract_fallback_content(self, soup: BeautifulSoup) -> str:
        """Extract content using fallback method when specific selectors fail."""
        try:
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "header", "footer"]):
                script.decompose()
            
            # Get text and clean it
            text = self._clean_text(soup.get_text())
            
            # Try to find the largest text block that might be the job description
            paragraphs = text.split('\n\n')
            longest_paragraph = max(paragraphs, key=len) if paragraphs else text
            
            if len(longest_paragraph) > 200:
                return longest_paragraph
            
            # If no substantial content found, return what we have
            return text[:2000] if len(text) > 100 else text
            
        except Exception as e:
            logger.error(f"Fallback extraction failed: {str(e)}")
            return "Could not extract job description content"
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        if not text:
            return ""
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        # Remove common navigation elements
        unwanted_phrases = [
            'Cookie Policy', 'Privacy Policy', 'Terms of Use',
            'Sign in', 'Register', 'Apply Now', 'Save Job',
            'Share', 'Report', 'Back to search'
        ]
        
        for phrase in unwanted_phrases:
            text = text.replace(phrase, '')
        
        return text.strip()