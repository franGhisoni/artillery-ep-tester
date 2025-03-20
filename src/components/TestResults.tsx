import React, { useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  GlassContainer,
  Flex,
  Badge,
  Heading,
  Subheading,
  Console,
  Grid,
  Button,
  GlassCard,
} from '../styles/StyledComponents';
import { TestResult } from '../types';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TestResultsProps {
  result: TestResult;
  onBack?: () => void;
}

const TestResults: React.FC<TestResultsProps> = ({ result, onBack }) => {
  useEffect(() => {
    // Debug log the result data to see what we're working with
    console.log('TestResults component received data:', {
      id: result.id,
      status: result.status,
      progress: result.progress,
      summary: {
        requestsCompleted: result.summary?.requestsCompleted,
        scenarios: result.summary?.scenarios,
        codes: result.summary?.codes,
        latency: result.summary?.latency,
        rps: result.summary?.rps
      }
    });
  }, [result]);

  // Format timestamp to readable date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Format a number with commas
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  // Handle status code display
  const getStatusCodeItems = () => {
    if (!result.summary.codes || Object.keys(result.summary.codes).length === 0) {
      return <p>No status codes reported</p>;
    }

    // Filtrar y corregir códigos de estado HTTP
    const filteredCodes: {[key: string]: number} = {};
    
    // Códigos HTTP estándar que queremos preservar
    const stdCodes = ['100', '101', '102', '103', 
                      '200', '201', '202', '203', '204', '205', '206', '207', '208', '226',
                      '300', '301', '302', '303', '304', '305', '306', '307', '308',
                      '400', '401', '402', '403', '404', '405', '406', '407', '408', '409', '410', 
                      '411', '412', '413', '414', '415', '416', '417', '418', '421', '422', 
                      '423', '424', '425', '426', '428', '429', '431', '451',
                      '500', '501', '502', '503', '504', '505', '506', '507', '508', '510', '511'];

    // Agrupar por categoría para los códigos no estándar
    const groupedCounts = {
      '2xx': 0, // Éxito
      '3xx': 0, // Redirección
      '4xx': 0, // Error del cliente
      '5xx': 0  // Error del servidor
    };

    Object.entries(result.summary.codes).forEach(([code, count]) => {
      // Limpiar el código
      const cleanCode = code.replace(/[^0-9]/g, '');
      let codeNum = parseInt(cleanCode, 10);
      let normalizedCode = '';
      
      // Normalizar códigos de 2 dígitos
      if (codeNum >= 10 && codeNum < 100) {
        if (codeNum >= 10 && codeNum < 20) normalizedCode = '418'; // 4xx - Error del cliente
        else if (codeNum >= 20 && codeNum < 30) normalizedCode = '200'; // 2xx - Éxito
        else if (codeNum >= 30 && codeNum < 40) normalizedCode = '304'; // 3xx - Redirección
        else if (codeNum >= 40 && codeNum < 50) normalizedCode = '404'; // 4xx - Error del cliente
        else if (codeNum >= 50 && codeNum < 60) normalizedCode = '500'; // 5xx - Error del servidor
      } else if (codeNum >= 100 && codeNum < 600) {
        normalizedCode = codeNum.toString();
      }
      
      // Si es un código estándar, lo mostramos directamente
      if (stdCodes.includes(normalizedCode)) {
        filteredCodes[normalizedCode] = (filteredCodes[normalizedCode] || 0) + (count as number);
      } else {
        // Si no es un código estándar, lo agrupamos por categoría
        if (normalizedCode.startsWith('2')) {
          groupedCounts['2xx'] += (count as number);
        } else if (normalizedCode.startsWith('3')) {
          groupedCounts['3xx'] += (count as number);
        } else if (normalizedCode.startsWith('4')) {
          groupedCounts['4xx'] += (count as number);
        } else if (normalizedCode.startsWith('5')) {
          groupedCounts['5xx'] += (count as number);
        }
      }
    });
    
    // Agregar los contadores agrupados si hay algo que mostrar
    Object.entries(groupedCounts).forEach(([category, count]) => {
      if (count > 0) {
        filteredCodes[category] = count;
      }
    });

    // Si después de filtrar no quedó ningún código válido
    if (Object.keys(filteredCodes).length === 0) {
      return <p>No se encontraron códigos HTTP válidos</p>;
    }

    return (
      <Flex wrap gap="s">
        {Object.entries(filteredCodes).map(([code, count]) => (
          <Badge 
            key={code} 
            variant={
              code.startsWith('2') ? 'success' : 
              code.startsWith('4') ? 'warning' : 
              code.startsWith('5') ? 'error' : 'info'
            }
          >
            {code}: {count}
          </Badge>
        ))}
      </Flex>
    );
  };

  // Handle errors display
  const getErrorItems = () => {
    if (!result.summary.errors || Object.keys(result.summary.errors).length === 0) {
      return <p>No errors reported</p>;
    }

    return (
      <Flex direction="column" gap="s">
        {Object.entries(result.summary.errors).map(([error, count]) => (
          <Flex key={error} justify="space-between">
            <span>{error}:</span>
            <Badge variant="error">{count}</Badge>
          </Flex>
        ))}
      </Flex>
    );
  };

  // Prepare data for latency chart
  const latencyChartData = {
    labels: ['Min', 'Median', 'P95', 'P99', 'Max'],
    datasets: [
      {
        label: 'Latency (ms)',
        data: [
          result.summary?.latency?.min || 0,
          result.summary?.latency?.median || 0,
          result.summary?.latency?.p95 || 0,
          result.summary?.latency?.p99 || 0,
          result.summary?.latency?.max || 0,
        ],
        backgroundColor: 'rgba(77, 254, 83, 0.2)',
        borderColor: '#4dfe53',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#f5f5f5',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#f5f5f5',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#f5f5f5',
        },
      },
    },
  };

  // Custom styles
  const styles = {
    // Add the stats-grid CSS
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '15px',
      marginTop: '15px',
    },
    // Additional custom styles can be added here
  };

  return (
    <GlassContainer $fullWidth>
      <Flex justify="space-between" align="center" style={{ marginBottom: '20px' }}>
        <div>
          <Heading>Test Results</Heading>
          <Subheading>Run at {formatDate(result.timestamp)}</Subheading>
        </div>
        <Button 
          variant="secondary" 
          size="medium" 
          onClick={onBack}
          style={{ minWidth: '120px' }}
        >
          ← Volver
        </Button>
      </Flex>

      {/* Add debug info */}
      <Flex direction="column" gap="s" style={{ marginBottom: '20px' }}>
        <Badge variant={result.status === 'completed' ? 'success' : result.status === 'running' ? 'info' : 'error'}>
          Status: {result.status}
        </Badge>
        {result.progress !== undefined && (
          <Badge variant="info">Progress: {result.progress}%</Badge>
        )}
        <Badge variant="info">Result ID: {result.id}</Badge>
      </Flex>

      <Grid columns={2} gap="l">
        <div>
          <h3>Statistics</h3>
          <div style={styles.statsGrid}>
            <GlassCard>
              <h3>Duration:</h3>
              <p>{formatNumber(result.summary?.duration)}s</p>
            </GlassCard>
            <GlassCard>
              <h3>Virtual Users:</h3>
              <p>{formatNumber(result.summary?.scenarios?.created)}</p>
            </GlassCard>
            <GlassCard>
              <h3>Completed Scenarios:</h3>
              <p>{formatNumber(result.summary?.scenarios?.completed)}</p>
            </GlassCard>
            <GlassCard>
              <h3>Failed Scenarios:</h3>
              <p>{formatNumber(result.summary?.scenarios?.failed)}</p>
            </GlassCard>
            <GlassCard>
              <h3>Requests Completed:</h3>
              <p>{formatNumber(result.summary?.requestsCompleted)}</p>
            </GlassCard>
            <GlassCard>
              <h3>Requests/sec:</h3>
              <p>{(result.summary?.rps?.mean || 0).toFixed(2)}</p>
            </GlassCard>
          </div>
        </div>

        <div>
          <h3>Latency</h3>
          <Line data={latencyChartData} options={chartOptions} />
        </div>
      </Grid>

      <Grid columns={2} gap="l" style={{ marginTop: '20px' }}>
        <div>
          <h3>Status Codes</h3>
          {getStatusCodeItems()}
        </div>
        <div>
          <h3>Errors</h3>
          {getErrorItems()}
        </div>
      </Grid>

      <div style={{ marginTop: '20px' }}>
        <h3>Raw Output</h3>
        <Console>{result.rawOutput}</Console>
      </div>
    </GlassContainer>
  );
};

export default TestResults; 