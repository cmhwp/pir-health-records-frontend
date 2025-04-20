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
            <a-select-option v-for="type in exportTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item v-if="showDateRange" label="日期范围" name="dateRange">
          <a-range-picker 
            v-model:value="exportForm.dateRange" 
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item v-if="currentTypeFormats.length > 0" label="格式" name="format" :rules="[{ required: true, message: '请选择导出格式' }]">
          <a-radio-group v-model:value="exportForm.format">
            <a-radio v-for="format in currentTypeFormats" :key="format.value" :value="format.value">
              {{ format.label }}
            </a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="数据处理选项" name="options">
          <a-checkbox-group v-model:value="exportForm.options">
            <a-checkbox v-for="option in exportOptions" :key="option.value" :value="option.value">
              {{ option.label }}
              <a-tooltip>
                <template #title>{{ option.description }}</template>
                <question-circle-outlined style="margin-left: 4px" />
              </a-tooltip>
            </a-checkbox>
          </a-checkbox-group>
        </a-form-item>
        
        <a-form-item :wrapper-col="{ span: 18, offset: 6 }">
          <a-button type="primary" @click="handleExport" :loading="exporting" :disabled="!exportForm.dataType">
            <download-outlined /> 导出数据
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
    
    <a-card title="导出历史记录" style="margin-top: 24px">
      <a-table
        :columns="historyColumns"
        :data-source="exportHistory"
        :row-key="(record: ExportTask) => record.id"
        :loading="loadingHistory"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'dataType'">
            <a-tag :color="Types.find(type => type.value === record.dataType)?.color || 'default'">
              {{ Types.find(type => type.value === record.dataType)?.label || record.dataType }}
            </a-tag>
          </template>

          <template v-if="column.key === 'format'">
            {{ record.format.toUpperCase() }}
          </template>

          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          
          <template v-if="column.key === 'record_count'">
            {{ record.record_count ? record.record_count.toLocaleString() : '-' }}
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
              <a-popconfirm
                title="确定要删除此导出任务吗?"
                @confirm="() => deleteExport(record)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button size="small" danger>
                  <delete-outlined /> 删除
                </a-button>
              </a-popconfirm>
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
        <a-descriptions-item label="备注" v-if="selectedExport.errorMessage">{{ selectedExport.errorMessage }}</a-descriptions-item>
      </a-descriptions>

      <div v-if="selectedExport && selectedExport.status === 'processing'" style="margin-top: 16px; text-align: center">
        <a-button @click="cancelExport(selectedExport)" type="danger">取消导出</a-button>
      </div>

      <div v-if="selectedExport && selectedExport.status === 'completed' && selectedExport.fileExists" style="margin-top: 16px; text-align: center">
        <a-button type="primary" @click="downloadExport(selectedExport)">
          <download-outlined /> 下载导出文件
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  DownloadOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  QuestionCircleOutlined 
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { 
  exportSystemData, 
  getExportHistory, 
  getExportDetails, 
  cancelExportTask, 
  deleteExportTask, 
  getExportOptions, 
  getExportDownloadUrl 
} from '@/api/admin';
import type { 
  ExportSystemDataParams, 
  ExportTask,
  ExportTaskDetail, 
  ExportHistoryResponse, 
  ExportTypeOption, 
  ExportFormatOption, 
  ExportOptionItem,
  ExportHistoryQueryParams 
} from '@/types/admin';
import { ExportStatus } from '@/types/admin';

interface ExportFormState {
  dataType: string;
  dateRange: any[];
  format: string;
  options: string[];
  patientId?: string;
  limit?: number;
}

// 状态变量
const exporting = ref<boolean>(false);
const loadingHistory = ref<boolean>(false);
const exportForm = reactive<ExportFormState>({
  dataType: '',
  dateRange: [],
  format: 'json',
  options: ['anonymize']
});

const exportHistory = ref<ExportTask[]>([]);
const detailsModalVisible = ref<boolean>(false);
const selectedExport = ref<ExportTaskDetail | null>(null);

