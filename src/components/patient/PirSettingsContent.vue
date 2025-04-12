  <template>
  <div class="pir-settings-container">
    <a-row :gutter="16">
      <a-col :span="16">
        <a-card title="隐私保护设置" :loading="loading">
          <a-form
            layout="vertical"
            :model="settings"
            ref="formRef"
          >
            <a-form-item name="pir_enabled" label="启用PIR技术">
              <a-switch 
                v-model:checked="settings.pir_enabled"
                :disabled="submitting"
              />
              <div style="margin-top: 8px; color: rgba(0, 0, 0, 0.45)">
                启用PIR (Private Information Retrieval) 技术会为您的健康数据查询提供额外保护，防止服务器推断您的真实查询意图
              </div>
            </a-form-item>
            
            <a-form-item name="max_noise_queries" label="混淆查询数量">
              <a-slider
                v-model:value="settings.max_noise_queries"
                :min="0"
                :max="10"
                :step="1"
                :marks="noiseMarks"
                :disabled="!settings.pir_enabled || submitting"
              />
              <div style="margin-top: 8px; color: rgba(0, 0, 0, 0.45)">
                混淆查询数量越多，隐私保护级别越高，但查询效率会降低。当前设置: {{ settings.max_noise_queries }} 个混淆查询
              </div>
            </a-form-item>
            
            <a-form-item name="encryption_strength" label="加密强度">
              <a-radio-group 
                v-model:value="settings.encryption_strength"
                :disabled="!settings.pir_enabled || submitting"
              >
                <a-radio value="low">低 (更快)</a-radio>
                <a-radio value="medium">中等</a-radio>
                <a-radio value="high">高 (更安全)</a-radio>
              </a-radio-group>
              <div style="margin-top: 8px; color: rgba(0, 0, 0, 0.45)">
                较高的加密强度提供更好的隐私保护，但会增加查询时间
              </div>
            </a-form-item>
            
            <a-form-item>
              <a-button type="primary" :loading="submitting" @click="saveSettings">
                保存设置
              </a-button>
              <a-button style="margin-left: 8px" @click="resetSettings" :disabled="submitting">
                重置
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
        
        <a-card title="隐私建议" style="margin-top: 16px" :loading="loading">
          <a-list size="small" bordered>
            <a-list-item v-if="recommendations.use_pir !== undefined">
              <template #actions>
                <a @click="applyRecommendation('use_pir')">应用</a>
              </template>
              <a-list-item-meta>
                <template #title>
                  <span :style="{ color: recommendations.use_pir ? '#52c41a' : '#f5222d' }">
                    {{ recommendations.use_pir ? '维持PIR开启状态' : '建议开启PIR保护' }}
                  </span>
                </template>
                <template #description>
                  {{ recommendations.use_pir ? '您已启用PIR技术，为您的健康数据提供良好保护' : '开启PIR技术以提高您的健康数据查询隐私' }}
                </template>
                <template #avatar>
                  <a-avatar :style="{ backgroundColor: recommendations.use_pir ? '#52c41a' : '#f5222d', color: '#fff' }">
                    {{ recommendations.use_pir ? '✓' : '!' }}
                  </a-avatar>
                </template>
              </a-list-item-meta>
            </a-list-item>
            
            <a-list-item v-if="recommendations.increase_noise !== undefined">
              <template #actions>
                <a @click="applyRecommendation('increase_noise')">应用</a>
              </template>
              <a-list-item-meta>
                <template #title>
                  <span :style="{ color: !recommendations.increase_noise ? '#52c41a' : '#faad14' }">
                    {{ !recommendations.increase_noise ? '混淆查询数量合适' : '建议增加混淆查询数量' }}
                  </span>
                </template>
                <template #description>
                  {{ !recommendations.increase_noise ? '当前混淆查询数量设置提供了良好的保护' : '增加混淆查询数量可以提高查询的隐私保护级别' }}
                </template>
                <template #avatar>
                  <a-avatar :style="{ backgroundColor: !recommendations.increase_noise ? '#52c41a' : '#faad14', color: '#fff' }">
                    {{ !recommendations.increase_noise ? '✓' : '!' }}
                  </a-avatar>
                </template>
              </a-list-item-meta>
            </a-list-item>
            
            <a-list-item v-if="recommendations.increase_encryption !== undefined">
              <template #actions>
                <a @click="applyRecommendation('increase_encryption')">应用</a>
              </template>
              <a-list-item-meta>
                <template #title>
                  <span :style="{ color: !recommendations.increase_encryption ? '#52c41a' : '#faad14' }">
                    {{ !recommendations.increase_encryption ? '加密强度合适' : '建议提高加密强度' }}
                  </span>
                </template>
                <template #description>
                  {{ !recommendations.increase_encryption ? '当前加密强度设置提供了良好的保护' : '提高加密强度可以增强您的隐私保护能力' }}
                </template>
                <template #avatar>
                  <a-avatar :style="{ backgroundColor: !recommendations.increase_encryption ? '#52c41a' : '#faad14', color: '#fff' }">
                    {{ !recommendations.increase_encryption ? '✓' : '!' }}
                  </a-avatar>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </a-list>
        </a-card>
      </a-col>
      
      <a-col :span="8">
        <a-card title="隐私保护评分" :loading="loading">
          <div style="text-align: center; padding: 20px 0">
            <a-progress type="dashboard" :percent="privacyScore" :format="format" :stroke-color="privacyScoreColor" />
            <div style="margin-top: 12px">{{ privacyRating }}</div>
          </div>
          
          <a-divider />
          
          <a-statistic
            title="查询总数"
            :value="statistics.total_queries"
            style="margin-bottom: 16px"
          />
          
          <a-row :gutter="16">
            <a-col :span="12">
              <a-statistic
                title="PIR查询"
                :value="statistics.pir_queries"
                style="margin-bottom: 16px"
              />
            </a-col>
            <a-col :span="12">
              <a-statistic
                title="PIR使用率"
                :value="statistics.pir_usage_ratio"
                :precision="2"
                suffix="%"
                style="margin-bottom: 16px"
              />
            </a-col>
          </a-row>
          
          <a-card title="查询类型分布" size="small" style="margin-top: 16px">
            <div ref="queryTypesChart" style="height: 200px"></div>
          </a-card>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import { PieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { getPirSettings, updatePirSettings } from '@/api/health';
import type { PIRSettings, PIRSettingsResponse, UpdatePIRSettingsRequest } from '@/types/health';

// 注册 ECharts 组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  PieChart,
  LabelLayout,
  CanvasRenderer
]);

