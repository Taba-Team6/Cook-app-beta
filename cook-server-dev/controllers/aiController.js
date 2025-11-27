// aiController.js (ESM 버전)
import { askGPT, askGPTFollowup, askIntent } from "../services/aiService.js";

// ===============================================
// ★ GPT 기본 레시피 생성 API
// ===============================================
export const chatWithGPT = async (req, res) => {
  try {
    const { message, profile } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const reply = await askGPT(message, profile);
    res.json({ reply });
  } catch (err) {
    console.error("GPT Error:", err);
    res.status(500).json({ error: "GPT API error" });
  }
};

// ===============================================
// ★ Follow-up API (레시피 업데이트 포함)
// ===============================================
export const chatFollowup = async (req, res) => {
  try {
    const { recipe, question, profile } = req.body;

    console.log("FOLLOW-UP BODY:", req.body);

    const result = await askGPTFollowup(recipe, question, profile);

    console.log("FOLLOW-UP RESULT:", result);

    res.json(result);
  } catch (err) {
    console.error("GPT Follow-up Error:", err);
    res.status(500).json({ error: "GPT follow-up failed" });
  }
};

// ===============================================
// ★ 의도 감지 API
// ===============================================
export const chatIntent = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const intent = await askIntent(text);

    res.json({ intent });
  } catch (err) {
    console.error("Intent Error:", err);
    res.status(500).json({ error: "intent fail" });
  }
};
