import {
  type McpInstallProtocolParams,
  ProtocolSource,
  type ProtocolUrlParsed,
} from '@/types/plugins/protocol';

/**
 * 根据应用版本获取协议 scheme
 */
export function getProtocolScheme(): string {
  // 在桌面端环境中，可以通过环境变量或其他方式判断版本
  if (typeof process !== 'undefined' && process.env) {
    const packageName = process.env.npm_package_name;
    if (packageName?.includes('nightly')) return 'lobehub-nightly';
    if (packageName?.includes('beta')) return 'lobehub-beta';
  }

  return 'lobehub';
}

/**
 * 解析 lobehub:// 协议URL (支持多版本协议)
 *
 * 支持的URL格式：
 * - lobehub://mcp/install?identifier=figma&source=official
 * - lobehub-nightly://mcp/install?identifier=figma&source=official
 * - lobehub-beta://mcp/install?identifier=figma&source=official
 *
 * @param url 协议URL
 * @returns 解析结果
 */
export function parseProtocolUrl(url: string): ProtocolUrlParsed | null {
  try {
    const parsedUrl = new URL(url);

    // 支持多种协议 scheme
    const validProtocols = ['lobehub:', 'lobehub-nightly:', 'lobehub-beta:'];
    if (!validProtocols.includes(parsedUrl.protocol)) {
      return null;
    }

    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return null;
    }

    const [type, action] = pathParts;

    if (type !== 'mcp' || action !== 'install') {
      return null;
    }

    // 解析参数 - 支持JSON和query string两种格式
    let params: McpInstallProtocolParams;

    const search = parsedUrl.search.slice(1); // 去掉 ?

    if (search.startsWith('{')) {
      // JSON格式
      try {
        params = JSON.parse(decodeURIComponent(search));
      } catch {
        return null;
      }
    } else {
      // Query string格式
      const searchParams = new URLSearchParams(search);
      params = {
        autoConfig: searchParams.get('autoConfig') === 'true',
        identifier: searchParams.get('identifier') || '',
        manifestUrl: searchParams.get('manifestUrl') || undefined,
        presetConfig: searchParams.get('presetConfig')
          ? JSON.parse(decodeURIComponent(searchParams.get('presetConfig')!))
          : undefined,
        source: (searchParams.get('source') as ProtocolSource) || ProtocolSource.OFFICIAL,
        version: searchParams.get('version') || undefined,
      };
    }

    // 验证必需参数
    if (!params.identifier || !params.source) {
      return null;
    }

    // 验证source是否为有效值
    if (!Object.values(ProtocolSource).includes(params.source)) {
      return null;
    }

    return {
      action: 'install',
      params,
      type: 'mcp',
    };
  } catch (error) {
    console.error('Failed to parse protocol URL:', error);
    return null;
  }
}

/**
 * 生成协议URL (使用当前应用的协议 scheme)
 *
 * @param params MCP安装参数
 * @param format URL格式 ('json' | 'query')
 * @returns 生成的协议URL
 */
export function generateProtocolUrl(
  params: McpInstallProtocolParams,
  format: 'json' | 'query' = 'json',
): string {
  const protocolScheme = getProtocolScheme();
  const baseUrl = `${protocolScheme}://mcp/install`;

  if (format === 'json') {
    const encoded = encodeURIComponent(JSON.stringify(params));
    return `${baseUrl}?${encoded}`;
  } else {
    const searchParams = new URLSearchParams();
    searchParams.set('identifier', params.identifier);
    searchParams.set('source', params.source);

    if (params.manifestUrl) searchParams.set('manifestUrl', params.manifestUrl);
    if (params.version) searchParams.set('version', params.version);
    if (params.autoConfig) searchParams.set('autoConfig', 'true');
    if (params.presetConfig) {
      searchParams.set('presetConfig', encodeURIComponent(JSON.stringify(params.presetConfig)));
    }

    return `${baseUrl}?${searchParams.toString()}`;
  }
}

/**
 * 验证协议来源是否可信
 *
 * @param source 协议来源
 * @returns 是否可信
 */
export function isProtocolSourceTrusted(source: ProtocolSource): boolean {
  switch (source) {
    case ProtocolSource.OFFICIAL:
    case ProtocolSource.GITHUB_OFFICIAL: {
      return true;
    }

    case ProtocolSource.COMMUNITY: {
      // 可以在这里添加白名单验证
      return true;
    }

    case ProtocolSource.THIRD_PARTY:
    case ProtocolSource.DEVELOPER: {
      // 第三方来源需要用户确认
      return false;
    }

    default: {
      return false;
    }
  }
}
