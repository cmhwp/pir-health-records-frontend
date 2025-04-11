<template>
  <div>
    <div class="header-actions" style="display: flex; justify-content: space-between; margin-bottom: 16px;">
      <h1>合作团队</h1>
      <div>
        <a-button type="primary" style="margin-right: 8px;">
          <template #icon><user-add-outlined /></template>
          添加合作
        </a-button>
        <a-button>
          <template #icon><mail-outlined /></template>
          发送邀请
        </a-button>
      </div>
    </div>

    <a-row :gutter="16">
      <a-col :span="16">
        <a-card :bordered="false" style="margin-bottom: 16px;">
          <a-tabs v-model:activeKey="activeTabKey">
            <a-tab-pane key="current" tab="当前合作">
              <a-list
                :data-source="currentTeams"
                item-layout="vertical"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <template #extra>
                      <a-space>
                        <a-button type="primary" size="small" @click="viewTeam(item.id)">
                          <template #icon><eye-outlined /></template>
                          查看项目
                        </a-button>
                        <a-button size="small">
                          <template #icon><message-outlined /></template>
                          联系
                        </a-button>
                      </a-space>
                    </template>
                    <a-list-item-meta :title="item.name" :description="`${item.type} | ${item.location}`">
                      <template #avatar>
                        <a-avatar :size="64" :src="item.avatar">
                          {{ item.name.charAt(0) }}
                        </a-avatar>
                      </template>
                    </a-list-item-meta>
                    <div>
                      <p>{{ item.description }}</p>
                      <div style="margin-top: 8px;">
                        <span style="margin-right: 16px;">
                          <team-outlined /> 成员: {{ item.memberCount }}
                        </span>
                        <span style="margin-right: 16px;">
                          <project-outlined /> 项目: {{ item.projectCount }}
                        </span>
                        <span>
                          <calendar-outlined /> 合作开始: {{ item.startDate }}
                        </span>
                      </div>
                      <div style="margin-top: 8px;">
                        <a-tag v-for="tag in item.tags" :key="tag" color="blue">{{ tag }}</a-tag>
                      </div>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </a-tab-pane>
            <a-tab-pane key="past" tab="历史合作">
              <a-list
                :data-source="pastTeams"
                item-layout="vertical"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <template #extra>
                      <a-space>
                        <a-button type="primary" size="small" @click="viewTeam(item.id)">
                          <template #icon><eye-outlined /></template>
                          查看项目
                        </a-button>
                        <a-button size="small">
                          <template #icon><message-outlined /></template>
                          联系
                        </a-button>
                      </a-space>
                    </template>
                    <a-list-item-meta :title="item.name" :description="`${item.type} | ${item.location}`">
                      <template #avatar>
                        <a-avatar :size="64" :src="item.avatar">
                          {{ item.name.charAt(0) }}
                        </a-avatar>
                      </template>
                    </a-list-item-meta>
                    <div>
                      <p>{{ item.description }}</p>
                      <div style="margin-top: 8px;">
                        <span style="margin-right: 16px;">
                          <team-outlined /> 成员: {{ item.memberCount }}
                        </span>
                        <span style="margin-right: 16px;">
                          <project-outlined /> 项目: {{ item.projectCount }}
                        </span>
                        <span style="margin-right: 16px;">
                          <calendar-outlined /> 合作期间: {{ item.startDate }} - {{ item.endDate }}
                        </span>
                      </div>
                      <div style="margin-top: 8px;">
                        <a-tag v-for="tag in item.tags" :key="tag" color="blue">{{ tag }}</a-tag>
                      </div>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="潜在合作伙伴" :bordered="false" style="margin-bottom: 16px;">
          <a-list
            :data-source="potentialTeams"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.name" :description="item.type">
                  <template #avatar>
                    <a-avatar>{{ item.name.charAt(0) }}</a-avatar>
                  </template>
                </a-list-item-meta>
                <template #extra>
                  <a-button size="small" type="primary">
                    联系
                  </a-button>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
        
        <a-card title="合作统计" :bordered="false" style="margin-bottom: 16px;">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-statistic title="当前合作" :value="4" />
            </a-col>
            <a-col :span="12">
              <a-statistic title="总项目数" :value="7" />
            </a-col>
          </a-row>
          <a-divider style="margin: 16px 0" />
          <a-row :gutter="16">
            <a-col :span="12">
              <a-statistic title="发表论文" :value="12" />
            </a-col>
            <a-col :span="12">
              <a-statistic title="共享数据集" :value="5" />
            </a-col>
          </a-row>
        </a-card>
        
        <a-card title="近期活动" :bordered="false">
          <a-timeline>
            <a-timeline-item>
              <span style="font-weight: bold;">医学研究院</span> 邀请您参加视频会议
              <div style="font-size: 12px; color: #999; margin-top: 4px;">2小时前</div>
            </a-timeline-item>
            <a-timeline-item>
              <span style="font-weight: bold;">数据安全实验室</span> 分享了一份新文档
              <div style="font-size: 12px; color: #999; margin-top: 4px;">昨天</div>
            </a-timeline-item>
            <a-timeline-item>
              <span style="font-weight: bold;">健康信息技术中心</span> 批准了您的数据访问请求
              <div style="font-size: 12px; color: #999; margin-top: 4px;">3天前</div>
            </a-timeline-item>
            <a-timeline-item>
              <span style="font-weight: bold;">临床研究中心</span> 提出了项目合作建议
              <div style="font-size: 12px; color: #999; margin-top: 4px;">一周前</div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { 
  UserAddOutlined, 
  MailOutlined,
  EyeOutlined,
  MessageOutlined,
  TeamOutlined,
  ProjectOutlined,
  CalendarOutlined
} from '@ant-design/icons-vue';

