<template>
  <div class="projects-content">
    <a-card class="projects-card">
      <template #title>
        <div class="card-title">
          <span>项目管理</span>
          <div class="action-buttons">
            <a-button type="primary" @click="showCreateModal">
              <template #icon><plus-outlined /></template>
              创建项目
            </a-button>
            <a-button @click="fetchProjects">
              <template #icon><reload-outlined /></template>
              刷新
            </a-button>
          </div>
        </div>
      </template>

      <!-- 过滤器表单 -->
      <a-form layout="inline" class="filter-form">
        <a-form-item label="状态">
          <a-select
            v-model:value="filterParams.status"
            style="width: 120px"
            placeholder="选择状态"
            allowClear
          >
            <a-select-option v-for="status in statuses" :key="status.key" :value="status.key">
              {{ status.value }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="创建时间">
          <a-range-picker 
            v-model:value="dateRange" 
            @change="onDateChange" 
            :placeholder="['开始日期', '结束日期']"
          />
        </a-form-item>

        <a-form-item label="关键词">
          <a-input 
            v-model:value="keyword" 
            placeholder="项目名称/描述" 
            style="width: 200px" 
            allowClear
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" @click="fetchProjects">
            <template #icon><search-outlined /></template>
            查询
          </a-button>
          <a-button style="margin-left: 8px" @click="resetFilters">
            <template #icon><clear-outlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>

      <!-- 项目列表表格 -->
      <a-table 
        :columns="columns" 
        :data-source="projects" 
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        rowKey="id"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          
          <template v-if="column.key === 'team'">
            <a-avatar-group :max-count="3" :max-style="{ color: '#f56a00', backgroundColor: '#fde3cf' }">
              <a-avatar v-for="member in record.team_members || []" :key="member.id">
                {{ member.name.charAt(0).toUpperCase() }}
              </a-avatar>
            </a-avatar-group>
          </template>
          
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="viewProject(record.id)">查看</a>
              <a-divider type="vertical" />
              <a @click="showEditModal(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm
                title="确定要删除此项目吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteProject(record.id)"
              >
                <a class="danger-link">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建项目弹窗 -->
    <a-modal
      v-model:visible="createModalVisible"
      title="创建新项目"
      @ok="handleCreateSubmit"
      @cancel="handleCancel"
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

    <!-- 编辑项目弹窗 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑项目"
      @ok="handleEditSubmit"
      @cancel="handleCancel"
      :confirmLoading="submitLoading"
      width="700px"
    >
      <a-form
        :model="formData"
        :rules="rules"
        ref="editFormRef"
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
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import type { FilterValue, SorterResult } from 'ant-design-vue/es/table/interface';
import dayjs from 'dayjs';
import {
  PlusOutlined,
  SearchOutlined,
  ClearOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';
import {
  getResearchProjects,
  getProjectStatuses,
  createResearchProject,
  updateResearchProject,
  deleteResearchProject,
  deleteTeamMember,
  getResearchProjectDetails
} from '@/api/researcher';
import type {
  ResearchProject,
  ProjectStatusesResponse,
  CreateResearchProjectRequest,
  UpdateResearchProjectRequest,
  ProjectTeamMember
} from '@/types/researcher';
import { PROJECT_STATUS, PROJECT_STATUS_COLOR } from '@/constants/researcher';

const router = useRouter();
const loading = ref<boolean>(false);
const submitLoading = ref<boolean>(false);
const projects = ref<ResearchProject[]>([]);
const statuses = ref<ProjectStatusesResponse['statuses']>([]);
const createModalVisible = ref<boolean>(false);
const editModalVisible = ref<boolean>(false);
const currentProjectId = ref<number | null>(null);
const currentProject = ref<ResearchProject | null>(null);

// 表单相关
const formRef = ref();
const editFormRef = ref();
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
  status: PROJECT_STATUS.PLANNING,
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

// 筛选器状态
const filterParams = reactive({
  status: undefined as string | undefined,
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined
});
const keyword = ref<string>('');
const dateRange = ref<any[]>([]);

// 分页设置
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`
});

// 表格列定义
const columns = [
  {
    title: '项目名称',
    dataIndex: 'title',
    key: 'title',
    fixed: 'left',
    width: 200,
    ellipsis: true
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    filters: computed(() => statuses.value.map(status => ({
      text: status.value,
      value: status.key
    }))).value,
  },

  {
    title: '开始日期',
    dataIndex: 'start_date',
    key: 'start_date',
    width: 120,
    sorter: true,
    render: (_: any, record: ResearchProject) => formatDate(record.start_date)
  },
  {
    title: '结束日期',
    dataIndex: 'end_date',
    key: 'end_date',
    width: 120,
    sorter: true,
    render: (_: any, record: ResearchProject) => formatDate(record.end_date)
  },
  {
    title: '参与人数',
    dataIndex: 'participants',
    key: 'participants',
    width: 100,
    sorter: true
  },
  {
    title: '团队成员',
    key: 'team',
    width: 150
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 150
  }
];

// 获取项目列表
const fetchProjects = async () => {
  loading.value = true;
  try {
    const response = await getResearchProjects();
    if (response.success && response.data) {
      projects.value = response.data;
      pagination.total = response.data.length;
    }
  } catch (error) {
    console.error('获取项目列表失败:', error);
    message.error('获取项目列表失败');
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

// 处理日期范围变更
const onDateChange = (dates: any, dateStrings: string[]) => {
  filterParams.startDate = dateStrings[0] || undefined;
  filterParams.endDate = dateStrings[1] || undefined;
};

// 重置筛选条件
const resetFilters = () => {
  filterParams.status = undefined;
  filterParams.startDate = undefined;
  filterParams.endDate = undefined;
  keyword.value = '';
  dateRange.value = [];
  fetchProjects();
};

// 处理表格变更（排序、筛选、分页）
const handleTableChange = (
  pag: TablePaginationConfig,
  filters: Record<string, FilterValue | null>,
  sorter: SorterResult<ResearchProject> | SorterResult<ResearchProject>[]
) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  
  // 根据变更重新获取数据
  fetchProjects();
};

// 打开创建项目弹窗
const showCreateModal = () => {
  resetForm();
  createModalVisible.value = true;
};

// 打开编辑项目弹窗
const showEditModal = (project: ResearchProject) => {
  resetForm();
  currentProjectId.value = project.id;
  
  // 设置表单数据
  formData.title = project.title;
  formData.description = project.description || '';
  formData.status = project.status;
  formData.participants = project.participants || 0;
  formData.start_date = project.start_date ? dayjs(project.start_date) : null;
  formData.end_date = project.end_date ? dayjs(project.end_date) : null;
  
  editModalVisible.value = true;
};

// 查看项目详情
const viewProject = async (projectId: number) => {
  try {
    const response = await getResearchProjectDetails(projectId);
    if (response.success && response.data) {
      currentProject.value = response.data;
      router.push(`/researcher/project/${projectId}`);
    }
  } catch (error) {
    console.error('获取项目详情失败:', error);
    message.error('获取项目详情失败');
  }
};

// 删除项目
const deleteProject = async (projectId: number) => {
  try {
    const response = await deleteResearchProject(projectId);
    if (response.success) {
      message.success('项目删除成功');
      fetchProjects();
    }
  } catch (error) {
    console.error('删除项目失败:', error);
    message.error('删除项目失败');
  }
};

// 处理创建项目提交
const handleCreateSubmit = async () => {
  try {
    await formRef.value.validate();
    submitLoading.value = true;
    
    const data: CreateResearchProjectRequest = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      start_date: formatDateForSubmit(formData.start_date),
      end_date: formatDateForSubmit(formData.end_date),
      participants: formData.participants
    };
    
    const response = await createResearchProject(data);
    if (response.success) {
      message.success('项目创建成功');
      createModalVisible.value = false;
      fetchProjects();
    }
  } catch (error) {
    console.error('创建项目失败:', error);
    message.error('创建项目失败');
  } finally {
    submitLoading.value = false;
  }
};

// 处理编辑项目提交
const handleEditSubmit = async () => {
  if (!currentProjectId.value) return;
  
  try {
    await editFormRef.value.validate();
    submitLoading.value = true;
    
    const data: UpdateResearchProjectRequest = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      start_date: formatDateForSubmit(formData.start_date),
      end_date: formatDateForSubmit(formData.end_date),
      participants: formData.participants
    };
    
    const response = await updateResearchProject(currentProjectId.value, data);
    if (response.success) {
      message.success('项目更新成功');
      editModalVisible.value = false;
      fetchProjects();
    }
  } catch (error) {
    console.error('更新项目失败:', error);
    message.error('更新项目失败');
  } finally {
    submitLoading.value = false;
  }
};

// 取消弹窗
const handleCancel = () => {
  createModalVisible.value = false;
  editModalVisible.value = false;
  resetForm();
};

// 重置表单
const resetForm = () => {
  formData.title = '';
  formData.description = '';
  formData.status = PROJECT_STATUS.PLANNING;
  formData.participants = 0;
  formData.start_date = null;
  formData.end_date = null;
  currentProjectId.value = null;
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD');
};

// 格式化日期用于提交
const formatDateForSubmit = (date: any) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
};

// 获取状态颜色
const getStatusColor = (status: string): string => {
  const uppercaseStatus = status.toUpperCase();
  return PROJECT_STATUS_COLOR[uppercaseStatus as keyof typeof PROJECT_STATUS_COLOR] || 'default';
};

// 获取状态文本
const getStatusText = (status: string): string => {
  const uppercaseStatus = status.toUpperCase();
  return PROJECT_STATUS[uppercaseStatus as keyof typeof PROJECT_STATUS] || status;
};

// 移除团队成员
const removeMember = async (member: ProjectTeamMember) => {
  if (!currentProject.value) {
    message.error('项目信息不存在');
    return;
  }
  
  try {
    const res = await deleteTeamMember(currentProject.value.id, member.id);
    
    if (res.success) {
      message.success('移除成员成功');
      // 刷新项目详情
      if (currentProject.value) {
        viewProject(currentProject.value.id);
      }
    } else {
      message.error(res.message || '移除成员失败');
    }
  } catch (error) {
    console.error(error);
    message.error('移除成员失败');
  }
};

onMounted(() => {
  fetchProjectStatuses();
  fetchProjects();
});
</script>

<style scoped>
.projects-content {
  padding: 16px;
}

.projects-card {
  margin-bottom: 24px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.danger-link {
  color: #ff4d4f;
}

.danger-link:hover {
  color: #ff7875;
}

.filter-form {
  margin-bottom: 16px;
}
</style>


