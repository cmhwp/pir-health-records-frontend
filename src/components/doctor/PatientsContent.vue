<template>
  <div class="patients-content">
    <div class="page-header">
      <h1>患者管理</h1>
      <a-space>
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索患者"
          style="width: 250px"
          @search="handleSearch"
        />
      </a-space>
    </div>
    
    <a-card>
      <a-table
        :columns="columns"
        :data-source="patients"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        rowKey="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="viewPatientDetail(record.id)">{{ record.name }}</a>
          </template>
          
          <template v-if="column.key === 'gender'">
            {{ record.info?.gender === 'male' ? '男' : record.info?.gender === 'female' ? '女' : '未知' }}
          </template>
          
          <template v-if="column.key === 'action'">
            <a-space size="small">
              <a @click="viewPatientDetail(record.id)">查看</a>
              <a-divider type="vertical" />
              <template v-if="record.record_count && record.record_count > 0">
                <a @click="viewPatientRecords(record.id)">健康记录</a>
              </template>
              <template v-else>
                <span class="disabled-link">健康记录</span>
              </template>
              <a-divider type="vertical" />
              <a @click="createPrescription(record.id)">处方</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <!-- 患者详情抽屉 -->
    <a-drawer
      title="患者详情"
      :open="patientDrawerVisible"
      @close="patientDrawerVisible = false"
      width="600"
      :footer-style="{ textAlign: 'right' }"
    >
      <a-spin :spinning="detailLoading">
        <a-descriptions v-if="selectedPatient" bordered :column="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }">
          <a-descriptions-item label="姓名">{{ selectedPatient.name }}</a-descriptions-item>
          <a-descriptions-item label="性别">{{ selectedPatient.info?.gender === 'male' ? '男' : selectedPatient.info?.gender === 'female' ? '女' : '未知' }}</a-descriptions-item>
          <a-descriptions-item label="年龄">{{ getPatientAge(selectedPatient.info?.date_of_birth) }}</a-descriptions-item>
          <a-descriptions-item label="电话">{{ selectedPatient.phone }}</a-descriptions-item>
          <a-descriptions-item label="邮箱">{{ selectedPatient.email }}</a-descriptions-item>
          <a-descriptions-item label="地址">{{ selectedPatient.info?.address }}</a-descriptions-item>
          <a-descriptions-item label="过敏史">{{ selectedPatient.info?.allergies || '无' }}</a-descriptions-item>
          <a-descriptions-item label="既往病史">{{ selectedPatient.info?.medical_history || '无' }}</a-descriptions-item>
          <a-descriptions-item label="紧急联系人">{{ selectedPatient.info?.emergency_contact || '无' }}</a-descriptions-item>
          <a-descriptions-item label="紧急联系电话">{{ selectedPatient.info?.emergency_phone || '无' }}</a-descriptions-item>
        </a-descriptions>
      </a-spin>
      
      <template #footer>
        <a-space>
          <a-button @click="patientDrawerVisible = false">关闭</a-button>
          <a-button 
            type="primary" 
            @click="selectedPatient && viewPatientRecords(selectedPatient.id)"
            :disabled="!selectedPatient || !selectedPatient.record_count || selectedPatient.record_count === 0"
          >
            查看健康记录
          </a-button>
        </a-space>
      </template>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';

import { getDoctorPatients, getPatientDetails } from '@/api/doctor';
import type { Patient, PatientInfo, DoctorPatientsParams, PatientDetailsResponse } from '@/types/doctor';

const router = useRouter();
const loading = ref(false);
const searchKeyword = ref('');
const patients = ref<Patient[]>([]);
const patientDrawerVisible = ref(false);
const selectedPatient = ref<Patient | null>(null);
const detailLoading = ref(false);

// 表格列定义
const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    sorter: true,
  },
  {
    title: '性别',
    dataIndex: ['info', 'gender'],
    key: 'gender',
    filters: [
      { text: '男', value: 'male' },
      { text: '女', value: 'female' },
    ],
    customRender: ({ record }: { record: Patient }) => {
      return record.info?.gender === 'male' ? '男' : record.info?.gender === 'female' ? '女' : '未知';
    }
  },
  {
    title: '联系方式',
    dataIndex: 'phone',
    key: 'phone',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: '健康记录数',
    dataIndex: 'record_count',
    key: 'record_count',
    sorter: true,
  },
  {
    title: '上次就诊',
    dataIndex: 'latest_visit',
    key: 'latest_visit',
    sorter: true,
    customRender: ({ text }: { text: string | null }) => {
      return text ? dayjs(text).format('YYYY-MM-DD') : '无';
    }
  },
  {
    title: '操作',
    key: 'action',
  },
];

// 计算患者年龄
const getPatientAge = (dateOfBirth: string | undefined) => {
  if (!dateOfBirth) return '未知';
  return dayjs().diff(dayjs(dateOfBirth), 'year');
};

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 获取患者列表
const fetchPatients = async () => {
  loading.value = true;
  try {
    const params: DoctorPatientsParams = {
      page: pagination.current,
      per_page: pagination.pageSize,
      search: searchKeyword.value || undefined
    };

    const response = await getDoctorPatients(params);
    if (response.success && response.data) {
      patients.value = response.data.patients;
      pagination.total = response.data.pagination.total;
      pagination.current = response.data.pagination.page;
    } else {
      message.error(response.message || '获取患者列表失败');
    }
  } catch (error: any) {
    console.error('获取患者列表失败:', error);
    message.error('获取患者列表失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 处理表格变化（排序、筛选、分页）
const handleTableChange = (pag: any, filters: any, sorter: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  
  // 处理排序
  const params: DoctorPatientsParams = {};
  if (sorter.field && sorter.order) {
    params.sort_by = sorter.field === 'name' ? 'name' : 'created_at';
    params.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
  }
  
  // 处理筛选
  if (filters.gender && filters.gender.length > 0) {
    // 这里的性别筛选需要后端支持，如果不支持则在前端过滤
    // 实际接口中可能需要特殊处理
  }
  
  fetchPatients();
};

// 处理搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchPatients();
};

// 查看患者详情
const viewPatientDetail = async (patientId: number) => {
  detailLoading.value = true;
  patientDrawerVisible.value = true;
  
  try {
    const response = await getPatientDetails(patientId);
    if (response.success && response.data) {
      // 假设 PatientDetailsResponse 中包含了类型为 Patient 的数据
      selectedPatient.value = response.data as unknown as Patient;
    } else {
      message.error(response.message || '获取患者详情失败');
    }
  } catch (error: any) {
    console.error('获取患者详情失败:', error);
    message.error('获取患者详情失败: ' + (error.message || '未知错误'));
  } finally {
    detailLoading.value = false;
  }
};

// 查看患者健康记录
const viewPatientRecords = (patientId: number) => {
  if (!patientId) return;
  router.push(`/doctor/records?patient_id=${patientId}`);
};
// 创建处方
const createPrescription = (patientId: number) => {
  router.push(`/doctor/prescriptions?action=create&patient_id=${patientId}`);
};

// 组件挂载时加载数据
onMounted(() => {
  fetchPatients();
});
</script>

<style scoped>
.patients-content {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin-bottom: 0;
}

.disabled-link {
  color: #d9d9d9;
  cursor: not-allowed;
}
</style> 