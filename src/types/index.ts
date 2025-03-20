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
} 