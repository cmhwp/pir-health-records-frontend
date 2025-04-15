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
      <a-col :span="8">
        <a-statistic title="今日患者" :value="todayPatients" style="margin-bottom: 16px">
          <template #suffix>
            <user-outlined />
          </template>
        </a-statistic>
      </a-col>
      <a-col :span="8">
        <a-statistic title="总患者数" :value="totalPatients" style="margin-bottom: 16px">
          <template #suffix>
            <team-outlined />
          </template>
        </a-statistic>
      </a-col>
      <a-col :span="8">
        <a-statistic title="总记录数" :value="totalRecords" style="margin-bottom: 16px">
          <template #suffix>
            <file-text-outlined />
          </template>
        </a-statistic>
      </a-col>
    </a-row>
    
    <a-divider />
    
    <a-row :gutter="16">
      <a-col :span="12">
        <a-card title="我的患者" :bordered="false">
          <template #extra><a href="#" @click="navigateTo('/doctor/patients')">更多</a></template>
          <p>您当前共有 <a-typography-text strong>{{ totalPatients }}</a-typography-text> 位患者</p>
          <p>今日接诊 <a-typography-text strong>{{ todayPatients }}</a-typography-text> 位患者</p>
          <a-button type="primary" @click="navigateTo('/doctor/patients')">查看患者列表</a-button>
        </a-card>
      </a-col>
      <a-col :span="12">
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
      <a-col :span="24">
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  UserOutlined, 
  FileTextOutlined,
  TeamOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';

import { getDoctorDashboard } from '@/api/doctor';
import type { DoctorDashboardResponse } from '@/types/doctor';

const router = useRouter();

// 统计数据
const todayPatients = ref(0);
const totalPatients = ref(0);
const totalRecords = ref(0);

// 医生信息
const doctorInfo = ref<DoctorDashboardResponse['doctor'] | null>(null);

// 最近记录
const recentRecords = ref<DoctorDashboardResponse['recent_records']>([]);
const loadingRecords = ref(false);

// 当前日期显示
const currentDate = ref(dayjs().format('YYYY年MM月DD日 dddd'));

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

// 导航函数
const navigateTo = (path: string) => {
  router.push(path);
};

// 查看记录详情
const viewRecord = (recordId: string) => {
  router.push(`/doctor/records?id=${recordId}`);
};

// 组件挂载时加载数据
onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
.dashboard-content {
  width: 100%;
}

.welcome-section {
  margin-bottom: 24px;
}

.date-display {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}
</style> 