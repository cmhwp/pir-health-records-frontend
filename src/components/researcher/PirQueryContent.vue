<template>
  <div class="pir-query-content">
    <a-card class="pir-card">
      <template #title>
        <div class="card-title">
          <span>隐私保护信息检索查询</span>
        </div>
      </template>

      <a-alert
        type="info"
        show-icon
        class="info-alert"
        message="PIR查询说明"
        description="隐私保护信息检索(Private Information Retrieval)允许在不泄露您查询内容的情况下从服务器获取数据。这种方法能有效保护查询敏感信息时的隐私。"
      />

      <a-divider />
      
      <a-form :model="queryForm" layout="vertical">
        <a-form-item label="PIR协议">
          <a-select v-model:value="queryForm.pir_protocol">
            <a-select-option value="SealPIR">SealPIR</a-select-option>
            <a-select-option value="FastPIR">FastPIR</a-select-option>
            <a-select-option value="SimplePIR">SimplePIR</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="批量查询ID列表">
          <a-textarea
            v-model:value="queryForm.queryIds"
            :rows="4"
            placeholder="请输入要查询的ID，每行一个。ID将会被加密后发送至服务器。"
          />
          <div class="example-text">
            <p>示例：输入数字ID进行测试（如1、2、3等），每行一个。系统会自动进行加密。</p>
          </div>
        </a-form-item>

        <a-form-item label="查询类型">
          <a-radio-group v-model:value="queryForm.queryType">
            <a-radio value="direct">直接查询</a-radio>
            <a-radio value="encrypted">加密查询ID</a-radio>
          </a-radio-group>
          <div class="example-text">
            <p>直接查询：将输入的ID加密后发送</p>
            <p>加密查询ID：如果ID已经加密（例如ENC_MQ==_xxxx格式），则直接发送</p>
          </div>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" :loading="loading" @click="executePIRQuery">
            执行PIR查询
          </a-button>
          <a-button style="margin-left: 8px" @click="resetForm">
            重置
          </a-button>
          <a-button style="margin-left: 8px" @click="fillTestData">
            填充测试数据
          </a-button>
        </a-form-item>
      </a-form>

      <a-divider />

      <!-- 查询结果展示 -->
      <div v-if="queryResults.length > 0">
        <h3>查询结果</h3>
        <a-table 
          :columns="resultColumns" 
          :data-source="queryResults" 
          rowKey="id"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'result'">
              <a-tooltip placement="topLeft" :title="record.encrypted_result">
                <span class="encrypted-result">{{ truncateString(record.encrypted_result, 30) }}</span>
              </a-tooltip>
            </template>
            <template v-if="column.key === 'record_id'">
              <a-tooltip placement="topLeft" :title="record.matched_record_id">
                <span class="record-id">{{ truncateString(record.matched_record_id, 15) }}</span>
              </a-tooltip>
            </template>
            <template v-if="column.key === 'actions'">
              <a-space>
              <a-button type="link" @click="decryptResult(record)">解密结果</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 解密结果弹窗 -->
      <a-modal
        v-model:visible="showDecryptResultModal"
        title="PIR查询解密结果"
        width="800px"
        :footer="null"
        @cancel="handleCloseResultModal"
      >
        <a-spin :spinning="keyLoading">
          <!-- 密钥输入区域 -->
          <div v-if="!decryptData" class="key-input-container mb-4">
            <a-input-password
              v-model:value="decryptKey"
              placeholder="请输入解密密钥"
              style="flex: 1"
              :disabled="keyLoading"
            />
            <a-button 
              type="primary" 
              class="get-key-btn" 
              :loading="keyLoading" 
              @click="getDecryptKey"
            >
              获取密钥
            </a-button>
          </div>
          
          <!-- 解密按钮 -->
          <div v-if="!decryptData" class="mb-4">
            <a-button type="primary" :loading="keyLoading" @click="handleDecrypt">
              解密数据
            </a-button>
            <div v-if="decryptKey" class="key-hint mt-4">
              <p>提示：请确保您有权限访问此条记录，解密过程将被记录</p>
            </div>
          </div>

          <a-tabs v-if="decryptData" v-model:activeKey="activeTabKey">
            <a-tab-pane key="1" tab="基本信息">
              <div v-if="decryptData">
                <!-- 记录基本信息 -->
                <a-card v-if="decryptData.record_data" title="健康记录信息" class="mb-4">
                  <a-descriptions bordered>
                    <a-descriptions-item label="记录ID" span="3">
                      {{ decryptData.record_data.id }}
                    </a-descriptions-item>
                    <a-descriptions-item label="标题" span="3">
                      {{ decryptData.record_data.title }}
                    </a-descriptions-item>
                    <a-descriptions-item label="记录类型" span="1">
                      <a-tag color="blue">{{ decryptData?.record_data ? getRecordTypeName(decryptData.record_data.record_type) : '' }}</a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="记录日期" span="2">
                      {{ new Date(decryptData.record_data.record_date).toLocaleString() }}
                    </a-descriptions-item>
                    <a-descriptions-item label="医疗机构" span="2">
                      <a-tag color="green">{{ decryptData.record_data.institution }}</a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="医生姓名" span="1">
                      {{ decryptData.record_data.doctor_name }}
                    </a-descriptions-item>
                  </a-descriptions>
                  
                  <div class="record-summary mt-4" v-if="decryptData.diagnosis">
                    <h4 class="font-medium text-base mb-2">诊断摘要</h4>
                    <a-alert type="info" show-icon>
                      <template #message>诊断信息</template>
                      <template #description>
                        {{ decryptData.diagnosis }}
                      </template>
                    </a-alert>
                  </div>
                </a-card>
                
                <!-- 特征统计信息 -->
                <a-card title="特征统计" class="mb-4">
                  <a-descriptions bordered>
                    <a-descriptions-item label="维度" span="1">
                      {{ decryptData.length }}
                    </a-descriptions-item>
                    <a-descriptions-item label="平均值" span="1">
                      {{ decryptData.mean?.toFixed(2) }}
                    </a-descriptions-item>
                    <a-descriptions-item label="中位数" span="1">
                      {{ decryptData.median?.toFixed(2) }}
                    </a-descriptions-item>
                    <a-descriptions-item label="最大值" span="1">
                      {{ decryptData.max }}
                    </a-descriptions-item>
                    <a-descriptions-item label="最小值" span="1">
                      {{ decryptData.min }}
                    </a-descriptions-item>
                    <a-descriptions-item label="标准差" span="1">
                      {{ decryptData.std_dev?.toFixed(2) }}
                    </a-descriptions-item>
                    <a-descriptions-item label="非零特征数" span="3">
                      {{ decryptData.non_zero_count }} / {{ decryptData.length }}
                      ({{ ((decryptData.non_zero_count / decryptData.length) * 100).toFixed(2) }}%)
                    </a-descriptions-item>
                  </a-descriptions>
                </a-card>
                
                <!-- 数据洞察 -->
                <a-card v-if="decryptData.pattern_recognition" title="数据洞察" class="mb-4">
                  <a-list bordered>
                    <a-list-item v-for="(insight, index) in decryptData.pattern_recognition" :key="index">
                      {{ insight }}
                    </a-list-item>
                  </a-list>
                </a-card>
                
                <!-- 特定记录类型信息 -->
                <a-card v-if="decryptData.record_features" title="特征详情" class="mb-4">
                  <!-- 药物信息 -->
                  <template v-if="decryptData.record_data?.record_type === 'medication'">
                    <a-descriptions bordered>
                      <a-descriptions-item label="药物名称" span="2">
                        {{ decryptData.record_features.medication_name }}
                      </a-descriptions-item>
                      <a-descriptions-item label="剂量" span="1">
                        {{ decryptData.record_features.dosage }}
                      </a-descriptions-item>
                    </a-descriptions>
                  </template>
                  
                  <!-- 生命体征信息 -->
                  <template v-if="decryptData.record_data?.record_type === 'vital_signs'">
                    <a-table 
                      :columns="[
                        { title: '类型', dataIndex: 'type', key: 'type' },
                        { title: '数值', dataIndex: 'value', key: 'value' },
                        { title: '单位', dataIndex: 'unit', key: 'unit' }
                      ]" 
                      :data-source="decryptData.record_features.vital_signs" 
                      :pagination="false"
                      size="small"
                    />
                  </template>
                </a-card>
              </div>
              <a-empty v-else description="无解密数据" />
            </a-tab-pane>
            
            <a-tab-pane key="2" tab="特征分析">
              <div v-if="decryptData && decryptData.feature_analysis">
                <!-- 特征分析结果 -->
                <a-card title="特征重要性分析" class="mb-4">
                  <a-descriptions bordered>
                    <a-descriptions-item label="零值比例" span="1">
                      {{ (decryptData.feature_analysis.pattern_analysis.zero_ratio * 100).toFixed(2) }}%
                    </a-descriptions-item>
                    <a-descriptions-item label="正值比例" span="1">
                      {{ (decryptData.feature_analysis.pattern_analysis.positive_ratio * 100).toFixed(2) }}%
                    </a-descriptions-item>
                    <a-descriptions-item label="负值比例" span="1">
                      {{ (decryptData.feature_analysis.pattern_analysis.negative_ratio * 100).toFixed(2) }}%
                    </a-descriptions-item>
                    <a-descriptions-item label="信息熵" span="3">
                      {{ decryptData.feature_analysis.pattern_analysis.entropy?.toFixed(4) }}
                    </a-descriptions-item>
                  </a-descriptions>
                  
                  <h3 class="mt-4 mb-2">主要特征比例</h3>
                  <div style="height: 300px;">
                    <div id="featureChart" ref="featureChart" style="width: 100%; height: 100%;"></div>
                  </div>
                  
                  <h3 class="mt-4 mb-2">主要统计相关性</h3>
                  <div v-if="decryptData.feature_analysis.correlations && decryptData.feature_analysis.correlations.length > 0" style="max-height: 300px; overflow-y: auto;">
                    <a-table 
                      :columns="[
                        { title: '统计指标', dataIndex: 'metric', key: 'metric' },
                        { title: '相关系数', dataIndex: 'correlation', key: 'correlation' }
                      ]" 
                      :data-source="decryptData.feature_analysis.correlations" 
                      :pagination="false"
                      size="small"
                    />
                  </div>
                  <div v-else>
                    <a-alert type="info" show-icon>
                      <template #message>统计相关性数据</template>
                      <template #description>
                        <p>此数据集中未提供特征间的相关性分析，但您可以关注以下统计特性：</p>
                        <a-descriptions bordered size="small" :column="2">
                          <a-descriptions-item label="标准差">
                            {{ decryptData.feature_analysis.statistical_properties.std_dev.toFixed(2) }}
                          </a-descriptions-item>
                          <a-descriptions-item label="熵值">
                            {{ decryptData.feature_analysis.pattern_analysis.entropy.toFixed(4) }}
                          </a-descriptions-item>
                          <a-descriptions-item label="非零值比例">
                            {{ (decryptData.feature_analysis.pattern_analysis.positive_ratio * 100).toFixed(2) }}%
                          </a-descriptions-item>
                          <a-descriptions-item label="零值比例">
                            {{ (decryptData.feature_analysis.pattern_analysis.zero_ratio * 100).toFixed(2) }}%
                          </a-descriptions-item>
                        </a-descriptions>
                      </template>
                    </a-alert>
                  </div>
                </a-card>
              </div>
              <a-empty v-else description="无特征分析数据" />
            </a-tab-pane>
            
            <a-tab-pane key="3" tab="相似记录">
              <div v-if="decryptData && decryptData.similar_records && decryptData.similar_records.length > 0">
                <a-card title="相似健康记录" class="mb-4">
                  <a-alert type="info" show-icon class="mb-4">
                    <template #message>相似度说明</template>
                    <template #description>
                      下列健康记录与当前解密的记录具有相似的特征向量。相似度越高，表明记录的特征模式越接近。
                    </template>
                  </a-alert>
                  
                  <a-list bordered>
                    <a-list-item v-for="(record, index) in decryptData.similar_records" :key="index">
                      <a-list-item-meta>
                        <template #title>
                          <div class="flex justify-between items-center">
                            <span>
                              <a-tag color="purple">ID: {{ record.id }}</a-tag> 
                              {{ record.title || '无标题记录' }}
                            </span>
                            <a-tag color="blue">相似度: {{ formatSimilarity(record.similarity) }}</a-tag>
                          </div>
                        </template>
                        <template #description>
                          <div class="record-meta-info">
                            <a-row :gutter="16">
                              <a-col :span="8">
                                <p><strong>记录类型:</strong> <a-tag color="cyan">{{ getRecordTypeName(record.record_type) }}</a-tag></p>
                              </a-col>
                              <a-col :span="8">
                                <p><strong>记录日期:</strong> {{ formatDate(record.record_date) }}</p>
                              </a-col>
                              <a-col :span="8">
                                <p><strong>医疗机构:</strong> {{ record.institution }}</p>
                              </a-col>
                            </a-row>
                          </div>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </a-list>
                </a-card>
              </div>
              <a-empty v-else description="未找到相似记录" />
            </a-tab-pane>
            
            <a-tab-pane key="4" tab="原始数据">
              <a-card title="特征向量可视化" class="mb-4">
                <div class="data-info mb-2" v-if="decryptData?.data_type">
                  <a-tag color="blue">数据类型: {{ decryptData.data_type }}</a-tag>
                  <a-tag color="green">维度: {{ decryptData.length }}</a-tag>
                  <a-tag color="orange">非零特征数: {{ decryptData.non_zero_count }}</a-tag>
                </div>
                
                <!-- 向量直方图 -->
                <div class="vector-visualization mb-4">
                  <div style="height: 240px; overflow-x: auto;">
                    <div class="vector-bar-container">
                      <div 
                        v-for="(value, index) in decryptData?.data" 
                        :key="index" 
                        class="vector-bar"
                        :style="{
                          height: `${Math.max(4, (value / decryptData.max) * 100)}%`,
                          backgroundColor: value > decryptData.mean ? '#1890ff' : '#52c41a'
                        }"
                        :title="`特征${index+1}: ${value}`"
                      ></div>
                    </div>
                  </div>
                  <div class="vector-legend mt-2 flex items-center justify-center">
                    <div class="legend-item mr-4">
                      <span class="legend-color" style="background-color: #1890ff;"></span>
                      <span class="legend-text">高于平均值的特征</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-color" style="background-color: #52c41a;"></span>
                      <span class="legend-text">低于平均值的特征</span>
                    </div>
                  </div>
                </div>
                
                <div style="max-height: 400px; overflow-y: auto;">
                  <pre class="bg-gray-100 p-4 rounded">{{ JSON.stringify(decryptData?.data, null, 2) }}</pre>
                </div>
                <div class="mt-4 data-analysis-hint" v-if="decryptData?.data.length > 0">
                  <p>
                    <strong>数据分析:</strong> 该向量包含{{ decryptData.length }}个特征值，
                    平均值为{{ decryptData.mean.toFixed(2) }}，
                    最大值{{ decryptData.max }}，最小值{{ decryptData.min }}。
                    标准差为{{ decryptData.std_dev.toFixed(2) }}，表示数据的分散程度。
                  </p>
                </div>
              </a-card>
              
              <a-card title="完整解密结果" class="mb-4">
                <a-alert 
                  v-if="decryptData?.pattern_recognition && decryptData.pattern_recognition.length > 0" 
                  type="info" 
                  show-icon 
                  class="mb-4"
                >
                  <template #message>数据洞察</template>
                  <template #description>
                    <ul class="pl-4">
                      <li v-for="(insight, idx) in decryptData.pattern_recognition" :key="idx">
                        {{ insight }}
                      </li>
                    </ul>
                  </template>
                </a-alert>
                <div style="max-height: 400px; overflow-y: auto;">
                  <pre class="bg-gray-100 p-4 rounded">{{ decryptedResult }}</pre>
                </div>
              </a-card>
            </a-tab-pane>
          </a-tabs>
        </a-spin>
      </a-modal>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { batchPIRQuery, decryptPIRResult, getPIRDecryptKey } from '@/api/researcher';
