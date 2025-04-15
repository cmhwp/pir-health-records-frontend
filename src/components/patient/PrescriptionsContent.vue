<template>
  <div class="prescriptions-content">
    <h1>我的处方</h1>
    
    <a-row :gutter="16" style="margin-bottom: 24px">
      <a-col :span="24">
        <a-card>
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <div></div>
            <a-button type="primary" @click="showRequestPrescriptionModal">
              申请处方
            </a-button>
          </div>
          
          <a-tabs v-model:activeKey="activeTabKey">
            <a-tab-pane
              v-for="(count, status) in statusCounts" 
              :key="status" 
              :tab="`${getStatusText(status)} (${count})`"
            >
              <a-form layout="inline" class="filter-form">
                <a-form-item label="排序">
                  <a-select v-model:value="filters.sort_by" style="width: 120px">
                    <a-select-option value="created_at">创建时间</a-select-option>
                    <a-select-option value="valid_until">有效期</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item>
                  <a-select v-model:value="filters.sort_order" style="width: 80px">
                    <a-select-option value="asc">升序</a-select-option>
                    <a-select-option value="desc">降序</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item>
                  <a-button type="primary" @click="fetchPrescriptions">
                    查询
                  </a-button>
                  <a-button style="margin-left: 8px" @click="resetFilters">
                    重置
                  </a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>
          </a-tabs>
          
          <a-table
            :columns="columns"
            :data-source="prescriptions"
            :loading="loading"
            :pagination="pagination"
            @change="handleTableChange"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'valid_until'">
                <span 
                  :style="{ color: isExpired(record.valid_until) ? '#ff4d4f' : '' }"
                >
                  {{ formatDate(record.valid_until) }}
                  <span v-if="isExpired(record.valid_until)">(已过期)</span>
                </span>
              </template>
              
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="viewPrescription(record)">
                  查看详情
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 处方详情抽屉 -->
    <a-drawer
      v-model:visible="drawerVisible"
      title="处方详情"
      placement="right"
      width="600"
    >
      <a-spin :spinning="loading">
        <div v-if="currentPrescription">
          <a-descriptions title="基本信息" bordered>
            <a-descriptions-item label="医生" :span="3">
              {{ currentPrescription.doctor_name }}
            </a-descriptions-item>
            <a-descriptions-item label="诊断" :span="3">
              {{ currentPrescription.diagnosis }}
            </a-descriptions-item>
            <a-descriptions-item label="状态" :span="1">
              <a-tag :color="getStatusColor(currentPrescription.status)">
                {{ getStatusText(currentPrescription.status) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="创建时间" :span="1">
              {{ formatDate(currentPrescription.created_at) }}
            </a-descriptions-item>
            <a-descriptions-item label="有效期至" :span="1">
              <span :style="{ color: isExpired(currentPrescription.valid_until) ? '#ff4d4f' : '' }">
                {{ formatDate(currentPrescription.valid_until) }}
                <span v-if="isExpired(currentPrescription.valid_until)">(已过期)</span>
              </span>
            </a-descriptions-item>
          </a-descriptions>
          
          <a-divider orientation="left">药品清单</a-divider>
          
          <a-list
            bordered
            :data-source="currentPrescription.items"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-row style="width: 100%">
                  <a-col :span="24">
                    <strong>{{ item.medicine_name }}</strong>
                  </a-col>
                  <a-col :span="24" style="margin-top: 8px">
                    <div>
                      <span class="prescription-item-label">剂量:</span> {{ item.dosage }}
                    </div>
                    <div>
                      <span class="prescription-item-label">频率:</span> {{ item.frequency }}
                    </div>
                    <div>
                      <span class="prescription-item-label">服用时间:</span> {{ item.duration }}
                    </div>
                    <div v-if="item.notes">
                      <span class="prescription-item-label">备注:</span> {{ item.notes }}
                    </div>
                  </a-col>
                </a-row>
              </a-list-item>
            </template>
          </a-list>
          
          <a-divider orientation="left">用药说明</a-divider>
          <div style="padding: 8px 0">
            {{ currentPrescription.instructions || '无特殊说明' }}
          </div>
          
          <a-divider orientation="left">医生信息</a-divider>
          <a-descriptions v-if="currentPrescription.doctor_info" bordered size="small">
            <a-descriptions-item label="医院" :span="3">
              {{ currentPrescription.doctor_info.hospital || '未提供' }}
            </a-descriptions-item>
            <a-descriptions-item label="科室" :span="3">
              {{ currentPrescription.doctor_info.department || '未提供' }}
            </a-descriptions-item>
            <a-descriptions-item label="专业" :span="3">
              {{ currentPrescription.doctor_info.specialty || '未提供' }}
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </a-spin>
    </a-drawer>
    
    <!-- 申请处方的模态框 -->
    <a-modal
      v-model:visible="requestModalVisible"
      title="申请处方"
      width="700px"
      :confirm-loading="submitting"
      @ok="handleRequestPrescription"
    >
      <a-form
        :model="requestForm"
        layout="vertical"
      >
        <a-form-item 
          label="选择医生" 
          name="doctor_id" 
          :rules="[{ required: true, message: '请选择医生' }]"
        >
          <a-select
            v-model:value="requestForm.doctor_id"
            placeholder="选择医生"
            :loading="loadingDoctors"
            :options="doctorOptions"
            show-search
            :filter-option="filterDoctorOption"
          ></a-select>
        </a-form-item>
        
        <a-form-item 
          label="病症描述" 
          name="symptoms" 
          :rules="[{ required: true, message: '请描述您的症状' }]"
        >
          <a-textarea
            v-model:value="requestForm.symptoms"
            placeholder="请详细描述您的症状、病情或需求"
            :rows="4"
          ></a-textarea>
        </a-form-item>
        
        <a-form-item label="需要的药品">
          <a-button type="dashed" block @click="addMedication" style="margin-bottom: 8px">
            <plus-outlined /> 添加药品
          </a-button>
          
          <div 
            v-for="(med, index) in requestForm.medications" 
            :key="index"
            style="margin-bottom: 16px; padding: 16px; border: 1px dashed #d9d9d9; border-radius: 4px"
          >
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px">
              <div style="font-weight: bold">药品 #{{ index + 1 }}</div>
              <a-button 
                danger 
                type="link" 
                size="small" 
                @click="removeMedication(index)"
              >
                删除
              </a-button>
            </div>
            
            <a-row :gutter="16">
              <a-col :span="24">
                <a-form-item 
                  :name="['medications', index, 'name']" 
                  label="药品名称"
                  :rules="[{ required: true, message: '请输入药品名称' }]"
                >
                  <a-input 
                    v-model:value="med.name" 
                    placeholder="药品名称"
                  ></a-input>
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item :name="['medications', index, 'dosage']" label="剂量">
                  <a-input 
                    v-model:value="med.dosage" 
                    placeholder="例如:5mg、10ml等"
                  ></a-input>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :name="['medications', index, 'frequency']" label="服用频率">
                  <a-input 
                    v-model:value="med.frequency" 
                    placeholder="例如:每日三次、饭后等"
                  ></a-input>
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item :name="['medications', index, 'duration']" label="用药时长">
                  <a-input 
                    v-model:value="med.duration" 
                    placeholder="例如:7天、2周等"
                  ></a-input>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item :name="['medications', index, 'notes']" label="备注">
                  <a-input 
                    v-model:value="med.notes" 
                    placeholder="药品相关备注"
                  ></a-input>
                </a-form-item>
              </a-col>
            </a-row>
          </div>
          
          <div v-if="requestForm.medications.length === 0" style="text-align: center; color: #999; padding: 16px 0">
            请添加您需要的药品
          </div>
        </a-form-item>
        
        <a-form-item label="其他备注" name="notes">
          <a-textarea
            v-model:value="requestForm.notes"
            placeholder="其他备注或说明"
            :rows="2"
          ></a-textarea>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { getPatientPrescriptions, getDoctors, requestPrescription } from '@/api/patient';
import type { PrescriptionInfo, PrescriptionStatus, Doctor, RequestPrescriptionRequest, RequestPrescriptionMedication } from '@/types/patient';
import { PlusOutlined } from '@ant-design/icons-vue';

// 状态变量
const loading = ref(false);
const activeTabKey = ref('ACTIVE');
const prescriptions = ref<PrescriptionInfo[]>([]);
const drawerVisible = ref(false);
const currentPrescription = ref<PrescriptionInfo | null>(null);
const statusCounts = ref<Record<string, number>>({
  'PENDING': 0,
  'ACTIVE': 0,
  'COMPLETED': 0,
  'EXPIRED': 0,
  'REVOKED': 0
});

// 筛选条件
const filters = reactive({
  status: 'ACTIVE' as PrescriptionStatus | string,
  sort_by: 'created_at',
  sort_order: 'desc' as 'asc' | 'desc'
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
});

// 表格列定义
const columns = [
  {
    title: '医生',
    dataIndex: 'doctor_name',
    key: 'doctor_name',
  },
  {
    title: '诊断',
    dataIndex: 'diagnosis',
    key: 'diagnosis',
    ellipsis: true
  },
  {
    title: '药品数量',
    key: 'items_count',
    align: 'center' as const,
    render: (_: any, record: PrescriptionInfo) => record.items.length
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    sorter: true,
    render: (text: string) => formatDate(text)
  },
  {
    title: '有效期至',
    dataIndex: 'valid_until',
    key: 'valid_until',
    sorter: true,
  },
  {
    title: '操作',
    key: 'action'
  }
];

// 格式化日期
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD');
};

// 检查是否过期
const isExpired = (dateStr: string) => {
  return dayjs(dateStr).isBefore(dayjs(), 'day');
};

// 获取状态颜色
const getStatusColor = (status: PrescriptionStatus | string) => {
  switch (status) {
    case 'PENDING':
      return 'yellow';
    case 'ACTIVE':
      return 'green';
    case 'COMPLETED':
      return 'blue';
    case 'EXPIRED':
      return 'orange';
    case 'REVOKED':
      return 'red';
    default:
      return 'default';
  }
};

// 获取状态文本
const getStatusText = (status: PrescriptionStatus | string) => {
  switch (status) { 
    case 'PENDING':
      return '待确认';
    case 'ACTIVE':
      return '有效';
    case 'COMPLETED':
      return '已完成';
    case 'EXPIRED':
      return '已过期';
    case 'REVOKED':
      return '已撤销';
    default:
      return '未知状态';
  }
};

// 查看处方详情
const viewPrescription = (prescription: PrescriptionInfo) => {
  currentPrescription.value = prescription;
  drawerVisible.value = true;
};

// 处理表格变化
const handleTableChange = (pag: any, filters: any, sorter: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  
  if (sorter.field) {
    filters.sort_by = sorter.field;
    filters.sort_order = sorter.order === 'descend' ? 'desc' : 'asc';
  }
  
  fetchPrescriptions();
};

// 重置筛选条件
const resetFilters = () => {
  filters.sort_by = 'created_at';
  filters.sort_order = 'desc';
  pagination.current = 1;
  fetchPrescriptions();
};

// 获取处方列表
const fetchPrescriptions = async () => {
  try {
    loading.value = true;
    
    const response = await getPatientPrescriptions({
      page: pagination.current,
      per_page: pagination.pageSize,
      status: filters.status === 'ALL' ? undefined : filters.status,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order
    });
    
    if (response.success && response.data) {
      prescriptions.value = response.data.prescriptions;
      pagination.total = response.data.pagination.total;
      
      // 更新状态计数
      statusCounts.value = response.data.status_counts;
      
      // 确保"全部"选项的计数是所有状态的总和
      if (!statusCounts.value['ALL']) {
        statusCounts.value['ALL'] = Object.values(response.data.status_counts).reduce((sum, count) => sum + count, 0);
      }
    } else {
      message.error(response.message || '获取处方列表失败');
    }
  } catch (error: any) {
    console.error('获取处方列表失败:', error);
    message.error('获取处方列表失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 监听标签页变化
watch(activeTabKey, (newValue) => {
  filters.status = newValue;
  pagination.current = 1;
  fetchPrescriptions();
});

// 组件挂载时加载数据
onMounted(() => {
  fetchPrescriptions();
});

// 申请处方相关状态
const requestModalVisible = ref(false);
const submitting = ref(false);
const loadingDoctors = ref(false);
const doctors = ref<Doctor[]>([]);
const doctorOptions = ref<{value: number, label: string}[]>([]);

// 申请处方表单
const requestForm = reactive<RequestPrescriptionRequest>({
  doctor_id: 0,
  symptoms: '',
  medications: [],
  notes: ''
});

// 初始化申请表单
const initRequestForm = () => {
  requestForm.doctor_id = 0;
  requestForm.symptoms = '';
  requestForm.medications = [];
  requestForm.notes = '';
};

// 显示申请处方模态框
const showRequestPrescriptionModal = async () => {
  initRequestForm();
  requestModalVisible.value = true;
  
  // 加载医生列表
  await fetchDoctors();
};

// 添加药品
const addMedication = () => {
  requestForm.medications.push({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  });
};

// 移除药品
const removeMedication = (index: number) => {
  requestForm.medications.splice(index, 1);
};

// 获取医生列表
const fetchDoctors = async () => {
  loadingDoctors.value = true;
  try {
    const response = await getDoctors();
    if (response.success && response.data) {
      doctors.value = response.data.doctors;
      doctorOptions.value = doctors.value.map(doc => ({
        value: doc.id,
        label: `${doc.full_name} ${doc.info?.department ? `(${doc.info.department})` : ''}`
      }));
    }
  } catch (error) {
    console.error('获取医生列表失败:', error);
    message.error('获取医生列表失败');
  } finally {
    loadingDoctors.value = false;
  }
};

// 过滤医生选项
const filterDoctorOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 提交处方申请
const handleRequestPrescription = async () => {
  // 简单验证
  if (!requestForm.doctor_id) {
    message.error('请选择医生');
    return;
  }
  
  if (!requestForm.symptoms.trim()) {
    message.error('请描述您的症状');
    return;
  }
  
  if (requestForm.medications.length === 0) {
    message.error('请添加至少一种药品');
    return;
  }
  
  // 验证每个药品是否都有名称
  for (let i = 0; i < requestForm.medications.length; i++) {
    if (!requestForm.medications[i].name.trim()) {
      message.error(`请输入第 ${i+1} 个药品的名称`);
      return;
    }
  }
  
  submitting.value = true;
  try {
    const response = await requestPrescription(requestForm);
    if (response.success) {
      message.success('处方申请已提交，等待医生确认');
      requestModalVisible.value = false;
      
      // 刷新处方列表，展示新的处方申请
      fetchPrescriptions();
    } else {
      message.error(response.message || '处方申请提交失败');
    }
  } catch (error) {
    console.error('提交处方申请失败:', error);
    message.error('提交处方申请失败');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.prescriptions-content {
  width: 100%;
}

.prescriptions-content h1 {
  margin-bottom: 24px;
}

.filter-form {
  margin-bottom: 16px;
}

.prescription-item-label {
  color: #999;
  display: inline-block;
  width: 80px;
}
</style> 