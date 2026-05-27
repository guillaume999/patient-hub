# syntax=docker/dockerfile:1
# Multi-stage Dockerfile for React + Vite app served by nginx

# -- Stage 1: Build -------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with npm
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Build with a placeholder URL - replaced at container startup by entrypoint
ARG VITE_PB_URL=__PB_URL_PLACEHOLDER__
ENV VITE_PB_URL=${VITE_PB_URL}
RUN npm run build

# -- Stage 2: Serve with nginx --------------------------------------
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script that injects PB_URL at runtime
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 8081 inside the container
EXPOSE 8081

ENTRYPOINT ["/docker-entrypoint.sh"]
