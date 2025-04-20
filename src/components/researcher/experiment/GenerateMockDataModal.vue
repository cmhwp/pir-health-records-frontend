<template>
  <a-modal
    v-model:visible="modalVisible"
    title="生成模拟健康数据"
    @ok="handleGenerate"
    :okText="'生成'"
    :cancelText="'取消'"
    :confirmLoading="loading"
    width="600px"
  >
    <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
      <a-form-item label="生成数据量" name="count">
        <a-slider
          v-model:value="formState.count"
          :min="10"
          :max="1000"
          :step="10"
          :marks="{
            10: '10',
            250: '250',
            500: '500',
            750: '750',
            1000: '1000'
          }"
        />
        <a-input-number
          v-model:value="formState.count"
          :min="10"
          :max="1000"
          style="margin-left: 16px;"
        />
      </a-form-item>
      
      <a-form-item label="数据结构" name="structured">
        <a-radio-group v-model:value="formState.structured">
          <a-radio :value="true">结构化数据</a-radio>
          <a-radio :value="false">非结构化数据</a-radio>
        </a-radio-group>
      </a-form-item>
      
      <a-form-item label="记录类型" name="record_types">
        <a-select
          v-model:value="formState.record_types"
          mode="multiple"
          placeholder="选择记录类型，不选择则生成所有类型"
          style="width: 100%"
          allow-clear
        >
          <a-select-option v-for="option in recordTypeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </a-select-option>
        </a-select>
      </a-form-item>
      
      <a-alert
        type="info"
        style="margin-bottom: 16px;"
        message="生成的模拟数据将用于PIR协议实验，不含真实患者信息"
      />
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';
import type { FormInstance } from 'ant-design-vue';
import { generateMockData } from '@/api/researcher';
import type { GenerateMockDataRequest } from '@/types/researcher';
import { useRecordTypes } from '@/hooks/useRecordTypes';

const { recordTypeOptions } = useRecordTypes();
const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'success', experimentId: string): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 加载状态
const loading = ref(false);

// 表单数据
const formState = ref<GenerateMockDataRequest>({
  count: 100,
  structured: true,
  record_types: []
});

// 表单验证规则
const rules: Record<string, Rule[]> = {
  count: [
    { required: true, message: '请输入生成数据量' },
    { type: 'number', min: 10, max: 1000, message: '数据量应在10-1000之间' }
  ],
  structured: [
    { required: true, message: '请选择数据结构类型' }
  ]
};

// 计算属性：模态框可见性
const modalVisible = ref(props.visible);

// 监听visible属性变化
watch(
  () => props.visible,
  (newVisible) => {
    modalVisible.value = newVisible;
  }
);

// 监听内部可见性变化
watch(
  () => modalVisible.value,
  (newVisible) => {
    emit('update:visible', newVisible);
    // 当关闭模态框时重置表单
    if (!newVisible) {
      formState.value = {
        count: 100,
        structured: true,
        record_types: []
      };
      formRef.value?.resetFields();
    }
  }
);

// 处理生成请求
const handleGenerate = async () => {
  try {
    await formRef.value?.validate();
    
    loading.value = true;
    const response = await generateMockData(formState.value);
    
    if (response.success) {
      message.success('模拟健康数据生成成功');
      modalVisible.value = false;
      // 触发成功事件，传递实验ID
      emit('success', response.data?.experiment_id || '');
    } else {
      message.error(response.message || '生成模拟数据失败');
    }
  } catch (error) {
    console.error('生成请求出错:', error);
    message.error('表单验证失败或请求出错');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
:deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style> 