// 表单引用
const formRef = ref<FormInstance>();

// 数据加载状态
const loading = ref(true);
const submitting = ref(false);

// PIR设置
const settings = reactive<PIRSettings>({
  pir_enabled: true,
  max_noise_queries: 3,
  encryption_strength: 'medium'
});

// 备份初始设置用于重置
const initialSettings = ref<PIRSettings>({
  pir_enabled: true,
  max_noise_queries: 3,
  encryption_strength: 'medium'
});

// 统计数据
const statistics = reactive({
  total_queries: 0,
  pir_queries: 0,
  pir_usage_ratio: 0,
  privacy_score: 0
});

// 系统推荐
const recommendations = reactive({
  use_pir: true,
  increase_noise: false,
  increase_encryption: false
});

// 隐私评分
const privacyScore = computed(() => statistics.privacy_score);

// 隐私评分颜色
const privacyScoreColor = computed(() => {
  if (privacyScore.value <= 40) return '#f5222d';
  if (privacyScore.value <= 70) return '#faad14';
  return '#52c41a';
});

// 隐私评级
const privacyRating = computed(() => {
  if (privacyScore.value <= 40) return '隐私保护级别：弱';
  if (privacyScore.value <= 70) return '隐私保护级别：中';
  return '隐私保护级别：强';
});

// 混淆查询数量的标记
const noiseMarks = {
  0: '0',
  5: '5',
  10: '10'
};

// 处理隐私评分显示格式
const format = (percent: number) => {
  return `${percent}`;
};

