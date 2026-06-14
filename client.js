// client.js
// 這是一個簡單的測試腳本，不依賴任何 Web Server
// 開發者可以直接執行這個檔案來測試 Bot 是否正常運作

const createBot = require('./index');
const ezdcbot = createBot();

const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DISCORD_CHANNEL_ID;

if (!token || !channelId) {
  console.error('⚠️ 請先在 .env 檔案中設定 DISCORD_BOT_TOKEN 與 DISCORD_CHANNEL_ID');
  process.exit(1);
}

ezdcbot.setup(token);

(async () => {
  try {
    console.log('=== 開始 ezdcbot 5 大功能火力展示 ===\n');

    // 1. 發頻道訊息
    console.log('[1/5] 正在發送一般頻道訊息...');
    const msg = await ezdcbot.push(channelId, '🚀 這是一則來自 ezdcbot 的頻道測試訊息！');
    console.log(`✅ 成功！(訊息 ID: ${msg.id})\n`);

    // 2. 讀頻道訊息
    console.log('[2/5] 正在讀取頻道最新 1 筆訊息...');
    const msgs = await ezdcbot.pull(channelId, 1);
    console.log(`✅ 成功讀取！最新訊息內容：「${msgs[0].content}」\n`);

    // 3. 在頻道中開討論串
    console.log('[3/5] 正在建立新的討論串...');
    const threadName = `測試討論串-${Date.now()}`;
    const thread = await ezdcbot.push(channelId, threadName, { type: 'thread' });
    const threadId = thread.id;
    console.log(`✅ 成功建立！(討論串 ID: ${threadId}, 名稱: ${thread.name})\n`);

    // 4. 在討論串發訊息
    console.log('[4/5] 正在向剛剛建立的討論串內發送訊息...');
    const threadMsg = await ezdcbot.push(threadId, '🧵 嗨！我在討論串裡面說話囉！');
    console.log(`✅ 成功在討論串內發言！(訊息 ID: ${threadMsg.id})\n`);

    // 5. 讀取討論串訊息
    console.log('[5/5] 正在讀取討論串內的最新訊息...');
    const threadMsgs = await ezdcbot.pull(threadId, 2);
    console.log(`✅ 成功讀取！討論串目前有 ${threadMsgs.length} 則訊息。`);
    console.log(`💬 最新一則內容：「${threadMsgs[0].content}」\n`);

    console.log('🎉 全部 5 項功能測試完美通過！');

  } catch (error) {
    console.error('\n❌ 測試過程中發生錯誤：', error.message);
  }
})();
