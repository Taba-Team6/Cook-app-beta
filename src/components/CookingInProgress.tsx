import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Volume2,
  VolumeX,
  Timer,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mic,
  MicOff
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { speechToText } from "../utils/api";
import { toast } from "sonner";

interface Recipe {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  cookingTime: string;
  image: string;
  description: string;
}

interface CookingStep {
  id: string;
  description: string;
  duration?: number; // 분 단위
  tips?: string;
}

interface CookingInProgressProps {
  recipe: Recipe;
  onComplete: () => void;
  onBack: () => void;
}

// Mock data - 실제로는 레시피 ID에 따라 다른 단계를 보여줘야 함
const getStepsForRecipe = (recipeId: string): CookingStep[] => {
  const baseSteps: { [key: string]: CookingStep[] } = {
    "1": [ // 김치볶음밥
      {
        id: "1",
        description: "프라이팬에 식용유를 두르고 중불로 예열합니다.",
        duration: 1,
        tips: "프라이팬이 충분히 달궈져야 밥이 눌러붙지 않습니다."
      },
      {
        id: "2",
        description: "김치를 잘게 썰어서 프라이팬에 넣고 볶습니다.",
        duration: 2,
        tips: "김치를 먼저 볶으면 김치의 맛이 더 깊어집니다."
      },
      {
        id: "3",
        description: "돼지고기를 넣고 함께 볶아줍니다.",
        duration: 3,
        tips: "고기가 완전히 익을 때까지 볶아주세요."
      },
      {
        id: "4",
        description: "밥을 넣고 주걱으로 으깨면서 골고루 볶습니다.",
        duration: 4,
        tips: "밥알이 하나하나 분리되도록 잘 으깨주세요."
      },
      {
        id: "5",
        description: "참기름을 넣고 마지막으로 한번 더 볶습니다.",
        duration: 1,
        tips: "참기름은 마지막에 넣어야 고소한 향이 살아납니다."
      },
      {
        id: "6",
        description: "그릇에 담고 김을 올려서 완성합니다.",
        duration: 1,
        tips: "김은 먹기 직전에 올려야 바삭합니다."
      }
    ],
    "2": [ // 스파게티 까르보나라
      {
        id: "1",
        description: "큰 냄비에 물을 끓이고 소금을 넣어 스파게티 면을 삶습니다.",
        duration: 8,
        tips: "면수를 나중에 사용하니까 1/2컵 정도 따로 빼두세요."
      },
      {
        id: "2",
        description: "볼에 달걀과 파르메산 치즈를 넣고 잘 섞습니다.",
        duration: 2,
        tips: "달걀이 익지 않도록 나중에 불을 끄고 섞어야 합니다."
      },
      {
        id: "3",
        description: "팬에 베이컨을 넣고 바삭하게 볶습니다.",
        duration: 5,
        tips: "베이컨에서 나오는 기름으로 요리하므로 별도 기름은 필요 없습니다."
      },
      {
        id: "4",
        description: "익은 면을 팬에 넣고 베이컨과 함께 섞어줍니다.",
        duration: 1,
        tips: "면수를 조금씩 넣으면서 농도를 맞추세요."
      },
      {
        id: "5",
        description: "불을 끄고 달걀 치즈 혼합물을 넣고 빠르게 섞습니다.",
        duration: 2,
        tips: "불이 켜진 상태에서 넣으면 달걀이 스크램블이 됩니다."
      },
      {
        id: "6",
        description: "생크림을 넣고 부드럽게 섞은 후 후추를 뿌려 완성합니다.",
        duration: 1,
        tips: "크림은 기호에 따라 양을 조절하세요."
      }
    ],
    "3": [ // 된장찌개
      {
        id: "1",
        description: "냄비에 물을 붓고 중불에 올립니다.",
        duration: 2,
        tips: "멸치 육수를 사용하면 더 깊은 맛이 납니다."
      },
      {
        id: "2",
        description: "감자와 양파, 애호박을 한입 크기로 썰어 넣습니다.",
        duration: 3,
        tips: "감자는 먼저 넣어야 충분히 익습니다."
      },
      {
        id: "3",
        description: "된장을 풀어서 넣고 끓입니다.",
        duration: 5,
        tips: "된장은 체에 걸러서 넣으면 덩어리가 없어집니다."
      },
      {
        id: "4",
        description: "두부를 넣고 중약불로 줄여 5분간 더 끓입니다.",
        duration: 5,
        tips: "두부는 너무 오래 끓이면 부서지니 주의하세요."
      },
      {
        id: "5",
        description: "대파와 청양고추를 넣고 한소끔 끓여 완성합니다.",
        duration: 2,
        tips: "대파와 고추는 마지막에 넣어야 향이 살아납니다."
      }
    ]
  };

  return baseSteps[recipeId] || [
    {
      id: "1",
      description: "재료를 준비합니다.",
      duration: 5,
      tips: "모든 재료를 미리 준비해두면 조리가 수월합니다."
    },
    {
      id: "2",
      description: "조리를 시작합니다.",
      duration: 10,
      tips: "레시피를 잘 따라해주세요."
    },
    {
      id: "3",
      description: "마무리하고 완성합니다.",
      duration: 5,
      tips: "맛있게 드세요!"
    }
  ];
};

