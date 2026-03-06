FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/
COPY prisma/seed.ts ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY src ./src/
COPY tsconfig.json nest-cli.json ./

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Delete any cached migrations and run deploy
CMD rm -rf prisma/migrations 2>/dev/null || true && npx prisma db push --accept-data-loss && npx prisma db seed && npm run start:prod
