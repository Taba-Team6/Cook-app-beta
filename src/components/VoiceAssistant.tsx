import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Mic, MicOff, ChefHat, ArrowLeft, Sparkles, Volume2, User, Bot, Send } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { speechToText } from "../utils/api";
import { toast } from "sonner@2.0.3";

interface Recipe {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  cookingTime: string;
  image: string;
  description: string;
}

interface VoiceAssistantProps {
  onRecipeSelect: (recipe: Recipe) => void;
  onBack: () => void;
}

const RECIPES: Recipe[] = [
  {
    id: "1",
    name: "김치볶음밥",
    category: "한식",
    difficulty: "쉬움",
    cookingTime: "20분",
    image: "https://images.unsplash.com/photo-1744870132190-5c02d3f8d9f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBmcmllZCUyMHJpY2UlMjBraW1jaGl8ZW58MXx8fHwxNzYyODM1ODQwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "간단하고  만들 수 있는 한국의 대표 요리"
  },
  {
    id: "2",
    name: "스파게티 까르보나라",
    category: "양식",
    difficulty: "보통",
    cookingTime: "30분",
    image: "https://images.unsplash.com/photo-1588013273468-315fd88ea34c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFnaGV0dGklMjBjYXJib25hcmElMjBwYXN0YXxlbnwxfHx8fDE3NjI3Nzc0NDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "크리미한 소스가 일품인 이탈리아 파스타"
  },
  {
    id: "3",
    name: "된장찌개",
    category: "한식",
    difficulty: "쉬움",
    cookingTime: "25분",
    image: "https://images.unsplash.com/photo-1665395876131-7cf7cb099a51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBkb2VuamFuZyUyMGpqaWdhZSUyMHN0ZXd8ZW58MXx8fHwxNzYyODM1ODQwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "구수한 맛이 일품인 한국 전통 찌개"
  },
  {
    id: "4",
    name: "치킨 샐러드",
    category: "샐러드",
    difficulty: "쉬움",
    cookingTime: "15분",
    image: "https://images.unsplash.com/photo-1729719930828-6cd60cb7d10f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlja2VuJTIwc2FsYWQlMjBoZWFsdGh5fGVufDF8fHx8MTc2MjgzNTg0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "신선한 채소와 닭가슴살로 만드는 건강 요리"
  },
  {
    id: "5",
    name: "오므라이스",
    category: "양식",
    difficulty: "보통",
    cookingTime: "25분",
    image: "https://images.unsplash.com/photo-1743148509702-2198b23ede1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbXVyaWNlJTIwamFwYW5lc2UlMjByaWNlfGVufDF8fHx8MTc2MjgzNTg0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "부드러운 계란과 볶음밥의 조화"
  },
  {
    id: "6",
    name: "비빔밥",
    category: "한식",
    difficulty: "보통",
    cookingTime: "35분",
    image: "https://images.unsplash.com/photo-1718777791239-c473e9ce7376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWJpbWJhcCUyMGtvcmVhbiUyMG1peGVkJTIwcmljZXxlbnwxfHx8fDE3NjI4MzU4NDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "다양한 나물과 고기가 어우러진 영양 만점 한 그릇 요리"
  },
  {
    id: "7",
    name: "토마토 파스타",
    category: "양식",
    difficulty: "쉬움",
    cookingTime: "20분",
    image: "https://images.unsplash.com/photo-1751151497799-8b4057a2638e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b21hdG8lMjBwYXN0YSUyMHJlZCUyMHNhdWNlfGVufDF8fHx8MTc2MjgzNTg0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "신선한 토마토로 만드는 상큼한 파스타"
  },
  {
    id: "8",
    name: "새우볶음밥",
    category: "중식",
    difficulty: "보통",
    cookingTime: "25분",
    image: "https://images.unsplash.com/photo-1747228469026-7298b12d9963?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaHJpbXAlMjBmcmllZCUyMHJpY2UlMjBjaGluZXNlfGVufDF8fHx8MTc2MjgzNTg0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "통통한 새우가 들어간 고소한 볶음밥"
  }
];

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  audioUrl?: string;
  recipeToStart?: Recipe; // 요리 시작 준비가 완료된 레시피
}

// 재료 정보 인터페이스
interface RecipeIngredient {
  name: string;
  amount: string;
  alternatives?: string[]; // 대체 가능한 재료들
  optional?: boolean; // 선택적 재료 여부
}

