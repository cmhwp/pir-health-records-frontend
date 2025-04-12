<template>
  <div class="records-container">
    <div class="records-header">
      <a-row type="flex" justify="space-between" align="middle">
        <a-col>
          <h2>我的健康记录</h2>
        </a-col>
        <a-col>
          <a-space>
            <a-button type="primary" @click="navigateToAddRecord">
              <template #icon><PlusOutlined /></template>
              添加记录
            </a-button>
            <a-button @click="handleExport">
              <template #icon><ExportOutlined /></template>
              导出记录
            </a-button>
            <a-button @click="handleImport">
              <template #icon><ImportOutlined /></template>
              导入记录
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <div class="records-filters">
      <a-form layout="inline">
        <a-form-item label="记录类型">
          <a-select
            v-model:value="filters.record_type"
            placeholder="记录类型"
            style="width: 160px"
            allowClear
          >
            <a-select-option v-for="type in recordTypeOptions" :key="type.value" :value="type.value">
              {{ type.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="日期范围">
          <a-range-picker
            v-model:value="dateRange"
            format="YYYY-MM-DD"
            style="width: 260px"
            @change="handleDateRangeChange"
          />
        </a-form-item>
        <a-form-item label="关键词">
          <a-input
            v-model:value="filters.keyword"
            placeholder="搜索关键词"
            style="width: 200px"
            allowClear
            @pressEnter="fetchRecords"
          />
        </a-form-item>
        <a-form-item>
          <a-switch
            v-model:checked="filters.anonymous"
            checked-children="PIR查询"
            un-checked-children="常规查询"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="fetchRecords">
            <template #icon><SearchOutlined /></template>
            搜索
          </a-button>
          <a-button style="margin-left: 8px" @click="resetFilters">
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-table
      :dataSource="records"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      rowKey="_id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'record_type'">
          <a-tag :color="getRecordTypeColor(record.record_type)">
            {{ getRecordTypeName(record.record_type) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'record_date'">
          {{ formatDate(record.record_date) }}
        </template>
        <template v-else-if="column.key === 'visibility'">
          {{ getVisibilityName(record.visibility) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="viewRecord(record._id)">
              <template #icon><EyeOutlined /></template>
              查看
            </a-button>
            <a-button type="link" size="small" @click="editRecord(record._id)">
              <template #icon><EditOutlined /></template>
              编辑
            </a-button>
            <a-button type="link" size="small" @click="shareRecord(record._id)">
              <template #icon><ShareAltOutlined /></template>
              分享
            </a-button>
            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="viewVersions(record._id)">
                    <history-outlined /> 版本历史
                  </a-menu-item>
                  <a-menu-item @click="deleteRecord(record._id)">
                    <delete-outlined /> 删除
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="link" size="small">
                <template #icon><more-outlined /></template>
                更多
              </a-button>
            </a-dropdown>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 导入模态框 -->
    <a-modal
      v-model:visible="importModalVisible"
      title="导入健康记录"
      :confirm-loading="importing"
      @ok="handleImportSubmit"
    >
      <a-upload
        v-model:file-list="importFileList"
        :before-upload="beforeImportUpload"
        :maxCount="1"
      >
        <a-button>
          <upload-outlined /> 选择文件
        </a-button>
      </a-upload>
      <a-alert
        style="margin-top: 16px"
        message="支持JSON或CSV格式的健康记录文件导入"
        type="info"
        show-icon
      />
    </a-modal>

    <!-- 导出模态框 -->
    <a-modal
      v-model:visible="exportModalVisible"
      title="导出健康记录"
      :confirm-loading="exporting"
      @ok="handleExportSubmit"
    >
      <a-form :model="exportForm" layout="vertical">
        <a-form-item label="导出范围">
          <a-radio-group v-model:value="exportForm.export_all">
            <a-radio :value="true">导出全部记录</a-radio>
            <a-radio :value="false">导出选定记录</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="导出格式">
          <a-radio-group v-model:value="exportForm.format">
            <a-radio value="json">JSON格式</a-radio>
            <a-radio value="csv">CSV格式</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认 -->
    <a-modal
      v-model:visible="deleteModalVisible"
      title="删除健康记录"
      :confirm-loading="deleting"
      okText="删除"
      okType="danger"
      @ok="confirmDelete"
    >
      <p>确定要删除此健康记录吗？删除后将无法恢复。</p>
      <a-checkbox v-model:checked="secureDelete">安全删除（符合GDPR要求）</a-checkbox>
      <a-form-item v-if="secureDelete" label="删除原因" style="margin-top: 16px">
        <a-input v-model:value="deleteReason" placeholder="请输入删除原因" />
      </a-form-item>
      <a-checkbox v-if="secureDelete" v-model:checked="createBackup">保留备份记录（仅管理员可见）</a-checkbox>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import dayjs from 'dayjs';
import { 
  PlusOutlined, 
  ExportOutlined, 
  ImportOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  HistoryOutlined,
  MoreOutlined,
  UploadOutlined
} from '@ant-design/icons-vue';
import {
  getHealthRecords,
  deleteHealthRecord,
  secureDeleteHealthRecord,
  exportHealthRecords,
  importHealthRecords
} from '@/api/health';
import { RecordType, RecordVisibility, type HealthRecord, type GetRecordsParams } from '@/types/health';
import type { UploadProps } from 'ant-design-vue';

const router = useRouter();
const loading = ref(false);
const records = ref<HealthRecord[]>([]);
const total = ref(0);

// 分页配置
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
});

// 筛选条件
const filters = reactive<GetRecordsParams>({
  page: 1,
  per_page: 10,
  record_type: undefined,
  start_date: undefined,
  end_date: undefined,
  keyword: undefined,
  anonymous: false
});

// 日期范围选择器值
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 表格列定义
const columns = [
  {
    title: '记录标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
    width: 200
  },
  {
    title: '记录类型',
    dataIndex: 'record_type',
    key: 'record_type',
    width: 120
  },
  {
    title: '记录日期',
    dataIndex: 'record_date',
    key: 'record_date',
    width: 160,
    sorter: true
  },
  {
    title: '医疗机构',
    dataIndex: 'institution',
    key: 'institution',
    ellipsis: true,
    width: 150
  },
  {
    title: '可见性',
    dataIndex: 'visibility',
    key: 'visibility',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 240
  }
];

// 记录类型选项
const recordTypeOptions = [
  { label: '常规检查', value: RecordType.GENERAL },
  { label: '实验室检查', value: RecordType.LABORATORY },
  { label: '用药记录', value: RecordType.MEDICATION },
  { label: '影像检查', value: RecordType.IMAGING },
  { label: '生命体征', value: RecordType.VITAL_SIGNS },
  { label: '手术记录', value: RecordType.SURGERY },
  { label: '疫苗接种', value: RecordType.VACCINATION },
  { label: '过敏记录', value: RecordType.ALLERGY },
  { label: '诊断结果', value: RecordType.DIAGNOSIS },
  { label: '其他记录', value: RecordType.OTHER }
];

// 导入功能
const importModalVisible = ref(false);
const importFileList = ref<any[]>([]);
const importing = ref(false);

// 导出功能
const exportModalVisible = ref(false);
const exportForm = reactive({
  export_all: true,
  format: 'json' as 'json' | 'csv'
});
const exporting = ref(false);

// 删除功能
const deleteModalVisible = ref(false);
const deleting = ref(false);
const recordToDelete = ref<string>('');
const secureDelete = ref(false);
const createBackup = ref(true);
const deleteReason = ref('');

// 获取记录类型名称
const getRecordTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    general: '常规检查',
    laboratory: '实验室检查',
    medication: '用药记录',
    imaging: '影像检查',
    vital_signs: '生命体征',
    surgery: '手术记录',
    vaccination: '疫苗接种',
    allergy: '过敏记录',
    diagnosis: '诊断结果',
    other: '其他记录'
  };
  return typeMap[type] || '未知类型';
};

// 获取记录类型颜色
const getRecordTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    general: '#1890ff',
    laboratory: '#13c2c2',
    medication: '#52c41a',
    imaging: '#2f54eb',
    vital_signs: '#722ed1',
    surgery: '#eb2f96',
    vaccination: '#faad14',
    allergy: '#f5222d',
    diagnosis: '#fa8c16',
    other: '#bfbfbf'
  };
  return colorMap[type] || '#d9d9d9';
};

