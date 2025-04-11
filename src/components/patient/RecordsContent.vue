<template>
  <div class="records-container">
    <div class="records-header">
      <h1>健康记录</h1>
      <div class="header-actions">
        <a-button type="primary" icon-only @click="handleAddRecord">
          <template #icon>
            <plus-outlined />
          </template>
          <span>添加记录</span>
        </a-button>
        <a-button @click="showFilterDrawer = true">
          <filter-outlined />
          高级筛选
        </a-button>
        <a-button @click="handleExport" :disabled="!hasSelectedRecords">
          <export-outlined />
          导出
        </a-button>
      </div>
    </div>
    
    <!-- 搜索工具栏 -->
    <div class="search-bar">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜索健康记录..."
        style="width: 300px"
        @search="handleSearch"
      />
      <a-select
        v-model:value="searchType"
        placeholder="记录类型"
        style="width: 150px; margin-left: 8px"
        allow-clear
      >
        <a-select-option v-for="type in recordTypes" :key="type" :value="type">
          {{ type }}
        </a-select-option>
      </a-select>
      <a-range-picker
        v-model:value="dateRange"
        style="margin-left: 8px"
        :placeholder="['开始日期', '结束日期']"
      />
      <a-checkbox v-model:checked="usePIR" style="margin-left: 8px">
        使用PIR查询
      </a-checkbox>
    </div>
    
    <!-- 表格视图 -->
    <a-card style="margin-top: 16px">
      <a-table
        :columns="columns"
        :data-source="records"
        :loading="loading"
        :pagination="pagination"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        @change="handleTableChange"
        :row-key="record => record.id || record._id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <a @click="handleViewRecord(record)">{{ record.title }}</a>
          </template>
          <template v-else-if="column.key === 'record_type'">
            <a-tag
              :color="getTypeColor(record.record_type)"
            >
              {{ record.record_type }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'date'">
            {{ formatDate(record.date || record.created_at) }}
          </template>
          <template v-else-if="column.key === 'is_private'">
            <a-tag :color="record.is_private ? 'red' : 'green'">
              {{ record.is_private ? '私密' : '共享' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'tags'">
            <template v-if="record.tags && record.tags.length">
              <a-tag v-for="tag in record.tags" :key="tag">
                {{ tag }}
              </a-tag>
            </template>
            <template v-else>-</template>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a @click="handleViewRecord(record)">查看</a>
              <a @click="handleEditRecord(record)">编辑</a>
              <a-dropdown>
                <a class="ant-dropdown-link" @click.prevent>
                  更多 <down-outlined />
                </a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item @click="handleShareRecord(record)">
                      <share-alt-outlined /> 共享
                    </a-menu-item>
                    <a-menu-item @click="handleExportRecord(record)">
                      <export-outlined /> 导出
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item danger @click="handleDeleteRecord(record)">
                      <delete-outlined /> 删除
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <!-- 筛选抽屉 -->
    <a-drawer
      title="高级筛选"
      placement="right"
      :open="showFilterDrawer"
      @close="showFilterDrawer = false"
      width="360"
    >
      <a-form layout="vertical">
        <a-form-item label="记录类型">
          <a-select
            v-model:value="filters.record_types"
            mode="multiple"
            placeholder="选择记录类型"
            style="width: 100%"
            allow-clear
          >
            <a-select-option v-for="type in recordTypes" :key="type" :value="type">
              {{ type }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="医疗机构">
          <a-select
            v-model:value="filters.hospitals"
            mode="multiple"
            placeholder="选择医疗机构"
            style="width: 100%"
            allow-clear
          >
            <a-select-option v-for="hospital in hospitals" :key="hospital" :value="hospital">
              {{ hospital }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="标签">
          <a-select
            v-model:value="filters.tags"
            mode="multiple"
            placeholder="选择标签"
            style="width: 100%"
            allow-clear
          >
            <a-select-option v-for="tag in tags" :key="tag" :value="tag">
              {{ tag }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="日期范围">
          <a-range-picker
            v-model:value="filters.date_range"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" block @click="applyFilters">
            应用筛选
          </a-button>
        </a-form-item>
        
        <a-form-item>
          <a-button block @click="resetFilters">
            重置筛选
          </a-button>
        </a-form-item>
      </a-form>
    </a-drawer>
    
    <!-- 记录详情抽屉 -->
    <a-drawer
      title="健康记录详情"
      placement="right"
      :open="showRecordDrawer"
      @close="showRecordDrawer = false"
      width="640"
    >
      <template v-if="currentRecord">
        <a-descriptions bordered>
          <a-descriptions-item label="标题" :span="3">
            {{ currentRecord.title }}
          </a-descriptions-item>
          <a-descriptions-item label="记录类型">
            <a-tag :color="getTypeColor(currentRecord.record_type)">
              {{ currentRecord.record_type }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="日期">
            {{ formatDate(currentRecord.date || currentRecord.created_at) }}
          </a-descriptions-item>
          <a-descriptions-item label="隐私设置">
            <a-tag :color="currentRecord.is_private ? 'red' : 'green'">
              {{ currentRecord.is_private ? '私密' : '共享' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="描述" :span="3">
            {{ currentRecord.description || '无描述' }}
          </a-descriptions-item>
          <a-descriptions-item label="医生姓名" v-if="currentRecord.doctor_name">
            {{ currentRecord.doctor_name }}
          </a-descriptions-item>
          <a-descriptions-item label="医疗机构" v-if="currentRecord.hospital">
            {{ currentRecord.hospital }}
          </a-descriptions-item>
          <a-descriptions-item label="科室" v-if="currentRecord.department">
            {{ currentRecord.department }}
          </a-descriptions-item>
          <a-descriptions-item label="诊断" v-if="currentRecord.diagnosis" :span="3">
            {{ currentRecord.diagnosis }}
          </a-descriptions-item>
          <a-descriptions-item label="治疗方案" v-if="currentRecord.treatment" :span="3">
            {{ currentRecord.treatment }}
          </a-descriptions-item>
          <a-descriptions-item label="用药" v-if="currentRecord.medication" :span="3">
            {{ currentRecord.medication }}
          </a-descriptions-item>
          <a-descriptions-item label="备注" v-if="currentRecord.notes" :span="3">
            {{ currentRecord.notes }}
          </a-descriptions-item>
          <a-descriptions-item label="标签" :span="3">
            <template v-if="currentRecord.tags && currentRecord.tags.length">
              <a-tag v-for="tag in currentRecord.tags" :key="tag">
                {{ tag }}
              </a-tag>
            </template>
            <template v-else>无标签</template>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDateTime(currentRecord.created_at) }}
          </a-descriptions-item>
          <a-descriptions-item label="更新时间">
            {{ formatDateTime(currentRecord.updated_at) }}
          </a-descriptions-item>
        </a-descriptions>
        
        <!-- 附件列表 -->
        <div style="margin-top: 24px">
          <h3>附件列表</h3>
          <template v-if="currentRecord.attachments && currentRecord.attachments.length">
            <a-list item-layout="horizontal" :data-source="currentRecord.attachments">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>
                      <a :href="getFileUrl(item)" target="_blank">{{ item }}</a>
                    </template>
                    <template #avatar>
                      <file-outlined />
                    </template>
                  </a-list-item-meta>
                  <a-button size="small" @click="handleDownloadFile(item)">
                    <download-outlined /> 下载
                  </a-button>
                </a-list-item>
              </template>
            </a-list>
          </template>
          <template v-else>
            <a-empty description="暂无附件" />
          </template>
        </div>
        
        <!-- 操作按钮 -->
        <div style="margin-top: 24px; text-align: right;">
          <a-space>
            <a-button @click="handleEditRecord(currentRecord)">
              <edit-outlined /> 编辑
            </a-button>
            <a-button type="primary" @click="handleShareRecord(currentRecord)">
              <share-alt-outlined /> 共享
            </a-button>
            <a-button danger @click="handleDeleteRecord(currentRecord)">
              <delete-outlined /> 删除
            </a-button>
          </a-space>
        </div>
      </template>
    </a-drawer>
    
    <!-- 导出抽屉 -->
    <a-drawer
      title="导出健康记录"
      placement="right"
      :open="showExportDrawer"
      @close="showExportDrawer = false"
      width="360"
    >
      <a-form layout="vertical">
        <a-form-item label="导出格式">
          <a-radio-group v-model:value="exportFormat">
            <a-radio value="json">JSON</a-radio>
            <a-radio value="csv">CSV</a-radio>
            <a-radio value="pdf">PDF</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="导出选项">
          <a-checkbox-group v-model:value="exportOptions">
            <a-checkbox value="include_attachments">包含附件链接</a-checkbox>
            <a-checkbox value="include_sensitive">包含敏感数据</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" block @click="confirmExport" :loading="exportLoading">
            开始导出
          </a-button>
        </a-form-item>
      </a-form>
    </a-drawer>
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
  FilterOutlined, 
  ExportOutlined, 
  ShareAltOutlined, 
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FileOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue';
import { 
  getHealthRecords, 
  getSearchFilters,
  advancedSearch,
  deleteHealthRecord,
  pirQueryHealthRecords,
  exportHealthRecords,
  downloadExportedRecords
} from '@/api/health-records';
import type { HealthRecord, AdvancedSearchRequest } from '@/types/health-records';

const router = useRouter();
const loading = ref(false);
const exportLoading = ref(false);

// 记录数据
const records = ref<HealthRecord[]>([]);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`
});

// 表格列定义
const columns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    sorter: true,
    ellipsis: true,
    width: 200
  },
  {
    title: '记录类型',
    dataIndex: 'record_type',
    key: 'record_type',
    filters: [],
    width: 120
  },
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    sorter: true,
    width: 120
  },
  {
    title: '隐私设置',
    dataIndex: 'is_private',
    key: 'is_private',
    filters: [
      { text: '私密', value: true },
      { text: '共享', value: false }
    ],
    width: 100
  },
  {
    title: '标签',
    dataIndex: 'tags',
    key: 'tags',
    ellipsis: true
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 150
  }
];

// 搜索和筛选
const searchKeyword = ref('');
const searchType = ref<string | undefined>(undefined);
const dateRange = ref<any>(null);
const usePIR = ref(false);
const showFilterDrawer = ref(false);
const filters = reactive<{
  record_types: string[];
  hospitals: string[];
  tags: string[];
  date_range: any;
}>({
  record_types: [],
  hospitals: [],
  tags: [],
  date_range: null
});

// 筛选选项
const recordTypes = ref<string[]>([]);
const hospitals = ref<string[]>([]);
const tags = ref<string[]>([]);

// 选择和操作
const selectedRowKeys = ref<string[]>([]);
const currentRecord = ref<HealthRecord | null>(null);
const showRecordDrawer = ref(false);
const showExportDrawer = ref(false);
const exportFormat = ref<'json' | 'csv' | 'pdf'>('json');
const exportOptions = ref<string[]>(['include_attachments']);

// 计算是否有选中的记录
const hasSelectedRecords = computed(() => selectedRowKeys.value.length > 0);

// 获取记录列表
const fetchRecords = async (params?: any) => {
  loading.value = true;
  try {
    // 根据是否使用PIR来调用不同的API
    let response;
    if (usePIR.value) {
      response = await pirQueryHealthRecords();
    } else {
      response = await getHealthRecords();
    }
    
    if (response.success && response.data) {
      // 处理响应数据
      if (Array.isArray(response.data)) {
        records.value = response.data;
        pagination.total = response.data.length;
      } else if (response.data.records) {
        records.value = response.data.records;
        pagination.total = response.data.total || response.data.records.length;
      }
    } else {
      message.error('获取健康记录失败');
    }
  } catch (error) {
    console.error('获取健康记录列表失败:', error);
    message.error('获取健康记录列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取筛选选项
const fetchFilterOptions = async () => {
  try {
    const response = await getSearchFilters();
    if (response.success && response.data) {
      recordTypes.value = response.data.record_types || [];
      hospitals.value = response.data.hospitals || [];
      tags.value = response.data.tags || [];
      
      // 更新表格列的筛选器
      columns.forEach(column => {
        if (column.key === 'record_type') {
          column.filters = recordTypes.value.map(type => ({
            text: type,
            value: type
          }));
        }
      });
    }
  } catch (error) {
    console.error('获取筛选选项失败:', error);
  }
};

// 表格变更处理
const handleTableChange = (pag: TablePaginationConfig, filters: any, sorter: any) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize;
  
  // TODO: 处理筛选和排序
  fetchRecords({
    page: pagination.current,
    pageSize: pagination.pageSize,
    ...filters,
    sortField: sorter.field,
    sortOrder: sorter.order
  });
};

// 选择记录
const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

// 搜索处理
const handleSearch = () => {
  // 构建高级搜索请求
  const searchRequest: AdvancedSearchRequest = {
    query: searchKeyword.value
  };
  
  if (searchType.value) {
    searchRequest.record_types = [searchType.value];
  }
  
  if (dateRange.value && dateRange.value.length === 2) {
    searchRequest.date_from = dateRange.value[0].format('YYYY-MM-DD');
    searchRequest.date_to = dateRange.value[1].format('YYYY-MM-DD');
  }
  
  // 执行高级搜索
  loading.value = true;
  advancedSearch(searchRequest)
    .then(response => {
      if (response.success && response.data) {
        records.value = response.data;
        pagination.total = response.data.length;
        message.success('搜索完成');
      } else {
        message.error('搜索失败');
      }
    })
    .catch(error => {
      console.error('搜索失败:', error);
      message.error('搜索记录失败');
    })
    .finally(() => {
      loading.value = false;
    });
};

// 应用筛选器
const applyFilters = () => {
  // 构建高级搜索请求
  const searchRequest: AdvancedSearchRequest = {
    query: searchKeyword.value,
    record_types: filters.record_types.length > 0 ? filters.record_types : undefined,
    hospitals: filters.hospitals.length > 0 ? filters.hospitals : undefined,
    tags: filters.tags.length > 0 ? filters.tags : undefined
  };
  
  if (filters.date_range && filters.date_range.length === 2) {
    searchRequest.date_from = filters.date_range[0].format('YYYY-MM-DD');
    searchRequest.date_to = filters.date_range[1].format('YYYY-MM-DD');
  }
  
  // 执行高级搜索
  loading.value = true;
  advancedSearch(searchRequest)
    .then(response => {
      if (response.success && response.data) {
        records.value = response.data;
        pagination.total = response.data.length;
        message.success('筛选应用成功');
        showFilterDrawer.value = false;
      } else {
        message.error('筛选应用失败');
      }
    })
    .catch(error => {
      console.error('应用筛选失败:', error);
      message.error('应用筛选失败');
    })
    .finally(() => {
      loading.value = false;
    });
};

// 重置筛选器
const resetFilters = () => {
  filters.record_types = [];
  filters.hospitals = [];
  filters.tags = [];
  filters.date_range = null;
  message.success('筛选条件已重置');
};

// 添加记录
const handleAddRecord = () => {
  router.push('/patient/add-record');
};

// 查看记录详情
const handleViewRecord = (record: HealthRecord) => {
  currentRecord.value = record;
  showRecordDrawer.value = true;
};

// 编辑记录
const handleEditRecord = (record: HealthRecord) => {
  const recordId = record.id || record._id;
  router.push(`/patient/records/${recordId}/edit`);
};

// 删除记录
const handleDeleteRecord = (record: HealthRecord) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除记录 "${record.title}" 吗？此操作不可恢复。`,
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      const recordId = record.id || record._id;
      try {
        const response = await deleteHealthRecord(recordId);
        if (response.success) {
          message.success('记录已删除');
          fetchRecords();
          showRecordDrawer.value = false;
        } else {
          message.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除记录失败:', error);
        message.error('删除记录失败');
      }
    }
  });
};

// 共享记录
const handleShareRecord = (record: HealthRecord) => {
  const recordId = record.id || record._id;
  router.push(`/patient/records/${recordId}/share`);
};

// 导出单个记录
const handleExportRecord = (record: HealthRecord) => {
  selectedRowKeys.value = [record.id || record._id];
  showExportDrawer.value = true;
};

// 处理批量导出
const handleExport = () => {
  showExportDrawer.value = true;
};

// 确认导出
const confirmExport = async () => {
  exportLoading.value = true;
  try {
    const response = await exportHealthRecords({
      record_ids: selectedRowKeys.value,
      format: exportFormat.value
    });
    
    if (response.success && response.data) {
      // 提供下载链接
      const downloadUrl = downloadExportedRecords(response.data.filename);
      
      // 创建一个临时链接并点击它来下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = response.data.filename;
      link.click();
      
      message.success('导出成功');
      showExportDrawer.value = false;
    } else {
      message.error(response.message || '导出失败');
    }
  } catch (error) {
    console.error('导出记录失败:', error);
    message.error('导出记录失败');
  } finally {
    exportLoading.value = false;
  }
};

// 获取文件URL
const getFileUrl = (filename: string) => {
  return `${import.meta.env.VITE_API_URL}/health/files/${filename}`;
};

// 下载文件
const handleDownloadFile = (filename: string) => {
  const link = document.createElement('a');
  link.href = getFileUrl(filename);
  link.download = filename;
  link.click();
};

// 根据记录类型获取颜色
const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    medication: 'green',
    examination: 'blue',
    diagnosis: 'orange',
    treatment: 'purple',
    allergy: 'magenta',
    immunization: 'cyan',
    lab_result: 'gold',
    vital_signs: 'geekblue'
  };
  
  return colorMap[type] || 'blue';
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD');
};

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 组件挂载时获取数据
onMounted(() => {
  fetchRecords();
  fetchFilterOptions();
});
</script>

<style scoped>
.records-container {
  padding: 0 12px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.search-bar {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 768px) {
  .records-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .search-bar {
    flex-direction: column;
    width: 100%;
  }
  
  .search-bar .ant-input-search,
  .search-bar .ant-select,
  .search-bar .ant-picker {
    width: 100% !important;
    margin-left: 0 !important;
  }
}
</style> 