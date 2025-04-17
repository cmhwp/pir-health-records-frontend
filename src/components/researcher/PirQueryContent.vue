<template>
  <div class="pir-query-content">
    <a-card class="pir-card">
      <template #title>
        <div class="card-title">
          <span>隐私保护信息检索查询</span>
        </div>
      </template>

      <a-alert
        type="info"
        show-icon
        class="info-alert"
        message="PIR查询说明"
        description="隐私保护信息检索(Private Information Retrieval)允许在不泄露您查询内容的情况下从服务器获取数据。这种方法能有效保护查询敏感信息时的隐私。"
      />

      <a-divider />
      
      <a-form :model="queryForm" layout="vertical">
        <a-form-item label="PIR协议">
          <a-select v-model:value="queryForm.pir_protocol">
            <a-select-option value="SealPIR">SealPIR</a-select-option>
            <a-select-option value="FastPIR">FastPIR</a-select-option>
            <a-select-option value="SimplePIR">SimplePIR</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="批量查询ID列表">
          <a-textarea
            v-model:value="queryForm.queryIds"
            :rows="4"
            placeholder="请输入要查询的ID，每行一个。ID将会被加密后发送至服务器。"
          />
        </a-form-item>

        <a-form-item label="查询类型">
          <a-radio-group v-model:value="queryForm.queryType">
            <a-radio value="direct">直接查询</a-radio>
            <a-radio value="encrypted">加密查询ID</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" :loading="loading" @click="executePIRQuery">
            执行PIR查询
          </a-button>
          <a-button style="margin-left: 8px" @click="resetForm">
            重置
          </a-button>
        </a-form-item>
      </a-form>

      <a-divider />

      <!-- 查询结果展示 -->
      <div v-if="queryResults.length > 0">
        <h3>查询结果</h3>
        <a-table 
          :columns="resultColumns" 
          :data-source="queryResults" 
          rowKey="id"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'result'">
              <a-tooltip placement="topLeft" :title="record.encrypted_result">
                <span class="encrypted-result">{{ truncateString(record.encrypted_result, 30) }}</span>
              </a-tooltip>
            </template>
            <template v-if="column.key === 'actions'">
              <a-button type="link" @click="decryptResult(record)">解密结果</a-button>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 解密结果弹窗 -->
      <a-modal
        v-model:visible="decryptModalVisible"
        title="解密查询结果"
        @ok="handleDecryptOk"
        @cancel="decryptModalVisible = false"
        width="700px"
      >
        <a-form layout="vertical">
          <a-form-item label="选择解密方式">
            <a-radio-group v-model:value="decryptMethod">
              <a-radio value="local">本地解密</a-radio>
              <a-radio value="server">服务器解密 (需要授权)</a-radio>
            </a-radio-group>
          </a-form-item>
          
          <a-form-item v-if="decryptMethod === 'local'" label="解密密钥">
            <a-input-password
              v-model:value="decryptKey"
              placeholder="请输入解密密钥"
            />
          </a-form-item>
          
          <a-divider />
          
          <div class="encrypted-data">
            <h4>加密结果：</h4>
            <pre>{{ currentResult ? currentResult.encrypted_result : '' }}</pre>
          </div>
          
          <a-divider />
          
          <div v-if="decryptedResult" class="decrypted-data">
            <h4>解密结果：</h4>
            <pre>{{ decryptedResult }}</pre>
          </div>
        </a-form>
      </a-modal>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { batchPIRQuery } from '@/api/researcher';
import type { BatchPIRQueryRequest, BatchPIRQueryResponse } from '@/types/researcher';

// 查询表单
const queryForm = reactive({
  pir_protocol: 'SealPIR',
  queryIds: '',
  queryType: 'direct'
});

// 状态变量
const loading = ref<boolean>(false);
const queryResults = ref<any[]>([]);
const decryptModalVisible = ref<boolean>(false);
const currentResult = ref<any>(null);
const decryptMethod = ref<string>('local');
const decryptKey = ref<string>('');
const decryptedResult = ref<string>('');

// 结果表格列定义
const resultColumns = [
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 80,
    customRender: ({ index }: { index: number }) => index + 1
  },
  {
    title: '查询ID',
    dataIndex: ['metadata', 'query_id'],
    key: 'query_id',
    width: 120
  },
  {
    title: '协议',
    dataIndex: 'protocol',
    key: 'protocol',
    width: 120
  },
  {
    title: '时间戳',
    dataIndex: ['metadata', 'timestamp'],
    key: 'timestamp',
    width: 180,
    customRender: ({ text }: { text: string }) => {
      return new Date(text).toLocaleString();
    }
  },
  {
    title: '加密结果',
    dataIndex: 'encrypted_result',
    key: 'result',
    ellipsis: true
  },
  {
    title: '操作',
    key: 'actions',
    width: 120
  }
];

