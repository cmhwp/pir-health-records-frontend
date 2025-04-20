<template>
  <a-modal
    v-model:visible="modalVisible"
    title="配置PIR协议参数"
    @ok="handleConfigure"
    :okText="'配置'"
    :cancelText="'取消'"
    :confirmLoading="loading"
    width="600px"
  >
    <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical">
      <a-form-item label="协议类型" name="protocol_type">
        <a-select v-model:value="formState.protocol_type" placeholder="选择PIR协议类型">
          <a-select-option :value="PIRProtocolType.BASIC">基本PIR协议</a-select-option>
          <a-select-option :value="PIRProtocolType.HOMOMORPHIC">同态加密PIR</a-select-option>
          <a-select-option :value="PIRProtocolType.HYBRID">混合PIR协议</a-select-option>
          <a-select-option :value="PIRProtocolType.ONION">洋葱路由PIR</a-select-option>
        </a-select>
      </a-form-item>
      
      <!-- 基本PIR协议参数 -->
      <template v-if="formState.protocol_type === PIRProtocolType.BASIC">
        <a-form-item label="服务器并发数" name="params.server_concurrency">
          <a-slider
            v-model:value="formState.params.server_concurrency"
            :min="1"
            :max="16"
            :step="1"
            :marks="{
              1: '1',
              4: '4',
              8: '8',
              16: '16'
            }"
          />
        </a-form-item>
        
        <a-form-item label="客户端并发数" name="params.client_concurrency">
          <a-slider
            v-model:value="formState.params.client_concurrency"
            :min="1"
            :max="8"
            :step="1"
            :marks="{
              1: '1',
              2: '2',
              4: '4',
              8: '8'
            }"
          />
        </a-form-item>
        
        <a-form-item label="索引掩码" name="params.index_mask">
          <a-switch v-model:checked="formState.params.index_mask" />
        </a-form-item>
      </template>
      
      <!-- 同态加密PIR协议参数 -->
      <template v-if="formState.protocol_type === PIRProtocolType.HOMOMORPHIC">
        <a-form-item label="密钥长度" name="params.key_length">
          <a-radio-group v-model:value="formState.params.key_length">
            <a-radio :value="1024">1024位</a-radio>
            <a-radio :value="2048">2048位</a-radio>
            <a-radio :value="4096">4096位</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="加密模式" name="params.encryption_mode">
          <a-select v-model:value="formState.params.encryption_mode">
            <a-select-option value="full">全量加密</a-select-option>
            <a-select-option value="partial">部分加密</a-select-option>
            <a-select-option value="selective">选择性加密</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="批处理大小" name="params.batch_size">
          <a-input-number v-model:value="formState.params.batch_size" :min="1" :max="100" />
        </a-form-item>
      </template>
      
      <!-- 混合PIR协议参数 -->
      <template v-if="formState.protocol_type === PIRProtocolType.HYBRID">
        <a-form-item label="索引加密" name="params.index_encryption">
          <a-switch v-model:checked="formState.params.index_encryption" />
        </a-form-item>
        
        <a-form-item label="数据加密" name="params.data_encryption">
          <a-switch v-model:checked="formState.params.data_encryption" />
        </a-form-item>
        
        <a-form-item label="混合模式" name="params.hybrid_mode">
          <a-select v-model:value="formState.params.hybrid_mode">
            <a-select-option value="index_homomorphic">索引同态</a-select-option>
            <a-select-option value="data_homomorphic">数据同态</a-select-option>
            <a-select-option value="full_homomorphic">全同态</a-select-option>
          </a-select>
        </a-form-item>
      </template>
      
      <!-- 洋葱路由PIR协议参数 -->
      <template v-if="formState.protocol_type === PIRProtocolType.ONION">
        <a-form-item label="洋葱层数" name="params.onion_layers">
          <a-slider
            v-model:value="formState.params.onion_layers"
            :min="1"
            :max="5"
            :step="1"
            :marks="{
              1: '1',
              2: '2',
              3: '3',
              4: '4',
              5: '5'
            }"
          />
        </a-form-item>
        
        <a-form-item label="路由模式" name="params.routing_mode">
          <a-select v-model:value="formState.params.routing_mode">
            <a-select-option value="random">随机路由</a-select-option>
            <a-select-option value="fixed">固定路由</a-select-option>
            <a-select-option value="adaptive">自适应路由</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="加密强度" name="params.encryption_strength">
          <a-radio-group v-model:value="formState.params.encryption_strength">
            <a-radio :value="1">低</a-radio>
            <a-radio :value="2">中</a-radio>
            <a-radio :value="3">高</a-radio>
          </a-radio-group>
        </a-form-item>
      </template>
      
      <a-alert
        type="info"
        style="margin-bottom: 16px;"
        message="协议配置将影响PIR查询的隐私保护级别和性能，请根据实验需求选择合适的参数"
      />
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, reactive, defineProps, defineEmits, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';
import type { FormInstance } from 'ant-design-vue';
import { configureProtocol } from '@/api/researcher';
import { PIRProtocolType } from '@/types/researcher';
import type { ConfigureProtocolRequest } from '@/types/researcher';

// Define our form state type that specifies all params
interface FormState {
  experiment_id: string;
  protocol_type: PIRProtocolType;
  params: {
    server_concurrency: number;
    client_concurrency: number;
    index_mask: boolean;
    key_length: number;
    encryption_mode: string;
    batch_size: number;
    index_encryption: boolean;
    data_encryption: boolean;
    hybrid_mode: string;
    onion_layers: number;
    routing_mode: string;
    encryption_strength: number;
    [key: string]: any;
  };
}

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
const formState = reactive<FormState>({
  experiment_id: props.experimentId,
  protocol_type: PIRProtocolType.BASIC,
  params: {
    // 基本协议默认参数
    server_concurrency: 4,
    client_concurrency: 2,
    index_mask: true,
    
    // 同态加密默认参数
    key_length: 2048,
    encryption_mode: 'partial',
    batch_size: 10,
    
    // 混合协议默认参数
    index_encryption: true,
    data_encryption: true,
    hybrid_mode: 'index_homomorphic',
    
    // 洋葱路由默认参数
    onion_layers: 3,
    routing_mode: 'random',
    encryption_strength: 2
  }
});

// 表单验证规则
const rules: Record<string, Rule[]> = {
  protocol_type: [
    { required: true, message: '请选择PIR协议类型' }
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
      formRef.value?.resetFields();
    }
  }
);

// 监听experimentId变化
watch(
  () => props.experimentId,
  (newExperimentId) => {
    formState.experiment_id = newExperimentId;
  }
);

// 处理配置请求
const handleConfigure = async () => {
  try {
    await formRef.value?.validate();
    
    loading.value = true;
    const response = await configureProtocol(formState);
    
    if (response.success) {
      message.success('PIR协议配置成功');
      modalVisible.value = false;
      // 触发成功事件
      emit('success');
    } else {
      message.error(response.message || '配置PIR协议失败');
    }
  } catch (error) {
    console.error('配置请求出错:', error);
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