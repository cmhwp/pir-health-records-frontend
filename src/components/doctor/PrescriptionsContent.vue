<template>
  <div class="prescriptions-content">
    <div class="page-header">
      <h1>处方管理</h1>
      <a-space>
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="搜索患者或处方"
          style="width: 250px"
          @search="handleSearch"
        />
        <a-button type="primary" @click="showCreateModal">
          <template #icon><plus-outlined /></template>
          新增处方
        </a-button>
      </a-space>
    </div>
    
    <a-card>
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <a-tab-pane key="all" tab="全部处方">
          <a-table
            :columns="columns"
            :data-source="prescriptions"
            :loading="loading"
            :pagination="pagination"
            @change="handleTableChange"
            rowKey="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'patientName'">
                <a @click="viewPatient(record.patient_id)">{{ record.patient_name }}</a>
              </template>
              
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'action'">
                <a-space size="small">
                  <a @click="viewPrescription(record)">查看</a>
                  <a-divider type="vertical" />
                  <a v-if="record.status === 'ACTIVE'" @click="completePrescription(record)">完成</a>
                  <a v-if="record.status === 'ACTIVE'" @click="revokePrescription(record)">撤销</a>
                  <a-divider type="vertical" />
                  <a @click="printPrescription(record)">打印</a>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="PENDING" tab="待处理申请">
          <a-table
            :columns="pendingColumns"
            :data-source="prescriptions"
            :loading="loading"
            :pagination="pagination"
            @change="handleTableChange"
            rowKey="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'patientName'">
                <a @click="viewPatient(record.patient_id)">{{ record.patient_name }}</a>
              </template>
              
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'action'">
                <a-space size="small">
                  <a @click="viewPendingPrescription(record)">查看</a>
                  <a-divider type="vertical" />
                  <a-button type="primary" size="small" @click="approvePrescription(record)">批准</a-button>
                  <a-button danger size="small" @click="rejectPrescription(record)">拒绝</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="ACTIVE" tab="生效中">
          <a-table
            :columns="columns"
            :data-source="prescriptions"
            :loading="loading"
            :pagination="pagination"
            @change="handleTableChange"
            rowKey="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'patientName'">
                <a @click="viewPatient(record.patient_id)">{{ record.patient_name }}</a>
              </template>
              
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'action'">
                <a-space size="small">
                  <a @click="viewPrescription(record)">查看</a>
                  <a-divider type="vertical" />
                  <a @click="completePrescription(record)">完成</a>
                  <a @click="revokePrescription(record)">撤销</a>
                  <a-divider type="vertical" />
                  <a @click="printPrescription(record)">打印</a>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="COMPLETED" tab="已完成">
          <a-table
            :columns="columns"
            :data-source="prescriptions"
            :loading="loading"
            :pagination="pagination"
            @change="handleTableChange"
            rowKey="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'patientName'">
                <a @click="viewPatient(record.patient_id)">{{ record.patient_name }}</a>
              </template>
              
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'action'">
                <a-space size="small">
                  <a @click="viewPrescription(record)">查看</a>
                  <a-divider type="vertical" />
                  <a @click="printPrescription(record)">打印</a>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="EXPIRED" tab="已过期">
          <a-table
            :columns="columns"
            :data-source="prescriptions"
            :loading="loading"
            :pagination="pagination"
            @change="handleTableChange"
            rowKey="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'patientName'">
                <a @click="viewPatient(record.patient_id)">{{ record.patient_name }}</a>
              </template>
              
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'action'">
                <a-space size="small">
                  <a @click="viewPrescription(record)">查看</a>
                  <a-divider type="vertical" />
                  <a @click="printPrescription(record)">打印</a>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
    
    <!-- 查看处方详情抽屉 -->
    <a-drawer
      title="处方详情"
      :open="prescriptionDrawerVisible"
      @close="prescriptionDrawerVisible = false"
      width="600"
      :footer-style="{ textAlign: 'right' }"
    >
      <a-spin :spinning="detailLoading">
        <a-descriptions v-if="selectedPrescription" bordered :column="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }">
          <a-descriptions-item label="患者姓名">{{ selectedPrescription.patient_name }}</a-descriptions-item>
          <a-descriptions-item label="诊断结果">{{ selectedPrescription.diagnosis }}</a-descriptions-item>
          <a-descriptions-item label="症状描述" v-if="selectedPrescription.symptoms">{{ selectedPrescription.symptoms }}</a-descriptions-item>
          <a-descriptions-item label="处方状态">
            <a-tag :color="getStatusColor(selectedPrescription.status)">
              {{ getStatusText(selectedPrescription.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ dayjs(selectedPrescription.created_at).format('YYYY-MM-DD HH:mm') }}
          </a-descriptions-item>
          <a-descriptions-item label="有效期至" v-if="selectedPrescription.valid_until">
            {{ dayjs(selectedPrescription.valid_until).format('YYYY-MM-DD') }}
          </a-descriptions-item>
          <a-descriptions-item label="医嘱" v-if="selectedPrescription.instructions">
            {{ selectedPrescription.instructions }}
          </a-descriptions-item>
        </a-descriptions>
        
        <a-divider>处方药品</a-divider>
        
        <a-table
          v-if="selectedPrescription?.items?.length"
          :columns="medicationColumns"
          :data-source="selectedPrescription.items"
          :pagination="false"
          size="small"
          rowKey="id"
        ></a-table>
        <a-empty v-else description="暂无药品信息" />
      </a-spin>
      
      <template #footer>
        <a-space>
          <a-button @click="prescriptionDrawerVisible = false">关闭</a-button>
          <a-button v-if="selectedPrescription?.status === 'ACTIVE'" type="primary" 
                    @click="selectedPrescription && completePrescription(selectedPrescription)">完成处方</a-button>
          <a-button v-if="selectedPrescription?.status === 'ACTIVE'" danger
                    @click="selectedPrescription && revokePrescription(selectedPrescription)">撤销处方</a-button>
          <a-button type="primary" @click="selectedPrescription && printPrescription(selectedPrescription)">打印处方</a-button>
        </a-space>
      </template>
    </a-drawer>
    
    <!-- 创建处方表单 -->
    <a-modal
      v-model:visible="createModalVisible"
      :title="isEdit ? '编辑处方' : '新增处方'"
      @ok="handleSavePrescription"
      :confirmLoading="submitting"
      width="800px"
    >
      <a-form :model="form" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="患者" name="patient_id" :rules="[{ required: true, message: '请选择患者' }]">
          <a-select
            v-model:value="form.patient_id"
            placeholder="请选择患者"
            :loading="patientsLoading"
            :options="patientOptions"
            :disabled="isEdit"
          ></a-select>
        </a-form-item>
        <a-form-item label="诊断结果" name="diagnosis" :rules="[{ required: true, message: '请输入诊断结果' }]">
          <a-textarea v-model:value="form.diagnosis" :rows="2" placeholder="诊断结果" />
        </a-form-item>
        
        <a-form-item label="医嘱" name="instructions">
          <a-textarea v-model:value="form.instructions" :rows="2" placeholder="医嘱" />
        </a-form-item>
        
        <a-form-item label="有效天数" name="valid_days">
          <a-input-number v-model:value="form.valid_days" :min="1" :max="180" style="width: 100%" />
        </a-form-item>
        
        <a-divider>药品信息</a-divider>
        
        <div v-for="(item, index) in form.items" :key="index" class="medication-item">
          <div class="medication-item-header">
            <span class="medication-item-title">药品 {{index + 1}}</span>
            <a-button 
              type="text" 
              danger 
              @click="removeMedication(index)"
            >
              <template #icon><delete-outlined /></template>
            </a-button>
          </div>
          <a-row :gutter="20" align="middle">
            <a-col :span="10">
              <a-form-item 
                label="名称"
                :rules="[{ required: true, message: '请输入药品名称' }]"
                style="margin-bottom: 8px;"
              >
                <a-input v-model:value="item.medicine_name" placeholder="药品名称" />
              </a-form-item>
            </a-col>
            <a-col :span="4">
              <a-form-item style="margin-bottom: 8px;">
                <a-input v-model:value="item.dosage" placeholder="用量" />
              </a-form-item>
            </a-col>
            <a-col :span="4">
              <a-form-item style="margin-bottom: 8px;" >
                <a-input v-model:value="item.frequency" placeholder="频次" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item style="margin-bottom: 8px;">
                <a-input v-model:value="item.duration" placeholder="疗程" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row>
            <a-col :span="20">
              <a-form-item style="margin-bottom: 0;" label="备注">
                <a-input v-model:value="item.notes" placeholder="药品备注说明" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>
        
        <a-button type="dashed" block @click="addMedication" class="add-medication-btn">
          <plus-outlined /> 添加药品
        </a-button>
      </a-form>
    </a-modal>
    
    <!-- 处理申请的抽屉 -->
    <a-drawer
      title="处理处方申请"
      :open="pendingDrawerVisible"
      @close="pendingDrawerVisible = false"
      width="600"
      :footer-style="{ textAlign: 'right' }"
    >
      <a-spin :spinning="processingLoading">
        <a-descriptions v-if="selectedPendingPrescription" bordered :column="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }">
          <a-descriptions-item label="患者姓名">{{ selectedPendingPrescription.patient_name }}</a-descriptions-item>
          <a-descriptions-item label="症状描述" v-if="selectedPendingPrescription.symptoms">{{ selectedPendingPrescription.symptoms }}</a-descriptions-item>
          <a-descriptions-item label="初始诊断" v-else>{{ selectedPendingPrescription.diagnosis }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ dayjs(selectedPendingPrescription.created_at).format('YYYY-MM-DD HH:mm') }}
          </a-descriptions-item>
          <a-descriptions-item label="患者信息" v-if="selectedPendingPrescription.patient_info">
            <div>性别: {{ selectedPendingPrescription.patient_info.gender || '未知' }}</div>
            <div v-if="selectedPendingPrescription.patient_info.date_of_birth">
              年龄: {{ calculateAge(selectedPendingPrescription.patient_info.date_of_birth) }}岁
            </div>
            <div v-if="selectedPendingPrescription.patient_info.allergies">
              过敏: {{ selectedPendingPrescription.patient_info.allergies }}
            </div>
          </a-descriptions-item>
        </a-descriptions>
        
        <a-divider>申请药品</a-divider>
        
        <a-table
          v-if="selectedPendingPrescription?.items?.length"
          :columns="medicationColumns"
          :data-source="selectedPendingPrescription.items"
          :pagination="false"
          size="small"
          rowKey="id"
        ></a-table>
        <a-empty v-else description="暂无药品信息" />
        
        <a-divider>处理结果</a-divider>
        
        <a-form :model="processForm" layout="vertical">
          <a-form-item label="处理决定" name="action" :rules="[{ required: true, message: '请选择处理决定' }]">
            <a-radio-group v-model:value="processForm.action">
              <a-radio value="approve">批准</a-radio>
              <a-radio value="reject">拒绝</a-radio>
            </a-radio-group>
          </a-form-item>
          
          <template v-if="processForm.action === 'approve'">
            <a-form-item label="诊断结果" name="diagnosis">
              <a-textarea v-model:value="processForm.diagnosis" :rows="2" placeholder="诊断结果" />
            </a-form-item>
            
            <a-form-item label="医嘱" name="instructions">
              <a-textarea v-model:value="processForm.instructions" :rows="2" placeholder="医嘱" />
            </a-form-item>
            
            <a-form-item label="有效天数" name="valid_days">
              <a-input-number v-model:value="processForm.valid_days" :min="1" :max="180" style="width: 100%" />
            </a-form-item>
            
            <a-form-item label="药品修改">
              <a-checkbox v-model:checked="processForm.replace_items">替换所有药品（如不勾选则使用患者申请的药品）</a-checkbox>
            </a-form-item>
            
            <template v-if="processForm.replace_items">
              <a-divider>修改后药品</a-divider>
              
              <div v-for="(item, index) in processForm.items!" :key="index" class="medication-item">
                <div class="medication-item-header">
                  <span class="medication-item-title">药品 {{index + 1}}</span>
                  <a-button 
                    type="text" 
                    danger 
                    @click="removeItem(index)"
                  >
                    <template #icon><delete-outlined /></template>
                  </a-button>
                </div>
                <a-row :gutter="16" align="middle">
                  <a-col :span="8">
                    <a-form-item 
                      label="药品名称" 
                      :rules="[{ required: true, message: '请输入药品名称' }]"
                      style="margin-bottom: 8px;"
                    >
                      <a-input v-model:value="item.medicine_name" placeholder="药品名称" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="5">
                    <a-form-item style="margin-bottom: 8px;" label="用量">
                      <a-input v-model:value="item.dosage" placeholder="用量" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="5">
                    <a-form-item style="margin-bottom: 8px;" label="频次">
                      <a-input v-model:value="item.frequency" placeholder="频率" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="6">
                    <a-form-item style="margin-bottom: 8px;" label="疗程">
                      <a-input v-model:value="item.duration" placeholder="疗程" />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row>
                  <a-col :span="24">
                    <a-form-item style="margin-bottom: 0;" label="备注">
                      <a-input v-model:value="item.notes" placeholder="药品备注说明" />
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
              
              <a-button block type="dashed" @click="addItem" class="add-medication-btn">
                <plus-outlined /> 添加药品
              </a-button>
            </template>
          </template>
          
          <template v-else-if="processForm.action === 'reject'">
            <a-form-item label="拒绝原因" name="reason">
              <a-textarea v-model:value="processForm.reason" :rows="3" placeholder="请输入拒绝处方申请的理由" />
            </a-form-item>
          </template>
        </a-form>
      </a-spin>
      
      <template #footer>
        <a-space>
          <a-button @click="pendingDrawerVisible = false">取消</a-button>
          <a-button type="primary" :loading="processingLoading" @click="handleProcessPrescription">
            确认处理
          </a-button>
        </a-space>
      </template>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { 
  getDoctorPrescriptions, 
  createPrescription, 
  updatePrescriptionStatus, 
  getDoctorPatients,
  getPrescriptionDetail,
  getPendingPrescriptions,
  processPrescriptionRequest
} from '@/api/doctor';
import type { 
  Prescription, 
  PrescriptionItem,
  CreatePrescriptionRequest,
  PrescriptionStatus,
  UpdatePrescriptionRequest, 
  Patient,
  ProcessPrescriptionRequest
} from '@/types/doctor';
import dayjs from 'dayjs';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const prescriptions = ref<Prescription[]>([]);
const searchKeyword = ref('');
const activeTab = ref('all');
const prescriptionDrawerVisible = ref(false);
const selectedPrescription = ref<Prescription | null>(null);
const patientsLoading = ref(false);
const patientsList = ref<Patient[]>([]);
const patientOptions = ref<{ value: number; label: string }[]>([]);
const detailLoading = ref(false);

