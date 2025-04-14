<template>
  <div>
    <h2>用户管理</h2>
    
    <a-card>
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="搜索">
          <a-input
            v-model:value="searchForm.search"
            placeholder="用户名、邮箱或姓名"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="角色">
          <a-select
            v-model:value="searchForm.role"
            placeholder="选择角色"
            style="width: 120px"
            allow-clear
          >
            <a-select-option value="patient">患者</a-select-option>
            <a-select-option value="doctor">医生</a-select-option>
            <a-select-option value="researcher">研究人员</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">
            <template #icon><search-outlined /></template>
            搜索
          </a-button>
        </a-form-item>
        <a-form-item>
          <a-button @click="resetSearch">
            <template #icon><clear-outlined /></template>
            重置
          </a-button>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="showCreateUserModal">
            <template #icon><user-add-outlined /></template>
            创建用户
          </a-button>
        </a-form-item>
      </a-form>
      
      <a-divider style="margin: 16px 0" />
      
      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        rowKey="id"
      >
        <!-- 用户名列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'username'">
            <a @click="viewUserDetail(record)">{{ record.username }}</a>
          </template>
          
          <!-- 角色列 -->
          <template v-else-if="column.key === 'role'">
            <a-tag :color="getRoleColor(record.role)">
              {{ formatRole(record.role) }}
            </a-tag>
          </template>
          
          <!-- 状态列 -->
          <template v-else-if="column.key === 'status'">
            <a-badge :status="record.is_active ? 'success' : 'error'" :text="record.is_active ? '活跃' : '禁用'" />
          </template>
          
          <!-- 操作列 -->
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="viewUserDetail(record)">
                <template #icon><eye-outlined /></template>
                查看
              </a-button>
              <a-button size="small" type="primary" @click="editUser(record)">
                <template #icon><edit-outlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除此用户吗？此操作不可恢复！"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteUserConfirm(record)"
              >
                <a-button size="small" danger>
                  <template #icon><delete-outlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
    
    <!-- 用户详情抽屉 -->
    <a-drawer
      title="用户详情"
      placement="right"
      :width="600"
      :visible="userDetailVisible"
      :footer-style="{ textAlign: 'right' }"
      @close="userDetailVisible = false"
    >
      <a-spin :spinning="detailLoading">
        <a-descriptions :column="1" bordered v-if="currentUser">
          <a-descriptions-item label="ID">{{ currentUser.id }}</a-descriptions-item>
          <a-descriptions-item label="用户名">{{ currentUser.username }}</a-descriptions-item>
          <a-descriptions-item label="邮箱">{{ currentUser.email }}</a-descriptions-item>
          <a-descriptions-item label="姓名">{{ currentUser.full_name || '未设置' }}</a-descriptions-item>
          <a-descriptions-item label="电话">{{ currentUser.phone || '未设置' }}</a-descriptions-item>
          <a-descriptions-item label="角色">
            <a-tag :color="getRoleColor(currentUser.role)">
              {{ formatRole(currentUser.role) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-badge :status="currentUser.is_active ? 'success' : 'error'" :text="currentUser.is_active ? '活跃' : '禁用'" />
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatDate(currentUser.created_at) }}</a-descriptions-item>
          <a-descriptions-item label="最后登录">{{ currentUser.last_login_at ? formatDate(currentUser.last_login_at) : '从未登录' }}</a-descriptions-item>
        </a-descriptions>
        
        <a-empty v-else-if="!detailLoading" description="无法加载用户详情" />
      </a-spin>
      
      <template #footer>
        <a-button style="margin-right: 8px" @click="userDetailVisible = false">关闭</a-button>
        <a-button type="primary" @click="currentUser && editUser(currentUser)">编辑</a-button>
      </template>
    </a-drawer>
    
    <!-- 创建/编辑用户表单 -->
    <a-modal
      :title="isEdit ? '编辑用户' : '创建用户'"
      :visible="userFormVisible"
      :confirm-loading="submitLoading"
      @ok="submitUserForm"
      @cancel="userFormVisible = false"
      width="700px"
    >
      <a-form
        :model="userForm"
        :rules="userFormRules"
        ref="userFormRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="userForm.username" placeholder="请输入用户名" />
        </a-form-item>
        
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="userForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        
        <a-form-item label="密码" name="password" :rules="isEdit ? [] : [{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="userForm.password" placeholder="请输入密码" />
          <template v-if="!isEdit">
            <div class="form-help-text">已设置默认强密码，您可以修改或保留此密码</div>
          </template>
        </a-form-item>
        
        <a-form-item label="姓名" name="full_name">
          <a-input v-model:value="userForm.full_name" placeholder="请输入姓名" />
        </a-form-item>
        
        <a-form-item label="电话" name="phone">
          <a-input v-model:value="userForm.phone" placeholder="请输入电话" />
        </a-form-item>
        
        <a-form-item label="角色" name="role">
          <a-select v-model:value="userForm.role" placeholder="请选择角色">
            <a-select-option value="patient">患者</a-select-option>
            <a-select-option value="doctor">医生</a-select-option>
            <a-select-option value="researcher">研究人员</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="状态" name="is_active">
          <a-switch v-model:checked="userForm.is_active" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import type { TablePaginationConfig } from 'ant-design-vue';
import { 
  SearchOutlined, 
  ClearOutlined, 
  UserAddOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined
} from '@ant-design/icons-vue';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '@/api/admin';
import type { User } from '@/types/auth';

