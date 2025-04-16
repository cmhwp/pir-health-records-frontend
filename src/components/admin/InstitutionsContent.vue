<template>
  <div class="institutions-container">
    <a-card title="医疗机构管理" :bordered="false">
      <template #extra>
        <a-space>
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索机构名称或代码"
            style="width: 250px"
            @search="handleSearch"
          />
          <a-button type="primary" @click="showCreateModal">
            <template #icon><plus-outlined /></template>
            添加机构
          </a-button>
          <a-button @click="fetchInstitutions">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>
      
      <a-table
        :dataSource="institutions"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        rowKey="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div>
              <a-tag v-if="record.logo_url" color="blue" style="margin-right: 8px">
                <template #icon><picture-outlined /></template>
              </a-tag>
              {{ record.name }}
            </div>
          </template>
          
          <template v-if="column.key === 'status'">
            <a-tag :color="record.is_active ? 'success' : 'error'">
              {{ record.is_active ? '启用' : '禁用' }}
            </a-tag>
          </template>
          
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="viewInstitution(record)">
                <template #icon><eye-outlined /></template>
                查看
              </a-button>
              <a-button type="link" size="small" @click="editInstitution(record)">
                <template #icon><edit-outlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除这个医疗机构吗?"
                ok-text="是"
                cancel-text="否"
                @confirm="deleteInstitution(record.id)"
              >
                <a-button type="link" danger size="small">
                  <template #icon><delete-outlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑机构模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      :confirmLoading="confirmLoading"
      width="700px"
    >
      <a-form :model="institutionForm" :rules="rules" ref="formRef" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="机构名称" name="name">
              <a-input v-model:value="institutionForm.name" placeholder="请输入机构名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="机构代码" name="code">
              <a-input v-model:value="institutionForm.code" placeholder="请输入机构代码" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系电话" name="phone">
              <a-input v-model:value="institutionForm.phone" placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="电子邮箱" name="email">
              <a-input v-model:value="institutionForm.email" placeholder="请输入电子邮箱" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="机构地址" name="address">
          <a-input v-model:value="institutionForm.address" placeholder="请输入机构地址" />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="网站" name="website">
              <a-input v-model:value="institutionForm.website" placeholder="请输入网站地址" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Logo URL" name="logo_url">
              <a-input v-model:value="institutionForm.logo_url" placeholder="请输入Logo URL" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="机构描述" name="description">
          <a-textarea v-model:value="institutionForm.description" :rows="4" placeholder="请输入机构描述" />
        </a-form-item>
        
        <a-form-item label="状态" name="is_active">
          <a-switch v-model:checked="institutionForm.is_active" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看机构详情抽屉 -->
    <a-drawer
      v-model:visible="drawerVisible"
      title="医疗机构详情"
      width="600"
      placement="right"
    >
      <a-descriptions bordered :column="1" v-if="selectedInstitution">
        <a-descriptions-item label="机构名称">{{ selectedInstitution.name }}</a-descriptions-item>
        <a-descriptions-item label="机构代码">{{ selectedInstitution.code || '未设置' }}</a-descriptions-item>
        <a-descriptions-item label="机构地址">{{ selectedInstitution.address || '未设置' }}</a-descriptions-item>
        <a-descriptions-item label="联系电话">{{ selectedInstitution.phone || '未设置' }}</a-descriptions-item>
        <a-descriptions-item label="电子邮箱">{{ selectedInstitution.email || '未设置' }}</a-descriptions-item>
        <a-descriptions-item label="网站">
          <a v-if="selectedInstitution.website" :href="selectedInstitution.website" target="_blank">{{ selectedInstitution.website }}</a>
          <span v-else>未设置</span>
        </a-descriptions-item>
        <a-descriptions-item label="Logo">
          <img 
            v-if="selectedInstitution.logo_url" 
            :src="selectedInstitution.logo_url" 
            alt="机构Logo" 
            style="max-width: 100px; max-height: 100px;"
          />
          <span v-else>未设置</span>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="selectedInstitution.is_active ? 'success' : 'error'">
            {{ selectedInstitution.is_active ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDate(selectedInstitution.created_at) }}</a-descriptions-item>
        <a-descriptions-item label="最后更新">{{ formatDate(selectedInstitution.updated_at) }}</a-descriptions-item>
        <a-descriptions-item label="机构描述">{{ selectedInstitution.description || '未设置' }}</a-descriptions-item>
      </a-descriptions>
      
      <div style="margin-top: 24px">
        <a-button type="primary" @click="selectedInstitution && editInstitution(selectedInstitution)">
          <template #icon><edit-outlined /></template>
          编辑信息
        </a-button>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import type { FormInstance, TablePaginationConfig } from 'ant-design-vue';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined
} from '@ant-design/icons-vue';
import {
  getInstitutions,
  getInstitution,
  createInstitution,
  updateInstitution,
  deleteInstitution as apiDeleteInstitution
} from '@/api/admin';
import type { Institution, CreateInstitutionRequest, UpdateInstitutionRequest } from '@/types/admin';

