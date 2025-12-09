// === VoiceAssistant.tsx — Wakeword + 동일 처리 + 무음 종료 (MERGED VERSION) ===
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
import { addCompletedRecipe } from "../utils/api";


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

    // ===============================
// 초기 레시피 세팅
//  - initialRecipe(이미 Recipe 형태)가 있으면 그대로 사용
//  - 없으면 FullRecipe(initialRecipeContext)를 Recipe로 변환해서 사용
// ===============================
    useEffect(() => {
        let base: Recipe | null = initialRecipe ?? null;

        // FullRecipe → Recipe 변환
        if (!base && initialRecipeContext) {
            const full = initialRecipeContext as any;

            // 재료 문자열(fullIngredients)
            const fullIngredients =
                full.ingredients?.map((ing: any) =>
                    `• ${(ing.name ?? ing.ingredient ?? ing.title ?? "").trim()}${
                        ing.amount ?? ing.quantity ?? ing.volume
                            ? " " + (ing.amount ?? ing.quantity ?? ing.volume)
                            : ""
                    }`
                ) ?? [];

            // 단계 문자열 배열
            const steps =
                full.steps
                    ?.map((s: any) => {
                        if (!s) return "";
                        if (typeof s === "string") return s;

                        const candKeys = [
                            "description",
                            "step",
                            "content",
                            "text",
                            "instruction",
                            "instruction_text",
                        ];
                        for (const k of candKeys) {
                            if (typeof s[k] === "string" && s[k].trim()) return s[k];
                        }

                        const vals = Object.values(s).filter(
                            (v) => typeof v === "string" && v.trim()
                        ) as string[];

                        return vals.join(" ");
                    })
                    .filter((line: string) => line && line.length > 0) ?? [];

            base = {
                id: full.id ?? crypto.randomUUID(),
                name: full.name,
                recipeName: full.name,
                image: full.image ?? null,
                fullIngredients,
                ingredients:
                    full.ingredients?.map((ing: any) => ({
                        name: (ing.name ?? ing.ingredient ?? ing.title ?? "").trim(),
                        amount:
                            (ing.amount ?? ing.quantity ?? ing.volume ?? "")
                                .toString()
                                .trim(),
                    })) ?? [],
                steps,
            };
        }

        if (!base) return;

        // ===== 여기부터는 그대로 유지 =====
        setRecipeInfo(base);
        setIngredientsChecked(false);
        setCookingStarted(false);
        setCurrentStepIndex(0);
        setCompletedSteps([]);
        setIsFinished(false);

        const fullLines =
            base.fullIngredients
                ?.map((line: any) =>
                    typeof line === "string" ? line : String(line)
                )
                .filter((s: string) => s && s.trim().length > 0) ?? [];

        const ingredientLines =
            !fullLines.length && Array.isArray((base as any).ingredients)
                ? (base as any).ingredients
                    .map((i: any) => {
                        if (typeof i === "string") return i;
                        const name = i.name ?? i.ingredient ?? i.title ?? "";
                        const amount = i.amount ?? i.quantity ?? i.qty ?? "";
                        if (!name && !amount) return "";
                        return amount ? `${name} ${amount}` : name;
                    })
                    .filter((s: string) => s && s.trim().length > 0)
                : [];

        const lines = fullLines.length > 0 ? fullLines : ingredientLines;
        const title = base.recipeName ?? (base as any).name ?? "이 레시피";

        if (lines.length > 0) {
            addMessage(
                `${title} 재료 목록입니다:\n${lines.join(
                    "\n"
                )}\n\n빠진 재료가 있으면 말해주세요!`,
                "assistant"
            );
        } else {
            addMessage(
                `${title} 레시피의 재료 정보를 불러오지 못했어요.\n필요한 재료를 말로 알려주시면 도와드릴게요!`,
                "assistant"
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialRecipe, initialRecipeContext]);


    const totalSteps = recipeInfo?.steps?.length ?? 0;
    const completedCount = completedSteps.length;

    // ===============================
    // 메시지 추가
    // ===============================
    const addMessage = (text: string, type: "assistant" | "user") => {
        setMessages((prev) => [
            ...prev,
            {
                id: `${type}-${Date.now()}-${Math.random()}`,
                type,
                text,
                timestamp: new Date(),
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

    // ===============================
    // Intent: Start Cooking
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
        ];
        return keywords.some((kw) => text.includes(kw));
    };
    // ✅ '다음', '계속' 같은 말도 한 번에 인식
    const isNextIntent = (text: string) => {
        const compact = text.replace(/\s/g, "");
        const keywords = ["다음", "다음단계", "다음으로", "계속", "계속해"];
        return keywords.some((kw) => compact.includes(kw));
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
        if (!text) return;
        console.log("%c[VOICE DEBUG] ===== 사용자 입력 처리 시작 =====", "color: #4CAF50; font-weight: bold");
        console.log("[VOICE DEBUG] 입력(raw):", rawText);
        console.log("[VOICE DEBUG] 입력(normalized):", text);
        console.log("[VOICE DEBUG] ingredientsChecked:", ingredientsChecked);
        console.log("[VOICE DEBUG] cookingStarted:", cookingStarted);
        console.log("[VOICE DEBUG] currentStepIndex:", currentStepIndex);
        console.log("[VOICE DEBUG] recipeInfo:", recipeInfo);
        console.log("[VOICE DEBUG] ======================================");
        addMessage(text, "user");

        // ===== 1) 처음 레시피 생성 =====
        if (!recipeInfo) {
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
                addMessage("레시피를 불러오지 못했어요!", "assistant");
            }
            return;
        }

        const nowRecipe =
            typeof recipeInfo === "string" ? JSON.parse(recipeInfo) : recipeInfo;
        // ✅ 우선순위 0: 이미 요리 중일 때의 '다음/계속'은 무조건 "다음 단계"로 처리
        const compact = text.replace(/\s/g, "");
        const isPureNext =
            ["다음", "다음단계", "다음으로", "계속", "계속해"].some((kw) =>
                compact.includes(kw)
            );

        if (cookingStarted && isPureNext) {
            const total = nowRecipe.steps?.length ?? 0;
            const current = currentStepIndex;

            if (!completedSteps.includes(current)) {
                setCompletedSteps((prev) => [...prev, current]);
            }

            const next = current + 1;

            if (next < total) {
                setCurrentStepIndex(next);
                addMessage(buildStepMessage(next, nowRecipe.steps || []), "assistant");
            } else {
                setIsFinished(true);
                addMessage(
                    "모든 단계가 끝났습니다! ‘요리 완료’를 눌러주세요.",
                    "assistant"
                );
            }
            return; // <-- 여기서 바로 종료
        }
        // ===== 2) 재료 체크 단계 =====
        if (!ingredientsChecked) {
            const readyKeywords = ["다 있어", "다있어", "재료 다 있어", "재료다있어"];
            if (readyKeywords.some((k) => text.includes(k))) {
                setIngredientsChecked(true);
                addMessage("모든 재료가 준비되었군요! 요리를 시작할까요?", "assistant");
                return;
            }

            if (isStartIntent(text) || isNextIntent(text)) {
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
            if (isStartIntent(text) || isNextIntent(text)) {
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
            ["다음", "다했어", "됐어", "ㅇㅋ", "오케이"].some((kw) =>
                text.replace(/\s/g, "").includes(kw)
            )
        ) {
            const total = nowRecipe.steps?.length ?? 0;

            if (!completedSteps.includes(currentStepIndex)) {
                setCompletedSteps((prev) => [...prev, currentStepIndex]);
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

                // 🔥 더 이상 wake 자동 재시작 안 되도록 플래그 내림
                isWakeActiveRef.current = false;
                setIsWakeActive(false);

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
                // ✅ ⭐️ 이게 제일 중요
                id: recipeInfo.id ?? crypto.randomUUID(),

                name: recipeInfo.name ?? recipeInfo.recipeName ?? "이름 없는 레시피",
                image: recipeInfo.image ?? null,
                description: recipeInfo.description ?? null,
                category: recipeInfo.category ?? "기타",

                // ✅ ⭐️ ingredients 구조 반드시 맞춰야 함
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

                // ✅ steps는 문자열 배열 OK
                steps: Array.isArray(recipeInfo.steps)
                    ? recipeInfo.steps.map((s: any) => String(s))
                    : [],

                completedAt: new Date().toISOString(),

                cookingTime: recipeInfo.cookingTime ?? null,
                servings: recipeInfo.servings ?? null,
                difficulty: recipeInfo.difficulty ?? null,
            };

            console.log("✅ 최종 전송 payload:", payload);

            await addCompletedRecipe(payload);

            console.log("✅ DB 저장 성공");

            onCookingComplete?.(recipeInfo);
            onRecipeSelect(recipeInfo);

        } catch (err) {
            console.error("❌ 완료 레시피 저장 실패:", err);
            toast.error("완료한 레시피 저장에 실패했습니다.");
        }
    };




    // ===============================
    // 진행률 계산
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