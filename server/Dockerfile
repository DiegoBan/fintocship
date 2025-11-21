FROM node:18

WORKDIR /app

# Copiamos primero los package para aprovechar el caché de Docker
COPY package*.json ./

RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "dev"]