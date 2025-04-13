<template>
  <div class="system-logs-container">
    <a-page-header
      title="系统日志"
      subtitle="浏览和分析系统日志记录"
    />
    
    <!-- 搜索和筛选区域 -->
    <a-card title="日志查询" class="filter-card">
      <a-form layout="vertical" :model="filterForm">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="日志级别">
              <a-select
                v-model:value="filterForm.level"
                mode="multiple"
                placeholder="选择日志级别"
                style="width: 100%"
                allowClear
              >
                <a-select-option value="info">信息</a-select-option>
                <a-select-option value="warning">警告</a-select-option>
                <a-select-option value="error">错误</a-select-option>
                <a-select-option value="debug">调试</a-select-option>
                <a-select-option value="critical">严重</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          
          <a-col :span="8">
            <a-form-item label="模块">
              <a-select
                v-model:value="filterForm.module"
                mode="multiple"
                placeholder="选择系统模块"
                style="width: 100%"
                allowClear
              >
                <a-select-option value="auth">认证模块</a-select-option>
                <a-select-option value="database">数据库模块</a-select-option>
                <a-select-option value="pir">PIR模块</a-select-option>
                <a-select-option value="api">API模块</a-select-option>
                <a-select-option value="user">用户模块</a-select-option>
                <a-select-option value="records">记录模块</a-select-option>
                <a-select-option value="system">系统模块</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          
          <a-col :span="8">
            <a-form-item label="时间范围">
              <a-range-picker 
                v-model:value="filterForm.timeRange" 
                style="width: 100%"
                showTime
                format="YYYY-MM-DD HH:mm:ss"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="16">
            <a-form-item label="关键词搜索">
              <a-input
                v-model:value="filterForm.keyword"
                placeholder="搜索日志内容"
                allow-clear
                @pressEnter="handleSearch"
              >
                <template #prefix>
                  <search-outlined />
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          
          <a-col :span="8">
            <a-form-item label="用户ID">
              <a-input
                v-model:value="filterForm.userId"
                placeholder="输入用户ID筛选"
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row>
          <a-col :span="24" style="text-align: right">
            <a-space>
              <a-button @click="resetFilters">
                重置
              </a-button>
              <a-button type="primary" @click="handleSearch" :loading="loading">
                <search-outlined /> 搜索
              </a-button>
              <a-button @click="handleExport" :disabled="logs.length === 0">
                <download-outlined /> 导出日志
              </a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-form>
    </a-card>
    
    <!-- 日志列表区域 -->
    <a-card title="日志列表" class="logs-card" :loading="loading">
      <template #extra>
        <a-radio-group v-model:value="viewMode" button-style="solid" size="small">
          <a-radio-button value="table">表格视图</a-radio-button>
          <a-radio-button value="text">文本视图</a-radio-button>
        </a-radio-group>
      </template>
      
      <!-- 表格视图 -->
      <template v-if="viewMode === 'table'">
        <a-table
          :columns="logColumns"
          :data-source="logs"
          :pagination="{ 
            pageSize: 15, 
            showSizeChanger: true, 
            pageSizeOptions: ['15', '30', '50', '100'],
            showTotal: (total: number) => `共 ${total} 条日志`
          }"
          :row-key="(record: LogRecord) => record.id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'level'">
              <a-tag :color="getLevelColor(record.level)">
                {{ getLevelText(record.level) }}
              </a-tag>
            </template>
            
            <template v-if="column.key === 'message'">
              <div class="log-message">
                <a-tooltip :title="record.message" placement="topLeft">
                  <div>{{ record.message }}</div>
                </a-tooltip>
              </div>
            </template>
            
            <template v-if="column.key === 'actions'">
              <a-button type="link" size="small" @click="showLogDetail(record)">
                详情
              </a-button>
            </template>
          </template>
        </a-table>
      </template>
      
      <!-- 文本视图 -->
      <template v-else>
        <div class="log-text-view">
          <a-input-search
            v-model:value="textSearchKeyword"
            placeholder="文本内搜索"
            style="margin-bottom: 16px"
            @search="highlightTextSearch"
          />
          
          <pre class="log-text-content" ref="logTextContent">
            <div 
              v-for="(log, index) in logs" 
              :key="log.id"
              :class="{ 
                'log-line': true,
                'info-line': log.level === 'info',
                'warning-line': log.level === 'warning',
                'error-line': log.level === 'error',
                'debug-line': log.level === 'debug',
                'critical-line': log.level === 'critical'
              }"
            >
              [{{ formatDate(log.timestamp) }}] [{{ log.level.toUpperCase() }}] [{{ log.module }}] {{ log.message }}
              {{ log.details ? '\n  ' + log.details : '' }}
            </div>
          </pre>
        </div>
      </template>
      
      <template v-if="logs.length === 0 && !loading">
        <a-empty description="没有匹配的日志记录" />
      </template>
    </a-card>
    
    <!-- 日志详情模态框 -->
    <a-modal
      v-model:visible="detailModalVisible"
      title="日志详情"
      width="800px"
      :footer="null"
    >
      <template v-if="selectedLog">
        <a-descriptions bordered :column="1">
          <a-descriptions-item label="日志ID">{{ selectedLog.id }}</a-descriptions-item>
          <a-descriptions-item label="时间">{{ formatDate(selectedLog.timestamp) }}</a-descriptions-item>
          <a-descriptions-item label="级别">
            <a-tag :color="getLevelColor(selectedLog.level)">
              {{ getLevelText(selectedLog.level) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="模块">{{ selectedLog.module }}</a-descriptions-item>
          <a-descriptions-item label="用户ID" v-if="selectedLog.userId">{{ selectedLog.userId }}</a-descriptions-item>
          <a-descriptions-item label="IP地址" v-if="selectedLog.ip">{{ selectedLog.ip }}</a-descriptions-item>
          <a-descriptions-item label="消息">{{ selectedLog.message }}</a-descriptions-item>
          <a-descriptions-item label="详细信息" v-if="selectedLog.details">
            <pre class="log-details">{{ selectedLog.details }}</pre>
          </a-descriptions-item>
          <a-descriptions-item label="相关数据" v-if="selectedLog.data">
            <pre class="log-data">{{ formatJson(selectedLog.data) }}</pre>
          </a-descriptions-item>
          <a-descriptions-item label="堆栈跟踪" v-if="selectedLog.stackTrace">
            <pre class="log-stack">{{ selectedLog.stackTrace }}</pre>
          </a-descriptions-item>
        </a-descriptions>
        
        <div style="margin-top: 16px; text-align: right">
          <a-space>
            <a-button @click="copyLogDetails">
              <copy-outlined /> 复制详情
            </a-button>
            <a-button type="primary" @click="detailModalVisible = false">
              关闭
            </a-button>
          </a-space>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  SearchOutlined, 
  DownloadOutlined,
  CopyOutlined 
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';

interface LogRecord {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug' | 'critical';
  module: string;
  message: string;
  userId?: string;
  ip?: string;
  details?: string;
  data?: Record<string, any>;
  stackTrace?: string;
}

interface FilterFormState {
  level: string[];
  module: string[];
  timeRange: any[];
  keyword: string;
  userId: string;
}

// 状态变量
const loading = ref<boolean>(false);
const logs = ref<LogRecord[]>([]);
const viewMode = ref<'table' | 'text'>('table');
const detailModalVisible = ref<boolean>(false);
const selectedLog = ref<LogRecord | null>(null);
const textSearchKeyword = ref<string>('');
const logTextContent = ref<HTMLElement | null>(null);

// 筛选表单
const filterForm = reactive<FilterFormState>({
  level: [],
  module: [],
  timeRange: [],
  keyword: '',
  userId: ''
});

// 日志表格列定义
const logColumns = [
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 180,
    sorter: (a: LogRecord, b: LogRecord) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    render: (text: string) => formatDate(text)
  },
  {
    title: '级别',
    dataIndex: 'level',
    key: 'level',
    width: 100,
    filters: [
      { text: '信息', value: 'info' },
      { text: '警告', value: 'warning' },
      { text: '错误', value: 'error' },
      { text: '调试', value: 'debug' },
      { text: '严重', value: 'critical' }
    ],
    onFilter: (value: string, record: LogRecord) => record.level === value
  },
  {
    title: '模块',
    dataIndex: 'module',
    key: 'module',
    width: 150
  },
  {
    title: '消息',
    dataIndex: 'message',
    key: 'message',
    ellipsis: true
  },
  {
    title: '用户ID',
    dataIndex: 'userId',
    key: 'userId',
    width: 120
  },
  {
    title: '操作',
    key: 'actions',
    width: 80
  }
];

// 加载日志数据
const loadLogs = async () => {
  loading.value = true;
  logs.value = [];
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟数据
    const mockLogs: LogRecord[] = [
      {
        id: 'log-001',
        timestamp: dayjs().subtract(1, 'hour').toISOString(),
        level: 'info',
        module: 'auth',
        message: '用户登录成功',
        userId: 'user-001',
        ip: '192.168.1.1',
        details: '用户通过密码验证成功登录系统',
        data: { username: 'admin', loginTime: new Date().toISOString() }
      },
      {
        id: 'log-002',
        timestamp: dayjs().subtract(2, 'hour').toISOString(),
        level: 'warning',
        module: 'auth',
        message: '用户多次尝试登录失败',
        userId: 'user-002',
        ip: '192.168.1.2',
        details: '用户连续3次登录失败，账户已临时锁定15分钟',
        data: { username: 'user1', attempts: 3, lockTime: 15 }
      },
      {
        id: 'log-003',
        timestamp: dayjs().subtract(3, 'hour').toISOString(),
        level: 'error',
        module: 'database',
        message: '数据库连接失败',
        details: '无法连接到主数据库，已切换到备用数据库',
        data: { host: 'db-main', error: 'Connection refused' },
        stackTrace: 'Error: Connection refused\n  at Database.connect (/app/src/db/connector.js:45)\n  at Server.start (/app/src/server.js:28)'
      },
      {
        id: 'log-004',
        timestamp: dayjs().subtract(5, 'hour').toISOString(),
        level: 'info',
        module: 'pir',
        message: 'PIR查询执行成功',
        userId: 'user-003',
        details: '隐私信息检索查询已完成，处理了1250条记录',
        data: { queryId: 'pir-query-001', recordsProcessed: 1250, duration: '2.5s' }
      },
      {
        id: 'log-005',
        timestamp: dayjs().subtract(1, 'day').toISOString(),
        level: 'critical',
        module: 'system',
        message: '系统磁盘空间不足',
        details: '系统磁盘空间低于10%警戒线，建议立即清理',
        data: { disk: '/', totalSpace: '500GB', freeSpace: '45GB', usedPercent: 91 }
      },
      {
        id: 'log-006',
        timestamp: dayjs().subtract(1, 'day').subtract(2, 'hour').toISOString(),
        level: 'debug',
        module: 'api',
        message: 'API调用延迟异常',
        details: '外部API调用响应时间超过阈值',
        data: { endpoint: '/api/v1/external/data', responseTime: '5.2s', threshold: '3s' }
      },
      {
        id: 'log-007',
        timestamp: dayjs().subtract(2, 'day').toISOString(),
        level: 'error',
        module: 'records',
        message: '记录保存失败',
        userId: 'user-005',
        details: '用户提交的健康记录保存失败，数据验证错误',
        data: { recordId: 'rec-1234', validationErrors: ['体温数值超出正常范围', '心率字段缺失'] },
        stackTrace: 'ValidationError: 体温数值超出正常范围\n  at RecordValidator.validate (/app/src/validators/health.js:78)\n  at RecordService.saveRecord (/app/src/services/record.js:125)'
      }
    ];
    
    // 应用筛选条件
    logs.value = mockLogs.filter(log => {
      // 级别筛选
      if (filterForm.level.length > 0 && !filterForm.level.includes(log.level)) {
        return false;
      }
      
      // 模块筛选
      if (filterForm.module.length > 0 && !filterForm.module.includes(log.module)) {
        return false;
      }
      
      // 关键词筛选
      if (filterForm.keyword && !(
        log.message.toLowerCase().includes(filterForm.keyword.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(filterForm.keyword.toLowerCase()))
      )) {
        return false;
      }
      
      // 用户ID筛选
      if (filterForm.userId && log.userId !== filterForm.userId) {
        return false;
      }
      
      // 时间范围筛选
      if (filterForm.timeRange && filterForm.timeRange.length === 2) {
        const logTime = dayjs(log.timestamp);
        const startTime = filterForm.timeRange[0];
        const endTime = filterForm.timeRange[1];
        
        if (logTime.isBefore(startTime) || logTime.isAfter(endTime)) {
          return false;
        }
      }
      
      return true;
    });
    
  } catch (error) {
    console.error('加载日志数据失败:', error);
    message.error('加载日志数据失败');
  } finally {
    loading.value = false;
  }
};

