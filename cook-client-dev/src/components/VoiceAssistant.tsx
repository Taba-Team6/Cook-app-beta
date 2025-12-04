// === VoiceAssistant.tsx — Wakeword + 동일 처리 + 무음 종료 (FINAL FULL VERSION) ===
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Mic, MicOff, Bot, User, Send } from "lucide-react";
import { toast } from "sonner";
import { askGPT_raw, askCookingFollowup } from "../utils/api";
import type { Recipe } from "../types/recipe";
import { speakText, stopSpeaking } from "../utils/tts";
import { Progress } from "./ui/progress";
import type { UserProfile } from "./ProfileSetup";
import type { FullRecipe } from "./FoodRecipe";


// ===============================
// Types
// ===============================
interface VoiceAssistantProps {
  onRecipeSelect: (recipe: Recipe) => void;
  onBack: () => void;
  initialRecipe?: Recipe | null;
  userProfile: UserProfile | null;

  // ⭐ App.tsx에서 넘기고 있는 prop (필수 추가)
  initialRecipeContext?: FullRecipe | null;
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

// ===============================
// 🔥 Text Normalizer — (음성/채팅 동일하게 처리)
// ===============================
function normalizeText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/[?？!.,]/g, "")
    .split(/\.|!|\?|~|…/)[0]
    .replace(/\s+/g, " ")
    .trim();
}

