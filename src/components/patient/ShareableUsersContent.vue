<template>
  <div class="shareable-users-container">
    <a-row :gutter="16">
      <!-- 左侧用户列表 -->
      <a-col :span="16">
        <a-card title="可共享用户" :bordered="false">
          <template #extra>
            <a-space>
              <a-input-search
                v-model:value="search"
                placeholder="搜索用户名/姓名/邮箱"
                style="width: 250px"
                @search="handleSearch"
                allow-clear
              />
              <a-radio-group v-model:value="roleFilter" @change="handleRoleFilterChange">
                <a-radio-button value="">全部用户</a-radio-button>
                <a-radio-button value="doctor">医生</a-radio-button>
                <a-radio-button value="patient">患者</a-radio-button>
              </a-radio-group>
              <a-button type="primary" @click="fetchUsers">
                <template #icon><reload-outlined /></template>
              </a-button>
            </a-space>
          </template>
          
          <a-list
            :loading="loading"
            item-layout="horizontal"
            :data-source="users"
            :pagination="pagination"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :description="`${getRoleName(item.role)}${getExtraInfo(item)}`"
                >
                  <template #title>
                    <a @click="selectUser(item)">{{ item.full_name }}</a>
                    <a-tag v-if="item.shared_records_count > 0" color="blue" style="margin-left: 8px">
                      已共享记录 {{ item.shared_records_count }}
                    </a-tag>
                  </template>
                  <template #avatar>
                    <a-avatar :style="{ backgroundColor: getAvatarColor(item.role) }">
                      {{ item.full_name ? item.full_name.charAt(0).toUpperCase() : item.username.charAt(0).toUpperCase() }}
                    </a-avatar>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a @click="selectUser(item)">查看详情</a>
                  <a @click="showShareModal(item)">共享记录</a>
                </template>
              </a-list-item>
            </template>
            
            <template #footer>
              <div>
                <a-statistic-group>
                  <a-statistic
                    title="医生"
                    :value="roleStats.doctor || 0"
                    style="margin-right: 32px"
                  />
                  <a-statistic
                    title="患者"
                    :value="roleStats.patient || 0"
                  />
                </a-statistic-group>
              </div>
            </template>
          </a-list>
        </a-card>
      </a-col>
      
      <!-- 右侧用户详情 -->
      <a-col :span="8">
        <a-card :bordered="false">
          <template #title>
            {{ selectedUser ? '用户详情' : '选择用户查看详情' }}
          </template>
          
          <a-empty v-if="!selectedUser" description="请从左侧列表选择用户" />
          
          <a-spin :spinning="detailLoading" v-else>
            <a-descriptions :column="1" bordered>
              <a-descriptions-item label="用户名">
                {{ selectedUser.username }}
              </a-descriptions-item>
              <a-descriptions-item label="姓名">
                {{ selectedUser.full_name }}
              </a-descriptions-item>
              <a-descriptions-item label="邮箱">
                {{ selectedUser.email }}
              </a-descriptions-item>
              <a-descriptions-item label="角色">
                <a-tag :color="selectedUser.role === 'doctor' ? 'blue' : 'green'">
                  {{ getRoleName(selectedUser.role) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="注册时间" v-if="selectedUser.created_at">
                {{ formatDate(selectedUser.created_at) }}
              </a-descriptions-item>
              
              <!-- 医生特有信息 -->
              <template v-if="selectedUser.role === 'doctor' && selectedUser.doctor_info">
                <a-descriptions-item label="医院" v-if="selectedUser.doctor_info.hospital">
                  {{ selectedUser.doctor_info.hospital }}
                </a-descriptions-item>
                <a-descriptions-item label="科室" v-if="selectedUser.doctor_info.department">
                  {{ selectedUser.doctor_info.department }}
                </a-descriptions-item>
                <a-descriptions-item label="专业" v-if="selectedUser.doctor_info.specialty">
                  {{ selectedUser.doctor_info.specialty }}
                </a-descriptions-item>
                <a-descriptions-item label="执业年限" v-if="selectedUser.doctor_info.years_of_experience">
                  {{ selectedUser.doctor_info.years_of_experience }} 年
                </a-descriptions-item>
                <a-descriptions-item label="个人简介" v-if="selectedUser.doctor_info.bio">
                  {{ selectedUser.doctor_info.bio }}
                </a-descriptions-item>
              </template>
              
              <!-- 患者特有信息 -->
              <template v-if="selectedUser.role === 'patient' && selectedUser.patient_info">
                <a-descriptions-item label="性别" v-if="selectedUser.patient_info.gender">
                  {{ selectedUser.patient_info.gender === 'male' ? '男' : '女' }}
                </a-descriptions-item>
                <a-descriptions-item label="地址" v-if="selectedUser.patient_info.address">
                  {{ selectedUser.patient_info.address }}
                </a-descriptions-item>
              </template>
            </a-descriptions>
            
            <div style="margin-top: 16px">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
                <h3 style="margin-bottom: 0">已共享记录</h3>
                <a-button type="primary" @click="showShareModal(selectedUser)">
                  共享记录
                </a-button>
              </div>
              
              <a-list size="small" bordered>
                <a-list-item v-for="record in selectedUser.shared_records" :key="record.share_id">
                  <a-list-item-meta>
                    <template #title>{{ record.title }}</template>
                    <template #description>
                      <a-space>
                        <a-tag>{{ getRecordTypeName(record.record_type) }}</a-tag>
                        <a-tag color="blue">{{ getPermissionName(record.permission) }}</a-tag>
                        <span v-if="record.created_at">共享于: {{ formatDate(record.created_at) }}</span>
                      </a-space>
                    </template>
                  </a-list-item-meta>
                  <template #actions>
                    <a @click="viewRecord(record.record_id)">查看</a>
                  </template>
                </a-list-item>
                <a-empty v-if="selectedUser.shared_records.length === 0" description="暂无共享记录" />
              </a-list>
              
              <div v-if="selectedUser.shared_records_count > selectedUser.shared_records.length" style="text-align: center; margin-top: 12px">
                <a href="javascript:void(0)" @click="goToSharedRecords(selectedUser)">
                  查看全部 {{ selectedUser.shared_records_count }} 条共享记录
                </a>
              </div>
            </div>
          </a-spin>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 共享记录对话框 -->
    <a-modal
      v-model:visible="shareModalVisible"
      title="共享健康记录"
      @ok="handleShare"
      :confirm-loading="shareLoading"
      width="700px"
    >
      <template v-if="userToShare">
        <p>您正在与 <b>{{ userToShare.full_name }}</b> ({{ getRoleName(userToShare.role) }}) 共享记录</p>
        
        <a-form :model="shareForm" layout="vertical">
          <a-form-item
            label="选择记录"
            name="record_id"
            :rules="[{ required: true, message: '请选择要共享的记录' }]"
          >
            <a-select
              v-model:value="shareForm.record_id"
              placeholder="选择要共享的记录"
              style="width: 100%"
              :loading="recordsLoading"
              show-search
              :options="recordOptions"
              :filter-option="filterRecordOption"
            ></a-select>
          </a-form-item>
          
          <a-form-item
            label="共享权限"
            name="permission"
          >
            <a-radio-group v-model:value="shareForm.permission">
              <a-radio value="view">只读权限</a-radio>
              <a-radio value="edit">编辑权限</a-radio>
              <a-radio value="full">完全权限</a-radio>
            </a-radio-group>
          </a-form-item>
          
          <a-form-item
            label="有效期"
            name="expiry_days"
          >
            <a-radio-group v-model:value="shareForm.expiry_days">
              <a-radio :value="null">永久有效</a-radio>
              <a-radio :value="7">7天</a-radio>
              <a-radio :value="30">30天</a-radio>
              <a-radio :value="90">90天</a-radio>
              <a-radio :value="365">1年</a-radio>
            </a-radio-group>
          </a-form-item>
        </a-form>
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  ReloadOutlined,
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons-vue';
import { getShareableUsers, getShareableUserDetail, shareHealthRecord, getHealthRecords } from '@/api/health';
import type { ShareableUser, ShareableUserDetail, ShareRecordRequest, SharePermission } from '@/types/health';

const router = useRouter();

// 页面状态
const loading = ref(false);
const detailLoading = ref(false);
const users = ref<ShareableUser[]>([]);
const selectedUser = ref<ShareableUserDetail | null>(null);
const roleStats = ref<Record<string, number>>({});

// 搜索和筛选
const search = ref('');
const roleFilter = ref('');

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  onChange: (page: number, pageSize?: number) => {
    pagination.current = page;
    if (pageSize) pagination.pageSize = pageSize;
    fetchUsers();
  }
});

