#!/usr/bin/env node

/**
 * Progressive Learning Coach - CLI 命令入口
 *
 * 用法:
 *   plc <command> [options]
 *
 * 命令:
 *   init [name]     创建新学习项目
 *   list [-v]       列出所有项目
 *   switch <name>   切换项目
 *   status [name]   显示项目状态
 *   current         显示当前项目名称
 *   resume          继续当前项目学习
 *   register <path> 注册外部项目
 */

const path = require('path');

// 命令模块映射
const commands = {
  'init': () => require('./init'),
  'list': () => require('./commands/list'),
  'switch': () => require('./commands/switch'),
  'status': () => require('./commands/status'),
  'current': () => require('./commands/current'),
  'resume': () => require('./commands/resume'),
  'register': () => require('./commands/register'),
  'context': () => require('./commands/context')
};

// 显示帮助信息
function showHelp() {
  console.log(`
🎓 Progressive Learning Coach - CLI

用法:
  plc <command> [options]

命令:
  init [name]        创建新学习项目（智能引导）
  list [-v]          列出当前目录下所有学习项目
  switch <name>      切换项目（上下文隔离，保留进度）
  status [name]      显示项目详细状态
  current            显示当前活跃项目名称
  resume             继续当前项目学习
  register <path>    注册外部项目
  context [lesson]   为课程生成 Context（状态总结与图表）

选项:
  -v, --verbose      详细模式
  -h, --help         显示帮助信息

示例:
  plc init agent-learning      # 创建新项目
  plc list                     # 列出所有项目
  plc list -v                  # 详细列出项目
  plc switch python-basics     # 切换到 python-basics
  plc status                   # 显示当前项目状态
  plc status agent-learning    # 显示指定项目状态
  plc context                  # 为当前课程生成 Context
  plc context L0               # 为 L0 课程生成 Context
  plc context --check          # 检查是否需要更新

更多信息:
  https://github.com/your-org/progressive-learning-coach
`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  // 无参数或帮助
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const commandName = args[0];
  const commandArgs = args.slice(1);

  // 检查命令是否存在
  if (!commands[commandName]) {
    console.log(`未知命令: ${commandName}`);
    console.log('');
    showHelp();
    process.exit(1);
  }

  // 加载并执行命令
  try {
    const commandModule = commands[commandName]();

    // 解析选项
    const options = {};
    const positionalArgs = [];

    for (const arg of commandArgs) {
      if (arg.startsWith('-')) {
        if (arg === '-v' || arg === '--verbose') {
          options.verbose = true;
        } else if (arg === '-h' || arg === '--help') {
          // 显示命令帮助（如果有）
          if (commandModule.showHelp) {
            commandModule.showHelp();
          } else {
            showHelp();
          }
          process.exit(0);
        }
      } else {
        positionalArgs.push(arg);
      }
    }

    // 执行命令
    if (commandModule.main.length > 1) {
      // 带选项的命令
      commandModule.main(positionalArgs[0], options);
    } else if (commandModule.main.length === 1) {
      // 带参数的命令
      commandModule.main(positionalArgs[0] || null);
    } else {
      // 无参数的命令
      commandModule.main();
    }

  } catch (err) {
    console.error(`执行命令失败: ${err.message}`);
    process.exit(1);
  }
}

// 导出
module.exports = { main, showHelp };

// 如果直接运行
if (require.main === module) {
  main();
}