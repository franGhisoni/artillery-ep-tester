#!/bin/bash

# Instalar dependencias
npm install

# Construir el frontend
npm run build

# Entrar al directorio del servidor e instalar sus dependencias
cd server
npm install

# Construir el servidor
npm run build

# Crear directorio para guardar el build del frontend donde el servidor pueda accederlo en producción
mkdir -p dist/build

# Volver al directorio raíz y copiar los archivos del build del frontend
cd ..
cp -r build/* server/dist/build/

# Establecer NODE_ENV para producción
echo "NODE_ENV=production" > server/.env 