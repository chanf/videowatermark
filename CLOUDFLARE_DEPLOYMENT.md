# Cloudflare Pages 部署指南

## 项目信息

这是一个基于 Vite + React + TypeScript 的单页应用（SPA），专为视频水印去除功能设计。

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 部署到 Cloudflare Pages

### 方法一：通过 Git 集成（推荐）

1. 将代码推送到 GitHub 仓库
2. 在 Cloudflare Dashboard 中：
   - 进入 Pages → 创建项目
   - 连接 Git 仓库
   - 选择 `chanf/videowatermark` 仓库
   - 配置构建设置：
     - **框架预设**: Vite
     - **构建命令**: `npm run build`
     - **构建输出目录**: `dist`
     - **根目录**: `/`
     - **环境变量**: (无需)

3. 点击"保存并部署"

### 方法二：通过 Wrangler CLI

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy dist --project-name=videowatermark
```

### 方法三：直接上传

1. 运行 `npm run build` 构建
2. 在 Cloudflare Pages 控制台点击"上传资产"
3. 上传 `dist` 文件夹中的所有内容

## 配置文件说明

- `public/_redirects`: SPA 路由重定向配置
- `public/_headers`: HTTP 响应头配置
- `wrangler.toml`: Cloudflare Workers/Pages 配置（可选）

## 环境要求

- Node.js >= 18
- npm >= 9
- 现代浏览器支持 Canvas API 和 MediaRecorder API

## 技术栈

- React 19
- TypeScript 5.9
- Vite 7
- Tailwind CSS 3.4
- Cloudflare Pages 自动部署 CI/CD

## 注意事项

1. **SPA 路由**: 所有路由都返回 `index.html`，由前端路由处理
2. **缓存策略**: 根路径设置了不缓存，确保更新立即生效
3. **构建产物**: 输出目录为 `dist/`，包含所有静态资源
4. **浏览器兼容**: 需要支持 Canvas 和 MediaRecorder API

## 常见问题

### 部署后页面空白
- 检查 `_redirects` 文件是否在 `public/` 目录
- 确认构建输出目录配置为 `dist`

### 路由刷新 404
- 这是 SPA 的正常行为，`_redirects` 配置会处理
- 确保在 Cloudflare Pages 设置中启用了 `_redirects` 文件

### 构建失败
- 确保在 Cloudflare Pages 设置中 Node.js 版本 >= 18
- 检查 package.json 中的 build 脚本是否正确

## 更新部署

每次推送到 main 分支会自动触发重新部署：
```bash
git add .
git commit -m "update: description"
git push github main
```