import type { BatchPIRQueryRequest, BatchPIRQueryResponse } from '@/types/researcher';
import * as echarts from 'echarts';
import { useRecordTypes } from '@/hooks/useRecordTypes';

// 在组件顶部调用useRecordTypes，获取返回的函数
const { getRecordTypeName } = useRecordTypes();

// 查询表单
const queryForm = reactive({
  pir_protocol: 'SealPIR',
  queryIds: '',
  queryType: 'direct'
});

// 状态变量
const loading = ref<boolean>(false);
const queryResults = ref<any[]>([]);
const showDecryptResultModal = ref(false);
const activeTabKey = ref('1');
const decryptData = ref<{
  data: number[],
  data_type: string,
  mean: number,
  median: number,
  max: number,
  min: number,
  std_dev: number,
  non_zero_count: number,
  length: number,
  feature_analysis?: {
    vector_dimension: number,
    statistical_properties: {
      mean: number,
      median: number,
      std_dev: number,
      max: number,
      min: number
    },
    pattern_analysis: {
      zero_ratio: number,
      positive_ratio: number,
      negative_ratio: number,
      entropy: number
    },
    correlations?: Array<{
      metric: string,
      correlation: number
    }>,
    similar_records?: Array<{
      id: string,
      similarity: number,
      record_type: string,
      title: string,
      institution: string,
      record_date: string
    }>
  },
  record_data?: {
    id: string,
    title: string,
    record_type: string,
    record_date: string,
    institution: string,
    doctor_name: string
  },
  record_features?: any,
  diagnosis?: string,
  similar_records?: Array<{
    id: string,
    similarity: number,
    record_type: string,
    title: string,
    institution: string,
    record_date: string
  }>,
  pattern_recognition?: string[]
} | null>(null);

