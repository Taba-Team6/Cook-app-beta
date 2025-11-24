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
import type { Recipe } from "./RecipeRecommendation";

interface RecipeDetailProps {
  recipe: Recipe;
  onComplete: () => void;
  onBack: () => void;
}

export function RecipeDetail({ recipe, onComplete, onBack }: RecipeDetailProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showTips, setShowTips] = useState(false);

  const progress = (completedSteps.length / recipe.steps.length) * 100;

  useEffect(() => {
    if (voiceEnabled && currentStep < recipe.steps.length) {
      // Simulate voice guidance - in real app, this would use Web Speech API
      console.log(`음성 가이드: ${recipe.steps[currentStep]}`);
    }
  }, [currentStep, voiceEnabled, recipe.steps]);

  const handleStepComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < recipe.steps.length - 1) {
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
      "완벽하게 하고 있어요! 다음 단계로 넘어가세요.",
      "이 단계는 중요합니다. 주의깊게 진행해주세요.",
      "좋아요! 거의 다 왔습니다.",
      "훌륭해요! 계속 이대로 진행하세요.",
    ];
    return guidance[Math.floor(Math.random() * guidance.length)];
  };

  const allStepsCompleted = completedSteps.length === recipe.steps.length;

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
              <p className="text-muted-foreground mt-2">{recipe.description}</p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span>{recipe.cookingTime}분</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span>{recipe.servings}인분</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-green-600" />
                  <span>{recipe.difficulty}</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
            >
              {voiceEnabled ? (
                <Volume2 className="w-5 h-5 text-green-600" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
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
                  {completedSteps.length} / {recipe.steps.length} 단계
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
                    단계 {currentStep + 1} / {recipe.steps.length}
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
                <p className="leading-relaxed">{recipe.steps[currentStep]}</p>

                {voiceEnabled && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Volume2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="mb-1">AI 음성 가이드</p>
                        <p className="text-sm text-muted-foreground">
                          {getVoiceGuidance(recipe.steps[currentStep])}
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
                    disabled={currentStep === recipe.steps.length - 1 && allStepsCompleted}
                    className="flex-1"
                  >
                    {currentStep === recipe.steps.length - 1 ? (
                      "단계 완료"
                    ) : (
                      <>
                        다음 단계
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* All Steps Overview */}
            <Card>
              <CardHeader>
                <CardTitle>전체 조리 과정</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {recipe.steps.map((step, index) => (
                    <li
                      key={index}
                      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        index === currentStep
                          ? "bg-green-100 border-2 border-green-300"
                          : completedSteps.includes(index)
                          ? "bg-green-50 opacity-60"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setCurrentStep(index)}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          completedSteps.includes(index)
                            ? "bg-green-600 text-white"
                            : index === currentStep
                            ? "bg-green-600 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        {completedSteps.includes(index) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <span className={index === currentStep ? "" : "text-muted-foreground"}>
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
            {/* Recipe Image */}
            <Card className="overflow-hidden">
              <ImageWithFallback
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-48 object-cover"
              />
            </Card>

            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle>재료</CardTitle>
                <CardDescription>{recipe.servings}인분 기준</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className={!ingredient.hasIt ? "text-amber-600" : ""}>
                        {ingredient.name}
                      </span>
                      <span className="text-muted-foreground">{ingredient.amount}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    조리 팁
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTips(!showTips)}
                  >
                    {showTips ? "숨기기" : "보기"}
                  </Button>
                </div>
              </CardHeader>
              {showTips && (
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {recipe.tips.map((tip, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-green-600">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>

            {/* Nutrition */}
            <Card>
              <CardHeader>
                <CardTitle>영양 정보</CardTitle>
                <CardDescription>1인분 기준</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>칼로리</span>
                  <span>{recipe.calories}kcal</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>단백질</span>
                  <span>{recipe.nutrition.protein}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>탄수화물</span>
                  <span>{recipe.nutrition.carbs}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>지방</span>
                  <span>{recipe.nutrition.fat}g</span>
                </div>
              </CardContent>
            </Card>

            {/* Complete Button */}
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
