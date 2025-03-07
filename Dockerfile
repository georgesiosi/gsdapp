# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3050

# Configure Next.js development environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

# Start Next.js in development mode with hot reloading
CMD ["sh", "-c", "rm -rf .next && npm run dev -- --hostname 0.0.0.0"]
