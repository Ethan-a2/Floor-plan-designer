# 户型设计器 · 改进说明书

> 从"一个能画墙的 HTML 单文件" 升级到 "有底图/组件/皮尺/地板/测试"的完整设计器。
> 本文档记录了这次会话的**所有改动、为什么这么改、怎么测试、怎么继续扩展**。

**文档目标**：让一个没碰过这个代码的人（甚至没写过多少前端的人），读完这一篇就能独立维护、扩展这个项目。

---

## 目录

1. [项目一页纸概览](#1-项目一页纸概览)
2. [本次会话改了什么（按功能）](#2-本次会话改了什么按功能)
3. [核心设计原理（新手必读）](#3-核心设计原理新手必读)
4. [详细改动清单（按文件）](#4-详细改动清单按文件)
5. [如何使用（用户视角）](#5-如何使用用户视角)
6. [如何开发扩展（开发者视角）](#6-如何开发扩展开发者视角)
7. [测试怎么跑、怎么写](#7-测试怎么跑怎么写)
8. [常见问题 FAQ](#8-常见问题-faq)
9. [未来路线图](#9-未来路线图)

---

## 1. 项目一页纸概览

### 是什么
一个 2D 建筑平面图设计器。**一个 HTML 文件，双击即用**，零依赖、无后端。

### 核心能力
- 画墙 / 门 / 窗 / 矩形房间 / L 型房间 / T 型房间
- 拖放 88 种家具到画布
- 导入**扫描图/PNG/SVG** 作为底图或组件
- 用 **皮尺** 测量任意两点距离（测量线可保留、编辑）
- 用 **矩形地板** 给不同房间填充颜色区分
- 多楼层管理
- 自动尺寸标注
- 导出 **JSON / SVG / DXF**（CAD 格式）
- **118 项自动化测试** 保证改动不破坏功能

### 文件结构

```
Floor-plan-designer/
├── floor_planner.html    ← 主程序 (~3000 行, 单文件)
├── README.md             ← 原始文档 (功能说明 + 使用指南)
├── CHANGES.md            ← 本文档 (本次改动说明)
│
├── svg/                  ← 内置 SVG 组件 (指南针、门类)
│   ├── compass.svg
│   ├── door-left.svg / door-right.svg
│   ├── door-double.svg / door-sliding.svg
│   └── preview.html      ← 可视化预览页
│
├── examples/             ← 示例户型
│   └── demo_layout.html
│
├── archive/              ← 历史版本
│
└── tests/                ← 自动化测试套件 (jsdom + Node)
    ├── README.md
    ├── run.sh            ← 一键运行
    ├── setup.js          ← 公共工具
    └── test_*.js         ← 5 个测试文件
```

### 技术栈速记

| 项 | 选择 | 为什么 |
|----|------|--------|
| 渲染 | SVG | 矢量清晰、可缩放、天然 DOM API |
| 交互 | 原生 JS + HTML `<script>` | 零构建，双击即用 |
| 数据 | `floors[i].objects[]` 纯 JSON | 直接序列化，undo/import/export 统一 |
| 坐标 | 1 user-unit = 10mm | 小数精度可控 |
| 测试 | Node + jsdom | 不需要真浏览器也能跑 |

---

## 2. 本次会话改了什么（按功能）

按**时间顺序**列出，每个功能一节，附上"为什么做"和"怎么做"。

### 2.1 底图导入（描图功能）

**问题**：没办法把扫描的户型图当底图描绘。

**方案**：
- 顶栏新增 `🖼 底图` 按钮，导入 PNG/JPG → 自动半透明置底
- `📐 标定` 按钮：点两个已知距离的端点，输入真实 mm 数，自动按比例缩放到真实尺寸
- 底图可以拖动、缩放、旋转、删除
- 每个楼层独立底图（1F 一张，2F 一张）

**演进**：
- v1：底图单独存在 `floor.bgImage`（特殊字段）
- v2（最终）：底图重构为**普通 object** `type='image'` 或 `type='svg'`，和墙/家具等同级

### 2.2 通用图像/SVG 组件上传

**问题**：除了底图，还想上传自己画的图标作为装饰（比如指北针）。

**方案**：
- 顶栏增加 `📎 图片` 和 `🎨 SVG` 两个按钮
- `📎 图片`：PNG/JPG → 按原尺寸插入画布中心（顶层）
- `🎨 SVG`：SVG 文件 → 同上，但类型标为 `svg`（矢量缩放不失真）
- `🖼 底图`：任意图片 → 插入时放数组开头（置底），透明度 50%

**三个按钮**都调用统一的 `_uploadImage()` 方法，参数 `placement` 控制置底还是置顶。

### 2.3 内置 SVG 组件库

**问题**：用户不一定有现成的 SVG，需要内置几个常用的。

**方案**：`svg/` 文件夹下手工生成 5 个文件：

| 文件 | 规格 | 说明 |
|------|------|------|
| `compass.svg` | 200×200 | 传统指南针（N/S/E/W，实心指北箭头）|
| `door-left.svg` | 120×120 | 左开门（铰链左、90° 虚线弧）|
| `door-right.svg` | 120×120 | 右开门（铰链右）|
| `door-double.svg` | 220×120 | 双开门（对称两扇 90° 弧）|
| `door-sliding.svg` | 220×60 | 滑动玻璃门（双轨 + 滑动箭头）|

`svg/preview.html` 可直接在浏览器打开，预览所有组件。

### 2.4 通用能力：可见 / 图层顺序

**问题**：对象多了后顺序乱，家具被新画的墙盖住，或者想临时藏起来看底图。

**方案**：**所有 object 类型**（墙/门/窗/家具/图像/...）统一支持两个通用字段：
- `visible: true/false` — 勾选即可隐藏，`hitTest` 和 `render` 都跳过
- 4 个图层操作：置底 / 置顶 / 上移一层 / 下移一层

属性面板所有对象底部都有统一的图层控制区。

> 注：此前临时做过 `locked` 字段，后用户反馈有问题（锁定后解不开），已完全移除。

### 2.5 数据迁移（bgImage → image）

**问题**：把底图从"特殊字段"改成"普通对象"后，老 JSON 文件怎么办？

**方案**：在 `importData` 里加 15 行迁移代码，自动把老数据的 `floors[i].bgImage` 转成 `objects[0]` 里的 `type='image'` 对象。用户完全无感知，老 JSON 打开即升级。

### 2.6 键盘方向键移动

**问题**：精确微调要一直打开属性面板改 X/Y 数字，太麻烦。

**方案**：
- `↑ ↓ ← →`：移动 1 格（= 100mm）
- `Shift + ↑ ↓ ← →`：移动 10 格（= 1000mm）
- 对所有 x/y（家具/图像）和 x1/y1/x2/y2（墙/测量）通用
- **连续按键合并成一次 undo**（350ms 防抖），避免按 20 次产生 20 条历史记录

### 2.7 Ctrl+C 复制

**问题**：Ctrl+D 复制不够直觉，大家习惯 Ctrl+C。

**方案**：Ctrl+C 等同于 Ctrl+D（调用 `duplicate()`），复制出来的对象偏移 200mm 放置。大写 C 也生效。

### 2.8 皮尺工具（可编辑的测量标注）

**问题**：画完户型后想量"沙发到电视多远"，没工具。

**方案演进**：
- v1：皮尺画在临时图层，不保存、不可编辑
- v2（最终）：测量线变成**普通对象** `type='measure'`，和墙一样

**能力**：
- `📏 皮尺` 工具：第一次点 = 起点，移动预览，第二次点 = 固化
- `Shift` 正交约束（只量水平/垂直）
- 测量线可选中、拖动、端点独立拖拽调整、删除、方向键微移
- 红色虚线 + 两端十字 + 中点标签（长度 / Δx / Δy / 角度）
- 属性面板专属"测量结果"显示块
- 底栏实时显示最新测量值 + "清除全部"按钮
- 进 JSON、进 undo、进导出 SVG

### 2.9 窗户厚度可调

**问题**：窗户宽度写死 100mm，不够灵活。

**方案**：给窗户加 `thickness` 字段（默认 10 user-unit = 100mm），属性面板新增"窗厚 (mm)"输入。内部白线自动为厚度的 40%（保持比例）。

顺便把墙厚输入从错误的"px"改正为 mm 单位。

### 2.10 矩形地板（填色分区）

**问题**：户型图全是线条，看不出"哪里是客厅哪里是卧室"。

**方案**：新增 `⎕ 地板` 工具 → `type='rect'` 对象：
- 拖出矩形，自动分配颜色（浅黄/蓝/绿/粉/紫/橙 6 色循环）
- 默认透明度 0.6
- **自动置底**（`unshift` 到 `objects[0]`），不会盖住墙/家具
- 属性面板：填充色 color picker、透明度滑条、名称（显示在矩形中心）
- 所有通用能力自动可用（选中/拖动/旋转/缩放/删除/Ctrl+C/...）

### 2.11 自动化测试套件

**问题**：每改一处功能都要手测一遍太烦，容易漏。

**方案**：建 `tests/` 目录，5 个测试文件覆盖 118 项断言：
- 每次改动跑一下 `bash tests/run.sh`，~4 秒全绿就放心
- 用 jsdom 模拟浏览器，无需真浏览器环境
- 详见 [第 7 节](#7-测试怎么跑怎么写)

---

## 3. 核心设计原理（新手必读）

读懂这一节，再看代码就不迷糊了。

### 3.1 一切都是 object（关键思想）

所有画布上的东西（墙/门/家具/图像/测量线/地板...），都是 JS 对象，塞在 **`floors[i].objects[]` 数组**里。

```js
{
  id: 42,           // 唯一 id（持久化用）
  type: 'wall',     // 类型：wall / door / window / furniture / image / svg / text / stairs / measure / rect
  visible: true,    // 是否显示
  // ...各类型自己的几何字段
}
```

**好处**：
- 存档：`JSON.stringify(floors)` → 文件，`JSON.parse` → 还原。
- 撤销：每次改动 push 一份 JSON 快照，undo = 切回上一份。
- 渲染：`objects.forEach(o => renderObj(o))`。
- 命中测试：`hitTest(p)` 从后往前找，第一个命中的就是点中的对象。

### 3.2 数组顺序 = 图层顺序

```
objects[0]  ← 最底层（最先画）
objects[1]
...
objects[n]  ← 最顶层（最后画，盖在所有前面的上面）
```

- 新对象默认 `push` 到末尾 → 顶层
- **底图/地板** 用 `unshift` → 底层
- 图层操作就是数组索引调整
  - 置底 = 搬到 `[0]`
  - 置顶 = 搬到 `[n]`
  - 上移一层 = 和 `[i+1]` 交换

### 3.3 坐标系

**1 user-unit = 10mm**（`MM_PER_UNIT = 10`），`GRID = 10 user-unit = 100mm`（吸附步长）。

- 屏幕/鼠标坐标（clientX/clientY）
  - ↓ `clientToWorld()` 转换
- 世界坐标（画布内部坐标，user-unit）
  - ↓ 显示给用户时 `× 10` 换算成 mm

`viewport = { x, y, zoom }` 表示画布平移和缩放，通过 SVG `<g transform=...>` 实现。

### 3.4 事件流

```
用户鼠标操作
   ↓
onMouseDown / onMouseMove / onMouseUp
   ↓ 根据 app.tool（当前工具）分支
   ├─ select: hitTest → 选中 / move / resize / move-end
   ├─ wall / door / window: 创建一个 drawing 临时对象，拖出 x2/y2
   ├─ rect: 拖出 w/h
   ├─ measure: 两次点击
   └─ ...
   ↓
修改 this.objects[] 数据
   ↓
this.render() 重绘 SVG
   ↓
this.pushHistory() 保存快照
```

### 3.5 渲染管线

`render()` 做的事：
1. `layer-objects` 清空
2. 遍历 `objects[]`，每个对象调 `renderObj(o)` 生成 SVG 节点
3. `layer-overlay` 清空
4. 画选中框、尺寸标注、测量预览等叠加层
5. 更新底栏（对象数、测量状态）

`renderObj(o)` 是个大 `if-else`，按 `o.type` 分支生成对应 SVG。

### 3.6 属性面板

`updatePropsPanel()` 根据 `this.selected` 拼 HTML：
- 未选中：快速上手 + 图像对象提示
- 选中：按 `o.type` 分支展示字段
  - 通用：可见复选框
  - 类型专属：墙 X1Y1X2Y2、家具 XYWH、图像透明度...
- 末尾统一：图层操作按钮、复制/删除按钮

字段用 `onchange="app.setProp('x', this.value)"` 直接写回对象，再 `render()`。

### 3.7 历史（undo/redo）

```js
pushHistory() {
  const snap = JSON.stringify({ floors, currentFloor, nextId });
  history.push(snap);
}
undo() {
  const prev = history[--historyIdx];
  restore(prev);
}
```

每次用户改动（拖完、松键、删除...）都 push 一次。连续微调（如方向键）做 350ms 防抖，避免历史爆炸。

---

## 4. 详细改动清单（按文件）

### 4.1 `floor_planner.html`

改动前：~2400 行，改动后：~3019 行（净增 ~600 行，主要是测量、矩形、三个上传入口的代码）。

**按段落标注主要变动**：

| 位置 | 原状 | 改后 |
|------|------|------|
| 顶栏 | 撤销 / 复制 / 导出 | 新增 `🖼 底图 / 📎 图片 / 🎨 SVG / 📐 标定` |
| 左侧工具栏 | 10 种工具 | 新增 `📏 皮尺 / ⎕ 地板` |
| app 字段 | `drawing, dragState` | 新增 `measuring`（皮尺预览状态）|
| `onKey` | Delete/R/Ctrl+Z | 新增方向键 + Ctrl+C |
| `onMouseDown` | select/wall/door... | 新增 rect / measure 分支 |
| `onMouseMove` | drawing 实时更新 | 新增 measuring 预览 |
| `onMouseUp` | drawing 完成 | 新增 rect 规范化 + 置底 |
| `hitTest` | 对墙/家具 | 新增跳过 `visible=false` 对象 |
| `ptInObj` | | 新增 `image/svg/rect/measure` 分支 |
| `bboxOf` | | 新增上述类型 |
| `hitHandle` | furniture/stairs | 新增 `image/svg/rect` |
| `renderObj` | | 新增 `image/svg/rect/measure` 分支 |
| `renderPreview` | drawing 预览 | 新增 measuring 预览 |
| `updatePropsPanel` | | 通用可见字段 + 图层按钮；新类型专属字段 |
| `importData` | | 新增 `bgImage` → `image` 迁移 |
| `exportSVG` | | 新增导出 image 对象（`<image href>`）|
| 新增方法 | | `importBackground` / `importImageComponent` / `importSvgComponent` / `_uploadImage` / `_placeImageObject` / `calibrateBackground` / `toggleBgVisible` / `removeBackground` / `bringToFront` / `sendToBack` / `raiseOne` / `lowerOne` / `clearMeasures` / `nudgeSelected` / `_updateMeasureStatus` |

### 4.2 新增文件

```
svg/compass.svg              新 · 指南针 SVG
svg/door-left.svg            新 · 左开门 SVG
svg/door-right.svg           新 · 右开门 SVG
svg/door-double.svg          新 · 双开门 SVG
svg/door-sliding.svg         新 · 滑动玻璃门 SVG
svg/preview.html             新 · SVG 预览页

tests/README.md              新 · 测试套件文档
tests/run.sh                 新 · 一键运行脚本
tests/setup.js               新 · 共享工具
tests/test_smoke.js          新 · 冒烟测试
tests/test_bg_image.js       新 · 底图/图像测试
tests/test_keyboard.js       新 · 键盘交互测试
tests/test_measure.js        新 · 皮尺测试
tests/test_rect_window.js    新 · 矩形/窗户测试

.gitignore                   新 · 忽略 node_modules
CHANGES.md                   本文档
```

---

## 5. 如何使用（用户视角）

### 5.1 打开

双击 `floor_planner.html`。任何现代浏览器（Chrome / Edge / Firefox / Safari）都行。

### 5.2 画第一个户型（5 分钟）

1. **画外墙**：点左侧 `⬜ 房间` → 画布上按住鼠标拖出矩形 → 松开。得到 4 面墙。
2. **加内墙**：点 `▭ 墙` → 点两点拉一条内墙。
3. **加门**：点 `🚪 门` → 在任意一面墙上拖一小段（约 900mm）。
4. **加窗**：点 `🪟 窗` → 同上，默认 100mm 厚。想改厚度？选中后属性面板有"窗厚"字段。
5. **放家具**：左下角图形库，点开"卧室"分类 → 拖拽双人床到卧室内。
6. **区分房间**：点 `⎕ 地板` → 在客厅区域拖出矩形 → 默认浅黄色。再画第二个 → 自动浅蓝色。选中后在属性面板起名"客厅"/"卧室"。
7. **尺寸标注**：点顶栏 `📏 尺寸标注` → 外墙四周自动出现尺寸链。
8. **测距**：点 `📏 皮尺` → 点两点 → 看到长度。想改？选中测量线，拖端点或改属性面板数字。

### 5.3 导入扫描图"描图"

如果你已经有一张手绘/扫描的户型图：

1. 顶栏 `🖼 底图` → 选图片
2. 图片自动半透明放置在画布
3. 点 `📐 标定` → 在图上点某面墙的两端 → 输入这面墙实际多少 mm
4. 图片自动缩放到真实尺寸
5. 现在用 `⬜ 房间` / `▭ 墙` 工具沿着底图描就行
6. 描完后：选中底图 → 属性面板勾选"可见" 或拖到一边，或直接删除

### 5.4 快捷键速查

| 键 | 作用 |
|----|------|
| `↑↓←→` | 移动选中对象 100mm |
| `Shift + 方向键` | 移动 1000mm |
| `Ctrl+C` / `Ctrl+D` | 复制 |
| `Delete` / `Backspace` | 删除 |
| `R` | 旋转 90° |
| `Ctrl+Z` / `Ctrl+Y` | 撤销 / 重做 |
| `Ctrl+S` | 保存 JSON |
| `Esc` | 取消当前操作 |
| `滚轮` | 缩放视图 |
| `Space + 拖` / `中键拖` | 平移视图 |
| `Shift`（画墙时）| 解除正交约束，自由角度 |
| `Shift`（皮尺时）| 反过来强制正交 |

### 5.5 三种导入图片方式的区别

| 按钮 | 放到哪里 | 透明度 | 适用场景 |
|------|---------|--------|---------|
| 🖼 底图 | 数组最底 | 0.5 | 描图，不会盖住新画的墙 |
| 📎 图片 | 数组顶端 | 1.0 | 插入家具照片、装饰图 |
| 🎨 SVG | 数组顶端 | 1.0 | 插入指南针、门类符号（矢量，缩放清晰）|

### 5.6 保存和分享

- `💾 保存JSON`：下载 `.json` 文件。完整包含户型 + 底图 + 图像 + 测量 + 楼层。
- `📂 加载`：粘贴 JSON 或选文件，完整恢复（包括老版本的 `bgImage` 自动迁移）。
- `⬇ 导出SVG`：矢量格式，可用 Figma / Illustrator / Inkscape 打开继续美化。
- `⬇ 导出DXF`：CAD 格式，可用 AutoCAD / LibreCAD / QCAD 打开（目前几何简化，后续 P2 会完善）。

---

## 6. 如何开发扩展（开发者视角）

### 6.1 代码从哪儿看起

`floor_planner.html` 从上到下三段：
1. `<style>` 样式（~100 行）
2. `<body>` HTML 结构（~120 行）
3. `<script>` 逻辑（~2800 行）

看 `<script>` 时先看 **`const app = {...}`** 这个巨大对象，里面所有方法按职能分组（有注释标题）：
```
楼层管理
图像对象 (底图/自定义组件)
图层顺序
家具组件库
事件绑定
坐标转换
视口
工具
鼠标事件
对象管理
命中测试
渲染
属性面板
历史
保存/加载
导出
```

### 6.2 加一个新对象类型的完整步骤

举例：加一个"圆形"类型 `type='circle'`。

**步骤 1：工具栏按钮**
```html
<button class="tool-btn" data-tool="circle" onclick="app.setTool('circle')">⭕ 圆形</button>
```

**步骤 2：`setTool` 的状态栏标签**
```js
select:'选择', ..., circle:'圆形'
```

**步骤 3：`onMouseDown` 开始绘制**
```js
else if (this.tool === 'circle') {
    this.drawing = { type:'circle', cx:sp.x, cy:sp.y, r:0, id:this.nextId++ };
}
```

**步骤 4：`onMouseMove` 预览**
```js
} else if (dr.type === 'circle') {
    dr.r = Math.hypot(sp.x - dr.cx, sp.y - dr.cy);
}
```

**步骤 5：`onMouseUp` 保存**
```js
} else if (dr.type==='circle') {
    if (dr.r < GRID) valid = false;
}
// addObject(dr) 会处理入数组
```

**步骤 6：`renderObj` 渲染**
```js
else if (o.type === 'circle') {
    const c = document.createElementNS(ns,'circle');
    c.setAttribute('cx', o.cx); c.setAttribute('cy', o.cy);
    c.setAttribute('r', o.r);
    c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#000');
    g.appendChild(c);
}
```

**步骤 7：`ptInObj` 命中测试**
```js
if (o.type === 'circle') {
    return Math.hypot(p.x-o.cx, p.y-o.cy) <= o.r;
}
```

**步骤 8：`bboxOf`**
```js
if (o.type === 'circle') {
    return { x:o.cx-o.r, y:o.cy-o.r, w:o.r*2, h:o.r*2 };
}
```

**步骤 9：属性面板字段**
```js
else if (o.type === 'circle') {
    html += row('CX (mm)', `<input type="number" value="${Math.round(o.cx*MM_PER_UNIT)}" onchange="app.setProp('cx', +this.value/${MM_PER_UNIT})">`);
    html += row('半径 (mm)', ...);
}
```

**步骤 10：`typeLabel`**
```js
{..., circle:'⭕ 圆形'}
```

**步骤 11：写测试**
```js
// tests/test_circle.js
const { loadApp, suite } = require('./setup');
loadApp((app, dom) => {
    const t = suite('圆形');
    // ...
    t.done();
});
```

**步骤 12：加到 `run.sh`**
```bash
FILES=(..., "test_circle.js")
```

### 6.3 常用 API 速查

```js
// === 数据 ===
app.objects                      // 当前楼层对象数组 (get/set via currentFloor)
app.floors[i].objects            // 指定楼层
app.selected                     // 当前选中对象 (null or object)
app.tool                         // 当前工具字符串
app.viewport                     // { x, y, zoom }
app.nextId                       // 下一个分配的 id

// === 操作 ===
app.addObject(obj)               // 加对象 (push + render + select + pushHistory)
app.select(obj)                  // 选中 (渲染选中框 + 更新属性面板)
app.deleteSelected()
app.duplicate()
app.rotateSelected()
app.nudgeSelected(dx, dy)        // 平移选中对象
app.setProp(key, value)          // 属性面板 onchange 用

// === 图层 ===
app.bringToFront()
app.sendToBack()
app.raiseOne()
app.lowerOne()

// === 渲染 ===
app.render()                     // 完整重绘
app.renderPreview()              // 只重绘叠加层 (性能更好)
app.updatePropsPanel()

// === 历史 ===
app.pushHistory()
app.undo()
app.redo()

// === 坐标 ===
app.clientToWorld(cx, cy)        // 屏幕→世界
app.snap(v)                      // 吸附网格
app.snapPt({x,y})                // 吸附一个点

// === 命中 ===
app.hitTest(worldPt)             // 返回命中对象 or null
app.hitHandle(worldPt, obj)      // 返回 'nw'/'ne'/'sw'/'se' or null
app.bboxOf(obj)                  // { x, y, w, h }

// === 导入导出 ===
app.saveJSON()                   // 下载
app.importData(obj)              // 从 JSON 对象加载
app.exportSVG()
app.exportDXF()
```

### 6.4 样式约定

- 颜色：
  - 墙 `#2c2c2c` · 门 `#c97f1a` · 窗 `#1a7fc9`
  - 选中蓝 `#3b82f6` · 主按钮蓝 `#3b82f6`
  - 测量红 `#dc2626` · 尺寸橙 `#d06b4a`
- 字段命名：几何用 `x/y/w/h`（家具）或 `x1/y1/x2/y2`（线类）。保持一致，面板和拖动逻辑都依赖此约定。
- 所有对象**必带** `id`（整数），`type`（字符串）。其他字段可选。

---

## 7. 测试怎么跑、怎么写

### 7.1 跑测试

```bash
# 装依赖 + 跑全部（首次会下 jsdom ~150MB）
bash tests/run.sh

# 只跑某一类
bash tests/run.sh smoke       # 冒烟，<1 秒
bash tests/run.sh measure     # 皮尺相关

# 单独调试某个文件
node tests/test_rect_window.js
```

**预期输出**（全绿时）：
```
=== 冒烟测试 ===
  ✓ ...
--- 冒烟测试: 22/22 passed ---
...
✅ 所有 5 个测试文件通过 (耗时 4s)
```

### 7.2 测试文件组织

| 文件 | 测试数 | 关注点 |
|------|--------|--------|
| `test_smoke.js` | 22 | 语法 + 关键 API 存在（最快，大改后先跑）|
| `test_bg_image.js` | 24 | 图像对象 + 数据迁移 + 图层 |
| `test_keyboard.js` | 17 | 方向键 + Ctrl+C + 防抖 |
| `test_measure.js` | 28 | 皮尺全流程 |
| `test_rect_window.js` | 27 | 矩形 + 窗户厚度 |

### 7.3 断言 API

```js
const { loadApp, suite } = require('./setup');

loadApp((app, dom) => {
    const t = suite('测试组名');

    t.ok(cond, '描述')                   // 布尔
    t.eq(actual, expected, '描述')       // 深等比较

    t.done()  // 必须调用，决定 exit code
})
```

### 7.4 写一个新测试（模板）

```js
// tests/test_my_feature.js
const { loadApp, suite, fakeMouseEvent } = require('./setup');

loadApp((app, dom) => {
    const doc = dom.window.document;
    const t = suite('我的新功能');

    // 1. 准备数据
    app.objects.push({ id:1, type:'wall', x1:0, y1:0, x2:100, y2:0 });

    // 2. 触发行为
    app.setTool('select');
    app.onMouseDown(fakeMouseEvent(app, 50, 0));

    // 3. 断言结果
    t.ok(app.selected, '能选中');
    t.eq(app.selected.id, 1, 'id 正确');

    // 4. 结束
    t.done();
});
```

然后在 `tests/run.sh` 里加：
```bash
FILES=(..., "test_my_feature.js")
```

### 7.5 调试失败的测试

1. **只运行失败的那个文件**：`node tests/test_measure.js`
2. **查看 DOM**：`console.log(doc.body.innerHTML.substring(0, 2000))`
3. **查看 app 状态**：`console.log(JSON.stringify(app.objects, null, 2))`
4. **注释其他断言**：临时只留要调试的那条 `t.ok(...)`

### 7.6 CI 集成（可选）

GitHub Actions 示例：

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: bash tests/run.sh
```

退出码：0 = 全绿，1 = 有失败，2 = 环境问题。

---

## 8. 常见问题 FAQ

### Q: 打开 HTML 后一片空白？
**A**: 按 F12 看控制台报错。大概率是 `floor_planner.html` 文件损坏或用了旧版浏览器（需要 ES2017+）。

### Q: 拖家具进去很慢？
**A**: 每次操作 `render()` 全量重绘。目前 200+ 对象还能流畅，超过 500 会卡。优化方向：拖拽期间只更新 transform，mouseup 才完整 render。

### Q: JSON 文件越来越大？
**A**: 底图/图像是 base64 内嵌的。一张 5MB 扫描图会让 JSON 涨到 ~7MB。已自动做了 JPEG 压缩（最长边 2000px + 80% 质量）。想更激进，可以改 `_uploadImage` 里的压缩参数。

### Q: DXF 导出在 AutoCAD 里打开缺东西？
**A**: 当前 DXF 导出是简化版，墙是单线（不是双线墙）、门的弧线没了、圆形家具变矩形。完善计划是下个迭代 P2（写在路线图里）。

### Q: 测试跑不起来说 "jsdom 未安装"？
**A**: `tests/run.sh` 应该自动装。手动装：`npm install --no-save jsdom`。

### Q: 改了代码后测试挂了怎么办？
**A**:
1. 先跑 `bash tests/run.sh smoke` 看语法和 API 是否坏
2. 然后跑挂的那个：`node tests/test_xxx.js` 看具体哪条失败
3. 失败的断言描述 + 代码对照着看
4. 不是所有失败都是 bug——有时候是测试代码过时，需要同步更新

### Q: 怎么添加一个自定义快捷键？
**A**: 编辑 `onKey(e)` 方法，加个分支：
```js
else if (e.key === 'm' && e.ctrlKey) {
    this.myCustomAction();
    e.preventDefault();
}
```

### Q: 旧数据的 `locked` 字段怎么处理？
**A**: 已经完全忽略，读入时字段保留但不起作用。想彻底清理的话在 `importData` 里加 `delete o.locked`。

### Q: 为什么图像对象 `pointer-events: none`？
**A**: SVG `<image>` 元素如果接受事件，会挡住下层的墙/家具，让你没法点到它们。我们的 `hitTest` 是纯 JS 数据计算，不依赖 SVG 事件，所以可以安全关闭。

### Q: 怎么把测试放到 git 里但不提交 `node_modules`？
**A**: `.gitignore` 已经包含 `node_modules/` 和 `package.json`。`tests/*.js` 会被提交。

---

## 9. 未来路线图

下面列出**已知但本次没做**的改进，按价值/工作量排序。

### P0 · 建议立刻做

| 改动 | 价值 | 工作量 |
|------|------|--------|
| 修复 XSS（属性面板 innerHTML 用了 escapeXml，但 `furniture.name` 等字段注入点还在）| 安全 | 1h |
| 拖动过程只更新单个对象 transform，不全量重绘 | 性能 | 2h |

### P1 · 功能增强

| 改动 | 价值 |
|------|------|
| DXF 导出完善（双线墙、ARC、CIRCLE、ELLIPSE、DIMENSION）| CAD 互操作 |
| 底图支持 PDF | 常见需求 |
| 多选 + 批量操作 | 效率 |
| 智能吸附参考线（像 Figma 的红线）| 对齐 |
| 墙体自动交接（十字/T 字不出头）| 美观 |
| 门/窗吸附到墙 | 精确 |
| localStorage 自动保存草稿 | 防丢数据 |
| 右键菜单 | 操作便利 |

### P2 · 架构重构

| 改动 | 价值 |
|------|------|
| Vite + 模块化（产物仍是单 HTML）| 可维护性 |
| TypeScript + 对象类型联合 | 类型安全 |
| 命令模式替代 JSON 全量快照（undo 更轻量）| 性能 |
| 触屏/移动端（PointerEvent）| 平台扩展 |

### P3 · 专业功能

| 改动 | 价值 |
|------|------|
| IFC 导入/导出（BIM 标准）| 行业对接 |
| 3D 预览（Three.js 基于 2D 数据挤出）| 可视化 |
| 协作（WebRTC / WebSocket）| 多人同时编辑 |

---

## 结语

这次会话从"单文件的绘图程序"出发，做了一系列外科手术式的改进：
- **清晰的抽象**：一切皆 object，通用能力（可见/图层）下沉到基座
- **数据迁移**：旧字段自动转换，用户无感升级
- **测试先行**：每个功能都配套 20+ 项自动化断言
- **零依赖零构建**：保持项目最大的优势——双击即用

希望这份文档能让你用得顺心、改得放心。

**问题反馈 / 贡献**：直接提 issue 或 PR。

**最后更新**：2026-05-12
