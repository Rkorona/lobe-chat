import { name } from '@/../../package.json';
import { McpInstallProtocolParams, ProtocolSource, ProtocolUrlParsed } from '@/types/protocol';

/**
 * Get protocol scheme based on app version
 * 根据应用版本获取协议 scheme
 */
export const getProtocolScheme = (): string => {
  const channel = process.env.UPDATE_CHANNEL;
  const isNightly = channel === 'nightly';
  const isBeta = name.includes('beta');

  if (isNightly) return 'lobehub-nightly';
  if (isBeta) return 'lobehub-beta';
  return 'lobehub';
};

/**
 * Get version info including channel and protocol scheme
 * 获取版本信息，包括频道和协议 scheme
 */
export const getVersionInfo = () => {
  const channel = process.env.UPDATE_CHANNEL;
  const isNightly = channel === 'nightly';
  const isBeta = name.includes('beta');

  let appChannel: 'nightly' | 'beta' | 'stable';
  let protocolScheme: string;

  if (isNightly) {
    appChannel = 'nightly';
    protocolScheme = 'lobehub-nightly';
  } else if (isBeta) {
    appChannel = 'beta';
    protocolScheme = 'lobehub-beta';
  } else {
    appChannel = 'stable';
    protocolScheme = 'lobehub';
  }

  return {
    channel: appChannel,
    protocolScheme,
  };
};

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
