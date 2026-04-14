# L06: Context Compact - 概念思维导图

## 核心概念思维导图

```mermaid
mindmap
    root((Context Compact))
        三层压缩策略
            Layer1 大结果
                写磁盘
                留预览
                立即执行
            Layer2 旧结果
                占位符
                保留最近3个
                静默执行
            Layer3 整体过长
                生成摘要
                保住连续性5要素
                阈值触发/模型请求
        连续性保护
            5要素
                当前目标
                已完成动作
                已修改文件
                关键决定
                下一步
            摘要策略
                保住为什么
                丢弃做了什么
                推理链路优先
        控制权归属
            Harness控制
                固定规则
                阈值检测
                低决策成本
            模型控制
                compact工具
                时机判断
                高决策成本
        特殊处理
            read_file保护
                环境漂移风险
                不压缩
            占位符设计
                指针而非副本
                可恢复性
```

## 学习进度思维导图

```mermaid
mindmap
    root((L06 学习状态))
        已掌握 L2
            三层压缩策略
                MySQL类比环境漂移
                TCP拥塞窗口类比动态窗口
            连续性5要素
                Git commit message类比
            控制权归属
                低H高M原则
            压缩本质
                可恢复损失 vs 可持续空间
            推理链路优先
                保因弃果
        已纠正
            摘要边界 L0→L2
            控制权归属 L1→L2
            压缩本质 L1→L2
        项目成果
            摘要分析
            改进方案
```

## 与其他课程关联

```mermaid
mindmap
    root((Context Compact关联))
        前置课程
            L04 Subagent
                messages隔离
                摘要返回
            L05 Skill Loading
                tool_result可释放
                两层注入价值
        后续课程
            L07 Permission
                权限决策保留?
            L09 Memory
                跨会话保留
        同类设计
            Git commit
                为什么 vs 改了什么
            会议纪要
                决议原因 vs 讨论
```

## 层级规则说明

| 层级 | 内容 | 来源 |
|------|------|------|
| root | Context Compact（主题） | syllabus.title |
| 一级分支 | 核心概念模块 | core_points |
| 二级分支 | 子概念 | lessons内容提取 |
| 三级分支 | 具体知识点 | lessons详细内容 |
| 四级分支 | 细节（已折叠） | - |

**深度控制**：不超过4层，超过时折叠为 `... (更多内容)`