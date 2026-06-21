import { API_VERSION } from './constants.js';

export function buildOpenApiSpec({ baseUrl = 'http://localhost:8787' } = {}) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Hiro Gradients API',
      version: API_VERSION,
      description: 'Generate, validate, render, and export parametric Hiro gradient backgrounds.',
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          responses: {
            200: {
              description: 'API is healthy',
            },
          },
        },
      },
      '/api/meta': {
        get: {
          summary: 'List API capabilities, defaults, limits, ratios, blend modes, and shader presets',
          responses: {
            200: {
              description: 'Capability metadata',
            },
          },
        },
      },
      '/api/gradients': {
        post: {
          summary: 'Normalize and create a gradient config',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GradientConfigInput' },
              },
            },
          },
          responses: {
            200: { description: 'Normalized gradient config' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/gradients/random': {
        post: {
          summary: 'Create a random, optionally seeded gradient config',
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RandomGradientInput' },
              },
            },
          },
          responses: {
            200: { description: 'Generated gradient config' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/gradients/validate': {
        post: {
          summary: 'Validate a gradient config without throwing',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GradientConfigInput' },
              },
            },
          },
          responses: {
            200: { description: 'Validation result' },
          },
        },
      },
      '/api/gradients/render': {
        post: {
          summary: 'Render a gradient as SVG',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GradientConfigInput' },
              },
            },
          },
          responses: {
            200: {
              description: 'SVG image',
              content: { 'image/svg+xml': {} },
            },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/gradients/html': {
        post: {
          summary: 'Create standalone replication HTML for a gradient',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GradientConfigInput' },
              },
            },
          },
          responses: {
            200: {
              description: 'Standalone HTML',
              content: { 'text/html': {} },
            },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/gradients/react': {
        post: {
          summary: 'Create a React shader snippet for shader-backed gradients',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GradientConfigInput' },
              },
            },
          },
          responses: {
            200: { description: 'React component code' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/openapi.json': {
        get: {
          summary: 'OpenAPI 3.1 contract',
          responses: {
            200: { description: 'OpenAPI JSON document' },
          },
        },
      },
    },
    components: {
      schemas: {
        GradientConfigInput: {
          type: 'object',
          properties: {
            colors: {
              type: 'array',
              minItems: 2,
              maxItems: 6,
              items: { type: 'string', pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' },
            },
            width: { type: 'integer', minimum: 1, maximum: 8192 },
            height: { type: 'integer', minimum: 1, maximum: 8192 },
            ratio: { type: 'string', examples: ['16:9', '1:1', '9:16', 'Web'] },
            ratioLabel: { type: 'string' },
            seed: { type: 'number' },
            isBlurred: { type: 'boolean' },
            blurStrength: { type: 'number', minimum: 0, maximum: 100 },
            blendMode: {
              type: 'string',
              enum: ['source-over', 'dynamic', 'screen', 'overlay', 'color-dodge', 'exclusion', 'multiply', 'soft-light'],
            },
            showRing: { type: 'boolean' },
            activeShader: {
              type: 'string',
              enum: ['none', 'paper-texture', 'fluted-glass', 'water', 'image-dithering', 'halftone-dots', 'halftone-cmyk'],
            },
            activePreset: { type: 'string' },
            presetParams: { type: 'object', additionalProperties: true },
          },
        },
        RandomGradientInput: {
          type: 'object',
          properties: {
            seed: { oneOf: [{ type: 'string' }, { type: 'number' }] },
            count: { type: 'integer', minimum: 2, maximum: 6 },
            vibrancy: { type: 'string', enum: ['subtle', 'normal', 'vibrant'] },
            ratio: { type: 'string' },
            previousColors: {
              type: 'array',
              items: { type: 'string' },
            },
            includeShader: { type: 'boolean' },
            includeNone: { type: 'boolean' },
          },
        },
      },
    },
  };
}
