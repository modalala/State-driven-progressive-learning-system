# 响应模板

## 首次进入项目

```
📚 检测到学习项目：{{domain}}

课程大纲：
- 共 {{total_lessons}} 课，预计 {{total_hours}} 小时
- 当前：未开始

第一课：{{lesson_l0_title}}
学习目标：
{{learning_objectives}}

输入"开始"开始学习
```

---

## 恢复学习

```
📚 {{domain}} - 继续学习

📍 当前位置：Lesson-{{current_id}}: {{current_title}}
📊 TODO 进度：{{completed}}/{{total}}
⏱️ 本课已学习：{{study_time}} 分钟

{{#if vulnerabilities}}
⚠️ 有 {{vuln_count}} 个知识点需要关注
{{/if}}

输入"继续"恢复学习
```

---

## 完成 TODO 后

```
✅ TODO-{{id}} 完成：{{title}}

掌握自评：
- 概念理解：[清晰/一般/需复习]
- 实践能力：[能独立/需参考/需指导]

KISS 复盘：
- Keep: {{keep_item}}
- Improve: {{improve_item}}
- Stop: {{stop_item}}
- Start: {{start_item}}

{{#if next_todo}}
下一 TODO：{{next_todo_title}}
输入"继续"开始
{{else}}
本课所有 TODO 完成！
输入"下一课"继续
{{/if}}
```

---

## 当前 TODO 展示

```markdown
## 📍 当前任务：TODO-3: 心智模型构建（🔴）

第 3 / 5 个任务 | 预计时间：40 分钟

**目标**: 掌握 Agent 的基础架构模型

**内容**:
1. 画出感知-思考-行动循环图
2. 为每个环节定义
3. 代码实践：实现伪代码

**完成检查**:
- [ ] 架构图包含四个核心组件
- [ ] 能解释为什么记忆是跨循环的
- [ ] 伪代码展示了循环结构

---
✅ 已完成：TODO-1, TODO-2
🔒 待解锁：TODO-4, TODO-5
```

**注意**：🔒 表示后续 TODO 被隐藏，不显示具体内容。

---

## 学习报告

```
🎉 Lesson L0 完成！

掌握情况：
- 🔴 核心点：4/4
- 🟠 重点：2/2
- 🟡 了解：1/1

学习时间：120 分钟
脆弱点：2 个（已修复）

下一课 L1 已解锁！
输入"下一课"继续
```

---

## 项目选择菜单

```
📚 你有以下学习项目：

  #   项目              状态      进度
  1   Agent 架构学习    active    25%
  2   Python 基础      paused    0%
  3   Rust 进阶       active    60%

选择操作：
- 输入数字 [1-3] 继续学习
- 输入 'n' 创建新项目
- 输入 's' 查看统计汇总

请选择: _
```

---

## 跨项目统计

```
📊 跨项目学习统计

总项目数: 3
活跃项目: 2
总学习时间: 12.5 小时
总完成 TODO: 45
总完成课程: 5

学习时间分布:
- Agent 架构: 8.5 小时 (68%)
- Rust 进阶: 4 小时 (32%)

最近7天学习时间:
[柱状图]
```

---

## 用户资源引用

```markdown
📎 [my-code-001] 我的 Agent 实现
   类型: Python 代码 | 来源: 用户上传
   匹配度: 95%

   💡 Skill 分析: 这段代码展示了基础的感知-思考-行动循环，
   与当前 TODO 目标高度匹配。注意看第 8 行的 observe() 函数。

   ```python
   # 你的代码片段
   def agent_loop():
       perception = observe()  # ← 关键：获取环境输入
       ...
   ```

**练习**: 基于你的代码 [my-code-001]，完成以下任务...
```