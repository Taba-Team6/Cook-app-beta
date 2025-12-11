// === VoiceAssistant.tsx — 최종 통합 버전 (Ref/Import/AI Flow Fix) ===
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Mic, MicOff, Bot, User, Send } from "lucide-react";
import { toast } from "sonner";
// 💡 [수정] 모든 API 함수를 단일 import로 통합하여 사용
import { 
  askGPT_raw, 
  askCookingFollowup, 
  fetchAiRecommendations, 
  getFullRecipeDetail,
  addCompletedRecipe
} from "../utils/api";
// 💡 [수정] AiRecommendation 타입을 임포트 (types/recipe.ts에서 정의됨)
import type { Recipe, AiRecommendation } from "../types/recipe";
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
  onCookingComplete?: (recipe: Recipe) => void;

  // ★ FoodRecipe에서 넘어오는 전체 레시피(DB 기반)
  initialRecipeContext?: FullRecipe | null;
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
  // 💡 [4-1 추가] 버튼 옵션 필드 (컨버세이셔널 UI)
  options?: { label: string; value: string; id?: string; isGpt?: boolean }[]; 
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

// 💡 [신규 헬퍼 함수] FullRecipe -> Recipe 변환 로직 (FoodRecipe.tsx에서 가져옴)
const transformFullRecipeToRecipe = (full: FullRecipe | any): Recipe | null => {
    if (!full) return null;
    
    // 재료 문자열(fullIngredients)
    const fullIngredients = full.ingredients_details?.split('\n')
      ? full.ingredients_details.split('\n').filter((s: string) => s && s.trim().length > 0).map((s: string) => `• ${s}`)
      : [];

    // 단계 문자열 배열 (DB의 Step[] 타입을 steps: string[]로 변환)
    const steps = full.steps?.map((s: any) => {
        if (!s) return "";
        if (typeof s === "string") return s;
        // DB에서 steps 배열은 { step, text, image } 형태이므로 text 필드 사용
        return s.text ?? ""; 
    }).filter((line: string) => line && line.trim().length > 0) ?? [];

    // 재료 배열 (Recipe 타입의 ingredients 필드용)
    const ingredients = full.ingredients_details?.split('\n').map((i: string) => ({
      name: i.split(' ').filter(Boolean)[0] ?? '', // 재료명만 대략 추출
      amount: i.split(' ').slice(1).join(' ') ?? ''
    })).filter((i: any) => i.name) ?? [];


    return {
      id: String(full.id ?? crypto.randomUUID()), 
      name: full.name,  
      recipeName: full.name,
      image: full.image_large ?? full.image_small ?? null,
      fullIngredients,
      ingredients,
      steps,
      is_generated: parseInt(full.id, 10) >= 10000, 
      sodium_tip: full.sodium_tip ?? null, // Tip 데이터를 위한 필드
    };
};

// 💡 [신규 헬퍼 함수] 요리 Tip 메시지 생성 
const getCookingTip = (recipe: Recipe | any) => {
  const tip = recipe.sodium_tip || "요리 시작 전 손을 깨끗이 씻고, 조리 도구를 미리 준비해두세요!";
  return `[오늘의 요리 Tip]\n${tip}`;
}; 

