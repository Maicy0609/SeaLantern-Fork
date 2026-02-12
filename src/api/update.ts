import { fetch } from '@tauri-apps/plugin-http';
import { getVersion } from '@tauri-apps/api/app';

export interface UpdateInfo {
  has_update: boolean;
  latest_version: string;
  current_version: string;
  download_url?: string;
  release_notes?: string;
  published_at?: string;
}

/**
 * 检查更新（直接从 Gitee API 获取）
 */
export async function checkUpdate(): Promise<UpdateInfo | null> {
  try {
    const currentVersion = await getVersion();

    // 从 Gitee API 获取最新 Release
    const response = await fetch('https://gitee.com/api/v5/repos/fps_z/SeaLantern/releases/latest', {
      method: 'GET',
      headers: {
        'User-Agent': 'Sea-Lantern'
      }
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const release = await response.json() as any;

    // 解析版本号（去掉 v 前缀）
    const latestVersion = release.tag_name.replace(/^v/, '');

    // 比较版本号
    const hasUpdate = compareVersions(currentVersion, latestVersion);

    // 查找 Windows 安装包
    const asset = release.assets?.find((a: any) =>
      a.name.toLowerCase().endsWith('.exe') || a.name.toLowerCase().endsWith('.msi')
    );

    // 构建 Release 页面链接
    const releaseUrl = `https://gitee.com/fps_z/SeaLantern/releases/tag/${release.tag_name}`;

    return {
      has_update: hasUpdate,
      latest_version: latestVersion,
      current_version: currentVersion,
      download_url: releaseUrl,
      release_notes: release.body || '',
      published_at: release.created_at
    };
  } catch (error) {
    console.error('检查更新失败:', error);
    throw error;
  }
}

/**
 * 比较版本号
 */
function compareVersions(current: string, latest: string): boolean {
  const parseVersion = (v: string) => {
    return v.split('.').map(n => parseInt(n) || 0);
  };

  const currentParts = parseVersion(current);
  const latestParts = parseVersion(latest);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] || 0;
    const l = latestParts[i] || 0;

    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}
