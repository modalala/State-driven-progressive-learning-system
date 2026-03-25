# Lesson L1: 认知架构 - ReAct vs Reflexion

## 课程信息

- **课程 ID**: L1
- **标题**: 认知架构
- **副标题**: 掌握 ReAct 与 Reflexion 的核心机制与设计权衡
- **预计时长**: 3 小时
- **TODO 数**: 7
- **前置课程**: L0 (Agent 本质论)

---

## 学习目标

完成本课后，你将能够：

- 🔴 画出 ReAct 的 Thought → Action → Observation 循环，并解释为什么这个顺序重要
- 🔴 实现一个基础的 ReAct Agent，能处理多步骤任务
- 🔴 对比 ReAct 和 Reflexion，说出它们在什么场景下各有优势
- 🔴 识别 ReAct 的局限性（如错误累积、深度推理瓶颈）
- 🟠 理解 Chain-of-Thought (CoT) 与 ReAct 的关系和差异
- 🟠 知道如何设计 ReAct 的 Prompt 模板（格式、停止条件、解析逻辑）
- 🟡 了解其他认知架构（Plan-and-Solve、Tree of Thoughts）的存在
- 🟡 知道当前研究如何解决 ReAct 的长程规划问题

---

## TODO 清单

### TODO-1: 架构对比 - ReAct vs 基础 Agent（🔴）

**目标**: 理解 ReAct 相比基础 Agent 的改进

**内容**:
1. 回顾基础 Agent 的感知-思考-行动循环
2. 学习 ReAct 的显式思考结构：
   ```
   Thought: 我需要先查询天气，然后决定穿什么
   Action: 查询天气 API(city="北京")
   Observation: 北京今天晴，25度
   Thought: 天气不错，可以穿短袖
   Action: 输出建议("建议穿短袖出门")
   ```

3. 对比表格：
   | 特性 | 基础 Agent | ReAct |
   |-----|-----------|-------|
   | 思考过程 | 隐式（LLM 内部） | 显式（可观察） |
   | 可追溯性 | 低 | 高 |
   | 调试难度 | 难 | 较易 |
   | Token 消耗 | 较低 | 较高 |

4. 为什么显式思考有帮助？列举 3 个场景

**产出**:
- 对比表格
- 3 个显式思考有帮助的场景说明

**完成检查**:
- [ ] 能解释 Thought/Action/Observation 各自的作用
- [ ] 能说出显式思考的优势
- [ ] 能识别何时不需要显式思考（简单任务）

---

### TODO-2: 代码实现 - 基础 ReAct Agent（🔴）

**目标**: 用代码实现一个可运行的 ReAct Agent

**内容**:
1. 实现 ReAct 循环的核心逻辑：
   ```python
   def react_loop(query, tools, max_steps=10):
       for step in range(max_steps):
           thought = llm_generate_thought(query, history)
           action = parse_action(thought)
           if action.type == "finish":
               return action.result
           observation = execute_action(action, tools)
           history.append({thought, action, observation})
   ```

2. 设计 Prompt 模板：
   - System Prompt：定义 ReAct 格式和可用工具
   - Few-shot 示例：展示 2-3 个正确执行的例子
   - 停止条件：如何识别任务完成

3. 实现工具：
   - 计算器（支持加减乘除）
   - 搜索引擎（模拟）
   - 完成标记

4. 测试案例：
   - "计算 25 * 13 + 100"
   - "北京的温度比上海高多少？"（需要两次查询）

**产出**:
- 完整的 ReAct Agent 代码
- Prompt 模板文件
- 测试案例的运行结果

**完成检查**:
- [ ] 代码能正确处理多步骤任务
- [ ] Thought/Action/Observation 格式正确
- [ ] 能在适当时候终止（不无限循环）

---

### TODO-3: Reflexion 架构学习（🔴）

**目标**: 理解 Reflexion 的自我反思机制

**内容**:
1. 学习 Reflexion 的三层架构：
   - **Actor**: 执行行动（类似 ReAct）
   - **Evaluator**: 评估结果（打分/判断成功失败）
   - **Self-Reflection**: 生成改进建议