// 获取可见性名称
const getVisibilityName = (visibility: string): string => {
  const visibilityMap: Record<string, string> = {
    private: '仅自己可见',
    public: '所有人可见',
    doctor: '医生可见',
    researcher: '研究人员可见'
  };
  return visibilityMap[visibility] || '未知';
};

// 格式化日期
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '未记录';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 处理日期范围变化
const handleDateRangeChange = (dates: any) => {
  if (dates && dates.length === 2) {
    filters.start_date = dates[0]?.format('YYYY-MM-DD');
    filters.end_date = dates[1]?.format('YYYY-MM-DD');
  } else {
    filters.start_date = undefined;
    filters.end_date = undefined;
  }
};

// 获取健康记录列表
const fetchRecords = async () => {
  loading.value = true;
  try {
    const queryParams: GetRecordsParams = {
      ...filters,
      page: pagination.current,
      per_page: pagination.pageSize
    };
    
    const response = await getHealthRecords(queryParams);
    if (response.success && response.data) {
      records.value = response.data.records;
      pagination.total = response.data.total;
      pagination.current = response.data.current_page;
    } else {
      message.error(response.message || '获取健康记录失败');
    }
  } catch (error) {
    console.error('获取健康记录失败:', error);
    message.error('获取健康记录失败');
  } finally {
    loading.value = false;
  }
};