// 搜索日志
const handleSearch = () => {
  loadLogs();
};

// 重置筛选条件
const resetFilters = () => {
  filterForm.level = [];
  filterForm.module = [];
  filterForm.timeRange = [];
  filterForm.keyword = '';
  filterForm.userId = '';
  loadLogs();
};

// 导出日志
const handleExport = () => {
  message.success('日志导出功能已触发，文件将开始下载');
  // 这里可以实现实际的日志导出逻辑
};

// 显示日志详情
const showLogDetail = (log: LogRecord) => {
  selectedLog.value = log;
  detailModalVisible.value = true;
};

// 复制日志详情
const copyLogDetails = () => {
  if (!selectedLog.value) return;
  
  const logText = `
日志ID: ${selectedLog.value.id}
时间: ${formatDate(selectedLog.value.timestamp)}
级别: ${getLevelText(selectedLog.value.level)}
模块: ${selectedLog.value.module}
${selectedLog.value.userId ? '用户ID: ' + selectedLog.value.userId + '\n' : ''}
${selectedLog.value.ip ? 'IP地址: ' + selectedLog.value.ip + '\n' : ''}
消息: ${selectedLog.value.message}
${selectedLog.value.details ? '详细信息: ' + selectedLog.value.details + '\n' : ''}
${selectedLog.value.data ? '相关数据: ' + formatJson(selectedLog.value.data) + '\n' : ''}
${selectedLog.value.stackTrace ? '堆栈跟踪: ' + selectedLog.value.stackTrace : ''}
  `.trim();
  
  // 复制到剪贴板
  navigator.clipboard.writeText(logText)
    .then(() => {
      message.success('日志详情已复制到剪贴板');
    })
    .catch(err => {
      console.error('复制失败:', err);
      message.error('复制失败');
    });
};

