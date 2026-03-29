#!/usr/bin/env node

/**
 * PLC switch 命令 - 切换项目（上下文隔离）
 *
 * 用法: plc switch <项目名>
 *
 * 重要原则：
 * - 不清除项目的 learning-state.json 和 memory-store.json
 * - 只清除 agent 运行时上下文
 * - 切换后重新加载新项目的资源
 */

const readline = require('readline');
const registry = require('../registry');
const context = require('../context');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 格式化时间显示
 */
function formatTime(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

/**
 * 询问用户
 */
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * 主函数
 */
async function main(targetProjectName) {
  const baseDir = process.cwd();

  console.log('\n🔄 切换项目\n');

  // 检查注册表
  if (!registry.registryExists(baseDir)) {
    console.log('当前目录没有注册的学习项目。\n');
    console.log('使用 "plc init" 创建新项目。\n');
    rl.close();
    return;
  }

  // 获取当前活跃项目
  const currentProject = registry.getActiveProject(baseDir);

  // 如果没有指定目标项目，显示选择菜单
  if (!targetProjectName) {
    const projects = registry.listProjects(baseDir);

    if (projects.length === 0) {
      console.log('没有学习项目。\n');
      rl.close();
      return;
    }

    console.log('可用项目:\n');
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const isCurrent = p.name === currentProject?.name;
      const marker = isCurrent ? '(当前)' : '';
      console.log(`  ${i + 1}. ${p.display_name} - 进度 ${p.status?.progress_percentage || 0}% ${marker}`);
    }
    console.log('');

    const choice = await ask('请选择项目编号: ');
    const index = parseInt(choice, 10) - 1;

    if (index < 0 || index >= projects.length) {
      console.log('无效选择。\n');
      rl.close();
      return;
    }

    targetProjectName = projects[index].name;
  }

  // 获取目标项目信息
  const targetProject = registry.getProject(targetProjectName, baseDir);

  if (!targetProject) {
    console.log(`项目 "${targetProjectName}" 不存在。\n`);
    const projects = registry.listProjects(baseDir);
    console.log('可用项目:');
    for (const p of projects) {
      console.log(`  - ${p.name}`);
    }
    console.log('');
    rl.close();
    return;
  }

  // 检查是否是当前项目
  if (targetProjectName === currentProject?.name) {
    console.log(`"${targetProject.display_name}" 已经是当前活跃项目。\n`);
    rl.close();
    return;
  }

  // 显示切换信息
  console.log('切换信息:');
  console.log(`  当前项目: ${currentProject?.display_name || '无'} (${currentProject?.status?.progress_percentage || 0}% 进度)`);
  console.log(`  目标项目: ${targetProject.display_name} (${targetProject.status?.progress_percentage || 0}% 进度)`);
  console.log('');

  console.log('切换后：');
  if (currentProject) {
    console.log(`  ✓ ${currentProject.display_name} 的学习进度和记忆已保存`);
    console.log(`  ✓ 不会清除 ${currentProject.name}/.learning/ 目录下的任何数据`);
  }
  console.log(`  ✓ 将重新加载 ${targetProject.display_name} 的资源和课程内容`);
  console.log('');

  // 确认切换
  const confirm = await ask('确认切换? [y/N]: ');

  if (confirm !== 'y' && confirm !== 'yes') {
    console.log('已取消切换。\n');
    rl.close();
    return;
  }

  // 执行切换
  try {
    const result = context.switchContext(targetProjectName, baseDir);

    // 更新注册表的活跃项目
    registry.setActiveProject(targetProjectName, baseDir);

    console.log('\n✅ 已切换到项目: ' + targetProject.display_name);
    console.log('📂 项目路径: ' + targetProject.path);
    console.log('📍 当前课程: ' + (targetProject.status?.current_lesson || 'L0'));
    console.log('');
    console.log('下一步:');
    console.log('  cd ' + targetProject.relative_path || targetProject.name);
    console.log('  对 AI 说 "继续学习"\n');

  } catch (err) {
    console.log(`切换失败: ${err.message}\n`);
  }

  rl.close();
}

// 导出
module.exports = { main };

// 如果直接运行
if (require.main === module) {
  const targetProjectName = process.argv[2];
  main(targetProjectName);
}