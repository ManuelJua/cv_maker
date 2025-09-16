FROM python:3.12-slim


WORKDIR /app

# Install dependencies (use requirements.txt for reproducible builds)
COPY backend/requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip && \
    pip install -r /app/requirements.txt

# Copy backend code
COPY backend/ /app/

# Railway provides $PORT
ENV PORT=8080
EXPOSE 8080

# Start the FastAPI app
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
