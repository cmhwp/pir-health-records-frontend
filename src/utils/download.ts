import request from './request';

/**
 * 下载导出的数据
 * @param filename 文件名
 * @returns 完整的下载URL
 */
export const downloadExportedData = (filename: string): string => {
  return `${request.defaults.baseURL}/admin/export/download/${filename}`;
};

/**
 * 创建下载链接并触发下载
 * @param url 文件URL
 * @param filename 可选的文件名
 */
export const triggerDownload = (url: string, filename?: string): void => {
  const a = document.createElement('a');
  a.href = url;
  if (filename) {
    a.download = filename;
  }
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * 从Blob创建下载链接
 * @param blob 数据Blob
 * @param filename 文件名
 */
export const downloadFromBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}; 