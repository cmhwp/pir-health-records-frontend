<template>
  <div>
    <h1>研究人员工作台</h1>
    <a-row :gutter="16">
      <a-col :span="6">
        <a-statistic title="正在进行的研究" :value="3" style="margin-bottom: 16px">
          <template #suffix>
            <project-outlined />
          </template>
        </a-statistic>
      </a-col>
      <a-col :span="6">
        <a-statistic title="待审核数据" :value="12" style="margin-bottom: 16px">
          <template #suffix>
            <file-text-outlined />
          </template>
        </a-statistic>
      </a-col>
      <a-col :span="6">
        <a-statistic title="研究成果" :value="5" style="margin-bottom: 16px">
          <template #suffix>
            <fund-outlined />
          </template>
        </a-statistic>
      </a-col>
      <a-col :span="6">
        <a-statistic title="合作团队" :value="2" style="margin-bottom: 16px">
          <template #suffix>
            <team-outlined />
          </template>
        </a-statistic>
      </a-col>
    </a-row>
    
    <a-divider />
    
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="近期研究项目" :bordered="false">
          <template #extra><a href="#">更多</a></template>
          <a-list size="small" :data-source="recentProjects">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-typography-text mark>[{{ item.status }}]</a-typography-text> {{ item.name }}
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="数据分析任务" :bordered="false">
          <template #extra><a href="#">查看全部</a></template>
          <a-list size="small" :data-source="analyticsTasks">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-typography-text mark>[{{ item.status }}]</a-typography-text> {{ item.name }}
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="最近活动" :bordered="false">
          <template #extra><a href="#">更多</a></template>
          <a-timeline>
            <a-timeline-item>更新研究进展报告</a-timeline-item>
            <a-timeline-item>添加新的研究数据</a-timeline-item>
            <a-timeline-item>与合作团队进行视频会议</a-timeline-item>
            <a-timeline-item>提交研究申请</a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>
    </a-row>
    
    <a-divider />
    
    <a-row :gutter="16">
      <a-col :span="24">
        <a-card title="研究进度概览" :bordered="false">
          <a-progress :percent="75" status="active" />
          <a-descriptions title="当前研究进度" :column="2">
            <a-descriptions-item label="项目名称">隐私保护健康数据研究</a-descriptions-item>
            <a-descriptions-item label="开始日期">2023-01-15</a-descriptions-item>
            <a-descriptions-item label="预计结束">2023-12-31</a-descriptions-item>
            <a-descriptions-item label="负责人">张研究</a-descriptions-item>
            <a-descriptions-item label="当前阶段">数据分析阶段</a-descriptions-item>
            <a-descriptions-item label="研究状态">进行中</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { 
  ProjectOutlined, 
  FileTextOutlined, 
  FundOutlined, 
  TeamOutlined 
} from '@ant-design/icons-vue';

// 模拟数据
const recentProjects = [
  { name: '隐私保护健康数据研究', status: '进行中' },
  { name: '医疗数据加密传输方案', status: '进行中' },
  { name: '跨机构健康数据共享研究', status: '进行中' },
  { name: '健康数据可视化展示', status: '规划中' },
  { name: '医疗数据标准化研究', status: '已完成' }
];

const analyticsTasks = [
  { name: '年龄与疾病关联性分析', status: '进行中' },
  { name: '药物疗效对比分析', status: '进行中' },
  { name: '地区疾病分布分析', status: '待开始' },
  { name: '患者康复周期研究', status: '已完成' },
  { name: '医疗资源分配优化', status: '规划中' }
];
</script>

<style scoped>
</style> 