<template>
  <div class="export-data-container">
    <a-page-header
      title="数据导出"
      subtitle="导出系统数据用于备份或分析"
    />
    
    <a-card title="数据导出选项">
      <a-form :model="exportForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="数据类型" name="dataType" :rules="[{ required: true, message: '请选择数据类型' }]">
          <a-select v-model:value="exportForm.dataType" placeholder="请选择要导出的数据类型">
            <a-select-option value="patients">患者数据</a-select-option>
            <a-select-option value="records">健康记录</a-select-option>
            <a-select-option value="medications">药物数据</a-select-option>
            <a-select-option value="labs">实验室结果</a-select-option>
            <a-select-option value="system">系统日志</a-select-option>
            <a-select-option value="users">用户数据</a-select-option>
            <a-select-option value="all">所有数据</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="日期范围" name="dateRange">
          <a-range-picker 
            v-model:value="exportForm.dateRange" 
            :disabled="exportForm.dataType === 'all'"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="格式" name="format" :rules="[{ required: true, message: '请选择导出格式' }]">
          <a-radio-group v-model:value="exportForm.format">
            <a-radio value="csv">CSV</a-radio>
            <a-radio value="json">JSON</a-radio>
            <a-radio value="xml">XML</a-radio>
            <a-radio value="excel">Excel</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="数据处理选项" name="options">
          <a-checkbox-group v-model:value="exportForm.options">
            <a-checkbox value="anonymize">匿名化数据</a-checkbox>
            <a-checkbox value="compress">压缩文件</a-checkbox>
            <a-checkbox value="includeDeleted">包含已删除数据</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
        
        <a-form-item :wrapper-col="{ span: 18, offset: 6 }">
          <a-button type="primary" @click="handleExport" :loading="exporting">
            <download-outlined /> 导出数据
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
    
    <a-card title="导出历史记录" style="margin-top: 24px">
      <a-table
        :columns="historyColumns"
        :data-source="exportHistory"
        :row-key="(record: ExportHistoryItem) => record.id"
        :pagination="{ pageSize: 5 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button 
                size="small" 
                v-if="record.status === 'completed'"
                type="primary"
                @click="downloadExport(record)"
              >
                <download-outlined /> 下载
              </a-button>
              <a-button
                size="small"
                @click="viewExportDetails(record)"
              >
                <eye-outlined /> 查看
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <!-- 导出详情模态框 -->
    <a-modal
      v-model:visible="detailsModalVisible"
      title="导出详情"
      :footer="null"
      width="600px"
    >
      <a-descriptions bordered v-if="selectedExport" :column="1">
        <a-descriptions-item label="导出ID">{{ selectedExport.id }}</a-descriptions-item>
        <a-descriptions-item label="数据类型">{{ getDataTypeText(selectedExport.dataType) }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDate(selectedExport.createdAt) }}</a-descriptions-item>
        <a-descriptions-item label="完成时间" v-if="selectedExport.completedAt">{{ formatDate(selectedExport.completedAt) }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(selectedExport.status)">
            {{ getStatusText(selectedExport.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="文件大小" v-if="selectedExport.fileSize">{{ formatSize(selectedExport.fileSize) }}</a-descriptions-item>
        <a-descriptions-item label="记录数量" v-if="selectedExport.recordCount">{{ selectedExport.recordCount.toLocaleString() }}</a-descriptions-item>
        <a-descriptions-item label="导出选项">
          <div>
            <a-tag v-if="selectedExport.format">{{ selectedExport.format.toUpperCase() }}</a-tag>
            <a-tag v-for="option in selectedExport.options" :key="option">{{ getOptionText(option) }}</a-tag>
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="导出者">{{ selectedExport.exportedBy }}</a-descriptions-item>
        <a-descriptions-item label="备注" v-if="selectedExport.notes">{{ selectedExport.notes }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';

interface ExportFormState {
  dataType: string;
  dateRange: any[];
  format: string;
  options: string[];
}

interface ExportHistoryItem {
  id: string;
  dataType: string;
  createdAt: string;
  completedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileSize?: number;
  recordCount?: number;
  format: string;
  options: string[];
  exportedBy: string;
  notes?: string;
}

// 状态变量
const exporting = ref<boolean>(false);
const exportForm = reactive<ExportFormState>({
  dataType: '',
  dateRange: [],
  format: 'csv',
  options: ['anonymize']
});

const exportHistory = ref<ExportHistoryItem[]>([]);
const detailsModalVisible = ref<boolean>(false);
const selectedExport = ref<ExportHistoryItem | null>(null);

// 历史记录表格列
const historyColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '数据类型',
    dataIndex: 'dataType',
    key: 'dataType',
    render: (dataType: string) => getDataTypeText(dataType)
  },
  {
    title: '格式',
    dataIndex: 'format',
    key: 'format',
    render: (format: string) => format.toUpperCase()
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (text: string) => formatDate(text)
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '记录数量',
    dataIndex: 'recordCount',
    key: 'recordCount',
    render: (count?: number) => count ? count.toLocaleString() : '-'
  },
  {
    title: '操作',
    key: 'actions',
  }
];

// 加载历史记录
const loadExportHistory = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟数据
    exportHistory.value = [
      {
        id: 'EXP-001',
        dataType: 'patients',
        createdAt: '2023-05-10T08:30:00',
        completedAt: '2023-05-10T08:35:00',
        status: 'completed',
        fileSize: 2457600,
        recordCount: 1250,
        format: 'csv',
        options: ['anonymize', 'compress'],
        exportedBy: 'admin@example.com'
      },
      {
        id: 'EXP-002',
        dataType: 'records',
        createdAt: '2023-05-12T14:20:00',
        completedAt: '2023-05-12T14:25:00',
        status: 'completed',
        fileSize: 5242880,
        recordCount: 3500,
        format: 'json',
        options: ['anonymize'],
        exportedBy: 'admin@example.com'
      },
      {
        id: 'EXP-003',
        dataType: 'all',
        createdAt: '2023-05-15T10:15:00',
        status: 'processing',
        format: 'excel',
        options: ['anonymize', 'compress', 'includeDeleted'],
        exportedBy: 'admin@example.com'
      }
    ];
  } catch (error) {
    console.error('加载导出历史失败:', error);
    message.error('加载导出历史失败');
  }
};

// 处理导出
const handleExport = async () => {
  if (!exportForm.dataType) {
    message.error('请选择数据类型');
    return;
  }
  
  if (!exportForm.format) {
    message.error('请选择导出格式');
    return;
  }
  
  exporting.value = true;
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    message.success('数据导出任务已创建，请在历史记录中查看进度');
    
    // 重新加载历史记录
    await loadExportHistory();
    
    // 重置表单
    exportForm.dataType = '';
    exportForm.dateRange = [];
    exportForm.format = 'csv';
    exportForm.options = ['anonymize'];
  } catch (error) {
    console.error('创建导出任务失败:', error);
    message.error('创建导出任务失败');
  } finally {
    exporting.value = false;
  }
};

