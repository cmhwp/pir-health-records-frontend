<template>
  <div class="record-types-container">
    <a-card title="记录类型管理" :bordered="false">
      <template #extra>
        <a-space>
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索类型名称或代码"
            style="width: 250px"
            @search="handleSearch"
          />
          <a-button type="primary" @click="showCreateModal">
            <template #icon><plus-outlined /></template>
            添加类型
          </a-button>
          <a-button @click="fetchRecordTypes">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>
      
      <a-table
        :dataSource="recordTypes"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        rowKey="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div>
              <a-tag :color="record.color || '#108ee9'" style="margin-right: 8px">
                {{ record.icon || '#' }}
              </a-tag>
              {{ record.name }}
            </div>
          </template>
          
          <template v-if="column.key === 'color'">
            <div style="display: flex; align-items: center;">
              <div 
                :style="{
                  backgroundColor: record.color || '#d9d9d9',
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  marginRight: '8px'
                }"
              ></div>
              {{ record.color || '未设置' }}
            </div>
          </template>
          
          <template v-if="column.key === 'status'">
            <a-tag :color="record.is_active ? 'success' : 'error'">
              {{ record.is_active ? '启用' : '禁用' }}
            </a-tag>
          </template>
          
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="viewRecordType(record)">
                <template #icon><eye-outlined /></template>
                查看
              </a-button>
              <a-button type="link" size="small" @click="editRecordType(record)">
                <template #icon><edit-outlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除这个记录类型吗?"
                ok-text="是"
                cancel-text="否"
                @confirm="deleteRecordType(record.id)"
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

    <!-- 创建/编辑记录类型模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      :confirmLoading="confirmLoading"
      width="700px"
    >
      <a-form :model="recordTypeForm" :rules="rules" ref="formRef" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="类型名称" name="name">
              <a-input v-model:value="recordTypeForm.name" placeholder="请输入类型名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="类型代码" name="code">
              <a-input v-model:value="recordTypeForm.code" placeholder="请输入类型代码" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="显示颜色" name="color">
              <a-input v-model:value="recordTypeForm.color" placeholder="例如: #1890ff" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="图标字符" name="icon">
              <a-input v-model:value="recordTypeForm.icon" placeholder="例如: +" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="类型描述" name="description">
          <a-textarea v-model:value="recordTypeForm.description" :rows="4" placeholder="请输入类型描述" />
        </a-form-item>
        
        <a-form-item label="状态" name="is_active">
          <a-switch v-model:checked="recordTypeForm.is_active" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看记录类型详情抽屉 -->
    <a-drawer
      v-model:visible="drawerVisible"
      title="记录类型详情"
      width="600"
      placement="right"
    >
      <a-descriptions bordered :column="1" v-if="selectedRecordType">
        <a-descriptions-item label="类型名称">{{ selectedRecordType.name }}</a-descriptions-item>
        <a-descriptions-item label="类型代码">{{ selectedRecordType.code }}</a-descriptions-item>
        <a-descriptions-item label="显示颜色">
          <div style="display: flex; align-items: center;">
            <div 
              :style="{
                backgroundColor: selectedRecordType.color || '#d9d9d9',
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                marginRight: '8px'
              }"
            ></div>
            {{ selectedRecordType.color || '未设置' }}
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="图标字符">
          <a-tag :color="selectedRecordType.color || '#108ee9'">
            {{ selectedRecordType.icon || '#' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="selectedRecordType.is_active ? 'success' : 'error'">
            {{ selectedRecordType.is_active ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDate(selectedRecordType.created_at) }}</a-descriptions-item>
        <a-descriptions-item label="最后更新">{{ formatDate(selectedRecordType.updated_at) }}</a-descriptions-item>
        <a-descriptions-item label="类型描述">{{ selectedRecordType.description || '未设置' }}</a-descriptions-item>
      </a-descriptions>
      
      <div style="margin-top: 24px">
        <a-button type="primary" @click="editRecordType(selectedRecordType)">
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
  TagsOutlined
} from '@ant-design/icons-vue';
import {
  getRecordTypes,
  getRecordType,
  createRecordType,
  updateRecordType,
  deleteRecordType as apiDeleteRecordType
} from '@/api/admin';
import type { CustomRecordType, CreateRecordTypeRequest, UpdateRecordTypeRequest } from '@/types/admin';

// 状态变量
const loading = ref<boolean>(false);
const recordTypes = ref<CustomRecordType[]>([]);
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
const modalTitle = ref<string>('添加记录类型');
const confirmLoading = ref<boolean>(false);
const formRef = ref<FormInstance>();
const recordTypeForm = reactive<CreateRecordTypeRequest & { id?: number }>({
  name: '',
  code: '',
  description: '',
  color: '',
  icon: '',
  is_active: true
});

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入类型代码', trigger: 'blur' }]
};

