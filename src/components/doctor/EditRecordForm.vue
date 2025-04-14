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
          <a-form-item name="record_date" label="记录日期">
            <a-date-picker 
              v-model:value="formState.record_date" 
              style="width: 100%" 
              :disabledDate="disabledDate"
              placeholder="选择记录日期"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item name="visibility" label="记录可见性">
            <a-select v-model:value="formState.visibility" placeholder="选择记录可见性">
              <a-select-option v-for="type in visibilityOptions" :key="type.value" :value="type.value">
                {{ type.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      
      <a-form-item name="description" label="记录描述">
        <a-textarea v-model:value="formState.description" rows="4" placeholder="请输入记录描述" />
      </a-form-item>
      
      <a-form-item name="tags" label="标签">
        <a-input v-model:value="formState.tags" placeholder="多个标签用逗号分隔" />
      </a-form-item>
      
      <!-- 加密选项 -->
      <a-divider orientation="left">加密选项</a-divider>
      
      <a-alert
        v-if="recordIsEncrypted"
        message="此记录已加密"
        description="更新加密记录需要提供原加密密钥。请确保输入正确的密钥，否则将无法更新记录。"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      />
      
      <a-form-item
        v-if="recordIsEncrypted"
        name="encryption_key"
        label="加密密钥"
        :rules="[{ required: true, message: '更新加密记录需要提供密钥!' }]"
      >
        <a-input-password v-model:value="formState.encryption_key" placeholder="请输入原加密密钥" />
      </a-form-item>
      
      <!-- 表单按钮 -->
      <a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit" :loading="submitting">更新记录</a-button>
          <a-button @click="handleCancel">取消</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { updateDoctorRecord } from '@/api/doctor';
import type { UpdateDoctorRecordRequest } from '@/types/doctor';
import type { RecordType, RecordVisibility } from '@/types/health';

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['success', 'cancel']);

// 表单引用
const formRef = ref<FormInstance>();

// 记录是否已加密
const recordIsEncrypted = computed(() => props.record?.is_encrypted || false);

// 表单数据
const formState = reactive({
  title: '',
  record_type: undefined as RecordType | undefined,
  record_date: null as Dayjs | null,
  description: '',
  visibility: undefined as RecordVisibility | undefined,
  tags: '',
  encryption_key: '',
});

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

// 验证规则
const rules = {
  title: [{ required: true, message: '请输入记录标题!' }],
  record_type: [{ required: true, message: '请选择记录类型!' }],
};

// 初始化表单数据
onMounted(() => {
  initFormData();
});

const initFormData = () => {
  if (props.record) {
    formState.title = props.record.title || '';
    formState.record_type = props.record.record_type;
    
    if (props.record.record_date) {
      formState.record_date = dayjs(props.record.record_date);
    }
    
    formState.description = props.record.description || '';
    formState.visibility = props.record.visibility;
    formState.tags = props.record.tags || '';
  }
};

// 处理表单提交
const handleSubmit = async () => {
  try {
    submitting.value = true;
    
    // 构建请求数据
    const recordData: any = {};
    
    // 只包含修改过的字段
    if (formState.title !== props.record.title) {
      recordData.title = formState.title;
    }
    
    if (formState.record_type !== props.record.record_type) {
      recordData.record_type = formState.record_type;
    }
    
    const formDateStr = formState.record_date ? formState.record_date.format('YYYY-MM-DD') : null;
    const recordDateStr = props.record.record_date ? dayjs(props.record.record_date).format('YYYY-MM-DD') : null;
    
    if (formDateStr !== recordDateStr) {
      recordData.record_date = formDateStr;
    }
    
    if (formState.description !== props.record.description) {
      recordData.description = formState.description;
    }
    
    if (formState.visibility !== props.record.visibility) {
      recordData.visibility = formState.visibility;
    }
    
    if (formState.tags !== props.record.tags) {
      recordData.tags = formState.tags;
    }
    
    // 如果没有修改任何字段
    if (Object.keys(recordData).length === 0) {
      message.info('没有进行任何修改');
      emit('cancel');
      return;
    }
    
    const requestData: UpdateDoctorRecordRequest = {
      record_data: recordData
    };
    
    // 如果记录已加密，添加密钥
    if (recordIsEncrypted.value && formState.encryption_key) {
      requestData.encryption_key = formState.encryption_key;
    }
    
    // 调用API更新记录
    const response = await updateDoctorRecord(props.record.mongo_id, requestData);
    
    if (response.success) {
      message.success('健康记录更新成功');
      emit('success');
    } else {
      message.error(response.message || '更新记录失败');
    }
  } catch (error: any) {
    message.error(error.message || '更新记录时发生错误');
  } finally {
    submitting.value = false;
  }
};

// 处理取消
const handleCancel = () => {
  emit('cancel');
};

// 禁用未来日期
const disabledDate = (current: any) => {
  return current && current > dayjs().endOf('day');
};
</script> 