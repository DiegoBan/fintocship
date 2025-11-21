# Usa una imagen oficial de Node.js
FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Comando por defecto
CMD ["npm", "run", "dev"]