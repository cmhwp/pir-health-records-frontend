<template>
  <div>
    <div class="header-actions" style="display: flex; justify-content: space-between; margin-bottom: 16px;">
      <h1>研究项目</h1>
      <div>
        <a-button type="primary" style="margin-right: 8px;">
          <template #icon><plus-outlined /></template>
          新建项目
        </a-button>
        <a-button>
          <template #icon><filter-outlined /></template>
          筛选
        </a-button>
      </div>
    </div>

    <a-tabs v-model:activeKey="activeTabKey">
      <a-tab-pane key="all" tab="全部项目">
        <a-table :columns="columns" :data-source="projects" :row-key="(record: Record<string, any>) => record.id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-space>
                <a>查看</a>
                <a>编辑</a>
                <a-popconfirm
                  title="确定要删除此项目吗?"
                  ok-text="确定"
                  cancel-text="取消"
                >
                  <template #icon><question-circle-outlined style="color: red" /></template>
                  <a style="color: red">删除</a>
                </a-popconfirm>
              </a-space>
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ record.status }}
              </a-tag>
            </template>
            <template v-if="column.key === 'progress'">
              <a-progress :percent="record.progress" size="small" />
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="inProgress" tab="进行中">
        <a-table :columns="columns" :data-source="inProgressProjects" :row-key="(record: Record<string, any>) => record.id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-space>
                <a>查看</a>
                <a>编辑</a>
                <a-popconfirm
                  title="确定要删除此项目吗?"
                  ok-text="确定"
                  cancel-text="取消"
                >
                  <template #icon><question-circle-outlined style="color: red" /></template>
                  <a style="color: red">删除</a>
                </a-popconfirm>
              </a-space>
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ record.status }}
              </a-tag>
            </template>
            <template v-if="column.key === 'progress'">
              <a-progress :percent="record.progress" size="small" />
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="completed" tab="已完成">
        <a-table :columns="columns" :data-source="completedProjects" :row-key="(record: Record<string, any>) => record.id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-space>
                <a>查看</a>
                <a>编辑</a>
                <a-popconfirm
                  title="确定要删除此项目吗?"
                  ok-text="确定"
                  cancel-text="取消"
                >
                  <template #icon><question-circle-outlined style="color: red" /></template>
                  <a style="color: red">删除</a>
                </a-popconfirm>
              </a-space>
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ record.status }}
              </a-tag>
            </template>
            <template v-if="column.key === 'progress'">
              <a-progress :percent="record.progress" size="small" />
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <a-modal v-model:open="modalVisible" title="项目详情" width="800px" :footer="null">
      <a-descriptions bordered :column="2">
        <a-descriptions-item label="项目名称" span="2">
          隐私保护健康数据研究
        </a-descriptions-item>
        <a-descriptions-item label="项目负责人">
          张研究
        </a-descriptions-item>
        <a-descriptions-item label="开始日期">
          2023-01-15
        </a-descriptions-item>
        <a-descriptions-item label="预计结束日期">
          2023-12-31
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag color="green">进行中</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="项目进度" span="2">
          <a-progress :percent="75" />
        </a-descriptions-item>
        <a-descriptions-item label="项目描述" span="2">
          本项目旨在研究如何在保护患者隐私的前提下，实现健康数据的有效利用与共享。
          研究包括数据加密、去识别化处理、差分隐私等多种技术手段的应用与评估。
        </a-descriptions-item>
        <a-descriptions-item label="合作单位" span="2">
          医学研究院、数据安全实验室
        </a-descriptions-item>
        <a-descriptions-item label="项目成员" span="2">
          张研究、李数据、王安全、陈医学
        </a-descriptions-item>
      </a-descriptions>
      <div style="margin-top: 24px; text-align: right;">
        <a-button style="margin-right: 8px;">关闭</a-button>
        <a-button type="primary">编辑项目</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { 
  PlusOutlined, 
  FilterOutlined,
  QuestionCircleOutlined 
} from '@ant-design/icons-vue';

// 选项卡激活键
const activeTabKey = ref('all');

// 模态框可见性
const modalVisible = ref(false);

// 表格列定义
const columns = [
  {
    title: '项目名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '负责人',
    dataIndex: 'leader',
    key: 'leader',
  },
  {
    title: '开始日期',
    dataIndex: 'startDate',
    key: 'startDate',
    sorter: (a: Record<string, any>, b: Record<string, any>) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  },
  {
    title: '结束日期',
    dataIndex: 'endDate',
    key: 'endDate',
    sorter: (a: Record<string, any>, b: Record<string, any>) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    filters: [
      { text: '进行中', value: '进行中' },
      { text: '规划中', value: '规划中' },
      { text: '已完成', value: '已完成' },
      { text: '已暂停', value: '已暂停' },
    ],
    onFilter: (value: string, record: Record<string, any>) => record.status === value,
  },
  {
    title: '进度',
    dataIndex: 'progress',
    key: 'progress',
    sorter: (a: Record<string, any>, b: Record<string, any>) => a.progress - b.progress,
  },
  {
    title: '操作',
    key: 'action',
  },
];

// 模拟数据
const projects = [
  {
    id: 1,
    name: '隐私保护健康数据研究',
    leader: '张研究',
    startDate: '2023-01-15',
    endDate: '2023-12-31',
    status: '进行中',
    progress: 75,
  },
  {
    id: 2,
    name: '医疗数据加密传输方案',
    leader: '李数据',
    startDate: '2023-02-10',
    endDate: '2023-10-30',
    status: '进行中',
    progress: 60,
  },
  {
    id: 3,
    name: '跨机构健康数据共享研究',
    leader: '王安全',
    startDate: '2023-03-01',
    endDate: '2023-11-30',
    status: '进行中',
    progress: 45,
  },
  {
    id: 4,
    name: '健康数据可视化展示',
    leader: '赵可视',
    startDate: '2023-04-15',
    endDate: '2023-09-15',
    status: '规划中',
    progress: 0,
  },
  {
    id: 5,
    name: '医疗数据标准化研究',
    leader: '钱标准',
    startDate: '2022-10-01',
    endDate: '2023-05-31',
    status: '已完成',
    progress: 100,
  },
  {
    id: 6,
    name: '隐私计算在医疗领域的应用',
    leader: '孙隐私',
    startDate: '2022-12-01',
    endDate: '2023-08-31',
    status: '已暂停',
    progress: 30,
  },
  {
    id: 7,
    name: '区块链医疗数据管理系统',
    leader: '周区块',
    startDate: '2023-01-20',
    endDate: '2023-12-20',
    status: '进行中',
    progress: 50,
  },
];

// 筛选不同状态的项目
const inProgressProjects = computed(() => 
  projects.filter(project => project.status === '进行中')
);

const completedProjects = computed(() => 
  projects.filter(project => project.status === '已完成')
);

// 根据状态获取标签颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case '进行中':
      return 'green';
    case '规划中':
      return 'blue';
    case '已完成':
      return 'geekblue';
    case '已暂停':
      return 'orange';
    default:
      return 'default';
  }
};
</script>

<style scoped>
</style>