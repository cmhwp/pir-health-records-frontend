<template>
  <div class="experiment-content">
    <a-page-header
      title="PIR实验"
      subtitle="隐私信息检索协议实验平台"
      :back-icon="false"
    >
      <template #tags>
        <a-tag color="blue">研究</a-tag>
        <a-tag color="green">实验</a-tag>
      </template>
      <template #extra>
        <a-button @click="refreshExperiments">
          <template #icon><reload-outlined /></template>
          刷新
        </a-button>
        <a-button type="primary" @click="showGenerateModal">
          <template #icon><plus-outlined /></template>
          新建实验
        </a-button>
      </template>
    </a-page-header>

    <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
      <a-tab-pane key="experiments" tab="实验列表">
        <experiments-list 
          :loading="loading" 
          :experiments="experiments"
          @view-experiment="viewExperimentDetails"
          @delete-experiment="confirmDeleteExperiment"
        />
      </a-tab-pane>
      <a-tab-pane key="details" tab="实验详情" :disabled="!currentExperiment">
        <experiment-details 
          v-if="currentExperiment"
          :experiment-id="currentExperiment"
          @back="goToExperimentsList"
        />
      </a-tab-pane>
      <a-tab-pane key="comparison" tab="协议比较">
        <protocol-comparison
          :experiments="experiments"
          @compare="compareSelectedProtocols"
        />
      </a-tab-pane>
    </a-tabs>

    <!-- 生成模拟数据弹窗 -->
    <generate-mock-data-modal
      v-model:visible="generateModalVisible"
      @success="handleGenerateSuccess"
    />
    
    <!-- 删除确认弹窗 -->
    <a-modal
      v-model:visible="deleteModalVisible"
      title="删除实验"
      @ok="handleDeleteExperiment"
      @cancel="deleteModalVisible = false"
      :confirm-loading="deleteLoading"
    >
      <p>确定要删除这个实验吗？此操作无法撤销，实验数据将被永久删除。</p>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { useRouter, useRoute } from 'vue-router';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { getExperiments, deleteExperiment } from '@/api/researcher';
import type { ExperimentListItem } from '@/types/researcher';
import ExperimentsList from './ExperimentsList.vue';
import ExperimentDetails from './ExperimentDetails.vue';
import ProtocolComparison from './ProtocolComparison.vue';
import GenerateMockDataModal from './GenerateMockDataModal.vue';

const router = useRouter();
const route = useRoute();

// 状态变量
const loading = ref(false);
const experiments = ref<ExperimentListItem[]>([]);
const activeTab = ref('experiments');
const currentExperiment = ref<string | null>(null);
const generateModalVisible = ref(false);
const deleteModalVisible = ref(false);
const deleteLoading = ref(false);
const experimentToDelete = ref<string | null>(null);

// 获取实验列表
const fetchExperiments = async () => {
  loading.value = true;
  try {
    const response = await getExperiments();
    if (response.success) {
      experiments.value = response.data?.experiments || [];
    } else {
      message.error(response.message || '获取实验列表失败');
    }
  } catch (error) {
    console.error('获取实验列表出错:', error);
    message.error('获取实验列表出错');
  } finally {
    loading.value = false;
  }
};

// 刷新实验列表
const refreshExperiments = () => {
  fetchExperiments();
};

// 显示生成模拟数据弹窗
const showGenerateModal = () => {
  generateModalVisible.value = true;
};

// 处理数据生成成功
const handleGenerateSuccess = (experimentId: string) => {
  message.success('成功生成模拟数据');
  refreshExperiments();
  // 自动查看新创建的实验
  viewExperimentDetails(experimentId);
};

// 查看实验详情
const viewExperimentDetails = (experimentId: string) => {
  currentExperiment.value = experimentId;
  activeTab.value = 'details';
  // 更新URL，但不触发导航
  router.replace({
    query: { experiment: experimentId }
  });
};

// 返回实验列表
const goToExperimentsList = () => {
  currentExperiment.value = null;
  activeTab.value = 'experiments';
  router.replace({ query: {} });
};

// 确认删除实验
const confirmDeleteExperiment = (experimentId: string) => {
  experimentToDelete.value = experimentId;
  deleteModalVisible.value = true;
};

// 处理删除实验
const handleDeleteExperiment = async () => {
  if (!experimentToDelete.value) return;
  
  deleteLoading.value = true;
  try {
    const response = await deleteExperiment(experimentToDelete.value);
    if (response.success) {
      message.success('实验已成功删除');
      // 如果当前正在查看被删除的实验，返回列表
      if (currentExperiment.value === experimentToDelete.value) {
        goToExperimentsList();
      }
      refreshExperiments();
    } else {
      message.error(response.message || '删除实验失败');
    }
  } catch (error) {
    console.error('删除实验出错:', error);
    message.error('删除实验出错');
  } finally {
    deleteLoading.value = false;
    deleteModalVisible.value = false;
    experimentToDelete.value = null;
  }
};

// 处理标签页变化
const handleTabChange = (key: string) => {
  if (key === 'experiments') {
    // 返回实验列表时，清除当前实验
    currentExperiment.value = null;
    router.replace({ query: {} });
  }
};

// 比较选中的协议
const compareSelectedProtocols = (experimentIds: string[]) => {
  if (experimentIds.length < 2) {
    message.warning('请至少选择两个实验进行比较');
    return;
  }
  
  // 切换到比较标签页
  activeTab.value = 'comparison';
};

// 在组件挂载时加载实验列表
onMounted(() => {
  fetchExperiments();
  
  // 检查URL中是否有实验ID
  const experimentId = route.query.experiment as string;
  if (experimentId) {
    currentExperiment.value = experimentId;
    activeTab.value = 'details';
  }
});

// 监听路由变化
watch(
  () => route.query.experiment,
  (newExperimentId) => {
    if (newExperimentId) {
      currentExperiment.value = newExperimentId as string;
      activeTab.value = 'details';
    } else if (activeTab.value === 'details') {
      // 如果URL中没有实验ID但标签页是详情，则切换到列表
      activeTab.value = 'experiments';
    }
  }
);
</script>

<style scoped>
.experiment-content {
  padding: 0 16px;
  background-color: #fff;
  min-height: 100%;
}

:deep(.ant-tabs-content) {
  padding: 16px 0;
}
</style> 