// 执行PIR查询
const executePIRQuery = async () => {
  if (!queryForm.queryIds.trim()) {
    message.error('请输入要查询的ID列表');
    return;
  }

  loading.value = true;
  try {
    // 解析查询ID
    const queryIds = queryForm.queryIds
      .split('\n')
      .map(id => id.trim())
      .filter(id => id !== '');

    if (queryIds.length === 0) {
      message.error('请输入有效的查询ID');
      loading.value = false;
      return;
    }

    // 准备查询请求参数
    let encryptedIds: string[];
    if (queryForm.queryType === 'direct') {
      // 如果是直接查询，将ID进行简单加密
      encryptedIds = queryIds.map(id => encryptQueryId(id));
    } else {
      // 如果ID已经加密，直接使用
      encryptedIds = queryIds;
    }

    const requestData: BatchPIRQueryRequest = {
      encrypted_query_ids: encryptedIds,
      pir_protocol: queryForm.pir_protocol
    };

    // 发送查询请求
    const response = await batchPIRQuery(requestData);
    if (response.success && response.data) {
      message.success('PIR查询执行成功');
      queryResults.value = response.data.results;
    } else {
      message.error(response.message || 'PIR查询失败');
    }
  } catch (error) {
    console.error('PIR查询出错:', error);
    message.error('PIR查询过程中发生错误');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  queryForm.queryIds = '';
  queryForm.pir_protocol = 'SealPIR';
  queryForm.queryType = 'direct';
  queryResults.value = [];
};

// 处理结果解密
const decryptResult = (record: any) => {
  currentResult.value = record;
  decryptedResult.value = '';
  decryptKey.value = '';
  decryptModalVisible.value = true;
};

// 处理解密确认
const handleDecryptOk = () => {
  if (!currentResult.value) {
    message.error('没有可解密的结果');
    return;
  }

  if (decryptMethod.value === 'local') {
    if (!decryptKey.value) {
      message.error('请输入解密密钥');
      return;
    }

    try {
      // 模拟本地解密过程
      decryptedResult.value = simulateDecryption(
        currentResult.value.encrypted_result,
        decryptKey.value
      );
      message.success('本地解密成功');
    } catch (error) {
      message.error('解密失败，密钥可能不正确');
    }
  } else {
    // 服务器解密需要额外确认
    Modal.confirm({
      title: '服务器解密确认',
      content: '服务器解密将会向服务器发送您的加密结果，这可能会降低查询的隐私性。确定要继续吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        // 模拟服务器解密
        setTimeout(() => {
          decryptedResult.value = simulateDecryption(
            currentResult.value.encrypted_result,
            'server-key'
          );
          message.success('服务器解密成功');
        }, 1000);
      }
    });
  }
};

// 辅助函数：截断显示字符串
const truncateString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

// 模拟加密查询ID
const encryptQueryId = (id: string): string => {
  // 实际应用中应该使用真正的加密算法
  const prefix = 'ENC_';
  const randomPart = Math.random().toString(36).substring(2, 10);
  return prefix + btoa(id) + '_' + randomPart;
};

// 模拟解密结果
const simulateDecryption = (encryptedData: string, key: string): string => {
  // 实际应用中应该使用真正的解密算法
  // 这里只是为了演示
  const fakeResult = {
    id: '123456',
    data: {
      field1: 'Value 1',
      field2: 'Value 2',
      field3: 42,
      timestamp: new Date().toISOString()
    },
    metadata: {
      source: 'PIR Server',
      encrypted_with: key === 'server-key' ? 'Server Key' : 'Client Key',
      query_time: new Date().toISOString()
    }
  };
  
  return JSON.stringify(fakeResult, null, 2);
};
</script>

<style scoped>
.pir-query-content {
  padding: 16px;
}

.pir-card {
  margin-bottom: 24px;
  width: 100%;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-alert {
  margin-bottom: 20px;
}

.encrypted-result {
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
}

.encrypted-data,
.decrypted-data {
  margin-top: 16px;
}

.encrypted-data pre,
.decrypted-data pre {
  max-height: 200px;
  overflow-y: auto;
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.decrypted-data pre {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
}
</style> 