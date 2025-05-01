# MCP client demo for openai

mcp server demo 代码来自 https://modelcontextprotocol.io/quickstart/server#node

mcp client demo 代码来自 https://modelcontextprotocol.io/quickstart/client#node

openai adapter 代码来自 https://github.com/leartbeqiraj1/openai-mcp-client

## 运行/调试

编码时运行环境 node 20.15

创建 .env 并写入配置信息

```bash
touch .env
echo "QWEN_API_KEY=<your key here>" > .env
echo "BASE_URL=<base url here>" > .env
```

安装依赖

```bash
npm install
```

构建

```bash
npm run build
```

调试server

```bash
# 启动inspector服务后访问web gui
# 设置 Command = node, Arguments = build/index.js, 点 connect 即可
npx @modelcontextprotocol/inspector
```

运行chatbot主程序

```bash
# 可以问一个让模型可以触发调用tools的问题, 如 `CA天气怎么样`
node build/client.js build/index.js

# 以下为示例输出
Weather MCP Server running on stdio
Connected to server with tools: [ 'get-alerts', 'get-forecast' ]

MCP Client Started!
Type your queries or 'quit' to exit.

Query: CA天气怎么样

[Calling tool get-alerts with args "{\"state\": \"CA\"}"]
根据您提供的信息，以下是加州（CA）当前的天气状况摘要：

### 1. **海滩危险声明 (Beach Hazards Statement)**
   - **区域**: Orange County Coastal, Malibu Coast, Los Angeles County Beaches
   - **严重程度**: 中等
   - **状态**: 正在生效
   - **有效时间**: 截至4月30日晚上9点
   - **影响**: 海滩可能有强流或其他危险条件。

---

### 2. **特殊天气声明 (Special Weather Statement)**
   - **区域**: 包括Mariposa Madera Foothills、Yosemite国家公园内外、West Slope Northern Sierra Nevada等地区
   - **严重程度**: 中等
   - **状态**: 正在生效
   - **影响**: 这些地区可能面临特殊的天气条件，例如强风或快速变化的天气。

---

### 3. **浓雾警告 (Dense Fog Advisory)**
   - **区域**: Northern Salinas Valley/Hollister Valley、Carmel Valley、Northern Monterey Bay、Southern Monterey Bay和Big Sur Coast
   - **严重程度**: 中等
   - **状态**: 已过期（4月29日早上10点结束）
   - **影响**: 曾经出现浓雾，能见度较低。

---

### 4. **大风警告 (Wind Advisory)**
   - **区域**: 
     - Santa Barbara County Southwestern Coast、Santa Ynez Mountains Western Range
     - Indian Wells Valley、Mojave Desert
     - Apple and Lucerne Valleys、San Diego County Deserts、San Gorgonio Pass Near Banning
   - **严重程度**: 中等到轻微
   - **状态**: 部分已过期，部分仍在生效
   - **影响**: 强风可能导致驾驶困难或对户外活动造成不便。

---

### 5. **高风警告 (High Wind Warning)**
   - **区域**: Mojave Desert Slopes
   - **严重程度**: 严重
   - **状态**: 正在生效
   - **影响**: 高风速可能对建筑物、树木和电力线路造成破坏。

---

### 6. **冬季天气警告 (Winter Weather Advisory)**
   - **区域**:
     - Yosemite国家公园外、San Joaquin River Canyon、Upper San Joaquin River等山区
     - Greater Lake Tahoe Area、Mono县、Western Plumas County/Lassen Park、West Slope Northern Sierra Nevada
   - **严重程度**: 中等
   - **状态**: 正在生效
   - **影响**: 山区可能出现降雪或低温天气，影响交通和户外活动。

---

### 7. **空气质量警报 (Air Quality Alert)**
   - **区域**: Coachella Valley、Imperial County Southwest、Imperial County West、Imperial Valley
   - **严重程度**: 未知
   - **状态**: 正在生效
   - **影响**: 空气质量可能较差，建议敏感人群减少户外活动。

---

### 总结：
- **沿海地区**: 注意海滩危险，避免在强流条件下游泳。
- **山区**: 冬季天气警告持续生效，出行需注意降雪和低温。
- **沙漠和内陆地区**: 强风警告仍然存在，驾驶时需小心。
- **空气质量**: 某些地区空气质量较差，尤其是Coachella Valley和Imperial County。

请根据具体位置和活动计划采取适当的预防措施！
```
