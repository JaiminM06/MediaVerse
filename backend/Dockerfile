FROM node:20-alpine

# Install FFmpeg for the video worker
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create logs directory and ensure node user owns the app directory
RUN mkdir -p logs && chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 8000

CMD ["node", "src/index.js"]
