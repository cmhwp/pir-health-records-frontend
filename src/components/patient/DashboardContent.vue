<template>
  <div class="dashboard-container">
    <h1>健康概览</h1>
    
    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stat-cards">
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <a-statistic
            title="健康记录总数"
            :value="stats.total_records || 0"
            :loading="loading"
          >
            <template #prefix>
              <file-outlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <a-statistic
            title="共享记录"
            :value="stats.shared_records || 0"
            :loading="loading"
          >
            <template #prefix>
              <team-outlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <a-statistic
            title="使用PIR查询"
            :value="stats.pir_queries || 0"
            :loading="loading"
          >
            <template #prefix>
              <safety-outlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="6">
        <a-card>
          <a-statistic
            title="隐私保护评分"
            :value="stats.privacy_score || 0"
            :loading="loading"
            :value-style="{ color: privacyScoreColor }"
            suffix="分"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 快捷操作 -->
    <a-row :gutter="16" class="quick-actions">
      <a-col :xs="24" :sm="12" :md="8">
        <a-card title="我的健康记录" :bordered="false">
          <template #extra><router-link to="/patient/records">更多</router-link></template>
          <p>管理您的健康档案和医疗信息</p>
          <div class="card-actions">
            <router-link to="/patient/records">
              <a-button type="primary">查看记录</a-button>
            </router-link>
            <router-link to="/patient/add-record">
              <a-button>添加记录</a-button>
            </router-link>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="8">
        <a-card title="隐私保护查询" :bordered="false">
          <template #extra><router-link to="/patient/pir-query">更多</router-link></template>
          <p>使用PIR技术安全查询您的健康记录</p>
          <div class="card-actions">
            <router-link to="/patient/pir-query">
              <a-button type="primary">安全查询</a-button>
            </router-link>
            <router-link to="/patient/pir-settings">
              <a-button>隐私设置</a-button>
            </router-link>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :md="8">
        <a-card title="记录共享" :bordered="false">
          <template #extra><router-link to="/patient/shared">更多</router-link></template>
          <p>安全共享您的健康记录给医生或研究人员</p>
          <div class="card-actions">
            <router-link to="/patient/shared">
              <a-button type="primary">共享记录</a-button>
            </router-link>
          </div>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 健康记录类型统计 -->
    <a-row :gutter="16" class="stat-charts">
      <a-col :xs="24" :md="12">
        <a-card title="健康记录类型分布" :loading="loading">
          <div ref="recordTypesChart" style="height: 300px"></div>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="12">
        <a-card title="月度记录统计" :loading="loading">
          <div ref="monthlyRecordsChart" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 最近记录 -->
    <a-card title="最近健康记录" :loading="loading" class="recent-records">
      <a-empty v-if="!recentRecords.length" description="暂无健康记录" />
      <a-list v-else :data-source="recentRecords" item-layout="horizontal">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta
              :title="item.title"
              :description="item.description || '无描述'"
            >
              <template #avatar>
                <a-avatar 
                  :style="{ backgroundColor: getRecordTypeColor(item.record_type) }" 
                  shape="square"
                >
                  {{ getRecordTypeInitial(item.record_type) }}
                </a-avatar>
              </template>
            </a-list-item-meta>
            <div class="list-content">
              <div class="list-content-item">
                <span>记录类型：{{ item.record_type }}</span>
              </div>
              <div class="list-content-item">
                <span>日期：{{ formatDate(item.date || item.created_at) }}</span>
              </div>
            </div>
            <template #actions>
              <router-link :to="`/patient/records/${item.id || item._id}`">查看</router-link>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import { getHealthStatistics, getHealthRecords } from '@/api/health-records';
import { message } from 'ant-design-vue';
import type { HealthRecord } from '@/types/health-records';
import { FileOutlined, TeamOutlined, SafetyOutlined, LockOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import * as echarts from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import { 
  TitleComponent, 
  TooltipComponent, 
  LegendComponent, 
  GridComponent 
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册ECharts组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  PieChart,
  BarChart,
  CanvasRenderer
]);

