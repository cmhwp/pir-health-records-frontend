<template>
  <div class="maintenance-container">
    <a-page-header
      title="系统维护"
      subtitle="执行系统维护和优化操作"
    />
    
    <a-row :gutter="16">
      <a-col :span="16">
        <!-- 主要维护任务 -->
        <a-card title="系统维护任务" class="maintenance-card">
          <a-collapse v-model:activeKey="activeTaskKeys">
            <a-collapse-panel key="database" header="数据库维护">
              <a-space direction="vertical" style="width: 100%">
                <a-card :bordered="false">
                  <template #title>
                    <span>数据库优化</span>
                    <a-tooltip title="优化数据库表结构和索引，提高查询性能">
                      <question-circle-outlined style="margin-left: 8px" />
                    </a-tooltip>
                  </template>
                  <p>优化数据库表结构和索引，提高查询性能。建议定期执行以保持系统最佳状态。</p>
                  <a-button 
                    type="primary" 
                    @click="executeTask('optimize_db')" 
                    :loading="taskLoadingState['optimize_db']"
                  >
                    执行优化
                  </a-button>
                </a-card>
                
                <a-card :bordered="false">
                  <template #title>
                    <span>数据库备份</span>
                    <a-tooltip title="创建数据库的完整备份，用于灾难恢复">
                      <question-circle-outlined style="margin-left: 8px" />
                    </a-tooltip>
                  </template>
                  <p>创建数据库的完整备份，用于灾难恢复。建议至少每周执行一次。</p>
                  <a-button 
                    type="primary" 
                    @click="executeTask('backup_db')" 
                    :loading="taskLoadingState['backup_db']"
                  >
                    创建备份
                  </a-button>
                </a-card>
                
                <a-card :bordered="false">
                  <template #title>
                    <span>清理临时数据</span>
                    <a-tooltip title="删除临时表和过期数据">
                      <question-circle-outlined style="margin-left: 8px" />
                    </a-tooltip>
                  </template>
                  <p>删除临时表和过期数据，释放存储空间。此操作不会影响系统中的有效数据。</p>
                  <a-button 
                    @click="executeTask('cleanup_temp')" 
                    :loading="taskLoadingState['cleanup_temp']"
                  >
                    清理数据
                  </a-button>
                </a-card>
              </a-space>
            </a-collapse-panel>
            
            <a-collapse-panel key="cache" header="缓存管理">
              <a-space direction="vertical" style="width: 100%">
                <a-card :bordered="false">
                  <template #title>
                    <span>清除系统缓存</span>
                    <a-tooltip title="清除所有缓存数据，系统将重新加载">
                      <question-circle-outlined style="margin-left: 8px" />
                    </a-tooltip>
                  </template>
                  <p>清除所有缓存数据，系统将重新加载。在系统性能下降时可尝试此操作。</p>
                  <a-button 
                    type="primary" 
                    danger
                    @click="executeTask('clear_cache')" 
                    :loading="taskLoadingState['clear_cache']"
                  >
                    清除缓存
                  </a-button>
                </a-card>
                
                <a-card :bordered="false">
                  <template #title>
                    <span>重建缓存索引</span>
                    <a-tooltip title="重新构建系统缓存索引">
                      <question-circle-outlined style="margin-left: 8px" />
                    </a-tooltip>
                  </template>
                  <p>重新构建系统缓存索引，优化系统性能。此操作可能需要较长时间。</p>
                  <a-button 
                    @click="executeTask('rebuild_cache')" 
                    :loading="taskLoadingState['rebuild_cache']"
                  >
                    重建索引
                  </a-button>
                </a-card>
              </a-space>
            </a-collapse-panel>
            
            <a-collapse-panel key="logs" header="日志管理">
              <a-space direction="vertical" style="width: 100%">
                <a-card :bordered="false">
                  <template #title>
                    <span>压缩日志文件</span>
                    <a-tooltip title="压缩旧日志文件以节省存储空间">
                      <question-circle-outlined style="margin-left: 8px" />
                    </a-tooltip>
                  </template>
                  <p>压缩旧日志文件以节省存储空间。建议定期执行此操作。</p>
                  <a-button 
                    @click="executeTask('compress_logs')" 
                    :loading="taskLoadingState['compress_logs']"
                  >
                    压缩日志
                  </a-button>
                </a-card>
                
                <a-card :bordered="false">
                  <template #title>
                    <span>清理过期日志</span>
                    <a-tooltip title="删除超过保留期限的日志文件">
                      <question-circle-outlined style="margin-left: 8px" />
                    </a-tooltip>
                  </template>
                  <p>删除超过保留期限的日志文件。根据系统策略，通常会保留最近30天或90天的日志。</p>
                  <div>
                    <a-select 
                      v-model:value="logRetentionPeriod" 
                      style="width: 120px; margin-right: 8px"
                    >
                      <a-select-option value="7">7天</a-select-option>
                      <a-select-option value="30">30天</a-select-option>
                      <a-select-option value="90">90天</a-select-option>
                      <a-select-option value="180">180天</a-select-option>
                    </a-select>
                    <a-button 
                      @click="executeTask('cleanup_logs')" 
                      :loading="taskLoadingState['cleanup_logs']"
                    >
                      清理日志
                    </a-button>
                  </div>
                </a-card>
              </a-space>
            </a-collapse-panel>
            
            <a-collapse-panel key="system" header="系统管理">
              <a-space direction="vertical" style="width: 100%">
                <a-card :bordered="false">
                  <template #title>
                    <span>重启应用服务</span>
                    <a-tooltip title="重启应用服务，不影响数据库">
                      <question-circle-outlined style="margin-left: 8px" />
                    </a-tooltip>
                  </template>
                  <p>重启应用服务，不影响数据库。在系统出现异常时可尝试此操作。</p>
                  <a-button 
                    type="primary" 
                    danger
                    @click="showRestartConfirm('app')" 
                    :loading="taskLoadingState['restart_app']"
                  >
                    重启服务
                  </a-button>
                </a-card>
                
                <a-card :bordered="false">
                  <template #title>
                    <span>重启数据库</span>
                    <a-tooltip title="重启数据库服务，可能导致短暂服务中断">
                      <question-circle-outlined style="margin-left: 8px" />
                    </a-tooltip>
                  </template>
                  <p>重启数据库服务，可能导致短暂服务中断。仅在必要时执行此操作。</p>
                  <a-button 
                    danger
                    @click="showRestartConfirm('db')" 
                    :loading="taskLoadingState['restart_db']"
                  >
                    重启数据库
                  </a-button>
                </a-card>
                
                <a-card :bordered="false">
                  <template #title>
                    <span>系统索引重建</span>
                    <a-tooltip title="重建系统全文搜索索引">
                      <question-circle-outlined style="margin-left: 8px" />
                    </a-tooltip>
                  </template>
                  <p>重建系统全文搜索索引，提高搜索性能。此过程可能需要较长时间。</p>
                  <a-button 
                    @click="executeTask('rebuild_index')" 
                    :loading="taskLoadingState['rebuild_index']"
                  >
                    重建索引
                  </a-button>
                </a-card>
              </a-space>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-col>
      
      <a-col :span="8">
        <!-- 维护历史记录 -->
        <a-card title="维护历史记录" class="maintenance-card">
          <a-timeline>
            <a-timeline-item 
              v-for="task in maintenanceTasks" 
              :key="task.id" 
              :color="getTaskStatusColor(task.status)"
            >
              <template #dot>
                <check-circle-filled v-if="task.status === 'success'" />
                <close-circle-filled v-else-if="task.status === 'failed'" />
                <loading-outlined v-else-if="task.status === 'running'" spin />
                <clock-circle-outlined v-else />
              </template>
              <div class="timeline-content">
                <div><strong>{{ getTaskName(task.type) }}</strong></div>
                <div>{{ formatDate(task.timestamp) }}</div>
                <div>
                  <a-tag :color="getTaskStatusColor(task.status)">
                    {{ getTaskStatusText(task.status) }}
                  </a-tag>
                </div>
                <div v-if="task.details">{{ task.details }}</div>
              </div>
            </a-timeline-item>
          </a-timeline>
          
          <div v-if="maintenanceTasks.length === 0" class="empty-history">
            <a-empty description="暂无维护历史记录" />
          </div>
        </a-card>
        
        <!-- 系统维护建议 -->
        <a-card title="系统维护建议" class="maintenance-card" style="margin-top: 16px">
          <a-list
            itemLayout="horizontal"
            :dataSource="maintenanceSuggestions"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <span>{{ item.title }}</span>
                    <a-tag 
                      :color="getSuggestionPriorityColor(item.priority)" 
                      style="margin-left: 8px"
                    >
                      {{ getSuggestionPriorityText(item.priority) }}
                    </a-tag>
                  </template>
                  <template #description>
                    <div>{{ item.description }}</div>
                    <div v-if="item.lastRun">
                      上次执行: {{ formatDate(item.lastRun) }}
                    </div>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button 
                    size="small" 
                    type="primary"
                    @click="executeTask(item.task)"
                  >
                    执行
                  </a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { 
  QuestionCircleOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';

interface MaintenanceTask {
  id: string;
  type: string;
  timestamp: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  details?: string;
  user: string;
}

interface MaintenanceSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  task: string;
  lastRun?: string;
}

