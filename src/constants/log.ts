/**
 * 系统日志类型枚举常量
 * 用于标识不同类型的系统日志，便于分类和过滤
 */
export const LOG_TYPES = {
  SYSTEM: 'system',    // 系统级别日志（启动、关闭、配置变更等）
  SECURITY: 'security', // 安全相关日志（登录、登出、密码修改等）
  USER: 'user',        // 用户操作日志（注册、个人资料更新等）
  RECORD: 'record',    // 健康记录操作日志（创建、修改、删除记录等）
  ADMIN: 'admin',      // 管理员操作日志（用户管理、系统设置等）
  ERROR: 'error',      // 错误日志（系统错误、异常情况等）
  PIR: 'pir',          // PIR相关日志（隐私信息检索操作）
  ACCESS: 'access',    // 访问控制日志（查看记录、文件下载等）
  EXPORT: 'export',    // 数据导出日志（导出、下载等）
  IMPORT: 'import',    // 数据导入日志（导入、上传等）
  AUDIT: 'audit',       // 审计日志（敏感操作、合规检查等）
  RESEARCH: 'research' // 研究员操作日志（查看记录、文件下载等）
} as const;

/**
 * 日志类型展示文本映射
 * 用于在界面上展示友好的日志类型名称
 */
export const LOG_TYPE_TEXTS: Record<string, string> = {
  [LOG_TYPES.SYSTEM]: '系统',
  [LOG_TYPES.SECURITY]: '安全',
  [LOG_TYPES.USER]: '用户',
  [LOG_TYPES.RECORD]: '记录',
  [LOG_TYPES.ADMIN]: '管理员',
  [LOG_TYPES.ERROR]: '错误',
  [LOG_TYPES.PIR]: 'PIR',
  [LOG_TYPES.ACCESS]: '访问',
  [LOG_TYPES.EXPORT]: '导出',
  [LOG_TYPES.IMPORT]: '导入',
  [LOG_TYPES.AUDIT]: '审计',
  [LOG_TYPES.RESEARCH]: '研究员'
};

/**
 * 日志类型颜色映射
 * 用于在界面上以不同颜色展示不同类型的日志
 */
export const LOG_TYPE_COLORS: Record<string, string> = {
  [LOG_TYPES.SYSTEM]: 'green',
  [LOG_TYPES.SECURITY]: 'magenta',
  [LOG_TYPES.USER]: 'purple',
  [LOG_TYPES.RECORD]: 'cyan',
  [LOG_TYPES.ADMIN]: 'gold',
  [LOG_TYPES.ERROR]: 'red',
  [LOG_TYPES.PIR]: 'blue',
  [LOG_TYPES.ACCESS]: 'geekblue',
  [LOG_TYPES.EXPORT]: 'orange',
  [LOG_TYPES.IMPORT]: 'lime',
  [LOG_TYPES.AUDIT]: 'volcano',
  [LOG_TYPES.RESEARCH]: 'purple'
};

/**
 * 所有日志类型的选项数组
 * 用于下拉选择框等UI组件
 */
export const LOG_TYPE_OPTIONS = Object.entries(LOG_TYPES).map(([key, value]) => ({
  value,
  label: LOG_TYPE_TEXTS[value]
}));

/**
 * 日志级别枚举常量
 * 用于标识日志的严重程度
 */
export const LOG_LEVELS = {
  INFO: 'info',       // 普通信息
  WARNING: 'warning', // 警告信息
  ERROR: 'error'      // 错误信息
} as const;

/**
 * 日志级别展示文本映射
 */
export const LOG_LEVEL_TEXTS: Record<string, string> = {
  [LOG_LEVELS.INFO]: '信息',
  [LOG_LEVELS.WARNING]: '警告',
  [LOG_LEVELS.ERROR]: '错误'
};

/**
 * 日志级别颜色映射
 */
export const LOG_LEVEL_COLORS: Record<string, string> = {
  [LOG_LEVELS.INFO]: 'blue',
  [LOG_LEVELS.WARNING]: 'orange',
  [LOG_LEVELS.ERROR]: 'red'
}; 