const loading = ref(true);
const stats = ref<any>({});
const recentRecords = ref<HealthRecord[]>([]);
const recordTypesChart = ref<HTMLElement | null>(null);
const monthlyRecordsChart = ref<HTMLElement | null>(null);
let pieChart: echarts.ECharts | null = null;
let barChart: echarts.ECharts | null = null;

// 计算隐私评分的颜色
const privacyScoreColor = computed(() => {
  const score = stats.value.privacy_score || 0;
  if (score >= 80) return '#52c41a'; // 绿色
  if (score >= 60) return '#faad14'; // 黄色
  return '#f5222d'; // 红色
});

// 获取统计数据
const fetchStatistics = async () => {
  loading.value = true;
  try {
    const response = await getHealthStatistics();
    if (response.success && response.data) {
      stats.value = response.data;
      renderCharts();
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
    message.error('获取健康统计数据失败');
  } finally {
    loading.value = false;
  }
};

// 获取最近健康记录
const fetchRecentRecords = async () => {
  try {
    const response = await getHealthRecords();
    if (response.success && response.data) {
      // 获取最近5条记录
      recentRecords.value = response.data.slice(0, 5);
    }
  } catch (error) {
    console.error('获取最近健康记录失败:', error);
  }
};

// 渲染图表
const renderCharts = () => {
  if (!stats.value) return;
  
  // 渲染记录类型图表
  if (recordTypesChart.value && stats.value.record_types) {
    if (pieChart) pieChart.dispose();
    
    pieChart = echarts.init(recordTypesChart.value);
    const recordTypes = stats.value.record_types || {};
    
    const pieData = Object.entries(recordTypes).map(([name, value]) => ({
      name,
      value
    }));
    
    const pieOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: Object.keys(recordTypes)
      },
      series: [
        {
          name: '记录类型',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '14',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: pieData
        }
      ]
    };
    
    pieChart.setOption(pieOption);
  }
  
  // 渲染月度记录图表
  if (monthlyRecordsChart.value && stats.value.records_by_month) {
    if (barChart) barChart.dispose();
    
    barChart = echarts.init(monthlyRecordsChart.value);
    const monthlyData = stats.value.records_by_month || {};
    
    const months = Object.keys(monthlyData).sort();
    const values = months.map(month => monthlyData[month]);
    
    const barOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months.map(m => {
          const [year, month] = m.split('-');
          return `${year}年${month}月`;
        })
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '记录数量',
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#1890ff'
          }
        }
      ]
    };
    
    barChart.setOption(barOption);
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD');
};

// 获取记录类型的首字母用于头像
const getRecordTypeInitial = (recordType: string) => {
  if (!recordType) return 'R';
  return recordType.charAt(0).toUpperCase();
};

// 根据记录类型获取颜色
const getRecordTypeColor = (recordType: string) => {
  const colorMap: Record<string, string> = {
    medication: '#52c41a',
    examination: '#1890ff',
    diagnosis: '#fa8c16',
    treatment: '#722ed1',
    allergy: '#eb2f96',
    immunization: '#13c2c2',
    lab_result: '#faad14',
    vital_signs: '#2f54eb'
  };
  
  return colorMap[recordType] || '#1890ff';
};

// 窗口大小变化时重新渲染图表
const handleResize = () => {
  if (pieChart) pieChart.resize();
  if (barChart) barChart.resize();
};

// 监听窗口大小变化
window.addEventListener('resize', handleResize);

onMounted(async () => {
  // 获取页面数据
  await Promise.all([fetchStatistics(), fetchRecentRecords()]);
});

// 组件卸载时清理
watch(() => null, () => {
  window.removeEventListener('resize', handleResize);
  if (pieChart) pieChart.dispose();
  if (barChart) barChart.dispose();
}, { immediate: false });
</script>

<style scoped>
.dashboard-container {
  padding: 0 12px;
}

.stat-cards {
  margin-bottom: 24px;
}

.quick-actions {
  margin-bottom: 24px;
}

.stat-charts {
  margin-bottom: 24px;
}

.recent-records {
  margin-bottom: 24px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.list-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 30%;
  margin-right: 16px;
}

.list-content-item {
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: space-between;
}

@media (max-width: 768px) {
  .list-content {
    width: 100%;
    margin-bottom: 8px;
  }
}
</style> 