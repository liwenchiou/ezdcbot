// server.js
// 這是一個 Web Server 的整合範例，示範如何將 ezdcbot 放入 API 路由中
// 給使用者作為「如何在自己的系統中整合」的參考寫法

const http = require('http');
const createBot = require('./index');

// 1. 初始化並設定 ezdcbot
const ezdcbot = createBot();
// (實務上通常會從環境變數讀取)
const token = process.env.DISCORD_BOT_TOKEN || 'YOUR_DISCORD_BOT_TOKEN_HERE';
ezdcbot.setup(token);

// 2. 建立使用者的 Web Server
const server = http.createServer((req, res) => {
  // 示範：當收到 POST 請求時觸發 Discord 推播
  // 例如接收來自 GitHub、Stripe 等第三方 Webhook 服務的呼叫
  if (req.url === '/webhook' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk.toString(); });
    
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyData);
        // 假設收到的請求中帶有 content 欄位
        const customMessage = payload.content || '（預設 Webhook 通知）';
        const channelId = process.env.DISCORD_CHANNEL_ID || 'YOUR_CHANNEL_ID_HERE';
        
        // 3. 將收到的內容推播到 Discord
        const result = await ezdcbot.push(channelId, customMessage);
        
        // 4. 回應客戶端成功
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Webhook 接收成功並已推播到 Discord！', data: result.id }));
      } catch (error) {
        console.error('推播失敗:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    // 首頁回傳說明
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>ezdcbot 整合範例伺服器</h1><p>請發送 POST 請求至 <code>/webhook</code> 進行推播測試。</p>');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Web Server 已經在 http://localhost:${PORT} 啟動`);
  console.log('💡 此為 ezdcbot 與 Web Server 結合的參考寫法');
});
