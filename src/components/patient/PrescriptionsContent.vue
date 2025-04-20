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
              
              <template v-if="column.key === 'items_count'">
                <span>{{ record.items ? record.items.length : 0 }}</span>
              </template>
              
              <template v-if="column.key === 'created_at'">
                <span>{{ formatDate(record.created_at) }}</span>
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
            <a-descriptions-item v-if="currentPrescription.symptoms" label="症状描述" :span="3">
              {{ currentPrescription.symptoms }}
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
            class="prescription-list"
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
        
        <!-- 新增药品信息部分 -->
        <a-divider>药品信息（选填）</a-divider>
        
        <div v-for="(item, index) in requestForm.medications" :key="index" class="medication-item">
          <a-row :gutter="16" align="middle">
            <a-col :span="6">
              <a-form-item 
                :label="`药品${index + 1}`" 
                style="margin-bottom: 0;"
              >
                <a-input v-model:value="item.name" placeholder="药品名称" />
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item style="margin-bottom: 0;" label="用量">
                <a-input v-model:value="item.dosage" placeholder="用量" />
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item style="margin-bottom: 0;" label="频次">
                <a-input v-model:value="item.frequency" placeholder="频次" />
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item style="margin-bottom: 0;" label="疗程">
                <a-input v-model:value="item.duration" placeholder="疗程" />
              </a-form-item>
            </a-col>
            <a-col :span="2" style="text-align: right">
              <a-button 
                type="text" 
                danger 
                @click="removeMedication(index)"
              >
                <template #icon><delete-outlined /></template>
              </a-button>
            </a-col>
          </a-row>
          <a-row style="margin-top: 8px;">
            <a-col :span="24">
              <a-form-item style="margin-bottom: 0;" label="备注">
                <a-input v-model:value="item.notes" placeholder="药品备注说明" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>
        
        <a-button type="dashed" block @click="addMedication" class="add-medication-btn">
          <plus-outlined /> 添加药品
        </a-button>
        
        <a-form-item label="其他备注" name="notes">
          <a-textarea
            v-model:value="requestForm.notes"
            placeholder="其他备注或说明"
            :rows="3"
          ></a-textarea>
        </a-form-item>
        
        <div style="margin-top: 16px;">
          <a-alert
            message="医生将根据您的症状描述为您开具合适的处方"
            description="请提供准确的症状描述和药品需求，以便医生能够开具合适的处方"
            type="info"
            show-icon
          />
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { useRoute } from 'vue-router';
import { getPatientPrescriptions, getDoctors, requestPrescription } from '@/api/patient';
import type { PrescriptionInfo, PrescriptionStatus, Doctor, RequestPrescriptionRequest, RequestPrescriptionMedication } from '@/types/patient';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';

const route = useRoute();

// 状态变量
const loading = ref(false);
const activeTabKey = ref('ALL');
const prescriptions = ref<PrescriptionInfo[]>([]);
const drawerVisible = ref(false);
const currentPrescription = ref<PrescriptionInfo | null>(null);
const statusCounts = ref<Record<string, number>>({
  'ALL': 0,
  'PENDING': 0,
  'ACTIVE': 0,
  'COMPLETED': 0,
  'EXPIRED': 0,
  'REVOKED': 0
});

