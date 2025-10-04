# --------------------------------------------------------------
#  Builder stage – install deps, compile the React client
# --------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# ---- Server deps -------------------------------------------------
COPY package*.json ./
# Use npm ci when a lockfile exists, otherwise fall back to npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---- Client deps -------------------------------------------------
COPY client/package*.json ./client/
WORKDIR /app/client
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the client source and build it
COPY client/ .
RUN npm run build                     # → creates ./dist

# --------------------------------------------------------------
#  Runtime stage – minimal image that only has production code
# --------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

# ---- Install only production server deps -------------------------
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# ---- Copy server source -------------------------------------------
COPY server ./server

# ---- Copy the built client (served as static files) -------------
COPY --from=builder /app/client/dist ./public

# ---- Create writable folders (uploads, transcripts) -------------
RUN mkdir -p uploads transcripts

# --------------------------------------------------------------
#  Final configuration
# --------------------------------------------------------------
EXPOSE 3001
ENV NODE_ENV=production

# By default the server will read a .env file in /app if you mount one.
CMD ["node", "server/server.js"]