// 共享记录
const shareModalVisible = ref(false);
const userToShare = ref<ShareableUser | null>(null);
const shareLoading = ref(false);
const recordsLoading = ref(false);
const recordOptions = ref<{value: string, label: string}[]>([]);
const shareForm = reactive({
  share_with_id: 0,
  permission: 'view' as SharePermission,
  expiry_days: 30,
  record_id: ''
});

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await getShareableUsers(
      pagination.current,
      pagination.pageSize,
      search.value || undefined,
      roleFilter.value || undefined
    );
    
    if (response.success && response.data) {
      users.value = response.data.users;
      roleStats.value = response.data.role_stats;
      pagination.total = response.data.pagination.total;
    } else {
      message.error(response.message || '获取用户列表失败');
    }
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    message.error('获取用户列表失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
};

// 选择用户并加载详情
const selectUser = async (user: ShareableUser) => {
  detailLoading.value = true;
  try {
    const response = await getShareableUserDetail(user.id);
    
    if (response.success && response.data) {
      selectedUser.value = response.data;
    } else {
      message.error(response.message || '获取用户详情失败');
    }
  } catch (error: any) {
    console.error('获取用户详情失败:', error);
    message.error('获取用户详情失败: ' + (error.message || '未知错误'));
  } finally {
    detailLoading.value = false;
  }
};

