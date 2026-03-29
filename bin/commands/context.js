#!/usr/bin/env node

/**
 * PLC context 命令 - 为课程生成 Context
 *
 * 用法:
 *   plc context              # 为当前课程生成 Context
 *   plc context L0           # 为指定课程生成 Context
 *   plc context --force      # 强制重新生成（忽略增量检测）
 *   plc context --check      # 检查是否需要更新
 *   plc context --type md    # 只生成 Markdown
 *   plc context --type mermaid  # 只生成 Mermaid
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const registry = require('../registry');
const context = require('../context');

// Context 输出目录名
const CONTEXT_DIR = 'context';

/**
 * 格式化时间显示
 * @param {string|null} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
function formatTime(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
}

/**
 * 获取 context 目录路径
 * @param {string} projectPath - 项目路径
 * @returns {string} context 目录路径
 */
function getContextDir(projectPath) {
  return path.join(projectPath, CONTEXT_DIR);
}

/**
 * 获取课程 context 目录路径
 * @param {string} projectPath - 项目路径
 * @param {string} lessonId - 课程 ID
 * @returns {string} 课程 context 目录路径
 */
function getLessonContextDir(projectPath, lessonId) {
  return path.join(projectPath, CONTEXT_DIR, lessonId.toLowerCase());
}

/**
 * 加载源数据
 * @param {string} projectPath - 项目路径
 * @param {string} lessonId - 课程 ID
 * @returns {object} 源数据对象
 */
function loadSourceData(projectPath, lessonId) {
  const data = {
    syllabus: null,
    lesson: null,
    learningState: null,
    memoryStore: null,
    lessonId: lessonId
  };

  // 加载 syllabus.yaml
  const syllabusPath = path.join(projectPath, 'syllabus.yaml');
  if (fs.existsSync(syllabusPath)) {
    try {
      const content = fs.readFileSync(syllabusPath, 'utf8');
      data.syllabus = yaml.load(content);
    } catch (err) {
      console.error(`加载 syllabus.yaml 失败: ${err.message}`);
    }
  }

  // 找到当前课程信息
  if (data.syllabus && data.syllabus.syllabus) {
    const lessonInfo = data.syllabus.syllabus.find(l => l.id === lessonId);
    if (lessonInfo) {
      data.lessonMeta = lessonInfo;

      // 加载课程文件
      if (lessonInfo.file) {
        const lessonFilePath = path.join(projectPath, lessonInfo.file);
        if (fs.existsSync(lessonFilePath)) {
          try {
            data.lesson = fs.readFileSync(lessonFilePath, 'utf8');
          } catch (err) {
            console.error(`加载课程文件失败: ${err.message}`);
          }
        }
      }
    }
  }

  // 加载 learning-state.json
  const statePath = path.join(projectPath, '.learning', 'learning-state.json');
  if (fs.existsSync(statePath)) {
    try {
      const content = fs.readFileSync(statePath, 'utf8');
      data.learningState = JSON.parse(content);
    } catch (err) {
      console.error(`加载 learning-state.json 失败: ${err.message}`);
    }
  }

  // 加载 memory-store.json
  const memoryPath = path.join(projectPath, '.learning', 'memory-store.json');
  if (fs.existsSync(memoryPath)) {
    try {
      const content = fs.readFileSync(memoryPath, 'utf8');
      data.memoryStore = JSON.parse(content);
    } catch (err) {
      // memory-store.json 可能不存在，忽略错误
      data.memoryStore = createEmptyMemoryStore();
    }
  } else {
    data.memoryStore = createEmptyMemoryStore();
  }

  return data;
}

/**
 * 创建空的 memory store 结构
 * @returns {object} 空 memory store
 */
function createEmptyMemoryStore() {
  return {
    core_models: [],
    controversies: [],
    vulnerability_log: [],
    code_snippets: {},
    session_history: []
  };
}