// 解密结果分析相关
const parsedDecryptedData = ref<any>(null);
const vectorAnalysisResult = ref<any>(null);

// 添加当前结果、解密结果和解密密钥的状态变量
const currentResult = ref<any>(null);
const decryptedResult = ref<string>('');
const decryptKey = ref<string>('');

// 添加状态变量
const keyLoading = ref<boolean>(false);

// 结果表格列定义
const resultColumns = [
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 80,
    customRender: ({ index }: { index: number }) => index + 1
  },
  {
    title: '查询ID',
    dataIndex: ['metadata', 'query_id'],
    key: 'query_id',
    width: 120
  },
  {
    title: '协议',
    dataIndex: 'protocol',
    key: 'protocol',
    width: 120
  },
  {
    title: '时间戳',
    dataIndex: ['metadata', 'timestamp'],
    key: 'timestamp',
    width: 180,
    customRender: ({ text }: { text: string }) => {
      return new Date(text).toLocaleString();
    }
  },
  {
    title: '记录ID',
    dataIndex: 'matched_record_id',
    key: 'record_id',
    width: 200,
    ellipsis: true
  },
  {
    title: '加密结果',
    dataIndex: 'encrypted_result',
    key: 'result',
    ellipsis: true
  },
  {
    title: '操作',
    key: 'actions',
    width: 120
  }
];

