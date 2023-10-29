# Step 1: Build the React application
FROM node:16 AS build
WORKDIR /app
COPY . ./
RUN npm install
RUN npm run build

# Step 2: Serve the app using an Nginx server
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
