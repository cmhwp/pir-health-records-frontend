<template>
  <div class="record-detail-container">
    <a-page-header
      :title="loading ? '加载中...' : record?.title || '健康记录详情'"
      @back="goBack"
    >
      <template #tags>
        <a-tag v-if="record" :color="getRecordTypeColor(record.record_type)">
          {{ getRecordTypeName(record.record_type) }}
        </a-tag>
      </template>
      <template #extra>
        <a-space>
          <a-button v-if="record" @click="handleShare">
            <template #icon><share-alt-outlined /></template>
            共享
          </a-button>
          <a-button v-if="record" type="primary" @click="handleEdit">
            <template #icon><edit-outlined /></template>
            编辑
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="basic" tab="基本信息">
          <a-card v-if="record">
            <a-descriptions bordered>
              <a-descriptions-item label="记录标题" :span="3">
                {{ record.title }}
              </a-descriptions-item>
              <a-descriptions-item label="记录类型">
                <a-tag :color="getRecordTypeColor(record.record_type)">
                  {{ getRecordTypeName(record.record_type) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="记录日期">
                {{ formatDate(record.record_date) }}
              </a-descriptions-item>
              <a-descriptions-item label="创建时间">
                {{ formatDate(record.created_at) }}
              </a-descriptions-item>
              <a-descriptions-item label="医疗机构" :span="2">
                {{ record.institution || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="医生姓名">
                {{ record.doctor_name || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="可见性">
                {{ getVisibilityName(record.visibility) }}
              </a-descriptions-item>
              <a-descriptions-item label="版本">
                {{ record.version }}
              </a-descriptions-item>
              <a-descriptions-item label="加密状态" :span="2">
                <a-tag :color="record.is_encrypted ? 'purple' : 'green'">
                  {{ record.is_encrypted ? '已加密' : '未加密' }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="标签" :span="1">
                <a-tag v-for="tag in recordTags" :key="tag" color="blue">{{ tag }}</a-tag>
                <span v-if="!recordTags.length">无标签</span>
              </a-descriptions-item>
            </a-descriptions>

            <a-divider />

            <div v-if="record.description">
              <h3>记录描述</h3>
              <p>{{ record.description }}</p>
            </div>

            <!-- 用药记录特定字段 -->
            <div v-if="record.medication && record.medication.medication_name" style="margin-top: 20px">
              <h3>用药信息</h3>
              <a-descriptions bordered>
                <a-descriptions-item label="药物名称" :span="3">
                  {{ record.medication.medication_name }}
                </a-descriptions-item>
                <a-descriptions-item label="剂量">
                  {{ record.medication.dosage || '未记录' }}
                </a-descriptions-item>
                <a-descriptions-item label="频率">
                  {{ record.medication.frequency || '未记录' }}
                </a-descriptions-item>
                <a-descriptions-item label="用药期间">
                  {{ formatDateRange(record.medication.start_date, record.medication.end_date) }}
                </a-descriptions-item>
                <a-descriptions-item label="用药说明" :span="3" v-if="record.medication.instructions">
                  {{ record.medication.instructions }}
                </a-descriptions-item>
                <a-descriptions-item label="副作用" :span="3" v-if="record.medication.side_effects">
                  {{ record.medication.side_effects }}
                </a-descriptions-item>
              </a-descriptions>
            </div>

            <!-- 生命体征特定字段 -->
            <div v-if="record.vital_signs && record.vital_signs.length > 0" style="margin-top: 20px">
              <h3>生命体征数据</h3>
              <a-table
                :dataSource="record.vital_signs"
                :columns="vitalSignColumns"
                :pagination="{ pageSize: 5 }"
                size="middle"
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

            <!-- 相关文件列表 -->
            <div v-if="record.files && record.files.length > 0" style="margin-top: 20px">
              <h3>相关文件</h3>
              <a-list size="small" bordered>
                <a-list-item v-for="file in record.files" :key="file.file_path">
                  <a-list-item-meta>
                    <template #title>{{ file.file_name }}</template>
                    <template #description>{{ formatFileSize(file.file_size) }} · {{ formatDate(file.uploaded_at) }}</template>
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
          </a-card>
          <a-empty v-else description="未找到记录数据" />
        </a-tab-pane>

        <a-tab-pane key="versions" tab="版本历史">
          <a-card>
            <div class="version-header" style="margin-bottom: 16px">
              <h3>版本历史记录</h3>
              <div>
                <a-tag color="green">当前版本: {{ record?.version || '-' }}</a-tag>
                <a-tag color="blue">共 {{ versions.length }} 个版本</a-tag>
              </div>
            </div>
            
            <a-timeline v-if="versions && versions.length > 0">
              <a-timeline-item v-for="version in versions" :key="version.version" :color="version.version === record?.version ? 'green' : 'blue'">
                <template #dot v-if="version.version === record?.version">
                  <check-circle-outlined />
                </template>
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <span style="font-weight: bold">版本 {{ version.version }}</span>
                    <a-space>
                      <a-tag v-if="version.version === record?.version" color="green">当前版本</a-tag>
                      <a-button v-else size="small" @click="viewVersion(version.version)">查看</a-button>
                      <a-button v-if="version.version !== versions[0].version && version.version !== record?.version" 
                               size="small" type="dashed" @click="compareVersions(versions[0].version, version.version)">
                        与最新版本比较
                      </a-button>
                      <a-button v-if="version.version !== record?.version" size="small" type="primary" @click="restoreVersion(version.version)">恢复此版本</a-button>
                    </a-space>
                  </div>
                  <div>修改时间: {{ formatDate(version.created_at) }}</div>
                  <div>修改人: {{ version.created_by || '未知用户' }}</div>
                  <div>修改说明: {{ version.description || '无说明' }}</div>
                  <div v-if="version.changes && version.changes.length > 0">
                    <div style="margin-top: 8px; font-weight: bold">变更内容:</div>
                    <a-list size="small">
                      <a-list-item v-for="(change, index) in version.changes" :key="index">
                        {{ change }}
                      </a-list-item>
                    </a-list>
                  </div>
                </div>
              </a-timeline-item>
            </a-timeline>
            <a-empty v-else description="暂无版本历史" />
          </a-card>
        </a-tab-pane>

        <a-tab-pane key="share" tab="共享信息">
          <a-card>
            <a-form layout="vertical" :model="shareForm">
              <a-form-item label="选择用户" required>
                <a-select
                  v-model:value="shareForm.share_with_id"
                  placeholder="请选择要共享的用户"
                  :loading="loadingUsers"
                >
                  <a-select-option v-for="user in userOptions" :key="user.id" :value="user.id">
                    {{ user.full_name || user.username }}
                  </a-select-option>
                </a-select>
              </a-form-item>
              
              <a-form-item label="共享权限">
                <a-radio-group v-model:value="shareForm.permission">
                  <a-radio :value="SharePermission.VIEW">仅查看</a-radio>
                  <a-radio :value="SharePermission.EDIT">可编辑</a-radio>
                  <a-radio :value="SharePermission.FULL">完全权限</a-radio>
                </a-radio-group>
              </a-form-item>
              
              <a-form-item label="有效期">
                <a-radio-group v-model:value="shareForm.validity_type" @change="handleValidityChange">
                  <a-radio value="forever">永久有效</a-radio>
                  <a-radio value="days">指定天数</a-radio>
                </a-radio-group>
              </a-form-item>
              
              <a-form-item v-if="shareForm.validity_type === 'days'" label="有效天数">
                <a-input-number v-model:value="shareForm.expires_days" :min="1" :max="365" />
              </a-form-item>
              
              <a-form-item>
                <a-button type="primary" :loading="sharing" @click="submitShare">
                  共享记录
                </a-button>
              </a-form-item>
            </a-form>

            <a-divider />

            <h3>已共享记录</h3>
            <a-list v-if="sharedRecords.length > 0" :loading="loadingShared">
              <a-list-item v-for="shared in sharedRecords" :key="shared.shared_id">
                <a-list-item-meta>
                  <template #title>
                    <div style="display: flex; align-items: center">
                      <a-avatar style="margin-right: 8px" :style="{ backgroundColor: '#1890ff' }">
                        {{ shared.shared_with?.username?.charAt(0) || '?' }}
                      </a-avatar>
                      {{ shared.shared_with?.full_name || shared.shared_with?.username || '未知用户' }}
                    </div>
                  </template>
                  <template #description>
                    <div>
                      权限: <a-tag :color="getPermissionColor(shared.permission)">{{ getPermissionName(shared.permission) }}</a-tag>
                      <br />
                      状态: <a-tag :color="shared.is_valid ? 'success' : 'error'">{{ shared.is_valid ? '有效' : '已过期' }}</a-tag>
                      <br />
                      有效期: {{ formatValidity(shared.expires_at) }}
                      <br />
                      访问次数: {{ shared.access_count }} 次
                      <br />
                      最近访问: {{ shared.last_accessed ? formatDate(shared.last_accessed) : '未访问' }}
                    </div>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button danger size="small" @click="revokeShare(shared.shared_id)">
                    <template #icon><stop-outlined /></template>
                    撤销共享
                  </a-button>
                </template>
              </a-list-item>
            </a-list>
            <a-empty v-else description="尚未共享此记录" />
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </a-spin>

    <!-- 恢复版本确认模态框 -->
    <a-modal
      v-model:visible="restoreModalVisible"
      title="恢复到历史版本"
      @ok="confirmRestore"
      :confirm-loading="restoring"
    >
      <p>确定要将记录恢复至版本 {{ versionToRestore }} 吗？</p>
      <a-form-item label="恢复说明">
        <a-textarea v-model:value="restoreDescription" placeholder="请输入恢复原因（可选）" :rows="3" />
      </a-form-item>
    </a-modal>

    <!-- 撤销共享确认模态框 -->
    <a-modal
      v-model:visible="revokeModalVisible"
      title="撤销共享"
      @ok="confirmRevoke"
      :confirm-loading="revoking"
      okText="确认撤销"
      cancelText="取消"
      okType="danger"
    >
      <p>确定要撤销此共享记录吗？</p>
      <p>撤销后，对方将无法再访问该记录。</p>
    </a-modal>

    <!-- 版本查看模态框 -->
    <a-modal
      v-model:visible="versionModalVisible"
      :title="`版本 ${versionToView} 记录详情`"
      width="800px"
      :footer="null"
    >
      <a-spin :spinning="viewingVersion">
        <div v-if="versionRecord" class="version-view-container">
          <div class="version-info-header" style="margin-bottom: 16px; background-color: #f0f5ff; padding: 12px; border-radius: 4px;">
            <div><strong>版本:</strong> {{ versionRecord.version }}</div>
            <div><strong>修改时间:</strong> {{ formatDate(versionRecord.updated_at || versionRecord.created_at) }}</div>
            <div><strong>修改人:</strong> {{ '用户' }}</div>
          </div>
          
          <a-descriptions bordered>
            <a-descriptions-item label="记录标题" :span="3">
              {{ versionRecord.title }}
            </a-descriptions-item>
            <a-descriptions-item label="记录类型">
              <a-tag :color="getRecordTypeColor(versionRecord.record_type)">
                {{ getRecordTypeName(versionRecord.record_type) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="记录日期">
              {{ formatDate(versionRecord.record_date) }}
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatDate(versionRecord.created_at) }}
            </a-descriptions-item>
            <a-descriptions-item label="医疗机构" :span="2">
              {{ versionRecord.institution || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="医生姓名">
              {{ versionRecord.doctor_name || '未记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="可见性">
              {{ getVisibilityName(versionRecord.visibility) }}
            </a-descriptions-item>
            <a-descriptions-item label="版本">
              {{ versionRecord.version }}
            </a-descriptions-item>
            <a-descriptions-item label="加密状态" :span="2">
              <a-tag :color="versionRecord.is_encrypted ? 'purple' : 'green'">
                {{ versionRecord.is_encrypted ? '已加密' : '未加密' }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>

          <a-divider />

          <div v-if="versionRecord.description">
            <h3>记录描述</h3>
            <p>{{ versionRecord.description }}</p>
          </div>

          <!-- 用药记录特定字段 -->
          <div v-if="versionRecord.medication && versionRecord.medication.medication_name" style="margin-top: 20px">
            <h3>用药信息</h3>
            <a-descriptions bordered>
              <a-descriptions-item label="药物名称" :span="3">
                {{ versionRecord.medication.medication_name }}
              </a-descriptions-item>
              <a-descriptions-item label="剂量">
                {{ versionRecord.medication.dosage || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="频率">
                {{ versionRecord.medication.frequency || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="用药期间">
                {{ formatDateRange(versionRecord.medication.start_date, versionRecord.medication.end_date) }}
              </a-descriptions-item>
              <a-descriptions-item label="用药说明" :span="3" v-if="versionRecord.medication.instructions">
                {{ versionRecord.medication.instructions }}
              </a-descriptions-item>
              <a-descriptions-item label="副作用" :span="3" v-if="versionRecord.medication.side_effects">
                {{ versionRecord.medication.side_effects }}
              </a-descriptions-item>
            </a-descriptions>
          </div>

          <!-- 生命体征特定字段 -->
          <div v-if="versionRecord.vital_signs && versionRecord.vital_signs.length > 0" style="margin-top: 20px">
            <h3>生命体征数据</h3>
            <a-table
              :dataSource="versionRecord.vital_signs"
              :columns="vitalSignColumns"
              :pagination="{ pageSize: 5 }"
              size="middle"
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

          <!-- 相关文件列表 -->
          <div v-if="versionRecord.files && versionRecord.files.length > 0" style="margin-top: 20px">
            <h3>相关文件</h3>
            <a-list size="small" bordered>
              <a-list-item v-for="file in versionRecord.files" :key="file.file_path">
                <a-list-item-meta>
                  <template #title>{{ file.file_name }}</template>
                  <template #description>{{ formatFileSize(file.file_size) }} · {{ formatDate(file.uploaded_at) }}</template>
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
        </div>
        <a-empty v-else description="未找到版本记录数据" />
      </a-spin>
      
      <template #footer>
        <a-space>
          <a-button @click="versionModalVisible = false">关闭</a-button>
          <a-button v-if="versionRecord && versionRecord.version !== record?.version" 
                   type="primary" 
                   @click="restoreVersion(versionToView)">
            恢复到此版本
          </a-button>
        </a-space>
      </template>
    </a-modal>

    <!-- 版本比较模态框 -->
    <a-modal
      v-model:visible="compareModalVisible"
      title="版本比较"
      width="900px"
      :footer="null"
    >
      <a-spin :spinning="comparing">
        <div v-if="compareRecords.v1 && compareRecords.v2" class="compare-container">
          <div class="compare-header" style="margin-bottom: 16px; display: flex; justify-content: space-between">
            <div class="compare-version" style="width: 48%; background-color: #f6ffed; padding: 12px; border-radius: 4px;">
              <h3>版本 {{ compareRecords.v1.version }}</h3>
              <div><strong>修改时间:</strong> {{ formatDate(compareRecords.v1.created_at) }}</div>
            </div>
            
            <div style="width: 3%; display: flex; align-items: center; justify-content: center">
              <swap-outlined />
            </div>
            
            <div class="compare-version" style="width: 48%; background-color: #f0f5ff; padding: 12px; border-radius: 4px;">
              <h3>版本 {{ compareRecords.v2.version }}</h3>
              <div><strong>修改时间:</strong> {{ formatDate(compareRecords.v2.created_at) }}</div>
            </div>
          </div>
          
          <div class="compare-content">
            <a-collapse>
              <a-collapse-panel key="title" header="标题">
                <div class="compare-field" style="display: flex; justify-content: space-between">
                  <div class="compare-value" style="width: 48%">{{ compareRecords.v1.title }}</div>
                  <div style="width: 3%; display: flex; align-items: center; justify-content: center">
                    <div v-if="compareRecords.v1.title !== compareRecords.v2.title">
                      <arrow-right-outlined style="color: #ff4d4f" />
                    </div>
                    <div v-else>
                      <minus-outlined />
                    </div>
                  </div>
                  <div class="compare-value" style="width: 48%">{{ compareRecords.v2.title }}</div>
                </div>
              </a-collapse-panel>
              
              <a-collapse-panel key="description" header="描述">
                <div class="compare-field" style="display: flex; justify-content: space-between">
                  <div class="compare-value" style="width: 48%">{{ compareRecords.v1.description || '无描述' }}</div>
                  <div style="width: 3%; display: flex; align-items: center; justify-content: center">
                    <div v-if="compareRecords.v1.description !== compareRecords.v2.description">
                      <arrow-right-outlined style="color: #ff4d4f" />
                    </div>
                    <div v-else>
                      <minus-outlined />
                    </div>
                  </div>
                  <div class="compare-value" style="width: 48%">{{ compareRecords.v2.description || '无描述' }}</div>
                </div>
              </a-collapse-panel>
            </a-collapse>
          </div>
        </div>
        <a-empty v-else description="无法比较版本" />
      </a-spin>
      
      <template #footer>
        <a-space>
          <a-button @click="compareModalVisible = false">关闭</a-button>
          <a-button v-if="compareRecords.v2 && compareRecords.v2.version !== record?.version" 
                   type="primary" 
                   @click="restoreVersion(compareRecords.v2.version)">
            恢复到此版本
          </a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  EditOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  FileOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UnlockOutlined,
  SwapOutlined,
  ArrowRightOutlined,
  MinusOutlined
} from '@ant-design/icons-vue';
import {
  getHealthRecord,
  getRecordVersions,
  getRecordVersion,
  restoreRecordVersion,
  getRecordFileUrl,
  getRecordsSharedByMe,
  shareHealthRecord,
  revokeSharedRecord,
  getShareableUsers
} from '@/api/health';

import {
  RecordVisibility,
  SharePermission,
  type HealthRecord,
  type VersionInfo,
  type SharedRecordWithUser
} from '@/types/health';
import type { ShareableUser } from '@/types/health';
import { useRecordTypes } from '@/hooks/useRecordTypes';

const route = useRoute();
const router = useRouter();
const recordId = computed(() => route.params.id as string);
const activeTab = ref('basic');

// 根据URL查询参数设置初始标签页
onMounted(() => {
  if (route.query.tab === 'versions') {
    activeTab.value = 'versions';
  } else if (route.query.action === 'share') {
    activeTab.value = 'share';
  }
});

// 记录数据
const loading = ref(true);
const record = ref<HealthRecord | null>(null);
const sqlId = ref<number | null>(null);

// 记录标签
const recordTags = computed(() => {
  if (!record.value?.tags) return [];
  
  // 确保tags是字符串类型
  const tagsValue = record.value.tags;
  if (typeof tagsValue !== 'string') {
    console.warn('Record tags is not a string:', tagsValue);
    return [];
  }
  
  return tagsValue.split(',').filter(tag => tag && tag.trim().length > 0);
});

// 版本历史
const versions = ref<VersionInfo[]>([]);
const loadingVersions = ref(false);
const restoreModalVisible = ref(false);
const restoring = ref(false);
const versionToRestore = ref<number>(0);
const restoreDescription = ref('');

// 共享相关
const loadingUsers = ref(false);
const loadingShared = ref(false);
const userOptions = ref<ShareableUser[]>([]);
const sharedRecords = ref<SharedRecordWithUser[]>([]);
const sharing = ref(false);
const shareForm = reactive({
  share_with_id: undefined as number | undefined,
  permission: SharePermission.VIEW,
  validity_type: 'forever',
  expires_days: 30
});

// 撤销共享
const revokeModalVisible = ref(false);
const revoking = ref(false);
const shareIdToRevoke = ref<string>('');

// 版本查看相关变量
const versionModalVisible = ref(false);
const versionToView = ref(0);
const versionRecord = ref<HealthRecord | null>(null);
const viewingVersion = ref(false);

// 版本比较相关变量
const compareModalVisible = ref(false);
const compareRecords = ref<{ 
  v1: any; 
  v2: any 
}>({
  v1: null,
  v2: null
});
const comparing = ref(false);

// 使用hook获取记录类型相关函数
const { getRecordTypeName, getRecordTypeColor } = useRecordTypes();

// 获取记录详情
const fetchRecordDetail = async () => {
  loading.value = true;
  try {
    const response = await getHealthRecord(recordId.value);
    if (response.success && response.data) {
      record.value = response.data.record;
      sqlId.value = response.data.sql_id;
    } else {
      message.error(response.message || '获取健康记录失败');
    }
  } catch (error) {
    console.error('获取健康记录失败:', error);
    message.error('获取健康记录失败');
  } finally {
    loading.value = false;
  }
};

// 获取版本历史
const fetchVersions = async () => {
  if (!recordId.value) return;
  
  loadingVersions.value = true;
  try {
    const response = await getRecordVersions(recordId.value);
    console.log('获取版本历史API响应:', response);
    if (response.success && response.data) {
      // 将 API 返回的数据格式化为符合 VersionInfo 类型的格式
      versions.value = response.data.versions.map((v: any) => ({
        version: v.version,
        created_at: v.created_at,
        description: v.description,
        created_by: v.creator?.username || '',
        changes: v.changes
      }));
    } else {
      message.error(response.message || '获取版本历史失败');
    }
  } catch (error) {
    console.error('获取版本历史失败:', error);
    message.error('获取版本历史失败');
  } finally {
    loadingVersions.value = false;
  }
};

// 查看特定版本
const viewVersion = async (versionNumber: number) => {
  // 加载特定版本的记录
  versionToView.value = versionNumber;
  viewingVersion.value = true;
  
  try {
    const response = await getRecordVersion(recordId.value, versionNumber);
    if (response.success && response.data) {
      versionRecord.value = response.data.record;
      versionModalVisible.value = true;
    } else {
      message.error(response.message || '获取版本记录失败');
    }
  } catch (error) {
    console.error('获取版本记录失败:', error);
    message.error('获取版本记录失败');
  } finally {
    viewingVersion.value = false;
  }
};

// 准备恢复版本
const restoreVersion = (versionNumber: number) => {
  versionToRestore.value = versionNumber;
  restoreDescription.value = '';
  restoreModalVisible.value = true;
};

// 确认恢复版本
const confirmRestore = async () => {
  if (!recordId.value || versionToRestore.value === 0) return;
  
  restoring.value = true;
  try {
    const response = await restoreRecordVersion(
      recordId.value,
      versionToRestore.value,
      { description: restoreDescription.value }
    );
    
    if (response.success) {
      message.success('已成功恢复到版本 ' + versionToRestore.value);
      restoreModalVisible.value = false;
      
      // 重新获取记录和版本历史
      await fetchRecordDetail();
      await fetchVersions();
    } else {
      message.error(response.message || '恢复版本失败');
    }
  } catch (error) {
    console.error('恢复版本失败:', error);
    message.error('恢复版本失败');
  } finally {
    restoring.value = false;
  }
};

// 获取可共享的用户列表
const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const response = await getShareableUsers();
    if (response.success && response.data) {
      userOptions.value = response.data.users;
    } else {
      message.error(response.message || '获取用户列表失败');
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    message.error('获取用户列表失败');
  } finally {
    loadingUsers.value = false;
  }
};

// 获取已共享记录列表
const fetchSharedRecords = async () => {
  if (!recordId.value) return;
  
  loadingShared.value = true;
  try {
    const response = await getRecordsSharedByMe(1, 100, false);
    if (response.success && response.data) {
      // 过滤出当前记录的共享记录
      const allShared = response.data.shared_records as SharedRecordWithUser[];
      sharedRecords.value = allShared.filter(s => 
        s.record_id.toString() === recordId.value || 
        s.mongo_id === recordId.value
      );
    } else {
      message.error(response.message || '获取共享记录失败');
    }
  } catch (error) {
    console.error('获取共享记录失败:', error);
    message.error('获取共享记录失败');
  } finally {
    loadingShared.value = false;
  }
};

// 处理有效期类型变更
const handleValidityChange = (e: { target: { value: string } }) => {
  shareForm.validity_type = e.target.value;
};

// 提交共享
const submitShare = async () => {
  if (!recordId.value || !shareForm.share_with_id) {
    message.warning('请选择要共享的用户');
    return;
  }
  
  sharing.value = true;
  try {
    const shareData = {
      share_with_id: shareForm.share_with_id,
      permission: shareForm.permission,
      expiry_days: shareForm.validity_type === 'days' ? shareForm.expires_days : undefined
    };
    
    const response = await shareHealthRecord(recordId.value, shareData);
    
    if (response.success) {
      message.success('记录已成功共享');
      // 重置表单
      shareForm.share_with_id = undefined;
      shareForm.permission = SharePermission.VIEW;
      shareForm.validity_type = 'forever';
      shareForm.expires_days = 30;
      
      // 刷新共享记录列表
      await fetchSharedRecords();
    } else {
      message.error(response.message || '共享记录失败');
    }
  } catch (error) {
    console.error('共享记录失败:', error);
    message.error('共享记录失败');
  } finally {
    sharing.value = false;
  }
};

// 撤销共享
const revokeShare = (sharedId: number) => {
  shareIdToRevoke.value = sharedId.toString();
  revokeModalVisible.value = true;
};

// 确认撤销共享
const confirmRevoke = async () => {
  if (!shareIdToRevoke.value) return;
  
  revoking.value = true;
  try {
    const response = await revokeSharedRecord(shareIdToRevoke.value);
    
    if (response.success) {
      message.success('已成功撤销共享');
      revokeModalVisible.value = false;
      
      // 刷新共享记录列表
      await fetchSharedRecords();
    } else {
      message.error(response.message || '撤销共享失败');
    }
  } catch (error) {
    console.error('撤销共享失败:', error);
    message.error('撤销共享失败');
  } finally {
    revoking.value = false;
  }
};

// 下载文件
const downloadFile = (fileName: string) => {
  const url = getRecordFileUrl(fileName);
  window.open(url, '_blank');
};

// 返回上一页
const goBack = () => {
  router.push('/patient/records');
};

// 编辑记录
const handleEdit = () => {
  router.push(`/patient/edit-record/${recordId.value}`);
};

// 共享记录
const handleShare = () => {
  activeTab.value = 'share';
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
    edit: '可编辑',
    full: '完全权限'
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
const formatDateRange = (startDate?: string, endDate?: string): string => {
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

// 监听标签页变化
watch(activeTab, (newTab) => {
  if (newTab === 'versions' && versions.value.length === 0) {
    fetchVersions();
  } else if (newTab === 'share') {
    if (userOptions.value.length === 0) {
      fetchUsers();
    }
    fetchSharedRecords();
  }
});

// 初始化
onMounted(() => {
  fetchRecordDetail();
});

// 版本比较
const compareVersions = async (baseVersion: number, compareVersion: number) => {
  compareModalVisible.value = true;
  comparing.value = true;
  
  try {
    const response1 = await getRecordVersion(recordId.value, baseVersion);
    const response2 = await getRecordVersion(recordId.value, compareVersion);
    
    if (response1.success && response2.success && response1.data && response2.data) {
      compareRecords.value = {
        v1: response1.data.record,
        v2: response2.data.record
      };
    } else {
      message.error('获取版本记录失败');
    }
  } catch (error) {
    console.error('获取版本记录失败:', error);
    message.error('获取版本记录失败');
  } finally {
    comparing.value = false;
  }
};

// 生命体征相关
// 表格列定义
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
    title: '测量时间',
    dataIndex: 'measured_at',
    key: 'measured_at',
    width: '30%'
  },
  {
    title: '备注',
    dataIndex: 'notes',
    key: 'notes',
    width: '20%'
  }
];

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
  return typeMap[type] || '未知类型';
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
.record-detail-container {
  width: 100%;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-header h3 {
  margin: 0;
}

.version-header div {
  display: flex;
  align-items: center;
}

.version-header div a-tag {
  margin-left: 8px;
}

.version-view-container {
  padding: 16px;
}

.version-info-header {
  background-color: #f0f5ff;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.compare-container {
  padding: 16px;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.compare-version {
  width: 48%;
  background-color: #f6ffed;
  padding: 12px;
  border-radius: 4px;
}

.compare-version h3 {
  margin: 0 0 8px 0;
}

.compare-version a-tag {
  margin-left: 8px;
}

.compare-content {
  padding: 16px;
}

.compare-field {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.compare-value {
  width: 48%;
}
</style> 