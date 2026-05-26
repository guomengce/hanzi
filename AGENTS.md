# AGENTS.md - 小学语文写字教学工具

## 1. 项目概览

**项目名称**: 小学语文写字教学工具  
**项目类型**: 纯前端单页应用 (SPA)  
**核心功能**: 为小学语文教师提供标准笔顺动画生成，支持 GIF/MP4 导出

## 2. 技术栈

- **构建工具**: Vite 5.4
- **核心依赖**: 
  - `hanzi-writer` - 汉字笔顺数据与动画渲染
  - `gif.js` - GIF 编码导出
- **语言**: 原生 JavaScript (ES Module)
- **样式**: 纯 CSS (无预处理器)

## 3. 项目结构

```
/workspace/projects/
├── index.html              # 入口 HTML
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── .coze                   # 部署配置
├── SPEC.md                 # 详细需求文档
├── public/
│   └── favicon.svg         # 网站图标
└── src/
    ├── main.js             # 主逻辑入口
    ├── styles/
    │   └── main.css        # 主样式文件
    └── utils/
        ├── validation.js   # 输入校验模块
        ├── audio.js        # 音频控制模块
        ├── hanzi.js        # HanziWriter 封装
        └── export.js       # 导出功能模块
```

## 4. 构建和运行命令

```bash
# 开发环境
pnpm dev

# 生产构建
pnpm build

# 预览构建产物
pnpm preview
```

## 5. 功能模块说明

### 5.1 输入校验 (validation.js)
- `isValidChineseChar()`: 判断是否为有效汉字
- `validateInput()`: 验证用户输入并返回错误信息
- 支持基本汉字范围 (4E00-9FFF) 和扩展A (3400-4DBF)

### 5.2 音频控制 (audio.js)
- `AudioController`: 音频控制类
- 支持 Web Speech API 朗读汉字和笔画名称
- 支持音频开关独立控制

### 5.3 笔顺动画 (hanzi.js)
- `HanziAnimator`: 笔顺动画类
- 支持田字格、米字格、无格子三种模式
- 支持笔顺动画播放与回调

### 5.4 导出功能 (export.js)
- `ExportController`: 导出控制类
- 支持 GIF 和 WebM 格式导出
- 支持自定义画质和尺寸

## 6. 页面布局

```
┌─────────────────────────────────────────┐
│  Header: 标题 + 副标题                     │
├─────────────────────────────────────────┤
│  Control Panel                          │
│  - 汉字输入框 + 生成/重置按钮              │
│  - 画布模式切换 (田/米/无格子)            │
│  - 音频开关 (拼音/笔画)                   │
├─────────────────────────────────────────┤
│  Preview Area                            │
│  - Canvas 动画预览区域                     │
│  - 笔画信息显示                          │
├─────────────────────────────────────────┤
│  Export Panel                            │
│  - 画质/尺寸选择                          │
│  - GIF/MP4 下载按钮                       │
└─────────────────────────────────────────┘
```

## 7. 常用命令速查

| 操作 | 命令 |
|------|------|
| 启动开发服务器 | `pnpm dev` |
| 构建生产版本 | `pnpm build` |
| 预览构建结果 | `pnpm preview` |

## 8. 注意事项

### 8.1 浏览器兼容性
- 目标浏览器: Chrome 80+, Firefox 75+, Edge 80+, Safari 13+
- 依赖 Web Audio API 和 Web Speech API
- GIF 导出依赖 Web Worker

### 8.2 离线使用
- 纯前端项目，无后端依赖
- HanziWriter 笔顺数据在首次加载时缓存
- 完全支持离线使用

### 8.3 导出限制
- GIF 导出使用 gif.js，可能需要较长时间
- MP4 导出使用 MediaRecorder，生成 WebM 格式