// 레시피별 상세 재료 정보
const RECIPE_INGREDIENTS: { [key: string]: RecipeIngredient[] } = {
  "김치볶음밥": [
    { name: "김치", amount: "1컵", alternatives: ["배추김치", "묵은지"] },
    { name: "밥", amount: "2공기" },
    { name: "달걀", amount: "2개", alternatives: ["계란후라이 없이"] },
    { name: "식용유", amount: "2큰술", alternatives: ["참기름", "올리브유"] },
    { name: "참기름", amount: "1작은술", optional: true },
    { name: "김가루", amount: "약간", optional: true, alternatives: ["참깨", "없이"] },
  ],
  "스파게티 까르보나라": [
    { name: "스파게티 면", amount: "200g" },
    { name: "베이컨", amount: "100g", alternatives: ["햄", "소시지"] },
    { name: "달걀", amount: "2개" },
    { name: "생크림", amount: "100ml", alternatives: ["우유"] },
    { name: "파르메산 치즈", amount: "50g", alternatives: ["체다 치즈", "모짜렐라 치즈"] },
    { name: "마늘", amount: "2쪽", optional: true },
    { name: "후추", amount: "약간" },
  ],
  "치킨 샐러드": [
    { name: "닭가슴살", amount: "150g", alternatives: ["삶은 계란", "참치 캔"] },
    { name: "양상추", amount: "100g", alternatives: ["로메인", "어떤 채소든"] },
    { name: "토마토", amount: "1개", optional: true },
    { name: "오이", amount: "1/2개", optional: true },
    { name: "올리브유", amount: "2큰술", alternatives: ["식용유"] },
    { name: "레몬즙", amount: "1큰술", alternatives: ["식초"] },
  ],
  "된장찌개": [
    { name: "된장", amount: "2큰술" },
    { name: "두부", amount: "1/2모", alternatives: ["없이"] },
    { name: "감자", amount: "1개", optional: true },
    { name: "양파", amount: "1/2개" },
    { name: "대파", amount: "1대", optional: true },
    { name: "마늘", amount: "3쪽" },
    { name: "고추", amount: "1개", optional: true },
  ],
  "오므라이스": [
    { name: "밥", amount: "2공기" },
    { name: "달걀", amount: "3개" },
    { name: "양파", amount: "1/2개" },
    { name: "당근", amount: "1/4개", optional: true },
    { name: "햄", amount: "50g", alternatives: ["소시지", "베이컨"] },
    { name: "케첩", amount: "3큰술" },
    { name: "식용유", amount: "2큰술" },
  ],
  "비빔밥": [
    { name: "밥", amount: "2공기" },
    { name: "시금치", amount: "100g", alternatives: ["어떤 나물이든"] },
    { name: "당근", amount: "1/2개" },
    { name: "콩나물", amount: "100g", optional: true },
    { name: "달걀", amount: "2개" },
    { name: "고추장", amount: "2큰술" },
    { name: "참기름", amount: "1큰술" },
  ],
  "토마토 파스타": [
    { name: "스파게티 면", amount: "200g" },
    { name: "토마토", amount: "4개", alternatives: ["토마토 소스 1병"] },
    { name: "마늘", amount: "5쪽" },
    { name: "올리브유", amount: "3큰술", alternatives: ["식용유"] },
    { name: "양파", amount: "1/2개" },
    { name: "바질", amount: "약간", optional: true, alternatives: ["없이"] },
    { name: "소금", amount: "약간" },
  ],
  "새우볶음밥": [
    { name: "밥", amount: "2공기" },
    { name: "새우", amount: "10마리", alternatives: ["냉동 새우"] },
    { name: "달걀", amount: "2개" },
    { name: "당근", amount: "1/4개", optional: true },
    { name: "완두콩", amount: "50g", optional: true },
    { name: "간장", amount: "2큰술" },
    { name: "식용유", amount: "2큰술" },
  ],
};

