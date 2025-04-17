<template>
  <div>
    <a-page-header
      :title="team?.name || '团队详情'"
      @back="goBack"
    >
      <template #extra>
        <a-button type="primary" @click="showEditTeamModal">
          <template #icon><edit-outlined /></template>
          编辑团队
        </a-button>
      </template>
      <a-descriptions :column="{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }">
        <a-descriptions-item label="状态">
          <a-tag :color="team?.status === 'active' ? 'green' : 'orange'">
            {{ team?.status === 'active' ? '活跃' : '非活跃' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="所属部门">{{ team?.department || '未设置' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ team?.created_at || '未知' }}</a-descriptions-item>
        <a-descriptions-item label="成员数量">{{ team?.members?.length || 0 }}</a-descriptions-item>
      </a-descriptions>
    </a-page-header>

    <a-row :gutter="16" style="margin-top: 20px">
      <a-col :span="24">
        <a-card :bordered="false" title="团队描述">
          <p v-if="team?.description" class="description-content">{{ team.description }}</p>
          <a-empty v-else description="暂无团队描述" />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 20px">
      <a-col :span="24">
        <a-card :bordered="false" title="团队成员">
          <template #extra>
            <a-button type="primary" @click="showAddMemberModal">
              <template #icon><user-add-outlined /></template>
              添加成员
            </a-button>
          </template>

          <a-empty v-if="!team?.members || team.members.length === 0" description="暂无团队成员" />
          <a-list v-else :data-source="team.members">
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
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 20px">
      <a-col :span="24">
        <a-card :bordered="false" title="相关项目">
          <a-table
            :columns="projectColumns"
            :data-source="relatedProjects"
            :loading="loading"
            :pagination="{ pageSize: 5 }"
            rowKey="id"
          >
            <template #bodyCell="{ column, record }">
              <!-- 状态列 -->
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              
              <!-- 操作列 -->
              <template v-if="column.key === 'action'">
                <a @click="goToProjectDetails(record.id)">查看</a>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- 编辑团队弹窗 -->
    <a-modal
      v-model:visible="editTeamModalVisible"
      title="编辑团队"
      @ok="handleUpdateTeam"
      @cancel="editTeamModalVisible = false"
      :confirmLoading="submitLoading"
    >
      <a-form
        :model="teamForm"
        :rules="teamRules"
        ref="teamFormRef"
        layout="vertical"
      >
        <a-form-item name="name" label="团队名称" required>
          <a-input v-model:value="teamForm.name" placeholder="请输入团队名称" />
        </a-form-item>
        <a-form-item name="description" label="团队描述">
          <a-textarea
            v-model:value="teamForm.description"
            placeholder="请输入团队描述"
            :auto-size="{ minRows: 3, maxRows: 6 }"
          />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item name="status" label="团队状态">
              <a-select
                v-model:value="teamForm.status"
                placeholder="请选择团队状态"
              >
                <a-select-option value="active">活跃</a-select-option>
                <a-select-option value="inactive">非活跃</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="department" label="所属部门">
              <a-input v-model:value="teamForm.department" placeholder="请输入所属部门" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 添加成员弹窗 -->
    <a-modal
      v-model:visible="addMemberModalVisible"
      title="添加团队成员"
      @ok="handleAddMember"
      @cancel="addMemberModalVisible = false"
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
import { 
  EditOutlined, 
  UserAddOutlined, 
  DeleteOutlined 
} from '@ant-design/icons-vue';

// 模拟数据接口
interface TeamMember {
  id: number;
  name: string;
  role: string;
}

interface ResearchTeam {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  department: string;
  created_at: string;
  members?: TeamMember[];
}

interface ResearchProject {
  id: number;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
}

// 模拟团队数据
const mockTeams: ResearchTeam[] = [
  {
    id: 1,
    name: '心血管疾病研究团队',
    description: '专注于心血管疾病的临床研究与数据分析',
    status: 'active',
    department: '心内科',
    created_at: '2023-05-10',
    members: [
      { id: 1, name: '张三', role: '主任研究员' },
      { id: 2, name: '李四', role: '数据分析师' },
      { id: 3, name: '王五', role: '临床医生' }
    ]
  },
  {
    id: 2,
    name: '肿瘤免疫治疗团队',
    description: '研究肿瘤免疫治疗的效果与安全性',
    status: 'active',
    department: '肿瘤科',
    created_at: '2023-06-15',
    members: [
      { id: 4, name: '赵六', role: '研究主管' },
      { id: 5, name: '钱七', role: '临床试验协调员' }
    ]
  }
];

// 模拟项目数据
const mockProjects: ResearchProject[] = [
  {
    id: 1,
    title: '冠心病患者临床数据分析',
    description: '分析冠心病患者的临床数据，寻找潜在的风险因素',
    status: 'in_progress',
    start_date: '2023-01-15',
    end_date: '2023-12-31'
  },
  {
    id: 2,
    title: '高血压药物疗效对比研究',
    description: '比较不同高血压药物的临床疗效与副作用',
    status: 'planning',
    start_date: '2023-08-01',
    end_date: '2024-07-31'
  }
];

const router = useRouter();
const route = useRoute();
const loading = ref<boolean>(true);
const submitLoading = ref<boolean>(false);
const editTeamModalVisible = ref<boolean>(false);
const addMemberModalVisible = ref<boolean>(false);
const team = ref<ResearchTeam | null>(null);
const relatedProjects = ref<ResearchProject[]>([]);

// 获取团队ID
const teamId = computed(() => {
  const id = route.params.id;
  return typeof id === 'string' ? parseInt(id, 10) : 0;
});

// 团队表单
const teamFormRef = ref();
const teamForm = reactive<{
  name: string;
  description: string;
  status: 'active' | 'inactive';
  department: string;
}>({
  name: '',
  description: '',
  status: 'active',
  department: ''
});

// 团队表单验证规则
const teamRules = {
  name: [
    { required: true, message: '请输入团队名称', trigger: 'blur' },
    { min: 2, max: 50, message: '团队名称长度必须在2-50个字符之间', trigger: 'blur' }
  ]
};

// 成员表单
const memberFormRef = ref();
const memberForm = reactive<{
  name: string;
  role: string;
}>({
  name: '',
  role: ''
});

// 成员表单验证规则
const memberRules = {
  name: [
    { required: true, message: '请输入成员姓名', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请输入角色', trigger: 'blur' }
  ]
};

// 表格列定义
const projectColumns = [
  {
    title: '项目名称',
    dataIndex: 'title',
    key: 'title',
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
    width: 100
  },
  {
    title: '开始日期',
    dataIndex: 'start_date',
    key: 'start_date',
    width: 120
  },
  {
    title: '结束日期',
    dataIndex: 'end_date',
    key: 'end_date',
    width: 120
  },
  {
    title: '操作',
    key: 'action',
    width: 80
  }
];

// 获取团队详情
const fetchTeamDetails = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    setTimeout(() => {
      team.value = mockTeams.find(t => t.id === teamId.value) || null;
      loading.value = false;
    }, 500);
  } catch (error) {
    console.error('获取团队详情失败:', error);
    message.error('获取团队详情失败');
    loading.value = false;
  }
};

// 获取相关项目
const fetchRelatedProjects = async () => {
  try {
    // 模拟API调用
    setTimeout(() => {
      relatedProjects.value = mockProjects;
    }, 700);
  } catch (error) {
    console.error('获取相关项目失败:', error);
    message.error('获取相关项目失败');
  }
};

// 返回团队列表
const goBack = () => {
  router.push('/researcher/teams');
};

// 显示编辑团队弹窗
const showEditTeamModal = () => {
  if (!team.value) return;
  
  teamForm.name = team.value.name;
  teamForm.description = team.value.description || '';
  teamForm.status = team.value.status;
  teamForm.department = team.value.department || '';
  editTeamModalVisible.value = true;
};

// 处理更新团队
const handleUpdateTeam = async () => {
  try {
    await teamFormRef.value.validate();
    submitLoading.value = true;
    
    // 模拟API调用
    setTimeout(() => {
      // 更新本地数据模拟成功
      if (team.value) {
        team.value.name = teamForm.name;
        team.value.description = teamForm.description;
        team.value.status = teamForm.status;
        team.value.department = teamForm.department;
      }
      
      message.success('团队更新成功');
      editTeamModalVisible.value = false;
      submitLoading.value = false;
    }, 500);
  } catch (error) {
    console.error('更新团队失败:', error);
    message.error('更新团队失败');
    submitLoading.value = false;
  }
};

// 显示添加成员弹窗
const showAddMemberModal = () => {
  memberForm.name = '';
  memberForm.role = '';
  addMemberModalVisible.value = true;
};

// 处理添加成员
const handleAddMember = async () => {
  try {
    await memberFormRef.value.validate();
    submitLoading.value = true;
    
    // 模拟API调用
    setTimeout(() => {
      // 更新本地数据模拟成功
      if (team.value) {
        const newMember = {
          id: Date.now(), // 模拟ID
          name: memberForm.name,
          role: memberForm.role
        };
        
        if (!team.value.members) {
          team.value.members = [];
        }
        
        team.value.members.push(newMember);
      }
      
      message.success('成员添加成功');
      addMemberModalVisible.value = false;
      submitLoading.value = false;
    }, 500);
  } catch (error) {
    console.error('添加成员失败:', error);
    message.error('添加成员失败');
    submitLoading.value = false;
  }
};

// 移除成员
const removeMember = (memberId: number) => {
  if (!team.value || !team.value.members) return;
  
  // 模拟API调用
  setTimeout(() => {
    if (team.value && team.value.members) {
      team.value.members = team.value.members.filter(m => m.id !== memberId);
      message.success('成员移除成功');
    }
  }, 300);
};

// 跳转到项目详情
const goToProjectDetails = (projectId: number) => {
  router.push(`/researcher/projects/${projectId}`);
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'planning':
      return 'blue';
    case 'in_progress':
      return 'green';
    case 'completed':
      return 'gray';
    case 'suspended':
      return 'orange';
    case 'cancelled':
      return 'red';
    default:
      return 'default';
  }
};

// 获取状态文字
const getStatusText = (status: string) => {
  switch (status) {
    case 'planning':
      return '计划中';
    case 'in_progress':
      return '进行中';
    case 'completed':
      return '已完成';
    case 'suspended':
      return '已暂停';
    case 'cancelled':
      return '已取消';
    default:
      return '未知状态';
  }
};

onMounted(() => {
  fetchTeamDetails();
  fetchRelatedProjects();
});
</script>

<style scoped>
.description-content {
  white-space: pre-line;
  margin: 16px 0;
}
</style> 