/**
 * 协议来源类型
 */
export enum ProtocolSource {
  /** 社区贡献 */
  COMMUNITY = 'community',
  /** 官方LobeHub市场 */
  OFFICIAL = 'official',
  /** 第三方市场 */
  THIRD_PARTY = 'third_party',
}

/**
 * MCP安装协议参数
 */
export interface McpInstallProtocolParams {
  /** 安装后是否自动配置（可选，默认false） */
  autoConfig?: boolean;
  /** MCP插件标识符 */
  identifier: string;
  /** 插件清单URL（可选，用于验证和获取详细信息） */
  manifestUrl?: string;
  /** 预设配置参数（可选） */
  presetConfig?: Record<string, unknown>;
  /** 安装来源 */
  source: ProtocolSource;
  /** 来源平台信息（用于统计和验证） */
  sourcePlatform?: {
    name: string;
    url?: string;
    version?: string;
  };
  /** 版本号（可选，默认为latest） */
  version?: string;
}

/**
 * 协议URL解析结果
 */
export interface ProtocolUrlParsed {
  action: 'install' | 'configure' | 'update';
  params: McpInstallProtocolParams;
  type: 'mcp' | 'plugin';
}

/**
 * 安装确认弹窗信息
 */
export interface InstallConfirmationInfo {
  dependencies?: string[];
  permissions?: {
    filesystem?: boolean;
    network?: boolean;
    system?: boolean;
  };
  pluginInfo: {
    author?: string;
    description: string;
    homepage?: string;
    icon?: string;
    identifier: string;
    name: string;
    version: string;
  };
  source: {
    platform?: {
      name: string;
      url?: string;
    };
    type: ProtocolSource;
    verified: boolean; // 是否为验证来源
  };
}

/**
 * 协议处理器接口
 */
export interface ProtocolHandler {
  /**
   * 处理协议URL
   */
  handle(
    parsed: ProtocolUrlParsed,
  ): Promise<{ error?: string; success: boolean; targetWindow?: string }>;

  /**
   * 支持的操作
   */
  readonly supportedActions: string[];

  /**
   * 协议类型
   */
  readonly type: string;
}

/**
 * 协议路由配置
 */
export interface ProtocolRouteConfig {
  /** 操作类型 */
  action: string;
  /** 目标路径（相对于窗口base路径） */
  targetPath?: string;
  /** 目标窗口 */
  targetWindow: 'chat' | 'settings';
  /** 协议类型 */
  type: string;
}
