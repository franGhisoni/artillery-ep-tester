import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Flex,
  FormGroup,
  Label,
  Input,
  TextArea,
  Select,
  Button,
  GlassContainer,
  HelperText,
} from '../styles/StyledComponents';
import { Endpoint } from '../types';

interface EndpointFormProps {
  endpoint?: Endpoint;
  onSave: (endpoint: Endpoint) => void;
  onCancel: () => void;
}

const EndpointForm: React.FC<EndpointFormProps> = ({ endpoint, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Endpoint>(
    endpoint || {
      id: uuidv4(),
      name: '',
      url: '',
      method: 'GET',
      headers: {},
      body: '',
      auth: {
        type: 'None',
      },
    }
  );

  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>(
    Object.entries(endpoint?.headers || {}).map(([key, value]) => ({ key, value }))
  );

  const updateFormData = (key: keyof Endpoint, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateAuth = (key: keyof Endpoint['auth'], value: any) => {
    setFormData((prev) => ({
      ...prev,
      auth: { ...prev.auth, [key]: value },
    }));
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const updatedHeaders = [...customHeaders];
    updatedHeaders[index][field] = value;
    setCustomHeaders(updatedHeaders);

    // Update the headers object in formData
    const headersObject = updatedHeaders.reduce((acc, { key, value }) => {
      if (key.trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    updateFormData('headers', headersObject);
  };

  const addHeader = () => {
    setCustomHeaders((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    const updatedHeaders = customHeaders.filter((_, i) => i !== index);
    setCustomHeaders(updatedHeaders);

    // Update the headers object in formData
    const headersObject = updatedHeaders.reduce((acc, { key, value }) => {
      if (key.trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    updateFormData('headers', headersObject);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <GlassContainer $fullWidth>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Endpoint Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="Enter a descriptive name"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            value={formData.url}
            onChange={(e) => updateFormData('url', e.target.value)}
            placeholder="https://api.example.com/path"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="method">Method</Label>
          <Select
            id="method"
            value={formData.method}
            onChange={(e) => updateFormData('method', e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Headers</Label>
          {customHeaders.map((header, index) => (
            <Flex key={index} gap="s" align="center" style={{ marginBottom: '8px' }}>
              <Input
                placeholder="Header name"
                value={header.key}
                onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
              />
              <Input
                placeholder="Header value"
                value={header.value}
                onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => removeHeader(index)}
              >
                Remove
              </Button>
            </Flex>
          ))}
          <Button type="button" variant="secondary" size="small" onClick={addHeader}>
            Add Header
          </Button>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="auth-type">Authentication</Label>
          <Select
            id="auth-type"
            value={formData.auth.type}
            onChange={(e) => updateAuth('type', e.target.value)}
          >
            <option value="None">None</option>
            <option value="Bearer">Bearer Token</option>
            <option value="Basic">Basic Auth</option>
            <option value="API Key">API Key</option>
          </Select>
        </FormGroup>

        {formData.auth.type === 'Bearer' && (
          <FormGroup>
            <Label htmlFor="token">Bearer Token</Label>
            <Input
              id="token"
              value={formData.auth.token || ''}
              onChange={(e) => updateAuth('token', e.target.value)}
              placeholder="Enter token"
            />
          </FormGroup>
        )}

        {formData.auth.type === 'Basic' && (
          <>
            <FormGroup>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.auth.username || ''}
                onChange={(e) => updateAuth('username', e.target.value)}
                placeholder="Username"
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.auth.password || ''}
                onChange={(e) => updateAuth('password', e.target.value)}
                placeholder="Password"
              />
            </FormGroup>
          </>
        )}

        {formData.auth.type === 'API Key' && (
          <>
            <FormGroup>
              <Label htmlFor="key">Key Name</Label>
              <Input
                id="key"
                value={formData.auth.key || ''}
                onChange={(e) => updateAuth('key', e.target.value)}
                placeholder="API key name (e.g., 'X-API-Key')"
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="value">Key Value</Label>
              <Input
                id="value"
                value={formData.auth.value || ''}
                onChange={(e) => updateAuth('value', e.target.value)}
                placeholder="API key value"
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="in">Location</Label>
              <Select
                id="in"
                value={formData.auth.in || 'header'}
                onChange={(e) => updateAuth('in', e.target.value)}
              >
                <option value="header">Header</option>
                <option value="query">Query Parameter</option>
              </Select>
            </FormGroup>
          </>
        )}

        {(formData.method === 'POST' || formData.method === 'PUT' || formData.method === 'PATCH') && (
          <FormGroup>
            <Label htmlFor="body">Request Body (JSON)</Label>
            <TextArea
              id="body"
              value={formData.body}
              onChange={(e) => updateFormData('body', e.target.value)}
              placeholder='{
  "key": "value"
}'
            />
            <HelperText>Enter JSON body for the request</HelperText>
          </FormGroup>
        )}

        <Flex justify="flex-end" gap="m">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Endpoint
          </Button>
        </Flex>
      </form>
    </GlassContainer>
  );
};

export default EndpointForm; 