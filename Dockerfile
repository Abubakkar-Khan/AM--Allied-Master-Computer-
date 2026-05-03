# Use alpine-based Nginx for a lightweight container
FROM nginx:alpine

# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy static assets from the current directory (which should be on AM_26 branch)
COPY . .

# Expose port 80 (standard for Nginx)
EXPOSE 80

# Start Nginx and keep it running in the foreground
CMD ["nginx", "-g", "daemon off;"]
