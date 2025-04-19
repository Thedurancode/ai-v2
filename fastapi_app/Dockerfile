FROM python:3.9-slim

WORKDIR /app

# Install dependencies and some debug tools
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    apt-get update && \
    apt-get install -y curl procps net-tools && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create data directory for SQLite with proper permissions
RUN mkdir -p /data && chmod 777 /data
ENV DB_PATH=/data/dura_history.db

# Set environment variables
ENV PORT=8080
ENV HOST=0.0.0.0

# Copy application code
COPY . .

# Explicitly expose the port
EXPOSE 8080

# Run the application with Uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "debug"]