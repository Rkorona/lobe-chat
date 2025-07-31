import { createLogger } from '@/utils/logger';
import { parseProtocolUrl } from '@/utils/protocol';

import { ControllerModule, protocolHandler } from '.';

const logger = createLogger('controllers:McpInstallCtr');

/**
 * MCP 插件安装控制器
 * 负责处理协议URL解析和插件安装流程
 */
export default class McpInstallController extends ControllerModule {
  /**
   * 处理 MCP 插件安装请求
   * @param url 协议URL
   * @returns 是否处理成功
   */
  @protocolHandler('plugin', 'install')
  public async handleInstallRequest(url: string): Promise<boolean> {
    try {
      logger.debug(`🔧 [McpInstall] Processing install request: ${url}`);

      // 解析协议URL
      const parsed = parseProtocolUrl(url);

      if (!parsed) {
        logger.warn(`🔧 [McpInstall] Failed to parse protocol URL: ${url}`);
        return false;
      }

              logger.debug(`🔧 [McpInstall] URL parsed successfully:`, {
          action: parsed.action,
          pluginId: parsed.params.id,
          pluginName: parsed.schema?.name || 'Unknown',
          urlType: parsed.urlType,
        });

        // 验证是否为MCP安装请求
        if (
          parsed.urlType !== 'plugin' ||
          parsed.action !== 'install' ||
          parsed.type !== 'mcp'
        ) {
          logger.warn(`🔧 [McpInstall] Invalid request type:`, {
            action: parsed.action,
            type: parsed.type,
            urlType: parsed.urlType,
          });
          return false;
        }

        // 广播安装请求到前端（发送结构化数据而不是原始URL）
        const installRequest = {
          data: {
            marketId: parsed.params.marketId,
            metaParams: parsed.params.metaParams,
            pluginId: parsed.params.id,
            schema: parsed.schema,
            source: parsed.source,
            sourceUrl: url, // 保留原始URL用于调试
          },
          type: 'mcp-install' as const,
        };

        logger.debug(`🔧 [McpInstall] Broadcasting install request:`, {
          marketId: installRequest.data.marketId,
          pluginId: installRequest.data.pluginId,
          pluginName: installRequest.data.schema.name,
        });

      // 通过应用实例广播到前端
      if (this.app?.browserManager) {
        this.app.browserManager.broadcastToWindow('chat', 'mcpInstallRequest', installRequest);
        logger.debug(`🔧 [McpInstall] Install request broadcasted successfully`);
        return true;
      } else {
        logger.error(`🔧 [McpInstall] App or browserManager not available`);
        return false;
      }
    } catch (error) {
      logger.error(`🔧 [McpInstall] Error processing install request:`, error);
      return false;
    }
  }
}
