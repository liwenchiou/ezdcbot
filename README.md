# ezdcbot

A lightweight, **zero-dependency** Discord bot push library for Serverless and Node.js.

> 告別龐大且複雜的 `discord.js`，只需要短短幾行程式碼，就能輕鬆將訊息推播到指定的 Discord 頻道或討論串！非常適合用於 Serverless 平台 (Vercel, AWS Lambda) 或是簡單的事件通知腳本。

## 🚀 特色
- **極致輕量**：安裝體積極小，完全無第三方 npm 依賴 (Zero Dependency)。
- **極簡 API**：只需要 `setup`, `push`, `pull` 三個方法，就能打通頻道與討論串的雙向溝通。
- **支援 Node.js 原生**：底層直接呼叫原生 `fetch` API 打向 Discord 官方 REST API (支援 Node.js 18+)。
- **Serverless 友善**：不需維持常駐 WebSocket 連線，隨用隨棄。

## 📦 安裝

```bash
npm install ezdcbot
```

## 🛠️ 事前準備
在使用之前，請先確保你已經有：
1. 你的 Discord Bot Token ([前往 Discord Developer Portal 建立](https://discord.com/developers/applications))
2. 目標頻道的 Channel ID (對著頻道按右鍵即可複製)

## 📖 核心功能與用法 (Quick Start)

首先，在你的專案中引入並設定 Token：

```javascript
const createBot = require('ezdcbot');

// 1. 建立機器人實例
const ezdcbot = createBot();

// 2. 設定你的 Bot Token
ezdcbot.setup('YOUR_DISCORD_BOT_TOKEN');
```

接下來，你可以使用以下 5 大核心功能：

### 1. 發送與讀取頻道訊息 (Push & Pull)
```javascript
// 發送純文字訊息
await ezdcbot.push('CHANNEL_ID', '🚀 這是一則來自 ezdcbot 的推播通知！');

// 發送 Embed (格式化圖文)，只要傳入 Object 即可自動轉換
await ezdcbot.push('CHANNEL_ID', {
  title: '系統通知',
  description: '這是一張 Embed 卡片',
  color: 16711680 // 顏色代碼
});

// 讀取頻道歷史訊息 (第二個參數為數量，預設 50，最大 100)
const messages = await ezdcbot.pull('CHANNEL_ID', 10);
console.log(`最新一則訊息：${messages[0].content}`);
```

### 2. 討論串操作 (Threads)
在 Discord API 的底層設計中，討論串被視為一種「特殊的頻道」。因此除了「建立」之外，讀寫討論串的方法與一般頻道**完全相同**！

```javascript
// 建立新討論串 (無中生有)
// 加入 { type: 'thread' } 選項，此時第二個參數為建立的討論串名稱
const newThread = await ezdcbot.push('CHANNEL_ID', '自動建立的測試討論串', { type: 'thread' });
const threadId = newThread.id;

// 發送訊息到指定的討論串 (直接填入討論串 ID 當作 targetId 即可)
await ezdcbot.push(threadId, '🧵 成功在討論串裡面發言！');

// 讀取討論串歷史訊息
const threadMsgs = await ezdcbot.pull(threadId, 5);
```

## 💡 真實情境應用範例：每日進度小幫手
身為一個開發者，你可以輕易將 `ezdcbot` 結合自己的排程（例如 `node-cron`），寫出實用的自動化腳本。

例如：**「每天早上自動發送天氣並開啟今日進度討論串，下班時自動讀取討論串做總結」**

```javascript
const createBot = require('ezdcbot');
const bot = createBot();
bot.setup('YOUR_DISCORD_BOT_TOKEN');

const CHANNEL_ID = 'YOUR_CHANNEL_ID';

async function runDailyWorkflow() {
  // 1. 早上：用 Embed 發送漂亮的圖文卡片
  await bot.push(CHANNEL_ID, {
    title: '☀️ 團隊早安！',
    description: '又是個適合寫程式碼的好日子。',
    color: 16766720
  });

  // 2. 早上：自動無中生有開一個「今日進度」討論串
  const threadName = `📅 ${new Date().toLocaleDateString()} 每日進度回報`;
  const todayThread = await bot.push(CHANNEL_ID, threadName, { type: 'thread' });
  
  // 3. 早上：在剛建好的討論串裡 Tag 大家
  await bot.push(todayThread.id, '大家早安！請把今天預計要修的 Bug 貼在這裡喔！🚀');

  // ------- 假設經過了 8 小時到了下班時間 -------

  // 4. 下班：自動讀取該討論串的對話紀錄（抓取最新 20 筆）
  const messages = await bot.pull(todayThread.id, 20);
  
  // 過濾掉機器人自己發的第一句話
  const userReports = messages.filter(msg => msg.author.bot === false);
  
  console.log(`今天共有 ${userReports.length} 則團隊回報：`);
  userReports.forEach(msg => {
    console.log(`📌 ${msg.author.username} 說：${msg.content}`);
  });
  
  // 💡 接下來你可以把這些對話紀錄丟給 ChatGPT 做摘要，然後再 push 到主頻道！
}

runDailyWorkflow();
```

## 🌐 整合範例：Web Server (Express.js)
如果你想要在自己的 API 伺服器中接收第三方 Webhook 並轉發到 Discord，程式碼會非常乾淨：

```javascript
const express = require('express');
const createBot = require('ezdcbot');

const app = express();
app.use(express.json());

// 只需要在伺服器最外層 setup 一次
const notifyBot = createBot();
notifyBot.setup(process.env.DISCORD_BOT_TOKEN);

app.post('/webhook', async (req, res) => {
  try {
    const customMessage = req.body.message || '收到一筆新通知！';
    
    // 隨時在需要的路由呼叫 push，非同步發送
    await notifyBot.push(process.env.DISCORD_CHANNEL_ID, customMessage);
    
    res.send('成功推播至 Discord！');
  } catch (error) {
    res.status(500).send('推播失敗');
  }
});

app.listen(3000, () => console.log('Server is running!'));
```

## ⚠️ 錯誤處理
`ezdcbot` 會幫你攔截 Discord API 回傳的錯誤，如果 Token 無效或是頻道 ID 錯誤，會直接拋出清楚的錯誤訊息與 HTTP 狀態碼，方便你進行除錯。

## 📝 License
MIT License
