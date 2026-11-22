# Imagen base: Node.js 24 LTS sobre Alpine Linux (liviana y reproducible)
FROM node:24-alpine

WORKDIR /app

# Instalar solo dependencias de producción aprovechando la caché de capas de Docker
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente del backend (excluyendo secretos y pruebas según .dockerignore)
COPY . .

# Crear carpeta de certificados con permisos para el usuario sin privilegios 'node'
RUN mkdir -p /app/uploads/certificados && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "index.js"]
