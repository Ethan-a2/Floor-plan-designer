# 户型设计器 — 完整文档

一个用**单个 HTML 文件**实现的 2D 建筑平面图设计工具。没有构建、没有依赖、没有后端，双击即用。

> 使用纯 SVG + 原生 JS 实现，2400 行代码，零依赖。

---

## 目录

1. [快速上手（5 分钟）](#1-快速上手5-分钟)
2. [功能全览](#2-功能全览)
3. [文件结构](#3-文件结构)
4. [设计思路（为什么这样做）](#4-设计思路为什么这样做)
5. [代码架构（200 行代码速览）](#5-代码架构200-行代码速览)
6. [二次开发：入门到进阶](#6-二次开发入门到进阶)
7. [进阶技巧与调试](#7-进阶技巧与调试)
8. [常见问题 FAQ](#8-常见问题-faq)
9. [扩展路线图](#9-扩展路线图)

---

## 1. 快速上手（5 分钟）

### 打开方式

双击 `floor_planner.html` 即可在浏览器中使用，**无需联网、无需安装**。

### 5 分钟体验

**第 1 步：画一个房间**
- 点左侧工具栏 `⬜ 房间`
- 在画布上按住鼠标左键拖出矩形 → 松开
- 自动生成 4 面围墙

**第 2 步：加门和窗**
- 点 `🚪 门` → 在某面墙上拖出一小段 → 生成带开启弧线的门
- 点 `🪟 窗` → 同样方式

**第 3 步：放家具**
- 在左下"图形库"找 `卧室 ▶` 点开分类
- 把 `双人床` **拖**到房间里
- 再拖 `衣柜`、`床头柜`

**第 4 步：看尺寸**
- 点顶栏 `📏 尺寸标注` → 外墙四周自动出现尺寸链
- 用鼠标点中任意家具 → 会显示它到 4 面墙的距离

**第 5 步：导出**
- 点 `⬇ 导出 SVG` → 下载矢量图
- 可导入 Figma / Illustrator / Inkscape 继续美化

### 示例数据（想看完整户型）

打开 `demo_layout.html` → 点"🚀 在设计器中打开" → 自动加载一个双层别墅户型

---

## 2. 功能全览

### 2.1 核心功能

| 类别 | 功能 | 说明 |
|------|------|------|
| **绘图** | 墙 / 门 / 窗 | 点击两点连线，自动正交约束 |
| | 矩形房间 | 拖出矩形 → 4 段墙 |
| | L 型 / T 型房间 | 一键生成异形房间 |
| | 楼梯 | 可配置踏步数、上/下箭头 |
| | 文字标签 | 双击编辑，可改字号、颜色、旋转 |
| **家具** | 88 个组件 | 9 大分类：卧室/客厅/餐厨/卫浴/家电/办公/收纳/装饰/户外 |
| | 拖拽放置 | 从左侧拖到画布，自动吸附网格 |
| **编辑** | 选中 | 单击选中，四角手柄缩放 |
| | 旋转 | `R` 键或属性面板输入角度 |
| | 复制 | `Ctrl+D` |
| | 删除 | `Delete` |
| | 撤销/重做 | `Ctrl+Z` / `Ctrl+Y`（最多 50 步）|
| **尺寸** | 自动标注 | 外墙四周分段+总长尺寸链 |
| | 选中提示 | 选中家具时显示到 4 面墙距离 |
| | 属性输入 | 右侧面板直接输入 mm 精确数值 |
| **视图** | 缩放 | 滚轮 / 滑条 / 按钮（10%–400%）|
| | 平移 | 中键拖动 / Space+左键 |
| | 迷你地图 | 右下角缩略图 + 视口框 |
| | 适应窗口 | 一键缩放到完整视野 |
| **楼层** | 多楼层管理 | 添加/删除/重命名，tab 切换 |
| | 复制当前 | 新楼层继承上层墙体结构 |
| **文件** | JSON 保存/加载 | 完整项目文件，双向兼容 |
| | SVG 导出 | 矢量图，多层可并排 |
| | DXF 导出 | CAD 标准格式，分图层 |

### 2.2 完整快捷键

| 快捷键 | 功能 |
|--------|------|
| `滚轮` | 缩放 |
| `Space + 拖` / `中键拖` | 平移视图 |
| `Shift` | 绘制墙时**解除正交约束**，自由角度 |
| `Delete` / `Backspace` | 删除选中对象 |
| `R` | 旋转 90° |
| `Ctrl+D` | 复制选中对象 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` / `Ctrl+Shift+Z` | 重做 |
| `Ctrl+S` | 保存 JSON |
| `Esc` | 取消当前操作，返回选择工具 |

---

## 3. 文件结构

```
empty/
├── floor_planner.html   ← 主程序（单文件 2400 行）
├── demo_layout.html     ← 示例户型数据，点击跳转到主程序
├── floor_plan.html      ← 最初静态版本（已被新版取代）
└── README.md            ← 本文档
```

`floor_planner.html` 内部结构：

```
┌────────────────────────────────────┐
│ <style>   (约 100 行)               │   样式定义
├────────────────────────────────────┤
│ <body>    UI 结构                   │
│   ├─ 顶栏（工具栏按钮）              │
│   ├─ 楼层栏                         │
│   ├─ 主区（侧栏+画布+属性面板）      │
│   ├─ 底栏                           │
│   └─ 对话框 / 迷你地图               │
├────────────────────────────────────┤
│ <script> (约 2000 行)               │
│   ├─ const app = { ... }            │   核心对象
│   │   ├─ 数据：floors/objects       │
│   │   ├─ 方法：绘制/交互/导出        │
│   │   └─ 100+ 方法                  │
│   ├─ 绘制函数 drawBed/drawSofa...   │   家具渲染
│   ├─ 工具函数 distToSeg/escapeXml   │
│   └─ app.init() + autoload 逻辑     │
└────────────────────────────────────┘
```

---

## 4. 设计思路（为什么这样做）

> 这一节讲**为什么**，不讲怎么做。理解这些思想，就能在任何代码编辑器里复现同样的东西。

### 4.1 为什么选 SVG 而不是 Canvas

| 对比 | SVG | Canvas |
|------|-----|--------|
| 对象模型 | ✅ 每个元素是 DOM 节点 | ❌ 只有像素 |
| 选中/命中测试 | ✅ 原生 `getElementById` | ❌ 要自己维护场景图 |
| 无限缩放不失真 | ✅ 矢量 | ❌ 栅格化 |
| 导出 SVG | ✅ 直接序列化 | ❌ 要单独实现 |
| 大量对象性能 | ⚠️ DOM 节点多会慢 | ✅ 一次绘制 |

平面图通常几十到几百个对象，**SVG 的性能完全够用**，而 SVG 省去的命中测试、缩放、导出工作量是 Canvas 的 10 倍。

### 4.2 坐标系与单位

**核心设计**：`1 用户单位 = 10 毫米`

```javascript
const MM_PER_UNIT = 10;    // 1 单位 = 10 mm
const GRID = 10;           // 吸附网格 = 10 单位 = 100 mm
```

为什么不用 `1 单位 = 1 mm`？
- 坐标数字太大（8000×12000），显示、序列化都不友好
- SVG 的 `stroke-width` 默认 1 单位，如果用 mm 会画出 1mm 粗的线，基本看不见

为什么不用 `1 单位 = 1 m`？
- 数字太小（8×12），精度不够，吸附会卡

`1 单位 = 10mm` 是甜区：数字适中（800×1200），小数极少，墙厚 24 单位 = 240mm 符合实际。

### 4.3 对象数据结构

**所有对象都是普通 JS 对象**，存在数组里：

```javascript
// 墙
{ id:1, type:'wall', x1:50, y1:50, x2:850, y2:50, thickness:24 }

// 门
{ id:2, type:'door', x1:480, y1:890, x2:580, y2:890 }

// 家具
{ id:3, type:'furniture', fid:'bed_d', name:'双人床',
  x:180, y:110, w:180, h:200, rot:0, color:'#f5ebd6' }

// 文字
{ id:4, type:'text', x:200, y:270, text:'主卧', size:24, color:'#2c3e50', rot:0 }

// 楼梯
{ id:5, type:'stairs', x:400, y:370, w:310, h:500, rot:0, steps:12, dir:'up' }
```

**为什么不用 class？**
- 便于 `JSON.stringify` 直接保存/加载
- 便于 `JSON.parse(JSON.stringify(x))` 做深拷贝（用于复制、历史）
- 数据和行为分离，绘制逻辑集中在一处，方便扩展

### 4.4 单向数据流

```
用户操作 → 修改 this.objects → 调用 render() → 清空 SVG → 遍历重绘
```

**永远不要直接修改 DOM**（除了 `render()` 本身）。这样保证了：
- 撤销/重做只需要序列化/反序列化 objects 即可
- 保存/加载就是 `JSON.stringify(objects)`
- 导出 SVG 就是再渲染一遍到字符串

这是 React 的核心思想（虚拟 DOM / 状态驱动视图），但我们用 50 行代码手写实现了。

### 4.5 多楼层：用 getter/setter 最小化改动

初版代码到处是 `this.objects`，要支持多楼层不想全部改，于是：

```javascript
floors: [{ name:'1F', objects:[] }],
currentFloor: 0,
get objects()  { return this.floors[this.currentFloor].objects; },
set objects(v) { this.floors[this.currentFloor].objects = v; },
```

**所有原有代码一行不动**，自动切换到当前楼层的数据。这是 JS 属性访问器的威力。

### 4.6 浮动标注层（layerOverlay）

SVG 分 3 层：

```
<g id="viewport">              ← 全局变换（缩放+平移）
  <rect .../>                   ← 网格背景
  <g id="layer-objects"></g>   ← 对象层（墙/家具等，存在 this.objects）
  <g id="layer-overlay"></g>   ← 浮动层（尺寸标注/选中高亮/临时预览）
</g>
```

**浮动层的东西不进入 objects 数组**，所以：
- 尺寸标注不会被保存（保存的是"显示标注"的开关）
- 不会被命中测试（不能选中）
- 不会被撤销（正常）

### 4.7 命中测试的几何学

点击 `(px, py)` 选中哪个对象？从后往前（上层优先）遍历：

```javascript
ptInObj(p, o) {
    if (墙/门/窗) return 点到线段的距离 < 8
    if (家具) {
        反向旋转点到对象本地坐标  // 处理旋转
        return 点在 AABB 内
    }
    if (文字) return 点在文字包围盒内
}
```

**关键技巧**：对象旋转后，命中测试不要旋转 AABB（变复杂），而是**把鼠标点反向旋转回对象本地坐标**，在未旋转的 AABB 中判断，简单 10 倍。

```javascript
// 点 p 反向旋转 -rot 度到以 (cx,cy) 为中心
const rad = -(o.rot||0) * Math.PI/180;
const lx = Math.cos(rad)*(p.x-cx) - Math.sin(rad)*(p.y-cy) + cx;
const ly = Math.sin(rad)*(p.x-cx) + Math.cos(rad)*(p.y-cy) + cy;
// 然后判断 lx, ly 在 [o.x, o.x+o.w] × [o.y, o.y+o.h] 内
```

### 4.8 自动尺寸标注算法

外墙四周的尺寸链是怎么出来的？

```
1. 筛选所有 wall 对象
2. 求包围盒 (minX, minY, maxX, maxY)
3. 对顶边：收集所有 y ≈ minY 的端点 x 坐标，排序 → 分段点
4. 每相邻两点画一段尺寸 (刻度 + 数值)
5. 最外侧再画一条总长尺寸
6. 其他三边同理
```

这利用了一个观察：**大部分内墙、门、窗的端点都在外墙上**，所以它们是自然的分段点。

---

## 5. 代码架构（200 行代码速览）

### 5.1 入口

```javascript
app.init();  // 文件最后一行
```

这会绑定事件、渲染首屏、推入初始历史记录。

### 5.2 核心对象总览

```javascript
const app = {
    // === 数据 ===
    floors: [{ name:'1F', objects:[] }],   // 所有楼层
    currentFloor: 0,                        // 当前楼层索引
    selected: null,                         // 当前选中对象
    nextId: 1,                              // 下一个 id
    tool: 'select',                         // 当前工具
    viewport: { x:0, y:0, zoom:1 },         // 视口变换
    history: [],                            // 撤销栈
    historyIdx: -1,
    drawing: null,                          // 正在绘制的临时对象
    dragState: null,                        // 拖动状态

    // === 常量 ===
    CATEGORIES: [...],                      // 9 个家具分类
    FURNITURE: [...],                       // 88 个家具定义

    // === 方法 (100+) ===
    init() { ... }                          // 启动
    setTool(t) { ... }                      // 切换工具
    addObject(o) { ... }                    // 添加对象
    select(o) { ... }                       // 选中
    render() { ... }                        // 重绘
    renderObj(o) { ... }                    // 渲染单个对象
    onMouseDown/Move/Up(e) { ... }          // 鼠标处理
    pushHistory/undo/redo() { ... }         // 历史
    exportSVG/exportDXF() { ... }           // 导出
    // ... 更多
}
```

### 5.3 关键方法调用图

```
用户点击画布
  └─ onMouseDown(e)
       ├─ [tool=select] 命中测试 → 开始拖动
       ├─ [tool=wall]   开始绘制一条墙
       ├─ [tool=room]   开始绘制房间预览矩形
       └─ ...

onMouseMove(e)
  └─ 更新 drawing / dragState
      └─ renderPreview() / render()

onMouseUp(e)
  ├─ 完成拖动 → pushHistory()
  └─ 完成绘制 → addObject() / emitRoomWalls()
```

### 5.4 一次 render() 做了什么

```javascript
render() {
    this.layerObj.innerHTML = '';               // 1. 清空对象层
    this.objects.forEach(o => {
        const g = this.renderObj(o);             // 2. 渲染每个对象为 <g>
        this.layerObj.appendChild(g);
    });
    this.layerOv.innerHTML = '';                // 3. 清空浮动层
    if (this.showDims) this.renderDimensions(); // 4. 画尺寸标注
    if (this.selected) this.drawSelection();    // 5. 画选中框
    this.updateMinimap();                       // 6. 刷新迷你地图
}
```

### 5.5 一次 renderObj(o) 做了什么

根据 `o.type` 分派：

```javascript
renderObj(o) {
    const g = createSvg('g');
    if (o.type === 'wall')      { // 画一条粗线 }
    if (o.type === 'door')      { // 画门洞+弧线 }
    if (o.type === 'window')    { // 画双线 }
    if (o.type === 'furniture') {
        // 应用平移+旋转 transform
        g.setAttribute('transform', `translate(${cx},${cy}) rotate(${rot}) translate(${-cx},${-cy})`);
        // 调用家具对应的绘制函数
        const def = FURNITURE.find(f => f.id === o.fid);
        def.draw(g, o);
    }
    if (o.type === 'stairs')    { // 画踏步 }
    if (o.type === 'text')      { // 画文字 }
    return g;
}
```

---

## 6. 二次开发：入门到进阶

分 4 个难度等级，每级都是具体任务。

### 🟢 Level 1：改颜色、改文字（10 分钟上手）

#### 任务 1：改侧栏宽度

找到：
```css
.sidebar { width:230px; ... }
```
改为 `width:280px;`，保存刷新。完成。

#### 任务 2：改默认墙厚

找到：
```javascript
else if (this.tool === 'wall') {
    this.drawing = { type:'wall', x1:sp.x, y1:sp.y, x2:sp.x, y2:sp.y, thickness: 24, id: this.nextId++ };
}
```
把 `thickness: 24` 改为 `thickness: 36`（360mm 厚墙，承重墙用）。

#### 任务 3：改网格颜色

```html
<pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#eef0f3" stroke-width="0.5"/>
</pattern>
```
改 `stroke` 色值即可。

#### 任务 4：让窗户变绿色

找到 `renderObj` 里处理 window 的部分：
```javascript
else if (o.type === 'window') {
    ...
    line.setAttribute('stroke','#1a7fc9');   // ← 这里
```
把 `#1a7fc9` 改为 `#3a9a3a`。

---

### 🟡 Level 2：加一个新家具（30 分钟）

目标：加一个"鱼缸"。

#### 第 1 步：写绘制函数

在 `function miniIcon` 的**上方**加：

```javascript
function drawFishTank(g, o) {
    const ns = 'http://www.w3.org/2000/svg';
    // 外框
    drawBox(g, {...o, color:'#b5dcef'});
    // 水波纹
    const wave = document.createElementNS(ns, 'path');
    wave.setAttribute('d', `M 0 ${o.h*0.3} Q ${o.w*0.25} ${o.h*0.2}, ${o.w*0.5} ${o.h*0.3} T ${o.w} ${o.h*0.3}`);
    wave.setAttribute('fill', 'none');
    wave.setAttribute('stroke', '#4a9fd1');
    wave.setAttribute('stroke-width', 1);
    g.appendChild(wave);
    // 小鱼
    const fish = document.createElementNS(ns, 'circle');
    fish.setAttribute('cx', o.w*0.5);
    fish.setAttribute('cy', o.h*0.6);
    fish.setAttribute('r', Math.min(o.w, o.h)*0.1);
    fish.setAttribute('fill', '#ff9944');
    g.appendChild(fish);
}
```

#### 第 2 步：在 FURNITURE 里注册

找到 `FURNITURE: [`，在合适的分类（比如装饰）里加一行：

```javascript
{ id:'fishtank', cat:'decor', name:'鱼缸', w:1200, h:400,
  icon:'box', draw: drawFishTank },
```

#### 第 3 步：刷新页面

侧栏 "装饰植物" 分类里就能看到"鱼缸"了，拖到画布即可。

#### 可选：自定义图标

`miniIcon()` 返回的是侧栏里的小预览 SVG。你可以在 `miniIcon()` 的 `ic` 对象里加：

```javascript
fishtank: `<rect x="4" y="10" width="38" height="16" fill="#b5dcef"/>
           <circle cx="23" cy="20" r="3" fill="#ff9944"/>`,
```

然后在 `FURNITURE` 里把 `icon:'box'` 改成 `icon:'fishtank'`。

---

### 🟠 Level 3：加一个新工具（1 小时）

目标：加一个"⌀ 圆柱"工具，点击后在画布上点两下画一个圆柱（圆形立柱的俯视图）。

#### 第 1 步：工具栏加按钮

找到工具按钮区（`<div class="tool-row">`）加一行：

```html
<button class="tool-btn" data-tool="column" onclick="app.setTool('column')">⌀ 立柱</button>
```

#### 第 2 步：在对象类型中注册

对象结构：
```javascript
{ type:'column', x: 100, y: 100, r: 20, color:'#2c2c2c', id: ... }
```

#### 第 3 步：处理鼠标事件

在 `onMouseDown` 中加：

```javascript
else if (this.tool === 'column') {
    const obj = { type:'column', x:sp.x, y:sp.y, r:20,
                  color:'#2c2c2c', id:this.nextId++ };
    this.addObject(obj);
    this.setTool('select');
}
```

#### 第 4 步：渲染

在 `renderObj(o)` 方法中加入分支：

```javascript
else if (o.type === 'column') {
    const ns = 'http://www.w3.org/2000/svg';
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', o.x);
    c.setAttribute('cy', o.y);
    c.setAttribute('r', o.r);
    c.setAttribute('fill', o.color);
    c.setAttribute('stroke', '#555');
    g.appendChild(c);
}
```

#### 第 5 步：支持选中（命中测试）

在 `ptInObj(p, o)` 方法中加：

```javascript
if (o.type === 'column') {
    return Math.hypot(p.x - o.x, p.y - o.y) <= o.r;
}
```

#### 第 6 步：支持包围盒（用于尺寸、迷你地图、适应窗口）

在 `bboxOf(o)` 方法中加：

```javascript
if (o.type === 'column') {
    return { x: o.x - o.r, y: o.y - o.r, w: o.r*2, h: o.r*2 };
}
```

#### 第 7 步：属性面板

在 `updatePropsPanel()` 方法中加：

```javascript
if (o.type === 'column') {
    html += row('X (mm)', ni('x'));
    html += row('Y (mm)', ni('y'));
    html += row('半径', `<input type="number" value="${o.r*MM_PER_UNIT}" onchange="app.setProp('r', this.value/${MM_PER_UNIT})">`);
    html += row('颜色', `<input type="color" value="${o.color}" onchange="app.setProp('color', this.value)">`);
}
```

完成！刷新页面 → 点"⌀ 立柱" → 在画布点一下 → 生成圆柱 → 可选中、可改属性、可导出。

---

### 🔴 Level 4：加一个复杂功能（半天到一天）

比如：**房间面积自动计算并显示**。

思路：

1. 识别"封闭区域" — 从墙的线段集合中找出封闭多边形（计算几何问题）
2. 计算多边形面积（鞋带公式 Shoelace Formula）
3. 在多边形中心显示面积文字

伪代码：

```javascript
findClosedRooms() {
    const walls = this.objects.filter(o => o.type === 'wall');
    // 1. 构建图：端点为节点，墙为边
    const graph = buildGraph(walls);
    // 2. 从每个墙段出发，沿最左转方向找最短回路
    const polygons = [];
    graph.edges.forEach(edge => {
        const poly = traceLeftmostLoop(edge, graph);
        if (poly) polygons.push(poly);
    });
    return polygons;
}

polygonArea(pts) {
    let a = 0;
    for (let i=0; i<pts.length; i++) {
        const j = (i+1) % pts.length;
        a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return Math.abs(a/2);
}
```

这是一个**真正的工程问题**，有很多边界情况（墙不闭合、墙有重叠、T 字连接等）。参考搜索关键词：`planar subdivision`、`polygon from line segments`、`Euler formula planar graph`。

---

## 7. 进阶技巧与调试

### 7.1 浏览器 DevTools 是你的朋友

按 `F12` 打开开发者工具：

**Console 里可以直接操纵：**

```javascript
// 查看当前楼层所有对象
app.objects

// 查看所有楼层
app.floors

// 手动添加一个对象
app.addObject({ type:'text', x:100, y:100, text:'Hello', size:20, color:'red', rot:0, id:999 })

// 切换楼层
app.switchFloor(1)

// 导出当前状态为 JSON 字符串
JSON.stringify(app.floors, null, 2)

// 清空并从 JSON 加载
app.importData({ floors: [{name:'1F', objects: []}] })

// 手动打开尺寸标注
app.showDims = true; app.render()
```

### 7.2 用 Sources 断点调试

1. F12 → Sources → 左侧文件树找到 `floor_planner.html`
2. 找到你关心的方法（比如 `onMouseDown`），点行号设断点
3. 操作界面触发，代码会在断点处暂停
4. 查看 `this.objects`、`e` 等变量

### 7.3 元素审查

右键画布上任何对象 → 检查 → 可以看到 SVG 结构，方便理解渲染代码生成了什么。

### 7.4 修改后快速验证

修改 HTML 后刷新页面即可。如果要**保持界面状态**：

```javascript
// 改之前
localStorage.setItem('backup', JSON.stringify(app.floors))

// 修改代码、刷新后
app.floors = JSON.parse(localStorage.getItem('backup'))
app.render()
```

### 7.5 调试 SVG 变换

对象旋转/缩放出问题时，在 `renderObj` 里打印 transform 字符串：

```javascript
g.setAttribute('transform', trans);
console.log('transform:', trans, 'for', o);
```

### 7.6 性能优化

如果对象超过 500 个会感觉卡顿。优化方法（按优先级）：

1. **节流鼠标移动**：`onMouseMove` 时不要每次都 `render()`，用 `requestAnimationFrame`
2. **增量更新**：只更新变化的对象 DOM 节点，不清空整个 `layerObj`
3. **视口裁剪**：只渲染在视口内的对象
4. **虚拟滚动**：侧栏图形库用虚拟列表

当前代码面向 < 500 对象，没做这些优化以保持可读性。

---

## 8. 常见问题 FAQ

### Q1: 为什么我的修改没生效？
浏览器可能有缓存。刷新用 **Ctrl+Shift+R**（强刷），或 F12 → Network → 勾选 "Disable cache"。

### Q2: 画布上画了东西但看不到？
99% 是在屏幕外。点 `适应窗口` 按钮或 `Ctrl+滚轮` 缩小看看。

### Q3: 导出的 SVG 在 Illustrator 里打开是空的？
检查 SVG 文件是否有有效内容：用记事本打开 `.svg` 文件，看 `<svg>` 标签内是否有 `<g>` 或其他图形标签。

### Q4: DXF 在 AutoCAD 打开尺寸不对？
DXF 使用 mm 为单位。打开 AutoCAD 后确认**单位设置**为毫米（命令 `UNITS`）。

### Q5: 想把工具做成 SPA 上线，怎么改？
- 把 `<script>` 内容抽到 `app.js`
- 用 Vite 或 Webpack 打包
- 后端用 Node+Express 存储 JSON，前端改 `saveJSON` 调用 API

### Q6: 支持中英文切换？
所有中文字符串集中在 HTML 和几个位置。可以做一个 `i18n = { zh: {...}, en: {...} }` 对象，把中文替换为 `i18n[lang].xxx`。

### Q7: 怎么接入真实的 CAD 图纸？
参考方案：
- **DWG/DXF 读取**：用 [dxf-parser](https://github.com/gdsestimating/dxf-parser) 把 DXF 转成 JSON 对象
- **IFC**：用 [web-ifc](https://github.com/tomvandig/web-ifc) 读取 BIM 模型

### Q8: 打印出来尺寸不对？
浏览器打印页面会按屏幕尺寸缩放。正确做法：**导出 SVG → 用浏览器打开 SVG 文件 → 打印**，或导出 PDF。

---

## 9. 扩展路线图

如果继续开发，这里是优先级排序：

### 近期（1-2 周可做）
- [ ] **房间面积自动计算** — 识别封闭区域，标注 ㎡
- [ ] **自动加墙厚** — 墙线自动双线显示
- [ ] **家具吸附墙体** — 拖家具时靠近墙自动对齐
- [ ] **PNG 导出** — 栅格化导出，适合微信分享
- [ ] **PDF 导出** — 生成带标题栏的工程图
- [ ] **模板库** — 一室一厅/两室一厅等常见户型模板

### 中期（1-2 月）
- [ ] **3D 预览** — 用 three.js 把 2D 墙拉伸成 3D 房间
- [ ] **家具尺寸库** — 从 IKEA 等网站爬取真实家具尺寸
- [ ] **协作编辑** — WebSocket 多人同步
- [ ] **自定义家具上传** — 让用户上传 SVG 作为新组件
- [ ] **图层管理** — 显隐/锁定不同图层
- [ ] **智能对齐** — 拖动时显示对齐参考线

### 远期（大项目）
- [ ] **完整 BIM 导入导出** — IFC 格式
- [ ] **AI 辅助设计** — 输入需求自动生成户型
- [ ] **VR 预览** — WebXR 沉浸式看房
- [ ] **施工图生成** — 自动出电路/水路/暖通图
- [ ] **云服务** — 账户、项目管理、分享链接

---

## 附录 A：关键方法索引

| 方法 | 行号附近 | 用途 |
|------|---------|------|
| `app.init()` | 250 | 启动 |
| `app.setTool()` | 570 | 切换工具 |
| `app.addObject()` | 750 | 添加对象 |
| `app.select()` | 810 | 选中对象 |
| `app.addFloor()` | 290 | 添加楼层 |
| `app.hitTest()` | 820 | 命中测试 |
| `app.render()` | 970 | 重绘整个画布 |
| `app.renderObj()` | 1140 | 渲染单个对象（所有类型分派）|
| `app.renderDimensions()` | 990 | 自动尺寸标注 |
| `app.onMouseDown()` | 590 | 鼠标按下处理 |
| `app.onMouseMove()` | 660 | 鼠标移动处理 |
| `app.onMouseUp()` | 720 | 鼠标松开处理 |
| `app.emitRoomWalls()` | 770 | 房间工具生成墙 |
| `app.pushHistory()` | 1430 | 入栈历史 |
| `app.exportSVG()` | 1510 | 导出 SVG |
| `app.exportDXF()` | 1600 | 导出 DXF |

## 附录 B：对象类型完整参考

```typescript
interface Wall {
    type: 'wall';
    id: number;
    x1, y1, x2, y2: number;   // 两端点 (user units)
    thickness: number;         // 墙厚，24 表示 240mm
}

interface Door {
    type: 'door';
    id: number;
    x1, y1, x2, y2: number;   // 门宽
    swing?: 'in' | 'out';     // 保留字段
}

interface Window {
    type: 'window';
    id: number;
    x1, y1, x2, y2: number;
}

interface Furniture {
    type: 'furniture';
    id: number;
    fid: string;              // FURNITURE 列表中的 id
    name: string;
    x, y: number;             // 左上角
    w, h: number;             // 宽高
    rot: number;              // 旋转角度（度）
    color?: string;
}

interface Stairs {
    type: 'stairs';
    id: number;
    x, y, w, h: number;
    rot: number;
    steps: number;            // 踏步数
    dir: 'up' | 'down';
}

interface Text {
    type: 'text';
    id: number;
    x, y: number;             // 基线位置
    text: string;
    size: number;             // 字号
    color: string;
    rot: number;
}
```

## 附录 C：推荐学习资源

**SVG**
- [MDN SVG 教程](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Tutorial)
- [CSS-Tricks: A Complete Guide to SVG](https://css-tricks.com/mega-list-svg-information/)

**2D 图形学**
- [Inigo Quilez 的文章](https://iquilezles.org/articles/) — 特别是 distance functions
- 《计算机图形学》— Foley et al.

**DXF 格式**
- [Autodesk DXF Reference](https://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf)

**事件处理**
- [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) — 统一鼠标/触屏

---

## 许可

代码完全自由使用。作为学习素材分发、修改、商用都可以。

> 🏠 祝你画图愉快！
