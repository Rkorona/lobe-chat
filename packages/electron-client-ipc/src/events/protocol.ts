/**
 * 协议安装相关的 Broadcast 事件（主进程 -> 渲染进程）
 */
export interface ProtocolBroadcastEvents {
  /**
   * 协议安装请求事件
   * 当用户通过 lobehub:// 协议打开应用时触发
   */
  requestProtocolInstall: (data: { url: string }) => void;
}

/**
 * 协议处理相关的 Dispatch 事件（渲染进程 -> 主进程）
 */
export interface ProtocolDispatchEvents {
  /**
   * 通知主进程协议URL已被处理
   */
  protocolUrlHandled: (data: { error?: string; success: boolean; url: string }) => Promise<void>;
}
