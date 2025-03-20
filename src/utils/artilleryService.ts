import { Endpoint, LoadTest, TestResult } from '../types';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// URL del backend
const API_URL = 'http://localhost:4000/api';
let socket: Socket | null = null;
let socketReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Cache de último resultado para evitar perder métricas
let lastValidResult: TestResult | null = null;

// Función para obtener y conectar el socket si es necesario
const getSocket = () => {
  if (!socket) {
    console.log('Initializing socket connection to Artillery server...');
    socket = io('http://localhost:4000', {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'],  // Probar primero websocket, luego polling
    });
    
    socket.on('connect', () => {
      console.log('Socket.io connection established with server');
      socketReconnectAttempts = 0;
      
      // Si teníamos un ID de resultado activo y un callback, restaurar la suscripción
      if (activeResultId && activeCallback) {
        console.log(`Re-subscribing to updates for test ${activeResultId} after reconnection`);
        setupResultListener(activeResultId, activeCallback);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Socket.io disconnected from server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      socketReconnectAttempts++;
      if (socketReconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
        console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts. Giving up.`);
      }
    });
    
    // Escuchar actualizaciones generales de pruebas
    socket.on('testUpdate', (tests) => {
      if (Array.isArray(tests)) {
        console.log(`Received batch update for ${tests.length} tests`);
        tests.forEach(test => {
          // Si este test coincide con nuestro resultado activo, notificar al callback
          if (activeResultId && test.id === activeResultId && activeCallback) {
            console.log(`Processing batch update for test ${test.id}`, {
              status: test.status,
              progress: test.progress,
              requestsCompleted: test.summary?.requestsCompleted,
              codes: test.summary?.codes
            });
            
            // Validar que los datos sean coherentes antes de propagar la actualización
            if (isValidTestResult(test)) {
              activeCallback(test);
            } else {
              console.warn('Received invalid test data in batch update, ignoring:', test);
            }
          }
        });
      } else if (tests && activeResultId && tests.id === activeResultId && activeCallback) {
        console.log(`Processing single test update for ${tests.id}`, {
          status: tests.status,
          progress: tests.progress,
          requestsCompleted: tests.summary?.requestsCompleted,
          codes: tests.summary?.codes
        });
        
        // Validar que los datos sean coherentes antes de propagar la actualización
        if (isValidTestResult(tests)) {
          activeCallback(tests);
        } else {
          console.warn('Received invalid test data in single update, ignoring:', tests);
        }
      }
    });
  }
  
  return socket;
};

// Función para validar que un resultado de prueba tenga la estructura correcta
function isValidTestResult(result: any): result is TestResult {
  return (
    result &&
    typeof result === 'object' &&
    'id' in result &&
    'status' in result &&
    'summary' in result &&
    result.summary && 
    typeof result.summary === 'object'
  );
}

let activeResultId: string | null = null;
let activeCallback: ((result: TestResult) => void) | null = null;

// Establece un listener para recibir actualizaciones de un resultado específico
const setupResultListener = (resultId: string, callback: (result: TestResult) => void) => {
  const socket = getSocket();
  
  // Guardar globalmente para reconexiones
  activeResultId = resultId;
  activeCallback = callback;
  
  // Primero, eliminar listeners anteriores si existían
  socket.off(`testUpdate:${resultId}`);
  
  // Configurar nuevo listener específico para este resultado
  socket.on(`testUpdate:${resultId}`, (result: TestResult) => {
    console.log(`Received direct update for test ${resultId}:`, {
      status: result.status,
      progress: result.progress,
      codes: Object.keys(result.summary.codes || {}).length > 0 ? result.summary.codes : 'No codes yet',
      requestsCompleted: result.summary.requestsCompleted || 0
    });
    
    // Validar que los datos sean coherentes antes de propagar la actualización
    if (isValidTestResult(result)) {
      callback(result);
    } else {
      console.warn('Received invalid test result in specific update, ignoring:', result);
    }
  });
  
  // Suscribirse explícitamente a este resultado
  console.log(`Subscribing to updates for test ${resultId}`);
  socket.emit('subscribe', resultId);
};

// Servicio de Artillery para comunicarse con el backend
export const artilleryService = {
  /**
   * Ejecuta una prueba de carga con Artillery a través del backend
   */
  runTest: async (
    test: LoadTest,
    endpoints: Endpoint[],
    onProgress?: (result: TestResult) => void
  ): Promise<TestResult> => {
    try {
      console.log('Starting Artillery test execution...');
      
      // Llamar al endpoint de ejecución
      const response = await fetch(`${API_URL}/tests/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test, endpoints }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error running test: ${errorText}`);
      }
      
      const data = await response.json();
      const resultId = data.resultId;
      
      console.log(`Test started with result ID: ${resultId}`);
      
      // Configurar escucha para actualizaciones si se proporciona la función onProgress
      if (onProgress) {
        console.log('Setting up real-time progress listener');
        setupResultListener(resultId, onProgress);
      }
      
      // Esperar a que la prueba se complete mediante polling
      return await waitForTestCompletion(resultId);
    } catch (error) {
      console.error('Error running Artillery test:', error);
      // Proporcionar un resultado fallido en caso de error
      return createErrorResult(test.id, error as Error);
    }
  },

  /**
   * Cancela una prueba de carga en ejecución
   */
  cancelTest: async (resultId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/tests/cancel/${resultId}`, {
        method: 'POST',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error cancelling test:', error);
      return false;
    }
  },

  /**
   * Obtiene el resultado de una prueba por ID
   */
  getTestResult: async (resultId: string): Promise<TestResult | null> => {
    try {
      const response = await fetch(`${API_URL}/tests/result/${resultId}`);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching test result:', error);
      return null;
    }
  },

  /**
   * Obtiene todos los resultados de pruebas
   */
  getAllTestResults: async (): Promise<TestResult[]> => {
    try {
      const response = await fetch(`${API_URL}/tests/results`);
      
      if (!response.ok) {
        return [];
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching test results:', error);
      return [];
    }
  },

  /**
   * Genera la configuración de Artillery en formato YAML
   */
  generateConfig: (test: LoadTest, endpoints: Endpoint[]): string => {
    // Filtrar solo los endpoints incluidos en la prueba
    const selectedEndpoints = endpoints.filter((endpoint) =>
      test.endpoints.includes(endpoint.id)
    );

    // Crear una configuración básica de Artillery
    let config = `config:
  target: "${selectedEndpoints[0]?.url.split('/')[0]}//${selectedEndpoints[0]?.url.split('/')[2]}"
  phases:
    - duration: ${test.config.duration}
      arrivalRate: ${test.config.arrivalRate}`;

    if (test.config.rampTo) {
      config += `
      rampTo: ${test.config.rampTo}`;
    }

    if (test.config.maxVusers) {
      config += `
  maxVusers: ${test.config.maxVusers}`;
    }

    // Add maxLatency config if provided
    if (test.config.maxLatency) {
      config += `
  ensure:
    maxLatency: ${test.config.maxLatency}`;
    }

    // Add scenarios
    config += `
scenarios:
  - name: "API Load Test"
    flow:`;

    // Add requests for each endpoint
    selectedEndpoints.forEach((endpoint) => {
      config += `
      - name: "${endpoint.name}"
        ${endpoint.method.toLowerCase()}: "${endpoint.url.split('/').slice(3).join('/')}"`;

      // Add headers if present
      const headerEntries = Object.entries(endpoint.headers);
      if (headerEntries.length > 0) {
        config += `
          headers:`;
        headerEntries.forEach(([key, value]) => {
          config += `
            ${key}: "${value}"`;
        });
      }

      // Add auth if present
      if (endpoint.auth.type !== 'None') {
        if (!config.includes('headers:')) {
          config += `
          headers:`;
        }
        
        switch (endpoint.auth.type) {
          case 'Bearer':
            config += `
            Authorization: "Bearer ${endpoint.auth.token}"`;
            break;
          case 'Basic':
            const credentials = Buffer.from(
              `${endpoint.auth.username}:${endpoint.auth.password}`
            ).toString('base64');
            config += `
            Authorization: "Basic ${credentials}"`;
            break;
          case 'API Key':
            if (endpoint.auth.in === 'header') {
              config += `
            ${endpoint.auth.key}: "${endpoint.auth.value}"`;
            } else {
              // For query parameters
              config += `
          qs:
            ${endpoint.auth.key}: "${endpoint.auth.value}"`;
            }
            break;
        }
      }

      // Add body if present and method is appropriate
      if (
        endpoint.body &&
        ['POST', 'PUT', 'PATCH'].includes(endpoint.method)
      ) {
        try {
          const jsonBody = JSON.parse(endpoint.body);
          config += `
          json: ${JSON.stringify(jsonBody)}`;
        } catch (e) {
          config += `
          body: "${endpoint.body}"`;
        }
      }
    });

    return config;
  },
};

/**
 * Espera a que un test se complete mediante polling al backend
 */
async function waitForTestCompletion(resultId: string): Promise<TestResult> {
  let attempts = 0;
  const maxAttempts = 600; // Máximo de intentos (10 minutos a 1 segundo por intento)
  
  while (attempts < maxAttempts) {
    const result = await artilleryService.getTestResult(resultId);
    
    if (result) {
      if (result.status !== 'running') {
        return result;
      }
    }
    
    // Esperar 1 segundo antes del siguiente intento
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  throw new Error('Test timeout: test did not complete within the expected time');
}

/**
 * Crea un resultado de error para casos en que el backend falle
 */
function createErrorResult(testId: string, error: Error): TestResult {
  return {
    id: uuidv4(),
    testId,
    timestamp: Date.now(),
    summary: {
      duration: 0,
      scenarios: {
        created: 0,
        completed: 0,
        failed: 0,
      },
      codes: {},
      errors: {
        'ERROR': 1,
      },
      requestsCompleted: 0,
      requestsTimedOut: 0,
      scenariosAvoided: 0,
      latency: {
        min: 0,
        max: 0,
        median: 0,
        p95: 0,
        p99: 0,
      },
      rps: {
        mean: 0,
        count: 0,
      },
    },
    rawOutput: `Error: ${error.message}\n${error.stack || ''}`,
    status: 'failed',
    progress: 0,
  };
}