// 状态变量
const activeTaskKeys = ref<string[]>(['database']);
const logRetentionPeriod = ref<string>('30');
const maintenanceTasks = ref<MaintenanceTask[]>([]);
const maintenanceSuggestions = ref<MaintenanceSuggestion[]>([]);
const taskLoadingState = reactive<Record<string, boolean>>({});

// 加载维护任务历史
const loadMaintenanceHistory = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 模拟数据
    maintenanceTasks.value = [
      {
        id: 'TASK-001',
        type: 'backup_db',
        timestamp: dayjs().subtract(1, 'day').toISOString(),
        status: 'success',
        user: 'admin@example.com'
      },
      {
        id: 'TASK-002',
        type: 'clear_cache',
        timestamp: dayjs().subtract(2, 'day').toISOString(),
        status: 'success',
        user: 'admin@example.com'
      },
      {
        id: 'TASK-003',
        type: 'optimize_db',
        timestamp: dayjs().subtract(5, 'day').toISOString(),
        status: 'success',
        user: 'admin@example.com'
      },
      {
        id: 'TASK-004',
        type: 'restart_app',
        timestamp: dayjs().subtract(10, 'day').toISOString(),
        status: 'success',
        user: 'admin@example.com'
      }
    ];
  } catch (error) {
    console.error('加载维护历史失败:', error);
    message.error('加载维护历史失败');
  }
};

