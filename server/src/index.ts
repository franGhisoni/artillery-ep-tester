import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

import { artilleryService } from './artilleryService';
import { storage } from './storage';
import { Endpoint, LoadTest, TestResult } from './types';

// Load environment variables from .env file
dotenv.config();

// Configuración básica
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Crear servidor HTTP para socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Permitir todos los orígenes en desarrollo
    methods: ['GET', 'POST']
  }
});

// Mapeo de ID de resultado a socket.io para actualizaciones en tiempo real
const resultToSocketMap: Map<string, string[]> = new Map();

// Configuración de Socket.io
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Suscribirse a actualizaciones de una prueba específica
  socket.on('subscribe', (resultId: string) => {
    console.log(`Socket ${socket.id} suscrito a actualizaciones de resultado ${resultId}`);
    
    // Añadir a la sala de socket.io para este resultId
    socket.join(resultId);
    
    // También mantener un registro para casos de reconexión
    if (!resultToSocketMap.has(resultId)) {
      resultToSocketMap.set(resultId, []);
    }
    resultToSocketMap.get(resultId)?.push(socket.id);
    
    // Enviar el resultado actual si existe
    const currentResult = artilleryService.getTestResult(resultId);
    if (currentResult) {
      console.log(`Enviando resultado actual para ${resultId} al cliente ${socket.id}`);
      
      // Emitir directamente a este socket
      socket.emit('testUpdate', currentResult);
      
      // También emitir evento específico
      socket.emit(`testUpdate:${resultId}`, currentResult);
    } else {
      console.log(`No se encontró resultado para ${resultId}`);
    }
  });
  
  // Limpiar cuando se desconecte
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    // Eliminar de todas las salas y mapeos
    for (const [resultId, sockets] of resultToSocketMap.entries()) {
      const index = sockets.indexOf(socket.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          resultToSocketMap.delete(resultId);
        }
      }
    }
  });
});

// Intervalo para enviar actualizaciones periódicas de tests en ejecución
const updateInterval = setInterval(() => {
  // Enviar actualizaciones de pruebas en curso a clientes conectados
  const runningTests = artilleryService.getAllTestResults().filter(result => result.status === 'running');
  
  if (runningTests.length > 0) {
    console.log(`Enviando actualizaciones periódicas para ${runningTests.length} tests en ejecución`);
    
    // Enviar cada test a sus clientes suscritos
    runningTests.forEach(test => {
      console.log(`Enviando actualización para test ${test.id}. Estado: ${test.status}, Progreso: ${test.progress}%, Requests: ${test.summary.requestsCompleted}, Codes: ${JSON.stringify(test.summary.codes)}`);
      
      // Emitir a la sala específica
      io.to(test.id).emit('testUpdate', test);
      
      // También emitir evento específico para este test
      io.to(test.id).emit(`testUpdate:${test.id}`, test);
      
      // Y emitir a todos para compatibilidad hacia atrás
      io.emit(`testUpdate:${test.id}`, test);
    });
    
    // También emitir a todos para compatibilidad
    io.emit('testUpdate', runningTests);
  }
}, 500); // Actualizar cada medio segundo para mayor reactividad

// Limpiar intervalo al cerrar la aplicación
process.on('SIGINT', () => {
  clearInterval(updateInterval);
  process.exit(0);
});

// Cargar datos al iniciar el servidor
const endpoints = storage.getEndpoints();
console.log(`Cargados ${endpoints.length} endpoints desde almacenamiento persistente`);

const tests = storage.getTests();
console.log(`Cargadas ${tests.length} pruebas desde almacenamiento persistente`);

// Rutas API

// ========== ENDPOINTS ==========

// Obtener todos los endpoints
app.get('/api/endpoints', (req, res) => {
  res.status(200).json(storage.getEndpoints());
});

