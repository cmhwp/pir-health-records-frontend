<template>
  <div>
    <a-row :gutter="16">
      <!-- 研究员信息卡片 -->
      <a-col :xs="24" :sm="24" :md="8" :lg="6" :xl="6">
        <a-card class="dashboard-card" title="研究员信息">
          <template #extra><a href="#" @click="handleEdit">编辑</a></template>
          <a-skeleton :loading="loading" active>
            <div class="researcher-info">
              <a-avatar :size="64" style="background-color: #1890ff; margin-bottom: 16px;">
                {{ researcher?.name?.charAt(0).toUpperCase() || 'R' }}
              </a-avatar>
              <h3>{{ researcher?.name || '暂无姓名' }}</h3>
              <p><strong>机构：</strong>{{ researcher?.institution || '暂无机构' }}</p>
              <p><strong>部门：</strong>{{ researcher?.department || '暂无部门' }}</p>
              <p><strong>研究领域：</strong>{{ researcher?.research_area || '暂无研究领域' }}</p>
            </div>
          </a-skeleton>
        </a-card>
      </a-col>

      <!-- 统计数据卡片 -->
      <a-col :xs="24" :sm="24" :md="16" :lg="18" :xl="18">
        <a-row :gutter="16">
          <a-col :span="12" :lg="6" style="margin-bottom: 16px">
            <a-card class="stats-card">
              <a-statistic 
                title="可访问记录" 
                :value="statistics?.accessible_records || 0" 
                :loading="loading"
              >
                <template #prefix>
                  <file-outlined />
                </template>
              </a-statistic>
            </a-card>
          </a-col>

          <a-col :span="12" :lg="6" style="margin-bottom: 16px">
            <a-card class="stats-card">
              <a-statistic 
                title="最近查询" 
                :value="statistics?.recent_queries || 0" 
                :loading="loading"
              >
                <template #prefix>
                  <search-outlined />
                </template>
              </a-statistic>
            </a-card>
          </a-col>

          <a-col :span="12" :lg="6" style="margin-bottom: 16px">
            <a-card class="stats-card">
              <a-statistic 
                title="总项目数" 
                :value="statistics?.total_projects || 0" 
                :loading="loading"
              >
                <template #prefix>
                  <project-outlined />
                </template>
              </a-statistic>
            </a-card>
          </a-col>

          <a-col :span="12" :lg="6" style="margin-bottom: 16px">
            <a-card class="stats-card">
              <a-statistic 
                title="活跃项目" 
                :value="statistics?.active_projects || 0" 
                :loading="loading"
              >
                <template #prefix>
                  <clock-circle-outlined />
                </template>
              </a-statistic>
            </a-card>
          </a-col>
        </a-row>
      </a-col>
    </a-row>

    <!-- 项目记录和数据分析 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <!-- 近期项目 -->
      <a-col :xs="24" :sm="24" :md="14" :lg="16" :xl="16">
        <a-card title="近期项目" class="dashboard-card">
          <template #extra>
            <a-button type="primary" size="small" @click="handleNewProject">
              <template #icon><plus-outlined /></template>
              新建项目
            </a-button>
          </template>
          <a-skeleton :loading="loading" active :paragraph="{ rows: 5 }">
            <a-empty v-if="!recentProjects || recentProjects.length === 0" description="暂无项目" />
            <a-list v-else item-layout="horizontal" :data-source="recentProjects">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta
                    :title="item.title"
                    :description="item.description"
                  >
                    <template #avatar>
                      <a-avatar :style="{ backgroundColor: getStatusColor(item.status) }">
                        {{ getStatusIcon(item.status) }}
                      </a-avatar>
                    </template>
                  </a-list-item-meta>
                  <div class="project-info">
                    <a-tag :color="getStatusColor(item.status)">{{ getStatusText(item.status) }}</a-tag>
                    <div>{{ formatDate(item.start_date) }} ~ {{ formatDate(item.end_date) }}</div>
                  </div>
                  <template #actions>
                    <a key="view" @click="() => handleViewProject(item.id)">
                      <eye-outlined />
                      查看
                    </a>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-skeleton>
        </a-card>
      </a-col>

      <!-- 数据记录分布 -->
      <a-col :xs="24" :sm="24" :md="10" :lg="8" :xl="8">
        <a-card title="记录类型分布" class="dashboard-card">
          <a-skeleton :loading="loading" active :paragraph="{ rows: 5 }">
            <div id="record-chart" class="chart-container">
              <record-type-chart :loading="loading" />
            </div>
          </a-skeleton>
        </a-card>
      </a-col>
    </a-row>

    <!-- 数据趋势和快捷操作 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <!-- 时间趋势 -->
      <a-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <a-card title="记录时间分布" class="dashboard-card">
          <template #extra>
            <a-radio-group v-model:value="timeInterval" button-style="solid" size="small">
              <a-radio-button value="day">日</a-radio-button>
              <a-radio-button value="week">周</a-radio-button>
              <a-radio-button value="month">月</a-radio-button>
            </a-radio-group>
          </template>
          <a-skeleton :loading="loading" active :paragraph="{ rows: 5 }">
            <div id="time-chart" class="chart-container">
              <time-distribution-chart :interval="timeInterval" :loading="loading" />
            </div>
          </a-skeleton>
        </a-card>
      </a-col>

      <!-- 快捷操作 -->
      <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <a-card title="快捷操作" class="dashboard-card">
          <a-list>
            <a-list-item>
              <a-button type="primary" block @click="handleQueryData">
                <template #icon><search-outlined /></template>
                PIR数据查询
              </a-button>
            </a-list-item>
            <a-list-item>
              <a-button block @click="handleExportData">
                <template #icon><export-outlined /></template>
                导出匿名数据
              </a-button>
            </a-list-item>
            <a-list-item>
              <a-button block @click="handleAnalyzeData">
                <template #icon><bar-chart-outlined /></template>
                数据分析
              </a-button>
            </a-list-item>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { 
  FileOutlined, 
  SearchOutlined, 
  ProjectOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  ExportOutlined,
  BarChartOutlined,
  LeftOutlined,
  EditOutlined,
  UserAddOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';
import { getResearcherDashboard, getRecordTypeStatistics, getTimeDistribution, exportAnonymizedRecords } from '@/api/researcher';
import type { 
  ResearcherDashboardResponse, 
  ResearchProject, 
  TimeDistributionParams 
} from '@/types/researcher';

// 导入图表组件（这些需要单独创建）
import RecordTypeChart from './charts/RecordTypeChart.vue';
import TimeDistributionChart from './charts/TimeDistributionChart.vue';

const router = useRouter();
const loading = ref<boolean>(true);
const researcher = ref<ResearcherDashboardResponse['researcher'] | null>(null);
const statistics = ref<ResearcherDashboardResponse['statistics'] | null>(null);
const recentProjects = ref<ResearchProject[]>([]);
const timeInterval = ref<TimeDistributionParams['interval']>('week');

// 获取研究员工作台数据
const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const response = await getResearcherDashboard();
    if (response.success && response.data) {
      researcher.value = response.data.researcher;
      statistics.value = response.data.statistics;
      recentProjects.value = response.data.recent_projects;
    }
  } catch (error) {
    console.error('获取工作台数据失败:', error);
    message.error('获取工作台数据失败');
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD');
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    planning: 'blue',
    in_progress: 'green',
    completed: 'cyan',
    suspended: 'orange',
    cancelled: 'red'
  };
  return statusMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusTextMap: Record<string, string> = {
    planning: '规划中',
    in_progress: '进行中',
    completed: '已完成',
    suspended: '已暂停',
    cancelled: '已取消'
  };
  return statusTextMap[status] || status;
};

