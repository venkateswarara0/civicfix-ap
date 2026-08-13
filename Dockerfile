# Use LTS Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy server package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production=false

# Copy client package files and install dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy application source code
COPY server/ ./server/
COPY client/ ./client/

# Build client production bundle
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production

# Start single-service production server
CMD ["node", "server/server.js"]
