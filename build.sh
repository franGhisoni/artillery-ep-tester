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

# Volver al directorio raíz
cd .. 