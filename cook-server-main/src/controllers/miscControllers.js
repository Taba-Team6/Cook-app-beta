// src/controllers/miscControllers.js

// @desc    서버 헬스 체크
// @route   GET /health
exports.healthCheck = async (req, res) => { //
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
};

// @desc    STT (Speech to Text) API
// @route   POST /ai/voice/stt
exports.speechToText = async (req, res) => { //
    // 실제 구현은 AI 서비스와의 통신 로직이 필요합니다.
    // 클라이언트에서 audioBlob, currentStep, recipeName을 FormData로 받습니다.

    // 단순 목업 응답
    const userMessage = req.body.currentStep ? '다음 단계를 읽어줘' : '닭볶음탕 레시피 알려줘';
    const isSuccess = req.files && req.files.audio ? true : false;

    if (!isSuccess) {
        // 파일 업로드 실패 또는 인증 오류 등의 로직이 필요합니다.
        // 현재 Express 환경에서 Multer와 같은 미들웨어를 사용해야 파일 처리가 가능합니다.
        // 여기서는 파일이 있다고 가정하고 로직을 진행합니다.
    }

    res.status(200).json({
        success: true,
        data: {
            text: `(STT 결과) 사용자 요청: ${userMessage}`,
            action: userMessage.includes('다음') ? 'next_step' : 'search_recipe'
        }
    });
};

// @desc    TTS (Text to Speech) API
// @route   POST /ai/voice/tts
exports.textToSpeech = async (req, res) => { //
    // 실제 구현은 텍스트를 오디오 데이터로 변환하는 AI 서비스와의 통신 로직이 필요합니다.
    // 클라이언트에서 body에 { text: string }을 보냅니다.
    const { text } = req.body;

    // 단순 목업 응답: 실제로는 오디오 파일을 스트림하거나 base64로 인코딩하여 반환해야 합니다.
    res.status(200).json({
        success: true,
        data: {
            audioUrl: `/mock/audio/for/${encodeURIComponent(text)}`,
            message: `(TTS 결과) 텍스트를 오디오로 변환했습니다: ${text}`
        }
    });
};