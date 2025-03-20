# Artillery Tester

Una aplicación de escritorio para ejecutar pruebas de carga con Artillery de manera fácil y visual.

## Características

- Interfaz de usuario moderna con diseño glassmórfico
- Configuración visual de endpoints y pruebas de carga
- Ejecución de pruebas de carga reales con Artillery
- Visualización detallada de resultados con gráficos
- Actualización en tiempo real durante la ejecución de pruebas
- Soporte para diferentes métodos HTTP y configuraciones de autenticación

## Tecnologías

- **Frontend**: React, TypeScript, Styled Components, Chart.js
- **Backend**: Node.js, Express, Socket.io
- **Pruebas de carga**: Artillery

## Requisitos previos

- Node.js (versión 14 o superior)
- npm o yarn

## Instalación

1. Clonar el repositorio:
   ```
   git clone https://your-repository-url.git
   cd artillery-tester
   ```

2. Instalar dependencias del frontend:
   ```
   npm install
   ```

3. Instalar dependencias del backend:
   ```
   cd server
   npm install
   cd ..
   ```

## Uso

### Iniciar la aplicación en modo desarrollo

Para iniciar el backend: (dentro de la carpeta server)

```
npm run dev
```
Para iniciar el fronted: (carpeta artillery-tester)

```
npm run start
```

Esto iniciará:
- El frontend en http://localhost:3000
- El backend en http://localhost:4000

### Construir para producción

Para construir el frontend:

```
npm run build
```

Para construir el backend:

```
npm run build:server
```

## Flujo de trabajo

1. **Configurar endpoints**:
   - Crea configuraciones de API endpoints que quieras probar
   - Especifica URL, método, headers, y autenticación

2. **Crear tests**:
   - Define escenarios de prueba de carga
   - Configura tasas de llegada, duración y otros parámetros
   - Selecciona los endpoints a incluir en la prueba

3. **Ejecutar tests**:
   - Inicia la prueba de carga
   - Observa actualizaciones en tiempo real
   - Cancela la prueba si es necesario

4. **Analizar resultados**:
   - Visualiza métricas detalladas como latencia, RPS, tasas de error
   - Examina códigos de estado y errores
   - Revisa la salida completa de Artillery

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir lo que te gustaría cambiar o agregar.

## Licencia

[MIT](LICENSE)