// 执行PIR查询
const executePIRQuery = async () => {
  if (!queryForm.queryIds.trim()) {
    message.error('请输入要查询的ID列表');
    return;
  }

  loading.value = true;
  try {
    // 解析查询ID
    const queryIds = queryForm.queryIds
      .split('\n')
      .map(id => id.trim())
      .filter(id => id !== '');

    if (queryIds.length === 0) {
      message.error('请输入有效的查询ID');
      loading.value = false;
      return;
    }

    // 准备查询请求参数
    let encryptedIds: string[];
    if (queryForm.queryType === 'direct') {
      // 如果是直接查询，将ID进行简单加密
      encryptedIds = queryIds.map(id => encryptQueryId(id));
    } else {
      // 如果ID已经加密，直接使用
      encryptedIds = queryIds;
    }

    const requestData: BatchPIRQueryRequest = {
      encrypted_query_ids: encryptedIds,
      pir_protocol: queryForm.pir_protocol
    };

    // 发送查询请求
    const response = await batchPIRQuery(requestData);
    console.log(response);
    if (response.success && response.data) {
      message.success('PIR查询执行成功');
      queryResults.value = response.data.results;
    } else {
      message.error(response.message || 'PIR查询失败');
    }
  } catch (error) {
    console.error('PIR查询出错:', error);
    message.error('PIR查询过程中发生错误');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  queryForm.queryIds = '';
  queryForm.pir_protocol = 'SealPIR';
  queryForm.queryType = 'direct';
  queryResults.value = [];
};

// 处理结果解密
const decryptResult = (record: any) => {
  currentResult.value = record;
  decryptedResult.value = '';
  decryptKey.value = '';
  decryptData.value = null; // 重置解密数据
  showDecryptResultModal.value = true;
};

// 处理解密确认
const handleDecrypt = async () => {
  if (!currentResult.value || !currentResult.value.matched_record_id) {
    message.error('无法获取密钥：未找到关联记录ID');
    return;
  }

  // 验证密钥是否存在
  if (!decryptKey.value.trim()) {
    message.error('请先获取或输入解密密钥');
    return;
  }

  const recordId = currentResult.value.matched_record_id;
  keyLoading.value = true;
  
  try {
    const res = await decryptPIRResult(
      currentResult.value.encrypted_result,
      recordId,
      decryptKey.value
    );
    
    console.log(res);
    if (res.success) {
      message.success('解密成功');
      decryptedResult.value = res.data.decrypted_result;
      decryptData.value = res.data.analysis;
      
      // 解密成功后标记状态
      currentResult.value.is_decrypted = true;
      
      // 清空密钥
      decryptKey.value = '';
    } else {
      message.error(res.message || '解密失败');
    }
  } catch (error) {
    console.error('解密失败:', error);
    message.error('解密过程中发生错误');
  } finally {
    keyLoading.value = false;
  }
};

// 绘制特征向量可视化图表
const renderFeatureChart = async () => {
  console.log('开始渲染图表');
  if (!decryptData.value || !decryptData.value.data) {
    console.log('没有数据可渲染');
    return;
  }
  
  // 确保DOM已经更新
  await nextTick();
  
  try {
    const chartDom = document.getElementById('featureChart');
    if (!chartDom) {
      console.error('找不到图表DOM元素');
      return;
    }
    
    // 初始化之前先销毁旧的实例
    let existingChart = echarts.getInstanceByDom(chartDom);
    if (existingChart) {
      existingChart.dispose();
    }
    
    // 初始化新的图表
    const myChart = echarts.init(chartDom);
    console.log('图表实例已创建');
    
    const data = decryptData.value.data;
    
    // 准备数据
    const chartData = data.map((value, index) => {
      return {
        value: Math.abs(value), // 使用绝对值确保值为正
        name: `特征${index+1}`
      };
    });
    
    // 找出最大的5个特征
    const topFeatures = [...chartData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    console.log('图表数据已准备:', topFeatures);
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        top: '5%',
        left: 'center',
        data: topFeatures.map(item => item.name)
      },
      series: [
        {
          name: '特征值分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: topFeatures
        }
      ]
    };
    
    // 设置图表选项
    myChart.setOption(option);
    console.log('图表选项已设置');
    
    // 添加窗口调整事件
    window.addEventListener('resize', () => {
      myChart.resize();
    });
  } catch (error) {
    console.error('渲染图表时出错:', error);
  }
};

