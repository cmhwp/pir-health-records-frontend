<template>
  <div class="batch-records-container">
    <a-spin :spinning="loading">
      <a-page-header
        title="批量记录管理"
        subtitle="上传、处理和管理批量数据导入/导出操作"
      />
      
      <div class="action-bar">
        <a-radio-group v-model:value="currentView" button-style="solid">
          <a-radio-button :value="BatchStatus.PENDING">待处理</a-radio-button>
          <a-radio-button :value="BatchStatus.PROCESSING">处理中</a-radio-button>
          <a-radio-button :value="BatchStatus.COMPLETED">已完成</a-radio-button>
          <a-radio-button :value="BatchStatus.FAILED">失败</a-radio-button>
        </a-radio-group>
        
        <div class="right-actions">
          <a-button type="primary" @click="showUploadModal">
            <upload-outlined /> 上传批量数据
          </a-button>
          <a-button @click="refreshData">
            <reload-outlined />
          </a-button>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data-source="batchJobs"
        :row-key="(record: BatchJob) => record.id"
        :pagination="{ pageSize: 10 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          
          <template v-if="column.key === 'progress'">
            <a-progress
              :percent="record.progress"
              :status="getProgressStatus(record.status)"
              size="small"
            />
          </template>
          
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="viewDetails(record)">
                <eye-outlined /> 查看
              </a-button>
              <a-button 
                size="small" 
                v-if="record.status === BatchStatus.PENDING"
                type="primary"
                @click="startProcessing(record)"
              >
                <play-circle-outlined /> 开始
              </a-button>
              <a-button
                size="small"
                type="danger"
                v-if="record.status === BatchStatus.PENDING || record.status === BatchStatus.FAILED"
                @click="deleteBatch(record)"
              >
                <delete-outlined /> 删除
              </a-button>
              <a-button
                size="small"
                v-if="record.status === BatchStatus.COMPLETED"
                @click="downloadResults(record)"
              >
                <download-outlined /> 下载
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
      
      <a-empty v-if="!loading && batchJobs.length === 0" :description="getEmptyText()" />
    </a-spin>

    <!-- Upload Modal -->
    <a-modal
      v-model:visible="uploadModalVisible"
      title="上传批量数据"
      @ok="handleUpload"
      :confirmLoading="uploading"
      okText="上传"
      cancelText="取消"
    >
      <a-form :model="uploadForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="批量名称" name="name" :rules="[{ required: true, message: '请输入批量名称' }]">
          <a-input v-model:value="uploadForm.name" placeholder="请输入批量处理任务名称" />
        </a-form-item>
        
        <a-form-item label="批量类型" name="type" :rules="[{ required: true, message: '请选择批量类型' }]">
          <a-select v-model:value="uploadForm.type" placeholder="请选择批量数据类型">
            <a-select-option value="patient">患者记录</a-select-option>
            <a-select-option value="medication">药物数据</a-select-option>
            <a-select-option value="lab">实验室结果</a-select-option>
            <a-select-option value="custom">自定义数据</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="上传文件" name="file" :rules="[{ required: true, message: '请上传文件' }]">
          <a-upload-dragger
            v-model:fileList="uploadForm.fileList"
            :before-upload="beforeUpload"
            :multiple="false"
          >
            <p class="ant-upload-drag-icon">
              <inbox-outlined />
            </p>
            <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p class="ant-upload-hint">
              支持CSV、XML或JSON文件格式
            </p>
          </a-upload-dragger>
        </a-form-item>
        
        <a-form-item label="选项" name="options">
          <a-checkbox v-model:checked="uploadForm.validateOnly">仅验证（不导入）</a-checkbox>
          <a-checkbox v-model:checked="uploadForm.skipDuplicates">跳过重复数据</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Details Modal -->
    <a-modal
      v-model:visible="detailsModalVisible"
      title="批量详情"
      :footer="null"
      width="700px"
    >
      <a-descriptions bordered v-if="selectedBatch" :column="1">
        <a-descriptions-item label="批量ID">{{ selectedBatch.id }}</a-descriptions-item>
        <a-descriptions-item label="名称">{{ selectedBatch.name }}</a-descriptions-item>
        <a-descriptions-item label="类型">{{ getBatchTypeText(selectedBatch.type) }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(selectedBatch.status)">
            {{ getStatusText(selectedBatch.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="进度">
          <a-progress
            :percent="selectedBatch.progress"
            :status="getProgressStatus(selectedBatch.status)"
          />
        </a-descriptions-item>
        <a-descriptions-item label="创建者">{{ selectedBatch.createdBy }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDate(selectedBatch.createdAt) }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ formatDate(selectedBatch.updatedAt) }}</a-descriptions-item>
        <a-descriptions-item label="记录数量">{{ selectedBatch.records_count || '未知' }}</a-descriptions-item>
        <a-descriptions-item label="错误数量">{{ selectedBatch.error_count || 0 }}</a-descriptions-item>
      </a-descriptions>

      <a-tabs v-if="selectedBatch">
        <a-tab-pane key="logs" tab="处理日志">
          <a-timeline v-if="batchLogs.length">
            <a-timeline-item v-for="log in batchLogs" :key="log.id" :color="getLogColor(log.level)">
              <p><strong>{{ formatDate(log.timestamp) }}</strong></p>
              <p>{{ log.message }}</p>
            </a-timeline-item>
          </a-timeline>
          <a-empty v-else description="暂无可用日志" />
        </a-tab-pane>
        
        <a-tab-pane key="errors" tab="错误" v-if="selectedBatch.error_count > 0">
          <a-table :dataSource="batchErrors" :columns="errorColumns" :pagination="{ pageSize: 5 }" />
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { 
  UploadOutlined, 
  ReloadOutlined, 
  EyeOutlined, 
  PlayCircleOutlined,
  DeleteOutlined, 
  DownloadOutlined, 
  InboxOutlined 
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { Upload } from 'ant-design-vue';
import { 
  getBatchJobs, 
  getBatchJobDetails, 
  uploadBatchFile, 
  startBatchProcessing, 
  deleteBatchJob, 
  getBatchResultsDownloadUrl 
} from '@/api/admin';
import { 
  BatchStatus, 
  BatchType, 
  LogLevel 
} from '@/types/admin';
import type { 
  BatchJob, 
  BatchJobLog, 
  BatchJobError
} from '@/types/admin';

interface UploadForm {
  name: string;
  type: string;
  fileList: any[];
  validateOnly: boolean;
  skipDuplicates: boolean;
}

// 状态变量
const loading = ref<boolean>(false);
const currentView = ref<BatchStatus>(BatchStatus.PENDING);
const batchJobs = ref<BatchJob[]>([]);
const uploadModalVisible = ref<boolean>(false);
const uploading = ref<boolean>(false);
const detailsModalVisible = ref<boolean>(false);
const selectedBatch = ref<BatchJob | null>(null);
const batchLogs = ref<BatchJobLog[]>([]);
const batchErrors = ref<BatchJobError[]>([]);

// 表单数据
const uploadForm = reactive<UploadForm>({
  name: '',
  type: 'patient',
  fileList: [],
  validateOnly: false,
  skipDuplicates: true
});

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    render: (type: string) => getBatchTypeText(type)
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '进度',
    dataIndex: 'progress',
    key: 'progress',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (text: string) => formatDate(text)
  },
  {
    title: '操作',
    key: 'actions',
  }
];

// 错误表格列定义
const errorColumns = [
  {
    title: '行号',
    dataIndex: 'row',
    key: 'row',
  },
  {
    title: '字段',
    dataIndex: 'field',
    key: 'field',
  },
  {
    title: '值',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: '错误信息',
    dataIndex: 'error',
    key: 'error',
  }
];

// 加载批量任务数据
const loadBatchJobs = async () => {
  loading.value = true;
  try {
    const response = await getBatchJobs(currentView.value);
    if (response.success && response.data) {
      batchJobs.value = response.data.batch_jobs;
    } else {
      message.error(response.message || '加载批量任务数据失败');
    }
  } catch (error) {
    console.error('加载批量任务数据失败:', error);
    message.error('加载批量任务数据失败');
  } finally {
    loading.value = false;
  }
};

// 加载批量详情
const loadBatchDetails = async (batch: BatchJob) => {
  selectedBatch.value = batch;
  batchLogs.value = [];
  batchErrors.value = [];
  
  try {
    const response = await getBatchJobDetails(batch.id);
    
    if (response.success && response.data) {
      // 更新批量任务信息（获取最新状态）
      selectedBatch.value = response.data.batch_job;
      batchLogs.value = response.data.logs;
      batchErrors.value = response.data.errors;
    } else {
      message.error(response.message || '加载批量详情失败');
    }
  } catch (error) {
    console.error('加载批量详情失败:', error);
    message.error('加载批量详情失败');
  }
};

// 刷新数据
const refreshData = () => {
  loadBatchJobs();
};

// 显示上传模态框
const showUploadModal = () => {
  // 重置表单数据
  uploadForm.name = '';
  uploadForm.type = 'patient';
  uploadForm.fileList = [];
  uploadForm.validateOnly = false;
  uploadForm.skipDuplicates = true;
  
  uploadModalVisible.value = true;
};

// 上传前检查
const beforeUpload = (file: File) => {
  const isValidType = file.type === 'text/csv' || 
                     file.type === 'application/json' || 
                     file.type === 'application/xml' ||
                     /\.csv$/i.test(file.name) ||
                     /\.json$/i.test(file.name) ||
                     /\.xml$/i.test(file.name);
  
  if (!isValidType) {
    message.error('您只能上传CSV、JSON或XML文件!');
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件必须小于10MB!');
  }
  
  return isValidType && isLt10M ? false : Upload.LIST_IGNORE;
};

// 处理上传
const handleUpload = async () => {
  if (!uploadForm.name.trim()) {
    message.error('请提供批量名称');
    return;
  }
  
  if (uploadForm.fileList.length === 0) {
    message.error('请选择要上传的文件');
    return;
  }
  
  uploading.value = true;
  
  try {
    // 构建上传表单数据
    const formData = new FormData();
    formData.append('name', uploadForm.name);
    formData.append('type', uploadForm.type);
    formData.append('validateOnly', uploadForm.validateOnly.toString());
    formData.append('skipDuplicates', uploadForm.skipDuplicates.toString());
    formData.append('file', uploadForm.fileList[0].originFileObj);
    
    // 调用上传API
    const response = await uploadBatchFile(formData);
    
    if (response.success) {
      message.success('批量数据上传成功');
      uploadModalVisible.value = false;
      currentView.value = BatchStatus.PENDING; // 切换到待处理视图
      refreshData();
    } else {
      message.error(response.message || '批量数据上传失败');
    }
  } catch (error) {
    console.error('批量数据上传失败:', error);
    message.error('批量数据上传失败');
  } finally {
    uploading.value = false;
  }
};

// 查看详情
const viewDetails = (record: BatchJob) => {
  loadBatchDetails(record);
  detailsModalVisible.value = true;
};

// 开始处理
const startProcessing = (record: BatchJob) => {
  Modal.confirm({
    title: '开始处理',
    content: `确定要开始处理批量任务"${record.name}"吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      loading.value = true;
      try {
        const response = await startBatchProcessing(record.id);
        
        if (response.success) {
          message.success(`批量任务${record.name}开始处理`);
          currentView.value = BatchStatus.PROCESSING; // 切换到处理中视图
          refreshData();
        } else {
          message.error(response.message || '开始处理失败');
        }
      } catch (error) {
        console.error('开始处理失败:', error);
        message.error('开始处理失败');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 删除批量任务
const deleteBatch = (record: BatchJob) => {
  Modal.confirm({
    title: '删除批量任务',
    content: `确定要删除批量任务"${record.name}"吗？`,
    okType: 'danger',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      loading.value = true;
      try {
        const response = await deleteBatchJob(record.id);
        
        if (response.success) {
          message.success(`批量任务${record.name}已成功删除`);
          refreshData();
        } else {
          message.error(response.message || '删除批量任务失败');
        }
      } catch (error) {
        console.error('删除批量任务失败:', error);
        message.error('删除批量任务失败');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 下载结果
const downloadResults = (record: BatchJob) => {
  const downloadUrl = getBatchResultsDownloadUrl(record.id);
  
  // 创建一个临时链接并点击它来触发下载
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = downloadUrl;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  message.success(`正在下载${record.name}的结果`);
};

// 获取状态颜色
const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'pending': 'blue',
    'processing': 'processing',
    'completed': 'success',
    'failed': 'error'
  };
  return colorMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    'pending': '待处理',
    'processing': '处理中',
    'completed': '已完成',
    'failed': '失败'
  };
  return textMap[status] || status;
};

// 获取批量类型文本
const getBatchTypeText = (type: string): string => {
  const textMap: Record<string, string> = {
    'patient': '患者记录',
    'medication': '药物数据',
    'lab': '实验室结果',
    'custom': '自定义数据'
  };
  return textMap[type] || type;
};

// 获取进度状态
const getProgressStatus = (status: string): 'success' | 'exception' | 'active' | 'normal' => {
  if (status === BatchStatus.COMPLETED) return 'success';
  if (status === BatchStatus.FAILED) return 'exception';
  if (status === BatchStatus.PROCESSING) return 'active';
  return 'normal';
};

// 获取日志颜色
const getLogColor = (level: string): string => {
  const colorMap: Record<string, string> = {
    'info': 'blue',
    'warning': 'orange',
    'error': 'red',
    'success': 'green'
  };
  return colorMap[level] || 'blue';
};

// 获取空状态文本
const getEmptyText = (): string => {
  const textMap: Record<string, string> = {
    'pending': '暂无待处理的批量任务',
    'processing': '暂无处理中的批量任务',
    'completed': '暂无已完成的批量任务',
    'failed': '暂无失败的批量任务'
  };
  return textMap[currentView.value] || '暂无数据';
};

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 监听视图变化自动刷新数据
watch(currentView, () => {
  loadBatchJobs();
});

// 组件挂载时加载数据
onMounted(() => {
  loadBatchJobs();
});
</script>

<style scoped>
.batch-records-container {
  padding: 0 24px 24px;
}

.action-bar {
  margin: 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-actions {
  display: flex;
  gap: 8px;
}

:deep(.ant-table-pagination) {
  margin-top: 16px;
}

:deep(.ant-upload-list-item-name) {
  max-width: 250px;
}

:deep(.ant-descriptions-row > th, .ant-descriptions-row > td) {
  padding: 12px 16px;
}
</style> 