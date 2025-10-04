# --------------------------------------------------------------
#  Builder stage – installs deps, builds the React client
# --------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# ---------- 1️⃣ Install server deps ----------
# Copy only the root package files (including lockfile if you have it)
COPY package*.json ./
# Use npm ci when a lockfile exists, otherwise fall back to npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---------- 2️⃣ Install client deps + build ----------
COPY client/package*.json ./client/
WORKDIR /app/client
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the client source and build it
COPY client/ .
RUN npm run build                     # → creates ./dist

# --------------------------------------------------------------
#  Runtime stage – thin image that only contains production code
# --------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

# ---------- 3️⃣ Install ONLY production server deps ----------
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# ---------- 4️⃣ Copy server source ----------
COPY server ./server

# ---------- 5️⃣ Bring in the built client ----------
# Express will serve static files from ./public
COPY --from=builder /app/client/dist ./public

# ---------- 6️⃣ Create writable folders ----------
RUN mkdir -p uploads transcripts

# --------------------------------------------------------------
#  Final image configuration
# --------------------------------------------------------------
EXPOSE 3001
ENV NODE_ENV=production

# By default the server reads .env from the working directory.
# You can mount your own .env at run‑time (see the run command below).
CMD ["node", "server/server.js"]