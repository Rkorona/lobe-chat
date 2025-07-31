import { describe, expect, it } from 'vitest';

import { McpSchema } from '../../types/protocol';
import { generateRFCProtocolUrl, parseProtocolUrl } from '../protocol';

describe('Protocol', () => {
  describe('generateRFCProtocolUrl', () => {
    it('should generate valid RFC protocol URL for stdio type', () => {
      const schema: McpSchema = {
        identifier: 'edgeone-mcp',
        name: 'EdgeOne MCP',
        author: 'Higress Team',
        description: 'EdgeOne API integration for LobeChat',
        version: '1.0.0',
        homepage: 'https://github.com/higress/edgeone-mcp',
        config: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@higress/edgeone-mcp'],
          env: { NODE_ENV: 'production' },
        },
      };

      const url = generateRFCProtocolUrl({
        id: 'edgeone-mcp',
        schema,
        marketId: 'higress',
        metaParams: {
          author: 'Higress Team',
          category: 'api-integration',
        },
      });

      expect(url).toMatch(/^lobehub:\/\/plugin\/install\?/);
      expect(url).toContain('type=mcp');
      expect(url).toContain('id=edgeone-mcp');
      expect(url).toContain('marketId=higress');
      expect(url).toContain('meta_author=Higress+Team'); // URLSearchParams encodes space as +
      expect(url).toContain('meta_category=api-integration');
      
      // Verify schema is URL encoded
      const urlObj = new URL(url);
      const schemaParam = urlObj.searchParams.get('schema');
      expect(schemaParam).toBeTruthy();
      // URLSearchParams.get() 自动解码，所以这里得到的是解码后的JSON
      expect(schemaParam).toContain('"'); // 解码后的引号
    });

    it('should generate valid RFC protocol URL for http type', () => {
      const schema: McpSchema = {
        identifier: 'awesome-api',
        name: 'Awesome API',
        author: 'Smithery',
        description: 'Awesome API integration',
        version: '2.0.0',
        config: {
          type: 'http',
          url: 'https://api.smithery.ai/v1/mcp',
          headers: {
            'Authorization': 'Bearer token123',
            'X-Custom-Header': 'value',
          },
        },
      };

      const url = generateRFCProtocolUrl({
        id: 'awesome-api',
        schema,
        marketId: 'smithery',
      });

      expect(url).toMatch(/^lobehub:\/\/plugin\/install\?/);
      expect(url).toContain('type=mcp');
      expect(url).toContain('id=awesome-api');
      expect(url).toContain('marketId=smithery');
    });

    it('should throw error if schema identifier does not match id', () => {
      const schema: McpSchema = {
        identifier: 'wrong-id',
        name: 'Test',
        author: 'Test',
        description: 'Test',
        version: '1.0.0',
        config: { type: 'stdio', command: 'test' },
      };

      expect(() => 
        generateRFCProtocolUrl({ id: 'different-id', schema })
      ).toThrowError('Schema identifier must match the id parameter');
    });
  });

  describe('parseProtocolUrl', () => {
    it('should parse RFC protocol URL correctly', () => {
      const schema: McpSchema = {
        identifier: 'test-mcp',
        name: 'Test MCP',
        author: 'Test Author',
        description: 'Test Description',
        version: '1.0.0',
        config: {
          type: 'stdio',
          command: 'test',
          args: ['arg1', 'arg2'],
        },
      };

      const url = generateRFCProtocolUrl({
        id: 'test-mcp',
        schema,
        marketId: 'lobehub',
        metaParams: { category: 'test' },
      });

      const parsed = parseProtocolUrl(url);
      
      expect(parsed).toBeTruthy();
      expect(parsed?.type).toBe('mcp');
      expect(parsed?.action).toBe('install');
      expect(parsed?.schema).toEqual(schema);
      expect(parsed?.marketId).toBe('lobehub');
      expect(parsed?.metaParams).toEqual({ meta_category: 'test' });
    });

    it('should return null for invalid protocol', () => {
      const result = parseProtocolUrl('http://example.com');
      expect(result).toBeNull();
    });

    it('should return null for invalid path', () => {
      const result = parseProtocolUrl('lobehub://wrong/path');
      expect(result).toBeNull();
    });

    it('should return null for missing required params', () => {
      const result = parseProtocolUrl('lobehub://plugin/install?type=mcp');
      expect(result).toBeNull();
    });

    it('should return null for invalid schema', () => {
      const result = parseProtocolUrl('lobehub://plugin/install?type=mcp&id=test&schema=invalid');
      expect(result).toBeNull();
    });

    it('should validate schema structure', () => {
      const invalidSchema = {
        identifier: 'test',
        // Missing required fields
      };
      
      const schemaJson = JSON.stringify(invalidSchema);
      const searchParams = new URLSearchParams();
      searchParams.set('type', 'mcp');
      searchParams.set('id', 'test');
      searchParams.set('schema', schemaJson);
      
      const url = `lobehub://plugin/install?${searchParams.toString()}`;
      const result = parseProtocolUrl(url);
      expect(result).toBeNull();
    });

    it('should handle http config validation', () => {
      const schema: McpSchema = {
        identifier: 'http-test',
        name: 'HTTP Test',
        author: 'Test',
        description: 'Test',
        version: '1.0.0',
        config: {
          type: 'http',
          url: 'not-a-valid-url', // Invalid URL
        },
      };

      const schemaJson = JSON.stringify(schema);
      const searchParams = new URLSearchParams();
      searchParams.set('type', 'mcp');
      searchParams.set('id', 'http-test');
      searchParams.set('schema', schemaJson);
      
      const url = `lobehub://plugin/install?${searchParams.toString()}`;
      const result = parseProtocolUrl(url);
      expect(result).toBeNull();
    });
  });

  describe('URL encoding/decoding', () => {
    it('should handle special characters correctly', () => {
      const schema: McpSchema = {
        identifier: 'special-chars',
        name: '特殊字符 ñ 🚀',
        author: 'Test <test@example.com>',
        description: 'Description with "quotes" and \'apostrophes\'',
        version: '1.0.0',
        config: {
          type: 'stdio',
          command: 'cmd',
          args: ['arg with spaces', 'arg/with/slashes'],
        },
      };

      const url = generateRFCProtocolUrl({ id: 'special-chars', schema });
      const parsed = parseProtocolUrl(url);

      expect(parsed?.schema).toEqual(schema);
    });
  });
}); 