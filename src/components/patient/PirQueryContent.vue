<template>
  <div class="pir-container">
    <div class="pir-header">
      <h1>隐私保护查询 (PIR)</h1>
      <a-tooltip title="了解更多关于PIR技术">
        <a-button type="link" @click="showPirInfoModal = true">
          <question-circle-outlined /> 什么是PIR?
        </a-button>
      </a-tooltip>
    </div>
    
    <a-card class="pir-intro">
      <div class="pir-intro-content">
        <div>
          <h3>隐私保护查询 (Private Information Retrieval)</h3>
          <p>使用PIR技术查询您的健康记录，确保您的查询意图和结果不会被服务器或第三方获知。</p>
          <ul>
            <li><check-outlined /> 保护查询的隐私性</li>
            <li><check-outlined /> 防止查询模式分析</li>
            <li><check-outlined /> 增强医疗数据保密性</li>
          </ul>
        </div>
        <div class="privacy-score">
          <a-progress
            type="dashboard"
            :percent="stats.privacy_score || 0"
            :format="percent => `${percent}分`"
            :stroke-color="privacyScoreColor"
          />
          <div class="score-text">隐私保护评分</div>
        </div>
      </div>
    </a-card>
    
    <!-- 隐私查询表单 -->
    <a-card title="执行隐私查询" class="query-form-card">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :xs="24" :md="8">
            <a-form-item label="关键字">
              <a-input 
                v-model:value="queryParams.keyword" 
                placeholder="输入查询关键字"
                allow-clear
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="记录类型">
              <a-select
                v-model:value="queryParams.record_type"
                placeholder="选择记录类型"
                allow-clear
              >
                <a-select-option v-for="type in recordTypes" :key="type" :value="type">
                  {{ type }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="日期范围">
              <a-range-picker 
                v-model:value="dateRange" 
                style="width: 100%"
                :placeholder="['开始日期', '结束日期']"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-divider />
        
        <a-row>
          <a-col :span="24">
            <h4>隐私保护级别</h4>
            <a-form-item>
              <a-radio-group v-model:value="privacyLevel" button-style="solid">
                <a-radio-button value="low">低</a-radio-button>
                <a-radio-button value="medium">中</a-radio-button>
                <a-radio-button value="high">高</a-radio-button>
              </a-radio-group>
              <div class="privacy-level-hint">
                <info-circle-outlined />
                <span>
                  {{ 
                    privacyLevel === 'high' 
                      ? '高级别保护: 最大程度保护隐私，但查询速度可能较慢' 
                      : privacyLevel === 'medium' 
                        ? '中级别保护: 平衡隐私保护与性能' 
                        : '低级别保护: 基本隐私保护，查询速度更快' 
                  }}
                </span>
              </div>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item>
          <a-button 
            type="primary" 
            :loading="loading" 
            @click="executeQuery" 
            block
          >
            执行隐私查询
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
    
    <!-- 查询结果 -->
    <a-card title="查询结果" :loading="loading" class="results-card">
      <div v-if="showResultMetadata && metadata" class="metadata-box">
        <a-descriptions bordered size="small">
          <a-descriptions-item label="查询状态" :span="3">
            <a-tag color="success">成功</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="处理记录数量">
            {{ metadata.records_processed || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="匹配记录数量">
            {{ metadata.matches_found || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="混淆查询数">
            {{ metadata.noise_queries || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="隐私保护级别">
            <a-tag :color="privacyLevelColor">{{ metadata.obfuscation_level || '中' }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="查询向量大小">
            {{ metadata.query_vector_size || 'N/A' }}
          </a-descriptions-item>
          <a-descriptions-item label="PIR状态">
            <a-badge :status="metadata.pir_enabled ? 'success' : 'default'" :text="metadata.pir_enabled ? '启用' : '禁用'" />
          </a-descriptions-item>
        </a-descriptions>
        <a-button type="link" @click="showResultMetadata = false">隐藏详情</a-button>
      </div>
      <a-button v-else type="link" @click="showResultMetadata = true">显示查询详情</a-button>
      
      <div class="results-table">
        <a-empty v-if="!results.length" description="暂无查询结果" />
        <a-table 
          v-else 
          :columns="columns" 
          :data-source="results" 
          :pagination="{ pageSize: 5 }"
          :row-key="record => record.id || record._id"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <a @click="handleViewRecord(record)">{{ record.title }}</a>
            </template>
            <template v-else-if="column.key === 'record_type'">
              <a-tag :color="getTypeColor(record.record_type)">
                {{ record.record_type }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'date'">
              {{ formatDate(record.date || record.created_at) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a @click="handleViewRecord(record)">查看</a>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </a-card>
    
    <!-- 查询历史 -->
    <a-card title="隐私查询历史" class="history-card">
      <a-list
        :data-source="queryHistory"
        item-layout="horizontal"
        :pagination="{ pageSize: 5 }"
      >
        <template v-if="!queryHistory.length">
          <a-empty description="暂无查询历史" />
        </template>
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta>
              <template #title>
                <div class="history-item-title">
                  <span>{{ item.query_type }}</span>
                  <a-tag color="blue">{{ formatDate(item.timestamp) }}</a-tag>
                </div>
              </template>
              <template #description>
                <div>
                  <div>参数: {{ formatParams(item.parameters) }}</div>
                  <div>结果数量: {{ item.result_count }}</div>
                </div>
              </template>
              <template #avatar>
                <a-avatar style="background-color: #87d068">
                  <template #icon>
                    <safety-outlined />
                  </template>
                </a-avatar>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
    
    <!-- PIR信息弹窗 -->
    <a-modal
      v-model:visible="showPirInfoModal"
      title="什么是隐私保护查询 (PIR)"
      :footer="null"
      width="700px"
    >
      <div class="pir-info-modal">
        <h3>隐私保护查询技术简介</h3>
        <p>
          隐私保护查询（Private Information Retrieval，简称PIR）是一种允许用户从数据库中检索数据的同时隐藏查询内容的密码学技术。
          在医疗健康领域，PIR技术尤为重要，可以有效防止敏感信息泄露。
        </p>
        
        <h4>PIR技术的关键特点：</h4>
        <ul>
          <li><strong>查询隐私：</strong> 服务器无法知道您查询的确切内容</li>
          <li><strong>结果隐私：</strong> 仅有您能解密和查看查询结果</li>
          <li><strong>查询混淆：</strong> 使用伪查询和噪声查询混淆真实查询意图</li>
          <li><strong>同态加密：</strong> 数据在加密状态下进行处理，无需解密</li>
        </ul>
        
        <h4>本系统使用的PIR实现方式：</h4>
        <ol>
          <li>客户端创建加密的查询向量</li>
          <li>服务器处理加密查询，不知道具体查询内容</li>
          <li>服务器返回加密结果</li>
          <li>客户端解密结果并显示</li>
        </ol>
        
        <h4>隐私保护级别：</h4>
        <ul>
          <li><strong>低级别：</strong> 基本查询模式混淆，适合性能敏感场景</li>
          <li><strong>中级别：</strong> 增加噪声查询，平衡性能与隐私</li>
          <li><strong>高级别：</strong> 最强密码保护，使用完整同态加密，但性能较低</li>
        </ul>
        
        <p>
          通过使用PIR技术，即使服务器管理员或潜在的攻击者也无法知道您查询了哪些健康记录，
          保护了您的医疗信息隐私。
        </p>
      </div>
    </a-modal>
    
    <!-- 记录详情抽屉 -->
    <a-drawer
      title="记录详情"
      placement="right"
      :open="showRecordDrawer"
      @close="showRecordDrawer = false"
      width="640"
    >
      <template v-if="currentRecord">
        <a-descriptions bordered>
          <a-descriptions-item label="标题" :span="3">
            {{ currentRecord.title }}
          </a-descriptions-item>
          <a-descriptions-item label="记录类型">
            <a-tag :color="getTypeColor(currentRecord.record_type)">
              {{ currentRecord.record_type }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="日期">
            {{ formatDate(currentRecord.date || currentRecord.created_at) }}
          </a-descriptions-item>
          <a-descriptions-item label="隐私设置">
            <a-tag :color="currentRecord.is_private ? 'red' : 'green'">
              {{ currentRecord.is_private ? '私密' : '共享' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="描述" :span="3">
            {{ currentRecord.description || '无描述' }}
          </a-descriptions-item>
          <a-descriptions-item label="医生姓名" v-if="currentRecord.doctor_name">
            {{ currentRecord.doctor_name }}
          </a-descriptions-item>
          <a-descriptions-item label="医疗机构" v-if="currentRecord.hospital">
            {{ currentRecord.hospital }}
          </a-descriptions-item>
          <a-descriptions-item label="科室" v-if="currentRecord.department">
            {{ currentRecord.department }}
          </a-descriptions-item>
          <a-descriptions-item label="诊断" v-if="currentRecord.diagnosis" :span="3">
            {{ currentRecord.diagnosis }}
          </a-descriptions-item>
          <a-descriptions-item label="治疗方案" v-if="currentRecord.treatment" :span="3">
            {{ currentRecord.treatment }}
          </a-descriptions-item>
          <a-descriptions-item label="用药" v-if="currentRecord.medication" :span="3">
            {{ currentRecord.medication }}
          </a-descriptions-item>
          <a-descriptions-item label="备注" v-if="currentRecord.notes" :span="3">
            {{ currentRecord.notes }}
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  QuestionCircleOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  SafetyOutlined
} from '@ant-design/icons-vue';
import {
  advancedPirQuery,
  getSearchFilters,
  getPirStatistics,
  getPirHistory
} from '@/api/health-records';
import type {
  HealthRecord,
  PirHistoryItem
} from '@/types/health-records';

// 查询参数和结果
const loading = ref(false);
const queryParams = reactive({
  keyword: '',
  record_type: undefined as string | undefined,
  start_date: undefined as string | undefined,
  end_date: undefined as string | undefined
});
const dateRange = ref<any>(null);
const privacyLevel = ref<'low' | 'medium' | 'high'>('medium');
const results = ref<HealthRecord[]>([]);
const metadata = ref<any>(null);
const showResultMetadata = ref(false);

// 查询历史
const queryHistory = ref<PirHistoryItem[]>([]);

// 统计数据
const stats = ref<any>({});

// 记录类型选项
const recordTypes = ref<string[]>([]);

// 模态框和抽屉控制
const showPirInfoModal = ref(false);
const showRecordDrawer = ref(false);
const currentRecord = ref<HealthRecord | null>(null);

// 表格列定义
const columns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true
  },
  {
    title: '记录类型',
    dataIndex: 'record_type',
    key: 'record_type'
  },
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date'
  },
  {
    title: '操作',
    key: 'action',
    width: 80
  }
];

// 隐私评分颜色
const privacyScoreColor = computed(() => {
  const score = stats.value.privacy_score || 0;
  if (score >= 80) return '#52c41a'; // 绿色
  if (score >= 60) return '#faad14'; // 黄色
  return '#f5222d'; // 红色
});

// 隐私级别颜色
const privacyLevelColor = computed(() => {
  const level = metadata.value?.obfuscation_level || privacyLevel.value;
  if (level === 'high') return 'green';
  if (level === 'medium') return 'blue';
  return 'orange';
});

// 执行隐私查询
const executeQuery = async () => {
  if (!queryParams.keyword && !queryParams.record_type && !dateRange.value) {
    message.warning('请至少输入一个查询条件');
    return;
  }
  
  // 处理日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.start_date = dateRange.value[0].format('YYYY-MM-DD');
    queryParams.end_date = dateRange.value[1].format('YYYY-MM-DD');
  } else {
    queryParams.start_date = undefined;
    queryParams.end_date = undefined;
  }
  
  loading.value = true;
  
  try {
    // 构建查询请求
    const request = {
      query: queryParams.keyword,
      record_types: queryParams.record_type ? [queryParams.record_type] : undefined,
      date_from: queryParams.start_date,
      date_to: queryParams.end_date,
      privacy_level: privacyLevel.value
    };
    
    const response = await advancedPirQuery(request);
    
    if (response.success && response.data) {
      results.value = response.data.records || [];
      metadata.value = response.data.metadata || {};
      showResultMetadata.value = true;
      
      message.success(`查询完成，找到 ${results.value.length} 条记录`);
      
      // 查询完成后更新查询历史和统计数据
      fetchPirHistory();
      fetchPirStatistics();
    } else {
      message.error(response.message || '查询失败');
    }
  } catch (error) {
    console.error('执行PIR查询失败:', error);
    message.error('执行隐私查询失败');
  } finally {
    loading.value = false;
  }
};

// 获取筛选选项
const fetchFilterOptions = async () => {
  try {
    const response = await getSearchFilters();
    if (response.success && response.data) {
      recordTypes.value = response.data.record_types || [];
    }
  } catch (error) {
    console.error('获取筛选选项失败:', error);
  }
};

// 获取PIR统计数据
const fetchPirStatistics = async () => {
  try {
    const response = await getPirStatistics();
    if (response.success && response.data) {
      stats.value = response.data;
    }
  } catch (error) {
    console.error('获取PIR统计数据失败:', error);
  }
};

// 获取PIR查询历史
const fetchPirHistory = async () => {
  try {
    const response = await getPirHistory();
    if (response.success && response.data) {
      queryHistory.value = response.data;
    }
  } catch (error) {
    console.error('获取PIR查询历史失败:', error);
  }
};

// 查看记录详情
const handleViewRecord = (record: HealthRecord) => {
  currentRecord.value = record;
  showRecordDrawer.value = true;
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD');
};

// 格式化查询参数
const formatParams = (params: any) => {
  if (!params) return '无';
  
  const paramArray = [];
  if (params.query) paramArray.push(`关键词: ${params.query}`);
  if (params.record_type) paramArray.push(`类型: ${params.record_type}`);
  if (params.start_date) paramArray.push(`开始日期: ${params.start_date}`);
  if (params.end_date) paramArray.push(`结束日期: ${params.end_date}`);
  
  return paramArray.length > 0 ? paramArray.join(', ') : '无';
};

// 根据记录类型获取颜色
const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    medication: 'green',
    examination: 'blue',
    diagnosis: 'orange',
    treatment: 'purple',
    allergy: 'magenta',
    immunization: 'cyan',
    lab_result: 'gold',
    vital_signs: 'geekblue'
  };
  
  return colorMap[type] || 'blue';
};

// 组件挂载时获取数据
onMounted(() => {
  fetchFilterOptions();
  fetchPirStatistics();
  fetchPirHistory();
});
</script>

<style scoped>
.pir-container {
  padding: 0 12px;
}

.pir-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pir-intro {
  margin-bottom: 24px;
}

.pir-intro-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-form-card {
  margin-bottom: 24px;
}

.results-card {
  margin-bottom: 24px;
}

.history-card {
  margin-bottom: 24px;
}

.privacy-score {
  text-align: center;
  padding: 12px;
}

.score-text {
  font-weight: bold;
  margin-top: 8px;
}

.privacy-level-hint {
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  gap: 8px;
}

.metadata-box {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.history-item-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-table {
  margin-top: 16px;
}

.pir-info-modal {
  max-height: 70vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .pir-intro-content {
    flex-direction: column;
    gap: 24px;
  }
}
</style> 