<template>
  <div class="doctors-content">
    <h1>医生列表</h1>
    
    <a-row :gutter="16" style="margin-bottom: 24px">
      <a-col :span="24">
        <a-card>
          <a-form layout="inline" class="filter-form">
            <a-form-item label="搜索">
              <a-input-search
                v-model:value="filters.search"
                placeholder="搜索医生姓名/用户名"
                style="width: 250px"
                @search="handleSearch"
                allow-clear
              />
            </a-form-item>
            <a-form-item label="医院">
              <a-select 
                v-model:value="filters.hospital" 
                placeholder="选择医院" 
                style="width: 180px" 
                allow-clear
                :options="filterOptions.hospitals.map(h => ({ value: h, label: h }))"
              />
            </a-form-item>
            <a-form-item label="科室">
              <a-select 
                v-model:value="filters.department" 
                placeholder="选择科室" 
                style="width: 180px" 
                allow-clear
                :options="filterOptions.departments.map(d => ({ value: d, label: d }))"
              />
            </a-form-item>
            <a-form-item label="专业">
              <a-select 
                v-model:value="filters.specialty" 
                placeholder="选择专业" 
                style="width: 180px" 
                allow-clear
                :options="filterOptions.specialties.map(s => ({ value: s, label: s }))"
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="fetchDoctors">
                查询
              </a-button>
              <a-button style="margin-left: 8px" @click="resetFilters">
                重置
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16">
      <a-col :span="24">
        <a-list
          :grid="{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 4 }"
          :data-source="doctors"
          :loading="loading"
          :pagination="pagination"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-card hoverable @click="viewDoctor(item)">
                <template #cover>
                  <div class="doctor-avatar-container">
                    <a-avatar :size="120" class="doctor-avatar">
                      {{ item.full_name ? item.full_name.charAt(0).toUpperCase() : '医' }}
                    </a-avatar>
                  </div>
                </template>
                <a-card-meta :title="item.full_name">
                  <template #description>
                    <div>
                      <div v-if="item.info?.hospital">医院: {{ item.info.hospital }}</div>
                      <div v-if="item.info?.department">科室: {{ item.info.department }}</div>
                      <div v-if="item.info?.specialty">专业: {{ item.info.specialty }}</div>
                      <div v-if="item.info?.years_of_experience">
                        经验: {{ item.info.years_of_experience }} 年
                      </div>
                      <div style="margin-top: 8px">
                        <a-tag 
                          v-if="item.interaction?.has_interaction" 
                          color="blue"
                        >
                          曾就诊医生
                        </a-tag>
                        <a-tag 
                          v-if="item.interaction?.has_prescription" 
                          color="green"
                          style="margin-left: 4px"
                        >
                          最近问诊
                        </a-tag>
                      </div>
                    </div>
                  </template>
                </a-card-meta>
              </a-card>
            </a-list-item>
          </template>
        </a-list>
      </a-col>
    </a-row>
    
    <!-- 医生详情抽屉 -->
    <a-drawer
      v-model:visible="drawerVisible"
      title="医生详情"
      placement="right"
      width="600"
    >
      <a-spin :spinning="drawerLoading">
        <div v-if="currentDoctor" class="doctor-detail">
          <div class="doctor-header">
            <a-avatar :size="100" class="doctor-detail-avatar">
              {{ currentDoctor.full_name ? currentDoctor.full_name.charAt(0).toUpperCase() : '医' }}
            </a-avatar>
            <div class="doctor-info">
              <h2>{{ currentDoctor.full_name }}</h2>
              <div>
                <a-tag 
                  v-if="currentDoctor.interaction?.has_interaction" 
                  color="blue"
                >
                  曾就诊医生
                </a-tag>
                <a-tag 
                  v-if="currentDoctor.interaction?.has_prescription" 
                  color="green"
                  style="margin-left: 4px"
                >
                  最近问诊
                </a-tag>
              </div>
            </div>
          </div>
          
          <a-divider />
          
          <a-descriptions bordered>
            <a-descriptions-item label="用户名" :span="3">
              {{ currentDoctor.username }}
            </a-descriptions-item>
            <a-descriptions-item v-if="currentDoctor.info?.hospital" label="医院" :span="3">
              {{ currentDoctor.info.hospital }}
            </a-descriptions-item>
            <a-descriptions-item v-if="currentDoctor.info?.department" label="科室" :span="3">
              {{ currentDoctor.info.department }}
            </a-descriptions-item>
            <a-descriptions-item v-if="currentDoctor.info?.specialty" label="专业" :span="3">
              {{ currentDoctor.info.specialty }}
            </a-descriptions-item>
            <a-descriptions-item v-if="currentDoctor.info?.years_of_experience" label="从业年限" :span="3">
              {{ currentDoctor.info.years_of_experience }} 年
            </a-descriptions-item>
          </a-descriptions>
          
          <div style="margin-top: 16px; text-align: center;">
            <a-button type="primary" @click="requestPrescription" size="large">
              <template #icon><medicine-box-outlined /></template>
              申请开处方
            </a-button>
          </div>
          
          <a-divider orientation="left">个人简介</a-divider>
          <p>{{ currentDoctor.info?.bio || '暂无简介' }}</p>
          
          <a-divider orientation="left">处方历史</a-divider>
          <a-spin :spinning="prescriptionsLoading">
            <div v-if="prescriptions.length > 0">
              <a-list :data-source="prescriptions" size="small">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #title>{{ item.diagnosis }}</template>
                      <template #description>
                        <div>状态: <a-tag :color="getStatusColor(item.status)">{{ getStatusText(item.status) }}</a-tag></div>
                        <div>创建时间: {{ dayjs(item.created_at).format('YYYY-MM-DD') }}</div>
                      </template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>
              <div style="text-align: right; margin-top: 16px;">
                <a-pagination 
                  v-model:current="prescriptionPagination.current" 
                  :total="prescriptionPagination.total"
                  :pageSize="prescriptionPagination.pageSize"
                  size="small"
                  @change="fetchPrescriptions"
                />
              </div>
            </div>
            <a-empty v-else description="暂无处方历史" />
          </a-spin>
        </div>
      </a-spin>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getDoctors, getPrescriptionsByDoctor } from '@/api/patient';
