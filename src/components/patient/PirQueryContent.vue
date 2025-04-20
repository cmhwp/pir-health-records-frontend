<template>
  <div class="pir-query-container">
    <a-row :gutter="16">
      <a-col :span="24">
        <a-card>
          <template #title>
            <div style="display: flex; align-items: center; gap: 8px">
              <safety-outlined />
              <span>隐私保护查询 (PIR)</span>
            </div>
          </template>
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 16px"
            message="隐私保护查询技术"
            description="PIR (Private Information Retrieval) 技术使您能够查询健康记录，而不会泄露您的查询意图。系统会生成额外的混淆查询，确保服务器无法确定您真正感兴趣的记录。"
          />
          
          <a-form
            layout="vertical"
            :model="queryParams"
            @submit="handleSearch"
          >
            <a-row :gutter="16">
              <a-col :span="6">
                <a-form-item label="记录类型">
                  <a-select 
                    v-model:value="queryParams.record_type" 
                    placeholder="选择记录类型"
                    allowClear
                  >
                    <a-select-option v-for="type in recordTypeOptions" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              
              <a-col :span="8">
                <a-form-item label="日期范围">
                  <a-range-picker 
                    v-model:value="dateRange"
                    style="width: 100%"
                    @change="handleDateChange"
                  />
                </a-form-item>
              </a-col>
              
              <a-col :span="7">
                <a-form-item label="关键词">
                  <a-input 
                    v-model:value="queryParams.keyword" 
                    placeholder="搜索标题、描述或标签"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              
              <a-col :span="3" style="display: flex; align-items: flex-end">
                <a-form-item>
                  <a-button 
                    type="primary" 
                    html-type="submit" 
                    :loading="loading" 
                    block
                  >
                    <template #icon><search-outlined /></template>
                    查询
                  </a-button>
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="24">
        <a-card>
          <template #title>
            <div style="display: flex; align-items: center; justify-content: space-between">
              <span>查询结果</span>
              <a-tag v-if="queryMetadata.pir_enabled" color="blue">PIR 已保护</a-tag>
            </div>
          </template>
          
          <div v-if="queryMetadata.pir_enabled && records.length > 0" style="margin-bottom: 16px">
            <a-descriptions size="small" bordered>
              <a-descriptions-item label="处理记录数">{{ queryMetadata.records_processed }}</a-descriptions-item>
              <a-descriptions-item label="混淆查询数">{{ queryMetadata.noise_queries || 0 }}</a-descriptions-item>
              <a-descriptions-item label="混淆级别">{{ queryMetadata.obfuscation_level }}</a-descriptions-item>
            </a-descriptions>
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
              
              <template v-if="column.key === 'record_date'">
                {{ formatDate(record.record_date) }}
              </template>
              
              <template v-if="column.key === 'visibility'">
                {{ getVisibilityName(record.visibility) }}
              </template>
              
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="viewRecord(record._id)">
                    <template #icon><eye-outlined /></template>
                    查看
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 记录详情抽屉 -->
    <a-drawer
      v-model:visible="recordDrawerVisible"
      title="健康记录详情"
      placement="right"
      width="600"
    >
      <a-spin :spinning="recordLoading">
        <div v-if="currentRecord">
          <a-descriptions title="基本信息" bordered>
            <a-descriptions-item label="标题" :span="3">
              {{ currentRecord.title }}
            </a-descriptions-item>
            <a-descriptions-item label="记录类型">
              <a-tag :color="getRecordTypeColor(currentRecord.record_type)">
                {{ getRecordTypeName(currentRecord.record_type) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="记录日期">
              {{ formatDate(currentRecord.record_date) }}
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatDate(currentRecord.created_at) }}
            </a-descriptions-item>
            <a-descriptions-item label="医疗机构" :span="2">
              {{ currentRecord.institution || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="医生姓名">
              {{ currentRecord.doctor_name || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="可见性">
              {{ getVisibilityName(currentRecord.visibility) }}
            </a-descriptions-item>
          </a-descriptions>

          <a-divider />

          <div v-if="currentRecord.description">
            <h3>记录描述</h3>
            <p>{{ currentRecord.description }}</p>
          </div>

          <div v-if="currentRecord.medication" style="margin-top: 20px">
            <h3>用药信息</h3>
            <a-descriptions bordered>
              <a-descriptions-item label="药物名称" :span="3">
                {{ currentRecord.medication.medication_name }}
              </a-descriptions-item>
              <a-descriptions-item label="剂量">
                {{ currentRecord.medication.dosage || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="频率">
                {{ currentRecord.medication.frequency || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="用药期间">
                {{ formatDateRange(currentRecord.medication.start_date, currentRecord.medication.end_date) }}
              </a-descriptions-item>
            </a-descriptions>
          </div>

          <div v-if="currentRecord.files && currentRecord.files.length > 0" style="margin-top: 20px">
            <h3>相关文件</h3>
            <a-list size="small" bordered>
              <a-list-item v-for="file in currentRecord.files" :key="file.file_path">
                <a-list-item-meta>
                  <template #title>{{ file.file_name }}</template>
                  <template #description>{{ formatFileSize(file.file_size) }}</template>
                  <template #avatar>
                    <file-outlined />
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button type="link" @click="downloadFile(file.file_path)">
                    <template #icon><download-outlined /></template>
                    下载
                  </a-button>
                </template>
              </a-list-item>
            </a-list>
          </div>
        </div>
        <a-empty v-else description="记录数据不存在" />
      </a-spin>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  SafetyOutlined,
  SearchOutlined,
  EyeOutlined,
  FileOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue';
import { pirQueryHealthRecords, getHealthRecord, getRecordFileUrl } from '@/api/health';
import { type HealthRecord, type PIRQueryRequest } from '@/types/health';
import type { TablePaginationConfig } from 'ant-design-vue';
import { useRecordTypes } from '@/hooks/useRecordTypes';

// 数据加载状态
const loading = ref(false);
const recordLoading = ref(false);

// 查询参数
const queryParams = reactive<PIRQueryRequest>({
  record_type: undefined,
  start_date: undefined,
  end_date: undefined,
  keyword: undefined
});

// 日期选择器值
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 使用hooks获取记录类型相关函数
const { getRecordTypeName, getRecordTypeColor, recordTypeOptions: hookRecordTypeOptions, loadRecordTypes: loadRecordTypesFromHook } = useRecordTypes();

// 记录列表数据
const records = ref<HealthRecord[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50']
});

// 查询元数据
const queryMetadata = reactive({
  pir_enabled: false,
  records_processed: 0,
  matches_found: 0,
  noise_queries: 0,
  obfuscation_level: '',
  query_vector_size: 0
});

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
    width: 160
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
    width: 120
  }
];

// 记录类型选项，用于下拉菜单
const recordTypeOptions = ref<{label: string; value: string; color?: string}[]>([]);

// 记录详情
const recordDrawerVisible = ref(false);
const currentRecord = ref<HealthRecord | null>(null);

// 处理日期范围变化
const handleDateChange = (dates: any) => {
  if (dates && dates.length === 2) {
    queryParams.start_date = dates[0]?.format('YYYY-MM-DD');
    queryParams.end_date = dates[1]?.format('YYYY-MM-DD');
  } else {
    queryParams.start_date = undefined;
    queryParams.end_date = undefined;
  }
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

// 格式化日期范围
const formatDateRange = (startDate: string | undefined, endDate: string | undefined): string => {
  if (!startDate && !endDate) return '未记录';
  const start = startDate ? dayjs(startDate).format('YYYY-MM-DD') : '无起始日期';
  const end = endDate ? dayjs(endDate).format('YYYY-MM-DD') : '持续中';
  return `${start} 至 ${end}`;
};

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

// 加载记录类型
const loadRecordTypes = async () => {
  try {
    await loadRecordTypesFromHook();
    recordTypeOptions.value = hookRecordTypeOptions.value;
  } catch (error) {
    console.error('获取记录类型失败:', error);
    message.error('获取记录类型失败');
  }
};

// 执行PIR查询
const handleSearch = async () => {
  loading.value = true;
  
  try {
    const response = await pirQueryHealthRecords(queryParams);
    
    if (response.success && response.data) {
      records.value = response.data.records;
      
      // 更新元数据
      if (response.data.metadata) {
        queryMetadata.pir_enabled = response.data.metadata.pir_enabled;
        queryMetadata.records_processed = response.data.metadata.records_processed;
        queryMetadata.matches_found = response.data.metadata.matches_found || 0;
        queryMetadata.noise_queries = response.data.metadata.noise_queries || 0;
        queryMetadata.obfuscation_level = response.data.metadata.obfuscation_level;
        queryMetadata.query_vector_size = response.data.metadata.query_vector_size || 0;
      }
      
      // 显示PIR保护提示
      if (queryMetadata.pir_enabled) {
        message.success(`PIR 已保护您的查询隐私，生成 ${queryMetadata.noise_queries} 个混淆查询`);
      }
    } else {
      message.error(response.message || '查询失败');
    }
  } catch (error) {
    console.error('PIR查询失败:', error);
    message.error('查询失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 处理表格变化
const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  // 如果有更多数据可以在这里处理分页查询
};

// 查看记录详情
const viewRecord = async (recordId: string) => {
  recordDrawerVisible.value = true;
  recordLoading.value = true;
  
  try {
    // 使用anonymous=true参数进行隐私保护查询
    const response = await getHealthRecord(recordId, true);
    if (response.success && response.data) {
      currentRecord.value = response.data.record;
    } else {
      message.error('获取记录详情失败');
    }
  } catch (error) {
    console.error('获取记录详情失败:', error);
    message.error('获取记录详情失败');
  } finally {
    recordLoading.value = false;
  }
};

// 下载文件
const downloadFile = (fileName: string) => {
  const url = getRecordFileUrl(fileName);
  window.open(url, '_blank');
};

// 组件挂载时加载记录类型
onMounted(() => {
  loadRecordTypes();
});
</script>

<style scoped>
.pir-query-container {
  width: 100%;
}
</style> 