// Crear o actualizar un endpoint
app.post('/api/endpoints', (req, res) => {
  try {
    const endpoint = req.body as Endpoint;
    const endpoints = storage.getEndpoints();
    
    // Verificar si ya existe
    const index = endpoints.findIndex(e => e.id === endpoint.id);
    if (index !== -1) {
      endpoints[index] = endpoint;
    } else {
      endpoints.push(endpoint);
    }
    
    storage.saveEndpoints(endpoints);
    res.status(200).json(endpoint);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un endpoint
app.delete('/api/endpoints/:id', (req, res) => {
  try {
    const { id } = req.params;
    const endpoints = storage.getEndpoints();
    const newEndpoints = endpoints.filter(e => e.id !== id);
    
    if (endpoints.length === newEndpoints.length) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    
    storage.saveEndpoints(newEndpoints);
    
    // También actualizar pruebas que usan este endpoint
    const tests = storage.getTests();
    const updatedTests = tests.map(test => ({
      ...test,
      endpoints: test.endpoints.filter(endpointId => endpointId !== id)
    }));
    
    storage.saveTests(updatedTests);
    
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TESTS ==========

// Obtener todas las pruebas
app.get('/api/tests', (req, res) => {
  res.status(200).json(storage.getTests());
});

// Crear o actualizar una prueba
app.post('/api/tests', (req, res) => {
  try {
    const test = req.body as LoadTest;
    const tests = storage.getTests();
    
    // Verificar si ya existe
    const index = tests.findIndex(t => t.id === test.id);
    if (index !== -1) {
      tests[index] = test;
    } else {
      tests.push(test);
    }
    
    storage.saveTests(tests);
    res.status(200).json(test);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar una prueba
app.delete('/api/tests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tests = storage.getTests();
    const newTests = tests.filter(t => t.id !== id);
    
    if (tests.length === newTests.length) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    storage.saveTests(newTests);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TEST EXECUTION ==========

// Iniciar una nueva prueba
app.post('/api/tests/run', (req, res) => {
  try {
    const { test, endpoints } = req.body as { test: LoadTest, endpoints: Endpoint[] };
    
    if (!test || !endpoints || !Array.isArray(endpoints)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    const resultId = artilleryService.runTest(test, endpoints);
    
    // Configurar un intervalo para enviar actualizaciones del estado de la prueba a través de WebSocket
    const updateInterval = setInterval(() => {
      const result = artilleryService.getTestResult(resultId);
      
      if (result) {
        // Emitir a todos los clientes en la sala de este resultado
        io.to(resultId).emit('testUpdate', result);
        io.to(resultId).emit(`testUpdate:${resultId}`, result);
        
        // También emitir a todos para compatibilidad
        io.emit(`testUpdate:${resultId}`, result);
        
        console.log(`Emitiendo actualización para test ${resultId}. Estado: ${result.status}, Progreso: ${result.progress}%, Requests: ${result.summary.requestsCompleted}`);
        
        // Si la prueba se ha completado o fallado, detener el intervalo
        if (result.status === 'completed' || result.status === 'failed') {
          console.log(`Test ${resultId} ${result.status}. Stopping updates.`);
          
          // Asegurarse de que se envía una actualización final completa
          setTimeout(() => {
            const finalResult = artilleryService.getTestResult(resultId);
            if (finalResult) {
              console.log('Sending final result update with metrics:', {
                requestsCompleted: finalResult.summary.requestsCompleted,
                scenarios: finalResult.summary.scenarios,
                codes: finalResult.summary.codes,
                latency: finalResult.summary.latency,
                rps: finalResult.summary.rps
              });
              
              // Emitir a todos los clientes en la sala
              io.to(resultId).emit('testUpdate', finalResult);
              io.to(resultId).emit(`testUpdate:${resultId}`, finalResult);
              
              // También emitir a todos para compatibilidad
              io.emit(`testUpdate:${resultId}`, finalResult);
              
              // Guardar en almacenamiento persistente
              storage.saveResult(finalResult);
            }
            clearInterval(updateInterval);
          }, 1000); // Esperar 1 segundo antes de enviar la última actualización
        }
      }
    }, 500); // Actualizar cada medio segundo para mayor reactividad
    
    return res.status(200).json({ resultId });
  } catch (error: any) {
    console.error('Error running test:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Obtener resultado de una prueba específica
app.get('/api/tests/result/:resultId', (req, res) => {
  try {
    const { resultId } = req.params;
    const result = artilleryService.getTestResult(resultId);
    
    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Obtener todos los resultados de pruebas
app.get('/api/tests/results', (req, res) => {
  try {
    // Combinar resultados en memoria con resultados almacenados
    const memoryResults = artilleryService.getAllTestResults();
    const storedResults = storage.getResults();
    
    // Combinar y eliminar duplicados
    const allResultIds = new Set();
    const combinedResults = [];
    
    for (const result of [...memoryResults, ...storedResults]) {
      if (!allResultIds.has(result.id)) {
        allResultIds.add(result.id);
        combinedResults.push(result);
      }
    }
    
    // Ordenar por timestamp más reciente primero
    combinedResults.sort((a, b) => b.timestamp - a.timestamp);
    
    return res.status(200).json(combinedResults);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Cancelar una prueba en ejecución
app.post('/api/tests/cancel/:resultId', (req, res) => {
  try {
    const { resultId } = req.params;
    const success = artilleryService.cancelTest(resultId);
    
    if (!success) {
      return res.status(404).json({ error: 'Test not found or already completed' });
    }
    
    return res.status(200).json({ message: 'Test cancelled successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ========== DATA IMPORT/EXPORT ==========

// Exportar todos los datos
app.get('/api/export', (req, res) => {
  try {
    const exportPath = path.join(process.cwd(), 'data', 'export.json');
    const success = storage.exportAllData(exportPath);
    
    if (!success) {
      return res.status(500).json({ error: 'Error exporting data' });
    }
    
    return res.download(exportPath, 'artillery-tester-data.json', (err) => {
      if (err) {
        console.error('Error sending export file:', err);
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Importar datos
app.post('/api/import', (req, res) => {
  try {
    // Esta ruta necesitaría un middleware para manejar la carga de archivos
    // Por ahora, usaremos un enfoque simulado para demostración
    const importPath = path.join(process.cwd(), 'data', 'import.json');
    const success = storage.importData(importPath);
    
    if (!success) {
      return res.status(500).json({ error: 'Error importing data' });
    }
    
    return res.status(200).json({ message: 'Data imported successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  // Ruta al directorio build del frontend
  let staticPath = path.join(process.cwd(), 'dist', 'build');
  
  // Si no existe, intentar con la ruta alternativa dentro de server/
  if (!require('fs').existsSync(staticPath)) {
    staticPath = path.join(process.cwd(), 'server', 'dist', 'build');
  }

  console.log('Serving static files from:', staticPath);
  
  // Servir archivos estáticos
  app.use(express.static(staticPath));
  
  // Para cualquier ruta no encontrada, servir index.html
  app.get('*', (req, res) => {
    if (require('fs').existsSync(path.join(staticPath, 'index.html'))) {
      res.sendFile(path.join(staticPath, 'index.html'));
    } else {
      res.status(404).send('Frontend build not found. Please check the build process.');
    }
  });
}

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data storage directory: ${path.join(process.cwd(), 'data')}`);
}); 