// 导出选项数据
const exportTypes = ref<ExportTypeOption[]>([]);
const exportFormats = ref<ExportFormatOption[]>([]);
const exportOptions = ref<ExportOptionItem[]>([]);
const recentTypes = ref<string[]>([]);

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total: number) => `共 ${total} 条记录`
});

// 计算当前选择的类型支持的格式
const currentTypeFormats = computed(() => {
  const selectedType = exportTypes.value.find(type => type.value === exportForm.dataType);
  if (!selectedType) return exportFormats.value;
  
  return exportFormats.value.filter(format => 
    selectedType.formats.includes(format.value)
  );
});

// 是否显示日期范围选择器
const showDateRange = computed(() => {
  return exportForm.dataType !== 'all' && ['health_records', 'system_logs'].includes(exportForm.dataType);
});

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
  },
  {
    title: '格式',
    dataIndex: 'format',
    key: 'format',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
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
  },
  {
    title: '操作',
    key: 'actions',
  }
];

// 加载导出选项
const loadExportOptions = async () => {
  try {
    const { data } = await getExportOptions();
    
    // 输出日志，用于调试
    console.log('导出选项', data);
    
    if (data) {
      // 设置选项数据
      exportTypes.value = data.exportTypes || [];
      exportFormats.value = data.exportFormats || [];
      exportOptions.value = data.exportOptions || [];
      recentTypes.value = data.recentTypes || [];
      
      // 如果有最近使用的类型，设置为默认选择
      if (recentTypes.value.length > 0 && !exportForm.dataType) {
        exportForm.dataType = recentTypes.value[0];
        
        // 设置默认格式为该类型支持的第一种格式
        const defaultType = exportTypes.value.find(t => t.value === exportForm.dataType);
        if (defaultType && defaultType.formats.length > 0) {
          exportForm.format = defaultType.formats[0];
        }
      } else if (exportTypes.value.length > 0 && !exportForm.dataType) {
        // 如果没有最近使用的类型，则使用第一个可用类型
        exportForm.dataType = exportTypes.value[0].value;
        
        // 设置默认格式为该类型支持的第一种格式
        if (exportTypes.value[0].formats.length > 0) {
          exportForm.format = exportTypes.value[0].formats[0];
        }
      }
    } else {
      message.error(data.message || '加载导出选项失败');
    }
  } catch (error: any) {
    console.error('加载导出选项失败:', error);
    message.error(error.message || '加载导出选项失败');
  }
};

// 加载历史记录
const loadExportHistory = async () => {
  loadingHistory.value = true;
  
  try {
    const params: ExportHistoryQueryParams = {
      page: pagination.current,
      per_page: pagination.pageSize
    };
    
    const res = await getExportHistory(params);
    console.log(res);
    if (res) {
      exportHistory.value = res.data.exportHistory;
      pagination.total = res.data.total;
    }
  } catch (error) {
    console.error('加载导出历史失败:', error);
    message.error('加载导出历史失败');
  } finally {
    loadingHistory.value = false;
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
    // 准备请求参数
    const params: ExportSystemDataParams = {
      export_type: exportForm.dataType,
      format: exportForm.format,
      options: {
        anonymize: exportForm.options.includes('anonymize'),
      }
    };
    
    // 添加日期范围
    if (exportForm.dateRange && exportForm.dateRange.length === 2) {
      params.start_date = dayjs(exportForm.dateRange[0]).format('YYYY-MM-DD');
      params.end_date = dayjs(exportForm.dateRange[1]).format('YYYY-MM-DD');
    }
    
    // 添加其他可选参数
    if (exportForm.patientId) {
      params.patient_id = exportForm.patientId;
    }
    
    if (exportForm.limit) {
      params.limit = exportForm.limit;
    }
    
    const { data } = await exportSystemData(params);
    console.log(data);
    
    if (data) {
      message.success('数据导出任务已创建，请在历史记录中查看进度');
      
      // 重新加载历史记录
      await loadExportHistory();
      
      // 重置表单
      exportForm.dateRange = [];
      exportForm.options = ['anonymize'];
    } else {
      message.error(data.message || '创建导出任务失败');
    }
  } catch (error: any) {
    console.error('创建导出任务失败:', error);
    message.error(error.message || '创建导出任务失败');
  } finally {
    exporting.value = false;
  }
};

