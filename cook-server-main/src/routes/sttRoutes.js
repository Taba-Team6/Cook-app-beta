const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const { stt } = require("../services/aiService");

router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "audio 파일이 없습니다." });
    }

    const audioBuffer = req.file.buffer;
    const text = await stt(audioBuffer);

    return res.json({ text }); // { text: "인식된 문장" }
  } catch (err) {
    console.error("STT Error:", err);
    res.status(500).json({ error: "STT 실패" });
  }
});

module.exports = router;