/**
 * 检查是否需要更新
 * @param {string} projectPath - 项目路径
 * @param {string} lessonId - 课程 ID
 * @returns {object} 检查结果 { needsUpdate: boolean, reason: string }
 */
function checkNeedsUpdate(projectPath, lessonId) {
  const contextDir = getLessonContextDir(projectPath, lessonId);
  const metaPath = path.join(contextDir, 'context-meta.yaml');

  // 如果 meta 文件不存在，需要生成
  if (!fs.existsSync(metaPath)) {
    return { needsUpdate: true, reason: 'Context 尚未生成' };
  }

  try {
    // 加载元数据
    const metaContent = fs.readFileSync(metaPath, 'utf8');
    const meta = yaml.load(metaContent);

    // 检查源文件修改时间
    const sourceFiles = [
      path.join(projectPath, 'syllabus.yaml'),
      path.join(projectPath, '.learning', 'learning-state.json'),
      path.join(projectPath, '.learning', 'memory-store.json')
    ];

    // 添加课程文件
    if (meta.source_files && meta.source_files.lesson_file) {
      sourceFiles.push(path.join(projectPath, meta.source_files.lesson_file));
    }

    const generatedAt = new Date(meta.generated_at);

    for (const filePath of sourceFiles) {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        const modifiedAt = new Date(stat.mtime);

        if (modifiedAt > generatedAt) {
          return {
            needsUpdate: true,
            reason: `源文件 ${path.basename(filePath)} 已更新`
          };
        }
      }
    }

    // 检查学习状态是否变化
    const statePath = path.join(projectPath, '.learning', 'learning-state.json');
    if (fs.existsSync(statePath)) {
      const stateContent = fs.readFileSync(statePath, 'utf8');
      const state = JSON.parse(stateContent);

      const lessonProgress = state.syllabus_progress?.[lessonId];
      if (lessonProgress) {
        // 检查 TODO 完成状态变化
        if (meta.lesson_progress) {
          const metaTodosCompleted = meta.lesson_progress.todos_completed || 0;
          const currentTodosCompleted = lessonProgress.todos_completed || 0;

          if (currentTodosCompleted !== metaTodosCompleted) {
            return {
              needsUpdate: true,
              reason: `TODO 完成数已变化 (${metaTodosCompleted} -> ${currentTodosCompleted)`
            };
          }

          // 检查状态变化
          const metaStatus = meta.lesson_progress.status;
          const currentStatus = lessonProgress.status;

          if (currentStatus !== metaStatus) {
            return {
              needsUpdate: true,
              reason: `课程状态已变化 (${metaStatus} -> ${currentStatus})`
            };
          }
        }
      }
    }

    return { needsUpdate: false, reason: 'Context 已是最新' };

  } catch (err) {
    return { needsUpdate: true, reason: `无法读取元数据: ${err.message}` };
  }
}

/**
 * 渲染 Markdown 总结
 * @param {object} data - 源数据
 * @returns {string} Markdown 内容
 */
