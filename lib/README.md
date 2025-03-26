# SmartPin API Service

This directory contains the API service layer for the SmartPin application. It provides a consistent interface for interacting with the backend API, whether using the mock implementation or the real API.

## Structure

- `index.ts` - Main entry point that exports all API functions
- `config.ts` - Configuration for the API service
- `types.ts` - TypeScript interfaces for API data
- `mock-data.ts` - Helper functions for managing mock data
- `auth-api.ts` - Mock implementation of authentication endpoints
- `users-api.ts` - Mock implementation of user endpoints
- `devices-api.ts` - Mock implementation of device endpoints
- `datapoints-api.ts` - Mock implementation of datapoint endpoints
- `real-api-client.ts` - Real API client implementation

## Usage

Import the API functions from the main entry point:

```typescript
import { login, createUser, getDevices } from '@/lib/api';

