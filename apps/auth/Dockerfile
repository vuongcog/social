# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY apps/auth ./apps/auth
COPY libs ./libs

RUN npm ci
RUN npm run build auth

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
RUN npm ci --only=production

EXPOSE 3000
CMD ["node", "dist/apps/auth/main"]