// 当前激活的选项卡
const activeTabKey = ref('current');

// 当前合作团队
const currentTeams = [
  {
    id: 1,
    name: '医学研究院',
    type: '研究机构',
    location: '北京',
    description: '专注于医学领域的研究机构，拥有先进的医疗设备和一流的研究团队。目前与我们在隐私保护健康数据研究项目上展开合作。',
    memberCount: 35,
    projectCount: 3,
    startDate: '2023-01-15',
    tags: ['医学研究', '临床试验', '数据分析'],
    avatar: '',
  },
  {
    id: 2,
    name: '数据安全实验室',
    type: '技术团队',
    location: '上海',
    description: '专注于数据安全和隐私保护技术的研究团队，为医疗数据加密传输方案提供技术支持。',
    memberCount: 12,
    projectCount: 2,
    startDate: '2023-02-10',
    tags: ['数据安全', '隐私保护', '加密技术'],
    avatar: '',
  },
  {
    id: 3,
    name: '健康信息技术中心',
    type: '技术中心',
    location: '深圳',
    description: '专注于健康信息技术和数据标准化的机构，负责跨机构健康数据共享研究的技术实现和标准制定。',
    memberCount: 20,
    projectCount: 1,
    startDate: '2023-03-01',
    tags: ['信息技术', '标准化', '数据共享'],
    avatar: '',
  },
  {
    id: 4,
    name: '临床研究中心',
    type: '医疗机构',
    location: '广州',
    description: '大型三甲医院的临床研究中心，提供真实的临床数据和应用场景，为研究提供实际验证。',
    memberCount: 25,
    projectCount: 1,
    startDate: '2023-04-15',
    tags: ['临床研究', '医疗数据', '应用验证'],
    avatar: '',
  },
];

// 历史合作团队
const pastTeams = [
  {
    id: 5,
    name: '医疗数据科学实验室',
    type: '研究机构',
    location: '武汉',
    description: '专注于医疗数据科学研究的实验室，曾与我们合作开展医疗数据标准化研究项目。',
    memberCount: 15,
    projectCount: 1,
    startDate: '2022-06-01',
    endDate: '2022-12-31',
    tags: ['数据科学', '机器学习', '标准化'],
    avatar: '',
  },
  {
    id: 6,
    name: '健康数据可视化团队',
    type: '技术团队',
    location: '杭州',
    description: '专注于数据可视化的技术团队，曾与我们合作开发健康数据可视化方案。',
    memberCount: 8,
    projectCount: 1,
    startDate: '2022-08-15',
    endDate: '2023-02-28',
    tags: ['数据可视化', 'UI设计', '交互设计'],
    avatar: '',
  },
];

// 潜在合作伙伴
const potentialTeams = [
  {
    id: 7,
    name: '基因组学研究所',
    type: '研究机构',
  },
  {
    id: 8,
    name: '医疗人工智能实验室',
    type: '技术团队',
  },
  {
    id: 9,
    name: '公共卫生数据中心',
    type: '数据中心',
  },
  {
    id: 10,
    name: '远程医疗技术协会',
    type: '行业协会',
  },
];

// 查看团队项目
const viewTeam = (id: number) => {
  console.log('查看团队ID:', id);
};
</script>

<style scoped>
</style> 