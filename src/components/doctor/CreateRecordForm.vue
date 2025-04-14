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
      
      <a-form-item name="is_encrypted" label="是否加密">
        <a-switch v-model:checked="isEncrypted" />
      </a-form-item>
      
      <a-form-item name="encryption_key" label="加密密钥" v-if="isEncrypted">
        <a-input-password
          v-model:value="formState.encryption_key"
          placeholder="请输入加密密钥，需要妥善保存"
        />
        <div class="form-help-text">该密钥将用于加密和解密记录，一旦丢失，记录将无法解密</div>
      </a-form-item>
      
      <!-- 提交按钮 -->
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
import { message, Upload } from 'ant-design-vue';
import type { FormInstance, UploadProps } from 'ant-design-vue';
import { InboxOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { getDoctorPatients } from '@/api/doctor';
import { createEncryptedHealthRecord } from '@/api/doctor';
import type { CreateEncryptedRecordRequest } from '@/types/doctor';
import type { RecordType, RecordVisibility } from '@/types/health';

// 组件事件
const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单状态
const formState = reactive({
  title: '',
  record_type: undefined as RecordType | undefined,
  patient_id: undefined as number | undefined,
  record_date: null as Dayjs | null,
  description: '',
  visibility: 'private' as RecordVisibility,
  tags: '',
  file_description: '',
  encryption_key: '',
});

// 其他状态
const submitting = ref(false);
const patientsList = ref<{ id: number; name: string }[]>([]);
const fileList = ref<any[]>([]);
const isEncrypted = ref(false);

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

// 验证规则
const rules = {
  title: [{ required: true, message: '请输入记录标题!' }],
  record_type: [{ required: true, message: '请选择记录类型!' }],
  patient_id: [{ required: true, message: '请选择患者!' }],
};

// 禁用日期选择
const disabledDate = (current: Dayjs) => {
  // 不能选择未来日期
  return current && current > dayjs().endOf('day');
};

// 过滤患者选项
const filterPatientOption = (input: string, option: any) => {
  return option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 文件上传前校验
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 允许的文件类型
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  
  // 校验文件类型
  const isAllowedType = allowedTypes.includes(file.type);
  if (!isAllowedType) {
    message.error('仅支持PDF, JPG, PNG, DOC, DOCX, XLS, XLSX格式文件!');
  }
  
  // 校验文件大小，限制为 50MB
  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    message.error('文件必须小于50MB!');
  }
  
  return isAllowedType && isLt50M ? true : Upload.LIST_IGNORE;
};

// 处理拖拽上传
const handleDrop = (e: DragEvent) => {
  console.log('Dropped files', e.dataTransfer?.files);
};

// 加载患者列表
const loadPatients = async () => {
  try {
    const response = await getDoctorPatients();
    if (response.success && response.data) {
      patientsList.value = response.data.patients.map(patient => ({
        id: patient.id,
        name: patient.name
      }));
    }
  } catch (error) {
    console.error('获取患者列表失败:', error);
    message.error('获取患者列表失败');
  }
};

// 提交表单
const handleSubmit = async () => {
  submitting.value = true;
  
  try {
    // 构建提交数据
    const requestData: CreateEncryptedRecordRequest = {
      record_data: {
        title: formState.title,
        record_type: formState.record_type!,
        patient_id: formState.patient_id!,
        description: formState.description,
        visibility: formState.visibility,
        tags: formState.tags,
      },
      files: fileList.value.map(file => file.originFileObj),
      file_description: formState.file_description,
    };
    
    // 如果有日期，转换格式
    if (formState.record_date) {
      requestData.record_data.record_date = formState.record_date.format('YYYY-MM-DD');
    }
    
    // 如果选择加密，添加加密密钥
    if (isEncrypted.value && formState.encryption_key) {
      requestData.encryption_key = formState.encryption_key;
    }
    
    // 发送请求
    const response = await createEncryptedHealthRecord(requestData);
    
    if (response.success) {
      message.success('记录创建成功');
      // 重置表单
      formRef.value?.resetFields();
      fileList.value = [];
      isEncrypted.value = false;
      // 触发成功事件
      emit('success');
    } else {
      message.error(response.message || '创建记录失败');
    }
  } catch (error: any) {
    console.error('创建记录失败:', error);
    message.error(error.message || '创建记录失败');
  } finally {
    submitting.value = false;
  }
};

// 取消
const handleCancel = () => {
  emit('cancel');
};

// 组件挂载时加载患者列表
onMounted(() => {
  loadPatients();
});
</script>

<style scoped>
.form-help-text {
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 4px;
}
</style> 