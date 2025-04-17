<template>
  <div>
    <a-row :gutter="16">
      <a-col :span="24">
        <a-card :bordered="false" title="研究团队管理">
          <template #extra>
            <a-button type="primary" @click="showAddTeamModal">
              <template #icon><team-outlined /></template>
              创建团队
            </a-button>
          </template>

          <!-- 团队筛选器 -->
          <div class="filter-container" style="margin-bottom: 16px">
            <a-row :gutter="16">
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-input-search
                  v-model:value="keyword"
                  placeholder="搜索团队名称"
                  enter-button
                  @search="fetchTeams"
                />
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-select
                  v-model:value="filters.status"
                  placeholder="团队状态"
                  style="width: 100%"
                  allowClear
                >
                  <a-select-option value="active">活跃</a-select-option>
                  <a-select-option value="inactive">非活跃</a-select-option>
                </a-select>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="6" style="text-align: right">
                <a-button @click="resetFilters" style="margin-right: 8px">
                  <template #icon><clear-outlined /></template>
                  重置
                </a-button>
                <a-button type="primary" @click="fetchTeams">
                  <template #icon><search-outlined /></template>
                  查询
                </a-button>
              </a-col>
            </a-row>
          </div>

          <!-- 团队列表 -->
          <a-table
            :columns="columns"
            :data-source="teams"
            :loading="loading"
            :pagination="pagination"
            @change="handleTableChange"
            rowKey="id"
          >
            <template #bodyCell="{ column, record }">
              <!-- 状态列 -->
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'active' ? 'green' : 'orange'">
                  {{ record.status === 'active' ? '活跃' : '非活跃' }}
                </a-tag>
              </template>

              <!-- 成员人数列 -->
              <template v-if="column.key === 'memberCount'">
                <a-statistic :value="record.members?.length || 0" :value-style="{ fontSize: '14px' }" />
              </template>

              <!-- 成员列 -->
              <template v-if="column.key === 'members'">
                <a-avatar-group :max-count="3" :max-style="{ color: '#f56a00', backgroundColor: '#fde3cf' }">
                  <a-tooltip v-for="member in record.members" :key="member.id" :title="`${member.name} - ${member.role}`">
                    <a-avatar>
                      {{ member.name.charAt(0).toUpperCase() }}
                    </a-avatar>
                  </a-tooltip>
                </a-avatar-group>
              </template>

              <!-- 操作列 -->
              <template v-if="column.key === 'action'">
                <a-space>
                  <a @click="viewTeamDetails(record.id)">详情</a>
                  <a @click="showEditTeamModal(record)">编辑</a>
                  <a-popconfirm
                    title="确定要删除该团队吗？"
                    ok-text="确定"
                    cancel-text="取消"
                    @confirm="deleteTeam(record.id)"
                  >
                    <a style="color: #ff4d4f">删除</a>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- 添加/编辑团队弹窗 -->
    <a-modal
      :visible="teamModalVisible"
      :title="isEditMode ? '编辑团队' : '创建团队'"
      @ok="handleSaveTeam"
      @cancel="closeTeamModal"
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
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import {
  TeamOutlined,
  SearchOutlined,
  ClearOutlined
} from '@ant-design/icons-vue';

// 模拟团队数据接口
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

// 模拟数据，可以根据实际API替换
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
  },
  {
    id: 3,
    name: '神经退行性疾病研究小组',
    description: '阿尔茨海默病和帕金森病的临床研究',
    status: 'inactive',
    department: '神经科',
    created_at: '2023-04-20',
    members: [
      { id: 6, name: '孙八', role: '研究员' },
      { id: 7, name: '周九', role: '数据科学家' },
      { id: 8, name: '吴十', role: '临床医生' }
    ]
  }
];

const router = useRouter();
const loading = ref<boolean>(false);
const submitLoading = ref<boolean>(false);
const teams = ref<ResearchTeam[]>([]);
const teamModalVisible = ref<boolean>(false);
const isEditMode = ref<boolean>(false);
const currentTeamId = ref<number | null>(null);

// 表单相关
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

// 表单验证规则
const teamRules = {
  name: [
    { required: true, message: '请输入团队名称', trigger: 'blur' },
    { min: 2, max: 50, message: '团队名称长度必须在2-50个字符之间', trigger: 'blur' }
  ]
};

// 筛选器状态
const filters = reactive({
  status: undefined as string | undefined
});
const keyword = ref<string>('');

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
    title: '团队名称',
    dataIndex: 'name',
    key: 'name',
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
    width: 100
  },
  {
    title: '所属部门',
    dataIndex: 'department',
    key: 'department',
    width: 120
  },
  {
    title: '成员人数',
    key: 'memberCount',
    width: 100
  },
  {
    title: '团队成员',
    key: 'members',
    width: 150
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 120
  },
  {
    title: '操作',
    key: 'action',
    width: 150
  }
];

// 获取团队列表
const fetchTeams = async () => {
  loading.value = true;
  try {
    // 这里应该调用API获取团队列表
    // const response = await getResearchTeams();
    // 模拟API调用
    setTimeout(() => {
      teams.value = mockTeams;
      pagination.total = mockTeams.length;
      loading.value = false;
    }, 500);
  } catch (error) {
    console.error('获取团队列表失败:', error);
    message.error('获取团队列表失败');
    loading.value = false;
  }
};

// 重置筛选条件
const resetFilters = () => {
  filters.status = undefined;
  keyword.value = '';
  fetchTeams();
};

// 处理表格变化
const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchTeams();
};

// 显示添加团队弹窗
const showAddTeamModal = () => {
  isEditMode.value = false;
  teamForm.name = '';
  teamForm.description = '';
  teamForm.status = 'active';
  teamForm.department = '';
  teamModalVisible.value = true;
};

// 显示编辑团队弹窗
const showEditTeamModal = (team: ResearchTeam) => {
  isEditMode.value = true;
  currentTeamId.value = team.id;
  teamForm.name = team.name;
  teamForm.description = team.description || '';
  teamForm.status = team.status;
  teamForm.department = team.department || '';
  teamModalVisible.value = true;
};

// 关闭团队弹窗
const closeTeamModal = () => {
  teamModalVisible.value = false;
};

// 处理保存团队
const handleSaveTeam = async () => {
  try {
    await teamFormRef.value.validate();
    submitLoading.value = true;
    
    if (isEditMode.value && currentTeamId.value) {
      // 更新团队
      // const response = await updateResearchTeam(currentTeamId.value, teamForm);
      message.success('团队更新成功');
    } else {
      // 创建团队
      // const response = await createResearchTeam(teamForm);
      message.success('团队创建成功');
    }
    
    teamModalVisible.value = false;
    fetchTeams();
  } catch (error) {
    console.error('保存团队失败:', error);
    message.error('保存团队失败');
  } finally {
    submitLoading.value = false;
  }
};

// 查看团队详情
const viewTeamDetails = (teamId: number) => {
  router.push(`/researcher/teams/${teamId}`);
};

// 删除团队
const deleteTeam = async (teamId: number) => {
  try {
    // const response = await deleteResearchTeam(teamId);
    message.success('团队删除成功');
    fetchTeams();
  } catch (error) {
    console.error('删除团队失败:', error);
    message.error('删除团队失败');
  }
};

onMounted(() => {
  fetchTeams();
});
</script>

<style scoped>
.filter-container {
  margin-bottom: 16px;
}
</style> 