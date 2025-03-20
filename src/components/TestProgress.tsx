import React, { useState, useEffect } from 'react';
import { TestResult } from '../types';
import { GlassContainer, Flex, Badge, LinearProgress, Grid } from '../styles/StyledComponents';

interface TestProgressProps {
  result: TestResult;
}

const TestProgress: React.FC<TestProgressProps> = ({ result }) => {
  // Estado para mostrar animación de actualización
  const [updateFlash, setUpdateFlash] = useState(false);
  // Estado para almacenar la versión anterior del resultado para comparar
  const [prevResult, setPrevResult] = useState<TestResult | null>(null);

  // Detectar cuando cambian los datos para mostrar una animación de actualización
  useEffect(() => {
    // Si es la primera carga o si cambiaron los datos importantes, mostrar un flash
    if (!prevResult || 
        prevResult.summary.requestsCompleted !== result.summary.requestsCompleted ||
        prevResult.progress !== result.progress ||
        JSON.stringify(prevResult.summary.codes) !== JSON.stringify(result.summary.codes)) {
      
      // Activar el efecto visual de actualización
      setUpdateFlash(true);
      
      // Después de un tiempo corto, desactivar el efecto
      const timer = setTimeout(() => setUpdateFlash(false), 300);
      
      // Almacenar el resultado actual para la próxima comparación
      setPrevResult(result);
      
      return () => clearTimeout(timer);
    }
  }, [result, prevResult]);

  // Determinar el estado actual
  const getStatusBadge = () => {
    switch (result.status) {
      case 'running':
        return <Badge variant="info">Running</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge variant="warning">Unknown</Badge>;
    }
  };

  // Calcular el progreso (valor predeterminado al 0 o usar el progreso real si está disponible)
  const progress = result.progress || 0;

  // Asegurar que tenemos valores válidos para mostrar
  const requestsCompleted = result.summary?.requestsCompleted || 0;
  const requestsPerSecond = (result.summary?.rps?.mean || 0).toFixed(2);
  
  const usersCreated = result.summary?.scenarios?.created || 0;
  const usersCompleted = result.summary?.scenarios?.completed || 0;
  
  const latencyMin = result.summary?.latency?.min || 0;
  const latencyMedian = result.summary?.latency?.median || 0;
  const latencyMax = result.summary?.latency?.max || 0;
  
  const statusCodes = result.summary?.codes || {};

  return (
    <GlassContainer 
      $fullWidth
      style={{
        transition: 'all 0.3s ease-in-out',
        background: updateFlash 
          ? 'linear-gradient(155deg, rgba(50,70,100,0.3) 0%, rgba(60,100,120,0.4) 100%)' 
          : undefined
      }}
    >
      <Flex justify="space-between" align="center">
        <h3>Test Progress</h3>
        {getStatusBadge()}
      </Flex>
      
      <LinearProgress 
        value={progress} 
        max={100} 
        style={{ 
          marginTop: '15px',
          marginBottom: '10px',
          transition: 'all 0.3s ease'
        }} 
      />
      
      <Flex justify="space-between">
        <span>Started: {new Date(result.timestamp).toLocaleTimeString()}</span>
        <span>{progress}% Complete</span>
      </Flex>

      {/* Mostrar métricas en tiempo real */}
      <div style={{ 
        marginTop: '20px',
        transition: 'all 0.3s ease-in-out'
      }}>
        <h4>Real-time Metrics {updateFlash && <span style={{color: '#4dfe53'}}>⟳</span>}</h4>
        <Grid columns={2} gap="m">
          <div>
            <h5>Requests</h5>
            <Flex direction="column" gap="s">
              <Flex justify="space-between">
                <span>Completed:</span>
                <strong>{requestsCompleted}</strong>
              </Flex>
              <Flex justify="space-between">
                <span>Req/sec:</span>
                <strong>{requestsPerSecond}</strong>
              </Flex>
            </Flex>
          </div>
          
          <div>
            <h5>Users</h5>
            <Flex direction="column" gap="s">
              <Flex justify="space-between">
                <span>Created:</span>
                <strong>{usersCreated}</strong>
              </Flex>
              <Flex justify="space-between">
                <span>Completed:</span>
                <strong>{usersCompleted}</strong>
              </Flex>
            </Flex>
          </div>
          
          <div>
            <h5>Response Times</h5>
            <Flex direction="column" gap="s">
              <Flex justify="space-between">
                <span>Min:</span>
                <strong>{latencyMin} ms</strong>
              </Flex>
              <Flex justify="space-between">
                <span>Median:</span>
                <strong>{latencyMedian} ms</strong>
              </Flex>
              <Flex justify="space-between">
                <span>Max:</span>
                <strong>{latencyMax} ms</strong>
              </Flex>
            </Flex>
          </div>
          
          <div>
            <h5>Status Codes</h5>
            <Flex wrap gap="s">
              {Object.entries(statusCodes).length > 0 ? (
                Object.entries(statusCodes).map(([code, count]) => (
                  <Badge key={code} variant={
                    code.startsWith('2') ? 'success' : 
                    code.startsWith('3') ? 'info' :
                    code.startsWith('4') ? 'warning' : 'error'
                  }>
                    {code}: {count}
                  </Badge>
                ))
              ) : (
                <span>No status codes reported yet</span>
              )}
            </Flex>
          </div>
        </Grid>
      </div>

      {result.status === 'running' && (
        <p style={{ 
          marginTop: '15px', 
          fontSize: '14px',
          color: '#4dfe53',
          animation: 'pulse 2s infinite'
        }}>
          ⚡ Test is running. Results will update in real-time as they become available.
        </p>
      )}
      
      {result.status === 'failed' && (
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#ff615e' }}>
          ⚠️ Test failed. Please check the console output for more details.
        </p>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </GlassContainer>
  );
};

export default TestProgress; 