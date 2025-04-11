<template>
  <div>
    <div class="header-actions" style="display: flex; justify-content: space-between; margin-bottom: 16px;">
      <h1>研究报告</h1>
      <div>
        <a-button type="primary" style="margin-right: 8px;">
          <template #icon><file-add-outlined /></template>
          新建报告
        </a-button>
        <a-button>
          <template #icon><upload-outlined /></template>
          导入报告
        </a-button>
      </div>
    </div>

    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="24">
        <a-card>
          <a-input-search
            placeholder="搜索报告"
            style="width: 300px; margin-right: 16px"
            @search="onSearch"
          />
          <a-select 
            v-model:value="filterType" 
            style="width: 150px; margin-right: 16px" 
            placeholder="报告类型"
          >
            <a-select-option value="all">所有类型</a-select-option>
            <a-select-option value="research">研究报告</a-select-option>
            <a-select-option value="analysis">分析报告</a-select-option>
            <a-select-option value="progress">进度报告</a-select-option>
          </a-select>
          <a-select 
            v-model:value="filterStatus" 
            style="width: 150px; margin-right: 16px" 
            placeholder="状态"
          >
            <a-select-option value="all">所有状态</a-select-option>
            <a-select-option value="draft">草稿</a-select-option>
            <a-select-option value="reviewing">审核中</a-select-option>
            <a-select-option value="published">已发布</a-select-option>
          </a-select>
          <a-range-picker v-model:value="dateRange" style="margin-right: 16px" />
          <a-button type="primary">
            <template #icon><search-outlined /></template>
            筛选
          </a-button>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16">
      <a-col :span="24">
        <a-card :bordered="false">
          <a-table :columns="columns" :data-source="reports" :pagination="{ pageSize: 10 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'title'">
                <a @click="() => showReportDetail(record.id)">{{ record.title }}</a>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ record.status }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-space>
                  <a @click="() => showReportDetail(record.id)">查看</a>
                  <a-divider type="vertical" />
                  <a @click="() => editReport(record.id)">编辑</a>
                  <a-divider type="vertical" />
                  <a-dropdown>
                    <a class="ant-dropdown-link" @click.prevent>
                      更多 <down-outlined />
                    </a>
                    <template #overlay>
                      <a-menu>
                        <a-menu-item @click="() => downloadReport(record.id)">
                          <download-outlined /> 下载
                        </a-menu-item>
                        <a-menu-item @click="() => shareReport(record.id)">
                          <share-alt-outlined /> 分享
                        </a-menu-item>
                        <a-menu-item danger @click="() => deleteReport(record.id)">
                          <delete-outlined /> 删除
                        </a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <a-modal v-model:open="reportDetailVisible" :title="currentReport.title" width="800px" :footer="null">
      <a-descriptions bordered>
        <a-descriptions-item label="报告类型" span="3">{{ currentReport.type }}</a-descriptions-item>
        <a-descriptions-item label="作者" span="1">{{ currentReport.author }}</a-descriptions-item>
        <a-descriptions-item label="创建日期" span="1">{{ currentReport.created }}</a-descriptions-item>
        <a-descriptions-item label="最后更新" span="1">{{ currentReport.updated }}</a-descriptions-item>
        <a-descriptions-item label="状态" span="3">
          <a-tag :color="getStatusColor(currentReport.status)">{{ currentReport.status }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="关联项目" span="3">{{ currentReport.project }}</a-descriptions-item>
        <a-descriptions-item label="摘要" span="3">{{ currentReport.abstract }}</a-descriptions-item>
      </a-descriptions>
      
      <a-divider />
      
      <a-typography>
        <a-typography-title level={4}>研究报告内容</a-typography-title>
        <a-typography-paragraph>
          这里是报告正文内容，实际项目中应该显示完整的报告内容，可以使用富文本编辑器或Markdown渲染。
        </a-typography-paragraph>
        <a-typography-paragraph>
          可以包含各种格式化文本、图表、表格等内容。
        </a-typography-paragraph>
      </a-typography>
      
      <div style="margin-top: 24px; text-align: right;">
        <a-button style="margin-right: 8px;" @click="reportDetailVisible = false">关闭</a-button>
        <a-button type="primary" @click="editReport(currentReport.id)">编辑报告</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { 
  FileAddOutlined, 
  UploadOutlined,
  SearchOutlined,
  DownOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';

// 筛选条件
const filterType = ref('all');
const filterStatus = ref('all');
const dateRange = ref<[Date, Date] | null>(null);

// 报告详情模态框
const reportDetailVisible = ref(false);
const currentReport = ref({
  id: 0,
  title: '',
  type: '',
  author: '',
  created: '',
  updated: '',
  status: '',
  project: '',
  abstract: ''
});

// 表格列定义
const columns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    sorter: (a: Record<string, any>, b: Record<string, any>) => a.title.localeCompare(b.title),
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    filters: [
      { text: '研究报告', value: '研究报告' },
      { text: '分析报告', value: '分析报告' },
      { text: '进度报告', value: '进度报告' },
    ],
    onFilter: (value: string, record: Record<string, any>) => record.type === value,
  },
  {
    title: '作者',
    dataIndex: 'author',
    key: 'author',
  },
  {
    title: '创建日期',
    dataIndex: 'created',
    key: 'created',
    sorter: (a: Record<string, any>, b: Record<string, any>) => new Date(a.created).getTime() - new Date(b.created).getTime(),
  },
  {
    title: '最后更新',
    dataIndex: 'updated',
    key: 'updated',
    sorter: (a: Record<string, any>, b: Record<string, any>) => new Date(a.updated).getTime() - new Date(b.updated).getTime(),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: '草稿', value: '草稿' },
      { text: '审核中', value: '审核中' },
      { text: '已发布', value: '已发布' },
    ],
    onFilter: (value: string, record: Record<string, any>) => record.status === value,
  },
  {
    title: '操作',
    key: 'action',
  },
];

