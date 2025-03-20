export interface Endpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: { [key: string]: string };
  body: string;
  auth: {
    type: 'None' | 'Bearer' | 'Basic' | 'API Key';
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
    in?: 'header' | 'query';
  };
}

export interface LoadTest {
  id: string;
  name: string;
  endpoints: string[]; // IDs of endpoints to include in test
  config: {
    duration: number; // in seconds
    arrivalRate: number; // initial users per second
    rampTo?: number; // final users per second (for ramping)
    maxVusers?: number; // maximum number of virtual users
    maxLatency?: number; // maximum acceptable latency in ms
  };
}

export interface TestResult {
  id: string;
  testId: string;
  timestamp: number;
  summary: {
    duration: number;
    scenarios: {
      created: number;
      completed: number;
      failed: number;
    };
    codes: { [key: string]: number };
    errors: { [key: string]: number };
    requestsCompleted: number;
    requestsTimedOut: number;
    scenariosAvoided: number;
    latency: {
      min: number;
      max: number;
      median: number;
      p95: number;
      p99: number;
    };
    rps: {
      mean: number;
      count: number;
    };
  };
  rawOutput: string;
  status: 'running' | 'completed' | 'failed';
  progress?: number; // 0-100
}

// Tipos específicos para el servidor
export interface ArtilleryConfig {
  config: {
    target: string;
    phases: Array<{
      duration: number;
      arrivalRate: number;
      rampTo?: number;
    }>;
    maxVusers?: number;
    ensure?: {
      maxLatency?: number;
    };
  };
  scenarios: Array<{
    name: string;
    flow: Array<{
      name: string;
      request: {
        url: string;
        method: string;
        headers?: Record<string, string>;
        json?: any;
        qs?: Record<string, string>;
      }
    }>;
  }>;
} 