// 处理表格变化
const handleTableChange = (pag: TablePaginationConfig, filters: any, sorter: any) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  
  // 处理排序
  if (sorter && sorter.field && sorter.order) {
    const sortField = sorter.field as string;
    const sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
    // 这里可以添加处理排序的逻辑
  }
  
  fetchRecords();
};

// 重置筛选条件
const resetFilters = () => {
  filters.record_type = undefined;
  filters.start_date = undefined;
  filters.end_date = undefined;
  filters.keyword = undefined;
  filters.anonymous = false;
  dateRange.value = null;
  fetchRecords();
};

// 查看记录详情
const viewRecord = (recordId: string) => {
  router.push(`/patient/records/${recordId}`);
};

// 编辑记录
const editRecord = (recordId: string) => {
  router.push(`/patient/records/${recordId}/edit`);
};

// 分享记录
const shareRecord = (recordId: string) => {
  router.push(`/patient/records/${recordId}/share`);
};

// 查看版本历史
const viewVersions = (recordId: string) => {
  router.push(`/patient/records/${recordId}/versions`);
};

// 删除记录
const deleteRecord = (recordId: string) => {
  recordToDelete.value = recordId;
  secureDelete.value = false;
  createBackup.value = true;
  deleteReason.value = '';
  deleteModalVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
  if (!recordToDelete.value) return;
  
  deleting.value = true;
  try {
    let response;
    
    if (secureDelete.value) {
      // 安全删除
      const params = {
        reason: deleteReason.value || '用户请求删除',
        create_backup: createBackup.value
      };
      response = await secureDeleteHealthRecord(recordToDelete.value, params);
    } else {
      // 常规删除
      response = await deleteHealthRecord(recordToDelete.value);
    }
    
    if (response.success) {
      message.success('记录已成功删除');
      deleteModalVisible.value = false;
      fetchRecords(); // 刷新列表
    } else {
      message.error(response.message || '删除失败');
    }
  } catch (error) {
    console.error('删除记录失败:', error);
    message.error('删除记录失败');
  } finally {
    deleting.value = false;
  }
};

// 导入健康记录
const handleImport = () => {
  importFileList.value = [];
  importModalVisible.value = true;
};

// 上传前验证
const beforeImportUpload: UploadProps['beforeUpload'] = (file) => {
  const isJSONOrCSV = file.type === 'application/json' || 
                      file.type === 'text/csv' || 
                      file.name.endsWith('.json') || 
                      file.name.endsWith('.csv');
                      
  if (!isJSONOrCSV) {
    message.error('只能上传 JSON 或 CSV 文件!');
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件必须小于 10MB!');
  }
  
  return isJSONOrCSV && isLt10M;
};

// 提交导入
const handleImportSubmit = async () => {
  if (importFileList.value.length === 0) {
    message.warning('请选择要导入的文件');
    return;
  }
  
  importing.value = true;
  try {
    const file = importFileList.value[0].originFileObj;
    const response = await importHealthRecords(file);
    
    if (response.success) {
      message.success(`成功导入 ${response.data?.count || 0} 条健康记录`);
      importModalVisible.value = false;
      fetchRecords(); // 刷新列表
    } else {
      message.error(response.message || '导入失败');
    }
  } catch (error) {
    console.error('导入记录失败:', error);
    message.error('导入记录失败');
  } finally {
    importing.value = false;
  }
};

// 导出健康记录
const handleExport = () => {
  exportForm.export_all = true;
  exportForm.format = 'json';
  exportModalVisible.value = true;
};

// 提交导出
const handleExportSubmit = async () => {
  exporting.value = true;
  try {
    // 准备导出参数
    const params = {
      export_all: exportForm.export_all,
      format: exportForm.format,
      record_ids: exportForm.export_all ? undefined : getSelectedRecordIds()
    };
    
    const response = await exportHealthRecords(params);
    
    if (response.success && response.data) {
      const downloadUrl = response.data.download_url;
      
      // 创建下载链接并点击
      const link = document.createElement('a');
      link.href = `${import.meta.env.VITE_API_URL}${downloadUrl}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('导出成功，正在下载文件');
      exportModalVisible.value = false;
    } else {
      message.error(response.message || '导出失败');
    }
  } catch (error) {
    console.error('导出记录失败:', error);
    message.error('导出记录失败');
  } finally {
    exporting.value = false;
  }
};

// 获取选中的记录ID
const getSelectedRecordIds = (): string[] => {
  // 实际应用中，可能需要实现记录的多选功能
  // 这里简化处理，返回所有当前可见记录的ID
  return records.value.map(record => record._id);
};

// 导航到添加记录页面
const navigateToAddRecord = () => {
  router.push('/patient/add-record');
};

// 初始化
onMounted(() => {
  fetchRecords();
});
</script>

<style scoped>
.records-container {
  width: 100%;
}

.records-header {
  margin-bottom: 16px;
}

.records-filters {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style> 