# L02: Tool Use - Context 总结

> **格言**：*"加一个工具，只加一个 handler"* -- 循环不用动，新工具注册进 dispatch map 就行。

---

## 一、心智模型构建

### 1.1 核心概念网络

| 概念 | 定义 | 依赖关系 | 熟练度 |
|------|------|----------|--------|
| **Dispatch Map** | `{name: handler}` 字典分发机制 | → L01 Agent Loop | L2 |
| **Tool Schema** | name + description + input_schema | → Dispatch Map | L1 |
| **safe_path** | 路径沙箱防逃逸 | → Trust Boundary | L2 |
| **Trust Boundary** | Harness 不信任 LLM 的安全判断 | → 安全护栏 | L2 |
| **专用工具优先** | read/write/edit 优于 bash | → Attack Surface | L1 |

**概念依赖图**：
```
L01 (Agent Loop)
    │
    │ 循环 + stop_reason
    │
    ▼
Dispatch Map ─────────────────────────────────┐
    │                                         │
    │ {name: handler}                         │
    │                                         │
    ├─→ Tool Schema ──→ 模型调用时机          │
    │                                         │
    ├─→ safe_path ────→ Trust Boundary        │
    │                                         │
    └─→ 专用工具 ────→ 减少 Attack Surface    │
                                                │
循环不变 ←─────────────────────────────────────┘
```

### 1.2 专家视角

#### 专家共识

1. **加工具不改循环**：Dispatch map 实现开闭原则——对扩展开放，对修改封闭
2. **Harness 不信任 LLM**：安全检查必须在 Harness 层，LLM 可犯错，Harness 拦截
3. **工具描述决定调用时机**：description 是 LLM 决策的唯一依据
4. **专用工具减少攻击面**：bash 是最大安全漏洞，专用工具做沙箱

#### 专家分歧

| 分歧点 | 观点A | 观点B | 学习者理解 |
|--------|-------|-------|------------|
| **颗粒度权衡** | 细颗粒度工具更安全，每个操作都专用 | 细颗粒度增加维护成本，bash 灵活性不可替代 | 开（需持续关注） |
| **Tool Schema 详略** | description 越详细，LLM 调用越准确 | 过详可能限制 LLM 创造性用法 | - |

### 1.3 深度测试问题

> **Q1**: 为什么加工具不需要改循环？
>
> **思考引导**：
> - 角度1：Dispatch map 是什么结构？
> - 角度2：`handler = TOOL_HANDLERS.get(block.name)` 这行代码的关键在哪？
>
> **预期理解层级**：
> - L0（表面）："字典查找"
> - L1（关联）："注册机制，加工具只需加 handler"
> - L2（深层）："开闭原则——对扩展开放，对修改封闭"

> **Q2**: safe_path 为什么用 `resolve()` + `is_relative_to()`？
>
> **思考引导**：
> - 角度1：`../` 这种路径会发生什么？
> - 角度2：符号链接能逃逸吗？
>
> **预期理解层级**：
> - L0（表面）："检查路径"
> - L1（关联）："防止路径逃逸"
> - L2（深层）："信任边界原则——LLM 可犯错，Harness 拦截"

> **Q3**: 为什么专用工具比 bash 更安全？
>
> **思考引导**：
> - 角度1：bash 能执行什么？
> - 角度2：read_file 能执行什么？
>
> **预期理解层级**：
> - L0（表面）："bash 更危险"
> - L1（关联）："bash 攻击面更大"
> - L2（深层）："减少攻击面原则——专用工具约束操作范围"

---

## 二、结构化学习

### 2.1 SQ3R 进度

| 阶段 | 状态 | 关键产出 | 下一步 |
|------|------|----------|--------|
| Survey | ✅ 完成 | 识别 dispatch map 结构 | - |
| Question | ✅ 完成 | 3 个核心问题 | - |
| Read | ✅ 完成 | 理解 safe_path 实现 | - |
| Recite | ✅ 完成 | 心智模型构建验证 | - |
| Review | 📅 2026-04-06 | 开闭原则复习 | 计划中 |

### 2.2 项目成果

| 项目 | 状态 | 关键交付物 | 学习价值 |
|------|------|-----------|----------|
| s02_tool_use.py | ✅ 理解 | Dispatch map 实现 | 开闭原则实践 |

### 2.3 KISS 复盘

| 类别 | 内容 | 优先级 |
|------|------|--------|
| **Keep** | 用对比表理解"之前 vs 之后" | - |
| **Improve** | 深化开闭原则的理解 | 高 |
| **Start** | 关注安全护栏设计模式 | 中 |
| **Stop** | - | - |

---

## 三、对抗测试

### 3.1 脆弱点诊断

| 脆弱点 | 来源 | 风险等级 | 状态 | 补救措施 |
|--------|------|----------|------|----------|
| LLM判断安全的误区 | Q3 回答 | 高 | ✅ 已解决 | 安全检查必须是 Harness 层做的 |
| block.name 来源误区 | Read 验证 | 中 | ✅ 已解决 | block.name 由 LLM 提供 |
| 颗粒度权衡理解 | 对抗问题2 | 中 | 🔓 开放 | L03+ 深化理解 |

### 3.2 反事实情境

> **情境1**: 如果没有 safe_path，LLM 要求读取 `/etc/passwd` 会怎样？
>
> **答案**: LLM 会得到系统敏感文件内容。信任边界原则失效。

> **情境2**: 如果 dispatch map 用 if/elif 链，加第 100 个工具要改多少处？
>
> **答案**: 循环体要改 100 处。开闭原则失效。

---

## 四、核心代码（必背）

```python
# Dispatch map: 加工具不改循环
TOOL_HANDLERS = {
    "bash":       lambda **kw: run_bash(kw["command"]),
    "read_file":  lambda **kw: run_read(kw["path"], kw.get("limit")),
    "write_file": lambda **kw: run_write(kw["path"], kw["content"]),
    "edit_file":  lambda **kw: run_edit(kw["path"], kw["old_text"], kw["new_text"]),
}

# 循环体不变，按名查找
for block in response.content:
    if block.type == "tool_use":
        handler = TOOL_HANDLERS.get(block.name)
        output = handler(**block.input) if handler else f"Unknown tool: {block.name}"

# safe_path: 信任边界
def safe_path(p: str) -> Path:
    path = (WORKDIR / p).resolve()  # 解析符号链接
    if not path.is_relative_to(WORKDIR):
        raise ValueError(f"Path escapes workspace: {p}")
    return path
```

---

## 五、心智模型评估

| 概念 | 最终层级 | 达到 L2 的差距 |
|------|----------|----------------|
| Dispatch Map | L2 | ✅ 已理解开闭原则 |
| Trust Boundary | L2 | ✅ 已理解安全护栏职责 |
| 专用工具优先 | L1 | 未提炼减少攻击面原则 |

**整体评估**: L1 层级

---

## 六、后续课程关系

```
L02 (Tool Use)
    │
    │ dispatch map + safe_path
    │
    ├─→ L03 TodoWrite    在 dispatch map 中加 todo 工具
    ├─→ L04 Subagent     子循环用独立 dispatch map
    ├─→ L05 Skill Loading SKILL.md 通过 tool_result 注入
    └─→ L06 Context Compact 压缩 tool_result 历史
```

---

## 七、复习计划

| 时间点 | 复习内容 | 状态 |
|--------|----------|------|
| 2026-04-06 | 开闭原则 + 策略模式 + 颗粒度权衡 | ⬜ |
| 2026-04-12 | 信任边界原则 + 安全护栏设计 | ⬜ |
| 2026-04-26 | 与其他课程的关系 | ⬜ |