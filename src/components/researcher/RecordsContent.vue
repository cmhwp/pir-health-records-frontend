<template>
  <div class="records-content">
    <a-card class="records-card">
      <template #title>
        <div class="card-title">
          <span>健康记录列表</span>
          <div class="action-buttons">
            <a-button @click="fetchRecords">
              <template #icon><reload-outlined /></template>
              刷新
            </a-button>
            <a-button type="primary" @click="handleExport">
              <template #icon><download-outlined /></template>
              导出匿名数据
            </a-button>
          </div>
        </div>
      </template>

      <!-- 过滤器表单 -->
      <a-form layout="inline" class="filter-form">
        <a-form-item label="记录类型">
          <a-select
            v-model:value="filterParams.record_type"
            style="width: 180px"
            placeholder="选择记录类型"
            allowClear
          >
            <a-select-option v-for="type in recordTypeOptions" :key="type.value" :value="type.value">
              {{ type.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="关键词">
          <a-input 
            v-model:value="filterParams.keyword" 
            placeholder="记录标题/描述" 
            style="width: 200px" 
            allowClear
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" @click="fetchRecords">
            <template #icon><search-outlined /></template>
            查询
          </a-button>
          <a-button style="margin-left: 8px" @click="resetFilters">
            <template #icon><clear-outlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 记录列表表格 -->
      <a-table 
        :columns="columns" 
        :data-source="records" 
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        rowKey="id"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'record_type'">
            <a-tag color="blue">{{ getRecordTypeLabel(record.record_type) }}</a-tag>
          </template>
          
          <template v-if="column.key === 'visibility'">
            <a-tag color="green" v-if="record.visibility === 'researcher'">研究可见</a-tag>
            <a-tag color="orange" v-else>{{ record.visibility }}</a-tag>
          </template>
          
          <template v-if="column.key === 'is_encrypted'">
            <a-tag color="purple" v-if="record.is_encrypted">加密</a-tag>
            <a-tag v-else>未加密</a-tag>
          </template>
          
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="viewRecord(record.id)">查看详情</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 导出进度弹窗 -->
    <a-modal
      v-model:visible="exportModalVisible"
      title="导出数据"
      :footer="null"
      :closable="false"
      :maskClosable="false"
      width="400px"
    >
      <div class="export-progress">
        <a-spin v-if="exporting" tip="正在导出匿名化数据，请稍候..."></a-spin>
        <div v-else class="export-success">
          <check-circle-outlined style="font-size: 24px; color: #52c41a;" />
          <p>导出成功！</p>
          <a-button type="primary" @click="exportModalVisible = false">关闭</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import type { FilterValue, SorterResult } from 'ant-design-vue/es/table/interface';
import dayjs from 'dayjs';
import {
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined,
  DownloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue';
import {
  getAccessibleRecords,
  exportAnonymizedRecords
} from '@/api/researcher';
import type {
  ResearcherAccessibleRecord,
  GetResearcherRecordsParams
} from '@/types/researcher';
import { useRecordTypes } from '@/hooks/useRecordTypes';
const router = useRouter();
const loading = ref<boolean>(false);
const records = ref<ResearcherAccessibleRecord[]>([]);
const exportModalVisible = ref<boolean>(false);
const exporting = ref<boolean>(false);

// 记录类型定义
const { recordTypeOptions } = useRecordTypes();

// 筛选器参数
const filterParams = reactive<GetResearcherRecordsParams>({
  page: 1,
  per_page: 10,
  record_type: undefined,
  keyword: undefined
});

// 分页设置
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`
});

// 表格列定义
const columns = [
  {
    title: '记录标题',
    dataIndex: 'title',
    key: 'title',
    fixed: 'left',
    width: 180,
    ellipsis: true
  },
  {
    title: '记录类型',
    dataIndex: 'record_type',
    key: 'record_type',
    width: 120,
    filters: recordTypeOptions.value.map(type => ({
      text: type.label,
      value: type.value
    }))
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: '医生',
    dataIndex: 'doctor_name',
    key: 'doctor_name',
    width: 120
  },
  {
    title: '患者',
    dataIndex: 'patient_name',
    key: 'patient_name',
    width: 120
  },
  {
    title: '记录日期',
    dataIndex: 'record_date',
    key: 'record_date',
    width: 120,
    sorter: true,
    render: (_: any, record: ResearcherAccessibleRecord) => 
      record.record_date ? dayjs(record.record_date).format('YYYY-MM-DD') : '未知'
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 120,
    sorter: true,
    render: (_: any, record: ResearcherAccessibleRecord) => dayjs(record.created_at).format('YYYY-MM-DD')
  },
  {
    title: '可见性',
    dataIndex: 'visibility',
    key: 'visibility',
    width: 120
  },
  {
    title: '加密状态',
    dataIndex: 'is_encrypted',
    key: 'is_encrypted',
    width: 120
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 120
  }
];

// 获取记录列表
const fetchRecords = async () => {
  loading.value = true;
  try {
    const params: GetResearcherRecordsParams = {
      page: pagination.current,
      per_page: pagination.pageSize,
      ...filterParams
    };
    
    const response = await getAccessibleRecords(params);
    if (response.success && response.data) {
      records.value = response.data.records;
      pagination.total = response.data.total;
      pagination.current = response.data.current_page;
    } else {
      message.error(response.message || '获取记录列表失败');
    }
  } catch (error) {
    console.error('获取记录列表失败:', error);
    message.error('获取记录列表失败');
  } finally {
    loading.value = false;
  }
};

// 重置筛选条件
const resetFilters = () => {
  filterParams.record_type = undefined;
  filterParams.keyword = undefined;
  pagination.current = 1;
  fetchRecords();
};

// 处理表格变更（排序、筛选、分页）
const handleTableChange = (
  pag: TablePaginationConfig,
  filters: Record<string, FilterValue | null>,
  sorter: SorterResult<ResearcherAccessibleRecord> | SorterResult<ResearcherAccessibleRecord>[]
) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  
  // 处理筛选
  if (filters.record_type && filters.record_type.length) {
    filterParams.record_type = filters.record_type[0] as string;
  }
  
  // 重新获取数据
  fetchRecords();
};

// 查看记录详情
const viewRecord = (recordId: number) => {
  router.push(`/researcher/records/${recordId}`);
};

// 导出匿名化数据
const handleExport = async () => {
  try {
    exportModalVisible.value = true;
    exporting.value = true;
    
    const blob = await exportAnonymizedRecords();
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `匿名健康记录_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    exporting.value = false;
    message.success('数据导出成功');
  } catch (error) {
    console.error('导出数据失败:', error);
    message.error('导出数据失败');
    exporting.value = false;
    exportModalVisible.value = false;
  }
};

// 获取记录类型标签
const getRecordTypeLabel = (type: string): string => {
  const recordType = recordTypeOptions.value.find(t => t.value === type);
  return recordType ? recordType.label : type;
};

onMounted(() => {
  fetchRecords();
});
</script>

<style scoped>
.records-content {
  padding: 16px;
}

.records-card {
  margin-bottom: 24px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin-bottom: 16px;
}

.export-progress {
  text-align: center;
  padding: 20px 0;
}

.export-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
</style> 