// 当解密数据改变时更新图表
watch(() => decryptData.value, (newVal) => {
  if (newVal) {
    console.log('解密数据已更新，准备渲染图表');
    // 在DOM更新后执行图表渲染
    setTimeout(() => {
      renderFeatureChart();
    }, 500);
  }
}, { deep: true });

// 在activeTabKey变化时重新渲染图表
watch(() => activeTabKey.value, (newKey) => {
  if (newKey === '2' && decryptData.value) { // 特征分析标签页
    console.log('切换到特征分析标签页，重新渲染图表');
    setTimeout(() => {
      renderFeatureChart();
    }, 500);
  }
});

// 分析向量数据
const analyzeVectorData = () => {
  if (!parsedDecryptedData.value || !Array.isArray(parsedDecryptedData.value)) {
    message.error('无法分析非向量数据');
    return;
  }
  
  // 如果已经有分析结果，不需要重新计算
  if (vectorAnalysisResult.value) {
    return;
  }
  
  const data = parsedDecryptedData.value;
  const sum = data.reduce((acc: number, val: number) => acc + val, 0);
  const mean = sum / data.length;
  const max = Math.max(...data);
  const min = Math.min(...data);
  
  // 计算标准差
  const squaredDifferences = data.map((val: number) => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((acc: number, val: number) => acc + val, 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  // 统计非零元素数量
  const nonZeroCount = data.filter((val: number) => val !== 0).length;
  
  vectorAnalysisResult.value = {
    mean: mean.toFixed(2),
    max,
    min,
    stdDev: stdDev.toFixed(2),
    nonZeroCount,
    totalElements: data.length
  };
};

// 辅助函数：截断显示字符串
const truncateString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

// 填充测试数据
const fillTestData = () => {
  queryForm.queryIds = '1\n2\n3\n4\n5';
  queryForm.queryType = 'direct';
  queryForm.pir_protocol = 'SealPIR';
  message.info('已填充测试数据，请点击"执行PIR查询"按钮开始测试');
};

// 改进模拟加密查询ID，确保格式一致
const encryptQueryId = (id: string): string => {
  try {
    // 将ID转为字符串并转换为Base64
    const encodedId = btoa(id.toString());
  const prefix = 'ENC_';
  const randomPart = Math.random().toString(36).substring(2, 10);
    return prefix + encodedId + '_' + randomPart;
  } catch (error) {
    console.error('ID加密失败:', error);
    // 如果加密失败，返回一个默认加密格式
    return `ENC_MQ==_${Math.random().toString(36).substring(2, 10)}`;
  }
};

// 复制查询结果到剪贴板
const copyResultToClipboard = (result: string) => {
  navigator.clipboard.writeText(result)
    .then(() => {
      message.success('已复制到剪贴板');
    })
    .catch(() => {
      message.error('复制失败');
    });
};

// 获取解密密钥
const getDecryptKey = async () => {
  if (!currentResult.value || !currentResult.value.matched_record_id) {
    message.error('无法获取密钥：未找到关联记录ID');
    return;
  }
  
  const recordId = currentResult.value.matched_record_id;
  keyLoading.value = true;
  
  try {
    const response = await getPIRDecryptKey(recordId);
    
    if (response.success && response.data && response.data.decrypt_key) {
      decryptKey.value = response.data.decrypt_key;
      message.success('已获取解密密钥');
    } else {
      message.error(response.message || '获取密钥失败');
    }
  } catch (error) {
    console.error('获取密钥失败:', error);
    message.error('获取密钥过程中发生错误');
  } finally {
    keyLoading.value = false;
  }
};

// 添加关闭解密结果模态框的方法
const handleCloseResultModal = () => {
  showDecryptResultModal.value = false;
  decryptData.value = null;
  decryptedResult.value = '';
  decryptKey.value = '';
}

// 格式化相似度为百分比
const formatSimilarity = (similarity: number): string => {
  return (similarity * 100).toFixed(2) + '%';
}

// 格式化日期
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString();
  } catch (e) {
    return dateString;
  }
}
</script>

