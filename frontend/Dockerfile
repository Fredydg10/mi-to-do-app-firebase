# 1. Etapa de construcción: Usamos Node para compilar la app
FROM node:20-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Construimos la versión de producción de Vite/React
RUN npm run build

# 2. Etapa de producción: Usamos Nginx (servidor web ultrarrápido) para servir los archivos
FROM nginx:alpine

# Copiamos los archivos compilados de la etapa anterior a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponemos el puerto 80 (estándar de Nginx)
EXPOSE 80

# Iniciamos Nginx
CMD ["nginx", "-g", "daemon off;"]