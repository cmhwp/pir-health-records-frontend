<template>
  <div>
    <h1>数据分析</h1>
    
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="24">
        <a-card>
          <a-form layout="inline">
            <a-form-item label="数据源">
              <a-select v-model:value="dataSource" style="width: 180px">
                <a-select-option value="patient_records">患者记录</a-select-option>
                <a-select-option value="treatment_data">治疗数据</a-select-option>
                <a-select-option value="clinical_trials">临床试验</a-select-option>
                <a-select-option value="genomic_data">基因组数据</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="时间范围">
              <a-range-picker v-model:value="dateRange" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="runAnalysis">
                <template #icon><play-circle-outlined /></template>
                运行分析
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16">
      <a-col :span="16">
        <a-card title="数据分析结果" :bordered="false" style="margin-bottom: 16px">
          <a-tabs v-model:activeKey="activeTabKey">
            <a-tab-pane key="charts" tab="图表">
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="height: 400px; border: 1px solid #f0f0f0; display: flex; justify-content: center; align-items: center;">
                  <h3>年龄分布与疾病关联性分析</h3>
                  <!-- 实际项目中这里放置图表组件 -->
                  <div style="width: 80%; height: 80%; background-color: #f9f9f9; display: flex; justify-content: center; align-items: center;">
                    图表展示区域（示例）
                  </div>
                </div>
                
                <div style="height: 400px; border: 1px solid #f0f0f0; display: flex; justify-content: center; align-items: center;">
                  <h3>治疗效果对比分析</h3>
                  <!-- 实际项目中这里放置图表组件 -->
                  <div style="width: 80%; height: 80%; background-color: #f9f9f9; display: flex; justify-content: center; align-items: center;">
                    图表展示区域（示例）
                  </div>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="table" tab="数据表">
              <a-table :columns="tableColumns" :data-source="tableData" :pagination="{ pageSize: 5 }">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'trend'">
                    <a-tag :color="record.trend === '上升' ? 'red' : 'green'">
                      {{ record.trend }}
                    </a-tag>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>
            <a-tab-pane key="report" tab="分析报告">
              <a-typography>
                <a-typography-title level={4}>数据分析总结</a-typography-title>
                <a-typography-paragraph>
                  基于当前所选数据源的分析结果显示，在过去6个月内，心血管疾病的发病率呈现下降趋势，而糖尿病的发病率有小幅上升。
                </a-typography-paragraph>
                <a-typography-paragraph>
                  年龄分布方面，45-60岁的患者群体占比最高，达到总体的42%。与上一年同期相比，青少年（18岁以下）患者数量减少了5%。
                </a-typography-paragraph>
                <a-typography-title level={4}>关键发现</a-typography-title>
                <a-typography-paragraph>
                  <ul>
                    <li>新型治疗方案A对心血管疾病的有效率比传统方案高出15%。</li>
                    <li>男性患者在遵循治疗方案方面的依从性普遍低于女性患者。</li>
                    <li>患者生活习惯与疾病发展速度呈现明显相关性。</li>
                  </ul>
                </a-typography-paragraph>
                <a-typography-title level={4}>建议措施</a-typography-title>
                <a-typography-paragraph>
                  <ol>
                    <li>扩大新型治疗方案A的应用范围。</li>
                    <li>针对男性患者群体，设计更有效的治疗依从性提升计划。</li>
                    <li>加强健康生活方式的宣传和教育。</li>
                  </ol>
                </a-typography-paragraph>
              </a-typography>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="分析任务" :bordered="false" style="margin-bottom: 16px">
          <a-list
            size="small"
            :data-source="analysisTasks"
            :render-item-prop="'renderItem'"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :title="item.name"
                  :description="`上次运行: ${item.lastRun}`"
                >
                  <template #avatar>
                    <a-avatar 
                      :style="{ backgroundColor: getStatusColor(item.status) }" 
                      shape="square"
                    >
                      {{ item.status.charAt(0) }}
                    </a-avatar>
                  </template>
                </a-list-item-meta>
                <template #extra>
                  <a-button size="small" @click="runTask(item.id)">
                    <template #icon><play-circle-outlined /></template>
                    运行
                  </a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
        
        <a-card title="分析工具" :bordered="false">
          <a-list
            size="small"
            :data-source="analysisTools"
            :render-item-prop="'renderItem'"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :title="item.name"
                  :description="item.description"
                >
                  <template #avatar>
                    <a-avatar :style="{ backgroundColor: item.color }" shape="square">
                      {{ item.icon }}
                    </a-avatar>
                  </template>
                </a-list-item-meta>
                <template #extra>
                  <a-button size="small" @click="useTool(item.id)">
                    使用
                  </a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { PlayCircleOutlined } from '@ant-design/icons-vue';