// ===============================
// Component
// ===============================
export function VoiceAssistant({
  onRecipeSelect,
  onBack,
  initialRecipe,
  userProfile,
  onCookingComplete,
  initialRecipeContext,
}: VoiceAssistantProps) {
  // ====== 상태 ======
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [voiceFatalError, setVoiceFatalError] = useState(false);

  const [recipeInfo, setRecipeInfo] = useState<Recipe | null>(
    initialRecipe ?? null
  );
  // 💡 [4-1 추가] AI 플로우 제어 상태 추가
  const [recommendationList, setRecommendationList] = useState<AiRecommendation[] | null>(null);
  const [hasTipBeenShown, setHasTipBeenShown] = useState(false);
  const [showPathSelection, setShowPathSelection] = useState(false); 
  
  const [ingredientsChecked, setIngredientsChecked] = useState(false);
  const [cookingStarted, setCookingStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  
  // 🔥 [4-1 추가] 단계 관련 최신 상태를 들고 있을 ref들
  const ingredientsCheckedRef = useRef(ingredientsChecked);
  const cookingStartedRef = useRef(cookingStarted);
  const currentStepIndexRef = useRef(currentStepIndex);
  const recipeInfoRef = useRef<Recipe | null>(recipeInfo);
  const completedStepsRef = useRef<number[]>(completedSteps);

  // Wakeword / Command recognizer
  const [isWakeActive, setIsWakeActive] = useState(false);
  const isWakeActiveRef = useRef(false);
  const wakeRecognizerRef = useRef<any | null>(null);
  const commandRecognizerRef = useRef<any | null>(null);
  const silenceTimerRef = useRef<number | null>(null);

  // ❗ 치명적인 에러(not-allowed) 발생 시 자동 재시작 막기 위한 플래그
  const hardErrorRef = useRef(false);
  
  // keep wake active ref synced
  useEffect(() => {
    isWakeActiveRef.current = isWakeActive;
  }, [isWakeActive]);

  // auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ref ↔ state 동기화 (ReferenceError 해결의 보조 조치)
  useEffect(() => {
    ingredientsCheckedRef.current = ingredientsChecked;
  }, [ingredientsChecked]);

  useEffect(() => {
    cookingStartedRef.current = cookingStarted;
  }, [cookingStarted]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    recipeInfoRef.current = recipeInfo;
  }, [recipeInfo]);

  useEffect(() => {
    completedStepsRef.current = completedSteps;
  }, [completedSteps]);
  
  // ------------------------------------
  // 🔥 조리창에서 나갈 때(언마운트) 마이크 완전 정리
  // ------------------------------------
  useEffect(() => {
    return () => {
      console.log("[voice] cleanup on unmount: stop all recognition");

      // 무음 타이머 정리
      clearSilenceTimer();

      // 웨이크워드 + 명령 인식 전부 중지
      stopAllListening();

      // 혹시 남아있을 수도 있는 ref들 정리 (안 해도 큰 문제는 없지만 안전하게)
      try { wakeRecognizerRef.current?.stop?.(); } catch {}
      try { commandRecognizerRef.current?.stop?.(); } catch {}
      wakeRecognizerRef.current = null;
      commandRecognizerRef.current = null;
      isWakeActiveRef.current = false;
      hardErrorRef.current = false;
    };
  }, []);


  // ===============================
  // 무음 타이머 관리 (2초)
  // ===============================
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopCommandListening = () => {
  clearSilenceTimer();
  try { commandRecognizerRef.current?.stop(); } catch {}
  commandRecognizerRef.current = null; 
  setIsListening(false); 
  };

  const stopWakeListening = () => {
  try { wakeRecognizerRef.current?.stop(); } catch {}
  wakeRecognizerRef.current = null;
  };

  const stopAllListening = () => {
    hardErrorRef.current = false; // 버튼으로 끌 때는 에러 상태 리셋
    stopWakeListening();
    stopCommandListening();
    setIsWakeActive(false);
  };

  // 💡 [수정] 명령 음성 인식 (기존 기능 유지)
  const startCommandListening = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("브라우저가 음성 인식을 지원하지 않습니다.");
      return;
    }

    if (hardErrorRef.current) {
      console.warn("[cmd] hardErrorRef=true → startCommandListening 생략");
      return;
    }

    stopCommandListening();
    clearSilenceTimer();

    stopSpeaking();
    setIsSpeaking(false);

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

      console.log("[cmd] partial:", text);

      resetSilenceTimer();

      if (result.isFinal) {
        finalText += " " + text;
      }
    };

    recognizer.onerror = (e: any) => {
      console.error("[cmd] onerror:", e);

      // ... (오류 처리 로직 유지)
      if (
        e.error === "not-allowed" ||
        e.error === "audio-capture" ||
        e.error === "network" ||
        e.error === "service-not-allowed"
      ) {
        hardErrorRef.current = true;
        setVoiceFatalError(true);
        // ... (오류 메시지 처리 유지)
        stopAllListening();
        return;
      }

      toast.error("음성 인식 중 오류가 발생했어요.");
    };

    recognizer.onend = async () => {
      console.log("[cmd] onend, finalText =", finalText);
      clearSilenceTimer();
      setIsListening(false);
      commandRecognizerRef.current = null;

      const trimmed = normalizeText(finalText);
      if (trimmed.length > 0) {
        await handleUserInput(trimmed);
      }

      if (isWakeActiveRef.current && !hardErrorRef.current) {
        startWakeListening();
      }
    };

    try {
      console.log("[cmd] start() 호출");
      recognizer.start();
      commandRecognizerRef.current = recognizer;
      setIsListening(true);
      resetSilenceTimer();
    } catch (e) {
      console.error("[cmd] start() 예외:", e);
      toast.error("명령 인식을 시작할 수 없습니다.");
    }
  };

  // 💡 [수정] 웨이크워드 시작 ("안녕") (기존 기능 유지)
  const startWakeListening = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("브라우저가 음성 인식을 지원하지 않습니다.");
      return;
    }

    stopWakeListening();
    hardErrorRef.current = false;

    const recognizer = new SpeechRecognition();
    recognizer.lang = "ko-KR";
    recognizer.continuous = true;
    recognizer.interimResults = true;

    recognizer.onstart = () => {
      console.log("[wake] onstart");
      setIsWakeActive(true);
    };

    recognizer.onresult = (e: any) => {
      const result = e.results[e.results.length - 1];
      const text: string = result[0].transcript || "";
      const normalized = text.replace(/\s+/g, "");

      console.log("[wake] result:", text, "=>", normalized);
      
      const wakeWords = ["안녕", "시작", "요리야", "요리도우미", "헤이요리"];

      if (wakeWords.some((word) => normalized.includes(word))) {
        console.log("[wake] 웨이크워드 감지 → command 모드로 전환");
        try {
          recognizer.onresult = null;
          recognizer.onend = null;
          recognizer.onerror = null;
          recognizer.onstart = null;
          recognizer.stop();
        } catch (e) {
          console.error("[wake] stop() error:", e);
        }
        setTimeout(() => {
          startCommandListening();
        }, 500);
      }
    };

    recognizer.onerror = (e: any) => {
      console.error("[wake] onerror:", e);
      // ... (오류 처리 로직 유지)
      if (e.error === "not-allowed" || e.error === "audio-capture" || e.error === "network" || e.error === "service-not-allowed") {
        hardErrorRef.current = true;
        isWakeActiveRef.current = false;
        setIsWakeActive(false);
        setVoiceFatalError(true);
        // ... (토스트 메시지 로직 유지)
        return;
      }
      console.log("[wake] non-fatal error:", e.error);
    };

    recognizer.onend = () => {
        // ... (onend 로직 유지)
      if (wakeRecognizerRef.current !== recognizer) {
        return;
      }

      if (!isWakeActiveRef.current || hardErrorRef.current) {
        console.log("[wake] stop: auto-restart disabled (user off or hardError)");
        wakeRecognizerRef.current = null;
        return;
      }

      setTimeout(() => {
        if (!isWakeActiveRef.current || hardErrorRef.current) return;
        try {
          console.log("[wake] restart start()");
          recognizer.start();
        } catch (err) {
          console.error("[wake] restart error:", err);
          wakeRecognizerRef.current = null;
          hardErrorRef.current = true;
        }
      }, 300);
    };

    wakeRecognizerRef.current = recognizer;

    try {
      console.log("[wake] start() 호출");
      recognizer.start();
    } catch (e) {
      console.error("[wake] start() 예외:", e);
      setIsWakeActive(false);
      hardErrorRef.current = true;
      toast.error("웨이크워드 인식을 시작할 수 없습니다.");
    }
  };

  // 💡 [수정] 무음 타이머 리셋 (기존 기능 유지)
  const resetSilenceTimer = () => {
    clearSilenceTimer();
    const startWake = startWakeListening; 
    // 2초 동안 아무 말 없으면 자동으로 명령 인식 종료
    silenceTimerRef.current = window.setTimeout(() => {
      stopCommandListening();
      if (isWakeActiveRef.current && !hardErrorRef.current) {
        startWake(); 
      }
    }, 2000);
  };


  // ===============================
