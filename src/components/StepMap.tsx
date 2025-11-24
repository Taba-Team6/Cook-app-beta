import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock, 
  Star,
  Home,
  PlayCircle,
  PauseCircle,
  SkipForward
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { startCookingSession, finishCookingSession, getRecipeDetail } from "../utils/api";
import { toast } from "sonner@2.0.3";

interface Step {
  step: number;
  text: string;
  image: string | null;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  cooking_method: string;
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
  sodium: string;
  hashtags: string;
  image: string;
  ingredients: string;
  steps: Step[];
}

interface StepMapProps {
  recipeId: string;
  onBack: () => void;
}

export function StepMap({ recipeId, onBack }: StepMapProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [memo, setMemo] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadRecipeDetail();
  }, [recipeId]);

  // Timer
  useEffect(() => {
    if (!startTime || isPaused) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isPaused]);

  const loadRecipeDetail = async () => {
    setLoading(true);
    try {
      console.log(`[StepMap] Loading recipe detail for ID: ${recipeId}`);
      
      const response = await getRecipeDetail(recipeId);
      
      console.log(`[StepMap] Recipe loaded:`, response.recipe);
      console.log(`[StepMap] Steps count:`, response.recipe?.steps?.length || 0);
      
      if (!response.recipe || !response.recipe.steps || response.recipe.steps.length === 0) {
        toast.error("레시피 단계 정보를 찾을 수 없습니다");
        setLoading(false);
        return;
      }
      
      setRecipe(response.recipe);
      
      // 세션 시작
      const sessionResponse = await startCookingSession(response.recipe.id, response.recipe.name);
      setSessionId(sessionResponse.session_id);
      setStartTime(new Date());
      
      toast.success("조리를 시작합니다!");
    } catch (error: any) {
      console.error("[StepMap] Failed to load recipe:", error);
      toast.error(error.message || "레시피를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (recipe && currentStep < recipe.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      toast.success(`${currentStep + 2}단계로 이동했습니다`);
    } else {
      // 마지막 단계
      setIsCompleteDialogOpen(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!sessionId) {
      toast.error("세션 정보를 찾을 수 없습니다");
      return;
    }

    try {
      await finishCookingSession(sessionId, rating || undefined, memo || undefined);
      toast.success("조리가 완료되었습니다! 🎉");
      onBack();
    } catch (error) {
      console.error("Failed to finish session:", error);
      toast.error("조리 완료 처리에 실패했습니다");
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">레시피를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!recipe || !recipe.steps || recipe.steps.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-24 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">레시피 정보를 찾을 수 없습니다</p>
            <Button onClick={onBack}>돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentStep + 1) / recipe.steps.length) * 100;
  const currentStepData = recipe.steps[currentStep];

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <Home className="w-4 h-4 mr-2" />
            처음으로
          </Button>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="mb-1">{recipe.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{recipe.category}</Badge>
                <Badge variant="outline">{recipe.cooking_method}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-lg font-medium">{formatTime(elapsedTime)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? (
                  <>
                    <PlayCircle className="w-4 h-4 mr-1" />
                    재개
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-4 h-4 mr-1" />
                    일시정지
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>단계 {currentStep + 1} / {recipe.steps.length}</span>
              <span>{Math.round(progress)}% 완료</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Current Step */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                <span className="text-primary mr-2">#{currentStepData.step}</span>
                단계
              </CardTitle>
              {currentStep === recipe.steps.length - 1 && (
                <Badge className="bg-green-600">마지막 단계</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStepData.image && (
              <div className="rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={currentStepData.image}
                  alt={`단계 ${currentStepData.step}`}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}
            
            <p className="text-lg leading-relaxed">{currentStepData.text}</p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            이전
          </Button>
          
          {currentStep < recipe.steps.length - 1 ? (
            <Button onClick={handleNext} className="flex-1">
              다음
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => setIsCompleteDialogOpen(true)} className="flex-1 bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" />
              완료
            </Button>
          )}
        </div>

        {/* All Steps Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>전체 단계</CardTitle>
            <CardDescription>클릭하여 해당 단계로 이동</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recipe.steps.map((step, index) => (
                <button
                  key={step.step}
                  onClick={() => setCurrentStep(index)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    index === currentStep
                      ? 'border-primary bg-primary/5'
                      : index < currentStep
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      index < currentStep
                        ? 'bg-green-600 text-white'
                        : index === currentStep
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index < currentStep ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span>{step.step}</span>
                      )}
                    </div>
                    <p className={`flex-1 ${index === currentStep ? 'font-medium' : ''}`}>
                      {step.text.length > 60 ? step.text.substring(0, 60) + '...' : step.text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Complete Dialog */}
        <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>조리 완료! 🎉</DialogTitle>
              <DialogDescription>
                {recipe.name}를 완성했습니다. 어떠셨나요?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="mb-2">평점을 남겨주세요</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-lg transition-colors ${
                        star <= rating
                          ? 'text-yellow-500'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="w-6 h-6" fill={star <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2">메모 (선택)</p>
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="조리하면서 느낀 점이나 개선사항을 적어주세요"
                  rows={3}
                />
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  조리 시간: <span className="font-medium text-foreground">{formatTime(elapsedTime)}</span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                완료
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}