2. 对比 ReAct vs Reflexion：
   ```
   ReAct: 环境 → Thought → Action → Observation → [循环]
   Reflexion: 环境 → Thought → Action → Observation → Eval → 
              [失败?] → Self-Reflection → 重试 → ... → [成功]
   ```

3. 分析 Reflexion 的优势场景：
   - 试错学习（如游戏、复杂问题解决）
   - 长期任务优化
   - 从失败中恢复

4. 分析 Reflexion 的代价：
   - 额外的 LLM 调用（Evaluator + Self-Reflection）
   - 更长的执行时间
   - 需要设计评估标准

**产出**:
- Reflexion 架构图
- ReAct vs Reflexion 决策流程图

**完成检查**:
- [ ] 能画出 Reflexion 的三层结构
- [ ] 能说出 Reflexion 适合什么任务
- [ ] 能说出 Reflexion 不适合什么任务（简单/实时任务）

---

### TODO-4: 专家共识与分歧（🔴）

**目标**: 理解领域对认知架构的共识和争议

**内容**:
1. **共识提取**（5 个）：
   - ReAct 的显式思考提高了可解释性
   - 多步骤任务需要某种形式的记忆/历史
   - 思考-行动分离有助于调试和优化
   - 不是所有任务都需要复杂架构（简单任务用简单方案）
   - 架构选择应该基于任务特性，而非追求复杂

2. **分歧探讨**（3 个）：
   - 分歧 A: ReAct 中的 Thought 应该有多详细？
     - 详细派：越详细越可追溯，便于调试
     - 简洁派：Token 太贵，只保留关键决策点
   
   - 分歧 B: Reflexion 的 Evaluator 应该用什么？
     - LLM 派：用 LLM 评估，与 Actor 一致
     - 规则派：用确定性规则，更可靠
   
   - 分歧 C: 认知架构是否应该可学习/可进化？
     - 固定派：人工设计的架构更稳定
     - 进化派：让 Agent 自己学习最优思考模式

3. 选择你认同的立场

**产出**:
- 共识理解笔记
- 分歧立场选择 + 理由

---

### TODO-5: MVP 实战 - 带错误恢复的 Agent（🔴）

**目标**: 实现一个能处理错误的 ReAct Agent

**内容**:
1. 在 TODO-2 的基础上增加错误处理：
   - 工具调用失败（API 超时、格式错误）
   - LLM 输出格式错误（无法解析 Action）
   - 循环检测（避免无限循环）

2. 实现简单的 Self-Reflection（轻量版 Reflexion）：
   - 当步骤超过 5 步还没完成，触发反思
   - LLM 分析当前进展，建议调整策略
   - 根据建议重置或调整后续步骤

3. 测试场景：
   - 场景 1: 故意让计算器在某些输入下失败，看 Agent 如何恢复
   - 场景 2: 给一个模糊的目标（"帮我安排周末"），看 Agent 如何澄清

**产出**:
- 增强版 ReAct Agent 代码
- 错误处理测试报告

**完成检查**:
- [ ] 能处理至少 2 种错误类型
- [ ] 有 Self-Reflection 机制（即使简单）
- [ ] 不会无限循环

---

### TODO-6: 边界分析 - ReAct 的局限性（🔴）

**目标**: 理解 ReAct 何时会失败

**内容**:
1. 分析 ReAct 的 5 个主要局限：
   - **错误累积**: 早期错误会在后续步骤中被放大
   - **短视**: 缺乏长期规划，可能陷入局部最优
   - **Token 爆炸**: 历史记录过长导致成本激增
   - **脆弱性**: Prompt 微小变化可能导致行为剧变
   - **评估困难**: 难以判断"思考过程"是否正确

2. 针对每个局限，思考缓解策略：
   - 错误累积 → ?
   - 短视 → ?
   - Token 爆炸 → ?
   - 脆弱性 → ?
   - 评估困难 → ?

3. 研究案例：找一个 ReAct 失败的实际案例，分析原因

**产出**:
- 5 个局限的分析
- 对应的缓解策略
- 实际失败案例分析

**完成检查**:
- [ ] 能具体说明每个局限的表现
- [ ] 提出的缓解策略有可行性
- [ ] 案例分析切中要害

---

### TODO-7: 深度测试与对抗（🔴）

**目标**: 通过对抗测试验证理解

