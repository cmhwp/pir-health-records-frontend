<template>
  <div class="dashboard-content">
    <!-- 欢迎信息 -->
    <a-row :gutter="16" class="welcome-section">
      <a-col :span="16">
        <h1>欢迎回来，{{ doctorInfo?.name || '医生' }}</h1>
        <p v-if="doctorInfo?.info">
          {{ doctorInfo.info.hospital }} {{ doctorInfo.info.department }} | 
          {{ doctorInfo.info.specialty }} | 
          从业{{ doctorInfo.info.years_of_experience }}年
        </p>
      </a-col>
      <a-col :span="8" style="text-align: right">
        <span class="date-display">{{ currentDate }}</span>
      </a-col>
    </a-row>
    
    <!-- 统计信息 -->
    <a-row :gutter="16">
      <a-col :span="6">
        <a-statistic title="今日患者" :value="todayPatients" style="margin-bottom: 16px">
          <template #suffix>
            <user-outlined />
          </template>
        </a-statistic>
      </a-col>
      <a-col :span="6">
        <a-statistic title="待处理预约" :value="pendingAppointments" style="margin-bottom: 16px">
          <template #suffix>
            <calendar-outlined />
          </template>
        </a-statistic>
      </a-col>
      <a-col :span="6">
        <a-statistic title="总患者数" :value="totalPatients" style="margin-bottom: 16px">
          <template #suffix>
            <team-outlined />
          </template>
        </a-statistic>
      </a-col>
      <a-col :span="6">
        <a-statistic title="总记录数" :value="totalRecords" style="margin-bottom: 16px">
          <template #suffix>
            <file-text-outlined />
          </template>
        </a-statistic>
      </a-col>
    </a-row>
    
    <a-divider />
    
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="我的患者" :bordered="false">
          <template #extra><a href="#" @click="navigateTo('/doctor/patients')">更多</a></template>
          <p>您当前共有 <a-typography-text strong>{{ totalPatients }}</a-typography-text> 位患者</p>
          <p>今日接诊 <a-typography-text strong>{{ todayPatients }}</a-typography-text> 位患者</p>
          <a-button type="primary" @click="navigateTo('/doctor/patients')">查看患者列表</a-button>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="预约管理" :bordered="false">
          <template #extra><a href="#" @click="navigateTo('/doctor/appointments')">更多</a></template>
          <p>待处理预约 <a-typography-text strong>{{ pendingAppointments }}</a-typography-text> 个</p>
          <p>今日总预约 <a-typography-text strong>{{ todayAppointments.length }}</a-typography-text> 个</p>
          <a-button type="primary" @click="navigateTo('/doctor/appointments')">管理预约</a-button>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="健康记录" :bordered="false">
          <template #extra><a href="#" @click="navigateTo('/doctor/records')">更多</a></template>
          <p>您已创建 <a-typography-text strong>{{ totalRecords }}</a-typography-text> 份健康记录</p>
          <p>最近更新 <a-typography-text strong>{{ recentRecords.length }}</a-typography-text> 份记录</p>
          <a-button type="primary" @click="navigateTo('/doctor/records')">管理健康记录</a-button>
        </a-card>
      </a-col>
    </a-row>
    
    <a-divider />
    
    <a-row :gutter="16">
      <a-col :span="16">
        <a-card title="今日预约" :bordered="false">
          <a-empty v-if="todayAppointments.length === 0" description="暂无预约" />
          <a-table 
            v-else
            :columns="appointmentColumns" 
            :data-source="todayAppointments" 
            :pagination="false"
            :loading="loadingAppointments"
            rowKey="id"
          />
          <div v-if="todayAppointments.length > 0" style="text-align: right; margin-top: 8px">
            <a-button type="link" @click="navigateTo('/doctor/appointments')">查看全部预约</a-button>
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="最近医疗记录" :bordered="false">
          <a-spin :spinning="loadingRecords">
            <a-empty v-if="recentRecords.length === 0" description="暂无记录" />
            <a-list v-else size="small" :data-source="recentRecords">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>{{ item.title }}</template>
                    <template #description>
                      <div>患者: {{ item.patient_name }}</div>
                      <div>{{ dayjs(item.created_at).format('YYYY-MM-DD') }}</div>
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a @click="viewRecord(item.id)">查看</a>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-spin>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { message, Tag } from 'ant-design-vue';
import { 
  UserOutlined, 
  CalendarOutlined, 
  MedicineBoxOutlined, 
  FileTextOutlined,
  TeamOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';

import { getDoctorDashboard, getDoctorAppointments } from '@/api/doctor';
import type { DoctorDashboardResponse, Appointment } from '@/types/doctor';

const router = useRouter();

// 统计数据
const todayPatients = ref(0);
const pendingAppointments = ref(0);
const todayPrescriptions = ref(0);
const newRecords = ref(0);
const totalPatients = ref(0);
const totalRecords = ref(0);

// 医生信息
const doctorInfo = ref<DoctorDashboardResponse['doctor'] | null>(null);

// 今日预约数据
const todayAppointments = ref<Appointment[]>([]);
const loadingAppointments = ref(false);

// 最近记录
const recentRecords = ref<DoctorDashboardResponse['recent_records']>([]);
const loadingRecords = ref(false);

// 当前日期显示
const currentDate = ref(dayjs().format('YYYY年MM月DD日 dddd'));

// 预约表格列定义
const appointmentColumns = [
  {
    title: '时间',
    dataIndex: 'appointment_time',
    key: 'appointmentTime',
    customRender: ({ text }: { text: string }) => {
      return dayjs(text).format('HH:mm');
    }
  },
  {
    title: '患者',
    dataIndex: 'patient_name',
    key: 'patientName',
  },
  {
    title: '目的',
    dataIndex: 'purpose',
    key: 'purpose',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    customRender: ({ text }: { text: string }) => {
      const statusMap: Record<string, { text: string, color: string }> = {
        'PENDING': { text: '待确认', color: 'orange' },
        'CONFIRMED': { text: '已确认', color: 'green' },
        'COMPLETED': { text: '已完成', color: 'blue' },
        'CANCELLED': { text: '已取消', color: 'red' },
      };
      const status = statusMap[text] || { text, color: 'default' };
      return h(Tag, { color: status.color }, () => status.text);
    }
  },
  {
    title: '操作',
    key: 'action',
    customRender: ({ record }: { record: Appointment }) => {
      return h('div', {}, [
        h('a', { 
          onClick: () => viewAppointment(record),
          style: { marginRight: '8px' }
        }, '查看'),
        h('a', { 
          onClick: () => navigateTo(`/doctor/patients/${record.patient_id}`) 
        }, '患者档案')
      ]);
    }
  }
];

// 获取仪表盘数据
const fetchDashboardData = async () => {
  try {
    const response = await getDoctorDashboard();
    if (response.success && response.data) {
      const data = response.data;
      
      // 设置医生信息
      doctorInfo.value = data.doctor;
      
      // 设置统计数据
      todayPatients.value = data.statistics.today_patients;
      totalPatients.value = data.statistics.total_patients;
      totalRecords.value = data.statistics.total_records;
      
      // 设置最近记录
      recentRecords.value = data.recent_records;
    } else {
      message.error(response.message || '获取仪表盘数据失败');
    }
  } catch (error: any) {
    console.error('获取仪表盘数据失败:', error);
    message.error('获取仪表盘数据失败: ' + (error.message || '未知错误'));
  }
};

// 获取今日预约
const fetchTodayAppointments = async () => {
  loadingAppointments.value = true;
  try {
    // 获取今日预约
    const today = dayjs().format('YYYY-MM-DD');
    const response = await getDoctorAppointments({
      date_filter: 'today',
      per_page: 5  // 只显示前5条
    });
    
    if (response.success && response.data) {
      todayAppointments.value = response.data.appointments;
      
      // 更新待处理预约数量
      pendingAppointments.value = response.data.appointments.filter(
        a => a.status === 'PENDING'
      ).length;
    } else {
      message.error(response.message || '获取今日预约失败');
    }
  } catch (error: any) {
    console.error('获取今日预约失败:', error);
    message.error('获取今日预约失败: ' + (error.message || '未知错误'));
  } finally {
    loadingAppointments.value = false;
  }
};

// 查看预约详情
const viewAppointment = (record: Appointment) => {
  router.push({
    path: '/doctor/appointments',
    query: { id: record.id.toString() }
  });
};

// 查看健康记录
const viewRecord = (recordId: number) => {
  router.push(`/doctor/records/${recordId}`);
};

// 导航函数
const navigateTo = (path: string) => {
  router.push(path);
};

// 组件挂载时获取数据
onMounted(() => {
  fetchDashboardData();
  fetchTodayAppointments();
});
</script>

<style scoped>
.dashboard-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.ant-row {
  margin-bottom: 16px;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-section h1 {
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.welcome-section p {
  margin-bottom: 0;
  color: #666;
}

.date-display {
  font-size: 16px;
  color: #666;
  line-height: 32px;
}

.ant-statistic-title {
  font-size: 16px;
}

.ant-list-item {
  padding: 12px 0;
}

.ant-list-item-meta-title {
  margin-bottom: 4px !important;
}

.ant-card {
  height: 100%;
}
</style> 