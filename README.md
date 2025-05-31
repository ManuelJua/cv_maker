# CV Adapter Web Application

A web application that automatically adapts CVs to match job descriptions using AI. Upload your CV and provide a job posting URL to get a tailored version that highlights your most relevant skills and experience.

## Features

- **File Upload Support**: Accept PDF and TXT CV files
- **Job Site Integration**: Extract job descriptions from LinkedIn, Indeed, and Reed
- **AI-Powered Adaptation**: Use OpenAI or local LLM models to intelligently adapt CVs
- **Markdown Output**: Get adapted CVs in clean markdown format
- **Download Functionality**: Download adapted CVs for immediate use
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

### Frontend
- **Technology**: HTML, CSS, vanilla JavaScript
- **Features**: File upload, URL validation, progress indicators, markdown preview
- **Location**: `/frontend/`

### Backend
- **Technology**: FastAPI (Python)
- **Features**: File processing, web scraping, LLM integration, API endpoints
- **Location**: `/backend/`

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js (optional, for serving frontend)
- OpenAI API key (optional, for best results)

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   pip install -r ../requirements.txt
   ```

2. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-3.5-turbo
   USE_LOCAL_MODEL=false
   LOCAL_MODEL_URL=http://localhost:11434
   ```

3. **Run the Backend**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Serve the Frontend**
   Option A - Using Python's built-in server:
   ```bash
   cd frontend
   python -m http.server 3000
   ```
   
   Option B - Using Node.js:
   ```bash
   cd frontend
   npx serve .
   ```

2. **Access the Application**
   Open `http://localhost:3000` in your browser

## API Documentation

### Endpoints

#### `POST /api/adapt-cv`
Adapt a CV to match a job description.

**Request:**
- `cv_file`: CV file (PDF or TXT)
- `job_url`: Job posting URL

**Response:**
```json
{
  "adapted_cv": "# John Doe\n\n## Summary\n...",
  "original_cv_length": 1500,
  "job_description_length": 800
}
```

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

## Project Structure

```
cv_maker/
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # CSS styles
│   └── script.js           # JavaScript logic
├── backend/
│   ├── main.py             # FastAPI application
│   ├── models/
│   │   └── schemas.py      # Pydantic models
│   └── services/
│       ├── cv_processor.py # CV file processing
│       ├── job_scraper.py  # Job description scraping
│       └── llm_adapter.py  # LLM integration
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## Configuration Options

### LLM Providers

**OpenAI (Recommended)**
- Set `OPENAI_API_KEY` in environment
- Choose model with `OPENAI_MODEL` (default: gpt-3.5-turbo)

**Local Models (Ollama)**
- Set `USE_LOCAL_MODEL=true`
- Install Ollama and run a model
- Configure `LOCAL_MODEL_URL` if needed

**Fallback Mode**
- If no LLM is configured, uses basic keyword matching
- Still functional but less sophisticated

### Supported Job Sites

- **LinkedIn**: linkedin.com job postings
- **Indeed**: indeed.com job listings
- **Reed**: reed.co.uk positions

## Development

### Adding New Job Sites

1. Add domain detection in `job_scraper.py`
2. Implement site-specific scraping method
3. Add CSS selectors for content extraction
4. Test with sample URLs

### Customizing LLM Prompts

Edit the prompts in `llm_adapter.py`:
- `_get_system_prompt()`: Overall instructions
- `_create_adaptation_prompt()`: Specific task prompt

### Frontend Customization

- Modify `styles.css` for appearance changes
- Update `script.js` for behavior modifications
- Edit `index.html` for structure changes

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend allows frontend origin
   - Check CORS middleware configuration

2. **File Upload Fails**
   - Verify file size limits
   - Check supported file types

3. **Job Scraping Fails**
   - Some sites may block automated access
   - Try different URLs from the same site
   - Check if site structure has changed

4. **LLM Errors**
   - Verify API key configuration
   - Check rate limits and usage quotas
   - Try fallback mode for testing

### Logs and Debugging

- Backend logs appear in console
- Check browser developer tools for frontend issues
- API documentation available at `http://localhost:8000/docs`

## Future Enhancements

- [ ] Support for more job sites
- [ ] Multiple CV format outputs (PDF, DOCX)
- [ ] User accounts and CV history
- [ ] Batch processing for multiple jobs
- [ ] Advanced formatting options
- [ ] Integration with more LLM providers
- [ ] Real-time collaboration features

## License

This project is open source and available under the MIT License.