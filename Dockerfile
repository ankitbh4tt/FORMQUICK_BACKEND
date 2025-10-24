# 1. Base image
FROM node:18-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm ci --only=production

# 5. Copy source files
COPY . .

# 6. Build TypeScript
RUN npm run build

# 7. Expose port
EXPOSE 8080

# 8. Start command
CMD ["node", "dist/index.js"]