// 模拟数据
const reports = [
  {
    id: 1,
    title: '隐私保护健康数据研究中期报告',
    type: '研究报告',
    author: '张研究',
    created: '2023-03-15',
    updated: '2023-05-10',
    status: '已发布',
    project: '隐私保护健康数据研究',
    abstract: '本报告总结了隐私保护健康数据研究项目的中期进展，包括已完成的工作、当前进展和未来计划。'
  },
  {
    id: 2,
    title: '医疗数据加密传输方案分析',
    type: '分析报告',
    author: '李数据',
    created: '2023-04-05',
    updated: '2023-04-20',
    status: '审核中',
    project: '医疗数据加密传输方案',
    abstract: '本报告分析了几种不同的医疗数据加密传输方案，并对其安全性、效率和实用性进行了对比评估。'
  },
  {
    id: 3,
    title: '跨机构健康数据共享研究进度',
    type: '进度报告',
    author: '王安全',
    created: '2023-05-01',
    updated: '2023-05-15',
    status: '草稿',
    project: '跨机构健康数据共享研究',
    abstract: '本报告概述了跨机构健康数据共享研究的当前进度、遇到的挑战以及解决方案。'
  },
  {
    id: 4,
    title: '健康数据可视化展示方案评估',
    type: '分析报告',
    author: '赵可视',
    created: '2023-02-10',
    updated: '2023-03-25',
    status: '已发布',
    project: '健康数据可视化展示',
    abstract: '本报告评估了不同的健康数据可视化方案，探讨了如何提高数据可读性和交互性。'
  },
  {
    id: 5,
    title: '医疗数据标准化研究结题报告',
    type: '研究报告',
    author: '钱标准',
    created: '2022-12-01',
    updated: '2023-05-31',
    status: '已发布',
    project: '医疗数据标准化研究',
    abstract: '本报告总结了医疗数据标准化研究的全部成果，包括标准化方法、实施建议和未来发展方向。'
  },
];

// 根据状态获取标签颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case '草稿':
      return 'orange';
    case '审核中':
      return 'blue';
    case '已发布':
      return 'green';
    default:
      return 'default';
  }
};

// 搜索报告
const onSearch = (value: string) => {
  console.log('搜索报告:', value);
};

// 查看报告详情
const showReportDetail = (id: number) => {
  const report = reports.find(r => r.id === id);
  if (report) {
    currentReport.value = { ...report };
    reportDetailVisible.value = true;
  }
};

// 编辑报告
const editReport = (id: number) => {
  console.log('编辑报告ID:', id);
};

// 下载报告
const downloadReport = (id: number) => {
  console.log('下载报告ID:', id);
};

// 分享报告
const shareReport = (id: number) => {
  console.log('分享报告ID:', id);
};

// 删除报告
const deleteReport = (id: number) => {
  console.log('删除报告ID:', id);
};
</script>

<style scoped>
</style> 