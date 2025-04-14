<template>
  <div>
    <a-card title="隐私保护查询 (PIR)" class="pir-card">
      <template #extra>
        <a-tooltip title="PIR查询可以保护您的查询内容不被服务器记录，提高患者数据隐私保护">
          <info-circle-outlined />
        </a-tooltip>
      </template>
      
      <a-form layout="vertical" :model="queryForm" @finish="handleSubmit">
        <a-form-item name="patient_id" label="患者" required>
          <a-select
            v-model:value="queryForm.patient_id"
            placeholder="选择患者"
            show-search
            :filter-option="filterPatientOption"
            style="width: 100%"
          >
            <a-select-option v-for="patient in patientsList" :key="patient.id" :value="patient.id">
              {{ patient.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-divider>查询条件（可选）</a-divider>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item name="record_type" label="记录类型">
              <a-select
                v-model:value="queryForm.query_params!.record_type"
                placeholder="选择记录类型"
                allow-clear
              >
                <a-select-option v-for="type in recordTypeOptions" :key="type.value" :value="type.value">
                  {{ type.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="keyword" label="关键词">
              <a-input 
                v-model:value="queryForm.query_params!.keyword" 
                placeholder="输入搜索关键词"
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item name="date_range" label="日期范围">
          <a-range-picker 
            v-model:value="dateRange"
            style="width: 100%"
            @change="handleDateRangeChange"
            allowClear
          />
        </a-form-item>
        
        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="loading">
              <safety-outlined /> 执行PIR查询
            </a-button>
            <a-button @click="resetForm">
              <clear-outlined /> 重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
      
      <a-divider v-if="queryResults.length > 0" />
      
      <!-- 查询结果 -->
      <div v-if="queryResults.length > 0" class="results-container">
        <h3>查询结果 ({{ queryResults.length }})</h3>
        <a-list item-layout="vertical" :data-source="queryResults">
          <template #renderItem="{ item }">
            <a-list-item>
              <template #actions>
                <a @click="viewRecord(item)">
                  <eye-outlined /> 查看
                </a>
                <a v-if="item.is_encrypted" @click="showDecryptModal(item)">
                  <unlock-outlined /> 解密
                </a>
              </template>
              <a-list-item-meta
                :title="item.title"
                :description="`记录日期: ${formatDate(item.record_date)} | 类型: ${getRecordTypeLabel(item.record_type)}`"
              >
                <template #avatar>
                  <a-avatar :style="{backgroundColor: getRecordTypeColor(item.record_type)}">
                    {{ getRecordTypeInitial(item.record_type) }}
                  </a-avatar>
                </template>
              </a-list-item-meta>
              <div>
                <a-space>
                  <a-tag :color="item.is_encrypted ? 'green' : 'blue'">
                    {{ item.is_encrypted ? '已加密' : '未加密' }}
                  </a-tag>
                  <a-tag color="orange" v-if="item.doctor_name">
                    {{ item.doctor_name }}
                  </a-tag>
                </a-space>
                <div class="record-content" v-if="!item.is_encrypted && item.description">
                  {{ truncateText(item.description, 200) }}
                </div>
                <div class="record-content" v-else-if="item.is_encrypted">
                  <a-alert 
                    type="info" 
                    message="记录已加密，需要解密密钥才能查看详细内容" 
                    banner 
                  />
                </div>
              </div>
            </a-list-item>
          </template>
        </a-list>
      </div>
      
      <a-empty v-else-if="hasSearched" description="未找到匹配的记录" />
    </a-card>
    
    <!-- 查看记录模态框 -->
    <a-modal
      v-model:visible="viewModalVisible"
      title="查看健康记录"
      width="700px"
      :footer="null"
    >
      <view-record-detail 
        :record="currentRecord" 
        @close="viewModalVisible = false" 
      />
    </a-modal>
    
    <!-- 解密记录模态框 -->
    <a-modal
      v-model:visible="decryptModalVisible"
      title="解密健康记录"
      :footer="null"
    >
      <a-form layout="vertical">
        <a-form-item label="解密密钥" required>
          <a-input-password v-model:value="decryptKey" placeholder="请输入解密密钥" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" :loading="decrypting" @click="handleDecryptRecord">解密</a-button>
          <a-button style="margin-left: 8px" @click="decryptModalVisible = false">取消</a-button>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  InfoCircleOutlined, 
  SafetyOutlined, 
  ClearOutlined,
  EyeOutlined,
  UnlockOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { pirQueryPatientRecords, decryptRecord as decryptRecordApi, getDoctorPatients } from '@/api/doctor';
import type { 
  PIRQueryPatientRequest, 
  PIRQueryPatientResponse,
  DecryptRecordRequest,
  Patient
} from '@/types/doctor';
import ViewRecordDetail from './ViewRecordDetail.vue';

// 确保query_params始终存在
const queryForm = reactive<PIRQueryPatientRequest>({
  patient_id: undefined as number | undefined,
  query_params: {
    record_type: undefined,
    keyword: undefined,
    start_date: undefined,
    end_date: undefined
  }
});

// 状态变量
const loading = ref(false);
const patientsList = ref<any[]>([]);
const queryResults = ref<any[]>([]);
const hasSearched = ref(false);
const dateRange = ref<[Dayjs, Dayjs] | null>(null);

// 模态框状态
const viewModalVisible = ref(false);
const decryptModalVisible = ref(false);
const currentRecord = ref<any>(null);
const decryptKey = ref('');
const decrypting = ref(false);

// 记录类型选项
const recordTypeOptions = [
  { label: '一般记录', value: 'general' },
  { label: '实验室检查', value: 'laboratory' },
  { label: '药物治疗', value: 'medication' },
  { label: '影像检查', value: 'imaging' },
  { label: '生命体征', value: 'vital_signs' },
  { label: '手术记录', value: 'surgery' },
  { label: '疫苗接种', value: 'vaccination' },
  { label: '过敏记录', value: 'allergy' },
  { label: '诊断记录', value: 'diagnosis' },
  { label: '其他', value: 'other' },
];

// 初始化
onMounted(() => {
  loadPatients();
});

// 加载患者列表
const loadPatients = async () => {
  try {
    const response = await getDoctorPatients();
    if (response.success && response.data) {
      patientsList.value = response.data.patients.map(patient => ({
        id: patient.id,
        name: patient.name
      }));
    } else {
      message.error('获取患者列表失败');
    }
  } catch (error: any) {
    console.error('获取患者列表失败:', error);
    message.error('获取患者列表失败，请稍后重试');
  }
};

// 过滤患者选项
const filterPatientOption = (input: string, option: any) => {
  return option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 处理日期范围变化
const handleDateRangeChange = (dates: [Dayjs, Dayjs] | null) => {
  if (dates) {
    queryForm.query_params!.start_date = dates[0].format('YYYY-MM-DD');
    queryForm.query_params!.end_date = dates[1].format('YYYY-MM-DD');
  } else {
    queryForm.query_params!.start_date = undefined;
    queryForm.query_params!.end_date = undefined;
  }
};

// 重置表单
const resetForm = () => {
  queryForm.query_params!.record_type = undefined;
  queryForm.query_params!.keyword = undefined;
  queryForm.query_params!.start_date = undefined;
  queryForm.query_params!.end_date = undefined;
  dateRange.value = null;
};

// 执行查询
const handleSubmit = async () => {
  if (!queryForm.patient_id) {
    message.error('请选择患者');
    return;
  }
  
  loading.value = true;
  try {
    const response = await pirQueryPatientRecords(queryForm);
    if (response.success && response.data) {
      queryResults.value = response.data.records;
      hasSearched.value = true;
      
      if (queryResults.value.length === 0) {
        message.info('未找到匹配的记录');
      }
    } else {
      message.error(response.message || '查询失败');
    }
  } catch (error: any) {
    message.error(error.message || '查询过程发生错误');
  } finally {
    loading.value = false;
  }
};

// 查看记录
const viewRecord = (record: any) => {
  currentRecord.value = record;
  viewModalVisible.value = true;
};

// 显示解密模态框
const showDecryptModal = (record: any) => {
  currentRecord.value = record;
  decryptKey.value = '';
  decryptModalVisible.value = true;
};

// 解密记录
const handleDecryptRecord = async () => {
  if (!decryptKey.value) {
    message.error('请输入解密密钥');
    return;
  }
  
  decrypting.value = true;
  try {
    const response = await decryptRecordApi(currentRecord.value.id, { encryption_key: decryptKey.value });
    if (response.success && response.data) {
      message.success('解密成功');
      decryptModalVisible.value = false;
      // 更新记录并显示
      currentRecord.value = response.data.record;
      viewModalVisible.value = true;
    } else {
      message.error(response.message || '解密失败');
    }
  } catch (error: any) {
    message.error(error.message || '解密过程发生错误');
  } finally {
    decrypting.value = false;
  }
};

// 格式化日期
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '未设置';
  return dayjs(dateString).format('YYYY-MM-DD');
};

// 获取记录类型颜色
const getRecordTypeColor = (type: string) => {
  const colorMap: { [key: string]: string } = {
    general: '#1890ff',
    laboratory: '#13c2c2',
    medication: '#fa8c16',
    imaging: '#722ed1',
    vital_signs: '#52c41a',
    surgery: '#f5222d',
    vaccination: '#faad14',
    allergy: '#eb2f96',
    diagnosis: '#fa541c',
    other: '#d9d9d9'
  };
  return colorMap[type] || '#d9d9d9';
};

// 获取记录类型首字母
const getRecordTypeInitial = (type: string) => {
  const initialMap: { [key: string]: string } = {
    general: 'G',
    laboratory: 'L',
    medication: 'M',
    imaging: 'I',
    vital_signs: 'V',
    surgery: 'S',
    vaccination: 'V',
    allergy: 'A',
    diagnosis: 'D',
    other: 'O'
  };
  return initialMap[type] || '?';
};

// 获取记录类型标签
const getRecordTypeLabel = (type: string) => {
  const labelMap: { [key: string]: string } = {
    general: '一般记录',
    laboratory: '实验室检查',
    medication: '药物治疗',
    imaging: '影像检查',
    vital_signs: '生命体征',
    surgery: '手术记录',
    vaccination: '疫苗接种',
    allergy: '过敏记录',
    diagnosis: '诊断记录',
    other: '其他'
  };
  return labelMap[type] || type;
};

// 截断文本
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};
</script>

<style scoped>
.pir-card {
  margin-bottom: 20px;
}

.results-container {
  margin-top: 16px;
}

.record-content {
  margin-top: 12px;
}
</style> 