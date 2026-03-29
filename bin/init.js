#!/usr/bin/env node

/**
 * Progressive Learning Coach - 项目初始化脚手架（智能引导版）
 *
 * 用法:
 *   plc init [project-name]
 *   npx progressive-learning-coach init [project-name]
 *
 * 特性:
 *   - 检测已有项目，提供选择菜单
 *   - 在当前目录创建子目录
 *   - 自动注册到 .skill/registry.json
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const registry = require('./registry');
const context = require('./context');

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

// 主函数（智能引导版）
async function main() {
  const baseDir = process.cwd();

  console.log('🎓 Progressive Learning Coach\n');

  // 检查是否已有项目
  if (registry.registryExists(baseDir)) {
    await handleExistingProjects(baseDir);
  } else {
    await handleFirstTime(baseDir);
  }

  rl.close();
}

// 处理已有项目的情况
async function handleExistingProjects(baseDir) {
  const projects = registry.listProjects(baseDir);
  const activeProject = registry.getActiveProject(baseDir);

  if (projects.length === 0) {
    console.log('已注册 0 个学习项目。\n');
    await createNewProject(baseDir);
    return;
  }

  console.log(`当前目录已有 ${projects.length} 个学习项目:\n`);

  // 显示项目列表
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const isCurrent = p.name === activeProject?.name;
    const marker = isCurrent ? '(当前)' : '';
    const statusIcon = p.status?.global_status === 'active' ? '🟢' :
                       p.status?.global_status === 'paused' ? '🟡' : '⚪';
    console.log(`  ${i + 1}. ${statusIcon} ${p.display_name} - ${p.status?.progress_percentage || 0}% ${marker}`);
  }

  console.log('\n选择操作:');
  console.log('  [1-' + projects.length + '] 切换到该项目');
  console.log('  [n] 创建新项目');
  console.log('  [c] 继续当前项目学习');
  console.log('  [l] 查看详细列表');
  console.log('  [q] 退出');
  console.log('');

  const choice = await ask('请选择: ');

  if (choice === 'q') {
    console.log('已退出。\n');
    return;
  }

  if (choice === 'l') {
    // 详细列表
    console.log('\n项目详情:\n');
    for (const p of projects) {
      console.log(`📁 ${p.display_name}`);
      console.log(`   名称: ${p.name}`);
      console.log(`   路径: ${p.path}`);
      console.log(`   领域: ${p.domain}`);
      console.log(`   当前课程: ${p.status?.current_lesson || '-'}`);
      console.log('');
    }
    return;
  }

  if (choice === 'c') {
    if (!activeProject) {
      console.log('没有设置活跃项目。请先切换到一个项目。\n');
      return;
    }
    console.log(`\n当前项目: ${activeProject.display_name}`);
    console.log(`当前课程: ${activeProject.status?.current_lesson || 'L0'}`);
    console.log('\n下一步: 对 AI 说 "继续学习"\n');
    return;
  }

  if (choice === 'n') {
    await createNewProject(baseDir);
    return;
  }

  // 切换到指定项目
  const index = parseInt(choice, 10) - 1;
  if (index >= 0 && index < projects.length) {
    const targetProject = projects[index];

    if (targetProject.name === activeProject?.name) {
      console.log(`\n"${targetProject.display_name}" 已经是当前活跃项目。\n`);
      console.log('下一步: 对 AI 说 "继续学习"\n');
      return;
    }

    // 确认切换
    console.log(`\n切换到 "${targetProject.display_name}"?`);
    console.log('注意：将重新加载新项目的资源，当前项目的学习进度已保存。\n');

    const confirm = await ask('确认? [y/N]: ');
    if (confirm.toLowerCase() === 'y') {
      context.switchContext(targetProject.name, baseDir);
      registry.setActiveProject(targetProject.name, baseDir);

      console.log(`\n✅ 已切换到: ${targetProject.display_name}`);
      console.log(`📂 项目路径: ${targetProject.path}`);
      console.log('\n下一步: 对 AI 说 "继续学习"\n');
    } else {
      console.log('已取消。\n');
    }
  } else {
    console.log('无效选择。\n');
  }
}

// 处理首次使用
async function handleFirstTime(baseDir) {
  // 尝试发现未注册的项目
  const discovered = registry.discoverProjects(baseDir);

  if (discovered.length > 0) {
    console.log(`发现 ${discovered.length} 个未注册的学习项目:\n`);
    for (const p of discovered) {
      console.log(`  📁 ${p.name}`);
    }
    console.log('\n选择操作:');
    console.log('  [r] 注册所有发现的项目');
    console.log('  [n] 创建新项目');
    console.log('');

    const choice = await ask('请选择: ');
    if (choice.toLowerCase() === 'r') {
      for (const p of discovered) {
        registry.registerProject(p.path, baseDir);
        console.log(`✅ 已注册: ${p.name}`);
      }
      console.log('\n下一步: plc list 查看所有项目\n');
      return;
    }
  }

  // 没有发现项目或选择创建新项目
  console.log('检测到这是第一次使用，或当前目录没有学习项目。\n');
  await createNewProject(baseDir);
}

// 创建新项目
async function createNewProject(baseDir) {
  // 获取项目名
  let projectName = process.argv[2];

  if (!projectName) {
    projectName = await ask('请输入新项目名称', 'my-learning-project');
  }

  // 验证项目名
  if (!/^[\w-]+$/.test(projectName)) {
    console.log('项目名称只能包含字母、数字、下划线和连字符。\n');
    return;
  }

  const projectDir = path.join(baseDir, projectName);

  // 检查目录是否已存在
  if (fs.existsSync(projectDir)) {
    const overwrite = await ask(`目录 ${projectName} 已存在，是否覆盖? (y/N)`, 'N');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('已取消。\n');
      return;
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
  fs.writeFileSync(path.join(resourcesDir, 'metadata.yaml'), getMetadataTemplate());

  // 生成 README
  console.log('📝 生成 README.md...');
  fs.writeFileSync(path.join(projectDir, 'README.md'), getReadmeTemplate(domainCn, totalLessons));

  // 注册到全局注册表
  console.log('📝 注册项目...');
  registry.registerProject(projectDir, baseDir);

  // 设置为活跃项目
  registry.setActiveProject(projectName, baseDir);

  // 初始化上下文
  context.loadProjectContext(projectDir, baseDir);

  // 完成
  console.log('\n✅ 项目创建成功!\n');
  console.log(`📂 项目路径: ${projectDir}`);
  console.log('\n下一步:');
  console.log('  对 AI 说: "开始学习"');
  console.log('');
}

// metadata.yaml 模板
function getMetadataTemplate() {
  return `# 学习资源索引
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

# 添加你自己的资源：
# 1. 将文件放入对应子目录（code-snippets/ / documents/ / images/）
# 2. 在上面的 resources 列表中添加条目
# 3. 设置正确的 tags 以关联到课程和 TODO
`;
}

// README 模板
function getReadmeTemplate(domainCn, totalLessons) {
  return `# ${domainCn} 学习项目

使用 Progressive Learning Coach Skill 的个性化学习项目。

## 项目信息

- **领域**: ${domainCn}
- **课程数**: ${totalLessons} 课
- **预计总时长**: ${totalLessons * 2} 小时

## 开始学习

在项目目录下对 AI 说：

\`\`\`
开始学习
\`\`\`

## 项目结构

\`\`\`
.
├── syllabus.yaml          # 课程大纲配置
├── lessons/               # 课程内容
│   ├── l0-topic.md
│   ├── l1-topic.md
│   └── ...
├── resources/             # 学习资源（可选）
│   ├── metadata.yaml
│   ├── code-snippets/
│   ├── documents/
│   └── images/
└── .learning/             # 学习状态（自动生成）
    ├── learning-state.json
    └── memory-store.json
\`\`\`

## 程度分级

- 🔴 **核心点**: 必须掌握，对抗测试必须通过
- 🟠 **重点**: 重要参考，能复述核心思想
- 🟡 **了解**: 开阔视野，知道存在即可

---

由 Progressive Learning Coach 自动生成
`;
}

// 运行
main().catch((err) => {
  console.error('错误:', err);
  process.exit(1);
});
