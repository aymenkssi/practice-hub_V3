FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY yarn.lock* ./

RUN if [ -f yarn.lock ]; then yarn install; else npm install --legacy-peer-deps; fi

COPY . .

RUN if [ -f yarn.lock ]; then yarn build; else npm run build; fi

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
