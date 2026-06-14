/**
 * 建立一個 ezdcbot 實例
 * @returns {object} 包含 setup 與 push 方法的物件
 */
const createBot = () => {
  let currentToken = null;

  /**
   * 3. 設定 Discord Bot Token
   * @param {string} token - 你的 Discord Bot Token
   */
  const setup = (token) => {
    if (!token) {
      throw new Error('ezdcbot: Token is required for setup.');
    }
    currentToken = token;
  };

  /**
   * 4. 傳送訊息或建立討論串
   * @param {string} targetId - 目標頻道或討論串 ID
   * @param {string|object} content - 訊息內容 (字串或 Embed 物件)，若 type 為 'thread' 則是討論串名稱
   * @param {object} options - 額外選項，例如 { type: 'message' | 'thread' }
   * @returns {Promise<object>} - Discord API 回傳的 JSON 結果
   */
  const push = async (targetId, content, options = { type: 'message' }) => {
    if (!currentToken) {
      throw new Error('ezdcbot: Token is not set. Please call setup(token) first.');
    }
    
    if (!targetId || !content) {
      throw new Error('ezdcbot: targetId and content are required.');
    }

    let url = `https://discord.com/api/v10/channels/${targetId}/messages`;
    let payload = {};

    if (options.type === 'thread') {
      // 建立討論串
      url = `https://discord.com/api/v10/channels/${targetId}/threads`;
      payload = {
        name: typeof content === 'string' ? content : 'New Thread',
        type: 11 // 11 = GUILD_PUBLIC_THREAD
      };
    } else {
      // 發送一般訊息
      // 若為字串則包裝為純文字，若為物件則假設為 Embed
      payload = typeof content === 'string' ? { content } : { embeds: [content] };
    }

    // 5. 執行 HTTP 請求
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${currentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ezdcbot: API Error ${response.status} - ${errorData}`);
    }

    return response.json();
  };

  /**
   * 5. 讀取指定頻道的歷史訊息
   * @param {string} targetId - 目標頻道或討論串 ID
   * @param {number} limit - 讀取的訊息數量上限 (預設 50，最大 100)
   * @param {object} options - 額外選項，預設 { type: 'message' }
   * @returns {Promise<Array>} - 回傳包含訊息物件的陣列
   */
  const pull = async (targetId, limit = 50, options = { type: 'message' }) => {
    if (!currentToken) {
      throw new Error('ezdcbot: Token is not set. Please call setup(token) first.');
    }
    
    if (!targetId) {
      throw new Error('ezdcbot: targetId is required.');
    }

    // 因為 Discord 的 API 設計，讀取頻道訊息和讀取討論串訊息的網址是一樣的！
    // 討論串 (Thread) 在底層也是一個特殊的 Channel。
    // 如果未來有需要讀取頻道內的「所有討論串列表」，可以在這邊用 options.type === 'thread' 分流
    let url = `https://discord.com/api/v10/channels/${targetId}/messages?limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${currentToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ezdcbot: API Error ${response.status} - ${errorData}`);
    }

    return response.json();
  };

  return {
    setup,
    push,
    pull,
  };
};

module.exports = createBot;
