# L01: Agent Loop 思维导图

```mermaid
mindmap
  root((Agent Loop))
    核心模式
      while True
      stop_reason 检测
      tool_result 追加
      循环继续/退出
    关键组件
      messages[]
        累积历史
        上下文连续性
        时间感
      stop_reason
        tool_use: 继续
        end_turn: 结束
        max_tokens: 截断
        stop_sequence: 停止词
      工具执行
        run_bash
        收集结果
        构建 tool_result
    设计原则
      信任模型
        Harness 不替模型判断
        决策权在模型
        循环完全被动
      职责分离
        模型: 决策智能
        Harness: 执行机制
        Hook: 安全护栏
    边界理解
      max_tokens 截断
        响应可能含 tool_use
        但 stop_reason != tool_use
        不执行半截工具
      无限循环
        Harness 不能阻止
        责任在模型
        Hook 可防范
    后续扩展
      L02: Tool Use
        dispatch map
        加工具不改循环
      L03: TodoWrite
        循环上加规划
      L06: Context Compact
        max_tokens 处理
      L12: Hook 机制
        安全护栏
```

## 概念层级

```
顶层：Agent Loop（循环本身）
├── 第一层：核心模式（代码结构）
│   ├── 第二层：关键组件（messages, stop_reason, 工具）
│       ├── 第三层：设计原则（信任模型, 职责分离）
│           ├── 第四层：边界理解（极端情况处理）
│               └── 第五层：后续扩展（其他课程关系）
```

## 核心格言

> *"One loop & Bash is all you need"*
>
> 一个工具 + 一个循环 = 一个 Agent
>
> 后面 11 个课程都在这个循环上叠加机制——循环本身始终不变。