// 获取健康记录选项
const fetchRecords = async () => {
  recordsLoading.value = true;
  try {
    const response = await getHealthRecords({
      page: 1,
      per_page: 100
    });
    
    if (response.success && response.data) {
      recordOptions.value = response.data.records.map(record => ({
        value: record._id,
        label: `${record.title} (${getRecordTypeName(record.record_type)})`
      }));
    } else {
      message.error(response.message || '获取健康记录失败');
    }
  } catch (error) {
    console.error('获取健康记录失败:', error);
    message.error('获取健康记录失败');
  } finally {
    recordsLoading.value = false;
  }
};

// 显示共享对话框
const showShareModal = (user: ShareableUser) => {
  userToShare.value = user;
  shareForm.share_with_id = user.id;
  shareForm.record_id = '';
  shareModalVisible.value = true;
  
  // 加载记录选项
  fetchRecords();
};

// 处理共享
const handleShare = async () => {
  if (!shareForm.record_id) {
    message.error('请选择要共享的记录');
    return;
  }
  
  shareLoading.value = true;
  try {
    const response = await shareHealthRecord(
      shareForm.record_id,
      {
        share_with_id: shareForm.share_with_id,
        permission: shareForm.permission,
        expiry_days: shareForm.expiry_days
      }
    );
    
    if (response.success) {
      message.success('记录共享成功');
      shareModalVisible.value = false;
      
      // 如果当前选中的用户是共享的对象，刷新详情
      if (selectedUser.value && selectedUser.value.id === shareForm.share_with_id) {
        selectUser(selectedUser.value);
      }
    } else {
      message.error(response.message || '记录共享失败');
    }
  } catch (error: any) {
    console.error('记录共享失败:', error);
    message.error('记录共享失败: ' + (error.message || '未知错误'));
  } finally {
    shareLoading.value = false;
  }
};

// 过滤记录选项
const filterRecordOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 搜索处理
const handleSearch = () => {
  pagination.current = 1;
  fetchUsers();
};

// 角色筛选变更处理
const handleRoleFilterChange = () => {
  pagination.current = 1;
  fetchUsers();
};

// 获取角色名称
const getRoleName = (role: string): string => {
  const roleMap: Record<string, string> = {
    doctor: '医生',
    patient: '患者',
    admin: '管理员',
    researcher: '研究者'
  };
  return roleMap[role] || '未知角色';
};

// 获取额外信息
const getExtraInfo = (user: ShareableUser): string => {
  if (user.role === 'doctor' && user.doctor_info) {
    const parts = [];
    if (user.doctor_info.hospital) parts.push(user.doctor_info.hospital);
    if (user.doctor_info.department) parts.push(user.doctor_info.department);
    if (user.doctor_info.specialty) parts.push(user.doctor_info.specialty);
    return parts.length > 0 ? ` | ${parts.join(' - ')}` : '';
  }
  return '';
};

// 获取头像颜色
const getAvatarColor = (role: string): string => {
  const colorMap: Record<string, string> = {
    doctor: '#1890ff',
    patient: '#52c41a',
    admin: '#722ed1',
    researcher: '#eb2f96'
  };
  return colorMap[role] || '#1890ff';
};

// 获取记录类型名称
const getRecordTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    general: '常规检查',
    laboratory: '实验室检查',
    medication: '用药记录',
    imaging: '影像检查',
    vital_signs: '生命体征',
    surgery: '手术记录',
    vaccination: '疫苗接种',
    allergy: '过敏记录',
    diagnosis: '诊断结果',
    other: '其他记录'
  };
  return typeMap[type] || '未知类型';
};

// 获取权限名称
const getPermissionName = (permission: string): string => {
  const permissionMap: Record<string, string> = {
    view: '只读权限',
    edit: '编辑权限',
    full: '完全权限'
  };
  return permissionMap[permission] || '未知权限';
};

// 格式化日期
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '未记录';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 查看记录详情
const viewRecord = (recordId: string) => {
  router.push(`/patient/records/${recordId}`);
};

// 跳转到共享记录页面
const goToSharedRecords = (user: ShareableUserDetail) => {
  router.push({
    path: '/patient/shared-records',
    query: { 
      tab: 'shared-by-me',
      shared_with: user.id.toString()
    }
  });
};

// 初始化页面
onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.shareable-users-container {
  width: 100%;
}
</style> 