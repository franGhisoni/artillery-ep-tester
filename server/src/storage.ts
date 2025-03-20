import fs from 'fs';
import path from 'path';
import { Endpoint, LoadTest, TestResult } from './types';

// Directorio para almacenar datos persistentes
const DATA_DIR = path.join(process.cwd(), 'data');

// Asegurar que el directorio exista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Rutas de archivos
const ENDPOINTS_FILE = path.join(DATA_DIR, 'endpoints.json');
const TESTS_FILE = path.join(DATA_DIR, 'tests.json');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');

// Función para leer datos de un archivo
const readData = <T>(filePath: string, defaultValue: T): T => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as T;
    }
  } catch (error) {
    console.error(`Error reading from ${filePath}:`, error);
  }
  return defaultValue;
};

// Función para escribir datos a un archivo
const writeData = <T>(filePath: string, data: T): boolean => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
};

// API de almacenamiento
export const storage = {
  // Endpoints
  getEndpoints: (): Endpoint[] => {
    return readData<Endpoint[]>(ENDPOINTS_FILE, []);
  },
  
  saveEndpoints: (endpoints: Endpoint[]): boolean => {
    return writeData<Endpoint[]>(ENDPOINTS_FILE, endpoints);
  },
  
  // Tests
  getTests: (): LoadTest[] => {
    return readData<LoadTest[]>(TESTS_FILE, []);
  },
  
  saveTests: (tests: LoadTest[]): boolean => {
    return writeData<LoadTest[]>(TESTS_FILE, tests);
  },
  
  // Results (limitamos a los últimos 50 para evitar archivos muy grandes)
  getResults: (): TestResult[] => {
    return readData<TestResult[]>(RESULTS_FILE, []);
  },
  
  saveResult: (result: TestResult): boolean => {
    const results = storage.getResults();
    // Añadir el nuevo resultado al principio
    results.unshift(result);
    // Limitar a los 50 más recientes
    const limitedResults = results.slice(0, 50);
    return writeData<TestResult[]>(RESULTS_FILE, limitedResults);
  },
  
  // Exportar todos los datos a un archivo
  exportAllData: (filePath: string): boolean => {
    try {
      const allData = {
        endpoints: storage.getEndpoints(),
        tests: storage.getTests(),
        results: storage.getResults()
      };
      fs.writeFileSync(filePath, JSON.stringify(allData, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      return false;
    }
  },
  
  // Importar datos desde un archivo
  importData: (filePath: string): boolean => {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsedData = JSON.parse(data);
      
      if (parsedData.endpoints) {
        storage.saveEndpoints(parsedData.endpoints);
      }
      
      if (parsedData.tests) {
        storage.saveTests(parsedData.tests);
      }
      
      if (parsedData.results) {
        writeData<TestResult[]>(RESULTS_FILE, parsedData.results);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}; 