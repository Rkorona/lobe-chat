'use client';

import { useWatchBroadcast } from '@lobechat/electron-client-ipc';
import { App, Modal } from 'antd';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAgentStore } from '@/store/agent';
import { useToolStore } from '@/store/tool';
import { ProtocolUrlParsed } from '@/types/plugins/protocol';
import { LobeToolCustomPlugin } from '@/types/tool/plugin';
import { parseProtocolUrl } from '@/utils/protocol';

interface PluginInstallConfirmModalProps {
  data: ProtocolUrlParsed | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}

const PluginInstallConfirmModal = ({
  open,
  data,
  onConfirm,
  onCancel,
  loading,
}: PluginInstallConfirmModalProps) => {
  const { t } = useTranslation('plugin');

  if (!data) return null;

  const { schema, marketId } = data;

  return (
    <Modal
      cancelText="取消"
      confirmLoading={loading}
      okText="安装"
      onCancel={onCancel}
      onOk={onConfirm}
      open={open}
      title="安装插件"
      width={520}
    >
      <div style={{ marginBottom: 16 }}>
        <h4>{schema.name}</h4>
        <p style={{ color: '#666', marginBottom: 8 }}>作者: {schema.author}</p>
        <p style={{ color: '#666', marginBottom: 8 }}>版本: {schema.version}</p>
        {marketId && <p style={{ color: '#666', marginBottom: 8 }}>来源: {marketId}</p>}
        <p style={{ marginBottom: 16 }}>{schema.description}</p>

        <div
          style={{
            background: '#f5f5f5',
            borderRadius: 6,
            marginBottom: 16,
            padding: 12,
          }}
        >
          <strong>配置信息:</strong>
          <div style={{ color: '#666', fontSize: '12px', marginTop: 8 }}>
            {schema.config.type === 'stdio' ? (
              <div>
                <div>类型: stdio</div>
                <div>命令: {schema.config.command}</div>
                {schema.config.args && <div>参数: {schema.config.args.join(' ')}</div>}
              </div>
            ) : (
              <div>
                <div>类型: http</div>
                <div>URL: {schema.config.url}</div>
              </div>
            )}
          </div>
        </div>

        <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
          ⚠️ 请确认您信任此插件的来源，恶意插件可能会危害您的系统安全。
        </p>
      </div>
    </Modal>
  );
};

const ProtocolUrlHandler = () => {
  const { message } = App.useApp();
  const [modalData, setModalData] = useState<{
    data: ProtocolUrlParsed | null;
    loading: boolean;
    open: boolean;
  }>({
    data: null,
    loading: false,
    open: false,
  });

  const [installCustomPlugin] = useToolStore((s) => [s.installCustomPlugin]);
  const togglePlugin = useAgentStore((s) => s.togglePlugin);

  const handleProtocolInstall = useCallback(
    async ({ url }: { url: string }) => {
      console.log('收到协议安装请求:', url);

      // 解析协议URL
      const parsed = parseProtocolUrl(url);
      if (!parsed) {
        message.error('无效的协议URL');
        return;
      }

      console.log('解析的协议数据:', parsed);

      // 显示确认对话框
      setModalData({
        data: parsed,
        loading: false,
        open: true,
      });
    },
    [message],
  );

  const handleConfirm = useCallback(async () => {
    if (!modalData.data) return;

    setModalData((prev) => ({ ...prev, loading: true }));

    try {
      const { schema } = modalData.data;

      // 构建自定义插件数据
      const customPlugin: LobeToolCustomPlugin = {
        customParams: {
          avatar: '',
          description: schema.description,
          mcp: {
            ...schema.config,
            auth: undefined, // 根据需要设置认证信息
            headers: schema.config.type === 'http' ? schema.config.headers : undefined,
          },
          title: schema.name, // 可以从 metaParams 中获取
        },
        identifier: schema.identifier,
        manifest: {
          api: [],
          identifier: schema.identifier,
          meta: {
            author: schema.author,
            description: schema.description,
            homepage: schema.homepage,
            tags: [],
            title: schema.name,
          },
          type: 'default',
          version: schema.version,
        },
        type: 'customPlugin',
      };

      console.log('准备安装插件:', customPlugin);

      // 安装插件
      await installCustomPlugin(customPlugin);

      // 启用插件
      await togglePlugin(schema.identifier);

      message.success(`插件 "${schema.name}" 安装成功！`);

      // 关闭对话框
      setModalData({
        data: null,
        loading: false,
        open: false,
      });
    } catch (error) {
      console.error('插件安装失败:', error);
      message.error('插件安装失败，请重试');
      setModalData((prev) => ({ ...prev, loading: false }));
    }
  }, [modalData.data, installCustomPlugin, togglePlugin, message]);

  const handleCancel = useCallback(() => {
    setModalData({
      data: null,
      loading: false,
      open: false,
    });
  }, []);

  // 只在桌面端监听协议安装请求

  useWatchBroadcast('requestProtocolInstall', handleProtocolInstall);

  return (
    <PluginInstallConfirmModal
      data={modalData.data}
      loading={modalData.loading}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      open={modalData.open}
    />
  );
};

export default ProtocolUrlHandler;