**内容**:
1. **深度测试题**（5 道）：
   - Q1: 如果一个 ReAct Agent 在 Thought 中说"我要查天气"，但 Action 是查股票，会发生什么？这暴露了什么设计问题？
   - Q2: ReAct 中的 Observation 必须由外部系统产生吗？LLM 自己生成算不算？
   - Q3: 为什么 ReAct 适合"查询-计算-总结"任务，但不适合"创意写作"任务？
   - Q4: Reflexion 的 Self-Reflection 能不能用规则代替 LLM？各有什么优劣？
   - Q5: 如果你的 ReAct Agent 在步骤 8 突然开始重复步骤 3 的动作，最可能的原因是什么？如何检测和预防？

2. **反事实情境**（3 个）：
   - 情境 1: 如果 Observation 延迟 30 秒才返回，你的 ReAct 架构需要如何调整？
   - 情境 2: 如果 LLM API 限制每次最多 3 个 Thought-Action 对，你如何重构 Agent？
   - 情境 3: 如果把 ReAct 的显式思考改成隐式（只输出 Action），性能和可调试性会如何变化？

3. **苏格拉底诘问**:
   - "ReAct 的 Thought 如果包含错误，Observation 能纠正它吗？"
   - "Reflexion 的 Evaluator 如果评估错误，会导致什么后果？"
   - "设计一个任务，让 ReAct 必然失败，但人类可以轻松完成。"

**产出**:
- 测试题答案
- 反事实分析
- 诘问思考记录

**完成检查**:
- [ ] 5 道测试题回答正确
- [ ] 反事实分析考虑实际约束
- [ ] 诘问暴露了理解边界

---

## 程度分级详情

### 🔴 核心点（必须掌握）

| 知识点 | 为什么核心 | 不掌握的后果 |
|-------|-----------|-------------|
| Thought → Action → Observation 顺序 | 这是 ReAct 的核心机制，顺序错误会导致逻辑混乱 | 无法实现正确的 ReAct 循环 |
| 显式思考 vs 隐式思考 | 区分 ReAct 和基础 Agent 的关键 | 无法选择合适的架构 |
| ReAct 的 Prompt 设计 | 决定 Agent 能否正确解析和行动 | Agent 行为不可控，错误率高 |
| Reflexion 的三层结构 | 实现自我改进的基础 | 无法实现错误恢复和学习 |
| ReAct 的局限性 | 避免在不适合的场景使用 ReAct | 项目失败或性能极差 |

### 🟠 重点（重要参考）

| 知识点 | 应用场景 | 快速查阅方式 |
|-------|---------|-------------|
| CoT 与 ReAct 的关系 | 设计推理流程时 | ReAct 论文第 3 节 |
| Token 成本控制 | 生产环境部署时 | TODO-6 的缓解策略 |
| Evaluator 设计 | 实现 Reflexion 时 | Reflexion 论文附录 |

### 🟡 了解（开阔视野）

| 知识点 | 关联内容 | 延伸阅读 |
|-------|---------|---------|
| Plan-and-Solve | L4 规划能力的替代方案 | Plan-and-Solve 论文 |
| Tree of Thoughts | L4 的高级规划方法 | ToT 论文 |
| 长程规划研究前沿 | 了解当前局限的解决方向 | 相关综述论文 |

---

## 学习资源

### 必读
- [ ] ReAct: Synergizing Reasoning and Acting in Language Models (arXiv:2210.03629)
- [ ] Reflexion: Self-Reflective Agents (arXiv:2303.11366)

### 选读
- [ ] Chain-of-Thought Prompting Elicits Reasoning in LLMs
- [ ] Plan-and-Solve Prompting: Improving Zero-Shot Chain-of-Thought Reasoning

### 代码参考
- [ ] LangChain ReAct Agent 实现
- [ ] Reflexion 官方示例

---

## 完成标准

要进入 Lesson L2，必须：

- [ ] 所有 7 个 TODO 标记完成
- [ ] 代码实现能正确处理多步骤任务和错误恢复
- [ ] 掌握 ReAct 和 Reflexion 的核心差异
- [ ] 能清晰说明 ReAct 的局限性和适用场景
- [ ] 对抗测试中无明显盲区