function renderMarkdown(data) {
  const { syllabus, lessonMeta, lesson, learningState, memoryStore, lessonId } = data;

  if (!syllabus) {
    return '# Context 生成失败\n\n无法加载 syllabus.yaml';
  }

  let markdown = '';

  // 标题
  markdown += `# Context: ${lessonMeta?.title || lessonId}\n\n`;

  // 课程信息
  markdown += `## 课程信息\n\n`;
  if (lessonMeta) {
    markdown += `- **课程 ID**: ${lessonMeta.id}\n`;
    markdown += `- **标题**: ${lessonMeta.title}\n`;
    if (lessonMeta.subtitle) {
      markdown += `- **副标题**: ${lessonMeta.subtitle}\n`;
    }
    markdown += `- **预计时长**: ${lessonMeta.estimated_hours || '-'} 小时\n`;
    markdown += `- **TODO 数**: ${lessonMeta.todos_count || '-'}\n`;
    if (lessonMeta.prerequisites && lessonMeta.prerequisites.length > 0) {
      markdown += `- **前置课程**: ${lessonMeta.prerequisites.join(', ')}\n`;
    }
  }
  markdown += '\n';

  // 项目信息
  markdown += `## 项目信息\n\n`;
  if (syllabus.meta) {
    markdown += `- **学习领域**: ${syllabus.meta.domain_cn || syllabus.meta.domain}\n`;
    markdown += `- **总课程数**: ${syllabus.meta.total_lessons || '-'}\n`;
    markdown += `- **预计总时长**: ${syllabus.meta.total_lessons || '-'} 小时\n`;
  }
  markdown += '\n';

  // 学习进度
  markdown += `## 学习进度\n\n`;
  if (learningState) {
    const progress = learningState.syllabus_progress?.[lessonId];
    if (progress) {
      markdown += `- **状态**: ${getStatusDisplay(progress.status)}\n`;
      markdown += `- **TODO 完成**: ${progress.todos_completed || 0}/${progress.todos_total || 0}\n`;
      if (progress.study_time_minutes) {
        markdown += `- **学习时长**: ${formatStudyTime(progress.study_time_minutes)}\n`;
      }
      if (progress.mastery_score) {
        markdown += `- **掌握度**: ${(progress.mastery_score * 100).toFixed(0)}%\n`;
      }
    } else {
      markdown += `- **状态**: 未开始\n`;
    }

    markdown += `- **整体状态**: ${getStatusDisplay(learningState.learning_state?.global_status)}\n`;
    markdown += `- **当前课程**: ${learningState.learning_state?.current_lesson || '-'}\n`;
    markdown += `- **总学习时长**: ${formatStudyTime(learningState.learning_state?.total_study_time_minutes || 0)}\n`;
  }
  markdown += '\n';

  // 核心知识点
  markdown += `## 核心知识点\n\n`;
  if (lessonMeta?.core_points && lessonMeta.core_points.length > 0) {
    markdown += '### 本课核心点\n\n';
    for (const point of lessonMeta.core_points) {
      markdown += `- ${point}\n`;
    }
    markdown += '\n';
  }

  // 已掌握的知识点
  if (learningState) {
    const progress = learningState.syllabus_progress?.[lessonId];
    if (progress?.core_points_mastered && progress.core_points_mastered.length > 0) {
      markdown += '### 已掌握\n\n';
      for (const point of progress.core_points_mastered) {
        markdown += `- [x] ${point}\n`;
      }
      markdown += '\n';
    }
    if (progress?.weak_points && progress.weak_points.length > 0) {
      markdown += '### 薄弱点\n\n';
      for (const point of progress.weak_points) {
        markdown += `- [ ] ${point}\n`;
      }
      markdown += '\n';
    }
  }

  // 心智模型
  if (memoryStore?.core_models && memoryStore.core_models.length > 0) {
    const lessonModels = memoryStore.core_models.filter(m => m.lesson_id === lessonId);
    if (lessonModels.length > 0) {
      markdown += `## 心智模型\n\n`;
      for (const model of lessonModels) {
        markdown += `### ${model.id}\n\n`;
        markdown += `${model.model}\n\n`;
        markdown += `- **置信度**: ${(model.confidence * 100).toFixed(0)}%\n`;
        markdown += `- **建立时间**: ${formatTime(model.created_at)}\n`;
        markdown += '\n';
      }
    }
  }

  // 脆弱点日志
  if (memoryStore?.vulnerability_log && memoryStore.vulnerability_log.length > 0) {
    const lessonVulns = memoryStore.vulnerability_log.filter(v => v.lesson_id === lessonId);
    if (lessonVulns.length > 0) {
      markdown += `## 脆弱点日志\n\n`;
      markdown += '| ID | 类型 | 详情 | 状态 |\n';
      markdown += '|---|---|---|---|\n';
      for (const vuln of lessonVulns) {
        markdown += `| ${vuln.id} | ${vuln.type} | ${vuln.detail} | ${vuln.status} |\n`;
      }
      markdown += '\n';
    }
  }

  // 前置课程关系
  if (lessonMeta?.prerequisites && lessonMeta.prerequisites.length > 0) {
    markdown += `## 前置课程依赖\n\n`;
    for (const prereq of lessonMeta.prerequisites) {
      const prereqInfo = syllabus.syllabus?.find(l => l.id === prereq);
      const prereqProgress = learningState?.syllabus_progress?.[prereq];
      markdown += `- **${prereq}**: ${prereqInfo?.title || prereq}`;
      if (prereqProgress) {
        markdown += ` (${getStatusDisplay(prereqProgress.status)})`;
      }
      markdown += '\n';
    }
    markdown += '\n';
  }

  // 课程大纲进度概览
  markdown += `## 课程大纲概览\n\n`;
  if (syllabus.syllabus) {
    markdown += '| ID | 标题 | 状态 | TODO |\n';
    markdown += '|---|---|---|---|\n';
    for (const lesson of syllabus.syllabus) {
      const progress = learningState?.syllabus_progress?.[lesson.id];
      const status = progress?.status || 'locked';
      const todos = progress
        ? `${progress.todos_completed || 0}/${progress.todos_total || 0}`
        : '-';
      markdown += `| ${lesson.id} | ${lesson.title} | ${getStatusDisplay(status)} | ${todos} |\n`;
    }
    markdown += '\n';
  }

  // 学习资源（如果有课程文件）
  if (lesson) {
    markdown += `## 课程内容摘要\n\n`;
    // 提取 TODO 清单
    const todoSection = extractTodoSection(lesson);
    if (todoSection) {
      markdown += '### TODO 清单\n\n';
      markdown += todoSection;
      markdown += '\n';
    }
  }

  return markdown;
}

