#!/usr/bin/env node

/**
 * Progressive Learning Coach - 项目初始化脚手架
 * 
 * 用法:
 *   npx progressive-learning-coach init [project-name]
 *   
 * 示例:
 *   npx progressive-learning-coach init
 *   npx progressive-learning-coach init my-agent-learning
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 模板目录
const TEMPLATE_DIR = path.join(__dirname, '..', 'templates', 'default');

// 询问函数
function ask(question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// 复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 替换模板变量
function replaceTemplate(content, variables) {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// 生成课程文件
function generateLessonFile(lessonDir, lessonNum, domain) {
  const lessonId = `L${lessonNum}`;
  const filePath = path.join(lessonDir, `l${lessonNum}-topic.md`);
  
  const content = `# Lesson ${lessonId}: 第${lessonNum + 1}课主题

## 课程信息

- **课程 ID**: ${lessonId}
- **标题**: 待填写
- **副标题**: 待填写
- **预计时长**: 2 小时
- **TODO 数**: 4
- **前置课程**: ${lessonNum > 0 ? `L${lessonNum - 1}` : '无'}

---

## 学习目标

完成本课后，你将能够：

- 🔴 **核心**: 核心目标1
- 🔴 **核心**: 核心目标2
- 🟠 **重点**: 重点目标
- 🟡 **了解**: 了解目标

---

## TODO 清单

### TODO-1: 任务一（🔴）

**目标**: 待填写

**内容**:
1. 步骤1
2. 步骤2
3. 步骤3

**完成检查**:
- [ ] 检查项1
- [ ] 检查项2

---

### TODO-2: 任务二（🔴）

**目标**: 待填写

**内容**:
1. 步骤1
2. 步骤2

**完成检查**:
- [ ] 检查项1

---

### TODO-3: 任务三（🟠）

**目标**: 待填写

**内容**:
1. 步骤1

**完成检查**:
- [ ] 检查项1

---

### TODO-4: 深度测试（🔴）

**目标**: 验证理解深度

**内容**:
1. 回答测试题
2. 分析反事实情境
3. 接受诘问

**完成检查**:
- [ ] 测试通过

---

## 程度分级详情

### 🔴 核心点（必须掌握）

| 知识点 | 为什么核心 | 不掌握的后果 |
|-------|-----------|-------------|
| 知识点1 | 原因 | 后果 |
| 知识点2 | 原因 | 后果 |

### 🟠 重点（重要参考）

| 知识点 | 应用场景 | 快速查阅方式 |
|-------|---------|-------------|
| 知识点1 | 场景 | 文档 |

### 🟡 了解（开阔视野）

| 知识点 | 关联内容 | 延伸阅读 |
|-------|---------|---------|
| 知识点1 | 关联 | 资料 |

---

## 对抗测试题库

### 题目 1: 边界条件

**场景**: 待设计

**考点**: 待明确

**脆弱点**: 待标记

---

## 学习资源

### 必读
- [ ] 资源1
- [ ] 资源2

### 选读
- [ ] 资源3

---

## 完成标准

- [ ] 所有 TODO 完成
- [ ] 核心点掌握
- [ ] 无明显盲区
`;

  fs.writeFileSync(filePath, content);
  return filePath;
}

// 生成 syllabus.yaml
function generateSyllabus(projectDir, config) {
  const { domain, domainCn, totalLessons } = config;
  
  let syllabusContent = `meta:
  domain: "${domain}"
  domain_cn: "${domainCn}"
  total_lessons: ${totalLessons}
  estimated_total_hours: ${totalLessons * 2}
  description: "${domainCn}系统性学习项目"

# 课程大纲
syllabus:
`;

  for (let i = 0; i < totalLessons; i++) {
    const lessonId = `L${i}`;
    const prereq = i > 0 ? `["L${i - 1}"]` : '[]';
    
    syllabusContent += `  - id: "${lessonId}"
    title: "第${i + 1}课"
    subtitle: "待填写"
    estimated_hours: 2
    todos_count: 4
    file: "lessons/l${i}-topic.md"
    prerequisites: ${prereq}
    core_points:
      - "核心点1"
      - "核心点2"
`;
  }

  syllabusContent += `
# 学习方法配置
learning_config:
  method1_mental_model:
    enabled: true
    duration_ratio: 0.2
  method2_structured:
    enabled: true
    duration_ratio: 0.5
    sq3r_enabled: true
    project_based_enabled: true
  method3_adversarial:
    enabled: true
    duration_ratio: 0.3

# 艾宾浩斯复习配置（分钟）
review_schedule: [20, 60, 540, 1440, 2880, 8640, 44640]
`;

  const syllabusPath = path.join(projectDir, 'syllabus.yaml');
  fs.writeFileSync(syllabusPath, syllabusContent);
  return syllabusPath;
}

// 主函数
async function main() {
  console.log('🎓 Progressive Learning Coach - 项目初始化\n');

  // 获取项目名
  let projectName = process.argv[2];
  
  if (!projectName) {
    projectName = await ask('项目名称', 'my-learning-project');
  }

  const projectDir = path.resolve(projectName);

  // 检查目录是否已存在
  if (fs.existsSync(projectDir)) {
    const overwrite = await ask(`目录 ${projectName} 已存在，是否覆盖? (y/N)`, 'N');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('已取消');
      process.exit(0);
    }
    // 清空目录
    fs.rmSync(projectDir, { recursive: true });
  }

  // 收集配置
  console.log('\n📋 项目配置:\n');
  
  const domain = await ask('学习领域标识（英文）', 'my_topic');
  const domainCn = await ask('学习领域名称（中文）', '我的学习主题');
  const totalLessons = parseInt(await ask('课程数量', '3'), 10);

  // 创建目录
  console.log(`\n📁 创建项目: ${projectName}\n`);
  
  fs.mkdirSync(projectDir, { recursive: true });
  
  const lessonsDir = path.join(projectDir, 'lessons');
  fs.mkdirSync(lessonsDir, { recursive: true });

  // 生成 syllabus.yaml
  console.log('📝 生成 syllabus.yaml...');
  generateSyllabus(projectDir, { domain, domainCn, totalLessons });

  // 生成课程文件
  console.log('📝 生成课程文件...');
  for (let i = 0; i < totalLessons; i++) {
    generateLessonFile(lessonsDir, i, domain);
    console.log(`  - lessons/l${i}-topic.md`);
  }

  // 创建 resources 目录
  console.log('📁 创建 resources/ 目录...');
  const resourcesDir = path.join(projectDir, 'resources');
  fs.mkdirSync(resourcesDir, { recursive: true });
  fs.mkdirSync(path.join(resourcesDir, 'code-snippets'), { recursive: true });
  fs.mkdirSync(path.join(resourcesDir, 'documents'), { recursive: true });
  fs.mkdirSync(path.join(resourcesDir, 'images'), { recursive: true });

  // 生成 resources/metadata.yaml
  console.log('📝 生成 resources/metadata.yaml...');
  const metadataContent = `# 学习资源索引
# 将你的学习资源放在 resources/ 目录下，并在此文件中添加描述
# Skill 会自动读取并在教学中引用这些资源

resources:
  # 示例：代码资源
  # - id: "my-code-001"
  #   type: "code"                        # code | document | image | video | link
  #   path: "resources/code-snippets/my-code.py"
  #   title: "我的代码实现"
  #   description: "这是一个示例代码文件"
  #   tags: ["L0", "TODO-2"]             # 关联的课程和 TODO
  #   source: "user"                      # user | external | auto
  #   
  # 示例：文档资源
  # - id: "my-doc-001"
  #   type: "document"
  #   path: "resources/documents/my-notes.pdf"
  #   title: "我的学习笔记"
  #   description: "整理的学习笔记"
  #   tags: ["L0", "TODO-1"]
  #   source: "user"

# 添加你自己的资源：
# 1. 将文件放入对应子目录（code-snippets/ / documents/ / images/）
# 2. 在上面的 resources 列表中添加条目
# 3. 设置正确的 tags 以关联到课程和 TODO
# 4. Skill 会自动在教学中引用这些资源
`;
  fs.writeFileSync(path.join(resourcesDir, 'metadata.yaml'), metadataContent);

  // 生成 README
  console.log('📝 生成 README.md...');
  const readmeContent = `# ${domainCn} 学习项目

使用 Progressive Learning Coach Skill 的个性化学习项目。

## 项目信息

- **领域**: ${domainCn}
- **课程数**: ${totalLessons} 课
- **预计总时长**: ${totalLessons * 2} 小时

## 开始学习

确保已安装 Skill：

\`\`\`bash
# 安装 Skill
npm install -g progressive-learning-coach

# 或手动复制到 skills 目录
cp -r path/to/progressive-learning-coach ~/.config/agents/skills/
\`\`\`

在项目目录下对 AI 说：

\`\`\`
开始学习
\`\`\`

## 项目结构

\`\`\`
.
├── syllabus.yaml          # 课程大纲配置
├── lessons/               # 课程内容
│   ${Array.from({length: totalLessons}, (_, i) => `├── l${i}-topic.md`).join('\n│   ')}
└── .learning/             # 学习状态（自动生成）
    ├── learning-state.json
    └── memory-store.json
\`\`\`

## 自定义内容

1. 编辑 \`syllabus.yaml\` 修改课程信息
2. 编辑 \`lessons/*.md\` 完善课程内容
3. 添加你的学习资源到 \`resources/\` 目录（可选）

## 程度分级

- 🔴 **核心点**: 必须掌握，对抗测试必须通过
- 🟠 **重点**: 重要参考，能复述核心思想
- 🟡 **了解**: 开阔视野，知道存在即可

---

由 Progressive Learning Coach 自动生成
`;

  fs.writeFileSync(path.join(projectDir, 'README.md'), readmeContent);

  // 完成
  console.log('\n✅ 项目创建成功!\n');
  console.log(`📂 项目路径: ${projectDir}`);
  console.log('\n下一步:');
  console.log(`  cd ${projectName}`);
  console.log('  # 编辑 syllabus.yaml 和 lessons/*.md');
  console.log('  # 对 AI 说: "开始学习"');
  console.log('');

  rl.close();
}

// 运行
main().catch((err) => {
  console.error('错误:', err);
  process.exit(1);
});
