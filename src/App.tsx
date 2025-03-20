import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { theme, GlobalStyles } from './styles/GlobalStyles';
import EndpointForm from './components/EndpointForm';
import LoadTestForm from './components/LoadTestForm';
import TestResults from './components/TestResults';
import TestProgress from './components/TestProgress';
import { artilleryService } from './utils/artilleryService';
import {
  PageContainer,
  Header,
  Heading,
  Subheading,
  MainContent,
  GlassContainer,
  GlassCard,
  Button,
  Console,
  Grid,
  Flex,
  Badge,
  Separator,
} from './styles/StyledComponents';
import { Endpoint, LoadTest, TestResult } from './types';

const App: React.FC = () => {
  // State for endpoints, tests, and results
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [tests, setTests] = useState<LoadTest[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'endpoints' | 'tests' | 'results'>('endpoints');
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [editingTest, setEditingTest] = useState<LoadTest | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testOutput, setTestOutput] = useState<string>('');
  const [runningTestId, setRunningTestId] = useState<string | null>(null);

  // Cargar datos al iniciar
  useEffect(() => {
    // Cargar endpoints
    fetch('http://localhost:4000/api/endpoints')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEndpoints(data);
        }
      })
      .catch(error => console.error('Error loading endpoints:', error));

    // Cargar tests
    fetch('http://localhost:4000/api/tests')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTests(data);
        }
      })
      .catch(error => console.error('Error loading tests:', error));

    // Cargar resultados anteriores
    fetch('http://localhost:4000/api/tests/results')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setResults(data);
        }
      })
      .catch(error => console.error('Error loading results:', error));
  }, []);

  // Handle saving a new or edited endpoint
  const handleSaveEndpoint = (endpoint: Endpoint) => {
    // Guardar en el backend
    fetch('http://localhost:4000/api/endpoints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(endpoint),
    })
      .then(response => response.json())
      .then(() => {
        if (editingEndpoint) {
          // Update existing endpoint
          setEndpoints(endpoints.map(e => e.id === endpoint.id ? endpoint : e));
          setEditingEndpoint(null);
        } else {
          // Add new endpoint
          setEndpoints([...endpoints, endpoint]);
        }
        setIsAddingEndpoint(false);
      })
      .catch(error => console.error('Error saving endpoint:', error));
  };

  // Handle saving a new or edited test
  const handleSaveTest = (test: LoadTest) => {
    // Guardar en el backend
    fetch('http://localhost:4000/api/tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(test),
    })
      .then(response => response.json())
      .then(() => {
        if (editingTest) {
          // Update existing test
          setTests(tests.map(t => t.id === test.id ? test : t));
          setEditingTest(null);
        } else {
          // Add new test
          setTests([...tests, test]);
        }
        setIsAddingTest(false);
      })
      .catch(error => console.error('Error saving test:', error));
  };

  // Delete an endpoint
  const handleDeleteEndpoint = (id: string) => {
    // Eliminar en el backend
    fetch(`http://localhost:4000/api/endpoints/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setEndpoints(endpoints.filter(endpoint => endpoint.id !== id));

        // Also update any tests that use this endpoint
        setTests(tests.map(test => ({
          ...test,
          endpoints: test.endpoints.filter(endpointId => endpointId !== id)
        })));
      })
      .catch(error => console.error('Error deleting endpoint:', error));
  };

  // Delete a test
  const handleDeleteTest = (id: string) => {
    // Eliminar en el backend
    fetch(`http://localhost:4000/api/tests/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setTests(tests.filter(test => test.id !== id));

        // Also remove related test results
        setResults(results.filter(result => result.testId !== id));
      })
      .catch(error => console.error('Error deleting test:', error));
  };

  // Run a load test
  const handleRunTest = async (test: LoadTest) => {
    setIsRunningTest(true);
    setTestOutput('Starting Artillery load test...\n');
    setActiveTab('results');
    setSelectedResult(null); // Limpiar resultado anterior seleccionado

    try {
      // Generate and display the configuration
      const config = artilleryService.generateConfig(test, endpoints);
      setTestOutput(prev => prev + '\nTest configuration:\n' + config + '\n\nRunning test...\n');

      // Mostrar información sobre el tamaño de la prueba
      const totalVirtualUsers = test.config.duration * test.config.arrivalRate;
      setTestOutput(prev => prev + `\nTest will simulate ${totalVirtualUsers} virtual users over ${test.config.duration} seconds.\n`);

      // Variable para almacenar la mejor métrica obtenida durante la prueba
      let bestMetrics: TestResult | null = null;

      // Callback para manejar actualizaciones en tiempo real
      const handleTestUpdate = (updatedResult: TestResult) => {
        console.log("App received test update:", updatedResult.id,
          "Status:", updatedResult.status,
          "Progress:", updatedResult.progress,
          "Requests:", updatedResult.summary?.requestsCompleted,
          "Codes:", JSON.stringify(updatedResult.summary?.codes));

        // Almacenar el ID del test en ejecución
        setRunningTestId(updatedResult.id);

        // Conservar las mejores métricas encontradas
        if (!bestMetrics) {
          // Primera vez, inicializar con copia profunda
          bestMetrics = JSON.parse(JSON.stringify(updatedResult));
          console.log("Inicializando mejores métricas:", bestMetrics?.summary);
        } else {
          // Actualizar individualmente los valores mejores
          // Códigos HTTP - Fusionar y mantener valor no nulo
          if (updatedResult.summary && updatedResult.summary.codes) {
            Object.entries(updatedResult.summary.codes).forEach(([code, count]) => {
              if (!bestMetrics!.summary.codes[code] || 
                  (count && count > (bestMetrics!.summary.codes[code] || 0))) {
                bestMetrics!.summary.codes[code] = count;
              }
            });
          }

          // Para el resto de métricas, conservar el valor más alto (solo si el nuevo valor es mayor a cero)
          if (updatedResult.summary?.requestsCompleted > 0 && 
              updatedResult.summary.requestsCompleted > (bestMetrics.summary.requestsCompleted || 0)) {
            bestMetrics.summary.requestsCompleted = updatedResult.summary.requestsCompleted;
          }

          // Escenarios
          if (updatedResult.summary?.scenarios?.created > 0 && 
              updatedResult.summary.scenarios.created > (bestMetrics.summary.scenarios.created || 0)) {
            bestMetrics.summary.scenarios.created = updatedResult.summary.scenarios.created;
          }
          if (updatedResult.summary?.scenarios?.completed > 0 && 
              updatedResult.summary.scenarios.completed > (bestMetrics.summary.scenarios.completed || 0)) {
            bestMetrics.summary.scenarios.completed = updatedResult.summary.scenarios.completed;
          }

          // Latencia - Actualizar solo si los valores son razonables (no cero)
          if (updatedResult.summary?.latency?.min > 0) {
            bestMetrics.summary.latency.min = updatedResult.summary.latency.min;
          }
          if (updatedResult.summary?.latency?.max > 0) {
            bestMetrics.summary.latency.max = updatedResult.summary.latency.max;
          }
          if (updatedResult.summary?.latency?.median > 0) {
            bestMetrics.summary.latency.median = updatedResult.summary.latency.median;
          }
          if (updatedResult.summary?.latency?.p95 > 0) {
            bestMetrics.summary.latency.p95 = updatedResult.summary.latency.p95;
          }
          if (updatedResult.summary?.latency?.p99 > 0) {
            bestMetrics.summary.latency.p99 = updatedResult.summary.latency.p99;
          }

          // RPS
          if (updatedResult.summary?.rps?.mean > 0) {
            bestMetrics.summary.rps.mean = updatedResult.summary.rps.mean;
          }
          if (updatedResult.summary?.rps?.count > 0) {
            bestMetrics.summary.rps.count = updatedResult.summary.rps.count;
          }

          console.log("Actualizando mejores métricas:", bestMetrics.summary);
        }

        // Preparar el resultado a mostrar
        let resultToShow: TestResult;

        // Para resultados en ejecución, usar el resultado actualizado,
        // pero preservar las métricas acumuladas para mayor consistencia visual
        if (updatedResult.status === 'running') {
          resultToShow = {
            ...updatedResult,
            summary: {
              ...updatedResult.summary,
              // Preservar códigos HTTP acumulados para evitar fluctuaciones
              codes: { 
                ...bestMetrics?.summary.codes 
              }
            }
          };
        } else if (updatedResult.status === 'completed') {
          // Si está completado, usar las mejores métricas pero mantener el estado actualizado
          resultToShow = {
            ...updatedResult,
            summary: bestMetrics ? { ...bestMetrics.summary } : updatedResult.summary
          };
          console.log("Mostrando resultado COMPLETADO con mejores métricas:", resultToShow.summary);
        } else {
          // Si falló, mostrar tal cual
          resultToShow = updatedResult;
        }

        // Actualizar la lista de resultados
        setResults(prevResults => {
          // Si ya existe este resultado, actualizarlo
          const index = prevResults.findIndex(r => r.id === resultToShow.id);
          if (index !== -1) {
            const newResults = [...prevResults];
            newResults[index] = resultToShow;
            return newResults;
          }
          // Si no existe, agregarlo al principio
          return [resultToShow, ...prevResults];
        });

        // Actualizar el resultado seleccionado SIEMPRE para asegurar que refleje los cambios
        setSelectedResult(resultToShow);

        // Actualizar la salida de texto con información sobre el progreso
        if (updatedResult.status === 'running' && updatedResult.progress) {
          // Solo mostrar actualizaciones cuando cambie el progreso por más de 5%
          const lastProgressMatch = testOutput.match(/Progress: (\d+)% complete/);
          const lastProgress = lastProgressMatch ? parseInt(lastProgressMatch[1], 10) : -10;
          
          if (updatedResult.progress - lastProgress >= 5) {
            setTestOutput(prev =>
              prev + `\nProgress: ${updatedResult.progress}% complete... (${updatedResult.summary?.requestsCompleted || 0} requests completed)`
            );
          }
        } else if (updatedResult.status === 'completed') {
          // Si se completa, usar las mejores métricas recolectadas
          setTestOutput(prev =>
            prev + '\nTest completed successfully. See results below.\n'
          );

          // CORRIGIENDO EL LOOP: Dejar de recibir actualizaciones cuando se completa
          setIsRunningTest(false);
          setRunningTestId(null);

          // Log para depuración
          console.log("Test completed, final metrics:", {
            requestsCompleted: resultToShow.summary.requestsCompleted,
            scenarios: resultToShow.summary.scenarios,
            codes: resultToShow.summary.codes,
            latency: resultToShow.summary.latency,
            rps: resultToShow.summary.rps
          });
        } else if (updatedResult.status === 'failed') {
          setTestOutput(prev =>
            prev + `\nTest failed: ${updatedResult.rawOutput}\n`
          );
          setIsRunningTest(false);
          setRunningTestId(null);
        }
      };

      // Run the test with real-time updates
      const result = await artilleryService.runTest(test, endpoints, handleTestUpdate);
      setRunningTestId(result.id);

      // Add the result to our results list and select it
      setResults(prevResults => {
        const exists = prevResults.some(r => r.id === result.id);
        if (!exists) {
          return [result, ...prevResults];
        }
        return prevResults;
      });
      setSelectedResult(result);

      // Si el test ya se completó (podría pasar rápidamente)
      if (result.status === 'completed' || result.status === 'failed') {
        setIsRunningTest(false);
        setRunningTestId(null);
        setTestOutput(prev => prev +
          (result.status === 'completed'
            ? '\nTest completed successfully. See results below.\n'
            : `\nTest failed: ${result.rawOutput}\n`)
        );
      }
    } catch (error) {
      setTestOutput(prev => prev + `\nError running test: ${error}\n`);
      setIsRunningTest(false);
      setRunningTestId(null);
    }
  };

  // Cancelar una prueba en ejecución
  const handleCancelTest = async () => {
    if (!runningTestId) return;

    try {
      setTestOutput(prev => prev + '\nCancelling test...\n');
      const success = await artilleryService.cancelTest(runningTestId);

      if (success) {
        setTestOutput(prev => prev + 'Test cancelled successfully.\n');
      } else {
        setTestOutput(prev => prev + 'Failed to cancel test.\n');
      }
    } catch (error) {
      setTestOutput(prev => prev + `Error cancelling test: ${error}\n`);
    } finally {
      setIsRunningTest(false);
      setRunningTestId(null);
    }
  };

  return (
    // @ts-ignore - Ignoramos temporalmente el error de tipos de styled-components
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      {/* Elementos animados de fondo */}
      <div className="bg-particle-1"></div>
      <div className="bg-particle-2"></div>
      <div className="bg-particle-3"></div>
      <div className="bg-particle-4"></div>

      <PageContainer>
        <Header>
          <Heading>
            TIB Artillery <span>Test System</span>
          </Heading>
          <Subheading>
            Test your API endpoints with Artillery load testing
          </Subheading>

          <Flex gap="m" style={{ marginTop: '20px' }}>
            <Button
              onClick={() => setActiveTab('endpoints')}
              variant={activeTab === 'endpoints' ? 'primary' : 'ghost'}
            >
              Endpoints
            </Button>
            <Button
              onClick={() => setActiveTab('tests')}
              variant={activeTab === 'tests' ? 'primary' : 'ghost'}
            >
              Load Tests
            </Button>
            <Button
              onClick={() => setActiveTab('results')}
              variant={activeTab === 'results' ? 'primary' : 'ghost'}
            >
              Results
            </Button>
          </Flex>
        </Header>

        <MainContent>
          {/* Endpoints Tab */}
          {activeTab === 'endpoints' && (
            <div>
              {isAddingEndpoint || editingEndpoint ? (
                <EndpointForm
                  endpoint={editingEndpoint || undefined}
                  onSave={handleSaveEndpoint}
                  onCancel={() => {
                    setIsAddingEndpoint(false);
                    setEditingEndpoint(null);
                  }}
                />
              ) : (
                <>
                  <Flex justify="space-between" align="center" style={{ marginBottom: '20px' }}>
                    <h2>API Endpoints</h2>
                    <Button onClick={() => setIsAddingEndpoint(true)}>
                      Add Endpoint
                    </Button>
                  </Flex>

                  {endpoints.length === 0 ? (
                    <GlassContainer>
                      <p>No endpoints added yet. Add your first endpoint to get started.</p>
                    </GlassContainer>
                  ) : (
                    <Grid columns={2} gap="l">
                      {endpoints.map(endpoint => (
                        <GlassCard key={endpoint.id}>
                          <h3>{endpoint.name}</h3>
                          <Flex gap="s" style={{ marginBottom: '10px' }}>
                            <Badge variant={
                              endpoint.method === 'GET' ? 'info' :
                                endpoint.method === 'POST' ? 'success' :
                                  endpoint.method === 'PUT' ? 'warning' :
                                    endpoint.method === 'DELETE' ? 'error' : 'default'
                            }>
                              {endpoint.method}
                            </Badge>
                            <div style={{ wordBreak: 'break-all' }}>{endpoint.url}</div>
                          </Flex>

                          <div style={{ marginTop: 'auto' }}>
                            <Separator />
                            <Flex justify="flex-end" gap="m">
                              <Button
                                variant="ghost"
                                size="small"
                                onClick={() => {
                                  setEditingEndpoint(endpoint);
                                  setIsAddingEndpoint(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="small"
                                onClick={() => handleDeleteEndpoint(endpoint.id)}
                              >
                                Delete
                              </Button>
                            </Flex>
                          </div>
                        </GlassCard>
                      ))}
                    </Grid>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tests Tab */}
          {activeTab === 'tests' && (
            <div>
              {isAddingTest || editingTest ? (
                <LoadTestForm
                  test={editingTest || undefined}
                  endpoints={endpoints}
                  onSave={handleSaveTest}
                  onCancel={() => {
                    setIsAddingTest(false);
                    setEditingTest(null);
                  }}
                />
              ) : (
                <>
                  <Flex justify="space-between" align="center" style={{ marginBottom: '20px' }}>
                    <h2>Load Tests</h2>
                    <Button
                      onClick={() => setIsAddingTest(true)}
                      disabled={endpoints.length === 0}
                    >
                      Create Test
                    </Button>
                  </Flex>

                  {endpoints.length === 0 ? (
                    <GlassContainer>
                      <p>You need to create endpoints before you can create tests.</p>
                    </GlassContainer>
                  ) : tests.length === 0 ? (
                    <GlassContainer>
                      <p>No load tests created yet. Create your first test configuration to get started.</p>
                    </GlassContainer>
                  ) : (
                    <Grid columns={2} gap="l">
                      {tests.map(test => (
                        <GlassCard key={test.id}>
                          <h3>{test.name}</h3>
                          <div style={{ marginBottom: '10px' }}>
                            <div>Duration: {test.config.duration} seconds</div>
                            <div>
                              Rate: {test.config.arrivalRate}
                              {test.config.rampTo ? ` → ${test.config.rampTo}` : ''} req/s
                            </div>
                            <div>Endpoints: {test.endpoints.length}</div>
                          </div>

                          <div style={{ marginTop: 'auto' }}>
                            <Separator />
                            <Flex justify="flex-end" gap="m">
                              <Button
                                variant="ghost"
                                size="small"
                                onClick={() => {
                                  setEditingTest(test);
                                  setIsAddingTest(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="small"
                                onClick={() => handleDeleteTest(test.id)}
                              >
                                Delete
                              </Button>
                              <Button
                                variant="primary"
                                size="small"
                                onClick={() => handleRunTest(test)}
                                disabled={isRunningTest}
                              >
                                Run Test
                              </Button>
                            </Flex>
                          </div>
                        </GlassCard>
                      ))}
                    </Grid>
                  )}
                </>
              )}
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div>
              <h2>Test Results</h2>

              {isRunningTest && (
                <>
                  <GlassContainer>
                    <Flex justify="space-between" align="center">
                      <h3>Running Test...</h3>
                      <Button
                        variant="danger"
                        onClick={handleCancelTest}
                      >
                        Cancel Test
                      </Button>
                    </Flex>
                    <Console>{testOutput}</Console>
                  </GlassContainer>

                  {/* Mostrar el progreso en tiempo real */}
                  {selectedResult && (
                    <div style={{ marginTop: '20px' }}>
                      <TestProgress result={selectedResult} />
                    </div>
                  )}
                </>
              )}

              {selectedResult && !isRunningTest && (
                <TestResults
                  result={selectedResult}
                  onBack={() => setSelectedResult(null)}
                />
              )}

              {results.length === 0 && !isRunningTest ? (
                <GlassContainer>
                  <p>No test results yet. Run a load test to see results here.</p>
                </GlassContainer>
              ) : !selectedResult && !isRunningTest ? (
                <GlassContainer>
                  <h3>Previous Test Results</h3>
                  <Grid columns={2} gap="m">
                    {results.map(result => (
                      <GlassCard key={result.id}>
                        <h4>
                          {tests.find(t => t.id === result.testId)?.name || 'Unknown Test'}
                        </h4>
                        <div>{new Date(result.timestamp).toLocaleString()}</div>
                        <div>
                          Requests: {result.summary.requestsCompleted}
                          {result.summary.requestsTimedOut > 0
                            ? ` (${result.summary.requestsTimedOut} timeouts)`
                            : ''}
                        </div>
                        <Button
                          style={{ marginTop: '10px' }}
                          onClick={() => setSelectedResult(result)}
                        >
                          View Details
                        </Button>
                      </GlassCard>
                    ))}
                  </Grid>
                </GlassContainer>
              ) : null}
            </div>
          )}
        </MainContent>
      </PageContainer>
    </ThemeProvider>
  );
};

export default App;