// 下载导出文件
const downloadExport = (record: ExportTask) => {
  const downloadUrl = getExportDownloadUrl(record.filename);
  window.open(downloadUrl, '_blank');
  message.success(`正在下载导出文件: ${record.id}`);
};

// 查看导出详情
const viewExportDetails = async (record: ExportTask) => {
  try {
    const { data } = await getExportDetails(String(record.id));
    
    if (data) {
      selectedExport.value = data;
      detailsModalVisible.value = true;
    } else {
      message.error('获取导出详情失败');
    }
  } catch (error: any) {
    console.error('获取导出详情失败:', error);
    message.error(error.message || '获取导出详情失败');
  }
};

// 取消导出任务
const cancelExport = async (record: ExportTaskDetail) => {
  try {
    const response = await cancelExportTask(String(record.id));
    console.log(response);
    
    if (response?.data?.success) {
      message.success('导出任务已取消');
      // 更新详情中的状态
      if (selectedExport.value) {
        selectedExport.value.status = ExportStatus.FAILED;
        selectedExport.value.errorMessage = '管理员手动取消任务';
      }
      // 重新加载历史记录
      await loadExportHistory();
    } else {
      message.error(response?.data?.message || '取消导出任务失败');
    }
  } catch (error: any) {
    console.error('取消导出任务失败:', error);
    message.error(error.message || '取消导出任务失败');
  }
};

// 删除导出任务
const deleteExport = async (record: ExportTask) => {
  try {
    const response = await deleteExportTask(String(record.id));
    console.log(response);
    if (response?.message) {
      message.success('导出任务已删除');
      // 重新加载历史记录
      await loadExportHistory();
      // 如果正在查看该任务的详情，关闭详情对话框
      if (selectedExport.value && selectedExport.value.id === record.id) {
        detailsModalVisible.value = false;
      }
    } else {
      message.error(response?.message || '删除导出任务失败');
    }
  } catch (error: any) {
    console.error('删除导出任务失败:', error);
    message.error('删除导出任务失败');
  }
};

// 处理表格分页变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadExportHistory();
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
  // 从导出类型列表中查找匹配的类型
  const type = exportTypes.value.find(t => t.value === dataType);
  
  // 如果找到匹配的类型，返回其标签；否则返回原始值
  return type ? type.label : dataType;
};

// 获取选项文本
const getOptionText = (option: string) => {
  const opt = exportOptions.value.find(o => o.value === option);
  return opt ? opt.label : option;
};

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};
const Types = [
  {
    value: 'users',
    label: '用户数据',
    description: '导出系统中的所有用户信息',
    color: 'blue',
  },
  {
    value: 'health_records',
    label: '健康记录',
    description: '导出患者健康记录数据',
    color: 'green',
  },
  {
    value: 'system_logs',
    label: '系统日志',
    description: '导出系统操作日志',
    color: 'purple',
  },
  {
    value: 'medications',
    label: '药物数据',
    description: '导出药物处方与用药记录',
    color: 'orange',
  },
  {
    value: 'vitals',
    label: '生命体征',
    description: '导出生命体征数据',
    color: 'red',
  },
  {
    value: 'labs',
    label: '实验室项目',
    description: '导出实验室项目数据',
    color: 'yellow',
  },
  {
    value: 'all',
    label: '所有数据',
    description: '导出系统中的所有数据',
    color: 'gray',
  } 
]

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
  loadExportOptions();
  loadExportHistory();
});
</script>

<style scoped>
.export-data-container {
  padding: 0 24px 24px;
}
</style> 