// 获取状态图标
const getStatusIcon = (status: string) => {
  const statusIconMap: Record<string, string> = {
    planning: 'P',
    in_progress: 'I',
    completed: 'C',
    suspended: 'S',
    cancelled: 'X'
  };
  return statusIconMap[status] || '?';
};

// 处理编辑研究员信息
const handleEdit = () => {
  router.push('/researcher/profile');
};

// 处理查看项目
const handleViewProject = (projectId: number) => {
  router.push(`/researcher/project/${projectId}`);
};

// 处理新建项目
const handleNewProject = () => {
  router.push('/researcher/projects/create');
};

// 处理PIR查询
const handleQueryData = () => {
  router.push('/researcher/analytics');
};

// 处理导出数据
const handleExportData = async () => {
  try {
    message.loading('正在导出数据...');
    const blob = await exportAnonymizedRecords();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `匿名健康记录_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    message.success('数据导出成功');
  } catch (error) {
    console.error('导出数据失败:', error);
    message.error('导出数据失败');
  }
};

// 处理数据分析
const handleAnalyzeData = () => {
  router.push('/researcher/analytics');
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
.dashboard-card {
  margin-bottom: 16px;
  height: 100%;
}

.stats-card {
  height: 100%;
}

.researcher-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.researcher-info h3 {
  margin-bottom: 8px;
}

.researcher-info p {
  margin-bottom: 4px;
  width: 100%;
  text-align: left;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.project-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 16px;
}
</style> 