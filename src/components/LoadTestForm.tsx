import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Flex,
  FormGroup,
  Label,
  Input,
  Button,
  GlassContainer,
  HelperText,
} from '../styles/StyledComponents';
import { LoadTest, Endpoint } from '../types';

interface LoadTestFormProps {
  test?: LoadTest;
  endpoints: Endpoint[];
  onSave: (test: LoadTest) => void;
  onCancel: () => void;
}

const LoadTestForm: React.FC<LoadTestFormProps> = ({ 
  test, 
  endpoints, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<LoadTest>(
    test || {
      id: uuidv4(),
      name: '',
      endpoints: [],
      config: {
        duration: 60,
        arrivalRate: 1,
        rampTo: 5,
        maxVusers: 50,
        maxLatency: 5000,
      },
    }
  );

  const updateFormData = (key: keyof LoadTest, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateConfig = (key: keyof LoadTest['config'], value: number) => {
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
  };

  const handleEndpointChange = (endpointId: string) => {
    const isSelected = formData.endpoints.includes(endpointId);
    
    if (isSelected) {
      // Remove endpoint from selection
      const updatedEndpoints = formData.endpoints.filter(id => id !== endpointId);
      updateFormData('endpoints', updatedEndpoints);
    } else {
      // Add endpoint to selection
      const updatedEndpoints = [...formData.endpoints, endpointId];
      updateFormData('endpoints', updatedEndpoints);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <GlassContainer $fullWidth>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Test Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="Enter a descriptive name for this test"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Select Endpoints to Test</Label>
          {endpoints.length === 0 ? (
            <HelperText>No endpoints available. Create endpoints first.</HelperText>
          ) : (
            endpoints.map((endpoint) => (
              <div key={endpoint.id} style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={formData.endpoints.includes(endpoint.id)}
                    onChange={() => handleEndpointChange(endpoint.id)}
                    style={{ marginRight: '8px' }}
                  />
                  {endpoint.name} - {endpoint.method} {endpoint.url}
                </label>
              </div>
            ))
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="duration">Duration (seconds)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={formData.config.duration}
            onChange={(e) => updateConfig('duration', Number(e.target.value))}
            required
          />
          <HelperText>How long the test should run</HelperText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="arrivalRate">Initial Rate (requests per second)</Label>
          <Input
            id="arrivalRate"
            type="number"
            min="1"
            value={formData.config.arrivalRate}
            onChange={(e) => updateConfig('arrivalRate', Number(e.target.value))}
            required
          />
          <HelperText>Number of virtual users created per second at the start</HelperText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="rampTo">Ramp To (requests per second)</Label>
          <Input
            id="rampTo"
            type="number"
            min={formData.config.arrivalRate}
            value={formData.config.rampTo ?? ''}
            onChange={(e) => updateConfig('rampTo', Number(e.target.value))}
          />
          <HelperText>
            Final rate of virtual users created per second (for ramping up load)
          </HelperText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="maxVusers">Max Virtual Users</Label>
          <Input
            id="maxVusers"
            type="number"
            min="1"
            value={formData.config.maxVusers ?? ''}
            onChange={(e) => updateConfig('maxVusers', Number(e.target.value))}
          />
          <HelperText>Maximum number of concurrent virtual users</HelperText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="maxLatency">Max Acceptable Latency (ms)</Label>
          <Input
            id="maxLatency"
            type="number"
            min="100"
            value={formData.config.maxLatency ?? ''}
            onChange={(e) => updateConfig('maxLatency', Number(e.target.value))}
          />
          <HelperText>Maximum acceptable response time in milliseconds (e.g., 5000 for 5 seconds)</HelperText>
        </FormGroup>

        <Flex justify="flex-end" gap="m">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={formData.endpoints.length === 0}
          >
            Save Test Configuration
          </Button>
        </Flex>
      </form>
    </GlassContainer>
  );
};

export default LoadTestForm; 