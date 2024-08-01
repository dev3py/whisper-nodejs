# Stage 1: Build
FROM node:20.11.0-bullseye-slim AS build
 
# Set working directory
WORKDIR /app
 
# Install pnpm globally
RUN npm install -g pnpm
 
# Copy only the package.json and pnpm-lock.yaml to leverage Docker cache
COPY package.json pnpm-lock.yaml* ./
 
# Install dependencies
RUN pnpm install
 
# Copy the rest of the application source code
COPY . .
 
# Build the project
RUN pnpm run build:prod
 
# Stage 2: Production
FROM node:20.11.0-bullseye-slim
 
# Set working directory
WORKDIR /app
 
# Copy built files from the build stage
COPY --from=build /app/prod-build /app/prod-build
COPY --from=build /app/whisper /app/whisper
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
RUN chmod +x /app/whisper/main
# Expose the port
EXPOSE $PORT
 
# Define the default command to run the application
CMD ["npm", "run", "start:prod"]