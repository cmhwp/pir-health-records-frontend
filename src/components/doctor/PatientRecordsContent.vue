<template>
  <div class="patient-records-content">
    <a-page-header title="患者健康记录" :backIcon="false">
    </a-page-header>

    <!-- 筛选条件 -->
    <a-card style="margin-bottom: 16px">
      <a-form layout="inline" :model="filterForm">
        <a-form-item label="患者">
          <a-select
            v-model:value="filterForm.patient_id"
            placeholder="选择患者"
            allowClear
            style="width: 180px"
            :loading="loadingPatients"
          >
            <a-select-option v-for="patient in patients" :key="patient.id" :value="patient.id">
              {{ patient.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="记录类型">
          <a-select
            v-model:value="filterForm.record_type"
            placeholder="选择记录类型"
            allowClear
            style="width: 150px"
          >
            <a-select-option v-for="(label, value) in recordTypeOptions" :key="value" :value="value">
              {{ label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="日期范围">
          <a-range-picker 
            v-model:value="dateRange" 
            format="YYYY-MM-DD" 
            :allowClear="true"
            style="width: 240px" 
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <template #icon><search-outlined /></template>
            查询
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            <template #icon><reload-outlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 记录列表 -->
    <a-card>
      <a-table
        :dataSource="records"
        :columns="columns"
        :pagination="pagination"
        :loading="loading"
        rowKey="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, text, record }">
          <!-- 记录标题 -->
          <template v-if="column.dataIndex === 'title'">
            <a @click="handleViewRecord(record.id)">{{ text }}</a>
          </template>

          <!-- 记录类型 -->
          <template v-else-if="column.dataIndex === 'record_type'">
            <a-tag :color="getRecordTypeColor(text)">
              {{ getRecordTypeName(text) }}
            </a-tag>
          </template>

          <!-- 记录可见性 -->
          <template v-else-if="column.dataIndex === 'visibility'">
            <a-tag :color="getVisibilityColor(text)">
              {{ getVisibilityName(text) }}
            </a-tag>
          </template>

          <!-- 记录日期 -->
          <template v-else-if="column.dataIndex === 'record_date'">
            {{ formatDate(text) }}
          </template>

          <!-- 创建时间 -->
          <template v-else-if="column.dataIndex === 'created_at'">
            {{ formatDate(text) }}
          </template>

          <!-- 操作 -->
          <template v-else-if="column.dataIndex === 'actions'">
            <a-space>
              <a @click="handleViewRecord(record.id)">查看</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';

import { getPatientRecords, getDoctorPatients } from '@/api/doctor';
import type { GetPatientRecordsResponse, Patient } from '@/types/doctor';
import { useRecordTypes } from '@/hooks/useRecordTypes';

const router = useRouter();
const { getRecordTypeName, getRecordTypeColor } = useRecordTypes();

// 记录数据
const loading = ref(false);
const records = ref<GetPatientRecordsResponse['records']>([]);

// 患者数据
const loadingPatients = ref(false);
const patients = ref<Patient[]>([]);

// 分页
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`,
});

// 筛选条件
const filterForm = reactive({
  patient_id: undefined as number | undefined,
  record_type: undefined as string | undefined,
});
// 日期范围
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();

// 表格列定义
const columns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
  },
  {
    title: '患者',
    dataIndex: 'patient_name',
    key: 'patient_name',
  },
  {
    title: '记录类型',
    dataIndex: 'record_type',
    key: 'record_type',
  },
  {
    title: '可见性',
    dataIndex: 'visibility',
    key: 'visibility',
  },
  {
    title: '记录日期',
    dataIndex: 'record_date',
    key: 'record_date',
    sorter: true,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    sorter: true,
  },
  {
    title: '操作',
    dataIndex: 'actions',
    key: 'actions',
  },
];

// 记录类型选项
const recordTypeOptions = {
  GENERAL: '常规检查',
  LAB_TEST: '实验室检测',
  IMAGING: '影像学检查',
  MEDICATION: '用药记录',
  VACCINATION: '疫苗接种',
  SURGERY: '手术记录',
  DIAGNOSIS: '诊断记录',
  VITAL_SIGNS: '生命体征',
  ALLERGIES: '过敏记录',
  MEDICAL_HISTORY: '病史记录',
  PROGRESS_NOTE: '进展记录',
  DISCHARGE_SUMMARY: '出院小结',
  CONSULTATION: '会诊记录',
  EMERGENCY: '急诊记录',
  OTHER: '其他记录'
};

// 获取患者列表
const fetchPatients = async () => {
  loadingPatients.value = true;
  try {
    const response = await getDoctorPatients();
    if (response.success && response.data) {
      patients.value = response.data.patients;
    } else {
      message.error(response.message || '获取患者列表失败');
    }
  } catch (error: any) {
    console.error('获取患者列表失败:', error);
    message.error('获取患者列表失败: ' + (error.message || '未知错误'));
  } finally {
    loadingPatients.value = false;
  }
};

// 获取记录列表
const fetchRecords = async () => {
  loading.value = true;
  try {
    // 处理日期范围
    let startDate: string | undefined;
    let endDate: string | undefined;
    
    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
      startDate = dayjs(dateRange.value[0]).format('YYYY-MM-DD');
      endDate = dayjs(dateRange.value[1]).format('YYYY-MM-DD');
    }
    
    const params = {
      page: pagination.current,
      per_page: pagination.pageSize,
      patient_id: filterForm.patient_id,
      record_type: filterForm.record_type,
      start_date: startDate,
      end_date: endDate,
      sort_by: 'created_at' as const,
      sort_order: 'desc' as const
    };
    
    const response = await getPatientRecords(params);
    if (response.success && response.data) {
      records.value = response.data.records;
      pagination.total = response.data.pagination.total;
      pagination.current = response.data.pagination.page;
    } else {
      message.error(response.message || '获取记录列表失败');
    }
  } catch (error: any) {
    console.error('获取记录列表失败:', error);
    message.error('获取记录列表失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 表格变化处理
const handleTableChange = (newPagination: TablePaginationConfig) => {
  pagination.current = newPagination.current;
  pagination.pageSize = newPagination.pageSize;
  fetchRecords();
};

// 查询
const handleSearch = () => {
  pagination.current = 1;
  fetchRecords();
};

// 重置筛选条件
const handleReset = () => {
  filterForm.patient_id = undefined;
  filterForm.record_type = undefined;
  dateRange.value = undefined;
  pagination.current = 1;
  fetchRecords();
};

// 查看记录详情
const handleViewRecord = (recordId: number) => {
  router.push(`/doctor/patient-records/${recordId}`);
};

// 格式化日期
const formatDate = (date: string | null | undefined) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD');
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

// 获取可见性颜色
const getVisibilityColor = (visibility: string): string => {
  const colorMap: Record<string, string> = {
    private: 'red',
    public: 'green',
    doctor: 'blue',
    researcher: 'purple'
  };
  return colorMap[visibility] || 'default';
};

// 组件挂载时获取数据
onMounted(() => {
  fetchPatients();
  fetchRecords();
});
</script>

<style scoped>
.patient-records-content {
  width: 100%;
}
</style> 