export function CookingInProgress({ recipe, onComplete, onBack }: CookingInProgressProps) {
  const steps = getStepsForRecipe(recipe.id);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStep = steps[currentStepIndex];
  const progress = (completedSteps.size / steps.length) * 100;
  const isLastStep = currentStepIndex === steps.length - 1;
  const allStepsCompleted = completedSteps.size === steps.length;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            // 타이머 완료 알림 (실제로는 음성이나 알림음)
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  // 음성 가이드 시뮬레이션
  useEffect(() => {
    if (isPlaying && voiceEnabled) {
      console.log(`음성 재생: ${currentStep.description}`);
    }
  }, [isPlaying, currentStep, voiceEnabled]);

  const handleNextStep = () => {
    // 현재 단계를 완료 목록에 추가
    setCompletedSteps(new Set(completedSteps).add(currentStep.id));
    
    if (!isLastStep) {
      setCurrentStepIndex(currentStepIndex + 1);
      setIsPlaying(false);
      setTimerActive(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setIsPlaying(false);
      setTimerActive(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStartTimer = () => {
    if (currentStep.duration) {
      setTimerSeconds(currentStep.duration * 60);
      setTimerActive(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('이 브라우저는 음성 녹음을 지원하지 않습니다.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
      toast.info("음성 녹음 중... 질문을 말씀하세요");
      
    } catch (error: any) {
      // Only log to console for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('마이크 접근 오류 (사용자가 권한을 거부했거나 마이크가 없음):', error.name);
      }
      
      if (error.name === 'NotAllowedError') {
        toast.error('마이크 권한이 필요합니다', {
          description: '브라우저 주소창의 🔒 아이콘을 클릭하여 마이크 권한을 허용해주세요.',
          duration: 6000,
        });
      } else if (error.name === 'NotFoundError') {
        toast.error('마이크를 찾을 수 없습니다', {
          description: '마이크가 연결되어 있는지 확인해주세요.',
          duration: 5000,
        });
      } else if (error.name === 'NotReadableError') {
        toast.error('마이크에 접근할 수 없습니다', {
          description: '다른 프로그램에서 마이크를 사용 중일 수 있습니다.',
          duration: 5000,
        });
      } else {
        toast.error('음성 녹음을 시작할 수 없습니다', {
          description: '브라우저 설정을 확인하거나 페이지를 새로고침 해보세요.',
          duration: 5000,
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      const result = await speechToText(
        audioBlob, 
        `단계 ${currentStepIndex + 1}: ${currentStep.description}`,
        recipe.name
      );
      
      setAiResponse(result.response);
      toast.success("AI 응답을 받았습니다!");
      
      if (result.audioUrl) {
        playAudio(result.audioUrl);
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('음성 처리 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      console.error('Error playing audio');
      toast.error('음성 재생 중 오류가 발생했습니다');
    };

    audio.play();
  };

  const handleVoiceAssistant = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            뒤로가기
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{recipe.category}</Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
            >
              {voiceEnabled ? (
                <Volume2 className="w-5 h-5 text-primary" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* 진행률 */}
        <Card className="mb-6 border-2 border-primary/30">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-primary" />
                  <h2>{recipe.name}</h2>
                </div>
                <span className="text-sm text-muted-foreground">
                  {completedSteps.size} / {steps.length} 단계 완료
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 현재 단계 카드 */}
            <Card className="border-2 border-primary/40 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-2">
                      단계 {currentStepIndex + 1}
                    </CardTitle>
                    {currentStep.duration && (
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        예상 시간: {currentStep.duration}분
                      </CardDescription>
                    )}
                  </div>
                  {completedSteps.has(currentStep.id) && (
                    <Badge className="bg-primary text-primary-foreground">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      완료
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 단계 설명 */}
                <div className="bg-card p-6 rounded-lg border-2 border-border">
                  <p className="text-lg leading-relaxed">{currentStep.description}</p>
                </div>

                {/* 음성 가이드 상태 */}
                {voiceEnabled && (
                  <Alert className="bg-primary/5 border-primary/30">
                    <Volume2 className="h-5 w-5 text-primary" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>
                          {isPlaying ? "음성 가이드 재생 중..." : "음성 가이드 준비됨"}
                        </span>
                        {isPlaying && (
                          <div className="flex gap-1">
                            <div className="w-1 h-4 bg-primary animate-pulse" />
                            <div className="w-1 h-4 bg-primary animate-pulse delay-75" />
                            <div className="w-1 h-4 bg-primary animate-pulse delay-150" />
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* 팁 */}
                {currentStep.tips && (
                  <Alert className="bg-accent/10 border-accent/30">
                    <AlertCircle className="h-5 w-5 text-accent" />
                    <AlertDescription>
                      <span className="font-semibold">조리 팁: </span>
                      {currentStep.tips}
                    </AlertDescription>
                  </Alert>
                )}

                {/* 타이머 */}
                {currentStep.duration && (
                  <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Timer className="w-8 h-8 text-accent" />
                          <div>
                            <p className="text-sm text-muted-foreground">타이머</p>
                            <p className="text-2xl font-mono">
                              {timerActive ? formatTime(timerSeconds) : `${currentStep.duration}:00`}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleStartTimer}
                          disabled={timerActive}
                          variant={timerActive ? "secondary" : "default"}
                          size="lg"
                        >
                          {timerActive ? "진행 중" : "타이머 시작"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 컨트롤 버튼들 */}
                <div className="space-y-4">
                  {/* 음성 컨트롤 */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handlePreviousStep}
                      disabled={currentStepIndex === 0}
                      className="flex-1"
                    >
                      <SkipBack className="w-5 h-5 mr-2" />
                      이전
                    </Button>
                    <Button
                      size="lg"
                      onClick={handlePlayPause}
                      disabled={!voiceEnabled}
                      className="flex-1"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          일시정지
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          음성 듣기
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleNextStep}
                      disabled={isLastStep && allStepsCompleted}
                      className="flex-1"
                    >
                      다음
                      <SkipForward className="w-5 h-5 ml-2" />
                    </Button>
                  </div>

                  {/* 단계 완료 버튼 */}
                  <Button
                    size="lg"
                    onClick={handleNextStep}
                    className="w-full"
                    variant={completedSteps.has(currentStep.id) ? "secondary" : "default"}
                  >
                    {completedSteps.has(currentStep.id) ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        이 단계 완료됨
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        {isLastStep ? "마지막 단계 완료" : "이 단계 완료하고 다음으로"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 전체 단계 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>전체 조리 과정</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        index === currentStepIndex
                          ? "border-primary/40 bg-primary/5"
                          : completedSteps.has(step.id)
                          ? "border-primary/20 bg-primary/5 opacity-70"
                          : "border-border hover:border-primary/20 hover:bg-muted"
                      }`}
                      onClick={() => {
                        setCurrentStepIndex(index);
                        setIsPlaying(false);
                        setTimerActive(false);
                      }}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          completedSteps.has(step.id)
                            ? "bg-primary text-primary-foreground"
                            : index === currentStepIndex
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {completedSteps.has(step.id) ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={
                            index === currentStepIndex
                              ? "font-medium"
                              : completedSteps.has(step.id)
                              ? "text-muted-foreground line-through"
                              : "text-muted-foreground"
                          }
                        >
                          {step.description}
                        </p>
                        {step.duration && (
                          <p className="text-sm text-muted-foreground mt-1">
                            ⏱️ {step.duration}분
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 레시피 이미지 */}
            <Card className="overflow-hidden">
              <ImageWithFallback
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-48 object-cover"
              />
              <CardContent className="pt-4">
                <h3 className="mb-2">{recipe.name}</h3>
                <p className="text-sm text-muted-foreground">{recipe.description}</p>
              </CardContent>
            </Card>

            {/* 요리 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>요리 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">난이도</span>
                  <Badge variant="secondary">{recipe.difficulty}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">예상 시간</span>
                  <span>{recipe.cookingTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">카테고리</span>
                  <span>{recipe.category}</span>
                </div>
              </CardContent>
            </Card>

            {/* AI 음성 보조 */}
            <Card className="border-2 border-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-secondary" />
                  AI 음성 보조
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  요리 중 궁금한 점을 물어보세요
                </p>
                <Button
                  onClick={handleVoiceAssistant}
                  disabled={isProcessing}
                  variant={isListening ? "destructive" : "secondary"}
                  className="w-full"
                  size="lg"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      녹음 중지
                    </>
                  ) : isProcessing ? (
                    "처리 중..."
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      질문하기
                    </>
                  )}
                </Button>
                {aiResponse && (
                  <div className="bg-secondary/10 rounded-lg p-3 text-sm">
                    <p className="text-secondary font-medium mb-1">AI 답변:</p>
                    <p className="text-foreground">{aiResponse}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 완료 버튼 */}
            {allStepsCompleted && (
              <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="mb-2">요리 완성! 🎉</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    모든 단계를 완료했습니다.
                  </p>
                  <Button onClick={onComplete} className="w-full" size="lg">
                    완료하고 피드백 남기기
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}