const express = require("express");
const router = express.Router();
const { chatWithGPT, chatFollowup, chatIntent } = require("../controllers/aiController");

// GPT 기본 대화 (레시피 생성)
router.post("/ai/chat", chatWithGPT);

// 🔥 Follow-up 추가: 요리 중 / 재료 부족 / 상황 질문
router.post("/ai/followup", chatFollowup);

router.post("/ai/intent", chatIntent);


module.exports = router;
