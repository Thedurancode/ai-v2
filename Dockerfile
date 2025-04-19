FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the React build
COPY dura-react/dist ./dura-react/dist

# Copy the Flask application
COPY app ./app
COPY wsgi.py .
COPY .env.production .env

# Expose the port
EXPOSE 8080

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "wsgi:app"]
