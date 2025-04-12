<template>
  <div class="add-record-container">
    <a-page-header
      title="添加健康记录"
      @back="goBack"
    />
    
    <a-form
      :model="formState"
      layout="vertical"
      ref="formRef"
    >
      <a-row :gutter="16">
        <a-col :span="16">
          <a-card title="基本信息">
            <a-form-item name="record_data.title" label="记录标题">
              <a-input
                v-model:value="formState.record_data.title"
                placeholder="请输入记录标题"
                :maxLength="100"
                show-count
              />
            </a-form-item>
            
            <a-form-item name="record_data.record_type" label="记录类型">
              <a-select
                v-model:value="formState.record_data.record_type"
                placeholder="请选择记录类型"
                style="width: 100%"
                @change="handleRecordTypeChange"
              >
                <a-select-option v-for="type in recordTypeOptions" :key="type.value" :value="type.value">
                  {{ type.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
            
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item name="record_data.record_date" label="记录日期">
                  <a-date-picker
                    v-model:value="recordDate"
                    style="width: 100%"
                    :disabledDate="disabledDate"
                    @change="handleDateChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="visibility" label="可见性">
                  <a-select
                    v-model:value="formState.record_data.visibility"
                    placeholder="请选择记录可见性"
                  >
                    <a-select-option :value="RecordVisibility.PRIVATE">仅自己可见</a-select-option>
                    <a-select-option :value="RecordVisibility.PUBLIC">所有人可见</a-select-option>
                    <a-select-option :value="RecordVisibility.DOCTOR">医生可见</a-select-option>
                    <a-select-option :value="RecordVisibility.RESEARCHER">研究人员可见</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item name="institution" label="医疗机构">
                  <a-input
                    v-model:value="formState.record_data.institution"
                    placeholder="请输入医疗机构名称"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="doctor_name" label="医生姓名">
                  <a-input
                    v-model:value="formState.record_data.doctor_name"
                    placeholder="请输入医生姓名"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-form-item name="description" label="记录描述">
              <a-textarea
                v-model:value="formState.record_data.description"
                placeholder="请输入记录描述"
                :rows="4"
                :maxLength="500"
                show-count
              />
            </a-form-item>
            
            <a-form-item name="tags" label="标签">
              <a-select
                v-model:value="tags"
                mode="tags"
                style="width: 100%"
                placeholder="输入标签，回车确认"
                @change="handleTagsChange"
              >
                <a-select-option v-for="tag in tagOptions" :key="tag" :value="tag">
                  {{ tag }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-card>
          
          <!-- 用药记录特定字段 -->
          <a-card v-if="formState.record_data.record_type === RecordType.MEDICATION" title="用药信息" style="margin-top: 16px">
            <a-form-item name="record_data.medication.medication_name" label="药物名称">
              <a-input
                v-model:value="formState.record_data.medication.medication_name"
                placeholder="请输入药物名称"
              />
            </a-form-item>
            
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item name="dosage" label="剂量">
                  <a-input
                    v-model:value="formState.record_data.medication.dosage"
                    placeholder="请输入剂量，如100mg"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="frequency" label="频率">
                  <a-input
                    v-model:value="formState.record_data.medication.frequency"
                    placeholder="请输入用药频率，如每日三次"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item name="start_date" label="开始日期">
                  <a-date-picker
                    v-model:value="medicationStartDate"
                    style="width: 100%"
                    @change="handleMedicationStartDateChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="end_date" label="结束日期">
                  <a-date-picker
                    v-model:value="medicationEndDate"
                    style="width: 100%"
                    :disabled-date="disabledEndDate"
                    @change="handleMedicationEndDateChange"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-form-item name="instructions" label="用药说明">
              <a-textarea
                v-model:value="formState.record_data.medication.instructions"
                placeholder="请输入用药说明"
                :rows="3"
              />
            </a-form-item>
            
            <a-form-item name="side_effects" label="副作用">
              <a-textarea
                v-model:value="formState.record_data.medication.side_effects"
                placeholder="请输入可能的副作用"
                :rows="3"
              />
            </a-form-item>
          </a-card>
        </a-col>
        
        <a-col :span="8">
          <a-card title="文件上传">
            <p>上传相关医疗文件(可选)</p>
            <a-upload
              v-model:file-list="fileList"
              :before-upload="beforeUpload"
              @remove="handleRemove"
              multiple
              list-type="picture"
            >
              <a-button>
                <upload-outlined /> 选择文件
              </a-button>
              <template #itemRender="{ file }">
                <a-card size="small" style="margin-bottom: 8px">
                  <template #title>
                    <div style="display: flex; align-items: center">
                      <file-outlined style="margin-right: 8px" />
                      <div style="overflow: hidden; text-overflow: ellipsis">{{ file.name }}</div>
                    </div>
                  </template>
                  <template #extra>
                    <a-button type="text" danger @click="() => handleRemove(file)">
                      <delete-outlined />
                    </a-button>
                  </template>
                  <div>
                    <div>大小: {{ formatFileSize(file.size || 0) }}</div>
                    <a-input 
                      placeholder="添加文件描述" 
                      style="margin-top: 8px"
                      v-model:value="file.description"
                    />
                  </div>
                </a-card>
              </template>
            </a-upload>
            <a-alert
              style="margin-top: 16px"
              message="支持上传PDF、图片、Word和Excel文件，单个文件不超过10MB"
              type="info"
              show-icon
            />
          </a-card>
          
          <a-card title="隐私保护" style="margin-top: 16px">
            <a-form-item>
              <a-switch
                v-model:checked="pirProtected"
                checked-children="启用PIR隐私保护"
                un-checked-children="未启用PIR保护"
              />
              <div style="margin-top: 8px; color: rgba(0, 0, 0, 0.45); font-size: 14px">
                启用PIR技术保护您的健康记录，提高数据隐私安全性
              </div>
            </a-form-item>
            
            <a-divider />
            
            <div style="text-align: center; padding: 16px 0">
              <a-button type="primary" size="large" :loading="submitting" block @click="handleSubmit">
                保存记录
              </a-button>
              <a-button style="margin-top: 16px" block @click="goBack">
                取消
              </a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import dayjs from 'dayjs';
import { 
  UploadOutlined,
  FileOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';
import { createHealthRecord } from '@/api/health';
import { RecordType, RecordVisibility, type CreateRecordRequest, type MedicationInfo } from '@/types/health';

// Define an extended version of record data with required medication
interface ExtendedRecordData {
  title: string;
  record_type: RecordType;
  description: string;
  record_date: string;
  institution: string;
  doctor_name: string;
  visibility: RecordVisibility;
  tags: string;
  medication: MedicationInfo; // Required, not optional
}

// Define our own extended request type
interface ExtendedCreateRecordRequest {
  record_data: ExtendedRecordData;
  files?: File[];
  file_description?: string;
}

const router = useRouter();
const formRef = ref<FormInstance>();
const submitting = ref(false);
const pirProtected = ref(true);

// 表单状态
const formState = reactive<ExtendedCreateRecordRequest>({
  record_data: {
    title: '',
    record_type: RecordType.GENERAL,
    description: '',
    record_date: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS'),
    institution: '',
    doctor_name: '',
    visibility: RecordVisibility.PRIVATE,
    tags: '',
    medication: {
      medication_name: '',
      dosage: '',
      frequency: '',
      start_date: '',
      end_date: '',
      instructions: '',
      side_effects: ''
    }
  },
  files: [],
  file_description: ''
});

// 记录类型选项
const recordTypeOptions = [
  { label: '常规检查', value: RecordType.GENERAL },
  { label: '实验室检查', value: RecordType.LABORATORY },
  { label: '用药记录', value: RecordType.MEDICATION },
  { label: '影像检查', value: RecordType.IMAGING },
  { label: '生命体征', value: RecordType.VITAL_SIGNS },
  { label: '手术记录', value: RecordType.SURGERY },
  { label: '疫苗接种', value: RecordType.VACCINATION },
  { label: '过敏记录', value: RecordType.ALLERGY },
  { label: '诊断结果', value: RecordType.DIAGNOSIS },
  { label: '其他记录', value: RecordType.OTHER }
];

// 表单验证规则
const rules = {};

// 文件列表
const fileList = ref<any[]>([]);

// 日期选择器值
const recordDate = ref<dayjs.Dayjs>(dayjs());
const medicationStartDate = ref<dayjs.Dayjs | null>(null);
const medicationEndDate = ref<dayjs.Dayjs | null>(null);

// 标签
const tags = ref<string[]>([]);
const tagOptions = ref<string[]>(['医院检查', '年度体检', '慢性病', '急诊', '定期复查', '预防接种']);

// 日期选择器禁用日期（不能选择未来日期）
const disabledDate = (current: dayjs.Dayjs) => {
  return current && current > dayjs().endOf('day');
};

// 禁用结束日期（不能早于开始日期）
const disabledEndDate = (current: dayjs.Dayjs) => {
  return medicationStartDate.value 
    ? current && current < medicationStartDate.value.startOf('day')
    : false;
};

// 处理日期变化
const handleDateChange = (value: dayjs.Dayjs | null) => {
  if (value) {
    formState.record_data.record_date = value.format('YYYY-MM-DDTHH:mm:ss.SSS');
  } else {
    formState.record_data.record_date = '';
  }
};

// 处理用药开始日期变化
const handleMedicationStartDateChange = (value: dayjs.Dayjs | null) => {
  if (value) {
    formState.record_data.medication.start_date = value.format('YYYY-MM-DDTHH:mm:ss.SSS');
  } else {
    formState.record_data.medication.start_date = '';
  }
};

// 处理用药结束日期变化
const handleMedicationEndDateChange = (value: dayjs.Dayjs | null) => {
  if (value) {
    formState.record_data.medication.end_date = value.format('YYYY-MM-DDTHH:mm:ss.SSS');
  } else {
    formState.record_data.medication.end_date = '';
  }
};

// 处理记录类型变化
const handleRecordTypeChange = (value: RecordType) => {
  // 不需要检查medication是否存在，因为在formState初始化时已经创建
  if (value === RecordType.MEDICATION) {
    // 可以重置medication字段为默认值
    formState.record_data.medication = {
      medication_name: '',
      dosage: '',
      frequency: '',
      start_date: '',
      end_date: '',
      instructions: '',
      side_effects: ''
    };
  }
};

// 处理标签变化
const handleTagsChange = (values: string[]) => {
  formState.record_data.tags = values.join(',');
};

// 上传前校验
const beforeUpload = (file: File) => {
  const isValidType = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ].includes(file.type);

  if (!isValidType) {
    message.error('只能上传PDF、图片、Word、Excel或文本文件!');
  }

  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件必须小于10MB!');
  }

  // 添加description属性供后续使用
  (file as any).description = '';

  return isValidType && isLt10M;
};

// 移除文件
const handleRemove = (file: any) => {
  const index = fileList.value.indexOf(file);
  const newFileList = fileList.value.slice();
  newFileList.splice(index, 1);
  fileList.value = newFileList;
};

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

// 提交表单
const handleSubmit = async () => {
  try {
    submitting.value = true;
    
    // 准备文件描述
    const fileDescriptions = fileList.value.map(file => file.description || '').join('|');
    formState.file_description = fileDescriptions;
    
    // 准备文件
    formState.files = fileList.value.map(file => file.originFileObj);
    
    // 将扩展类型转换为API期望的类型
    const apiRequest: CreateRecordRequest = {
      record_data: formState.record_data,
      files: formState.files,
      file_description: formState.file_description
    };
    
    // 提交请求
    const response = await createHealthRecord(apiRequest);
    
    if (response.success) {
      message.success('健康记录创建成功');
      // 返回记录列表
      router.push('/patient/records');
    } else {
      message.error(response.message || '创建记录失败');
    }
  } catch (error) {
    console.error('创建记录失败:', error);
    message.error('创建记录失败');
  } finally {
    submitting.value = false;
  }
};

// 返回
const goBack = () => {
  router.back();
};

// 初始化
onMounted(() => {
  // 初始化记录日期为今天
  recordDate.value = dayjs();
  formState.record_data.record_date = dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS');
});
</script>

<style scoped>
.add-record-container {
  width: 100%;
}
</style> 