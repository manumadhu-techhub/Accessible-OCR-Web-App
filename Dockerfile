FROM python:3.13-slim

# Install system packages including OCR language data
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-mal \
    tesseract-ocr-tam \
    tesseract-ocr-hin \
    tesseract-ocr-kan \
    tesseract-ocr-tel \
    poppler-utils \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Hugging Face Spaces requires a non-root user
RUN useradd -m -u 1000 appuser
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app
USER appuser

# Flask settings
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# Hugging Face Spaces expects port 7860
EXPOSE 7860

# Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "300", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info", "app:app"]