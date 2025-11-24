import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
});

// All routes require authentication
router.use(authenticateToken);

// ============================================
// Speech-to-Text (STT) + AI Response
// ============================================
router.post('/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided'
      });
    }

    const { currentStep, recipeName } = req.body;
    const audioBuffer = req.file.buffer;

    // Step 1: Google Speech-to-Text
    const googleApiKey = process.env.GOOGLE_CLOUD_API_KEY;
    
    if (!googleApiKey) {
      console.error('Google Cloud API key not configured');
      return res.json({
        text: '음성이 인식되었습니다. (데모 모드)',
        response: '네, 잘 들었습니다. Google Cloud API 키를 설정해주세요.',
        audioUrl: null,
      });
    }

    // Convert buffer to base64
    const audioBase64 = audioBuffer.toString('base64');

    // Call Google Speech API
    let transcribedText = '';
    try {
      const speechResponse = await axios.post(
        `https://speech.googleapis.com/v1/speech:recognize?key=${googleApiKey}`,
        {
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'ko-KR',
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audioBase64,
          },
        }
      );

      transcribedText = speechResponse.data.results?.[0]?.alternatives?.[0]?.transcript || '음성을 인식할 수 없습니다.';
    } catch (error) {
      console.error('Google Speech API error:', error.response?.data || error.message);
      transcribedText = '음성 인식에 실패했습니다.';
    }

    // Step 2: OpenAI GPT-4 Response
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return res.json({
        text: transcribedText,
        response: '네, 잘 들었습니다. OpenAI API 키를 설정해주세요.',
        audioUrl: null,
      });
    }

    let responseText = '';
    try {
      const gptResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `당신은 친절한 요리 보조 AI입니다. 사용자가 ${recipeName || '요리'}를 만들고 있으며, 현재 ${currentStep || '조리 중'}입니다. 사용자의 질문이나 요청에 대해 간단하고 명확하게 답변해주세요. 응답은 2-3문장으로 짧게 해주세요.`,
            },
            {
              role: 'user',
              content: transcribedText,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
        }
      );

      responseText = gptResponse.data.choices?.[0]?.message?.content || '죄송합니다. 응답을 생성할 수 없습니다.';
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      responseText = 'AI 응답 생성에 실패했습니다.';
    }

    // Step 3: Text-to-Speech
    let audioUrl = null;
    try {
      const ttsResult = await convertTextToSpeech(responseText);
      audioUrl = ttsResult.audioUrl;
    } catch (error) {
      console.error('TTS error:', error.message);
    }

    res.json({
      text: transcribedText,
      response: responseText,
      audioUrl,
    });

  } catch (error) {
    console.error('STT processing error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process voice input',
      details: error.message
    });
  }
});

// ============================================
// Text-to-Speech (TTS)
// ============================================
router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'No text provided'
      });
    }

    const result = await convertTextToSpeech(text);

    res.json(result);

  } catch (error) {
    console.error('TTS processing error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to convert text to speech',
      details: error.message
    });
  }
});

// ============================================
// Helper: Text-to-Speech Conversion
// ============================================
async function convertTextToSpeech(text) {
  const googleApiKey = process.env.GOOGLE_CLOUD_API_KEY;
  
  if (!googleApiKey) {
    console.error('Google Cloud API key not configured for TTS');
    return { audioUrl: null };
  }

  try {
    const ttsResponse = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`,
      {
        input: { text },
        voice: {
          languageCode: 'ko-KR',
          name: 'ko-KR-Standard-A',
          ssmlGender: 'FEMALE',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
        },
      }
    );

    const audioContent = ttsResponse.data.audioContent;

    if (!audioContent) {
      return { audioUrl: null };
    }

    // Return base64 audio data URL
    const audioUrl = `data:audio/mp3;base64,${audioContent}`;

    return { audioUrl };

  } catch (error) {
    console.error('TTS conversion error:', error.response?.data || error.message);
    return { audioUrl: null };
  }
}

// ============================================
// Health Check
// ============================================
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      google_speech: !!process.env.GOOGLE_CLOUD_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    }
  });
});

export default router;
