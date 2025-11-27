// === VoiceAssistant.tsx (최신 통합 완성 버전) ===
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Mic, MicOff, Bot, User, Send } from "lucide-react";
import { toast } from "sonner";
import { askGPT_raw, speechToText, askCookingFollowup } from "../utils/api";
import type { Recipe } from "../types/recipe";
import { speakText, stopSpeaking } from "../utils/tts";
import { Progress } from "./ui/progress";
import type { UserProfile } from "./ProfileSetup";

interface VoiceAssistantProps {
  onRecipeSelect: (recipe: Recipe) => void;
  onBack: () => void;
  initialRecipe?: Recipe | null;
  userProfile: UserProfile | null;   // ⭐ 추가
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface FollowupResult {
  assistantMessage: string;
  recipe: Recipe;
}


export function VoiceAssistant({ onRecipeSelect, onBack, initialRecipe, userProfile }: VoiceAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");

  const [recipeInfo, setRecipeInfo] = useState<Recipe | null>(initialRecipe ?? null);
  const [ingredientsChecked, setIngredientsChecked] = useState(false);
  const [cookingStarted, setCookingStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
  // 처음에 초기 레시피로 들어온 경우
  if (initialRecipe) {
    setRecipeInfo(initialRecipe);
    setIngredientsChecked(false);
    setCookingStarted(false);
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setIsFinished(false);

    const ingredientsText = initialRecipe.fullIngredients?.join("\n") ?? "";
    if (ingredientsText) {
      addMessage(
        `${initialRecipe.recipeName ?? ""} 재료 목록입니다:\n${ingredientsText}\n\n빠진 재료가 있으면 말해주세요!`,
        "assistant"
      );
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [initialRecipe]);


  const totalSteps = recipeInfo?.steps?.length ?? 0;
  const completedCount = completedSteps.length;
  const progressValue =
    totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const addMessage = (text: string, type: "assistant" | "user") => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${type}-${Date.now()}-${Math.random()}`,
        type,
        text,
        timestamp: new Date(),
      }
    ]);

    if (type === "assistant") {
      speakText(text, {
        lang: "ko-KR",
        rate: 1.0,
        pitch: 1.0,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }
  };

  const isStartIntent = (text: string) => {
    const keywords = [
      "시작", "시작해", "해줘", "해보자", "가자", "ㄱㄱ", "ㄱ", "스타트",
      "start", "웅", "응", "오케이"
    ];
    return keywords.some((kw) => text.includes(kw));
  };

  const buildStepMessage = (i: number, arr: string[]) => {
    const base = `[${i + 1}단계 / ${arr.length}단계]\n${arr[i]}`;
    const guide = `\n\n완료하면 "다음"이라고 말해주세요.`;

    if (i === 0) {
      return `좋습니다! 요리를 시작하겠습니다.\n\n${base}${guide}`;
    }
    return `${base}${guide}`;
  };

  async function handleUserInput(text: string) {
    addMessage(text, "user");

    // (1) 레시피 최초 생성
    if (!recipeInfo) {
      try {
        const json = await askGPT_raw({
          message: text,
          profile: userProfile,
        });
        const info = JSON.parse(json);

        if (!info.steps || !info.fullIngredients) throw new Error();

        setRecipeInfo(info);

        const ingredients = info.fullIngredients.join("\n");
        addMessage(
          `${info.recipeName ?? ""} 재료 목록입니다:\n${ingredients}\n\n빠진 재료가 있으면 말해주세요!`,
          "assistant"
        );
      } catch {
        addMessage("레시피를 불러오지 못했어요!", "assistant");
      }
      return;
    }

    const nowRecipe =
      typeof recipeInfo === "string" ? JSON.parse(recipeInfo) : recipeInfo;

    // (2) 재료 체크 단계
    if (!ingredientsChecked) {
      if (isStartIntent(text)) {
        setIngredientsChecked(true);
        setCookingStarted(true);
        setCurrentStepIndex(0);
        setCompletedSteps([]);
        setIsFinished(false);
        addMessage(buildStepMessage(0, nowRecipe.steps), "assistant");
        return;
      }

      try {
        const result: FollowupResult = await askCookingFollowup(nowRecipe, text, userProfile);
        setRecipeInfo(result.recipe);
        addMessage(result.assistantMessage, "assistant");
      } catch {
        addMessage("빠진 재료가 있을까요?", "assistant");
      }
      return;
    }

    // (3) 요리 시작 전
    if (!cookingStarted) {
      if (isStartIntent(text)) {
        setCookingStarted(true);
        setCurrentStepIndex(0);
        setCompletedSteps([]);
        setIsFinished(false);
        addMessage(buildStepMessage(0, nowRecipe.steps), "assistant");
        return;
      }
      addMessage('요리를 시작하려면 "시작해"라고 말해주세요!', "assistant");
      return;
    }

    // (4) 요리 진행 중
    if (
      ["다음", "다했어", "됐어", "오케이", "ㅇㅋ"].some((kw) =>
        text.replace(/\s/g, "").includes(kw)
      )
    ) {
      const total = nowRecipe.steps.length;

      if (!completedSteps.includes(currentStepIndex)) {
        setCompletedSteps((prev) => [...prev, currentStepIndex]);
      }

      const next = currentStepIndex + 1;

      if (next < total) {
        setCurrentStepIndex(next);
        addMessage(buildStepMessage(next, nowRecipe.steps), "assistant");
      } else {
        setIsFinished(true);
        addMessage(
          "모든 단계가 끝났습니다! 완성되면 아래 '요리 완료' 버튼을 눌러주세요.",
          "assistant"
        );
      }
      return;
    }

    // (5) 진행 중 질문
    try {
      const result: FollowupResult = await askCookingFollowup(nowRecipe, text, userProfile);
      setRecipeInfo(result.recipe);
      addMessage(result.assistantMessage, "assistant");
    } catch {
      addMessage("다시 설명해줄래요?", "assistant");
    }
  }

  // === 🔥 입력창 자동 초기화되는 텍스트 전송 함수 ===
  const sendText = async () => {
    if (!textInput.trim()) return;
    const text = textInput.trim();

    setTextInput("");   // ← 💛 입력창 비우기 핵심
    setIsProcessing(true);

    try {
      await handleUserInput(text);
    } catch {
      toast.error("GPT 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // === STT ===
  const startRecording = async () => {
    stopSpeaking();
    setIsSpeaking(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        try {
          const stt = await speechToText(blob);
          if (!stt.text) return toast.error("음성을 인식하지 못했어요.");
          await handleUserInput(stt.text);
        } catch {
          toast.error("음성 인식 오류 발생");
        }
      };

      recorder.start();
      setIsListening(true);
    } catch {
      toast.error("마이크 권한이 필요합니다!");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsListening(false);
  };

  const handleCompleteCooking = () => {
    if (!recipeInfo) return;
    stopSpeaking();
    setIsSpeaking(false);
    onRecipeSelect(recipeInfo);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4">

        {/* 뒤로가기 */}
        <Button variant="ghost" onClick={onBack} className="mb-4 flex items-center gap-2">
          ← 뒤로가기
        </Button>

        {/* 상단 상태 */}
        <Card className="mb-4 border bg-primary/5 border-primary/20">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-bold">
                  {recipeInfo?.recipeName ?? "AI 음성 요리 도우미"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  원하는 요리를 말하거나 입력해보세요!{"\n"}
                  예: "김치찌개 알려줘"
                </p>

                {cookingStarted && recipeInfo && (
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>진행 상황</span>
                      <span>{completedCount} / {totalSteps} 단계 완료</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={isListening ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-primary text-white animate-pulse"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
                <span className="text-[11px] text-muted-foreground">
                  {isListening ? "듣는 중..." : "말하기"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🟨 채팅 영역 (480px 고정 + 내부 스크롤) */}
        <Card className="rounded-2xl border bg-muted/40">
          <CardContent className="p-0">

            <div
              className="flex flex-col"
              style={{
                height: "480px",      // 고정 높이
                overflow: "hidden",   // 외부 스크롤 금지
              }}
            >
              <ScrollArea
                className="flex-1 px-3 py-4"
                style={{ height: "100%", overflowY: "auto" }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex mb-3 ${m.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.type === "assistant" ? (
                      <>
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mr-2 mt-auto">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="max-w-[75%]">
                          <div className="inline-block rounded-2xl rounded-bl-sm bg-white border border-gray-100 px-3 py-2 text-sm shadow-sm whitespace-pre-line">
                            {m.text}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="max-w-[75%] flex justify-end">
                          <div className="inline-block rounded-2xl rounded-br-sm bg-[#FEE500] px-3 py-2 text-sm text-black shadow-sm whitespace-pre-line">
                            {m.text}
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#FEE500] flex items-center justify-center ml-2 mt-auto">
                          <User className="w-4 h-4 text-black" />
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* 입력창 */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isProcessing) sendText();
              }}
              placeholder="메시지를 입력하세요"
            />
            <Button onClick={sendText} disabled={!textInput.trim() || isProcessing}>
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {isSpeaking && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => { stopSpeaking(); setIsSpeaking(false); }}>
                말하기 멈추기
              </Button>
            </div>
          )}

          <Button
            className="w-full mt-1"
            size="lg"
            onClick={handleCompleteCooking}
            disabled={!recipeInfo || !isFinished}
          >
            요리 완료
          </Button>

          {!isFinished && recipeInfo && (
            <p className="text-[11px] text-muted-foreground text-center">
              단계 안내가 모두 끝나면 <strong>요리 완료</strong> 버튼을 눌러주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
