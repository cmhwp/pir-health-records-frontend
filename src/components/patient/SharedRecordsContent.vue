<template>
  <div class="shared-records-container">
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="shared-by-me" tab="我共享的记录">
        <a-card :loading="loadingSharedByMe">
          <template #extra>
            <a-space>
              <a-checkbox v-model:checked="onlyValidRecords" @change="fetchSharedByMe">
                仅显示有效记录
              </a-checkbox>
              <a-button type="primary" @click="navigateToShareUsers">
                <template #icon><user-add-outlined /></template>
                共享记录
              </a-button>
              <a-button type="primary" @click="fetchSharedByMe">
                <template #icon><reload-outlined /></template>
                刷新
              </a-button>
            </a-space>
          </template>
          
          <!-- 显示当前筛选的用户信息 -->
          <a-alert
            v-if="filteredUserInfo"
            :message="`当前显示与 ${filteredUserInfo.full_name} 的共享记录`"
            type="info"
            style="margin-bottom: 16px"
          >
            <template #action>
              <a-button size="small" type="text" @click="clearUserFilter">
                清除筛选
              </a-button>
            </template>
          </a-alert>
          
          <a-table
            :dataSource="sharedByMeRecords"
            :columns="sharedByMeColumns"
            :loading="loadingSharedByMe"
            :pagination="sharedByMePagination"
            @change="handleSharedByMeTableChange"
            rowKey="shared_id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'record_info'">
                <div>
                  <div>{{ record.record_info.title || '无标题' }}</div>
                  <div>
                    <a-tag v-if="record.record_info.record_type">
                      {{ getRecordTypeName(record.record_info.record_type) }}
                    </a-tag>
                    <span style="color: #999; margin-left: 8px; font-size: 12px">
                      {{ formatDate(record.record_info.record_date) }}
                    </span>
                  </div>
                </div>
              </template>
              
              <template v-if="column.key === 'shared_with'">
                <a-avatar style="background-color: #1890ff; margin-right: 8px">{{ record.shared_with?.username?.charAt(0) || '?' }}</a-avatar>
                {{ record.shared_with?.full_name || record.shared_with?.username || '未知用户' }}
              </template>
              
              <template v-if="column.key === 'permission'">
                <a-tag :color="getPermissionColor(record.permission)">
                  {{ getPermissionName(record.permission) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'validity'">
                <div>
                  <a-tag :color="record.is_valid ? 'success' : 'error'">
                    {{ record.is_valid ? '有效' : '已过期' }}
                  </a-tag>
                  <div style="font-size: 12px; color: #999; margin-top: 4px">
                    {{ formatValidity(record.expires_at) }}
                  </div>
                </div>
              </template>
              
              <template v-if="column.key === 'access_count'">
                <div>
                  <div><strong>{{ record.access_count || 0 }}</strong> 次</div>
                  <div v-if="record.last_accessed" style="font-size: 12px; color: #999; margin-top: 4px">
                    上次: {{ formatDate(record.last_accessed) }}
                  </div>
                  <div v-else style="font-size: 12px; color: #999; margin-top: 4px">
                    从未访问
                  </div>
                </div>
              </template>
              
              <template v-if="column.key === 'actions'">
                <div class="action-buttons">
                  <a-button type="link" size="small" @click="viewRecord(record.record_id)">
                    <template #icon><eye-outlined /></template>
                    查看
                  </a-button>
                  <a-button type="link" size="small" @click="showShareLink(record)">
                    <template #icon><link-outlined /></template>
                    共享链接
                  </a-button>
                  <a-button type="link" size="small" danger @click="confirmRevoke(record)">
                    <template #icon><stop-outlined /></template>
                    撤销
                  </a-button>
                </div>
              </template>
            </template>
            
            <template #emptyText>
              <a-empty description="暂无共享记录" />
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
      
      <a-tab-pane key="shared-with-me" tab="共享给我的记录">
        <a-card :loading="loadingSharedWithMe">
          <template #extra>
            <a-space>
              <a-checkbox v-model:checked="onlyValidRecords" @change="fetchSharedWithMe">
                仅显示有效记录
              </a-checkbox>
              <a-button type="primary" @click="fetchSharedWithMe">
                <template #icon><reload-outlined /></template>
                刷新
              </a-button>
            </a-space>
          </template>
          
          <a-table
            :dataSource="sharedWithMeRecords"
            :columns="sharedWithMeColumns"
            :loading="loadingSharedWithMe"
            :pagination="sharedWithMePagination"
            @change="handleSharedWithMeTableChange"
            rowKey="shared_id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'record_info'">
                <div>
                  <div>{{ record.record_info.title || '无标题' }}</div>
                  <div>
                    <a-tag v-if="record.record_info.record_type">
                      {{ getRecordTypeName(record.record_info.record_type) }}
                    </a-tag>
                    <span style="color: #999; margin-left: 8px; font-size: 12px">
                      {{ formatDate(record.record_info.record_date) }}
                    </span>
                  </div>
                </div>
              </template>
              
              <template v-if="column.key === 'owner'">
                <a-avatar style="background-color: #1890ff; margin-right: 8px">{{ record.owner?.username?.charAt(0) || '?' }}</a-avatar>
                {{ record.owner?.full_name || record.owner?.username || '未知用户' }}
              </template>
              
              <template v-if="column.key === 'permission'">
                <a-tag :color="getPermissionColor(record.permission)">
                  {{ getPermissionName(record.permission) }}
                </a-tag>
              </template>
              
              <template v-if="column.key === 'validity'">
                <div>
                  <a-tag :color="record.is_valid ? 'success' : 'error'">
                    {{ record.is_valid ? '有效' : '已过期' }}
                  </a-tag>
                  <div style="font-size: 12px; color: #999; margin-top: 4px">
                    {{ formatValidity(record.expires_at) }}
                  </div>
                </div>
              </template>
              
              <template v-if="column.key === 'access_count'">
                <div>
                  <div><strong>{{ record.access_count || 0 }}</strong> 次</div>
                  <div v-if="record.last_accessed" style="font-size: 12px; color: #999; margin-top: 4px">
                    上次: {{ formatDate(record.last_accessed) }}
                  </div>
                  <div v-else style="font-size: 12px; color: #999; margin-top: 4px">
                    从未访问
                  </div>
                </div>
              </template>
              
              <template v-if="column.key === 'actions'">
                <div class="action-buttons">
                  <a-button type="link" size="small" @click="viewSharedRecord(record.shared_id)">
                    <template #icon><eye-outlined /></template>
                    查看
                  </a-button>
                </div>
              </template>
            </template>
            
            <template #emptyText>
              <a-empty description="暂无共享记录" />
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>
    
    <!-- 记录详情抽屉 -->
    <a-drawer
      v-model:visible="recordDrawerVisible"
      title="健康记录详情"
      placement="right"
      width="600"
    >
      <a-spin :spinning="recordLoading">
        <div v-if="currentRecord">
          <a-descriptions title="基本信息" bordered>
            <a-descriptions-item label="标题" :span="3">
              {{ currentRecord.title }}
            </a-descriptions-item>
            <a-descriptions-item label="记录类型">
              <a-tag :color="getRecordTypeColor(currentRecord.record_type)">
                {{ getRecordTypeName(currentRecord.record_type) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="记录日期">
              {{ formatDate(currentRecord.record_date) }}
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatDate(currentRecord.created_at) }}
            </a-descriptions-item>
            <a-descriptions-item label="医疗机构" :span="2">
              {{ currentRecord.institution || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="医生姓名">
              {{ currentRecord.doctor_name || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="可见性">
              {{ getVisibilityName(currentRecord.visibility) || '未记录' }}
            </a-descriptions-item>
          </a-descriptions>

          <a-divider />

          <div v-if="currentRecord.description">
            <h3>记录描述</h3>
            <p>{{ currentRecord.description }}</p>
          </div>

          <div v-if="currentRecord.medication && currentRecord.medication.medication_name" style="margin-top: 20px">
            <h3>用药信息</h3>
            <a-descriptions bordered>
              <a-descriptions-item label="药物名称" :span="3">
                {{ currentRecord.medication.medication_name }}
              </a-descriptions-item>
              <a-descriptions-item label="剂量">
                {{ currentRecord.medication.dosage || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="频率">
                {{ currentRecord.medication.frequency || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="用药期间">
                {{ formatDateRange(currentRecord.medication.start_date, currentRecord.medication.end_date) }}
              </a-descriptions-item>
            </a-descriptions>
          </div>

          <!-- 生命体征数据 -->
          <div v-if="currentRecord.vital_signs && currentRecord.vital_signs.length > 0" style="margin-top: 20px">
            <h3>生命体征数据</h3>
            <a-table
              :dataSource="currentRecord.vital_signs"
              :columns="vitalSignColumns"
              :pagination="false"
              size="small"
              bordered
            >
              <template #bodyCell="{ column, text, record: vitalSign }">
                <template v-if="column.dataIndex === 'type'">
                  <a-tag :color="getVitalSignColor(vitalSign.type)">
                    {{ getVitalSignTypeName(vitalSign.type) }}
                  </a-tag>
                </template>
                <template v-else-if="column.dataIndex === 'measured_at'">
                  {{ formatDate(vitalSign.measured_at) }}
                </template>
                <template v-else-if="column.dataIndex === 'value'">
                  {{ vitalSign.value }} {{ vitalSign.unit }}
                </template>
              </template>
            </a-table>
          </div>

          <div v-if="currentRecord.files && currentRecord.files.length > 0" style="margin-top: 20px">
            <h3>相关文件</h3>
            <a-list size="small" bordered>
              <a-list-item v-for="file in currentRecord.files" :key="file.file_path">
                <a-list-item-meta>
                  <template #title>{{ file.file_name }}</template>
                  <template #description>{{ formatFileSize(file.file_size) }}</template>
                  <template #avatar>
                    <file-outlined />
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button type="link" @click="downloadFile(file.file_path)">
                    <template #icon><download-outlined /></template>
                    下载
                  </a-button>
                </template>
              </a-list-item>
            </a-list>
          </div>
          
          <div v-if="sharedInfo" style="margin-top: 20px">
            <h3>共享信息</h3>
            <a-descriptions bordered>
              <a-descriptions-item label="共享者">
                {{ sharedInfo.owner?.full_name || sharedInfo.owner?.username || '未知用户' }}
              </a-descriptions-item>
              <a-descriptions-item label="共享给">
                {{ sharedInfo.shared_with?.full_name || sharedInfo.shared_with?.username || '未知用户' }}
              </a-descriptions-item>
              <a-descriptions-item label="共享权限">
                <a-tag :color="getPermissionColor(sharedInfo.permission)">
                  {{ getPermissionName(sharedInfo.permission) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="共享时间">
                {{ formatDate(sharedInfo.created_at) }}
              </a-descriptions-item>
              <a-descriptions-item label="过期时间">
                {{ sharedInfo.expires_at ? formatDate(sharedInfo.expires_at) : '永久有效' }}
              </a-descriptions-item>
              <a-descriptions-item label="访问次数">
                {{ sharedInfo.access_count }}次
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </div>
        <a-empty v-else description="记录数据不存在" />
      </a-spin>
    </a-drawer>
    
    <!-- 撤销确认模态框 -->
    <a-modal
      v-model:visible="revokeModalVisible"
      title="撤销共享"
      :closable="false"
      :maskClosable="false"
      :confirm-loading="revokingShared"
      @ok="handleRevokeConfirm"
      @cancel="revokeModalVisible = false"
      okText="确认撤销"
      cancelText="取消"
    >
      <div>
        <p>您确定要撤销与 <b>{{ recordToRevoke?.shared_with?.full_name || recordToRevoke?.shared_with?.username || '该用户' }}</b> 的共享记录吗？</p>
        <p>记录标题: {{ recordToRevoke?.record_info?.title || '未知记录' }}</p>
        <p style="color: #ff4d4f">此操作无法撤销，对方将无法再访问该记录。</p>
      </div>
    </a-modal>

    <!-- 共享链接模态框 -->
    <a-modal
      v-model:visible="shareLinkModalVisible"
      title="共享链接"
      :footer="null"
      width="600px"
    >
      <div v-if="currentShareRecord">
        <p>您可以通过以下链接直接访问共享记录，无需登录系统：</p>
        <a-alert
          type="warning"
          message="安全提示"
          description="此链接包含访问密钥，任何拥有此链接的人都可以查看记录。请谨慎分享，并在不需要时撤销共享。"
          style="margin-bottom: 16px"
        />
        
        <div class="share-link-container">
          <a-input-group compact>
            <a-input
              ref="shareLinkInput"
              v-model:value="shareLink"
              readonly
              style="width: calc(100% - 80px)"
            />
            <a-tooltip title="复制链接">
              <a-button type="primary" @click="copyShareLink">
                <template #icon><copy-outlined /></template>
                复制
              </a-button>
            </a-tooltip>
          </a-input-group>
          
          <div style="margin-top: 16px">
            <span style="margin-right: 16px">有效期: {{ formatValidity(currentShareRecord.expires_at) }}</span>
            <span>权限: {{ getPermissionName(currentShareRecord.permission) }}</span>
          </div>
        </div>
        
        <div style="margin-top: 16px;">
          <p>共享给: <b>{{ currentShareRecord.shared_with?.full_name || currentShareRecord.shared_with?.username }}</b></p>
          <p>记录: {{ currentShareRecord.record_info?.title }}</p>
        </div>
        
        <div style="margin-top: 16px; text-align: right;">
          <a-button @click="shareLinkModalVisible = false">
            关闭
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  EyeOutlined,
  StopOutlined,
  ReloadOutlined,
  FileOutlined,
  DownloadOutlined,
  UserAddOutlined,
  LinkOutlined,
  CopyOutlined
} from '@ant-design/icons-vue';
import {
  getRecordsSharedByMe,
  getRecordsSharedWithMe,
  getHealthRecord,
  viewSharedRecord as fetchSharedRecord,
  revokeSharedRecord,
  getRecordFileUrl,
  getShareableUserDetail,
  getSharedRecordAccessUrl
} from '@/api/health';
import type {
  SharedRecordWithOwner,
  SharedRecordWithUser,
  HealthRecord,
  ShareableUserDetail
} from '@/types/health';
import type { TablePaginationConfig } from 'ant-design-vue';
import { useRecordTypes } from '@/hooks/useRecordTypes';

const router = useRouter();
const route = useRoute();

// 激活的标签页
const activeTab = ref<string>('shared-by-me');

// 获取URL参数
const sharedWithFilter = ref<number | null>(null);

// 是否只显示有效记录
const onlyValidRecords = ref<boolean>(true);

// 记录加载状态
const loadingSharedByMe = ref<boolean>(false);
const loadingSharedWithMe = ref<boolean>(false);
const recordLoading = ref<boolean>(false);

// 共享记录数据
const sharedByMeRecords = ref<SharedRecordWithUser[]>([]);
const sharedWithMeRecords = ref<SharedRecordWithOwner[]>([]);

// 分页配置
const sharedByMePagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50']
});

const sharedWithMePagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50']
});

// 表格列配置 - 我共享的记录
const sharedByMeColumns = [
  {
    title: '记录信息',
    key: 'record_info',
    width: 250,
    ellipsis: true
  },
  {
    title: '共享给',
    key: 'shared_with',
    width: 150,
    ellipsis: true
  },
  {
    title: '共享权限',
    key: 'permission',
    width: 100
  },
  {
    title: '有效性',
    key: 'validity',
    width: 120
  },
  {
    title: '访问次数',
    dataIndex: 'access_count',
    key: 'access_count',
    width: 100
  },
  {
    title: '操作',
    key: 'actions',
    width: 160
  }
];

// 表格列配置 - 共享给我的记录
const sharedWithMeColumns = [
  {
    title: '记录信息',
    key: 'record_info',
    width: 250,
    ellipsis: true
  },
  {
    title: '共享者',
    key: 'owner',
    width: 150,
    ellipsis: true
  },
  {
    title: '共享权限',
    key: 'permission',
    width: 100
  },
  {
    title: '有效性',
    key: 'validity',
    width: 120
  },
  {
    title: '访问次数',
    dataIndex: 'access_count',
    key: 'access_count',
    width: 100
  },
  {
    title: '最近访问',
    dataIndex: 'last_accessed',
    key: 'last_accessed',
    width: 160,
    customRender: ({ text }: { text: string | undefined }) => text ? formatDate(text) : '未访问'
  },
  {
    title: '操作',
    key: 'actions',
    width: 100
  }
];

// 生命体征表格列定义
const vitalSignColumns = [
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: '25%'
  },
  {
    title: '数值',
    dataIndex: 'value',
    key: 'value',
    width: '25%'
  },
  {
    title: '单位',
    dataIndex: 'unit',
    key: 'unit',
    width: '15%'
  },
  {
    title: '测量时间',
    dataIndex: 'measured_at',
    key: 'measured_at',
    width: '35%'
  }
];

// 记录详情
const recordDrawerVisible = ref<boolean>(false);
const currentRecord = ref<HealthRecord | null>(null);
const sharedInfo = ref<any>(null);

// 撤销共享
const revokeModalVisible = ref<boolean>(false);
const revokingShared = ref<boolean>(false);
const recordToRevoke = ref<SharedRecordWithUser | null>(null);

// 共享链接相关
const shareLinkModalVisible = ref<boolean>(false);
const currentShareRecord = ref<SharedRecordWithUser | null>(null);
const shareLink = ref<string>('');
const shareLinkInput = ref<HTMLInputElement | null>(null);

// 使用hook获取记录类型相关函数
const { getRecordTypeName, getRecordTypeColor } = useRecordTypes();

// 获取我共享的记录
const fetchSharedByMe = async () => {
  loadingSharedByMe.value = true;
  try {
    // 获取URL参数中的shared_with
    const sharedWithId = sharedWithFilter.value || 
      (route.query.shared_with ? parseInt(route.query.shared_with as string) : undefined);
    
    const response = await getRecordsSharedByMe(
      sharedByMePagination.current,
      sharedByMePagination.pageSize,
      onlyValidRecords.value,
      sharedWithId
    );
    
    if (response.success && response.data) {
      sharedByMeRecords.value = response.data.shared_records as SharedRecordWithUser[];
      
      // 确保每条记录都有必要的字段，防止界面出错
      sharedByMeRecords.value = sharedByMeRecords.value.map(record => {
        // 确保record_info存在
        if (!record.record_info) {
          record.record_info = {
            title: '未知记录',
            record_type: '',
            record_date: ''
          };
        }
        
        // 确保shared_with存在
        if (!record.shared_with) {
          record.shared_with = {
            id: 0,
            username: '未知用户',
            full_name: '未知用户'
          };
        }
        
        return record;
      });
      
      sharedByMePagination.total = response.data.total;
    } else {
      message.error(response.message || '获取共享记录失败');
    }
  } catch (error) {
    console.error('获取共享记录失败:', error);
    message.error('获取共享记录失败');
  } finally {
    loadingSharedByMe.value = false;
  }
};

// 获取共享给我的记录
const fetchSharedWithMe = async () => {
  loadingSharedWithMe.value = true;
  try {
    const response = await getRecordsSharedWithMe(
      sharedWithMePagination.current,
      sharedWithMePagination.pageSize,
      onlyValidRecords.value
    );
    
    if (response.success && response.data) {
      sharedWithMeRecords.value = response.data.shared_records as SharedRecordWithOwner[];
      
      // 确保每条记录都有必要的字段，防止界面出错
      sharedWithMeRecords.value = sharedWithMeRecords.value.map(record => {
        // 确保record_info存在
        if (!record.record_info) {
          record.record_info = {
            title: '未知记录',
            record_type: '',
            record_date: ''
          };
        }
        
        // 确保owner存在
        if (!record.owner) {
          record.owner = {
            id: 0,
            username: '未知用户',
            full_name: '未知用户'
          };
        }
        
        return record;
      });
      
      sharedWithMePagination.total = response.data.total;
    } else {
      message.error(response.message || '获取共享记录失败');
    }
  } catch (error) {
    console.error('获取共享记录失败:', error);
    message.error('获取共享记录失败');
  } finally {
    loadingSharedWithMe.value = false;
  }
};

// 处理表格变化 - 我共享的记录
const handleSharedByMeTableChange = (pagination: TablePaginationConfig) => {
  sharedByMePagination.current = pagination.current || 1;
  sharedByMePagination.pageSize = pagination.pageSize || 10;
  fetchSharedByMe();
};

// 处理表格变化 - 共享给我的记录
const handleSharedWithMeTableChange = (pagination: TablePaginationConfig) => {
  sharedWithMePagination.current = pagination.current || 1;
  sharedWithMePagination.pageSize = pagination.pageSize || 10;
  fetchSharedWithMe();
};

// 获取可见性名称
const getVisibilityName = (visibility: string): string => {
  const visibilityMap: Record<string, string> = {
    private: '仅自己可见',
    public: '所有人可见',
    doctor: '医生可见',
    researcher: '研究人员可见'
  };
  return visibilityMap[visibility] || '未知';
};

// 获取权限名称
const getPermissionName = (permission: string): string => {
  const permissionMap: Record<string, string> = {
    view: '仅查看',
  };
  return permissionMap[permission] || '未知权限';
};

// 获取权限颜色
const getPermissionColor = (permission: string): string => {
  const colorMap: Record<string, string> = {
    view: 'blue',
    edit: 'green',
    full: 'purple'
  };
  return colorMap[permission] || 'default';
};

// 格式化日期
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '未记录';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 格式化日期范围
const formatDateRange = (startDate: string | undefined, endDate: string | undefined): string => {
  if (!startDate && !endDate) return '未记录';
  const start = startDate ? dayjs(startDate).format('YYYY-MM-DD') : '无起始日期';
  const end = endDate ? dayjs(endDate).format('YYYY-MM-DD') : '持续中';
  return `${start} 至 ${end}`;
};

// 格式化有效期
const formatValidity = (expiresAt: string | null): string => {
  if (!expiresAt) return '永久有效';
  
  const now = dayjs();
  const expires = dayjs(expiresAt);
  
  if (expires.isBefore(now)) {
    return `已于 ${expires.format('YYYY-MM-DD')} 过期`;
  }
  
  const days = expires.diff(now, 'day');
  if (days <= 0) {
    return '今日过期';
  } else if (days === 1) {
    return '明日过期';
  } else if (days < 30) {
    return `${days}天后过期`;
  } else {
    return expires.format('YYYY-MM-DD') + ' 过期';
  }
};

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

// 查看记录详情
const viewRecord = async (recordId: string) => {
  recordDrawerVisible.value = true;
  recordLoading.value = true;
  sharedInfo.value = null;
  
  try {
    console.log(`正在获取记录，使用ID: ${recordId}`);
    
    const response = await getHealthRecord(recordId);
    if (response.success && response.data) {
      currentRecord.value = response.data.record;
    } else {
      message.error(response.message || '获取记录详情失败');
    }
  } catch (error: any) {
    console.error('获取记录详情失败:', error);
    
    // 提供更明确的错误消息
    if (error.response) {
      const status = error.response.status;
      const errorMsg = error.response.data?.message || '未知错误';
      
      if (status === 400) {
        message.error(`无效的记录ID: ${errorMsg}`);
      } else if (status === 404) {
        message.error(`记录不存在: ${errorMsg}`);
      } else {
        message.error(`获取记录详情失败 (${status}): ${errorMsg}`);
      }
    } else if (error.message) {
      message.error(`获取记录详情失败: ${error.message}`);
    } else {
      message.error('获取记录详情失败，请稍后再试');
    }
  } finally {
    recordLoading.value = false;
  }
};

// 查看共享给我的记录
const viewSharedRecord = async (sharedId: string) => {
  recordDrawerVisible.value = true;
  recordLoading.value = true;
  
  try {
    const response = await fetchSharedRecord(sharedId);
    if (response.success && response.data) {
      currentRecord.value = response.data.record;
      sharedInfo.value = response.data.shared_info;
    } else {
      message.error('获取共享记录详情失败');
    }
  } catch (error) {
    console.error('获取共享记录详情失败:', error);
    message.error('获取共享记录详情失败');
  } finally {
    recordLoading.value = false;
  }
};

// 下载文件
const downloadFile = (fileName: string) => {
  const url = getRecordFileUrl(fileName);
  window.open(url, '_blank');
};

// 确认撤销共享
const confirmRevoke = (record: SharedRecordWithUser) => {
  recordToRevoke.value = record;
  revokeModalVisible.value = true;
};

// 处理撤销确认
const handleRevokeConfirm = async () => {
  if (!recordToRevoke.value) return;
  
  revokingShared.value = true;
  try {
    const response = await revokeSharedRecord(recordToRevoke.value.shared_id.toString());
    if (response.success) {
      message.success('已成功撤销共享');
      revokeModalVisible.value = false;
      // 刷新列表
      fetchSharedByMe();
    } else {
      message.error(response.message || '撤销共享失败');
    }
  } catch (error) {
    console.error('撤销共享失败:', error);
    message.error('撤销共享失败');
  } finally {
    revokingShared.value = false;
  }
};

// 监听标签页切换
const handleTabChange = (key: string) => {
  if (key === 'shared-by-me' && sharedByMeRecords.value.length === 0) {
    fetchSharedByMe();
  } else if (key === 'shared-with-me' && sharedWithMeRecords.value.length === 0) {
    fetchSharedWithMe();
  }
};

// 新增功能：导航到共享用户页面
const navigateToShareUsers = () => {
  router.push('/patient/share-users');
};

// 新增功能：清除用户筛选
const clearUserFilter = () => {
  sharedWithFilter.value = null;
  filteredUserInfo.value = null;
  fetchSharedByMe();
};

// 新增功能：过滤用户信息
const filteredUserInfo = ref<ShareableUserDetail | null>(null);

// 获取用户详情
const fetchUserDetail = async (userId: number) => {
  try {
    const response = await getShareableUserDetail(userId);
    if (response.success && response.data) {
      filteredUserInfo.value = response.data;
    }
  } catch (error) {
    console.error('获取用户详情失败:', error);
  }
};

// 监听用户筛选变化
watch(sharedWithFilter, (newValue) => {
  if (newValue !== null) {
    fetchUserDetail(newValue);
  } else {
    filteredUserInfo.value = null;
  }
});

// 组件挂载时检查是否需要加载用户详情
onMounted(() => {
  // 检查URL参数，设置当前标签页
  if (route.query.tab) {
    activeTab.value = route.query.tab as string;
  }
  
  // 检查是否有shared_with参数
  if (route.query.shared_with) {
    const userId = parseInt(route.query.shared_with as string);
    sharedWithFilter.value = userId;
    fetchUserDetail(userId);
  }
  
  // 根据当前标签页加载数据
  if (activeTab.value === 'shared-by-me') {
    fetchSharedByMe();
  } else {
    fetchSharedWithMe();
  }
  
  // 监听标签页变化
  watch(activeTab, handleTabChange);
});

// 新增功能：显示共享链接
const showShareLink = (record: SharedRecordWithUser) => {
  currentShareRecord.value = record;
  
  // 检查record中是否有access_key
  if (!record.access_key) {
    message.error('无法获取共享链接，缺少访问密钥');
    return;
  }
  
  // 根据记录的access_key构建共享链接
  shareLink.value = getSharedRecordAccessUrl(record.access_key);
  console.log('生成的共享链接:', shareLink.value);
  shareLinkModalVisible.value = true;
};

// 复制共享链接
const copyShareLink = () => {
  if (shareLinkInput.value) {
    shareLinkInput.value.select();
    document.execCommand('copy');
    message.success('链接已复制到剪贴板');
  }
};

// 获取生命体征类型名称
const getVitalSignTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    'BLOOD_PRESSURE': '血压',
    'HEART_RATE': '心率',
    'TEMPERATURE': '体温',
    'BLOOD_OXYGEN': '血氧',
    'BLOOD_GLUCOSE': '血糖',
    'WEIGHT': '体重',
    'HEIGHT': '身高',
    'BMI': '体重指数',
    'RESPIRATORY_RATE': '呼吸率',
    'OTHER': '其他'
  };
  return typeMap[type] || type;
};

// 获取生命体征颜色
const getVitalSignColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'BLOOD_PRESSURE': 'red',
    'HEART_RATE': 'orange',
    'TEMPERATURE': 'gold',
    'BLOOD_OXYGEN': 'blue',
    'BLOOD_GLUCOSE': 'purple',
    'WEIGHT': 'cyan',
    'HEIGHT': 'green',
    'BMI': 'lime',
    'RESPIRATORY_RATE': 'magenta',
    'OTHER': 'default'
  };
  return colorMap[type] || 'default';
};
</script>

<style scoped>
.shared-records-container {
  width: 100%;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.action-buttons .ant-btn {
  margin-bottom: 4px;
}
</style> 