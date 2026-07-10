# build stage
FROM node:18 AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=${VITE_API_URL}
ARG VITE_STRIPE_PK=pk_test_4eC39HqLyjWDarhtT657B3h5
ENV VITE_STRIPE_PK=${VITE_STRIPE_PK}
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
