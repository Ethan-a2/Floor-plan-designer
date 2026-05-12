# 测试套件

针对 `floor_planner.html` 的 jsdom 集成测试，**零构建、零配置**。

## 快速开始

```bash
bash tests/run.sh                 # 运行全部测试
bash tests/run.sh measure         # 只跑文件名含 "measure" 的
bash tests/run.sh smoke           # 只跑冒烟测试 (最快 <1s)
```

首次运行会自动 `npm install jsdom`（唯一依赖，~150MB，不影响项目本体）。

## 文件清单

| 文件 | 说明 | 测试数 |
|------|------|--------|
| `setup.js` | 共享工具: 加载 HTML/断言/鼠标事件构造 | — |
| `test_smoke.js` | 冒烟测试: 语法 + 关键 API 存在 | ~20 |
| `test_bg_image.js` | 底图/image/svg 对象 + 数据迁移 + 图层操作 | ~24 |
| `test_keyboard.js` | 方向键移动 + Ctrl+C/D 复制 + 防抖历史 | ~18 |
| `test_measure.js` | 皮尺绘制 + 选中 + 端点拖动 + JSON/undo | ~29 |
| `test_rect_window.js` | 矩形地板 + 窗户厚度 | ~27 |
| `run.sh` | 主入口, 自动装依赖 + 批量运行 + 汇总 | — |

## 写一个新测试

```js
// tests/test_my_feature.js
const { loadApp, suite } = require('./setup');

loadApp((app, dom) => {
    const doc = dom.window.document;
    const t = suite('我的新功能');

    t.ok(true, '测试名');
    t.eq(actual, expected, '相等断言');

    t.done();  // 必须调用, 决定 exit code
});
```

然后在 `run.sh` 的 `FILES=(...)` 里加上文件名即可。

## 断言 API

| 方法 | 说明 |
|------|------|
| `t.ok(cond, desc)` | 布尔断言 |
| `t.eq(a, b, desc)` | 深等比较 (JSON 序列化) |
| `t.done()` | 打印汇总，按失败数 exit |

## 工具函数

```js
const { fakeMouseEvent } = require('./setup');

app.onMouseDown(fakeMouseEvent(app, 100, 200));            // 左键
app.onMouseDown(fakeMouseEvent(app, 100, 200, {button:1})); // 中键
```

## 调试技巧

- **看某条失败细节**: 直接 `node tests/test_xxx.js`，输出会详细打印
- **只测单条**: 临时注释其他 `t.ok()` 行
- **检查 DOM**: 在 `loadApp` 回调里 `console.log(doc.body.innerHTML)`
- **查 app 状态**: `console.log(JSON.stringify(app.objects, null, 2))`

## CI 集成

退出码语义：
- `0`: 全部通过
- `1`: 有测试失败
- `2`: 环境/依赖错误

GitHub Actions 样例：

```yaml
- run: bash tests/run.sh
```

## 覆盖面

已覆盖：
- ✅ 底图/通用图像对象 (迁移 + hitTest + 图层 + 隐藏)
- ✅ 皮尺测量 (绘制 + 选中 + 端点 + 面板 + 持久化)
- ✅ 键盘方向键 (GRID/Shift + 墙x1x2 + Ctrl+C + 防抖)
- ✅ 矩形地板 (拖出 + 置底 + 颜色 + 命名)
- ✅ 窗户厚度 (默认 + 修改 + 向后兼容)

未来补充：
- ⬜ 导出 SVG / DXF 的几何正确性
- ⬜ 楼层切换 / 复制 / 删除
- ⬜ 尺寸标注 / 家具渲染
- ⬜ 吸附网格 / 缩放 / 平移视图