<style scoped>
.pir-query-content {
  padding: 16px;
}

.pir-card {
  margin-bottom: 24px;
  width: 100%;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-alert {
  margin-bottom: 20px;
}

.encrypted-result {
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
}

.encrypted-data,
.decrypted-data {
  margin-top: 16px;
}

.encrypted-data pre,
.decrypted-data pre {
  max-height: 200px;
  overflow-y: auto;
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.decrypted-data pre {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
}

.data-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.data-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.record-id-container {
  margin-top: 16px;
}

pre {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  margin-top: 4px;
  flex: 1;
}

.example-text {
  margin-top: 4px;
  font-size: 12px;
  color: #888;
}

.example-text p {
  margin-bottom: 2px;
}

.vector-visualization {
  margin: 16px 0;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}

.vector-bar-container {
  display: flex;
  align-items: flex-end;
  height: 120px;
  padding-bottom: 20px;
  border-bottom: 1px solid #d9d9d9;
}

.vector-bar {
  width: 10px;
  min-width: 4px;
  margin: 0 2px;
  background-color: #1890ff;
  transition: all 0.3s;
}

.vector-bar:hover {
  transform: scaleY(1.1);
  box-shadow: 0 0 5px rgba(24, 144, 255, 0.5);
  z-index: 1;
}

.array-explanation {
  margin-bottom: 10px;
  padding: 8px 12px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
}

.vector-analysis-result {
  margin-top: 16px;
  padding: 16px;
  background-color: #f9f0ff;
  border-radius: 4px;
}

.parsed-object-data {
  margin-top: 16px;
}

.parsed-array-data {
  margin-top: 16px;
}

.key-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.get-key-btn {
  flex-shrink: 0;
}

.key-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
  background-color: #f9f0ff;
  padding: 8px;
  border-radius: 4px;
}

.key-hint p {
  margin-bottom: 4px;
}

.mb-4 {
  margin-bottom: 16px;
}
.mt-4 {
  margin-top: 16px;
}
.mb-2 {
  margin-bottom: 8px;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.items-center {
  align-items: center;
}

.legend-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border-radius: 2px;
  vertical-align: middle;
}

.legend-text {
  font-size: 12px;
  color: #666;
}

.legend-item {
  display: flex;
  align-items: center;
}

.vector-bar-container {
  display: flex;
  align-items: flex-end;
  height: 200px;
  padding-bottom: 20px;
  border-bottom: 1px solid #d9d9d9;
  min-width: 100%;
}

.vector-bar {
  width: 10px;
  min-width: 4px;
  margin: 0 2px;
  transition: all 0.3s;
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
}

.vector-bar:hover {
  transform: scaleY(1.1);
  box-shadow: 0 0 5px rgba(24, 144, 255, 0.5);
  z-index: 1;
}

.data-info {
  display: flex;
  gap: 8px;
}

.record-meta-info strong {
  font-weight: 500;
}
</style> 