// 加载维护建议
const loadMaintenanceSuggestions = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 模拟数据
    maintenanceSuggestions.value = [
      {
        id: 'SUG-001',
        title: '数据库优化',
        description: '数据库30天未优化，建议进行优化以提高性能',
        priority: 'high',
        task: 'optimize_db',
        lastRun: dayjs().subtract(30, 'day').toISOString()
      },
      {
        id: 'SUG-002',
        title: '清理过期日志',
        description: '系统日志已积累15天，建议清理以释放空间',
        priority: 'medium',
        task: 'cleanup_logs',
        lastRun: dayjs().subtract(15, 'day').toISOString()
      },
      {
        id: 'SUG-003',
        title: '数据库备份',
        description: '距离上次数据备份已有7天，建议创建新备份',
        priority: 'medium',
        task: 'backup_db',
        lastRun: dayjs().subtract(7, 'day').toISOString()
      }
    ];
  } catch (error) {
    console.error('加载维护建议失败:', error);
    message.error('加载维护建议失败');
  }
};

// 执行维护任务
const executeTask = async (taskType: string) => {
  // 设置任务loading状态
  taskLoadingState[taskType] = true;
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 更新维护历史
    const newTask: MaintenanceTask = {
      id: `TASK-${Date.now().toString().substring(8)}`,
      type: taskType,
      timestamp: new Date().toISOString(),
      status: 'success',
      user: 'admin@example.com'
    };
    
    maintenanceTasks.value = [newTask, ...maintenanceTasks.value];
    
    // 显示成功消息
    message.success(`任务 ${getTaskName(taskType)} 执行成功`);
    
    // 更新建议（如果有）
    maintenanceSuggestions.value = maintenanceSuggestions.value.filter(
      suggestion => suggestion.task !== taskType
    );
  } catch (error) {
    console.error(`执行任务 ${taskType} 失败:`, error);
    message.error(`执行任务 ${getTaskName(taskType)} 失败`);
    
    // 添加失败记录
    const failedTask: MaintenanceTask = {
      id: `TASK-${Date.now().toString().substring(8)}`,
      type: taskType,
      timestamp: new Date().toISOString(),
      status: 'failed',
      details: '执行失败，请查看系统日志',
      user: 'admin@example.com'
    };
    
    maintenanceTasks.value = [failedTask, ...maintenanceTasks.value];
  } finally {
    taskLoadingState[taskType] = false;
  }
};

// 显示重启确认对话框
const showRestartConfirm = (type: 'app' | 'db') => {
  const taskType = type === 'app' ? 'restart_app' : 'restart_db';
  const taskName = type === 'app' ? '应用服务' : '数据库服务';
  
  Modal.confirm({
    title: `确定重启${taskName}？`,
    content: `重启${taskName}可能导致系统短暂不可用。确定要继续吗？`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => {
      executeTask(taskType);
    }
  });
};

// 获取任务名称
const getTaskName = (taskType: string) => {
  const taskNames: Record<string, string> = {
    'optimize_db': '数据库优化',
    'backup_db': '数据库备份',
    'cleanup_temp': '清理临时数据',
    'clear_cache': '清除系统缓存',
    'rebuild_cache': '重建缓存索引',
    'compress_logs': '压缩日志文件',
    'cleanup_logs': '清理过期日志',
    'restart_app': '重启应用服务',
    'restart_db': '重启数据库',
    'rebuild_index': '系统索引重建'
  };
  return taskNames[taskType] || taskType;
};

// 获取任务状态颜色
const getTaskStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'pending': 'blue',
    'running': 'processing',
    'success': 'success',
    'failed': 'error'
  };
  return colors[status] || 'default';
};

// 获取任务状态文本
const getTaskStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'pending': '待执行',
    'running': '执行中',
    'success': '成功',
    'failed': '失败'
  };
  return texts[status] || status;
};

// 获取建议优先级颜色
const getSuggestionPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    'high': 'error',
    'medium': 'warning',
    'low': 'default'
  };
  return colors[priority] || 'default';
};

// 获取建议优先级文本
const getSuggestionPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    'high': '高优先级',
    'medium': '中优先级',
    'low': '低优先级'
  };
  return texts[priority] || priority;
};

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 组件挂载时加载数据
onMounted(() => {
  loadMaintenanceHistory();
  loadMaintenanceSuggestions();
});
</script>

<style scoped>
.maintenance-container {
  padding: 0 24px 24px;
}

.maintenance-card {
  margin-bottom: 16px;
}

.timeline-content {
  margin-bottom: 12px;
}

.empty-history {
  padding: 24px 0;
  text-align: center;
}
</style> 