// 数据源选择
const dataSource = ref('patient_records');

// 日期范围
const dateRange = ref<[Date, Date] | null>(null);

// 当前激活的选项卡
const activeTabKey = ref('charts');

// 表格列定义
const tableColumns = [
  {
    title: '疾病类型',
    dataIndex: 'disease',
    key: 'disease',
  },
  {
    title: '患者数量',
    dataIndex: 'patientCount',
    key: 'patientCount',
  },
  {
    title: '平均年龄',
    dataIndex: 'avgAge',
    key: 'avgAge',
  },
  {
    title: '男女比例',
    dataIndex: 'genderRatio',
    key: 'genderRatio',
  },
  {
    title: '趋势',
    dataIndex: 'trend',
    key: 'trend',
  },
];

// 表格数据
const tableData = [
  {
    key: '1',
    disease: '高血压',
    patientCount: 1243,
    avgAge: 58,
    genderRatio: '1.2:1 (男:女)',
    trend: '下降',
  },
  {
    key: '2',
    disease: '糖尿病',
    patientCount: 892,
    avgAge: 52,
    genderRatio: '1:1.1 (男:女)',
    trend: '上升',
  },
  {
    key: '3',
    disease: '冠心病',
    patientCount: 567,
    avgAge: 63,
    genderRatio: '1.5:1 (男:女)',
    trend: '下降',
  },
  {
    key: '4',
    disease: '肺炎',
    patientCount: 723,
    avgAge: 45,
    genderRatio: '1:1 (男:女)',
    trend: '下降',
  },
  {
    key: '5',
    disease: '抑郁症',
    patientCount: 421,
    avgAge: 38,
    genderRatio: '1:1.8 (男:女)',
    trend: '上升',
  },
];

// 分析任务列表
const analysisTasks = [
  {
    id: 1,
    name: '年龄分布分析',
    status: '完成',
    lastRun: '2023-05-10',
  },
  {
    id: 2,
    name: '治疗效果对比',
    status: '进行中',
    lastRun: '2023-05-15',
  },
  {
    id: 3,
    name: '地区疾病分布',
    status: '待处理',
    lastRun: '2023-04-28',
  },
  {
    id: 4,
    name: '疾病关联性分析',
    status: '完成',
    lastRun: '2023-05-12',
  },
];

// 分析工具列表
const analysisTools = [
  {
    id: 1,
    name: '统计分析工具',
    description: '基础统计分析',
    icon: 'S',
    color: '#1890ff',
  },
  {
    id: 2,
    name: '机器学习分析',
    description: '预测模型与分类',
    icon: 'M',
    color: '#52c41a',
  },
  {
    id: 3,
    name: '可视化生成器',
    description: '数据可视化工具',
    icon: 'V',
    color: '#722ed1',
  },
  {
    id: 4,
    name: '报告生成器',
    description: '自动生成分析报告',
    icon: 'R',
    color: '#fa8c16',
  },
];

// 根据状态获取颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case '完成':
      return '#52c41a'; // 绿色
    case '进行中':
      return '#1890ff'; // 蓝色
    case '待处理':
      return '#faad14'; // 橙色
    case '失败':
      return '#f5222d'; // 红色
    default:
      return '#d9d9d9'; // 灰色
  }
};

// 运行分析方法
const runAnalysis = () => {
  console.log('运行分析，数据源:', dataSource.value, '日期范围:', dateRange.value);
};

// 运行特定任务
const runTask = (taskId: number) => {
  console.log('运行任务ID:', taskId);
};

// 使用分析工具
const useTool = (toolId: number) => {
  console.log('使用工具ID:', toolId);
};
</script>

<style scoped>
</style> 