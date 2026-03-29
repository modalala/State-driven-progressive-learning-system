#!/usr/bin/env node

/**
 * PLC resume 命令 - 继续当前项目学习
 */

const registry = require('../registry');
const context = require('../context');

function main() {
  const baseDir = process.cwd();

  console.log('\n▶️ 继续学习\n');

  if (!registry.registryExists(baseDir)) {
    console.log('当前目录没有注册的学习项目。\n');
    console.log('使用 "plc init" 创建新项目。\n');
    return;
  }

  const activeProject = registry.getActiveProject(baseDir);

  if (!activeProject) {
    console.log('没有设置活跃项目。\n');
    console.log('使用 "plc list" 查看所有项目。\n');
    console.log('使用 "plc switch <项目名>" 切换项目。\n');
    return;
  }

  // 更新上下文会话时间
  context.updateSessionStart(baseDir);

  // 同步状态
  registry.syncProjectStatus(activeProject.name, baseDir);
  const project = registry.getProject(activeProject.name, baseDir);

  console.log(`当前项目: ${project.display_name}`);
  console.log(`当前课程: ${project.status?.current_lesson || 'L0'}`);
  console.log(`进度: ${project.status?.progress_percentage || 0}%`);
  console.log('');

  console.log('下一步: 对 AI 说 "继续学习"\n');

  // 输出项目路径供外部使用
  console.log(`项目路径: ${project.path}`);
}

module.exports = { main };

if (require.main === module) {
  main();
}