import type { Doctor, PrescriptionInfo } from '@/types/patient';
import { PrescriptionStatus } from '@/types/patient';
import { useRouter } from 'vue-router';
import { MedicineBoxOutlined } from '@ant-design/icons-vue';

// 状态变量
const router = useRouter();
const loading = ref(false);
const drawerLoading = ref(false);
const prescriptionsLoading = ref(false);
const doctors = ref<Doctor[]>([]);
const drawerVisible = ref(false);
const currentDoctor = ref<Doctor | null>(null);
const prescriptions = ref<PrescriptionInfo[]>([]);

// 筛选选项
const filterOptions = reactive({
  hospitals: [] as string[],
  departments: [] as string[],
  specialties: [] as string[]
});

// 筛选条件
const filters = reactive({
  search: '',
  hospital: '',
  department: '',
  specialty: '',
  sort_by: 'name' as 'name' | 'experience' | 'created_at',
  sort_order: 'asc' as 'asc' | 'desc'
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 8,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  onChange: (page: number, pageSize?: number) => {
    pagination.current = page;
    if (pageSize) pagination.pageSize = pageSize;
    fetchDoctors();
  }
});

// 处方分页配置
const prescriptionPagination = reactive({
  current: 1,
  pageSize: 5,
  total: 0
});

// 处理搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchDoctors();
};

// 重置筛选条件
const resetFilters = () => {
  filters.search = '';
  filters.hospital = '';
  filters.department = '';
  filters.specialty = '';
  filters.sort_by = 'name';
  filters.sort_order = 'asc';
  pagination.current = 1;
  fetchDoctors();
};

// 查看医生详情
const viewDoctor = (doctor: Doctor) => {
  currentDoctor.value = doctor;
  drawerVisible.value = true;
  prescriptionPagination.current = 1;
  fetchPrescriptions();
};

// 获取医生列表
const fetchDoctors = async () => {
  try {
    loading.value = true;
    
    const response = await getDoctors({
      page: pagination.current,
      per_page: pagination.pageSize,
      search: filters.search || undefined,
      hospital: filters.hospital || undefined,
      department: filters.department || undefined,
      specialty: filters.specialty || undefined,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
      include_prescription_history: true // 请求包含处方历史信息
    });
    
    if (response.success && response.data) {
      doctors.value = response.data.doctors;
      
      // 确保每个医生对象都有interaction属性
      doctors.value.forEach(doctor => {
        if (!doctor.interaction) {
          doctor.interaction = {
            record_count: 0,
            has_interaction: false,
            has_prescription: false
          };
        }
      });
      
      pagination.total = response.data.pagination.total;
      
      // 更新筛选选项
      if (response.data.filters) {
        filterOptions.hospitals = Object.keys(response.data.filters.hospitals || {});
        filterOptions.departments = Object.keys(response.data.filters.departments || {});
        filterOptions.specialties = Object.keys(response.data.filters.specialties || {});
      }
      
      return doctors.value; // 返回医生数组以便链式调用
    } else {
      message.error(response.message || '获取医生列表失败');
      return [];
    }
  } catch (error: any) {
    console.error('获取医生列表失败:', error);
    message.error('获取医生列表失败: ' + (error.message || '未知错误'));
    return [];
  } finally {
    loading.value = false;
  }
};

