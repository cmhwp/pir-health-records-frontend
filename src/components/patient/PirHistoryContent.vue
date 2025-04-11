<template>
  <div>
    <a-page-header
      title="查询历史"
      sub-title="查看您的隐私查询历史记录"
    />
    
    <a-card style="margin-top: 16px">
      <a-form layout="inline" style="margin-bottom: 16px">
        <a-form-item label="时间范围">
          <a-range-picker
            v-model:value="dateRange"
            style="width: 260px"
            @change="handleDateRangeChange"
          />
        </a-form-item>
        <a-form-item label="查询类型">
          <a-select
            v-model:value="queryType"
            style="width: 180px"
            placeholder="选择查询类型"
            @change="handleFilterChange"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="disease">疾病查询</a-select-option>
            <a-select-option value="medication">药物查询</a-select-option>
            <a-select-option value="symptom">症状查询</a-select-option>
            <a-select-option value="treatment">治疗方案</a-select-option>
            <a-select-option value="other">其他查询</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleFilterChange">
            筛选
          </a-button>
          <a-button style="margin-left: 8px" @click="resetFilters">
            重置
          </a-button>
        </a-form-item>
      </a-form>
      
      <a-alert
        v-if="!queries.length && !loading"
        message="暂无查询历史记录"
        description="您还没有进行过隐私查询，或者符合条件的查询已被清除。"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />
      
      <a-spin :spinning="loading">
        <a-list
          v-if="queries.length"
          item-layout="horizontal"
          :data-source="queries"
          :pagination="{
            pageSize: 10,
            total: total,
            current: current,
            onChange: handlePageChange,
            showTotal: total => `共 ${total} 条查询`
          }"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :description="getQueryDescription(item)">
                <template #title>
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <span>{{ item.query_text }}</span>
                    <a-tag :color="getQueryTypeColor(item.query_type)">
                      {{ getQueryTypeName(item.query_type) }}
                    </a-tag>
                  </div>
                </template>
                <template #avatar>
                  <a-avatar :style="{ backgroundColor: getQueryTypeColor(item.query_type) }">
                    {{ getQueryTypeIcon(item.query_type) }}
                  </a-avatar>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a @click="viewQueryDetails(item)">详情</a>
                <a @click="repeatQuery(item)">重新查询</a>
                <a-popconfirm
                  title="确定要删除这条查询记录吗?"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="deleteQuery(item)"
                >
                  <a>删除</a>
                </a-popconfirm>
              </template>
              <div class="query-time">{{ formatDate(item.query_time) }}</div>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>
      
      <a-divider style="margin-top: 24px" />
      
      <div style="display: flex; justify-content: space-between; align-items: center">
        <a-button @click="exportQueryHistory" :loading="exporting">
          <template #icon><download-outlined /></template>
          导出查询历史
        </a-button>
        <a-popconfirm
          title="确定要清除所有查询历史吗? 此操作不可恢复!"
          ok-text="确定"
          cancel-text="取消"
          @confirm="clearAllHistory"
        >
          <a-button danger>
            <template #icon><delete-outlined /></template>
            清除所有查询历史
          </a-button>
        </a-popconfirm>
      </div>
    </a-card>
    
    <!-- 查询详情模态框 -->
    <a-modal
      v-model:visible="detailModalVisible"
      title="查询详情"
      width="800px"
      :footer="null"
    >
      <template v-if="currentQuery">
        <a-descriptions bordered>
          <a-descriptions-item label="查询时间" span="3">
            {{ formatDate(currentQuery.query_time, true) }}
          </a-descriptions-item>
          <a-descriptions-item label="查询内容" span="3">
            {{ currentQuery.query_text }}
          </a-descriptions-item>
          <a-descriptions-item label="查询类型">
            {{ getQueryTypeName(currentQuery.query_type) }}
          </a-descriptions-item>
          <a-descriptions-item label="查询状态">
            <a-tag :color="getStatusColor(currentQuery.status)">
              {{ getStatusText(currentQuery.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="匿名查询">
            {{ currentQuery.is_anonymous ? '是' : '否' }}
          </a-descriptions-item>
          <a-descriptions-item label="PIR服务器" span="3">
            {{ currentQuery.pir_server }}
          </a-descriptions-item>
          <a-descriptions-item label="安全级别">
            {{ getSecurityLevelText(currentQuery.security_level) }}
          </a-descriptions-item>
          <a-descriptions-item label="查询耗时">
            {{ currentQuery.query_duration }} 毫秒
          </a-descriptions-item>
          <a-descriptions-item label="数据量">
            {{ formatDataSize(currentQuery.data_size) }}
          </a-descriptions-item>
        </a-descriptions>
        
        <a-divider orientation="left">查询参数</a-divider>
        
        <div v-if="currentQuery.parameters && currentQuery.parameters.length">
          <a-table
            :dataSource="currentQuery.parameters"
            :columns="paramColumns"
            :pagination="false"
            size="small"
          />
        </div>
        <a-empty v-else description="无查询参数" />
        
        <a-divider orientation="left">查询结果摘要</a-divider>
        
        <div v-if="currentQuery.result_summary">
          <a-alert
            :message="currentQuery.result_summary"
            type="info"
            show-icon
            style="margin-bottom: 16px"
          />
          
          <a-collapse v-if="currentQuery.result_details">
            <a-collapse-panel key="1" header="查看完整结果">
              <pre style="max-height: 300px; overflow: auto; background: #f5f5f5; padding: 8px; border-radius: 4px">{{ currentQuery.result_details }}</pre>
            </a-collapse-panel>
          </a-collapse>
        </div>
        <a-empty v-else description="无可用结果" />
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { 
  getPirQueryHistory, 
  getPirQueryDetails,
  deletePirQuery, 
  clearAllPirQueries,
  repeatPirQuery,
  exportPirQueryHistory
} from '@/api/pir-queries';

// 状态变量
const loading = ref(false);
const exporting = ref(false);
const dateRange = ref([]);
const queryType = ref('');
const queries = ref([]);
const total = ref(0);
const current = ref(1);
const pageSize = ref(10);

// 查询详情相关
const detailModalVisible = ref(false);
const currentQuery = ref(null);

// 查询参数列定义
const paramColumns = [
  {
    title: '参数名',
    dataIndex: 'name',
    key: 'name',
    width: '30%',
  },
  {
    title: '参数值',
    dataIndex: 'value',
    key: 'value',
  }
];

// 获取查询历史
const fetchQueryHistory = async () => {
  loading.value = true;
  try {
    const params = {
      page: current.value,
      pageSize: pageSize.value,
      queryType: queryType.value,
      startDate: dateRange.value && dateRange.value[0] ? dayjs(dateRange.value[0]).format('YYYY-MM-DD') : undefined,
      endDate: dateRange.value && dateRange.value[1] ? dayjs(dateRange.value[1]).format('YYYY-MM-DD') : undefined,
    };
    
    const response = await getPirQueryHistory(params);
    if (response.success && response.data) {
      queries.value = response.data.queries;
      total.value = response.data.total;
    }
  } catch (error) {
    console.error('获取查询历史失败:', error);
    message.error('获取查询历史失败');
  } finally {
    loading.value = false;
  }
};

// 切换页码
const handlePageChange = (page) => {
  current.value = page;
  fetchQueryHistory();
};

// 处理日期范围变化
const handleDateRangeChange = () => {
  // 日期范围变化时不立即触发查询，等待用户点击筛选按钮
  console.log('日期范围已更改:', dateRange.value);
};

// 处理筛选
const handleFilterChange = () => {
  current.value = 1; // 重置到第一页
  fetchQueryHistory();
};

// 重置筛选
const resetFilters = () => {
  dateRange.value = [];
  queryType.value = '';
  current.value = 1;
  fetchQueryHistory();
};

// 查看查询详情
const viewQueryDetails = async (query) => {
  try {
    const response = await getPirQueryDetails(query.id);
    if (response.success && response.data) {
      currentQuery.value = response.data;
      detailModalVisible.value = true;
    }
  } catch (error) {
    console.error('获取查询详情失败:', error);
    message.error('获取查询详情失败');
  }
};

// 重新执行查询
const repeatQuery = async (query) => {
  try {
    const response = await repeatPirQuery(query.id);
    if (response.success) {
      message.success('查询已重新提交，稍后将显示结果');
      setTimeout(() => {
        fetchQueryHistory();
      }, 2000);
    } else {
      message.error(response.message || '重新查询失败');
    }
  } catch (error) {
    console.error('重新查询失败:', error);
    message.error('重新查询失败');
  }
};

// 删除查询
const deleteQuery = async (query) => {
  try {
    const response = await deletePirQuery(query.id);
    if (response.success) {
      message.success('查询记录已删除');
      fetchQueryHistory();
    } else {
      message.error(response.message || '删除查询失败');
    }
  } catch (error) {
    console.error('删除查询失败:', error);
    message.error('删除查询失败');
  }
};

// 导出查询历史
const exportQueryHistory = async () => {
  exporting.value = true;
  try {
    const response = await exportPirQueryHistory();
    if (response.success && response.data) {
      const { download_url } = response.data;
      
      // 创建下载链接
      const a = document.createElement('a');
      a.href = download_url;
      a.download = `pir_query_history_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      message.success('查询历史已导出');
    } else {
      message.error(response.message || '导出查询历史失败');
    }
  } catch (error) {
    console.error('导出查询历史失败:', error);
    message.error('导出查询历史失败');
  } finally {
    exporting.value = false;
  }
};

// 清除所有历史
const clearAllHistory = async () => {
  try {
    const response = await clearAllPirQueries();
    if (response.success) {
      message.success('所有查询历史已清除');
      queries.value = [];
      total.value = 0;
    } else {
      message.error(response.message || '清除查询历史失败');
    }
  } catch (error) {
    console.error('清除查询历史失败:', error);
    message.error('清除查询历史失败');
  }
};

// 工具函数
const formatDate = (dateString, withTime = false) => {
  if (!dateString) return '';
  return withTime 
    ? dayjs(dateString).format('YYYY-MM-DD HH:mm:ss') 
    : dayjs(dateString).format('YYYY-MM-DD');
};

const getQueryTypeName = (type) => {
  const types = {
    'disease': '疾病查询',
    'medication': '药物查询',
    'symptom': '症状查询',
    'treatment': '治疗方案',
    'other': '其他查询'
  };
  return types[type] || '未知类型';
};

const getQueryTypeColor = (type) => {
  const colors = {
    'disease': '#1890ff',
    'medication': '#52c41a',
    'symptom': '#faad14',
    'treatment': '#722ed1',
    'other': '#bfbfbf'
  };
  return colors[type] || '#bfbfbf';
};

const getQueryTypeIcon = (type) => {
  const icons = {
    'disease': 'D',
    'medication': 'M',
    'symptom': 'S',
    'treatment': 'T',
    'other': 'O'
  };
  return icons[type] || '?';
};

const getQueryDescription = (query) => {
  return `${query.description || '无描述'} · ${formatDate(query.query_time)}`;
};

const getStatusText = (status) => {
  const statusMap = {
    'pending': '处理中',
    'completed': '已完成',
    'failed': '失败',
    'canceled': '已取消'
  };
  return statusMap[status] || '未知状态';
};

const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'blue',
    'completed': 'green',
    'failed': 'red',
    'canceled': 'orange'
  };
  return colorMap[status] || 'default';
};

const getSecurityLevelText = (level) => {
  const levelMap = {
    1: '基础',
    2: '标准',
    3: '高级'
  };
  return levelMap[level] || '未知';
};

const formatDataSize = (bytes) => {
  if (!bytes) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  
  return `${bytes.toFixed(2)} ${units[i]}`;
};

onMounted(() => {
  fetchQueryHistory();
});
</script>

<style scoped>
.query-time {
  color: #999;
  font-size: 12px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style> 