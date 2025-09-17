FROM node:20-alpine

WORKDIR /app

# No package-lock.json needed
COPY . .

# Install a static file server
RUN npm install -g serve

EXPOSE 8000

# Serve the static frontend
CMD ["serve", "-s", "-l", "8000", "."]