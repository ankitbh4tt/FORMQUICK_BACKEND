# 1. Base image
FROM node:18-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install ALL dependencies (dev included for build)
RUN npm ci

# 5. Copy source files
COPY . .

# 6. Build TypeScript
RUN npm run build

# 7. Prune to production-only (removes dev deps to slim down image)
RUN npm prune --production

# 8. Expose port
EXPOSE 8080

# 9. Start command
CMD ["node", "dist/index.js"]