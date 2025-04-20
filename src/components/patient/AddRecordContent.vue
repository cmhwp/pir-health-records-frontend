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
                    <a-select-option :value="RecordVisibility.PRIVATE">
                      <span style="font-weight: bold">仅自己可见</span>
                      <span style="display: block; font-size: 12px; color: #888">（最高级别隐私保护，只有您自己可以访问）</span>
                    </a-select-option>
                    <a-select-option :value="RecordVisibility.DOCTOR">
                      <span style="font-weight: bold">医生可见</span>
                      <span style="display: block; font-size: 12px; color: #888">（您和具有医生角色的用户可以访问）</span>
                    </a-select-option>
                    <a-select-option :value="RecordVisibility.RESEARCHER">
                      <span style="font-weight: bold">研究人员可见</span>
                      <span style="display: block; font-size: 12px; color: #888">（您、医生和研究人员可以访问）</span>
                    </a-select-option>
                    <a-select-option :value="RecordVisibility.PUBLIC">
                      <span style="font-weight: bold">所有人可见</span>
                      <span style="display: block; font-size: 12px; color: #888">（最低级别隐私保护，所有系统用户可以访问）</span>
                    </a-select-option>
                  </a-select>
                  <a-alert v-if="formState.record_data.visibility === RecordVisibility.PUBLIC" 
                    type="warning" 
                    message="您选择了最低级别的隐私保护，所有用户将可以看到此记录" 
                    style="margin-top: 8px"
                    show-icon />
                </a-form-item>
              </a-col>
            </a-row>
            
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item name="institution" label="医疗机构">
                  <a-select
                    v-model:value="formState.record_data.institution"
                    placeholder="请选择医疗机构"
                    style="width: 100%"
                    showSearch
                    :filterOption="filterInstitution"
                    :loading="loadingInstitutions"
                    @change="handleInstitutionChange"
                  >
                    <a-select-option v-for="inst in institutionOptions" :key="inst.id" :value="inst.name">
                      {{ inst.name }}
                      <span v-if="inst.address" style="color: #999; font-size: 12px;"> ({{ inst.address }})</span>
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="doctor_name" label="医生姓名">
                  <a-select
                    v-model:value="formState.record_data.doctor_name"
                    placeholder="请选择医生"
                    style="width: 100%"
                    showSearch
                    :filterOption="filterDoctor"
                    :loading="loadingDoctors"
                    :disabled="!formState.record_data.institution"
                    @change="handleDoctorChange"
                  >
                    <a-select-option v-for="doctor in doctorOptions" :key="doctor.id" :value="doctor.full_name">
                      {{ doctor.full_name }}
                      <span v-if="doctor.info?.specialty" style="color: #999; font-size: 12px;"> ({{ doctor.info.specialty }})</span>
                    </a-select-option>
                  </a-select>
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
          <a-card v-if="formState.record_data.record_type === 'PRESCRIPTION'" title="用药信息" style="margin-top: 16px">
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
          
          <!-- 生命体征记录特定字段 -->
          <a-card v-if="formState.record_data.record_type === 'VITAL_SIGN'" title="生命体征数据" style="margin-top: 16px">
            <!-- 生命体征列表 -->
            <div v-for="(item, index) in vitalSigns" :key="index" class="vital-sign-item" style="margin-bottom: 16px; padding: 16px; border: 1px solid #f0f0f0; border-radius: 4px;">
              <a-row :gutter="16" align="middle">
                <a-col :span="22">
                  <a-row :gutter="16">
                    <a-col :span="8">
                      <a-form-item :label="`类型`" style="margin-bottom: 8px;">
                        <a-select 
                          v-model:value="item.type" 
                          style="width: 100%"
                          placeholder="选择类型"
                        >
                          <a-select-option value="BLOOD_PRESSURE">
                            <a-tag :color="getVitalSignColor('BLOOD_PRESSURE')">{{ getVitalSignTypeName('BLOOD_PRESSURE') }}</a-tag>
                          </a-select-option>
                          <a-select-option value="HEART_RATE">
                            <a-tag :color="getVitalSignColor('HEART_RATE')">{{ getVitalSignTypeName('HEART_RATE') }}</a-tag>
                          </a-select-option>
                          <a-select-option value="TEMPERATURE">
                            <a-tag :color="getVitalSignColor('TEMPERATURE')">{{ getVitalSignTypeName('TEMPERATURE') }}</a-tag>
                          </a-select-option>
                          <a-select-option value="BLOOD_OXYGEN">
                            <a-tag :color="getVitalSignColor('BLOOD_OXYGEN')">{{ getVitalSignTypeName('BLOOD_OXYGEN') }}</a-tag>
                          </a-select-option>
                          <a-select-option value="BLOOD_GLUCOSE">
                            <a-tag :color="getVitalSignColor('BLOOD_GLUCOSE')">{{ getVitalSignTypeName('BLOOD_GLUCOSE') }}</a-tag>
                          </a-select-option>
                          <a-select-option value="WEIGHT">
                            <a-tag :color="getVitalSignColor('WEIGHT')">{{ getVitalSignTypeName('WEIGHT') }}</a-tag>
                          </a-select-option>
                          <a-select-option value="HEIGHT">
                            <a-tag :color="getVitalSignColor('HEIGHT')">{{ getVitalSignTypeName('HEIGHT') }}</a-tag>
                          </a-select-option>
                          <a-select-option value="BMI">
                            <a-tag :color="getVitalSignColor('BMI')">{{ getVitalSignTypeName('BMI') }}</a-tag>
                          </a-select-option>
                          <a-select-option value="RESPIRATORY_RATE">
                            <a-tag :color="getVitalSignColor('RESPIRATORY_RATE')">{{ getVitalSignTypeName('RESPIRATORY_RATE') }}</a-tag>
                          </a-select-option>
                          <a-select-option value="OTHER">
                            <a-tag :color="getVitalSignColor('OTHER')">{{ getVitalSignTypeName('OTHER') }}</a-tag>
                          </a-select-option>
                        </a-select>
                      </a-form-item>
                    </a-col>
                    <a-col :span="6">
                      <a-form-item label="数值" style="margin-bottom: 8px;">
                        <a-input-number 
                          v-model:value="item.value"
                          style="width: 100%"
                          placeholder="数值"
                          :precision="2"
                        />
                      </a-form-item>
                    </a-col>
                    <a-col :span="5">
                      <a-form-item label="单位" style="margin-bottom: 8px;">
                        <a-input 
                          v-model:value="item.unit" 
                          placeholder="单位"
                        />
                      </a-form-item>
                    </a-col>
                    <a-col :span="5">
                      <a-form-item label="测量时间" style="margin-bottom: 8px;">
                        <a-date-picker 
                          v-model:value="item.measuredAtDate"
                          style="width: 100%"
                          :disabledDate="disabledDate"
                          @change="(date:Dayjs | null) => handleVitalSignDateChange(index, date)"
                          showTime
                        />
                      </a-form-item>
                    </a-col>
                  </a-row>
                  <a-row>
                    <a-col :span="24">
                      <a-form-item label="备注" style="margin-bottom: 0;">
                        <a-input 
                          v-model:value="item.notes" 
                          placeholder="备注信息"
                        />
                      </a-form-item>
                    </a-col>
                  </a-row>
                </a-col>
                <a-col :span="2" style="text-align: right">
                  <a-button 
                    type="text" 
                    danger 
                    @click="removeVitalSign(index)"
                  >
                    <template #icon><delete-outlined /></template>
                  </a-button>
                </a-col>
              </a-row>
            </div>

            <a-button type="dashed" block @click="addVitalSign" style="margin-bottom: 16px;">
              <plus-outlined /> 添加生命体征数据
            </a-button>
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
              <a-alert
                v-if="pirProtected"
                style="margin-top: 8px"
                type="success"
                message="已启用PIR隐私保护，您的查询将被混淆以保护隐私"
                description="启用PIR保护后，该记录在匿名查询时将被包含，系统会添加噪声查询来混淆您的真实意图，防止第三方推断您的查询模式"
                show-icon
              />
              <a-alert
                v-else
                style="margin-top: 8px"
                type="warning"
                message="未启用PIR隐私保护，记录在匿名查询时将被排除"
                description="不启用PIR保护的记录在执行匿名查询时将不被包含，这可能会导致查询结果不完整"
                show-icon
              />
            </a-form-item>
            
            <!-- 加密选项 -->
            <a-divider />
            
            <a-form-item>
              <a-switch
                v-model:checked="enableEncryption"
                checked-children="启用记录加密"
                un-checked-children="未加密"
              />
              <div style="margin-top: 8px; color: rgba(0, 0, 0, 0.45); font-size: 14px">
                启用加密可以保护您的敏感健康信息，需要密钥才能解密查看
              </div>
            </a-form-item>
            
            <a-form-item v-if="enableEncryption" name="encryption_key" label="加密密钥">
              <a-input-password
                v-model:value="encryptionKey"
                placeholder="请输入加密密钥"
                :maxLength="32"
                show-count
              />
              <div style="margin-top: 4px; color: rgba(0, 0, 0, 0.45); font-size: 12px">
                请妥善保管此密钥，忘记密钥将无法恢复记录内容
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { 
  UploadOutlined,
  FileOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons-vue';
import { createHealthRecord } from '@/api/health';
import { getInstitutions,getDoctors } from '@/api/patient';
import { RecordVisibility, type CreateRecordRequest, type MedicationInfo, type InstitutionInfo } from '@/types/health';
import { useRecordTypes } from '@/hooks/useRecordTypes';
import type { Doctor } from '@/types/patient';

// 定义生命体征信息接口
interface VitalSignInfo {
  type: string;
  value: number;
  unit: string;
  measured_at: string;
  notes?: string;
}

// 生命体征表单项接口
interface VitalSignFormItem {
  type: string;
  value: number;
  unit: string;
  measuredAtDate: dayjs.Dayjs | null;
  measured_at: string;
  notes: string;
}

// Define an extended version of record data with required medication
interface ExtendedRecordData {
  title: string;
  record_type: string; // 修改为字符串类型
  description: string;
  record_date: string;
  institution: string;
  doctor_name: string;
  doctor_id?: number;  // 添加医生ID字段
  visibility: RecordVisibility;
  tags: string;
  medication: MedicationInfo; // Required, not optional
  vital_signs?: VitalSignInfo[]; // 添加生命体征数组
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
const enableEncryption = ref(false);
const encryptionKey = ref('');

// 使用记录类型hook
const { recordTypeOptions, isLoading: loadingRecordTypes } = useRecordTypes();

// 生命体征表单数据
const vitalSigns = ref<VitalSignFormItem[]>([]);

// 添加生命体征
const addVitalSign = () => {
  vitalSigns.value.push({
    type: '',
    value: 0,
    unit: '',
    measuredAtDate: dayjs(),
    measured_at: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS'),
    notes: ''
  });
};

// 移除生命体征
const removeVitalSign = (index: number) => {
  vitalSigns.value.splice(index, 1);
};

// 处理生命体征测量日期变化
const handleVitalSignDateChange = (index: number, date: Dayjs | null) => {
  if (date) {
    vitalSigns.value[index].measured_at = date.format('YYYY-MM-DDTHH:mm:ss.SSS');
  } else {
    vitalSigns.value[index].measured_at = '';
  }
};

// 获取生命体征类型名称
const getVitalSignTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    'BLOOD_PRESSURE': '血压',
    'HEART_RATE': '心率',
    'TEMPERATURE': '体温',
    'BLOOD_OXYGEN': '血氧',
    'BLOOD_GLUCOSE': '血糖',
    'WEIGHT': '体重',
    'HEIGHT': '身高',
    'BMI': '体重指数',
    'RESPIRATORY_RATE': '呼吸率',
    'OTHER': '其他'
  };
  return typeMap[type] || type;
};