// 创建处方相关
const createModalVisible = ref(false);
const submitting = ref(false);
const isEdit = ref(false);
const form = reactive<CreatePrescriptionRequest>({
  patient_id: 0,
  diagnosis: '',
  instructions: '',
  valid_days: 30,
  items: []
});

// 待处理处方相关
const pendingDrawerVisible = ref(false);
const selectedPendingPrescription = ref<Prescription | null>(null);
const processingLoading = ref(false);
const processForm = reactive<ProcessPrescriptionRequest>({
  action: 'approve',
  diagnosis: '',
  instructions: '',
  valid_days: 30,
  replace_items: false,
  items: []
});

// 表格列定义
const columns = [
  {
    title: '#',
    dataIndex: 'id',
    key: 'id',
    width: 60
  },
  {
    title: '患者',
    dataIndex: 'patient_name',
    key: 'patientName',
    width: 120
  },
  {
    title: '诊断',
    dataIndex: 'diagnosis',
    key: 'diagnosis',
    width: 200,
    ellipsis: true
  },
  {
    title: '药品数量',
    key: 'medicationCount',
    width: 90,
    customRender: ({ record }: { record: Prescription }) => {
      return record.items.length;
    }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'createdAt',
    width: 170,
    customRender: ({ text }: { text: string }) => {
      return dayjs(text).format('YYYY-MM-DD HH:mm');
    }
  },
  {
    title: '有效期至',
    dataIndex: 'valid_until',
    key: 'validUntil',
    width: 120,
    customRender: ({ text }: { text: string }) => {
      return text ? dayjs(text).format('YYYY-MM-DD') : '-';
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right'
  }
];

// 药品表格列定义
const medicationColumns = [
  {
    title: '药品名称',
    dataIndex: 'medicine_name',
    key: 'medicineName',
    width: 150
  },
  {
    title: '剂量',
    dataIndex: 'dosage',
    key: 'dosage',
    width: 100
  },
  {
    title: '频次',
    dataIndex: 'frequency',
    key: 'frequency',
    width: 100
  },
  {
    title: '疗程',
    dataIndex: 'duration',
    key: 'duration',
    width: 100
  },
  {
    title: '备注',
    dataIndex: 'notes',
    key: 'notes'
  }
];

// 待处理处方表格列
const pendingColumns = [
  {
    title: '#',
    dataIndex: 'id',
    key: 'id',
    width: 60
  },
  {
    title: '患者',
    dataIndex: 'patient_name',
    key: 'patientName',
    width: 120
  },
  {
    title: '症状描述',
    dataIndex: 'symptoms',
    key: 'symptoms',
    width: 200,
    ellipsis: true,
    customRender: ({ record }: { record: Prescription }) => {
      return record.symptoms || record.diagnosis;
    }
  },
  {
    title: '药品数量',
    key: 'medicationCount',
    width: 90,
    customRender: ({ record }: { record: Prescription }) => {
      return record.items.length;
    }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '申请时间',
    dataIndex: 'created_at',
    key: 'createdAt',
    width: 170,
    customRender: ({ text }: { text: string }) => {
      return dayjs(text).format('YYYY-MM-DD HH:mm');
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right'
  }
];

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`
});

// 获取状态颜色
const getStatusColor = (status: PrescriptionStatus) => {
  const colorMap: Record<PrescriptionStatus, string> = {
    'ACTIVE': 'green',
    'COMPLETED': 'blue',
    'EXPIRED': 'orange',
    'REVOKED': 'red'
  };
  return colorMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: PrescriptionStatus) => {
  const textMap: Record<PrescriptionStatus, string> = {
    'ACTIVE': '生效中',
    'COMPLETED': '已完成',
    'EXPIRED': '已过期',
    'REVOKED': '已撤销'
  };
  return textMap[status] || status;
};

// 获取处方列表
const fetchPrescriptions = async (params = {}) => {
  loading.value = true;
  try {
    // 创建基本查询参数
    const queryParams: Record<string, any> = {
      page: pagination.current,
      per_page: pagination.pageSize,
      ...params
    };
    
    // 如果有选择特定状态的标签
    if (activeTab.value !== 'all') {
      queryParams.status = activeTab.value.toUpperCase() as PrescriptionStatus;
    }
    
    const response = await getDoctorPrescriptions(queryParams);
    if (response.success && response.data) {
      prescriptions.value = response.data.prescriptions;
      pagination.total = response.data.pagination.total;
      pagination.current = response.data.pagination.page;
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

// 获取患者列表
const fetchPatients = async () => {
  patientsLoading.value = true;
  try {
    const response = await getDoctorPatients();
    if (response.success && response.data) {
      patientsList.value = response.data.patients;
      patientOptions.value = response.data.patients.map(patient => ({
        value: patient.id,
        label: patient.name
      }));
    } else {
      message.error(response.message || '获取患者列表失败');
    }
  } catch (error: any) {
    console.error('获取患者列表失败:', error);
    message.error('获取患者列表失败: ' + (error.message || '未知错误'));
  } finally {
    patientsLoading.value = false;
  }
};

// 查看处方详情
const viewPrescription = (record: Prescription) => {
  selectedPrescription.value = record;
  prescriptionDrawerVisible.value = true;
};

// 查看患者详情
const viewPatient = (patientId: number) => {
  router.push(`/doctor/patients/${patientId}`);
};

// 显示创建处方表单
const showCreateModal = () => {
  isEdit.value = false;
  resetForm();
  createModalVisible.value = true;
};

// 编辑处方
const editPrescription = (record: Prescription) => {
  isEdit.value = true;
  
  form.patient_id = record.patient_id;
  form.diagnosis = record.diagnosis;
  form.instructions = record.instructions || '';
  
  // 转换药品项
  form.items = record.items.map(item => ({
    medicine_name: item.medicine_name,
    dosage: item.dosage,
    frequency: item.frequency || '',
    duration: item.duration || '',
    notes: item.notes || ''
  }));
  
  createModalVisible.value = true;
};

// 添加药品项
const addMedication = () => {
  form.items.push({
    medicine_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  });
};

// 移除药品项
const removeMedication = (index: number) => {
  form.items.splice(index, 1);
};

// 重置表单
const resetForm = () => {
  form.patient_id = 0;
  form.diagnosis = '';
  form.instructions = '';
  form.valid_days = 30;
  form.items = [
    {
      medicine_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: ''
    }
  ];
};

// 保存处方
const handleSavePrescription = async () => {
  if (!form.patient_id) {
    message.error('请选择患者');
    return;
  }
  
  if (!form.diagnosis.trim()) {
    message.error('请输入诊断结果');
    return;
  }
  
  if (form.items.length === 0 || !form.items.some(item => item.medicine_name.trim())) {
    message.error('请至少添加一种药品');
    return;
  }
  
  // 过滤掉空药品
  const validItems = form.items.filter(item => item.medicine_name.trim());
  
  if (validItems.length === 0) {
    message.error('请添加有效的药品信息');
    return;
  }
  
  form.items = validItems;
  
  submitting.value = true;
  try {
    const response = await createPrescription(form);
    if (response.success) {
      message.success('处方保存成功');
      createModalVisible.value = false;
      fetchPrescriptions();
    } else {
      message.error(response.message || '保存失败');
    }
  } catch (error: any) {
    console.error('保存处方失败:', error);
    message.error('保存处方失败: ' + (error.message || '未知错误'));
  } finally {
    submitting.value = false;
  }
};

// 修改处方状态
const updatePrescriptionState = async (id: number, status: PrescriptionStatus) => {
  try {
    const response = await updatePrescriptionStatus(id, { status });
    if (response.success) {
      message.success(`处方状态已更新为${getStatusText(status)}`);
      fetchPrescriptions();
      
      // 更新当前选中的处方
      if (selectedPrescription.value && selectedPrescription.value.id === id) {
        selectedPrescription.value.status = status;
      }
    } else {
      message.error(response.message || '更新状态失败');
    }
  } catch (error: any) {
    console.error('更新处方状态失败:', error);
    message.error('更新处方状态失败: ' + (error.message || '未知错误'));
  }
};

// 发放处方
const issuePrescription = (record: Prescription) => {
  updatePrescriptionState(record.id, 'ACTIVE');
};

// 完成处方
const completePrescription = (record: Prescription) => {
  updatePrescriptionState(record.id, 'COMPLETED');
};

// 撤销处方
const revokePrescription = (record: Prescription) => {
  updatePrescriptionState(record.id, 'REVOKED');
};

// 打印处方
const printPrescription = (record: Prescription) => {
  // 实现打印逻辑，可使用浏览器打印功能
  message.info('正在准备打印...');
  // 模拟延迟
  setTimeout(() => {
    window.print();
  }, 500);
};

// 处理表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchPrescriptions();
};

// 处理搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchPrescriptions({
    search: searchKeyword.value
  });
};

// 处理Tab切换
const handleTabChange = (key: string) => {
  activeTab.value = key;
  pagination.current = 1;
  
  if (key === 'PENDING') {
    fetchPendingPrescriptions();
  } else {
    fetchPrescriptions();
  }
};

// 获取待处理处方
const fetchPendingPrescriptions = async () => {
  loading.value = true;
  try {
    const queryParams = {
      page: pagination.current,
      per_page: pagination.pageSize
    };
    
    const response = await getPendingPrescriptions(queryParams);
    if (response.success && response.data) {
      prescriptions.value = response.data.prescriptions;
      pagination.total = response.data.pagination.total;
      pagination.current = response.data.pagination.page;
    } else {
      message.error(response.message || '获取待处理处方失败');
    }
  } catch (error: any) {
    console.error('获取待处理处方失败:', error);
    message.error('获取待处理处方失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 查看待处理处方
const viewPendingPrescription = (prescription: Prescription) => {
  selectedPendingPrescription.value = prescription;
  
  // 初始化处理表单
  processForm.action = 'approve';
  processForm.diagnosis = prescription.diagnosis;
  processForm.instructions = prescription.instructions || '';
  processForm.valid_days = 30;
  processForm.replace_items = false;
  processForm.items = [...prescription.items.map(item => ({
    id: item.id,
    medicine_name: item.medicine_name,
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration,
    notes: item.notes
  }))];
  
  pendingDrawerVisible.value = true;
};

// 快速批准处方
const approvePrescription = (prescription: Prescription) => {
  selectedPendingPrescription.value = prescription;
  processForm.action = 'approve';
  processForm.diagnosis = prescription.diagnosis;
  processForm.instructions = prescription.instructions || '';
  processForm.valid_days = 30;
  processForm.replace_items = false;
  
  Modal.confirm({
    title: '批准处方申请',
    content: '您确定要批准此处方申请吗？',
    onOk: () => handleProcessPrescription()
  });
};

// 快速拒绝处方
const rejectPrescription = (prescription: Prescription) => {
  selectedPendingPrescription.value = prescription;
  processForm.action = 'reject';
  
  Modal.confirm({
    title: '拒绝处方申请',
    content: '您确定要拒绝此处方申请吗？请提供拒绝原因。',
    onOk: () => {
      pendingDrawerVisible.value = true;
    }
  });
};

// 处理处方申请
const handleProcessPrescription = async () => {
  if (!selectedPendingPrescription.value) return;
  
  processingLoading.value = true;
  try {
    const data: ProcessPrescriptionRequest = {
      action: processForm.action
    };
    
    if (processForm.action === 'approve') {
      data.diagnosis = processForm.diagnosis;
      data.instructions = processForm.instructions;
      data.valid_days = processForm.valid_days;
      
      if (processForm.replace_items) {
        data.replace_items = true;
        data.items = processForm.items!.map(item => ({
          medicine_name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          notes: item.notes
        }));
      }
    } else if (processForm.action === 'reject') {
      data.reason = processForm.reason;
    }
    
    const response = await processPrescriptionRequest(selectedPendingPrescription.value.id, data);
    if (response.success) {
      message.success(processForm.action === 'approve' ? '已批准处方申请' : '已拒绝处方申请');
      pendingDrawerVisible.value = false;
      
      // 刷新列表
      if (activeTab.value === 'PENDING') {
        fetchPendingPrescriptions();
      } else {
        fetchPrescriptions();
      }
    } else {
      message.error(response.message || '处理处方申请失败');
    }
  } catch (error: any) {
    console.error('处理处方申请失败:', error);
    message.error('处理处方申请失败: ' + (error.message || '未知错误'));
  } finally {
    processingLoading.value = false;
  }
};

// 计算年龄
const calculateAge = (birthDate: string) => {
  return dayjs().diff(dayjs(birthDate), 'year');
};

// 添加药品项
const addItem = () => {
  processForm.items!.push({
    medicine_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  });
};

// 移除药品项
const removeItem = (index: number) => {
  processForm.items!.splice(index, 1);
};

// 组件挂载时加载数据
onMounted(() => {
  fetchPrescriptions();
  fetchPatients();
  
  // 检查URL参数
  if (route.query.action === 'create') {
    // 延迟执行，确保患者列表已加载
    setTimeout(() => {
      showCreateModal();
      
      // 如果有患者ID参数，预先选择患者
      if (route.query.patient_id) {
        const patientId = Number(route.query.patient_id);
        if (!isNaN(patientId)) {
          form.patient_id = patientId;
          
          // 如果有诊断参数，设置诊断
          if (route.query.diagnosis) {
            form.diagnosis = decodeURIComponent(route.query.diagnosis as string);
          }
        }
      }
    }, 500);
  }
  
  // 如果URL中有处方ID参数，获取处方详情
  if (route.query.id) {
    const prescriptionId = Number(route.query.id);
    if (!isNaN(prescriptionId)) {
      fetchPrescriptionDetail(prescriptionId);
    }
  }
});

// 获取处方详情
const fetchPrescriptionDetail = async (prescriptionId: number) => {
  detailLoading.value = true;
  try {
    // 先在当前列表中查找
    let prescription = prescriptions.value.find(p => p.id === prescriptionId);
    
    if (prescription) {
      viewPrescription(prescription);
    } else {
      // 如果未找到，从API获取
      const response = await getPrescriptionDetail(prescriptionId);
      if (response.success && response.data) {
        prescription = response.data;
        viewPrescription(prescription);
      } else {
        message.error(response.message || '获取处方详情失败');
      }
    }
  } catch (error: any) {
    console.error('获取处方详情失败:', error);
    message.error('获取处方详情失败: ' + (error.message || '未知错误'));
  } finally {
    detailLoading.value = false;
  }
};
</script>

<style scoped>
.prescriptions-content {
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

.medication-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f0f0f0;
}

.medication-item-title {
  font-size: 15px;
  font-weight: 500;
  color: #1890ff;
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
  border-color: #40a9ff;
  color: #40a9ff;
  transition: all 0.3s;
}

.add-medication-btn:hover {
  background-color: #f0f0f0;
  border-color: #1890ff;
  color: #1890ff;
}

/* 其他样式 */
:deep(.ant-descriptions-title) {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
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

:deep(.ant-drawer-body) {
  padding: 24px;
}

:deep(.ant-tag) {
  border-radius: 4px;
  padding: 0 8px;
  font-weight: 500;
}

:deep(.ant-card) {
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
</style> 