// 抽屉相关
const drawerVisible = ref<boolean>(false);
const selectedRecordType = ref<CustomRecordType | null>(null);

// 表格列定义
const columns = [
  {
    title: '类型名称',
    key: 'name',
    dataIndex: 'name',
    sorter: true,
  },
  {
    title: '类型代码',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: '显示颜色',
    key: 'color',
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

// 获取记录类型列表
const fetchRecordTypes = async () => {
  loading.value = true;
  try {
    const response = await getRecordTypes(
      pagination.current || 1,
      pagination.pageSize || 10,
      searchText.value
    );
    
    if (response.success && response.data) {
      recordTypes.value = response.data.record_types;
      pagination.total = response.data.total;
    } else {
      message.error(response.message || '获取记录类型列表失败');
    }
  } catch (error) {
    console.error('获取记录类型列表失败:', error);
    message.error('获取记录类型列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.current = 1;
  fetchRecordTypes();
};

// 处理表格变化
const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.current = pag.current || 1;
  pagination.pageSize = pag.pageSize || 10;
  fetchRecordTypes();
};

// 查看记录类型详情
const viewRecordType = async (recordType: CustomRecordType) => {
  selectedRecordType.value = recordType;
  drawerVisible.value = true;
};

// 显示创建模态框
const showCreateModal = () => {
  modalTitle.value = '添加记录类型';
  // 重置表单
  Object.keys(recordTypeForm).forEach(key => {
    (recordTypeForm as any)[key] = key === 'is_active' ? true : '';
  });
  delete recordTypeForm.id;
  
  modalVisible.value = true;
};

// 编辑记录类型
const editRecordType = (recordType: CustomRecordType) => {
  modalTitle.value = '编辑记录类型';
  // 填充表单
  Object.keys(recordTypeForm).forEach(key => {
    (recordTypeForm as any)[key] = (recordType as any)[key] || (key === 'is_active' ? true : '');
  });
  recordTypeForm.id = recordType.id;
  
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
    
    if (recordTypeForm.id) {
      // 更新记录类型
      const updateData: UpdateRecordTypeRequest = { ...recordTypeForm };
      delete (updateData as any).id;
      
      const response = await updateRecordType(recordTypeForm.id, updateData);
      if (response.success) {
        message.success('记录类型更新成功');
        fetchRecordTypes();
        modalVisible.value = false;
      } else {
        message.error(response.message || '更新失败');
      }
    } else {
      // 创建新记录类型
      const response = await createRecordType(recordTypeForm);
      if (response.success) {
        message.success('记录类型创建成功');
        fetchRecordTypes();
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

// 删除记录类型
const deleteRecordType = async (id: number) => {
  try {
    const response = await apiDeleteRecordType(id);
    if (response.success) {
      message.success('记录类型已删除');
      fetchRecordTypes();
      
      // 如果当前正在查看的是被删除的类型，关闭抽屉
      if (selectedRecordType.value?.id === id) {
        drawerVisible.value = false;
      }
    } else {
      message.error(response.message || '删除失败');
    }
  } catch (error) {
    console.error('删除记录类型失败:', error);
    message.error('删除记录类型失败');
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchRecordTypes();
});
</script>

<style scoped>
.record-types-container {
  padding: 0;
  background-color: #f0f2f5;
}
</style> 