export function VoiceAssistant({ onRecipeSelect, onBack }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [textInput, setTextInput] = useState("");
  
  // 대화 상태 관리
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<'idle' | 'recipe_suggested' | 'checking_ingredients' | 'suggesting_alternatives' | 'ready_to_cook'>('idle');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const categories = ["전체", "한식", "양식", "중식", "샐러드"];

  const filteredRecipes = selectedCategory && selectedCategory !== "전체"
    ? RECIPES.filter(recipe => recipe.category === selectedCategory)
    : RECIPES;

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current && isChatOpen) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const startRecording = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('이 브라우저는 음성 녹음을 지원하지 않습니다.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Reset chunks
      audioChunksRef.current = [];
      
      // Create MediaRecorder with webm format
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
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Process the audio
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
      toast.info("음성 녹음 중... 완료되면 버튼을 다시 클릭하세요");
      
    } catch (error: any) {
      // Handle microphone access errors with user-friendly messages
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
      // Call STT API
      const result = await speechToText(audioBlob, "레시피 검색", "음성 검색");
      
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        text: result.text,
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'assistant',
        text: result.response,
        timestamp: new Date(),
        audioUrl: result.audioUrl,
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
      
      toast.success("음성 인식 완료!");
      
      // Play TTS audio if available
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
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      console.error('Error playing audio');
      setIsPlaying(false);
      toast.error('음성 재생 중 오류가 발생했습니다');
    };

    audio.play();
  };

  const handleVoiceCommand = () => {
    if (isListening) {
      stopRecording();
    } else {
      setIsChatOpen(true); // Open chat window when starting voice recording
      startRecording();
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    if (isListening) {
      stopRecording();
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    setConversationState('idle');
    setCurrentRecipe(null);
    setMissingIngredients([]);
    toast.success("대화 내역이 삭제되었습니다");
  };

  const handleSendText = async () => {
    if (!textInput.trim() || isProcessing) return;

    const userText = textInput.trim();
    setTextInput("");
    setIsProcessing(true);

    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        text: userText,
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, userMessage]);

      // Simple AI response logic
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let aiResponseText = "";
      let recipeToStart: Recipe | undefined = undefined;
      const lowerText = userText.toLowerCase();
    } catch (error) {
      console.error('Error sending text:', error);
      toast.error('메시지 전송 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };
  
  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2">AI 음성 보조</h1>
          <p className="text-muted-foreground">
            만들고 싶은 요리를 선택하거나 음성으로 말씀해주세요
          </p>
        </div>

        {/* Voice Input Section */}
        <div className="w-full max-w-2xl mx-auto">
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center">
                <div 
                  className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 transition-all cursor-pointer ${ 
                    isListening 
                      ? "bg-primary animate-pulse shadow-lg shadow-primary/30" 
                      : isProcessing 
                      ? "bg-secondary animate-spin" 
                      : "bg-primary/10 hover:bg-primary/20 hover:scale-105"
                  }`}
                  onClick={handleVoiceCommand}
                >
                  {isListening ? (
                    <MicOff className="w-14 h-14 text-primary-foreground animate-pulse" />
                  ) : isProcessing ? (
                    <Sparkles className="w-14 h-14 text-secondary-foreground" />
                  ) : (
                    <Mic className="w-14 h-14 text-primary" />
                  )}
                </div>
                
                <h2 className="mb-3">
                  {isListening 
                    ? "듣고 있습니다..." 
                    : isProcessing 
                    ? "처리 중..." 
                    : "음성으로 요리 검색"}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  버튼을 눌러 음성으로 말씀해주세요
                </p>

                {/* Show chat message count */}
                {chatMessages.length > 0 && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsChatOpen(true)}
                    className="mt-2"
                  >
                    <Bot className="w-5 h-5 mr-2" />
                    대화 내역 보기 ({chatMessages.length}개 메시지)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Sheet */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 h-full">
          <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              <SheetTitle>AI 음성 대화</SheetTitle>
            </div>
            <SheetDescription>
              음성으로 AI와 화한 내용을 확인할 수 있습니다
            </SheetDescription>
            {chatMessages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="absolute top-4 right-4"
              >
                대 삭제
              </Button>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6 py-4 scrollbar-hide">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Bot className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  아직 대화 내역이 없습니다
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  음성으로 검색 버튼을 눌러 대화를 시작하세요
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {message.audioUrl && message.type === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-8"
                          onClick={() => playAudio(message.audioUrl!)}
                        >
                          <Volume2 className="w-4 h-4 mr-1" />
                          음성 듣기
                        </Button>
                      )}
                      {message.recipeToStart && message.type === 'assistant' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="mt-3 w-full bg-primary hover:bg-primary/90"
                          onClick={() => {
                            onRecipeSelect(message.recipeToStart!);
                            setIsChatOpen(false);
                            // 대화 상태 초기화
                            setConversationState('idle');
                            setCurrentRecipe(null);
                            setMissingIngredients([]);
                          }}
                        >
                          <ChefHat className="w-4 h-4 mr-2" />
                          {message.recipeToStart.name} 요리 시작하기
                        </Button>
                      )}
                    </div>
                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
            </ScrollArea>
          </div>

          <div className="px-6 py-4 border-t bg-muted/50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="flex-1"
                disabled={isProcessing || isListening}
              />
              <Button
                onClick={handleSendText}
                disabled={isProcessing || isListening || !textInput.trim()}
                variant="default"
                size="icon"
                className="flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleVoiceCommand}
                disabled={isProcessing}
                variant={isListening ? "destructive" : "ghost"}
                size="icon"
                className="flex-shrink-0"
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
                듣고 있습니다... 말씀해주세요
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: () => void;
}

function RecipeCard({ recipe, onSelect }: RecipeCardProps) {
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-primary/40"
      onClick={onSelect}
    >
      <div className="aspect-video relative overflow-hidden bg-muted">
        <ImageWithFallback
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg">{recipe.name}</CardTitle>
          <Badge variant="secondary">{recipe.category}</Badge>
        </div>
        <CardDescription>{recipe.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div>⏱️ {recipe.cookingTime}</div>
          <div>📊 {recipe.difficulty}</div>
        </div>
      </CardContent>
    </Card>
  );
}