/**
 * 提取课程文件中的 TODO 部分
 * @param {string} lessonContent - 课程内容
 * @returns {string} TODO 部分
 */
function extractTodoSection(lessonContent) {
  const lines = lessonContent.split('\n');
  let todoSection = '';
  let inTodoSection = false;

  for (const line of lines) {
    if (line.match(/^##\s*TODO\s*清单/i) || line.match(/^###\s*TODO-/i)) {
      inTodoSection = true;
    }

    if (inTodoSection) {
      // 遇到下一个主要章节时停止
      if (line.match(/^##\s*(?!TODO)/i) && !line.match(/^###\s*TODO-/i)) {
        break;
      }
      todoSection += line + '\n';
    }
  }

  return todoSection.trim();
}

/**
 * 获取状态显示文本
 * @param {string} status - 状态
 * @returns {string} 状态显示
 */
function getStatusDisplay(status) {
  const displays = {
    'locked': '锁定',
    'unlocked': '已解锁',
    'in_progress': '进行中',
    'suspended': '暂停',
    'completed': '已完成',
    'review_needed': '需复习',
    'challenged': '对抗测试',
    'active': '活跃',
    'paused': '暂停',
    'new': '未开始'
  };
  return displays[status] || status;
}

/**
 * 格式化学习时间
 * @param {number} minutes - 分钟数
 * @returns {string} 格式化后的时间
 */
function formatStudyTime(minutes) {
  if (!minutes || minutes === 0) return '0分钟';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  }
  return `${mins}分钟`;
}

/**
 * 渲染 Mermaid 图表
 * @param {object} data - 源数据
 * @returns {string} Mermaid 内容
 */
function renderMermaid(data) {
  const { syllabus, lessonMeta, learningState, lessonId } = data;

  if (!syllabus || !syllabus.syllabus) {
    return '```mermaid\ngraph TD\n    A[无法生成图表]\n```';
  }

  let mermaid = '';

  // 生成课程依赖图
  mermaid += '```mermaid\n';
  mermaid += 'graph TD\n';

  // 定义节点样式
  mermaid += '    %% 节点样式定义\n';
  mermaid += '    classDef locked fill:#f9f9f9,stroke:#999,stroke-width:1px\n';
  mermaid += '    classDef unlocked fill:#e8f5e9,stroke:#4caf50,stroke-width:2px\n';
  mermaid += '    classDef in_progress fill:#fff3e0,stroke:#ff9800,stroke-width:2px\n';
  mermaid += '    classDef completed fill:#e3f2fd,stroke:#2196f3,stroke-width:2px\n';
  mermaid += '    classDef current fill:#fce4ec,stroke:#e91e63,stroke-width:3px\n';
  mermaid += '\n';

  // 添加课程节点
  for (const lesson of syllabus.syllabus) {
    const progress = learningState?.syllabus_progress?.[lesson.id];
    const status = progress?.status || 'locked';
    const isCurrent = lesson.id === lessonId;

    const nodeId = lesson.id.replace(/L(\d+)/, 'L$1');
    const label = lesson.title.replace(/"/g, "'");

    mermaid += `    ${nodeId}["${label}"]`;

    // 添加样式类
    if (isCurrent) {
      mermaid += ':::current';
    } else {
      switch (status) {
        case 'completed':
          mermaid += ':::completed';
          break;
        case 'in_progress':
          mermaid += ':::in_progress';
          break;
        case 'unlocked':
          mermaid += ':::unlocked';
          break;
        default:
          mermaid += ':::locked';
      }
    }
    mermaid += '\n';
  }
  mermaid += '\n';

  // 添加依赖关系
  for (const lesson of syllabus.syllabus) {
    if (lesson.prerequisites && lesson.prerequisites.length > 0) {
      const nodeId = lesson.id.replace(/L(\d+)/, 'L$1');
      for (const prereq of lesson.prerequisites) {
        const prereqId = prereq.replace(/L(\d+)/, 'L$1');
        mermaid += `    ${prereqId} --> ${nodeId}\n`;
      }
    }
  }
  mermaid += '```\n\n';

  // 生成进度状态图（如果当前课程有进度）
  if (learningState?.syllabus_progress?.[lessonId]) {
    const progress = learningState.syllabus_progress[lessonId];
    const todosTotal = progress.todos_total || 0;
    const todosCompleted = progress.todos_completed || 0;

    mermaid += '```mermaid\n';
    mermaid += 'pie title 课程进度\n';
    if (todosTotal > 0) {
      const completedPercent = Math.round((todosCompleted / todosTotal) * 100);
      const remainingPercent = 100 - completedPercent;
      mermaid += `    "已完成 (${todosCompleted})": ${completedPercent}\n`;
      mermaid += `    "待完成 (${todosTotal - todosCompleted})": ${remainingPercent}\n`;
    } else {
      mermaid += '    "未开始": 100\n';
    }
    mermaid += '```\n\n';
  }

  // 生成心智模型置信度图（如果有）
  if (data.memoryStore?.core_models) {
    const lessonModels = data.memoryStore.core_models.filter(m => m.lesson_id === lessonId);
    if (lessonModels.length > 0) {
      mermaid += '```mermaid\n';
      mermaid += 'pie title 心智模型置信度分布\n';
      for (const model of lessonModels) {
        const confidencePercent = Math.round(model.confidence * 100);
        mermaid += `    "${model.id.substring(0, 20)}...": ${confidencePercent}\n`;
      }
      mermaid += '```\n\n';
    }
  }

  return mermaid;
}

/**
 * 生成 context-meta.yaml 元数据
 * @param {object} data - 源数据
 * @param {string} projectPath - 项目路径
 * @param {string} lessonId - 课程 ID
 * @returns {object} 元数据对象
 */
function generateMeta(data, projectPath, lessonId) {
  const meta = {
    version: '1.0.0',
    lesson_id: lessonId,
    generated_at: new Date().toISOString(),
    source_files: {
      syllabus: 'syllabus.yaml',
      learning_state: '.learning/learning-state.json',
      memory_store: '.learning/memory-store.json'
    },
    lesson_progress: null,
    context_files: []
  };

  // 添加课程文件信息
  if (data.lessonMeta?.file) {
    meta.source_files.lesson_file = data.lessonMeta.file;
  }

  // 记录课程进度快照
  if (data.learningState?.syllabus_progress?.[lessonId]) {
    meta.lesson_progress = {
      status: data.learningState.syllabus_progress[lessonId].status,
      todos_completed: data.learningState.syllabus_progress[lessonId].todos_completed || 0,
      todos_total: data.learningState.syllabus_progress[lessonId].todos_total || 0,
      study_time_minutes: data.learningState.syllabus_progress[lessonId].study_time_minutes || 0,
      mastery_score: data.learningState.syllabus_progress[lessonId].mastery_score || null
    };
  }

  // 记录生成的文件
  meta.context_files = ['summary.md', 'diagrams.md'];

  return meta;
}

/**
 * 生成 Context
 * @param {string} lessonId - 课程 ID
 * @param {object} options - 选项 { force: boolean, type: string }
 * @param {string} baseDir - 基础目录
 * @returns {object} 生成结果
 */
function generateContext(lessonId, options = {}, baseDir = process.cwd()) {
  const force = options.force || false;
  const type = options.type || 'all'; // 'md', 'mermaid', 'all'

  console.log('\n📝 Context 生成\n');

  // 检查注册表
  if (!registry.registryExists(baseDir)) {
    console.log('当前目录没有注册的学习项目。\n');
    console.log('使用 "plc init" 创建新项目。\n');
    return { success: false, error: '没有注册的学习项目' };
  }

  // 获取当前项目
  const project = registry.getActiveProject(baseDir);
  if (!project) {
    console.log('没有设置活跃项目。\n');
    console.log('使用 "plc list" 查看所有项目。\n');
    return { success: false, error: '没有活跃项目' };
  }

  // 如果没有指定课程，使用当前课程
  if (!lessonId) {
    lessonId = project.status?.current_lesson || 'L0';
  }

  console.log(`项目: ${project.display_name}`);
  console.log(`课程: ${lessonId}\n`);

  // 检查是否需要更新
  if (!force) {
    const checkResult = checkNeedsUpdate(project.path, lessonId);
    if (!checkResult.needsUpdate) {
      console.log(`Context 已是最新，无需重新生成。\n`);
      console.log(`使用 --force 强制重新生成。\n`);
      return {
        success: true,
        skipped: true,
        reason: checkResult.reason,
        contextDir: getLessonContextDir(project.path, lessonId)
      };
    }
    console.log(`检测到更新: ${checkResult.reason}\n`);
  }

  // 加载源数据
  console.log('加载源数据...');
  const data = loadSourceData(project.path, lessonId);

  if (!data.syllabus) {
    console.log('无法加载 syllabus.yaml。\n');
    return { success: false, error: '无法加载 syllabus.yaml' };
  }

  // 找到课程元信息
  const lessonMeta = data.syllabus.syllabus?.find(l => l.id === lessonId);
  if (!lessonMeta) {
    console.log(`课程 "${lessonId}" 不存在于大纲中。\n`);
    return { success: false, error: `课程 ${lessonId} 不存在` };
  }

  data.lessonMeta = lessonMeta;

  // 创建 context 目录
  const contextDir = getLessonContextDir(project.path, lessonId);
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  console.log('生成 Context 文件...');

  // 生成 Markdown
  if (type === 'md' || type === 'all') {
    const markdown = renderMarkdown(data);
    const mdPath = path.join(contextDir, 'summary.md');
    fs.writeFileSync(mdPath, markdown, 'utf8');
    console.log(`  - summary.md (${markdown.length} 字符)`);
  }

  // 生成 Mermaid
  if (type === 'mermaid' || type === 'all') {
    const mermaid = renderMermaid(data);
    const mermaidPath = path.join(contextDir, 'diagrams.md');
    fs.writeFileSync(mermaidPath, mermaid, 'utf8');
    console.log(`  - diagrams.md (${mermaid.length} 字符)`);
  }

  // 生成元数据
  const meta = generateMeta(data, project.path, lessonId);
  const metaPath = path.join(contextDir, 'context-meta.yaml');
  const metaYaml = yaml.dump(meta, { indent: 2, lineWidth: -1 });
  fs.writeFileSync(metaPath, metaYaml, 'utf8');
  console.log(`  - context-meta.yaml\n`);

  console.log(`Context 已生成到: ${contextDir}\n`);
  console.log('下一步:');
  console.log('  - 查看生成的文件了解课程状态');
  console.log('  - 对 AI 说 "继续学习" 开始学习\n');

  return {
    success: true,
    contextDir,
    files: meta.context_files,
    lessonProgress: meta.lesson_progress
  };
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
📝 plc context - 为课程生成 Context

用法:
  plc context              为当前课程生成 Context
  plc context L0           为指定课程生成 Context
  plc context --force      强制重新生成（忽略增量检测）
  plc context --check      检查是否需要更新
  plc context --type md    只生成 Markdown
  plc context --type mermaid  只生成 Mermaid

选项:
  --force, -f     强制重新生成，忽略增量检测
  --check, -c     仅检查是否需要更新，不生成
  --type          指定生成类型: md, mermaid, all（默认 all）
  --help, -h      显示帮助信息

输出:
  context/{lessonId}/summary.md       课程状态 Markdown 总结
  context/{lessonId}/diagrams.md      Mermaid 图表
  context/{lessonId}/context-meta.yaml 生成元数据

示例:
  plc context              # 为当前课程生成完整 Context
  plc context L1           # 为 L1 课程生成 Context
  plc context --check      # 检查当前课程是否需要更新
  plc context --force      # 强制重新生成
`);
}

/**
 * 主函数
 * @param {string} lessonId - 课程 ID
 * @param {object} options - 命令选项
 */
function main(lessonId, options = {}) {
  // 解析选项
  const force = options.force || options.f || false;
  const checkOnly = options.check || options.c || false;
  const type = options.type || 'all';

  if (options.help || options.h) {
    showHelp();
    return;
  }

  if (checkOnly) {
    // 仅检查是否需要更新
    console.log('\n🔍 Context 更新检查\n');

    if (!registry.registryExists(process.cwd())) {
      console.log('当前目录没有注册的学习项目。\n');
      return;
    }

    const project = registry.getActiveProject(process.cwd());
    if (!project) {
      console.log('没有设置活跃项目。\n');
      return;
    }

    const targetLesson = lessonId || project.status?.current_lesson || 'L0';
    const checkResult = checkNeedsUpdate(project.path, targetLesson);

    console.log(`项目: ${project.display_name}`);
    console.log(`课程: ${targetLesson}`);
    console.log(`状态: ${checkResult.needsUpdate ? '需要更新' : '无需更新'}`);
    console.log(`原因: ${checkResult.reason}\n`);

    return {
      lessonId: targetLesson,
      needsUpdate: checkResult.needsUpdate,
      reason: checkResult.reason
    };
  }

  // 生成 Context
  return generateContext(lessonId, { force, type }, process.cwd());
}

// 导出模块
module.exports = {
  main,
  showHelp,
  generateContext,
  checkNeedsUpdate,
  loadSourceData,
  renderMarkdown,
  renderMermaid,
  generateMeta
};

// 如果直接运行
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  let lessonId = null;

  for (const arg of args) {
    if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--check' || arg === '-c') {
      options.check = true;
    } else if (arg.startsWith('--type=')) {
      options.type = arg.split('=')[1];
    } else if (arg === '--type') {
      // 下一个参数是类型
      const nextArg = args[args.indexOf(arg) + 1];
      if (nextArg && ['md', 'mermaid', 'all'].includes(nextArg)) {
        options.type = nextArg;
      }
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (!arg.startsWith('-')) {
      lessonId = arg;
    }
  }

  main(lessonId, options);
}