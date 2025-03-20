"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Directorio para almacenar datos persistentes
const DATA_DIR = path_1.default.join(process.cwd(), 'data');
// Asegurar que el directorio exista
if (!fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
// Rutas de archivos
const ENDPOINTS_FILE = path_1.default.join(DATA_DIR, 'endpoints.json');
const TESTS_FILE = path_1.default.join(DATA_DIR, 'tests.json');
const RESULTS_FILE = path_1.default.join(DATA_DIR, 'results.json');
// Función para leer datos de un archivo
const readData = (filePath, defaultValue) => {
    try {
        if (fs_1.default.existsSync(filePath)) {
            const data = fs_1.default.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.error(`Error reading from ${filePath}:`, error);
    }
    return defaultValue;
};
// Función para escribir datos a un archivo
const writeData = (filePath, data) => {
    try {
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    }
    catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
        return false;
    }
};
// API de almacenamiento
exports.storage = {
    // Endpoints
    getEndpoints: () => {
        return readData(ENDPOINTS_FILE, []);
    },
    saveEndpoints: (endpoints) => {
        return writeData(ENDPOINTS_FILE, endpoints);
    },
    // Tests
    getTests: () => {
        return readData(TESTS_FILE, []);
    },
    saveTests: (tests) => {
        return writeData(TESTS_FILE, tests);
    },
    // Results (limitamos a los últimos 50 para evitar archivos muy grandes)
    getResults: () => {
        return readData(RESULTS_FILE, []);
    },
    saveResult: (result) => {
        const results = exports.storage.getResults();
        // Añadir el nuevo resultado al principio
        results.unshift(result);
        // Limitar a los 50 más recientes
        const limitedResults = results.slice(0, 50);
        return writeData(RESULTS_FILE, limitedResults);
    },
    // Exportar todos los datos a un archivo
    exportAllData: (filePath) => {
        try {
            const allData = {
                endpoints: exports.storage.getEndpoints(),
                tests: exports.storage.getTests(),
                results: exports.storage.getResults()
            };
            fs_1.default.writeFileSync(filePath, JSON.stringify(allData, null, 2), 'utf8');
            return true;
        }
        catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    },
    // Importar datos desde un archivo
    importData: (filePath) => {
        try {
            const data = fs_1.default.readFileSync(filePath, 'utf8');
            const parsedData = JSON.parse(data);
            if (parsedData.endpoints) {
                exports.storage.saveEndpoints(parsedData.endpoints);
            }
            if (parsedData.tests) {
                exports.storage.saveTests(parsedData.tests);
            }
            if (parsedData.results) {
                writeData(RESULTS_FILE, parsedData.results);
            }
            return true;
        }
        catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};