// 获取生命体征颜色
const getVitalSignColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'BLOOD_PRESSURE': 'red',
    'HEART_RATE': 'orange',
    'TEMPERATURE': 'gold',
    'BLOOD_OXYGEN': 'blue',
    'BLOOD_GLUCOSE': 'purple',
    'WEIGHT': 'cyan',
    'HEIGHT': 'green',
    'BMI': 'lime',
    'RESPIRATORY_RATE': 'magenta',
    'OTHER': 'default'
  };
  return colorMap[type] || 'default';
};

// 表单状态
const formState = reactive<ExtendedCreateRecordRequest>({
  record_data: {
    title: '',
    record_type: '', // 使用空字符串作为初始值
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
    },
    vital_signs: []
  },
  files: [],
  file_description: ''
});

// 监听recordTypeOptions变化，设置默认值
watch(() => recordTypeOptions.value, (newOptions) => {
  if (newOptions.length > 0 && !formState.record_data.record_type) {
    formState.record_data.record_type = newOptions[0].value;
  }
}, { immediate: true });


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
const handleRecordTypeChange = (value: string) => {
  // 不需要检查medication是否存在，因为在formState初始化时已经创建
  if (value === 'PRESCRIPTION') { // 使用字符串值比较
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
  } else if (value === 'VITAL_SIGN') {
    // 初始化生命体征数据
    if (vitalSigns.value.length === 0) {
      addVitalSign();
    }
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
    
    // 处理生命体征数据
    if (formState.record_data.record_type === 'VITAL_SIGN' && vitalSigns.value.length > 0) {
      formState.record_data.vital_signs = vitalSigns.value.filter(vs => vs.type && vs.value).map(vs => ({
        type: vs.type,
        value: vs.value,
        unit: vs.unit,
        measured_at: vs.measured_at,
        notes: vs.notes
      }));
    }
    
    // 将扩展类型转换为API期望的类型
    const apiRequest: CreateRecordRequest = {
      record_data: formState.record_data,
      files: formState.files,
      file_description: formState.file_description
    };
    
    // 添加加密密钥（如果启用了加密）
    if (enableEncryption.value && encryptionKey.value) {
      apiRequest.encryption_key = encryptionKey.value;
    }
    
    // 添加PIR保护标志
    apiRequest.pir_protected = pirProtected.value;
    
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

// 机构数据
const institutionOptions = ref<InstitutionInfo[]>([]);
const loadingInstitutions = ref(false);

// 医生数据
const doctorOptions = ref<Doctor[]>([]);
const loadingDoctors = ref(false);

// 过滤医疗机构选项
const filterInstitution = (input: string, option: any) => {
  return option.children[0].toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 过滤医生选项
const filterDoctor = (input: string, option: any) => {
  return option.children[0].toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 处理医生变更
const handleDoctorChange = (value: string) => {
  if (value) {
    // 查找选中的医生
    const selectedDoctor = doctorOptions.value.find(doc => doc.full_name === value);
    if (selectedDoctor) {
      // 保存医生ID
      formState.record_data.doctor_id = selectedDoctor.id;
    }
  } else {
    // 清空医生ID
    formState.record_data.doctor_id = undefined;
  }
};

// 处理医疗机构变更，加载对应医生
const handleInstitutionChange = (value: string) => {
  if (value) {
    loadDoctorsByInstitution(value);
  } else {
    // 清空医生选项
    doctorOptions.value = [];
    formState.record_data.doctor_name = '';
    formState.record_data.doctor_id = undefined;
  }
};

// 加载医疗机构
const loadInstitutions = async () => {
  loadingInstitutions.value = true;
  try {
    const response = await getInstitutions();
    if (response.success && response.data) {
      institutionOptions.value = response.data.institutions;
    } else {
      message.error(response.message || '获取医疗机构列表失败');
    }
  } catch (error) {
    console.error('获取医疗机构列表失败:', error);
    message.error('获取医疗机构列表失败');
  } finally {
    loadingInstitutions.value = false;
  }
};

// 根据机构加载医生
const loadDoctorsByInstitution = async (institutionName: string) => {
  loadingDoctors.value = true;
  try {
    const response = await getDoctors({ hospital: institutionName });
    if (response.success && response.data) {
      doctorOptions.value = response.data.doctors;
      // 清空当前选择的医生
      formState.record_data.doctor_name = '';
    } else {
      message.error(response.message || '获取医生列表失败');
    }
  } catch (error) {
    console.error('获取医生列表失败:', error);
    message.error('获取医生列表失败');
  } finally {
    loadingDoctors.value = false;
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 初始化记录日期为今天
  recordDate.value = dayjs();
  formState.record_data.record_date = dayjs().format('YYYY-MM-DDTHH:mm:ss.SSS');
  
  // 加载医疗机构列表
  loadInstitutions();
});
</script>

<style scoped>
.add-record-container {
  width: 100%;
}
</style> 