// 表格列定义
const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    sorter: true,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: '姓名',
    dataIndex: 'full_name',
    key: 'full_name',
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    filters: [
      { text: '患者', value: 'patient' },
      { text: '医生', value: 'doctor' },
      { text: '研究人员', value: 'researcher' },
      { text: '管理员', value: 'admin' },
    ],
  },
  {
    title: '状态',
    dataIndex: 'is_active',
    key: 'status',
    filters: [
      { text: '活跃', value: true },
      { text: '禁用', value: false },
    ],
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (text: string) => formatDate(text),
    sorter: true,
  },
  {
    title: '操作',
    key: 'actions',
  },
];

// 状态变量
const users = ref<User[]>([]);
const loading = ref<boolean>(false);
const detailLoading = ref<boolean>(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
});

// 搜索表单
const searchForm = reactive({
  search: '',
  role: '',
});

// 用户详情
const userDetailVisible = ref<boolean>(false);
const currentUser = ref<User | null>(null);

// 创建/编辑用户
const userFormVisible = ref<boolean>(false);
const userFormRef = ref(null);
const submitLoading = ref<boolean>(false);
const isEdit = ref<boolean>(false);
const userForm = reactive({
  id: 0,
  username: '',
  email: '',
  password: '',
  full_name: '',
  phone: '',
  role: 'patient',
  is_active: true,
});

// 表单校验规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度必须在3-20个字符之间', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
};

// 加载用户列表
const loadUsers = async () => {
  loading.value = true;
  try {
    const response = await getUsers(
      pagination.current, 
      pagination.pageSize, 
      searchForm.search, 
      searchForm.role
    );
    
    if (response.success && response.data) {
      users.value = response.data.users;
      pagination.total = response.data.total;
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    message.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理表格变化（分页、排序、筛选）
const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  loadUsers();
};

// 执行搜索
const handleSearch = () => {
  pagination.current = 1;
  loadUsers();
};

// 重置搜索
const resetSearch = () => {
  searchForm.search = '';
  searchForm.role = '';
  pagination.current = 1;
  loadUsers();
};

// 查看用户详情
const viewUserDetail = async (user: User) => {
  // 先设置基本用户信息，确保界面能显示内容
  currentUser.value = user;
  userDetailVisible.value = true;
  
  // 再加载详细信息
  detailLoading.value = true;
  try {
    console.log('Loading user details for ID:', user.id);
    // 获取完整的用户信息
    const response = await getUser(user.id);
    console.log('User details response:', response);
    
    if (response.success && response.data) {
      // 更新当前用户数据
      currentUser.value = response.data;
    } else {
      console.error('Failed to get user details:', response.message);
      message.error(response.message || '获取用户详情失败');
    }
  } catch (error) {
    console.error('获取用户详情失败:', error);
    message.error('获取用户详情失败');
  } finally {
    detailLoading.value = false;
  }
};

// 显示创建用户模态框
const showCreateUserModal = () => {
  isEdit.value = false;
  // 添加默认密码
  const defaultPassword = 'Password123!';
  Object.assign(userForm, {
    id: 0,
    username: '',
    email: '',
    password: defaultPassword,
    full_name: '',
    phone: '',
    role: 'patient',
    is_active: true,
  });
  userFormVisible.value = true;
};

// 编辑用户
const editUser = (user: User) => {
  isEdit.value = true;
  Object.assign(userForm, { 
    id: user.id,
    username: user.username, 
    email: user.email, 
    password: '', // 编辑时不需要填密码
    full_name: user.full_name || '',
    phone: user.phone || '',
    role: user.role,
    is_active: user.is_active
  });
  
  userDetailVisible.value = false;
  userFormVisible.value = true;
};

// 提交用户表单
const submitUserForm = async () => {
  // @ts-ignore - 表单引用类型
  const valid = await userFormRef.value?.validate();
  if (!valid) return;
  
  submitLoading.value = true;
  try {
    if (isEdit.value) {
      // 更新用户
      const response = await updateUser(userForm.id, {
        username: userForm.username,
        email: userForm.email,
        full_name: userForm.full_name,
        phone: userForm.phone,
        role: userForm.role,
        is_active: userForm.is_active,
        // 仅当输入了密码时才包含密码字段
        ...(userForm.password ? { password: userForm.password } : {})
      });
      
      if (response.success) {
        message.success('用户更新成功');
        loadUsers();
        userFormVisible.value = false;
      }
    } else {
      // 创建用户
      const response = await createUser({
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        full_name: userForm.full_name,
        phone: userForm.phone,
        role: userForm.role,
        is_active: userForm.is_active
      });
      
      if (response.success) {
        message.success('用户创建成功');
        loadUsers();
        userFormVisible.value = false;
      }
    }
  } catch (error) {
    console.error('保存用户失败:', error);
    message.error('保存用户失败');
  } finally {
    submitLoading.value = false;
  }
};

// 删除用户确认
const deleteUserConfirm = async (user: User) => {
  try {
    const response = await deleteUser(user.id);
    if (response.success) {
      message.success('用户删除成功');
      loadUsers();
    }
  } catch (error) {
    console.error('删除用户失败:', error);
    message.error('删除用户失败');
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 格式化角色
const formatRole = (role: string): string => {
  switch (role) {
    case 'patient': return '患者';
    case 'doctor': return '医生';
    case 'researcher': return '研究人员';
    case 'admin': return '管理员';
    default: return role;
  }
};

// 获取角色颜色
const getRoleColor = (role: string): string => {
  switch (role) {
    case 'patient': return 'blue';
    case 'doctor': return 'green';
    case 'researcher': return 'purple';
    case 'admin': return 'orange';
    default: return 'default';
  }
};

// 组件挂载时加载用户列表
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.ant-form {
  margin-bottom: 16px;
}

.form-help-text {
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 4px;
}
</style> 