// 状态变量
const loading = ref<boolean>(false);
const institutions = ref<Institution[]>([]);
const searchText = ref<string>('');
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50']
});

// 模态框相关
const modalVisible = ref<boolean>(false);
const modalTitle = ref<string>('添加医疗机构');
const confirmLoading = ref<boolean>(false);
const formRef = ref<FormInstance>();
const institutionForm = reactive<CreateInstitutionRequest & { id?: number }>({
  name: '',
  code: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  description: '',
  logo_url: '',
  is_active: true
});

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入机构名称', trigger: 'blur' }]
};

// 抽屉相关
const drawerVisible = ref<boolean>(false);
const selectedInstitution = ref<Institution | null>(null);

// 表格列定义
const columns = [
  {
    title: '机构名称',
    key: 'name',
    dataIndex: 'name',
    sorter: true,
  },
  {
    title: '机构代码',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: '联系电话',
    dataIndex: 'phone',
    key: 'phone',
  },
  {
    title: '地址',
    dataIndex: 'address',
    key: 'address',
    ellipsis: true,
  },
  {
    title: '状态',
    key: 'status',
  },
  {
    title: '操作',
    key: 'actions',
  },
];

// 格式化日期
const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 获取医疗机构列表
const fetchInstitutions = async () => {
  loading.value = true;
  try {
    const response = await getInstitutions(
      pagination.current || 1,
      pagination.pageSize || 10,
      searchText.value
    );
    
    if (response.success && response.data) {
      institutions.value = response.data.institutions;
      pagination.total = response.data.total;
    } else {
      message.error(response.message || '获取医疗机构列表失败');
    }
  } catch (error) {
    console.error('获取医疗机构列表失败:', error);
    message.error('获取医疗机构列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchInstitutions();
};

// 处理表格变化
const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchInstitutions();
};

// 查看医疗机构详情
const viewInstitution = async (institution: Institution) => {
  selectedInstitution.value = institution;
  drawerVisible.value = true;
};

// 显示创建模态框
const showCreateModal = () => {
  modalTitle.value = '添加医疗机构';
  // 重置表单
  Object.keys(institutionForm).forEach(key => {
    (institutionForm as any)[key] = key === 'is_active' ? true : '';
  });
  delete institutionForm.id;
  
  modalVisible.value = true;
};

// 编辑医疗机构
const editInstitution = (institution: Institution) => {
  modalTitle.value = '编辑医疗机构';
  // 填充表单
  Object.keys(institutionForm).forEach(key => {
    (institutionForm as any)[key] = (institution as any)[key] || (key === 'is_active' ? true : '');
  });
  institutionForm.id = institution.id;
  
  modalVisible.value = true;
  // 如果抽屉是打开的，先关闭它
  drawerVisible.value = false;
};

// 处理模态框确认
const handleModalOk = async () => {
  // 表单验证
  try {
    await formRef.value?.validate();
    confirmLoading.value = true;
    
    if (institutionForm.id) {
      // 更新机构
      const updateData: UpdateInstitutionRequest = { ...institutionForm };
      delete (updateData as any).id;
      
      const response = await updateInstitution(institutionForm.id, updateData);
      if (response.success) {
        message.success('医疗机构更新成功');
        fetchInstitutions();
        modalVisible.value = false;
      } else {
        message.error(response.message || '更新失败');
      }
    } else {
      // 创建新机构
      const response = await createInstitution(institutionForm);
      if (response.success) {
        message.success('医疗机构创建成功');
        fetchInstitutions();
        modalVisible.value = false;
      } else {
        message.error(response.message || '创建失败');
      }
    }
  } catch (error) {
    console.error('表单验证或提交失败:', error);
  } finally {
    confirmLoading.value = false;
  }
};

// 删除医疗机构
const deleteInstitution = async (id: number) => {
  try {
    const response = await apiDeleteInstitution(id);
    if (response.success) {
      message.success('医疗机构已删除');
      fetchInstitutions();
      
      // 如果当前正在查看的是被删除的机构，关闭抽屉
      if (selectedInstitution.value?.id === id) {
        drawerVisible.value = false;
      }
    } else {
      message.error(response.message || '删除失败');
    }
  } catch (error) {
    console.error('删除医疗机构失败:', error);
    message.error('删除医疗机构失败');
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchInstitutions();
});
</script>

<style scoped>
.institutions-container {
  padding: 0;
  background-color: #f0f2f5;
}
</style> 