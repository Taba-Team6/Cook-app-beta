import { Hono } from 'npm:hono';
import { verifyUser } from './routes.tsx';

// ============================================
// AI VOICE ASSISTANT ROUTES
// ============================================

export function aiVoiceRoutes() {
  const router = new Hono();

  // STT (Speech-to-Text) endpoint
  router.post('/stt', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      // Get the audio blob from the request
      const formData = await c.req.formData();
      const audioBlob = formData.get('audio');
      const currentStep = formData.get('currentStep');
      const recipeName = formData.get('recipeName');

      if (!audioBlob) {
        return c.json({ error: 'No audio file provided' }, 400);
      }

      // Convert blob to base64 for Google Speech API
      const audioBuffer = await (audioBlob as Blob).arrayBuffer();
      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

      // Call Google Speech-to-Text API
      const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
      
      if (!googleApiKey) {
        console.error('Google Cloud API key not configured');
        // Fallback: return mock response
        return c.json({
          text: '음성이 인식되었습니다. (데모 모드)',
          response: '네, 잘 들었습니다. 다음 단계로 진행하세요.',
          audioUrl: null,
        });
      }

      const speechResponse = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 48000,
              languageCode: 'ko-KR',
              enableAutomaticPunctuation: true,
            },
            audio: {
              content: audioBase64,
            },
          }),
        }
      );

      if (!speechResponse.ok) {
        const errorText = await speechResponse.text();
        console.error('Google Speech API error:', errorText);
        throw new Error('Failed to transcribe audio');
      }

      const speechData = await speechResponse.json();
      const transcribedText = speechData.results?.[0]?.alternatives?.[0]?.transcript || '음성을 인식할 수 없습니다.';

      // Call OpenAI GPT for cooking advice
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (!openaiApiKey) {
        console.error('OpenAI API key not configured');
        return c.json({
          text: transcribedText,
          response: '네, 잘 들었습니다. OpenAI 설정이 필요합니다.',
          audioUrl: null,
        });
      }

      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
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
        }),
      });

      if (!gptResponse.ok) {
        const errorText = await gptResponse.text();
        console.error('OpenAI API error:', errorText);
        throw new Error('Failed to get GPT response');
      }

      const gptData = await gptResponse.json();
      const responseText = gptData.choices?.[0]?.message?.content || '죄송합니다. 응답을 생성할 수 없습니다.';

      // Call TTS to convert response to speech
      const ttsResult = await convertTextToSpeech(responseText);

      return c.json({
        text: transcribedText,
        response: responseText,
        audioUrl: ttsResult.audioUrl,
      });

    } catch (error) {
      console.error('STT processing error:', error);
      return c.json({ 
        error: 'Failed to process voice input',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  // TTS (Text-to-Speech) endpoint
  router.post('/tts', async (c) => {
    const { error, user } = await verifyUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const { text } = await c.req.json();

      if (!text) {
        return c.json({ error: 'No text provided' }, 400);
      }

      const result = await convertTextToSpeech(text);

      return c.json(result);

    } catch (error) {
      console.error('TTS processing error:', error);
      return c.json({ 
        error: 'Failed to convert text to speech',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  return router;
}

// Helper function to convert text to speech
async function convertTextToSpeech(text: string) {
  const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
  
  if (!googleApiKey) {
    console.error('Google Cloud API key not configured for TTS');
    return { audioUrl: null };
  }

  try {
    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Google TTS API error:', errorText);
      return { audioUrl: null };
    }

    const ttsData = await ttsResponse.json();
    const audioContent = ttsData.audioContent;

    if (!audioContent) {
      return { audioUrl: null };
    }

    // Convert base64 audio to blob and save to temporary file
    const audioBuffer = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
    const fileName = `/tmp/tts_${Date.now()}.mp3`;
    
    await Deno.writeFile(fileName, audioBuffer);

    // In production, you would upload this to S3/CDN
    // For now, we'll return the base64 data directly
    const audioUrl = `data:audio/mp3;base64,${audioContent}`;

    return { audioUrl };

  } catch (error) {
    console.error('TTS conversion error:', error);
    return { audioUrl: null };
  }
}