// 下载导出文件
const downloadExport = (record: ExportHistoryItem) => {
  message.success(`正在下载导出文件: ${record.id}`);
  // 在实际应用中，这将触发文件下载
};

// 查看导出详情
const viewExportDetails = (record: ExportHistoryItem) => {
  selectedExport.value = record;
  detailsModalVisible.value = true;
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'pending': 'blue',
    'processing': 'processing',
    'completed': 'success',
    'failed': 'error'
  };
  return colors[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'pending': '待处理',
    'processing': '处理中',
    'completed': '已完成',
    'failed': '失败'
  };
  return texts[status] || status;
};

// 获取数据类型文本
const getDataTypeText = (dataType: string) => {
  const texts: Record<string, string> = {
    'patients': '患者数据',
    'records': '健康记录',
    'medications': '药物数据',
    'labs': '实验室结果',
    'system': '系统日志',
    'users': '用户数据',
    'all': '所有数据'
  };
  return texts[dataType] || dataType;
};

// 获取选项文本
const getOptionText = (option: string) => {
  const texts: Record<string, string> = {
    'anonymize': '匿名化数据',
    'compress': '压缩文件',
    'includeDeleted': '包含已删除数据'
  };
  return texts[option] || option;
};

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 格式化文件大小
const formatSize = (bytes?: number) => {
  if (!bytes) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

// 组件挂载时加载数据
onMounted(() => {
  loadExportHistory();
});
</script>

<style scoped>
.export-data-container {
  padding: 0 24px 24px;
}
</style> 