// 💡 [4-2] 초기 레시피 세팅 및 플로우 시작
// ===============================
useEffect(() => {
    let base: Recipe | null = initialRecipe ?? null;

    // FullRecipe → Recipe 변환
    if (!base && initialRecipeContext) {
      base = transformFullRecipeToRecipe(initialRecipeContext);
    }

    // 상태 초기화
    setMessages([]);
    setRecipeInfo(base);
    setIngredientsChecked(false);
    setCookingStarted(false);
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setIsFinished(false);
    setIsSpeaking(false);
    setIsListening(false);
    setIsWakeActive(false);
    // 💡 [4-2 추가] AI 플로우 상태 초기화
    setRecommendationList(null); 
    setHasTipBeenShown(false); 
    setShowPathSelection(false); 

    if (base) {
        // [선택 1] (DB 레시피 선택 후 진입) - 즉시 재료 확인 단계로 이동
        const fullLines = base.fullIngredients?.filter((s: string) => s && s.trim().length > 0) ?? [];
        const title = base.recipeName ?? (base as any).name ?? "이 레시피";

        if (fullLines.length > 0) {
            addMessage(
                `${title} 재료 목록입니다:\n${fullLines.join("\n")}\n\n빠진 재료가 있으면 말해주세요!`,
                "assistant"
            );
        } else {
            addMessage(
                `${title} 레시피의 재료 정보를 불러오지 못했어요.\n필요한 재료를 말로 알려주시면 도와드릴게요!`,
                "assistant"
            );
        }
    } else {
        // [선택 2] (버튼으로 진입) - 경로 선택 메시지 출력
        setShowPathSelection(true);
        // 💡 [4-2] 채팅 메시지 내부에 버튼 옵션 전달 (컨버세이셔널 UI)
        addMessage(
            `어떤 방법으로 요리를 시작하시겠어요?`,
            "assistant",
            [
                { label: "AI 맞춤 레시피 추천", value: "AI 추천" }, // 경로 2
                { label: "레시피 선택 (이전 목록)", value: "레시피 선택" }, // 경로 1
            ]
        );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [initialRecipe, initialRecipeContext]);


  const totalSteps = recipeInfo?.steps?.length ?? 0;
  const completedCount = completedSteps.length;


  // ===============================
  // 메시지 추가
  // ===============================
  // 💡 [4-1 수정] options 필드 추가
  const addMessage = (text: string, type: "assistant" | "user", options?: ChatMessage['options']) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${type}-${Date.now()}-${Math.random()}`,
        type,
        text,
        timestamp: new Date(),
        options: options, 
      },
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


  /**
   * 💡 [4-3 추가] AI 추천 목록 요청 및 출력 (경로 2 로직)
   */
  const requestRecommendations = async () => {
    setIsProcessing(true);
    addMessage("프로필과 보유 식재료를 기반으로 레시피를 추천 중입니다...", "assistant");
    setRecommendationList(null); // 이전 목록 초기화
    
    try {
        // 💡 [API 호출] 서버의 GET /recipes/hybrid-recommendation 호출
        const list: AiRecommendation[] = await fetchAiRecommendations();
        setRecommendationList(list);
        
        if (list.length === 0) {
          throw new Error("추천 레시피를 찾을 수 없습니다.");
        }
        
        // 메시지 내부에 버튼 옵션 추가 (컨버세이셔널 UI)
        addMessage(
            `총 ${list.length}가지 레시피를 추천해 드립니다. 선택해주세요.`,
            "assistant",
            list.map((item, index) => ({
                label: `${index + 1}. ${item.name}${item.isGpt ? " (AI 맞춤)" : ""}`,
                value: String(index + 1), 
                id: String(item.id), // 실제 레시피 ID
                isGpt: item.isGpt
            }))
        );
        
    } catch (e: any) {
        toast.error(e.message || "레시피 추천을 불러오는 데 실패했습니다.");
        console.error("fetchAiRecommendations error:", e);
        addMessage("추천 목록을 불러올 수 없어요. 다시 경로를 선택해 주세요.", "assistant");
        setRecommendationList(null);
        setShowPathSelection(true); // 경로 선택 단계로 되돌림
    } finally {
        setIsProcessing(false);
    }
  };
  
  /**
   * 💡 [4-3 추가] 추천 레시피 선택 처리
   */
  const handleRecommendationSelection = async (recipeId: string, recipeName: string) => {
    if (!recipeId) return;
    
    setIsProcessing(true);
    // 💡 [4-4] 사용자 메시지를 대신 추가
    addMessage(recipeName, "user"); 
    addMessage(`"${recipeName}" 레시피 상세 정보를 불러옵니다.`, "assistant");
    
    try {
        // 💡 [API 호출] findRecipeById 서버 API와 매칭되는 getFullRecipeDetail 사용 (ID 분기 처리 위임)
        const fullRecipe = await getFullRecipeDetail(recipeId); 
        
        const base = transformFullRecipeToRecipe(fullRecipe);
        
        if (base) {
            setRecipeInfo(base);
            setRecommendationList(null); // 추천 목록 초기화
            setShowPathSelection(false); 
            
            // 4. 재료 확인 요청 메시지 출력 
            const fullLines = base.fullIngredients?.filter((s: string) => s && s.trim().length > 0) ?? [];
            const title = base.recipeName ?? base.name ?? "이 레시피";

            addMessage(
                `${title} 재료 목록입니다:\n${fullLines.join("\n")}\n\n빠진 재료가 있으면 말해주세요!`,
                "assistant"
            );
            
        } else {
            throw new Error("레시피 상세 정보 변환 실패");
        }
        
    } catch (e) {
        toast.error("레시피 상세 정보를 불러오는 데 실패했습니다.");
        console.error("getFullRecipeDetail error:", e);
        addMessage("레시피를 불러올 수 없어요. 다시 경로를 선택해 주세요.", "assistant");
        setRecommendationList(null);
        setShowPathSelection(true);
    } finally {
        setIsProcessing(false);
    }
  };

  // 💡 [4-2, 4-3 추가] 버튼 클릭 핸들러
  const handleOptionClick = (value: string, id?: string, label?: string) => {
      // 1. 경로 선택 버튼 처리
      if (value === "AI 추천" || value === "레시피 선택") {
          handleUserInput(value);
      } 
      // 2. 추천 목록 버튼 처리 (ID를 값으로 사용)
      else if (id) {
          // ID와 이름을 직접 전달
          handleRecommendationSelection(id, label || value);
      }
  };


  // ===============================
  // Intent: Start Cooking (기존 기능 유지)
  // ===============================
  const isStartIntent = (text: string) => {
    const keywords = [
      "시작",
      "시작해",
      "해줘",
      "가자",
      "ㄱㄱ",
      "ㄱ",
      "스타트",
      "start",
      // 💡 [4-4 통합] 경로 선택 키워드도 인텐트로 사용
      "ai 추천",
      "레시피 선택",
    ];
    return keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()));
  };

  // ✅ '다음', '계속' 같은 말도 한 번에 인식 (기존 로직 유지)
  const isNextIntent = (text: string) => {
    const compact = text.replace(/\s/g, "");
    // 💡 [4-4 통합] 모든 단계 완료 키워드 통합
    const keywords = ["다음", "다음단계", "다음으로", "계속", "계속해", "다했어", "됐어", "ㅇㅋ", "오케이"]; 
    return keywords.some((kw) => compact.includes(kw));
  };

  // 단계 메시지 (기존 기능 유지)
  const buildStepMessage = (i: number, steps: string[] = []) => {
    if (!steps || steps.length === 0) return "요리 단계를 불러올 수 없어요.";

    const base = `[${i + 1}단계 / ${steps.length}단계]\n${steps[i]}`;
    const guide = `\n\n완료하면 "다음"이라고 말해주세요.`;

    // 💡 [4-4 통합] 첫 단계 메시지에서는 "좋습니다! 요리를 시작하겠습니다." 문구 제거
    return `${base}${guide}`;
  };

  // ===============================
  // 🔥 [4-4] 핵심: 음성 입력도 텍스트 입력과 100% 동일 처리 (AI 플로우 통합)
  // ===============================
  async function handleUserInput(rawText: string) {
      // 💡 [수정] 텍스트를 소문자로 변환하여 인텐트 일치도를 높임
      const text = normalizeText(rawText).toLowerCase();
      if (!text) return;

      // 🔥 항상 ref에 들어있는 "최신 상태"를 기준으로 처리
      const ingredientsChecked = ingredientsCheckedRef.current;
      const cookingStarted = cookingStartedRef.current;
      const currentStepIndex = currentStepIndexRef.current;
      const recipeInfoLocal = recipeInfoRef.current;
      const completedSteps = completedStepsRef.current;

      console.log(
          "%c[VOICE DEBUG] ===== 사용자 입력 처리 시작 =====",
          "color: #4CAF50; font-weight: bold"
      );
      // ... (콘솔 로그 유지)
      console.log("[VOICE DEBUG] 입력(raw):", rawText);
      console.log("[VOICE DEBUG] 입력(normalized):", text);
      console.log("[VOICE DEBUG] ingredientsChecked:", ingredientsChecked);
      console.log("[VOICE DEBUG] cookingStarted:", cookingStarted);
      console.log("[VOICE DEBUG] currentStepIndex:", currentStepIndex);
      console.log("[VOICE DEBUG] recipeInfo:", recipeInfoLocal);
      console.log("[VOICE DEBUG] ======================================");

      
      // ===== 0) 경로 선택 및 추천 목록 선택 단계 =====
      if (showPathSelection || recommendationList) {
          
          // 0-A. 초기 경로 선택 (음성 또는 텍스트 인텐트)
          if (showPathSelection) {
              setShowPathSelection(false); // 플로우 진입 후 선택지 제거
              addMessage(text, "user"); // 사용자 메시지를 먼저 추가

              if (text.includes("ai 추천")) { // 경로 2
                  await requestRecommendations();
                  return;
              } else if (text.includes("레시피 선택")) { // 경로 1
                  addMessage("레시피 선택 (경로 1)은 현재 개발 중입니다. AI 추천을 사용하거나, 레시피 이름을 직접 입력해주세요.", "assistant");
                  setShowPathSelection(true); // 다시 선택지로 돌아감
                  return;
              } else {
                  addMessage("죄송합니다. 'AI 맞춤 레시피 추천' 또는 '레시피 선택'을 명확히 말씀해 주세요.", "assistant");
                  setShowPathSelection(true); // 다시 선택지로 돌아감
                  return;
              }
          }
          
          // 0-B. 추천 목록 선택 (음성 또는 텍스트 인텐트)
          else if (recommendationList) {
              // 추천 목록 선택 처리는 handleRecommendationSelection에서 이미 사용자 메시지를 처리
              const selection = text.replace(/번/g, '').trim();
              const index = parseInt(selection, 10);
              
              let selectedItem: AiRecommendation | undefined;
              if (index >= 1 && index <= recommendationList.length) {
                  selectedItem = recommendationList[index - 1];
              } else {
                  // 이름으로 선택 (부분 일치)
                  selectedItem = recommendationList.find(item => item.name.toLowerCase().includes(selection));
              }
              
              if (selectedItem) {
                  // 사용자 메시지는 handleRecommendationSelection 내에서 추가
                  await handleRecommendationSelection(String(selectedItem.id), selectedItem.name);
                  return;
              } else {
                  // 음성으로 잘못된 선택을 했을 때
                  addMessage(text, "user");
                  addMessage("추천 목록의 번호나 레시피 이름을 다시 말씀해주세요.", "assistant");
                  return;
              }
          }
          return;
      }


      // 💡 [4-4] 레시피 정보가 없는 경우 (경로 선택을 건너뛰고 바로 질문을 던지는 경우)
      if (!recipeInfoLocal) {
          // 일반적인 질문/레시피 요청으로 간주하고 GPT에게 요청
          addMessage(text, "user");
          try {
              const json = await askGPT_raw({ message: text, profile: userProfile });
              const info = JSON.parse(json);

              if (!info.steps || !info.fullIngredients) throw new Error();

              setRecipeInfo(info);
              addMessage(
                  `${info.recipeName ?? ""} 재료 목록입니다:\n${info.fullIngredients.join(
                    "\n"
                  )}\n\n빠진 재료가 있으면 말해주세요!`,
                  "assistant"
              );
          } catch {
              addMessage("원하시는 레시피를 찾을 수 없어요. 'AI 맞춤 레시피'를 시도해 보세요.", "assistant");
              setShowPathSelection(true); // 경로 선택으로 유도
          }
          return;
      }
      
      const nowRecipe = recipeInfoLocal;
      // 💡 [4-4 통합] 사용자 메시지는 경로 선택 후 일반 대화일 때만 여기서 추가
      if (!showPathSelection && !recommendationList) {
        addMessage(text, "user"); 
      }
      
      // ✅ 우선순위 0: 이미 요리 중일 때의 '다음/계속'은 무조건 "다음 단계"로 처리 (통합 로직)
      if (cookingStarted && isNextIntent(text)) {
          const total = nowRecipe.steps?.length ?? 0;
          const current = currentStepIndex;

          if (!completedSteps.includes(current)) {
              setCompletedSteps((prev) => [...prev, current]);
          }

          const next = current + 1;

          if (next < total) {
              setCurrentStepIndex(next);
              addMessage(
                  buildStepMessage(next, nowRecipe.steps || []),
                  "assistant"
              );
          } else {
              setIsFinished(true);
              addMessage(
                  '모든 단계가 끝났습니다! ‘요리 완료’를 눌러주세요.',
                  'assistant'
              );
          }
          return;
      }
      
      // ===== 2) 재료 체크 단계 =====
      if (!ingredientsChecked) {
          const readyKeywords = ["다 있어", "다있어", "재료 다 있어", "재료다있어"];
          if (readyKeywords.some((k) => text.includes(k))) {
              setIngredientsChecked(true);
              addMessage("모든 재료가 준비되었군요! '요리 시작' 버튼을 누르거나 '시작해'라고 말해주세요!", "assistant");
              return;
          }

          // 💡 [4-4 추가] 재료 부족 시 재추천 경로(경로 2)로 돌아가는 경우
          if (["다른 레시피", "재추천", "다시 추천"].some(k => text.includes(k))) {
              setRecipeInfo(null);
              addMessage("새로운 레시피를 추천해 드릴게요.", "assistant");
              setShowPathSelection(true); // 경로 선택 단계로 되돌림
              return;
          }

          // 💡 [4-4 통합] 재료 부족/대체재 요청은 askCookingFollowup으로 일괄 처리
          try {
              const result: FollowupResult = await askCookingFollowup(
                  nowRecipe,
                  text,
                  userProfile
              );
              setRecipeInfo(result.recipe);
              addMessage(result.assistantMessage, "assistant");
          } catch {
              addMessage("빠진 재료가 있을까요? 아니면 '시작해'라고 말해주세요!", "assistant");
          }
          return;
      }

      // ===== 3) 요리 시작 전 (재료 확인 완료 후) =====
      if (!cookingStarted) {
          if (isStartIntent(text)) {
              setCookingStarted(true);
              setCurrentStepIndex(0);
              
              // 💡 [4-4 통합] 요리 Tip 제공 로직 (단계별 시작 전에만 제공)
              if (!hasTipBeenShown) {
                  const tipMessage = getCookingTip(nowRecipe);
                  addMessage(tipMessage, "assistant");
                  setHasTipBeenShown(true);
              }
              
              // 첫 단계 안내 메시지 (Tip과 분리)
              addMessage(`좋습니다! 요리를 시작하겠습니다.\n\n${buildStepMessage(0, nowRecipe.steps || [])}`, "assistant");
              return;
          }
          addMessage(`요리를 시작하려면 "시작해"라고 말해주세요!`, "assistant");
          return;
      }

      // ===== 4) 단계 진행 로직은 0번 우선순위에서 이미 처리됨

      // ===== 5) 요리 중 질문 (단계 진행 중 질문) =====
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
  // 텍스트 입력 (기존 기능 유지)
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
  // 무음 타이머 관리 (2초)
  // ===============================
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopCommandListening = () => {
  clearSilenceTimer();
  try { commandRecognizerRef.current?.stop(); } catch {}
  commandRecognizerRef.current = null; // ← 추가!!!
  };

  const stopWakeListening = () => {
  try { wakeRecognizerRef.current?.stop(); } catch {}
  wakeRecognizerRef.current = null; // ← 추가!!!
  };

  const stopAllListening = () => {
    hardErrorRef.current = false; // 버튼으로 끌 때는 에러 상태 리셋
    stopWakeListening();
    stopCommandListening();
    setIsWakeActive(false);
  };

  const resetSilenceTimer = () => {
    clearSilenceTimer();
    // 2초 동안 아무 말 없으면 자동으로 명령 인식 종료
    silenceTimerRef.current = window.setTimeout(() => {
      stopCommandListening();
      if (isWakeActiveRef.current && !hardErrorRef.current) {
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

    stopWakeListening();
    hardErrorRef.current = false;

    const recognizer = new SpeechRecognition();
    recognizer.lang = "ko-KR";
    recognizer.continuous = true;
    recognizer.interimResults = true;

    recognizer.onstart = () => {
      console.log("[wake] onstart");
      setIsWakeActive(true);
    };

    recognizer.onresult = (e: any) => {
  const result = e.results[e.results.length - 1];
  const text: string = result[0].transcript || "";
  const normalized = text.replace(/\s+/g, "");

  console.log("[wake] result:", text, "=>", normalized);
  // 여러 개 웨이크워드 허용
  const wakeWords = ["안녕", "시작", "요리야", "요리도우미", "헤이요리"];

  if (wakeWords.some((word) => normalized.includes(word))) {
    console.log("[wake] 웨이크워드 감지 → command 모드로 전환");

    try {
      recognizer.onresult = null;
      recognizer.onend = null;
      recognizer.onerror = null;
      recognizer.onstart = null;
      recognizer.stop();
    } catch (e) {
      console.error("[wake] stop() error:", e);
    }

    // wake 완전히 종료된 뒤 커맨드 모드 시작
    setTimeout(() => {
      startCommandListening();
    }, 500);
  }
};


    recognizer.onerror = (e: any) => {
      console.error("[wake] onerror:", e);
      // ✅ stop() 호출로 인한 정상 종료 → 신경 안 씀
    if (e.error === "aborted") {
    console.log("[wake] aborted (stop() 호출로 인한 정상 종료)");
    return;
    }
      if (
        e.error === "not-allowed" ||
        e.error === "audio-capture" ||
        e.error === "network" ||
        e.error === "service-not-allowed"
      ) {
        hardErrorRef.current = true;
        isWakeActiveRef.current = false;
        setIsWakeActive(false);
        setVoiceFatalError(true);

        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          toast.error("브라우저에서 이 사이트의 마이크 사용이 차단되어 있어요.");
        } else if (e.error === "audio-capture") {
          toast.error("마이크 장치를 찾을 수 없어요. 시스템 설정을 확인해주세요.");
        } else if (e.error === "network") {
          toast.error(
            "이 네트워크에서는 음성 인식 서버에 연결할 수 없어 자동 듣기를 사용할 수 없어요."
          );
        }
        return;
      }

      console.log("[wake] non-fatal error:", e.error);
    };

    recognizer.onend = () => {
      console.log(
        "[wake] onend, isWakeActiveRef.current =",
        isWakeActiveRef.current,
        "isListening =",
        isListening,
        "hardErrorRef =",
        hardErrorRef.current
      );

      if (wakeRecognizerRef.current !== recognizer) {
        return;
      }

      if (!isWakeActiveRef.current || hardErrorRef.current) {
        console.log("[wake] stop: auto-restart disabled (user off or hardError)");
        wakeRecognizerRef.current = null;
        return;
      }

      setTimeout(() => {
        if (!isWakeActiveRef.current || hardErrorRef.current) return;
        try {
          console.log("[wake] restart start()");
          recognizer.start();
        } catch (err) {
          console.error("[wake] restart error:", err);
          wakeRecognizerRef.current = null;
          hardErrorRef.current = true;
        }
      }, 300);
    };

    wakeRecognizerRef.current = recognizer;

    try {
      console.log("[wake] start() 호출");
      recognizer.start();
    } catch (e) {
      console.error("[wake] start() 예외:", e);
      setIsWakeActive(false);
      hardErrorRef.current = true;
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

    if (hardErrorRef.current) {
      console.warn("[cmd] hardErrorRef=true → startCommandListening 생략");
      return;
    }

    stopCommandListening();
    clearSilenceTimer();

    stopSpeaking();
    setIsSpeaking(false);

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

      console.log("[cmd] partial:", text);

      resetSilenceTimer();

      if (result.isFinal) {
        finalText += " " + text;
      }
    };

    recognizer.onerror = (e: any) => {
      console.error("[cmd] onerror:", e);

      if (
        e.error === "not-allowed" ||
        e.error === "audio-capture" ||
        e.error === "network" ||
        e.error === "service-not-allowed"
      ) {
        hardErrorRef.current = true;
        setVoiceFatalError(true);

        if (e.error === "network") {
          toast.error(
            "이 네트워크에서는 음성 인식 서버에 연결할 수 없어 음성 기능을 사용할 수 없어요."
          );
        } else {
          toast.error(
            "마이크 권한 / 장치 문제로 음성 인식을 사용할 수 없어요."
          );
        }

        stopAllListening();
        return;
      }

      toast.error("음성 인식 중 오류가 발생했어요.");
    };

    recognizer.onend = async () => {
      console.log("[cmd] onend, finalText =", finalText);
      clearSilenceTimer();
      setIsListening(false);
      commandRecognizerRef.current = null;

      const trimmed = normalizeText(finalText);
      if (trimmed.length > 0) {
        await handleUserInput(trimmed);
      }

      if (isWakeActiveRef.current && !hardErrorRef.current) {
        startWakeListening();
      }
    };

    try {
      console.log("[cmd] start() 호출");
      recognizer.start();
      commandRecognizerRef.current = recognizer;
      setIsListening(true);
      resetSilenceTimer();
    } catch (e) {
      console.error("[cmd] start() 예외:", e);
      toast.error("명령 인식을 시작할 수 없습니다.");
    }
  };

  // ===============================
  // 요리 완료
  // ===============================
  const handleCompleteCooking = async () => {
    if (!recipeInfo) return;

    stopSpeaking();
    setIsSpeaking(false);

    try {
      const payload = {
        id: recipeInfo.id ?? crypto.randomUUID(),

        name: recipeInfo.name ?? recipeInfo.recipeName ?? "이름 없는 레시피",
        image: recipeInfo.image ?? null,
        description: recipeInfo.description ?? null,
        category: recipeInfo.category ?? "기타",

        ingredients: Array.isArray(recipeInfo.ingredients)
          ? recipeInfo.ingredients.map((ing: any) =>
              typeof ing === "string"
                ? { name: ing, amount: "" }
                : {
                    name: ing.name ?? "",
                    amount: ing.amount ?? "",
                  }
            )
          : [],

        steps: Array.isArray(recipeInfo.steps)
          ? recipeInfo.steps.map((s: any) => String(s))
          : [],

        completedAt: new Date().toISOString(),

        cookingTime: recipeInfo.cookingTime ?? null,
        servings: recipeInfo.servings ?? null,
        difficulty: recipeInfo.difficulty ?? null,
      };

      console.log("✅ 최종 전송 payload:", payload);

      // ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅
      await addCompletedRecipe(payload);   // 🔥🔥🔥 이게 핵심
      // ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅

      toast.success("완료한 요리가 저장되었습니다!");

      // ✅ App.tsx에 완료 이벤트 전달 → 완료 목록 갱신
      onCookingComplete?.(recipeInfo);

    } catch (err) {
      console.error("❌ 완료 레시피 저장 실패:", err);
      toast.error("완료한 레시피 저장에 실패했습니다.");
    }
  };



  // ===============================
  // UI (컨버세이셔널 버튼 통합)
  // ===============================
  return (
    <div className="h-screen bg-background pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4">

        

        {/* 상단 상태 카드 */}
        <Card className="mb-4 border bg-primary/5 border-primary/20">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center justify-between gap-4">
              
              {/* 제목 + 설명 + 진행률 */}
              <div className="flex-1">
                <h2 className="text-lg font-bold">
                  {recipeInfo?.recipeName ?? recipeInfo?.name ?? "AI 음성 요리 도우미"}
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
              style={{ height: "380px", overflow: "hidden" }}
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
                        <div className="max-w-[75%] flex flex-col items-start"> {/* 💡 [수정] flex-col wrapper */}
                          <div className="inline-block rounded-2xl rounded-bl-sm bg-white border border-gray-100 px-3 py-2 text-sm shadow-sm whitespace-pre-line">
                            {m.text}
                          </div>
                            
                            {/* 💡 [수정] 컨버세이셔널 버튼 UI: 메시지 아래에 버튼 렌더링 */}
                          {m.options && m.options.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2 w-full"> {/* 수직 배열, w-full로 너비 통일 */}
                                {m.options.map((option, idx) => (
                                    <Button
                                        key={idx}
                                        variant={option.isGpt || option.value === "AI 추천" ? "default" : "secondary"}
                                        size="lg" 
                                        onClick={() => handleOptionClick(option.value, option.id, option.label)}
                                        disabled={isProcessing}
                                        className="text-sm w-full"
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                          )}
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
            onClick={() => onCookingComplete?.(recipeInfo as any)}
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