// 筛选条件
const filters = reactive({
  status: 'ALL' as PrescriptionStatus | string,
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
    align: 'center' as const
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
    sorter: true
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
  const colorMap: Record<string, string> = {
    'ALL': 'purple',
    'PENDING': 'yellow',
    'ACTIVE': 'green',
    'COMPLETED': 'blue',
    'EXPIRED': 'orange',
    'REVOKED': 'red'
  };
  return colorMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: PrescriptionStatus | string) => {
  const textMap: Record<string, string> = {
    'ALL': '全部处方',
    'PENDING': '待确认',
    'ACTIVE': '有效',
    'COMPLETED': '已完成',
    'EXPIRED': '已过期',
    'REVOKED': '已撤销'
  };
  return textMap[status] || status;
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
    console.log(response);
    if (response.success && response.data) {
      prescriptions.value = response.data.prescriptions;
      pagination.total = response.data.pagination.total;
      
      // 更新状态计数
      statusCounts.value = response.data.status_counts;
      
      // 确保"全部"选项的计数是所有状态的总和
      statusCounts.value['ALL'] = Object.entries(response.data.status_counts)
        .filter(([key]) => key !== 'ALL')
        .reduce((sum, [_, count]) => sum + (count as number), 0);
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
  
  // 检查URL参数是否有action=request
  if (route.query.action === 'request') {
    // 延迟一点打开窗口，确保组件已完全加载
    setTimeout(() => {
      showRequestPrescriptionModal();
    }, 100);
  }
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
  requestForm.medications = [{
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  }];
  requestForm.notes = '';
};

// 添加药品项
const addMedication = () => {
  requestForm.medications!.push({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  });
};

// 移除药品项
const removeMedication = (index: number) => {
  requestForm.medications!.splice(index, 1);
};

// 显示申请处方模态框
const showRequestPrescriptionModal = async () => {
  initRequestForm();
  
  // 尝试从sessionStorage获取选中的医生信息
  const selectedDoctorData = sessionStorage.getItem('selectedDoctor');
  if (selectedDoctorData) {
    try {
      const selectedDoctor = JSON.parse(selectedDoctorData);
      
      // 自动设置医生ID
      requestForm.doctor_id = selectedDoctor.id;
      
      // 清除sessionStorage中的数据，防止下次打开时还使用相同的医生
      sessionStorage.removeItem('selectedDoctor');
    } catch (error) {
      console.error('解析选中医生数据失败:', error);
    }
  }
  
  requestModalVisible.value = true;
  
  // 加载医生列表
  await fetchDoctors();
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
  
  // 过滤掉空药品
  if (requestForm.medications && requestForm.medications.length > 0) {
    requestForm.medications = requestForm.medications.filter(item => item.name.trim());
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
  padding: 0 8px;
}

.prescriptions-content h1 {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 500;
  color: #262626;
}

.filter-form {
  margin-bottom: 16px;
}

/* 处方项样式 */
.prescription-item-label {
  color: #8c8c8c;
  display: inline-block;
  width: 80px;
  font-size: 14px;
}

/* 处方列表样式 */
.prescription-list {
  margin-bottom: 24px;
}

:deep(.prescription-list .ant-list-item) {
  padding: 12px 16px;
}

:deep(.prescription-list .ant-list-item:hover) {
  background-color: #f5f5f5;
}

/* 处方详情抽屉样式 */
:deep(.ant-descriptions-title) {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

:deep(.ant-drawer-body) {
  padding: 24px;
}

:deep(.ant-descriptions-item-label) {
  width: 100px;
  color: #595959;
  font-weight: 500;
}

:deep(.ant-divider-inner-text) {
  font-size: 15px;
  font-weight: 500;
  color: #262626;
}

/* 表单相关样式 */
:deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #262626;
}

:deep(.ant-alert) {
  margin-top: 16px;
  border-radius: 4px;
}

/* 药品项目样式 */
.medication-item {
  background-color: #fafafa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
}

.medication-item:hover {
  border-color: #d9d9d9;
}

.medication-item :deep(.ant-form-item) {
  margin-bottom: 0;
}

.medication-item :deep(.ant-form-item-label) {
  padding-bottom: 4px;
}

.medication-item :deep(.ant-form-item-label > label) {
  color: #595959;
  font-size: 13px;
  height: 28px;
}

.medication-item :deep(.ant-row) {
  flex-wrap: nowrap;
}

/* 添加药品按钮 */
.add-medication-btn {
  margin-bottom: 24px;
  height: 40px;
  font-size: 14px;
  background-color: #f9f9f9;
  transition: all 0.3s;
}

.add-medication-btn:hover {
  background-color: #f0f0f0;
}

/* 按钮样式 */
:deep(.ant-btn-dashed) {
  border-color: #40a9ff;
  color: #40a9ff;
}

:deep(.ant-btn-dashed:hover) {
  border-color: #1890ff;
  color: #1890ff;
}

/* 表格样式 */
:deep(.ant-table-thead > tr > th) {
  background-color: #f5f5f5;
  font-weight: 500;
}

:deep(.ant-table-row:hover) {
  background-color: #e6f7ff;
}

/* 卡片样式 */
:deep(.ant-card) {
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

:deep(.ant-card-body) {
  padding: 20px;
}

/* 标签样式 */
:deep(.ant-tag) {
  border-radius: 4px;
  padding: 0 8px;
  font-weight: 500;
}
</style> 