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

# Volver al directorio raíz y copiar los archivos del build 
cd ..

# Mostrar estructura de directorios
echo "Contenido de la raíz:"
ls -la

# Crear directorio build dentro de server/dist
mkdir -p server/dist/build

# Copiar los archivos del build del frontend
cp -r build/* server/dist/build/

# Verificar que se han copiado
echo "Verificando contenido copiado:"
ls -la server/dist/build/

# Establecer NODE_ENV para producción
echo "NODE_ENV=production" > server/.env 