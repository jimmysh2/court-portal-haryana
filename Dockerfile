# --- Stage 1: Build Frontend & Backend ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package.json and install all dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the client directory and build it
COPY client ./client/
RUN cd client && npm install && npm run build

# Copy the server directory and scripts
COPY server ./server/
COPY scripts ./scripts/

# --- Stage 2: Production Server ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk update && apk add --no-cache openssl libc6-compat

# Copy root manifest and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy generated Prisma files and schema
COPY --from=builder /app/prisma ./prisma
# Generate prisma client for the alpine target 
# (Node 20 alpine works fine, better generate it again just in case or we use copied one, but let's regenerate to avoid library issues)
RUN npx prisma generate

# Copy server code and scripts
COPY --from=builder /app/server ./server
COPY --from=builder /app/scripts ./scripts

# Copy built frontend client to dist
COPY --from=builder /app/client/dist ./client/dist

# Setup uploads directory with correct permissions and give node user access to the app folder
RUN mkdir -p uploads && chown -R node:node /app

# Expose backend port
EXPOSE 3000

# Run as non-root user
USER node

# In production, we run the server
CMD ["node", "server/index.js"]
