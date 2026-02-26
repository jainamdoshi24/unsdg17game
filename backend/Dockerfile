# ─── Backend Dockerfile ───────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Expose port
EXPOSE 5000

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENV NODE_ENV=production

CMD ["node", "index.js"]
