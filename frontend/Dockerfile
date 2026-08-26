# Etapa 1: Construcción
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json pnpm-lock.yaml* ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Sobrescribir variable de entorno para que apunte al proxy local de Nginx
ENV VITE_API_URL=/api

# Compilar el proyecto
RUN npm run build

# Etapa 2: Nginx
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos desde la etapa de construcción (dist o build, vite usa dist por defecto)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
