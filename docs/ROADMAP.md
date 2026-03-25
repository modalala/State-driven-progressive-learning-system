# 开发路线图

## 已完成功能 ✅

### Phase 1 - 基础架构
- [x] NPM 配置（package.json）
- [x] 项目模板（templates/）
- [x] Skill 状态初始化逻辑

### Phase 2 - 核心功能
- [x] TODO 渐进披露机制
- [x] 脚手架脚本（bin/init.js）
- [x] 可视化 Skill 集成示例

### Phase 3 - 用户资源集成 ⭐
- [x] **设计方案** - `docs/resource-integration-design.md`
- [x] **模板更新** - templates/default/resources/
- [x] **Skill 协议** - SKILL.md 资源读取和匹配逻辑
- [x] **参考文档** - references/user-resources.md
- [x] **脚手架更新** - bin/init.js 生成 resources/

---

## 待实现功能

### 测试套件 P2
- [ ] 单元测试（状态机、TODO 筛选、资源匹配）
- [ ] 集成测试（完整学习流程）
- [ ] 测试数据生成

### CI/CD P2
- [ ] GitHub Actions 配置
- [ ] 自动发布到 NPM
- [ ] 版本管理

### 国际化 P3
- [ ] 英文版 Skill
- [ ] 多语言模板

### 增强功能 P3
- [ ] 学习报告生成
- [ ] 进度统计图表
- [ ] 导出学习笔记

---

## 当前状态

**核心功能已全部完成！** 🎉

| 功能 | 状态 |
|------|------|
| 基础架构 | ✅ 完成 |
| 学习教练协议 | ✅ 完成 |
| TODO 渐进披露 | ✅ 完成 |
| 用户资源集成 | ✅ 完成 |
| 可视化集成 | ✅ 完成 |
| 脚手架工具 | ✅ 完成 |
| 测试套件 | ⏳ 待实现 |
| CI/CD | ⏳ 待实现 |

---

## 使用方式

```bash
# 1. 安装 Skill
npm install -g progressive-learning-coach

# 2. 创建学习项目（含 resources/ 目录）
npx progressive-learning-coach init my-project
cd my-project

# 3. 添加你的学习资源（可选）
# 放入 resources/code-snippets/, resources/documents/, resources/images/
# 编辑 resources/metadata.yaml 添加描述

# 4. 开始学习
# 对 AI 说："开始学习"
```
