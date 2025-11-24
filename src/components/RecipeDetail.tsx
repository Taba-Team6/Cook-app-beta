import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Clock,
  Users,
  ChefHat,
  Check,
  ArrowRight,
  Volume2,
  VolumeX,
  Lightbulb,
  ArrowLeft
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// DB 상세 API 기반 Recipe 타입
interface RecipeDetailApi {
  id: string;
  name: string;
  category: string | null;
  cooking_method: string | null;
  calories: string | null;
  carbs: string | null;
  protein: string | null;
  fat: string | null;
  sodium?: string | null;
  hashtags: string | null;
  image: string | null;
  ingredients: string; // 긴 문자열
  steps: { step: number; text: string; image: string | null }[];
}

interface RecipeDetailProps {
  recipe: RecipeDetailApi;
  onComplete: () => void;
  onBack: () => void;
}

export function RecipeDetail({ recipe, onComplete, onBack }: RecipeDetailProps) {
  // 조리 단계 진행 상태
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showTips, setShowTips] = useState(false);

  // 식약처 데이터 포맷에 맞춰 ingredients 문자열 → 배열로 변환
  const ingredientList = recipe.ingredients
    .replace(/\r/g, "")
    .split("\n")
    .map(v => v.trim())
    .filter(v => v.length > 0);

  // steps는 text를 기반으로 렌더링
  const stepTexts = recipe.steps.map(s => s.text);

  const progress = (completedSteps.length / stepTexts.length) * 100;

  useEffect(() => {
    if (voiceEnabled && currentStep < stepTexts.length) {
      console.log(`음성 가이드: ${stepTexts[currentStep]}`);
    }
  }, [currentStep, voiceEnabled, stepTexts]);

  const handleStepComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < stepTexts.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getVoiceGuidance = (step: string) => {
    const guidance = [
      "천천히 진행하세요. 급하게 하지 않아도 됩니다.",
      "훌륭하게 하고 있어요. 다음 단계로 넘어가세요.",
      "이 단계는 중요합니다. 주의깊게 진행해주세요.",
      "좋아요! 거의 다 왔습니다.",
      "깔끔하게 진행되고 있어요. 지금처럼만 유지하세요."
    ];
    return guidance[Math.floor(Math.random() * guidance.length)];
  };

  const allStepsCompleted = completedSteps.length === stepTexts.length;

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            레시피 목록으로
          </Button>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h1>{recipe.name}</h1>

              <div className="flex flex-wrap gap-4 mt-4">

                {/* 식약처 API는 cooking_time, servings, difficulty가 없음 → 표기 제외 */}
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-green-600" />
                  <span>{recipe.cooking_method || "조리법 정보 없음"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span>조리 시간 정보 없음</span>
                </div>

              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5 text-green-600" /> : <VolumeX className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>진행 상황</span>
                <span>
                  {completedSteps.length} / {stepTexts.length} 단계
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Current Step */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    단계 {currentStep + 1} / {stepTexts.length}
                  </CardTitle>

                  {completedSteps.includes(currentStep) && (
                    <Badge className="bg-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      완료
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="leading-relaxed">{stepTexts[currentStep]}</p>

                {recipe.steps[currentStep]?.image && (
                  <ImageWithFallback
                    src={recipe.steps[currentStep].image!}
                    alt={`step-${currentStep + 1}`}
                    className="rounded-lg w-full"
                  />
                )}

                {voiceEnabled && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Volume2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="mb-1">AI 음성 가이드</p>
                        <p className="text-sm text-muted-foreground">
                          {getVoiceGuidance(stepTexts[currentStep])}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 0}
                    className="flex-1"
                  >
                    이전 단계
                  </Button>

                  <Button
                    onClick={handleStepComplete}
                    disabled={currentStep === stepTexts.length - 1 && allStepsCompleted}
                    className="flex-1"
                  >
                    {currentStep === stepTexts.length - 1 ? (
                      "단계 완료"
                    ) : (
                      <>
                        다음 단계 <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 전체 조리 과정 */}
            <Card>
              <CardHeader>
                <CardTitle>전체 조리 과정</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {stepTexts.map((step, idx) => (
                    <li
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        idx === currentStep
                          ? "bg-green-100 border-2 border-green-300"
                          : completedSteps.includes(idx)
                          ? "bg-green-50 opacity-60"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          completedSteps.includes(idx)
                            ? "bg-green-600 text-white"
                            : idx === currentStep
                            ? "bg-green-600 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        {completedSteps.includes(idx) ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>

                      <span className={idx === currentStep ? "" : "text-muted-foreground"}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* 이미지 */}
            <Card className="overflow-hidden">
              <ImageWithFallback
                src={recipe.image || ""}
                alt={recipe.name}
                className="w-full h-48 object-cover"
              />
            </Card>

            {/* 재료 */}
            <Card>
              <CardHeader>
                <CardTitle>재료</CardTitle>
                <CardDescription>식약처 제공 기준</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {ingredientList.map((ing, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      {ing}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 조리 팁 → 식약처는 팁 없음 → 임시 비어있는 목록 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    조리 팁
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowTips(!showTips)}>
                    {showTips ? "숨기기" : "보기"}
                  </Button>
                </div>
              </CardHeader>

              {showTips && (
                <CardContent>
                  <p className="text-sm text-gray-500">식약처 레시피에는 별도의 팁 정보가 없습니다.</p>
                </CardContent>
              )}
            </Card>

            {/* 영양 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>영양 정보</CardTitle>
                <CardDescription>1회 제공량 기준</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>칼로리</span>
                  <span>{recipe.calories || "-"} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span>단백질</span>
                  <span>{recipe.protein || "-"} g</span>
                </div>
                <div className="flex justify-between">
                  <span>탄수화물</span>
                  <span>{recipe.carbs || "-"} g</span>
                </div>
                <div className="flex justify-between">
                  <span>지방</span>
                  <span>{recipe.fat || "-"} g</span>
                </div>
              </CardContent>
            </Card>

            {allStepsCompleted && (
              <Button onClick={onComplete} className="w-full" size="lg">
                요리 완료 및 피드백 제공
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
