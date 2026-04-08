# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client ./
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache postgresql-client gzip curl openssl python3 make g++ gcc libc-dev

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies only (production)
RUN npm install --omit=dev --ignore-scripts

# Copy prisma folder
COPY prisma ./prisma

# Copy server folder
COPY server ./server

# Copy scripts folder
COPY scripts ./scripts

# Copy data files for seeding
COPY ["TESTING COURT EXCEL FILE", "./TESTING COURT EXCEL FILE"]
COPY Disrtrict_PS.csv ./
COPY Police_Stations_Haryana.xlsx ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/client/dist ./client/dist

# Generate Prisma client
RUN npx prisma generate

# Expose the API port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
