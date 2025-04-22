<template>
  <a-modal
    v-model:visible="modalVisible"
    title="执行隐私查询测试"
    @ok="handleExecute"
    :okText="'执行'"
    :cancelText="'取消'"
    :confirmLoading="loading"
    width="500px"
  >
    <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
      <a-form-item label="查询次数" name="query_count">
        <a-input-number
          v-model:value="formState.query_count"
          :min="1"
          :max="1000"
          :step="1"
          style="width: 100%"
          placeholder="设置要执行的查询次数"
        />
        <div class="form-help-text">设置1-1000之间的值，数值越大测试越全面，但执行时间也越长</div>
      </a-form-item>
      
      <a-alert
        type="info"
        style="margin-bottom: 16px;"
        message="系统将随机选择目标数据执行PIR查询，并记录性能指标"
      />
      
      <a-alert
        v-if="loading"
        type="warning"
        style="margin-bottom: 16px;"
        message="查询执行可能需要一些时间，请耐心等待..."
      />
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';
import type { FormInstance } from 'ant-design-vue';
import { executeQueryExperiment } from '@/api/researcher';
import type { ExecuteQueryRequest } from '@/types/researcher';

const props = defineProps<{
  visible: boolean;
  experimentId: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'success'): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 加载状态
const loading = ref(false);

// 表单数据
const formState = ref<ExecuteQueryRequest>({
  experiment_id: props.experimentId,
  query_count: 10
});

// 表单验证规则
const rules: Record<string, Rule[]> = {
  query_count: [
    { required: true, message: '请输入查询次数' },
    { type: 'number', min: 1, max: 1000, message: '查询次数应在1-1000之间' }
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
        experiment_id: props.experimentId,
        query_count: 10
      };
      formRef.value?.resetFields();
    }
  }
);

// 监听experimentId变化
watch(
  () => props.experimentId,
  (newExperimentId) => {
    formState.value.experiment_id = newExperimentId;
  }
);

// 处理执行请求
const handleExecute = async () => {
  try {
    await formRef.value?.validate();
    
    loading.value = true;
    const response = await executeQueryExperiment(formState.value);
    
    if (response.success) {
      message.success('PIR查询实验执行成功');
      modalVisible.value = false;
      // 触发成功事件
      emit('success');
    } else {
      message.error(response.message || '执行PIR查询实验失败');
    }
  } catch (error) {
    console.error('执行请求出错:', error);
    message.error('表单验证失败或请求出错');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.form-help-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style> 