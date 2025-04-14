<template>
  <div>
    <a-form
      :model="formState"
      :rules="rules"
      layout="vertical"
      ref="formRef"
      @finish="handleSubmit"
    >
      <!-- 基本信息 -->
      <a-divider orientation="left">基本信息</a-divider>
      
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item name="title" label="记录标题" required>
            <a-input v-model:value="formState.title" placeholder="请输入记录标题" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item name="record_type" label="记录类型" required>
            <a-select v-model:value="formState.record_type" placeholder="选择记录类型">
              <a-select-option v-for="type in recordTypeOptions" :key="type.value" :value="type.value">
                {{ type.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item name="patient_id" label="患者" required>
            <a-select
              v-model:value="formState.patient_id"
              placeholder="选择患者"
              show-search
              :filter-option="filterPatientOption"
            >
              <a-select-option v-for="patient in patientsList" :key="patient.id" :value="patient.id">
                {{ patient.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item name="record_date" label="记录日期">
            <a-date-picker 
              v-model:value="formState.record_date" 
              style="width: 100%" 
              :disabledDate="disabledDate"
              placeholder="选择记录日期"
            />
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item name="visibility" label="记录可见性">
            <a-select v-model:value="formState.visibility" placeholder="选择记录可见性">
              <a-select-option v-for="type in visibilityOptions" :key="type.value" :value="type.value">
                {{ type.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item name="tags" label="标签">
            <a-input v-model:value="formState.tags" placeholder="多个标签用逗号分隔" />
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-form-item name="description" label="记录描述">
        <a-textarea v-model:value="formState.description" rows="4" placeholder="请输入记录描述" />
      </a-form-item>
      
      <!-- 文件上传 -->
      <a-divider orientation="left">文件上传</a-divider>
      
      <a-form-item name="files" label="上传文件">
        <a-upload-dragger
          v-model:fileList="fileList"
          :multiple="true"
          :before-upload="beforeUpload"
          @drop="handleDrop"
        >
          <p class="ant-upload-drag-icon">
            <inbox-outlined />
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p class="ant-upload-hint">
            支持单个或批量上传。支持格式: PDF, JPG, PNG, DOC, XLSX 等
          </p>
        </a-upload-dragger>
      </a-form-item>
      
      <a-form-item name="file_description" label="文件描述">
        <a-textarea v-model:value="formState.file_description" rows="2" placeholder="请输入文件描述" />
      </a-form-item>
      
      <!-- 加密选项 -->
      <a-divider orientation="left">加密选项</a-divider>
      
      <a-form-item name="encrypt_record" label="加密此记录">
        <a-switch v-model:checked="formState.encrypt_record" />
      </a-form-item>
      
      <a-form-item 
        v-if="formState.encrypt_record" 
        name="encryption_key" 
        label="加密密钥"
        :rules="[{ required: true, message: '启用加密时，密钥必填!' }]"
      >
        <a-input-password v-model:value="formState.encryption_key" placeholder="请输入加密密钥" />
      </a-form-item>
      
      <a-form-item 
        v-if="formState.encrypt_record" 
        name="confirm_key"
        label="确认密钥"
        :rules="[
          { required: true, message: '请确认加密密钥!' },
          { validator: validateConfirmKey }
        ]"
      >
        <a-input-password v-model:value="formState.confirm_key" placeholder="请再次输入加密密钥" />
      </a-form-item>
      
      <a-alert
        v-if="formState.encrypt_record"
        message="重要提示"
        description="请妥善保管您的加密密钥，系统不会存储您的密钥。如果密钥丢失，将无法解密此记录！"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      />
      
      <!-- 表单按钮 -->
      <a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit" :loading="submitting">创建记录</a-button>
          <a-button @click="handleCancel">取消</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { InboxOutlined } from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import type { UploadProps } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { createEncryptedHealthRecord } from '@/api/doctor';
import type { CreateEncryptedRecordRequest } from '@/types/doctor';
import type { RecordType, RecordVisibility } from '@/types/health';

const emit = defineEmits(['success', 'cancel']);

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formState = reactive({
  title: '',
  record_type: undefined as RecordType | undefined,
  patient_id: undefined as number | undefined,
  record_date: null as Dayjs | null,
  description: '',
  visibility: 'doctor' as RecordVisibility,
  tags: '',
  file_description: '',
  encrypt_record: false,
  encryption_key: '',
  confirm_key: '',
});

// 文件列表
const fileList = ref<any[]>([]);
const submitting = ref(false);

// 选项数据
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

const visibilityOptions = [
  { label: '私密', value: 'private' },
  { label: '医生可见', value: 'doctor' },
  { label: '公开', value: 'public' },
  { label: '研究人员可见', value: 'researcher' },
];

// 患者列表（模拟数据，实际应从API获取）
const patientsList = ref<any[]>([]);

// 验证规则
const rules = {
  title: [{ required: true, message: '请输入记录标题!' }],
  record_type: [{ required: true, message: '请选择记录类型!' }],
  patient_id: [{ required: true, message: '请选择患者!' }],
};

// 加载患者列表
onMounted(() => {
  loadPatients();
});

const loadPatients = () => {
  // 在实际应用中应该从API获取患者列表
  patientsList.value = [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '王五' }
  ];
};

// 处理表单提交
const handleSubmit = async () => {
  try {
    submitting.value = true;
    
    // 构建请求数据
    const recordData: any = {
      title: formState.title,
      record_type: formState.record_type,
      patient_id: formState.patient_id,
      visibility: formState.visibility,
    };
    
    if (formState.description) {
      recordData.description = formState.description;
    }
    
    if (formState.record_date) {
      recordData.record_date = formState.record_date.format('YYYY-MM-DD');
    }
    
    if (formState.tags) {
      recordData.tags = formState.tags;
    }
    
    const requestData: CreateEncryptedRecordRequest = {
      record_data: recordData,
      files: fileList.value.map(file => file.originFileObj),
    };
    
    if (formState.file_description) {
      requestData.file_description = formState.file_description;
    }
    
    if (formState.encrypt_record && formState.encryption_key) {
      requestData.encryption_key = formState.encryption_key;
    }
    
    // 调用API创建记录
    const response = await createEncryptedHealthRecord(requestData);
    
    if (response.success) {
      message.success('健康记录创建成功');
      emit('success');
    } else {
      message.error(response.message || '创建记录失败');
    }
  } catch (error: any) {
    message.error(error.message || '创建记录时发生错误');
  } finally {
    submitting.value = false;
  }
};

// 处理取消
const handleCancel = () => {
  emit('cancel');
};

// 验证确认密钥
const validateConfirmKey = (_rule: any, value: string) => {
  if (value && value !== formState.encryption_key) {
    return Promise.reject('两次输入的密钥不一致!');
  }
  return Promise.resolve();
};

// 过滤患者选项
const filterPatientOption = (input: string, option: any) => {
  return option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 禁用未来日期
const disabledDate = (current: any) => {
  return current && current > dayjs().endOf('day');
};

// 文件上传前检查
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 在这里可以添加文件类型和大小验证
  return false; // 阻止自动上传
};

// 处理拖拽文件
const handleDrop = (e: DragEvent) => {
  // 可以添加拖拽文件的特殊处理
  console.log('Dropped files', e);
};
</script>

<style scoped>
.ant-upload-drag-icon {
  margin-bottom: 16px;
}

.ant-upload-text {
  font-size: 16px;
  margin-bottom: 8px;
}
</style> 