// 获取PIR设置
const fetchPirSettings = async () => {
  loading.value = true;
  try {
    const response = await getPirSettings();
    if (response.success && response.data) {
      // 更新设置
      Object.assign(settings, response.data.settings);
      
      // 如果PIR功能启用但混淆查询数量为null，设置一个默认值
      if (settings.pir_enabled && settings.max_noise_queries === null) {
        settings.max_noise_queries = 3; // 设置默认值为3
      }
      
      // 备份初始设置
      initialSettings.value = { ...response.data.settings };
      // 处理备份设置中的同样情况
      if (initialSettings.value.pir_enabled && initialSettings.value.max_noise_queries === null) {
        initialSettings.value.max_noise_queries = 3;
      }
      
      // 更新统计数据
      statistics.total_queries = response.data.statistics.total_queries;
      statistics.pir_queries = response.data.statistics.pir_queries;
      statistics.pir_usage_ratio = response.data.statistics.pir_usage_ratio;
      statistics.privacy_score = response.data.statistics.privacy_score;
      
      // 更新推荐
      Object.assign(recommendations, response.data.recommendations);
      
      // 渲染图表
      await nextTick();
      renderQueryTypesChart();
    }
  } catch (error) {
    console.error('获取PIR设置失败:', error);
    message.error('获取PIR设置失败');
  } finally {
    loading.value = false;
  }
};

// 保存PIR设置
const saveSettings = async () => {
  submitting.value = true;
  try {
    const updatedSettings: UpdatePIRSettingsRequest = {
      pir_enabled: settings.pir_enabled,
      max_noise_queries: settings.max_noise_queries,
      encryption_strength: settings.encryption_strength
    };
    
    const response = await updatePirSettings(updatedSettings);
    if (response.success) {
      message.success('PIR设置已更新');
      console.log('已成功保存设置:', updatedSettings);
      
      // 更新备份以便重置
      initialSettings.value = { ...settings };
      
      // 注意: 不再调用fetchPirSettings重新获取设置
      // 因为后端返回的max_noise_queries可能为null，保留当前页面设置值
    } else {
      message.error(response.message || '更新设置失败');
    }
  } catch (error) {
    console.error('更新PIR设置失败:', error);
    message.error('更新设置失败');
  } finally {
    submitting.value = false;
  }
};

// 重置设置
const resetSettings = () => {
  Object.assign(settings, initialSettings.value);
};

// 应用推荐设置
const applyRecommendation = (key: string) => {
  switch (key) {
    case 'use_pir':
      if (!settings.pir_enabled) {
        settings.pir_enabled = true;
        message.info('已应用推荐: 启用PIR保护');
      }
      break;
    case 'increase_noise':
      if (settings.max_noise_queries < 5) {
        settings.max_noise_queries = 5;
        message.info('已应用推荐: 增加混淆查询数量');
      }
      break;
    case 'increase_encryption':
      if (settings.encryption_strength !== 'high') {
        settings.encryption_strength = 'high';
        message.info('已应用推荐: 提高加密强度');
      }
      break;
  }
};

// 渲染查询类型分布图
const renderQueryTypesChart = () => {
  const chartDom = document.getElementById('queryTypesChart');
  if (!chartDom) return;
  
  const chart = echarts.init(chartDom);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 0,
      left: 'center',
      data: ['PIR查询', '普通查询']
    },
    series: [
      {
        name: '查询类型',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: statistics.pir_queries, name: 'PIR查询', itemStyle: { color: '#1890ff' } },
          { value: statistics.total_queries - statistics.pir_queries, name: '普通查询', itemStyle: { color: '#bfbfbf' } }
        ]
      }
    ]
  };
  
  chart.setOption(option);
};

// 初始化
onMounted(async () => {
  await fetchPirSettings();
  
  // 监听窗口大小变化，调整图表尺寸
  window.addEventListener('resize', function() {
    const chartDom = document.getElementById('queryTypesChart');
    if (chartDom) {
      const chart = echarts.getInstanceByDom(chartDom);
      if (chart) {
        chart.resize();
      }
    }
  });
});
</script>

<style scoped>
.pir-settings-container {
  width: 100%;
}
</style> 