// ===============================
// Component
// ===============================
export function VoiceAssistant({
  onRecipeSelect,
  onBack,
  initialRecipe,
  userProfile,
}: VoiceAssistantProps) {

  // ====== 상태 ======
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

  // Wakeword / Command recognizer
  const [isWakeActive, setIsWakeActive] = useState(false);
  const isWakeActiveRef = useRef(false);
  const wakeRecognizerRef = useRef<any | null>(null);
  const commandRecognizerRef = useRef<any | null>(null);
  const silenceTimerRef = useRef<number | null>(null);

  // keep wake active ref synced
  useEffect(() => {
    isWakeActiveRef.current = isWakeActive;
  }, [isWakeActive]);

  // auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 초기 레시피 세팅
  useEffect(() => {
    if (!initialRecipe) return;

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
  }, [initialRecipe]);

  const totalSteps = recipeInfo?.steps?.length ?? 0;
  const completedCount = completedSteps.length;

  // ===============================
  // 메시지 추가
  // ===============================
  const addMessage = (text: string, type: "assistant" | "user") => {
    setMessages(prev => [
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

  // ===============================
  // Intent: Start Cooking
  // ===============================
  const isStartIntent = (text: string) => {
    const keywords = [
      "시작", "시작해", "해줘", "가자",
      "ㄱㄱ", "ㄱ", "스타트", "start"
    ];
    return keywords.some(kw => text.includes(kw));
  };

  // 단계 메시지
  const buildStepMessage = (i: number, steps: string[] = []) => {
    if (!steps || steps.length === 0) return "요리 단계를 불러올 수 없어요.";

    const base = `[${i + 1}단계 / ${steps.length}단계]\n${steps[i]}`;
    const guide = `\n\n완료하면 "다음"이라고 말해주세요.`;

    if (i === 0) return `좋습니다! 요리를 시작하겠습니다.\n\n${base}${guide}`;
    return `${base}${guide}`;
  };

  // ===============================
  // 🔥 핵심: 음성 입력도 텍스트 입력과 100% 동일 처리
  // ===============================
  async function handleUserInput(rawText: string) {
    const text = normalizeText(rawText);
    addMessage(text, "user");

    // ===== 1) 처음 레시피 생성 =====
    if (!recipeInfo) {
      try {
        const json = await askGPT_raw({ message: text, profile: userProfile });
        const info = JSON.parse(json);

        if (!info.steps || !info.fullIngredients) throw new Error();

        setRecipeInfo(info);
        addMessage(
          `${info.recipeName ?? ""} 재료 목록입니다:\n${info.fullIngredients.join("\n")}\n\n빠진 재료가 있으면 말해주세요!`,
          "assistant"
        );
      } catch {
        addMessage("레시피를 불러오지 못했어요!", "assistant");
      }
      return;
    }

    const nowRecipe =
      typeof recipeInfo === "string" ? JSON.parse(recipeInfo) : recipeInfo;

    // ===== 2) 재료 체크 단계 =====
    if (!ingredientsChecked) {

      // "다 있어" 처리 강화
      const readyKeywords = ["다 있어", "다있어", "재료 다 있어", "재료다있어"];
      if (readyKeywords.some(k => text.includes(k))) {
        setIngredientsChecked(true);
        addMessage("모든 재료가 준비되었군요! 요리를 시작할까요?", "assistant");
        return;
      }

      if (isStartIntent(text)) {
        setIngredientsChecked(true);
        setCookingStarted(true);
        setCurrentStepIndex(0);
        addMessage(buildStepMessage(0, nowRecipe.steps || []), "assistant");
        return;
      }

      try {
        const result: FollowupResult = await askCookingFollowup(
          nowRecipe,
          text,
          userProfile
        );
        setRecipeInfo(result.recipe);
        addMessage(result.assistantMessage, "assistant");
      } catch {
        addMessage("빠진 재료가 있을까요?", "assistant");
      }
      return;
    }

    // ===== 3) 요리 시작 전 =====
    if (!cookingStarted) {
      if (isStartIntent(text)) {
        setCookingStarted(true);
        setCurrentStepIndex(0);
        addMessage(buildStepMessage(0, nowRecipe.steps || []), "assistant");
        return;
      }
      addMessage(`요리를 시작하려면 "시작해"라고 말해주세요!`, "assistant");
      return;
    }

    // ===== 4) 단계 진행 =====
    if (
      ["다음", "다했어", "됐어", "ㅇㅋ", "오케이"].some(kw =>
        text.replace(/\s/g, "").includes(kw)
      )
    ) {
      const total = nowRecipe.steps?.length ?? 0;

      if (!completedSteps.includes(currentStepIndex)) {
        setCompletedSteps(prev => [...prev, currentStepIndex]);
      }

      const next = currentStepIndex + 1;

      if (next < total) {
        setCurrentStepIndex(next);
        addMessage(buildStepMessage(next, nowRecipe.steps || []), "assistant");
      } else {
        setIsFinished(true);
        addMessage("모든 단계가 끝났습니다! ‘요리 완료’를 눌러주세요.", "assistant");
      }
      return;
    }

    // ===== 5) 요리 중 질문 =====
    try {
      const result: FollowupResult = await askCookingFollowup(
        nowRecipe,
        text,
        userProfile
      );
      setRecipeInfo(result.recipe);
      addMessage(result.assistantMessage, "assistant");
    } catch {
      addMessage("다시 설명해줄래요?", "assistant");
    }
  }
  // ===============================
  // 텍스트 입력
  // ===============================
  const sendText = async () => {
    if (!textInput.trim()) return;
    const clean = normalizeText(textInput);
    setTextInput("");
    setIsProcessing(true);

    try {
      await handleUserInput(clean);
    } finally {
      setIsProcessing(false);
    }
  };

  // ===============================
  // 무음 타이머 관리
  // ===============================
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopCommandListening = () => {
    clearSilenceTimer();
    try {
      commandRecognizerRef.current?.stop();
    } catch {}
    commandRecognizerRef.current = null;
    setIsListening(false);
  };

  const stopWakeListening = () => {
    try {
      wakeRecognizerRef.current?.stop();
    } catch {}
    wakeRecognizerRef.current = null;
  };

  const stopAllListening = () => {
    stopWakeListening();
    stopCommandListening();
    setIsWakeActive(false);
  };

  const resetSilenceTimer = () => {
    clearSilenceTimer();
    // 5초 동안 아무 말 없으면 자동으로 명령 인식 종료
    silenceTimerRef.current = window.setTimeout(() => {
      stopCommandListening();
      // 종료 후 다시 웨이크워드 모드로
      if (isWakeActiveRef.current) {
        startWakeListening();
      }
    }, 2000);
  };

  // ===============================
  // 웨이크워드 시작 ("안녕")
  // ===============================
  const startWakeListening = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("브라우저가 음성 인식을 지원하지 않습니다.");
      return;
    }

    // 혹시 켜져 있던 거 있으면 정리
    stopWakeListening();

    const recognizer = new SpeechRecognition();
    recognizer.lang = "ko-KR";
    recognizer.continuous = true;
    recognizer.interimResults = true;

    recognizer.onresult = (e: any) => {
      const result = e.results[e.results.length - 1];
      const text: string = result[0].transcript || "";
      const normalized = text.replace(/\s+/g, "");
      // "안녕" 감지되면 → 명령 듣기 모드로 전환
      if (normalized.includes("안녕")) {
        try {
          recognizer.onresult = null;
          recognizer.onend = null;
          recognizer.onerror = null;
          recognizer.stop();
        } catch {}
        // 바로 듣기 시작하면 자기 목소리 섞일 수 있으니 약간 딜레이
        setTimeout(() => {
          startCommandListening();
        }, 500);
      }
    };

    recognizer.onerror = () => {
      // 에러 나면 웨이크 비활성화
      setIsWakeActive(false);
    };

    recognizer.onend = () => {
      // 명령 듣는 중이 아니고, 웨이크 모드가 활성화 상태면 다시 켠다
      if (!isListening && isWakeActiveRef.current) {
        try {
          recognizer.start();
        } catch {
          // 여기서 실패하면 웨이크 끔
          setIsWakeActive(false);
        }
      }
    };

    wakeRecognizerRef.current = recognizer;

    try {
      recognizer.start();
      setIsWakeActive(true);
    } catch {
      setIsWakeActive(false);
      toast.error("웨이크워드 인식을 시작할 수 없습니다.");
    }
  };

  // ===============================
  // 명령 음성 인식 (실제 대화 내용)
  // ===============================
  const startCommandListening = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("브라우저가 음성 인식을 지원하지 않습니다.");
      return;
    }

    // 혹시 남아 있는 명령 인식기 정리
    stopCommandListening();
    clearSilenceTimer();

    // TTS 중이면 끄고 시작
    stopSpeaking();
    setIsSpeaking(false);

    // 웨이크워드 인식은 잠깐 정지
    if (wakeRecognizerRef.current) {
      stopWakeListening();
    }

    const recognizer = new SpeechRecognition();
    recognizer.lang = "ko-KR";
    recognizer.continuous = true;
    recognizer.interimResults = true;

    let finalText = "";

    recognizer.onresult = (e: any) => {
      const result = e.results[e.results.length - 1];
      const text: string = result[0].transcript || "";

      // 무음 타이머 리셋
      resetSilenceTimer();

      if (result.isFinal) {
        finalText += " " + text;
      }
    };

    recognizer.onerror = () => {
      toast.error("음성 인식 중 오류가 발생했어요.");
    };

    recognizer.onend = async () => {
      clearSilenceTimer();
      setIsListening(false);
      commandRecognizerRef.current = null;

      const trimmed = normalizeText(finalText);
      if (trimmed.length > 0) {
        await handleUserInput(trimmed);
      }

      // 명령 듣기 끝나면 다시 웨이크 모드로 복귀
      if (isWakeActiveRef.current) {
        startWakeListening();
      }
    };

    try {
      recognizer.start();
      commandRecognizerRef.current = recognizer;
      setIsListening(true);
      resetSilenceTimer();
    } catch {
      toast.error("명령 인식을 시작할 수 없습니다.");
    }
  };

  // ===============================
  // 요리 완료
  // ===============================
  const handleCompleteCooking = () => {
    if (!recipeInfo) return;
    stopSpeaking();
    setIsSpeaking(false);
    onRecipeSelect(recipeInfo);
  };

  // ===============================
  // 진행률 계산 (TS 에러 안 나게 방어)
  // ===============================
  const totalForProgress = recipeInfo?.steps ? recipeInfo.steps.length : 0;
  const progressValue =
    totalForProgress > 0
      ? Math.round((completedCount / totalForProgress) * 100)
      : 0;

  // ===============================
  // UI
  // ===============================
  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4">

        {/* 뒤로가기 */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 flex items-center gap-2"
        >
          ← 뒤로가기
        </Button>

        {/* 상단 상태 카드 */}
        <Card className="mb-4 border bg-primary/5 border-primary/20">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between gap-4">
              
              {/* 제목 + 설명 + 진행률 */}
              <div className="flex-1">
                <h2 className="text-lg font-bold">
                  {recipeInfo?.recipeName ?? "AI 음성 요리 도우미"}
                </h2>

                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">
                  원하는 요리를 말하거나 입력해보세요!{"\n"}예: "김치볶음밥 알려줘"
                </p>

                {cookingStarted && recipeInfo && (
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>진행 상황</span>
                      <span>
                        {completedCount} / {totalForProgress} 단계 완료
                      </span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                )}
              </div>

              {/* 웨이크워드 버튼 */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={isWakeActive ? stopAllListening : startWakeListening}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-primary text-white animate-pulse"
                      : isWakeActive
                      ? "bg-primary/20 text-primary"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>

                <span className="text-[11px] text-muted-foreground text-center">
                  {isListening
                    ? "지금 말씀하세요..."
                    : isWakeActive
                    ? `"안녕"이라고 불러보세요`
                    : "자동 듣기 켜기"}
                </span>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* 채팅 영역 */}
        <Card className="rounded-2xl border bg-muted/40">
          <CardContent className="p-0">
            <div
              className="flex flex-col"
              style={{ height: "480px", overflow: "hidden" }}
            >
              <ScrollArea
                className="flex-1 px-3 py-4"
                style={{ height: "100%", overflowY: "auto" }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex mb-3 ${
                      m.type === "user" ? "justify-end" : "justify-start"
                    }`}
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

        {/* 입력 영역 */}
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
            <Button
              onClick={sendText}
              disabled={!textInput.trim() || isProcessing}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {isSpeaking && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  stopSpeaking();
                  setIsSpeaking(false);
                }}
              >
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
