// aiController.js
const { askGPT, askGPTFollowup } = require("../services/aiService");

// ★★★ GPT 기본 레시피 생성 API
exports.chatWithGPT = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const reply = await askGPT(message); // JSON 문자열
    res.json({ reply });
  } catch (err) {
    console.error("GPT Error:", err);
    res.status(500).json({ error: "GPT API error" });
  }
};

// ★★★ Follow-up API (레시피도 같이 업데이트됨)
exports.chatFollowup = async (req, res) => {
  try {
    const { recipe, question } = req.body;

    console.log("FOLLOW-UP BODY:", req.body);

    const result = await askGPTFollowup(recipe, question);

    console.log("FOLLOW-UP RESULT:", result);  // 🔥 진짜 GPT 응답 찍기

    res.json(result);
  } catch (err) {
    console.error("GPT Follow-up Error:", err);
    res.status(500).json({ error: "GPT follow-up failed" });
  }
};


// 의도 감지 API
exports.chatIntent = async (req, res) => {
  try {
    const { text } = req.body;
    const intent = await askIntent(text);
    res.json({ intent });
  } catch (err) {
    console.error("Intent Error:", err);
    res.status(500).json({ error: "intent fail" });
  }
};
