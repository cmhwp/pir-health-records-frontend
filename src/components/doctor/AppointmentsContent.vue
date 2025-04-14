<template>
  <div class="appointments-content">
    <div class="page-header">
      <h1>预约管理</h1>
      <a-space>
        <a-range-picker v-model:value="dateRange" @change="handleDateChange" />
        <a-select
          v-model:value="statusFilter"
          style="width: 120px"
          placeholder="预约状态"
          @change="handleStatusChange"
        >
          <a-select-option value="">全部状态</a-select-option>
          <a-select-option value="PENDING">待确认</a-select-option>
          <a-select-option value="CONFIRMED">已确认</a-select-option>
          <a-select-option value="COMPLETED">已完成</a-select-option>
          <a-select-option value="CANCELLED">已取消</a-select-option>
        </a-select>
        <a-button type="primary" @click="showCreateModal">
          <template #icon><plus-outlined /></template>
          新增预约
        </a-button>
      </a-space>
    </div>
    
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="6">
        <a-statistic title="今日预约" :value="todayAppointments" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="待确认" :value="pendingAppointments" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="本周预约" :value="weekAppointments" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="已完成" :value="completedAppointments" />
      </a-col>
    </a-row>
    
    <a-card>
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <a-tab-pane key="all" tab="全部预约">
          <a-table
            :columns="columns"
            :data-source="appointments"
            :loading="loading"
            :pagination="pagination"
            @change="handleTableChange"
            rowKey="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'patientName'">
                <a @click="viewPatient(record.patientId)">{{ record.patientName }}</a>
              </template>
              
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'action'">
                <a-space size="small">
                  <a @click="viewAppointment(record)">查看</a>
                  <a-divider type="vertical" />
                  <a v-if="record.status === 'PENDING'" @click="confirmAppointment(record)">确认</a>
                  <a v-if="record.status === 'CONFIRMED'" @click="completeAppointment(record)">完成</a>
                  <a-divider type="vertical" />
                  <a v-if="record.status !== 'COMPLETED' && record.status !== 'CANCELLED'" 
                     @click="cancelAppointment(record)">取消</a>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="today" tab="今日预约"></a-tab-pane>
        <a-tab-pane key="pending" tab="待确认"></a-tab-pane>
        <a-tab-pane key="upcoming" tab="即将到来"></a-tab-pane>
      </a-tabs>
    </a-card>
    
    <!-- 查看预约详情抽屉 -->
    <a-drawer
      title="预约详情"
      :open="appointmentDrawerVisible"
      @close="appointmentDrawerVisible = false"
      width="600"
      :footer-style="{ textAlign: 'right' }"
    >
      <a-descriptions v-if="selectedAppointment" bordered :column="{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }">
        <a-descriptions-item label="患者姓名">{{ selectedAppointment.patient_name }}</a-descriptions-item>
        <a-descriptions-item label="预约时间">{{ selectedAppointment.appointment_time }}</a-descriptions-item>
        <a-descriptions-item label="预约类型">{{ selectedAppointment.purpose }}</a-descriptions-item>
        <a-descriptions-item label="预约状态">
          <a-tag :color="getStatusColor(selectedAppointment.status)">
            {{ getStatusText(selectedAppointment.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="预约备注">{{ selectedAppointment.notes || '无' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间" :span="2">{{ selectedAppointment.created_at }}</a-descriptions-item>
      </a-descriptions>
      <a-spin v-else />
      
      <template #footer>
        <a-space>
          <a-button @click="appointmentDrawerVisible = false">关闭</a-button>
          <a-button v-if="selectedAppointment?.status === 'PENDING'" type="primary" 
                    @click="selectedAppointment && confirmAppointment(selectedAppointment)">确认预约</a-button>
          <a-button v-if="selectedAppointment?.status === 'CONFIRMED'" type="primary" 
                    @click="selectedAppointment && completeAppointment(selectedAppointment)">完成预约</a-button>
          <a-button v-if="selectedAppointment?.status !== 'COMPLETED' && selectedAppointment?.status !== 'CANCELLED'" 
                    danger @click="selectedAppointment && cancelAppointment(selectedAppointment)">取消预约</a-button>
        </a-space>
      </template>
    </a-drawer>
    
    <!-- 创建预约表单 -->
    <a-modal
      v-model:visible="createModalVisible"
      title="新增预约"
      @ok="handleCreateAppointment"
      :confirmLoading="submitting"
    >
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="选择患者" name="patientId" :rules="[{ required: true, message: '请选择患者' }]">
          <a-select
            v-model:value="form.patient_id"
            placeholder="请选择患者"
            :loading="patientsLoading"
            :options="patientOptions"
          ></a-select>
        </a-form-item>
        <a-form-item label="预约时间" name="appointmentTime" :rules="[{ required: true, message: '请选择预约时间' }]">
          <a-date-picker
            v-model:value="appointmentTimeValue"
            :show-time="{ format: 'HH:mm' }"
            format="YYYY-MM-DD HH:mm"
            placeholder="选择日期和时间"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="预约目的" name="purpose" :rules="[{ required: true, message: '请输入预约目的' }]">
          <a-select v-model:value="form.purpose" placeholder="预约目的">
            <a-select-option value="regular">常规体检</a-select-option>
            <a-select-option value="consultation">诊疗咨询</a-select-option>
            <a-select-option value="followUp">复诊随访</a-select-option>
            <a-select-option value="emergency">紧急就诊</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="时长(分钟)" name="duration" :rules="[{ required: true, message: '请输入预约时长' }]">
          <a-input-number v-model:value="form.duration" :min="15" :max="120" :step="15" style="width: 100%" />
        </a-form-item>
        <a-form-item label="备注" name="notes">
          <a-textarea v-model:value="form.notes" :rows="4" placeholder="预约相关备注信息" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  getDoctorAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment as cancelAppointmentApi,
  getDoctorPatients,
  getPatientDetails
} from '@/api/doctor';
import type {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentStatus,
  Patient,
  GetAppointmentsParams
} from '@/types/doctor';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const appointments = ref<Appointment[]>([]);
const appointmentDrawerVisible = ref(false);
const selectedAppointment = ref<Appointment | null>(null);
const activeTab = ref('all');
const dateRange = ref<[Dayjs, Dayjs] | null>(null);
const statusFilter = ref<AppointmentStatus | ''>('');
const patientsLoading = ref(false);
const patientsList = ref<Patient[]>([]);
const patientOptions = ref<{ value: number; label: string }[]>([]);
const appointmentTimeValue = ref<Dayjs | null>(null);

// 统计数据
const todayAppointments = ref(0);
const pendingAppointments = ref(0);
const weekAppointments = ref(0);
const completedAppointments = ref(0);

// 创建预约相关
const createModalVisible = ref(false);
const submitting = ref(false);
const form = reactive<CreateAppointmentRequest>({
  patient_id: 0,
  appointment_time: '',
  duration: 30,
  purpose: '',
  notes: ''
});

// 表格列定义
const columns = [
  {
    title: '预约时间',
    dataIndex: 'appointment_time',
    key: 'appointmentTime',
    width: 180,
    sorter: true,
    customRender: ({ text }: { text: string }) => {
      return dayjs(text).format('YYYY-MM-DD HH:mm');
    }
  },
  {
    title: '患者',
    dataIndex: 'patient_name',
    key: 'patientName',
    width: 120
  },
  {
    title: '目的',
    dataIndex: 'purpose',
    key: 'purpose',
    ellipsis: true,
    width: 200
  },
  {
    title: '时长(分钟)',
    dataIndex: 'duration',
    key: 'duration',
    width: 100
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '备注',
    dataIndex: 'notes',
    key: 'notes',
    ellipsis: true,
    width: 200
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'createdAt',
    width: 150,
    customRender: ({ text }: { text: string }) => {
      return dayjs(text).format('YYYY-MM-DD HH:mm');
    }
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
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

// 初始化数据
onMounted(() => {
  fetchAppointments();
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
        }
      }
    }, 500);
  }
  
  // 如果URL中有预约ID参数，打开预约详情
  if (route.query.id) {
    const appointmentId = Number(route.query.id);
    if (!isNaN(appointmentId)) {
      fetchAppointmentDetail(appointmentId);
    }
  }
});

// 获取预约列表
const fetchAppointments = async (params: Partial<GetAppointmentsParams> = {}) => {
  loading.value = true;
  try {
    const queryParams: GetAppointmentsParams = {
      page: pagination.current,
      per_page: pagination.pageSize,
      ...params
    };
    
    // 处理日期范围
    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
      queryParams.start_date = dateRange.value[0].format('YYYY-MM-DD');
      queryParams.end_date = dateRange.value[1].format('YYYY-MM-DD');
    }
    
    // 处理状态过滤
    if (statusFilter.value) {
      queryParams.status = statusFilter.value;
    }
    
    // 处理标签过滤
    if (activeTab.value !== 'all') {
      queryParams.date_filter = activeTab.value as 'all' | 'today' | 'upcoming' | 'past';
    }
    
    const response = await getDoctorAppointments(queryParams);
    if (response.success && response.data) {
      appointments.value = response.data.appointments;
      pagination.total = response.data.pagination.total;
      pagination.current = response.data.pagination.page;
      
      // 更新统计数据
      countStatistics(response.data.appointments);
    } else {
      message.error(response.message || '获取预约列表失败');
    }
  } catch (error: any) {
    console.error('获取预约列表失败:', error);
    message.error('获取预约列表失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 统计数据计算
const countStatistics = (appointmentList: Appointment[]) => {
  const today = dayjs().startOf('day');
  const weekEnd = dayjs().endOf('week');
  
  todayAppointments.value = appointmentList.filter(appointment => 
    dayjs(appointment.appointment_time).isSame(today, 'day')
  ).length;
  
  pendingAppointments.value = appointmentList.filter(appointment => 
    appointment.status === 'PENDING'
  ).length;
  
  weekAppointments.value = appointmentList.filter(appointment => 
    dayjs(appointment.appointment_time).isAfter(today) && 
    dayjs(appointment.appointment_time).isBefore(weekEnd)
  ).length;
  
  completedAppointments.value = appointmentList.filter(appointment => 
    appointment.status === 'COMPLETED'
  ).length;
};

// 监听appointmentTimeValue变化
watch(appointmentTimeValue, (newVal) => {
  if (newVal) {
    form.appointment_time = newVal.format('YYYY-MM-DD HH:mm:ss');
  } else {
    form.appointment_time = '';
  }
});

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

// 查看预约详情
const viewAppointment = (record: Appointment) => {
  selectedAppointment.value = record;
  appointmentDrawerVisible.value = true;
};

// 查看患者详情
const viewPatient = (patientId: number) => {
  router.push(`/doctor/patients/${patientId}`);
};

// 显示创建预约模态框
const showCreateModal = () => {
  form.patient_id = 0;
  form.appointment_time = '';
  form.purpose = '';
  form.duration = 30;
  form.notes = '';
  appointmentTimeValue.value = null;
  createModalVisible.value = true;
};

// 创建预约
const handleCreateAppointment = async () => {
  if (!form.patient_id) {
    message.error('请选择患者');
    return;
  }
  
  if (!appointmentTimeValue.value) {
    message.error('请选择预约时间');
    return;
  }
  
  if (!form.purpose) {
    message.error('请输入预约目的');
    return;
  }
  
  submitting.value = true;
  try {
    // 转换日期格式
    form.appointment_time = appointmentTimeValue.value.format('YYYY-MM-DD HH:mm:ss');
    
    const response = await createAppointment(form);
    if (response.success) {
      message.success('预约创建成功');
      createModalVisible.value = false;
      fetchAppointments();
    } else {
      message.error(response.message || '创建预约失败');
    }
  } catch (error: any) {
    console.error('创建预约失败:', error);
    message.error('创建预约失败: ' + (error.message || '未知错误'));
  } finally {
    submitting.value = false;
  }
};

// 更新预约状态
const updateAppointmentStatus = async (id: number, status: AppointmentStatus) => {
  try {
    const updateData: UpdateAppointmentRequest = { status };
    const response = await updateAppointment(id, updateData);
    if (response.success) {
      message.success(`预约已${getStatusText(status)}`);
      fetchAppointments();
      
      // 更新当前选中的预约
      if (selectedAppointment.value && selectedAppointment.value.id === id) {
        selectedAppointment.value.status = status;
      }
    } else {
      message.error(response.message || '更新状态失败');
    }
  } catch (error: any) {
    console.error('更新预约状态失败:', error);
    message.error('更新预约状态失败: ' + (error.message || '未知错误'));
  }
};

// 确认预约
const confirmAppointment = (record: Appointment) => {
  updateAppointmentStatus(record.id, 'CONFIRMED');
};

// 完成预约
const completeAppointment = (record: Appointment) => {
  updateAppointmentStatus(record.id, 'COMPLETED');
};

// 取消预约
const cancelAppointment = async (record: Appointment) => {
  try {
    const response = await cancelAppointmentApi(record.id);
    if (response.success) {
      message.success('预约已取消');
      fetchAppointments();
      
      // 更新当前选中的预约
      if (selectedAppointment.value && selectedAppointment.value.id === record.id) {
        selectedAppointment.value.status = 'CANCELLED';
      }
    } else {
      message.error(response.message || '取消预约失败');
    }
  } catch (error: any) {
    console.error('取消预约失败:', error);
    message.error('取消预约失败: ' + (error.message || '未知错误'));
  }
};

// 处理日期范围变化
const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
  dateRange.value = dates;
  pagination.current = 1;
  fetchAppointments();
};

// 处理状态过滤
const handleStatusChange = (status: AppointmentStatus | '') => {
  statusFilter.value = status;
  pagination.current = 1;
  fetchAppointments();
};

// 处理标签切换
const handleTabChange = (key: string) => {
  activeTab.value = key;
  pagination.current = 1;
  fetchAppointments();
};

// 处理表格变化
const handleTableChange = (pag: any, filters: any, sorter: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  
  const params: Partial<GetAppointmentsParams> = {};
  
  // 处理排序
  if (sorter.field && sorter.order) {
    params.sort_by = sorter.field;
    params.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
  }
  
  fetchAppointments(params);
};

// 获取状态颜色
const getStatusColor = (status: AppointmentStatus) => {
  const colorMap: Record<AppointmentStatus, string> = {
    'PENDING': 'orange',
    'CONFIRMED': 'green',
    'CANCELLED': 'red',
    'COMPLETED': 'blue'
  };
  return colorMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: AppointmentStatus) => {
  const textMap: Record<AppointmentStatus, string> = {
    'PENDING': '待确认',
    'CONFIRMED': '已确认',
    'CANCELLED': '已取消',
    'COMPLETED': '已完成'
  };
  return textMap[status] || status;
};

// 获取单个预约详情
const fetchAppointmentDetail = async (appointmentId: number) => {
  try {
    // 先查找当前列表中是否有这个预约
    let appointment = appointments.value.find(a => a.id === appointmentId);
    
    if (appointment) {
      // 如果在当前列表中找到了
      viewAppointment(appointment);
    } else {
      // 否则需要单独请求获取
      loading.value = true;
      
      // 由于API可能没有直接通过ID查询的参数，使用特定的接口或页面大小为全部
      // 获取所有预约并在前端过滤
      const response = await getDoctorAppointments({ 
        per_page: 100 // 获取足够多的预约以找到指定ID
      });
      loading.value = false;
      
      if (response.success && response.data) {
        // 在前端筛选指定ID的预约
        appointment = response.data.appointments.find(a => a.id === appointmentId);
        if (appointment) {
          viewAppointment(appointment);
        } else {
          message.error('未找到指定的预约');
        }
      } else {
        message.error('未找到指定的预约');
      }
    }
  } catch (error: any) {
    console.error('获取预约详情失败:', error);
    message.error('获取预约详情失败: ' + (error.message || '未知错误'));
    loading.value = false;
  }
};

const contactPatient = async () => {
  if (!selectedAppointment.value) return;
  
  try {
    const response = await getPatientDetails(selectedAppointment.value.patient_id);
    if (response.success && response.data) {
      const patientDetail = response.data as any;
      
      // 根据患者信息显示联系方式
      let contactInfo = '';
      
      if (patientDetail.phone) {
        contactInfo += `电话: ${patientDetail.phone}\n`;
      }
      
      if (patientDetail.email) {
        contactInfo += `邮箱: ${patientDetail.email}\n`;
      }
      
      if (patientDetail.info && patientDetail.info.emergency_contact) {
        contactInfo += `紧急联系人: ${patientDetail.info.emergency_contact}\n`;
      }
      
      if (patientDetail.info && patientDetail.info.emergency_phone) {
        contactInfo += `紧急联系电话: ${patientDetail.info.emergency_phone}\n`;
      }
      
      if (contactInfo) {
        // 使用Modal显示联系信息
        Modal.info({
          title: `联系患者: ${patientDetail.name}`,
          content: contactInfo.split('\n').map(line => line + '\n'),
          okText: '关闭'
        });
      } else {
        message.warning('患者未提供任何联系方式');
      }
    } else {
      message.error(response.message || '获取患者联系信息失败');
    }
  } catch (error: any) {
    console.error('获取患者联系信息失败:', error);
    message.error('获取患者联系信息失败: ' + (error.message || '未知错误'));
  }
};

// 开具处方
const createPrescriptionForPatient = () => {
  if (!selectedAppointment.value) return;
  
  // 关闭当前抽屉
  appointmentDrawerVisible.value = false;
  
  // 跳转到处方创建页面，并携带患者ID和预约ID
  router.push({
    path: '/doctor/prescriptions/create',
    query: {
      patient_id: selectedAppointment.value.patient_id.toString(),
      appointment_id: selectedAppointment.value.id.toString(),
      diagnosis: encodeURIComponent(selectedAppointment.value.purpose) // 将预约目的作为初始诊断
    }
  });
};
</script>

<style scoped>
.appointments-content {
  padding: 0 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
}
</style> 