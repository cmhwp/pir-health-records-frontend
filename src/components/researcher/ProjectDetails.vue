<template>
  <div>
    <a-spin :spinning="loading">
      <!-- 项目基本信息 -->
      <a-card 
        :bordered="false" 
        class="project-card"
        :title="project?.title || '项目详情'"
      >
        <template #extra>
          <a-space>
            <a-button @click="goBack">
              <template #icon><left-outlined /></template>
              返回
            </a-button>
            <a-button type="primary" @click="showEditModal">
              <template #icon><edit-outlined /></template>
              编辑项目
            </a-button>
          </a-space>
        </template>

        <a-descriptions :column="{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }">
          <a-descriptions-item label="项目状态">
            <a-tag :color="getStatusColor(project?.status)">
              {{ getStatusText(project?.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="开始日期">
            {{ formatDate(project?.start_date) }}
          </a-descriptions-item>
          <a-descriptions-item label="结束日期">
            {{ formatDate(project?.end_date) }}
          </a-descriptions-item>
          <a-descriptions-item label="参与人数">
            {{ project?.participants || 0 }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatDateTime(project?.created_at) }}
          </a-descriptions-item>
          <a-descriptions-item label="最后更新">
            {{ formatDateTime(project?.updated_at) }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left">项目描述</a-divider>
        <div class="description-content">
          {{ project?.description || '暂无项目描述' }}
        </div>
      </a-card>

      <!-- 项目团队 -->
      <a-card 
        :bordered="false" 
        class="project-card"
        title="项目团队"
      >
        <template #extra>
          <a-button type="primary" @click="showAddMemberModal">
            <template #icon><user-add-outlined /></template>
            添加成员
          </a-button>
        </template>

        <a-empty v-if="!project?.team_members || project?.team_members.length === 0" description="暂无团队成员" />
        <a-list v-else :data-source="project?.team_members">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta
                :title="item.name"
                :description="`角色: ${item.role}`"
              >
                <template #avatar>
                  <a-avatar>
                    {{ item.name.charAt(0).toUpperCase() }}
                  </a-avatar>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-popconfirm
                  title="确定要移除此成员吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="removeMember(item.id)"
                >
                  <a-button danger size="small">
                    <template #icon><delete-outlined /></template>
                    移除
                  </a-button>
                </a-popconfirm>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>

      <!-- 项目分析 -->
      <a-card 
        :bordered="false" 
        class="project-card"
        title="项目分析"
      >
        <template #extra>
          <a-button type="link" @click="refreshProgress">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </template>

        <a-row :gutter="16">
          <a-col :xs="24" :sm="24" :md="12">
            <div class="progress-container">
              <h3>项目进度</h3>
              <a-progress
                :percent="calculateProgress()"
                :status="calculateProgressStatus()"
                style="margin-bottom: 16px"
              />
              
              <a-list size="small" bordered>
                <a-list-item v-for="(value, key) in project?.progress" :key="key">
                  <span style="font-weight: 500">{{ key }}</span>
                  <span>{{ value }}</span>
                </a-list-item>
              </a-list>
            </div>
          </a-col>

          <a-col :xs="24" :sm="24" :md="12">
            <div class="timeline-container">
              <h3>项目时间轴</h3>
              <a-timeline>
                <a-timeline-item>
                  项目创建
                  <span style="margin-left: 8px; color: rgba(0, 0, 0, 0.45)">{{ formatDateTime(project?.created_at) }}</span>
                </a-timeline-item>
                <a-timeline-item>
                  项目开始
                  <span style="margin-left: 8px; color: rgba(0, 0, 0, 0.45)">{{ formatDate(project?.start_date) }}</span>
                </a-timeline-item>
                <a-timeline-item v-if="isProjectStarted()" color="green">
                  进行中
                  <span style="margin-left: 8px; color: rgba(0, 0, 0, 0.45)">当前</span>
                </a-timeline-item>
                <a-timeline-item 
                  :color="isProjectCompleted() ? 'green' : 'blue'"
                >
                  项目结束
                  <span style="margin-left: 8px; color: rgba(0, 0, 0, 0.45)">{{ formatDate(project?.end_date) }}</span>
                </a-timeline-item>
              </a-timeline>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </a-spin>

    <!-- 编辑项目弹窗 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑项目"
      @ok="handleEditSubmit"
      @cancel="closeEditModal"
      :confirmLoading="submitLoading"
      width="700px"
    >
      <a-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        layout="vertical"
      >
        <a-form-item name="title" label="项目名称" required>
          <a-input v-model:value="formData.title" placeholder="请输入项目名称" />
        </a-form-item>
        <a-form-item name="description" label="项目描述">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入项目描述"
            :auto-size="{ minRows: 3, maxRows: 6 }"
          />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item name="status" label="项目状态">
              <a-select
                v-model:value="formData.status"
                placeholder="请选择项目状态"
              >
                <a-select-option v-for="status in statuses" :key="status.key" :value="status.key">
                  {{ status.value }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="participants" label="参与人数">
              <a-input-number v-model:value="formData.participants" style="width: 100%" :min="0" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item name="start_date" label="开始日期" required>
              <a-date-picker
                v-model:value="formData.start_date"
                style="width: 100%"
                format="YYYY-MM-DD"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="end_date" label="结束日期" required>
              <a-date-picker
                v-model:value="formData.end_date"
                style="width: 100%"
                format="YYYY-MM-DD"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 添加团队成员弹窗 -->
    <a-modal
      v-model:visible="addMemberModalVisible"
      title="添加团队成员"
      @ok="handleAddMember"
      @cancel="closeAddMemberModal"
      :confirmLoading="submitLoading"
    >
      <a-form
        :model="memberForm"
        :rules="memberRules"
        ref="memberFormRef"
        layout="vertical"
      >
        <a-form-item name="name" label="成员姓名" required>
          <a-input v-model:value="memberForm.name" placeholder="请输入成员姓名" />
        </a-form-item>
        <a-form-item name="role" label="角色" required>
          <a-input v-model:value="memberForm.role" placeholder="请输入角色" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { 
  LeftOutlined,
  EditOutlined,
  UserAddOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';
import { 
  getResearchProjectDetails, 
  updateResearchProject, 
  getProjectStatuses,
  addTeamMember,
  deleteTeamMember
} from '@/api/researcher';
import type { 
  ResearchProject, 
  ProjectStatusesResponse,
  UpdateResearchProjectRequest,
  AddTeamMemberRequest
} from '@/types/researcher';

const router = useRouter();
const route = useRoute();
const loading = ref<boolean>(true);
const submitLoading = ref<boolean>(false);
const editModalVisible = ref<boolean>(false);
const addMemberModalVisible = ref<boolean>(false);
const project = ref<ResearchProject | null>(null);
const statuses = ref<ProjectStatusesResponse['statuses']>([]);

// 获取项目ID
const projectId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? parseInt(id, 10) : 0;
});

// 表单相关
const formRef = ref();
const formData = reactive<{
  title: string;
  description: string;
  status: string;
  start_date: any;
  end_date: any;
  participants: number;
}>({
  title: '',
  description: '',
  status: 'planning',
  start_date: null,
  end_date: null,
  participants: 0
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 100, message: '项目名称长度必须在2-100个字符之间', trigger: 'blur' }
  ],
  start_date: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  end_date: [
    { required: true, message: '请选择结束日期', trigger: 'change' }
  ]
};

// 成员表单相关
const memberFormRef = ref();
const memberForm = reactive<AddTeamMemberRequest>({
  name: '',
  role: ''
});

// 成员表单验证规则
const memberRules = {
  name: [
    { required: true, message: '请输入成员姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '成员姓名长度必须在2-50个字符之间', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请输入角色', trigger: 'blur' }
  ]
};

// 获取项目详情
const fetchProjectDetails = async () => {
  if (!projectId.value) {
    message.error('项目ID无效');
    router.push('/researcher/projects');
    return;
  }

  loading.value = true;
  try {
    const response = await getResearchProjectDetails(projectId.value);
    if (response.success && response.data) {
      project.value = response.data;
    } else {
      message.error('获取项目详情失败');
      router.push('/researcher/projects');
    }
  } catch (error) {
    console.error('获取项目详情失败:', error);
    message.error('获取项目详情失败');
    router.push('/researcher/projects');
  } finally {
    loading.value = false;
  }
};

// 获取项目状态列表
const fetchProjectStatuses = async () => {
  try {
    const response = await getProjectStatuses();
    if (response.success && response.data) {
      statuses.value = response.data.statuses;
    }
  } catch (error) {
    console.error('获取项目状态列表失败:', error);
  }
};

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未设置';
  return dayjs(dateString).format('YYYY-MM-DD');
};

// 格式化日期时间
const formatDateTime = (dateString?: string) => {
  if (!dateString) return '未设置';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 检查项目是否已开始
const isProjectStarted = () => {
  if (!project.value || !project.value.start_date) return false;
  return dayjs().isAfter(dayjs(project.value.start_date));
};

// 检查项目是否已完成
const isProjectCompleted = () => {
  if (!project.value || !project.value.end_date) return false;
  return dayjs().isAfter(dayjs(project.value.end_date));
};

// 计算项目进度
const calculateProgress = () => {
  if (!project.value || !project.value.start_date || !project.value.end_date) return 0;

  const startDate = dayjs(project.value.start_date);
  const endDate = dayjs(project.value.end_date);
  const currentDate = dayjs();

  if (currentDate.isBefore(startDate)) return 0;
  if (currentDate.isAfter(endDate)) return 100;

  const totalDays = endDate.diff(startDate, 'day');
  const passedDays = currentDate.diff(startDate, 'day');

  return Math.round((passedDays / totalDays) * 100);
};

// 计算进度状态
const calculateProgressStatus = () => {
  if (!project.value) return 'normal';
  
  if (project.value.status === 'completed') return 'success';
  if (project.value.status === 'cancelled') return 'exception';
  if (project.value.status === 'suspended') return 'exception';
  
  return 'active';
};

// 获取状态颜色
const getStatusColor = (status?: string) => {
  if (!status) return 'default';
  
  const statusMap: Record<string, string> = {
    planning: 'blue',
    in_progress: 'green',
    completed: 'cyan',
    suspended: 'orange',
    cancelled: 'red'
  };
  return statusMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status?: string) => {
  if (!status) return '未知';
  
  const statusTextMap: Record<string, string> = {
    planning: '规划中',
    in_progress: '进行中',
    completed: '已完成',
    suspended: '已暂停',
    cancelled: '已取消'
  };
  return statusTextMap[status] || status;
};

// 返回项目列表
const goBack = () => {
  router.push('/researcher/projects');
};

// 刷新项目进度
const refreshProgress = () => {
  fetchProjectDetails();
  message.success('项目进度已刷新');
};

// 显示编辑弹窗
const showEditModal = () => {
  if (!project.value) return;

  formData.title = project.value.title;
  formData.description = project.value.description || '';
  formData.status = project.value.status;
  formData.participants = project.value.participants || 0;
  formData.start_date = project.value.start_date ? dayjs(project.value.start_date) : null;
  formData.end_date = project.value.end_date ? dayjs(project.value.end_date) : null;

  editModalVisible.value = true;
};

// 关闭编辑弹窗
const closeEditModal = () => {
  editModalVisible.value = false;
};

// 显示添加成员弹窗
const showAddMemberModal = () => {
  memberForm.name = '';
  memberForm.role = '';
  addMemberModalVisible.value = true;
};

// 关闭添加成员弹窗
const closeAddMemberModal = () => {
  addMemberModalVisible.value = false;
};

// 处理编辑项目提交
const handleEditSubmit = async () => {
  if (!projectId.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const data: UpdateResearchProjectRequest = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      start_date: formatDateForSubmit(formData.start_date),
      end_date: formatDateForSubmit(formData.end_date),
      participants: formData.participants
    };

    const response = await updateResearchProject(projectId.value, data);
    if (response.success) {
      message.success('项目更新成功');
      editModalVisible.value = false;
      fetchProjectDetails();
    }
  } catch (error) {
    console.error('更新项目失败:', error);
    message.error('更新项目失败');
  } finally {
    submitLoading.value = false;
  }
};

// 处理添加成员
const handleAddMember = async () => {
  if (!projectId.value) return;

  try {
    await memberFormRef.value.validate();
    submitLoading.value = true;

    const response = await addTeamMember(projectId.value, memberForm);
    if (response.success) {
      message.success('成员添加成功');
      addMemberModalVisible.value = false;
      fetchProjectDetails();
    }
  } catch (error) {
    console.error('添加成员失败:', error);
    message.error('添加成员失败');
  } finally {
    submitLoading.value = false;
  }
};

// 移除成员
const removeMember = async (memberId: number) => {
  if (!projectId.value) return;

  try {
    const response = await deleteTeamMember(projectId.value, memberId);
    if (response.success) {
      message.success('成员移除成功');
      fetchProjectDetails();
    }
  } catch (error) {
    console.error('移除成员失败:', error);
    message.error('移除成员失败');
  }
};

// 格式化日期用于提交
const formatDateForSubmit = (date: any) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
};

onMounted(() => {
  fetchProjectStatuses();
  fetchProjectDetails();
});
</script>

<style scoped>
.project-card {
  margin-bottom: 24px;
}

.description-content {
  white-space: pre-line;
  margin: 16px 0;
}

.progress-container, .timeline-container {
  margin-bottom: 24px;
}

.progress-container h3, .timeline-container h3 {
  margin-bottom: 16px;
}
</style> 