// 高亮文本搜索
const highlightTextSearch = () => {
  if (!textSearchKeyword.value || !logTextContent.value) return;
  
  // 移除现有高亮
  const highlightedElements = logTextContent.value.querySelectorAll('.highlight');
  highlightedElements.forEach(el => {
    el.classList.remove('highlight');
  });
  
  // 添加新高亮
  if (textSearchKeyword.value.trim()) {
    const logLines = logTextContent.value.querySelectorAll('.log-line');
    let matchCount = 0;
    
    logLines.forEach(line => {
      const text = line.textContent || '';
      if (text.toLowerCase().includes(textSearchKeyword.value.toLowerCase())) {
        line.classList.add('highlight');
        matchCount++;
      }
    });
    
    if (matchCount > 0) {
      message.info(`找到 ${matchCount} 条匹配记录`);
      // 滚动到第一个匹配项
      const firstMatch = logTextContent.value.querySelector('.highlight');
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      message.warning('没有找到匹配记录');
    }
  }
};

// 获取日志级别颜色
const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    'info': 'blue',
    'warning': 'orange',
    'error': 'red',
    'debug': 'cyan',
    'critical': 'magenta'
  };
  return colors[level] || 'default';
};

// 获取日志级别文本
const getLevelText = (level: string) => {
  const texts: Record<string, string> = {
    'info': '信息',
    'warning': '警告',
    'error': '错误',
    'debug': '调试',
    'critical': '严重'
  };
  return texts[level] || level;
};

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 格式化JSON
const formatJson = (data: any) => {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(data);
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.system-logs-container {
  padding: 0 24px 24px;
}

.filter-card {
  margin-bottom: 16px;
}

.logs-card {
  margin-bottom: 16px;
}

.log-message {
  max-width: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-text-view {
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
}

.log-text-content {
  max-height: 600px;
  overflow-y: auto;
  font-family: monospace;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px;
  margin: 0;
}

.log-line {
  padding: 2px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-line {
  color: #1890ff;
}

.warning-line {
  color: #fa8c16;
}

.error-line {
  color: #f5222d;
}

.debug-line {
  color: #13c2c2;
}

.critical-line {
  color: #eb2f96;
  font-weight: bold;
}

.highlight {
  background-color: #ffff00;
  color: #000000;
}

.log-details, .log-data, .log-stack {
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
}

:deep(.ant-descriptions-row > th, .ant-descriptions-row > td) {
  padding: 12px 16px;
}
</style> 