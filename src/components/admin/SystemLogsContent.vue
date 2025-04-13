<template>
  <div class="system-logs-container">
    <a-page-header
      title="系统日志"
      sub-title="查看和管理系统操作日志"
    />
    
    <!-- 筛选区域 -->
    <a-card class="filter-card">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="日志类型">
              <a-select
                v-model:value="filterForm.log_type"
                mode="multiple"
                placeholder="选择日志类型"
                style="width: 100%"
                :options="LOG_TYPE_OPTIONS"
                allow-clear
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="日期范围">
              <a-range-picker 
                v-model:value="filterForm.timeRange"
                style="width: 100%"
                :format="dateFormat" 
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="关键字搜索">
              <a-input 
                v-model:value="filterForm.keyword"
                placeholder="搜索日志内容" 
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="用户ID">
              <a-input 
                v-model:value="filterForm.userId"
                placeholder="输入用户ID" 
                allow-clear
              />
            </a-form-item>
          </a-col>
          <a-col :span="16" style="text-align: right">
            <a-space>
              <a-button @click="resetFilters">重置</a-button>
              <a-button type="primary" @click="handleSearch">搜索</a-button>
              <a-button type="primary" @click="handleExport">
                <template #icon><download-outlined /></template>
                导出日志
              </a-button>
              <a-button 
                type="default" 
                @click="viewMode = viewMode === 'table' ? 'text' : 'table'"
              >
                <template #icon>
                  <table-outlined v-if="viewMode === 'text'" />
                  <file-text-outlined v-else />
                </template>
                {{ viewMode === 'table' ? '文本视图' : '表格视图' }}
              </a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-form>
    </a-card>
    
    <!-- 日志表格 -->
    <a-card v-if="viewMode === 'table'" class="logs-card">
      <a-table
        :columns="logColumns"
        :data-source="logs"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: LogRecord) => record.id.toString()"
        @change="handleTableChange"
      >
        <!-- 日志类型列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'log_type'">
            <a-tag :color="getLevelColor(record.log_type)">
              {{ getLevelText(record.log_type) }}
            </a-tag>
          </template>
          
          <!-- 操作列 -->
          <template v-if="column.key === 'actions'">
            <a-button type="link" @click="showLogDetail(record)">详情</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <!-- 日志文本视图 -->
    <a-card v-else class="logs-card">
      <template #extra>
        <a-space>
          <a-input-search
            v-model:value="textSearchKeyword"
            placeholder="搜索内容"
            enter-button
            @search="highlightTextSearch"
            style="width: 200px"
          />
        </a-space>
      </template>
      <div class="log-text-view">
        <div class="log-text-content" ref="logTextContent">
          <div 
            v-for="(log, index) in logs" 
            :key="log.id"
            class="log-line"
            :class="log.log_type + '-line'"
          >
            [{{ formatDate(log.created_at) }}] [{{ getLevelText(log.log_type) }}] 
            {{ log.message }} {{ log.user_id ? '(用户: ' + log.user_id + ')' : '' }}
          </div>
          <div v-if="logs.length === 0 && !loading">无日志记录</div>
        </div>
      </div>
    </a-card>
    
    <!-- 日志详情弹窗 -->
    <a-modal
      v-model:visible="detailModalVisible"
      title="日志详情"
      width="700px"
      :footer="null"
    >
      <a-descriptions v-if="selectedLog" bordered>
        <a-descriptions-item label="日志ID" span="3">{{ selectedLog.id }}</a-descriptions-item>
        <a-descriptions-item label="时间" span="3">{{ formatDate(selectedLog.created_at) }}</a-descriptions-item>
        <a-descriptions-item label="类型" span="3">
          <a-tag :color="getLevelColor(selectedLog.log_type)">
            {{ getLevelText(selectedLog.log_type) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="用户ID" span="3">{{ selectedLog.user_id || '无' }}</a-descriptions-item>
        <a-descriptions-item label="消息" span="3">{{ selectedLog.message }}</a-descriptions-item>
        <a-descriptions-item label="详细信息" span="3">
          <div v-if="selectedLog.details" class="log-details">{{ selectedLog.details }}</div>
          <div v-else>无</div>
        </a-descriptions-item>
      </a-descriptions>
      <div style="margin-top: 16px; text-align: right">
        <a-button type="primary" @click="copyLogDetails">
          <template #icon><copy-outlined /></template>
          复制详情
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { 
  TableOutlined, 
  FileTextOutlined, 
  DownloadOutlined,
  CopyOutlined 
} from '@ant-design/icons-vue';
import { getSystemLogs, exportSystemData } from '@/api/admin';
import { downloadExportedData, triggerDownload } from '@/utils/download';
import { LOG_TYPES, LOG_TYPE_TEXTS, LOG_TYPE_COLORS, LOG_LEVELS, LOG_LEVEL_TEXTS, LOG_LEVEL_COLORS, LOG_TYPE_OPTIONS } from '@/constants/log';
import type { SystemLogResponse, ExportDataRequest } from '@/types/admin';
import type { ApiResponse } from '@/types/auth';

// 常量定义
const dateFormat = 'YYYY-MM-DD';

// 类型定义
interface LogRecord {
  id: number;
  created_at: string;
  log_type: string;
  user_id: number | string | null;
  message: string;
  details?: string;
}

interface FilterFormState {
  log_type: string[];
  timeRange: any[];
  keyword: string;
  userId: string;
}

// 状态
const loading = ref<boolean>(false);
const logs = ref<LogRecord[]>([]);
const selectedLog = ref<LogRecord | null>(null);
const detailModalVisible = ref<boolean>(false);
const viewMode = ref<'table' | 'text'>('table');
const logTextContent = ref<HTMLElement | null>(null);
const textSearchKeyword = ref<string>('');

// 分页设置
const pagination = reactive({
  current: 1,
  pageSize: 15,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['15', '30', '50', '100'],
  showTotal: (total: number) => `共 ${total} 条日志`
});

// 筛选表单
const filterForm = reactive<FilterFormState>({
  log_type: [],
  timeRange: [],
  keyword: '',
  userId: ''
});

// 日志表格列定义
const logColumns = [
  {
    title: '时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
    sorter: (a: LogRecord, b: LogRecord) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    render: (text: string) => formatDate(text)
  },
  {
    title: '类型',
    dataIndex: 'log_type',
    key: 'log_type',
    width: 100,
    filters: LOG_TYPE_OPTIONS.map(option => ({
      text: option.label,
      value: option.value
    })),
    onFilter: (value: string, record: LogRecord) => record.log_type === value
  },
  {
    title: '用户ID',
    dataIndex: 'user_id',
    key: 'user_id',
    width: 120
  },
  {
    title: '消息',
    dataIndex: 'message',
    key: 'message',
    ellipsis: true
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
    // 构建日期参数
    let start_date: string | undefined;
    let end_date: string | undefined;
    
    if (filterForm.timeRange && filterForm.timeRange.length === 2) {
      start_date = filterForm.timeRange[0]?.format('YYYY-MM-DD');
      end_date = filterForm.timeRange[1]?.format('YYYY-MM-DD');
    }
    
    // 日志类型
    const log_type = filterForm.log_type.length === 1 ? filterForm.log_type[0] : '';
    
    // 调用API获取日志数据
    const response = await getSystemLogs(
      pagination.current,
      pagination.pageSize,
      log_type,
      start_date,
      end_date
    );
    
    if (response.success && response.data) {
      logs.value = response.data.logs;
      pagination.total = response.data.total;
      pagination.current = response.data.current_page;
    } else {
      message.error(response.message || '获取日志失败');
    }
  } catch (error) {
    console.error('加载日志数据失败:', error);
    message.error('加载日志数据失败');
  } finally {
    loading.value = false;
  }
};

// 处理表格分页、排序、筛选变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadLogs();
};

// 搜索日志
const handleSearch = () => {
  pagination.current = 1; // 重置到第一页
  loadLogs();
};

// 重置筛选条件
const resetFilters = () => {
  filterForm.log_type = [];
  filterForm.timeRange = [];
  filterForm.keyword = '';
  filterForm.userId = '';
  pagination.current = 1;
  loadLogs();
};

// 导出日志
const handleExport = () => {
  // 构建导出参数
  let start_date: string | undefined;
  let end_date: string | undefined;
  
  if (filterForm.timeRange && filterForm.timeRange.length === 2) {
    start_date = filterForm.timeRange[0]?.format('YYYY-MM-DD');
    end_date = filterForm.timeRange[1]?.format('YYYY-MM-DD');
  }
  
  // 调用导出API
  exportSystemData({
    export_type: 'system_logs',
    start_date,
    end_date
  }).then(response => {
    if (response.success && response.data) {
      const downloadUrl = downloadExportedData(response.data.filename);
      // 使用我们的下载工具函数
      triggerDownload(downloadUrl, response.data.filename);
      
      message.success(`已导出 ${response.data.record_count} 条日志记录`);
    } else {
      message.error(response.message || '导出日志失败');
    }
  }).catch(error => {
    console.error('导出日志失败:', error);
    message.error('导出日志失败');
  });
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
时间: ${formatDate(selectedLog.value.created_at)}
类型: ${getLevelText(selectedLog.value.log_type)}
用户ID: ${selectedLog.value.user_id || '无'}
消息: ${selectedLog.value.message}
${selectedLog.value.details ? '详细信息: ' + selectedLog.value.details : ''}
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
  return LOG_TYPE_COLORS[level] || 'default';
};

// 获取日志级别文本
const getLevelText = (level: string) => {
  return LOG_TYPE_TEXTS[level] || level;
};

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知';
  try {
    // 处理ISO格式的日期字符串 (如: 2025-04-13T22:11:33)
    return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
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

.system-line {
  color: #52c41a;
}

.user-line {
  color: #9254de;
}

.security-line {
  color: #eb2f96;
  font-weight: bold;
}

.auth-line {
  color: #fa541c;
}

.database-line {
  color: #08979c;
}

.api-line {
  color: #2f54eb;
}

.highlight {
  background-color: #ffff00;
  color: #000000;
}

.log-details {
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