// 获取处方历史
const fetchPrescriptions = async () => {
  if (!currentDoctor.value?.id) return Promise.resolve([]);
  
  try {
    prescriptionsLoading.value = true;
    const response = await getPrescriptionsByDoctor(
      currentDoctor.value.id,
      prescriptionPagination.current,
      prescriptionPagination.pageSize
    );
    
    if (response.success && response.data) {
      prescriptions.value = response.data.prescriptions;
      prescriptionPagination.total = response.data.pagination.total;
      
      // 检查医生是否有处方历史，并设置标签
      if (currentDoctor.value && !currentDoctor.value.interaction) {
        currentDoctor.value.interaction = {
          record_count: 0,
          has_interaction: false,
          has_prescription: false
        };
      }
      
      if (currentDoctor.value && currentDoctor.value.interaction) {
        // 如果有处方历史，设置has_prescription为true
        currentDoctor.value.interaction.has_prescription = prescriptions.value.length > 0;
      }
      
      return prescriptions.value;
    } else {
      message.error(response.message || '获取处方历史失败');
      return [];
    }
  } catch (error: any) {
    console.error('获取处方历史失败:', error);
    message.error('获取处方历史失败: ' + (error.message || '未知错误'));
    return [];
  } finally {
    prescriptionsLoading.value = false;
  }
};

// 获取状态颜色
const getStatusColor = (status: PrescriptionStatus): string => {
  const colorMap: Record<PrescriptionStatus, string> = {
    [PrescriptionStatus.PENDING]: 'orange',
    [PrescriptionStatus.ACTIVE]: 'green',
    [PrescriptionStatus.COMPLETED]: 'blue',
    [PrescriptionStatus.EXPIRED]: 'gray',
    [PrescriptionStatus.REVOKED]: 'red'
  };
  return colorMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: PrescriptionStatus): string => {
  const textMap: Record<PrescriptionStatus, string> = {
    [PrescriptionStatus.PENDING]: '待处理',
    [PrescriptionStatus.ACTIVE]: '有效',
    [PrescriptionStatus.COMPLETED]: '已完成',
    [PrescriptionStatus.EXPIRED]: '已过期',
    [PrescriptionStatus.REVOKED]: '已撤销'
  };
  return textMap[status] || status;
};

// 组件挂载时加载数据
onMounted(() => {
  fetchDoctors().then(() => {
    // 获取医生列表后，检查每个医生是否有处方历史
    checkPrescriptionHistories(doctors.value.map(d => d.id));
  });
});

// 检查多个医生的处方历史
const checkPrescriptionHistories = async (doctorIds: number[]): Promise<void> => {
  if (!doctorIds.length) return;
  
  const promises = doctorIds.map(async (id) => {
    // 找到对应的医生对象
    const doctor = doctors.value.find(d => d.id === id);
    if (!doctor) return null;
    
    // 设置当前医生，以便fetchPrescriptions可以使用
    currentDoctor.value = doctor;
    
    // 获取处方历史并返回结果
    const prescriptionList = await fetchPrescriptions();
    return {
      doctorId: id,
      hasPrescription: prescriptionList.length > 0
    };
  });
  
  // 等待所有请求完成
  const results = await Promise.all(promises);
  
  // 更新医生列表的交互状态
  results.forEach(result => {
    if (!result) return;
    
    const doctor = doctors.value.find(d => d.id === result.doctorId);
    if (doctor && doctor.interaction) {
      doctor.interaction.has_prescription = result.hasPrescription;
    }
  });
};

// 申请开处方
const requestPrescription = () => {
  if (!currentDoctor.value) return;
  
  // 将选中的医生信息存储到本地存储，以便在处方页面使用
  sessionStorage.setItem('selectedDoctor', JSON.stringify({
    id: currentDoctor.value.id,
    name: currentDoctor.value.full_name,
    hospital: currentDoctor.value.info?.hospital,
    department: currentDoctor.value.info?.department,
    specialty: currentDoctor.value.info?.specialty
  }));
  
  // 关闭抽屉
  drawerVisible.value = false;
  
  // 导航到处方页面
  router.push('/patient/prescriptions?action=request');
};
</script>

<style scoped>
.doctors-content {
  width: 100%;
}

.doctors-content h1 {
  margin-bottom: 24px;
}

.filter-form {
  margin-bottom: 16px;
}

.doctor-avatar-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  background-color: #f5f5f5;
}

.doctor-avatar {
  background-color: #1890ff;
  font-size: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doctor-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.doctor-detail-avatar {
  background-color: #1890ff;
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doctor-info {
  margin-left: 24px;
}

.doctor-info h2 {
  margin-bottom: 4px;
}
</style> 