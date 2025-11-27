import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { X, Plus } from "lucide-react";

export interface CookingContext {
  ingredients: string[];
  cookingTime: string;
  numberOfPeople: string;
  preferences: string[];
}

interface IngredientsInputProps {
  onComplete: (context: CookingContext) => void;
  onBack: () => void;
}

export function IngredientsInput({ onComplete, onBack }: IngredientsInputProps) {
  const [context, setContext] = useState<CookingContext>({
    ingredients: [],
    cookingTime: "",
    numberOfPeople: "",
    preferences: [],
  });

  const [ingredientInput, setIngredientInput] = useState("");

  const preferenceOptions = [
    "매운 맛",
    "담백한 맛",
    "달콤한 맛",
    "간단한 조리",
    "건강식",
    "다이어트",
  ];

  const addIngredient = () => {
    if (ingredientInput.trim() && !context.ingredients.includes(ingredientInput.trim())) {
      setContext({
        ...context,
        ingredients: [...context.ingredients, ingredientInput.trim()],
      });
      setIngredientInput("");
    }
  };

  const removeIngredient = (ingredient: string) => {
    setContext({
      ...context,
      ingredients: context.ingredients.filter((i) => i !== ingredient),
    });
  };

  const togglePreference = (preference: string) => {
    setContext({
      ...context,
      preferences: context.preferences.includes(preference)
        ? context.preferences.filter((p) => p !== preference)
        : [...context.preferences, preference],
    });
  };

  const handleSubmit = () => {
    if (context.ingredients.length > 0 && context.cookingTime && context.numberOfPeople) {
      onComplete(context);
    }
  };

  const commonIngredients = [
    "양파", "마늘", "대파", "당근", "감자",
    "달걀", "우유", "치즈", "버터",
    "닭고기", "돼지고기", "소고기",
    "쌀", "면", "빵",
    "간장", "고추장", "된장", "식용유"
  ];

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1>재료 입력</h1>
          <p className="text-muted-foreground mt-2">
            현재 사용 가능한 재료와 상황을 알려주세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>보유 재료</CardTitle>
            <CardDescription>냉장고에 있는 재료를 입력하거나 자주 쓰는 재료를 선택해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="예: 토마토, 양배추, 소고기"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient();
                  }
                }}
              />
              <Button type="button" onClick={addIngredient} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {context.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 bg-green-50 rounded-lg">
                {context.ingredients.map((ingredient) => (
                  <Badge key={ingredient} className="gap-1 bg-green-600">
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div>
              <p className="mb-3 text-muted-foreground">자주 사용하는 재료 (클릭하여 추가)</p>
              <div className="flex flex-wrap gap-2">
                {commonIngredients.map((ingredient) => (
                  <Badge
                    key={ingredient}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      context.ingredients.includes(ingredient)
                        ? "bg-green-100 border-green-600"
                        : "hover:bg-green-50"
                    }`}
                    onClick={() => {
                      if (context.ingredients.includes(ingredient)) {
                        removeIngredient(ingredient);
                      } else {
                        setContext({
                          ...context,
                          ingredients: [...context.ingredients, ingredient],
                        });
                      }
                    }}
                  >
                    {ingredient}
                    {context.ingredients.includes(ingredient) && (
                      <span className="ml-1">✓</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>조리 시간</CardTitle>
            <CardDescription>얼마나 시간을 투자할 수 있나요?</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={context.cookingTime}
              onValueChange={(value) => setContext({ ...context, cookingTime: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15분 이내 (초간단)</SelectItem>
                <SelectItem value="30">30분 이내</SelectItem>
                <SelectItem value="60">1시간 이내</SelectItem>
                <SelectItem value="90">1시간 30분 이내</SelectItem>
                <SelectItem value="120+">시간 상관없음</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>인원수</CardTitle>
            <CardDescription>몇 인분이 필요한가요?</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={context.numberOfPeople}
              onValueChange={(value) => setContext({ ...context, numberOfPeople: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1인분</SelectItem>
                <SelectItem value="2">2인분</SelectItem>
                <SelectItem value="3-4">3-4인분</SelectItem>
                <SelectItem value="5+">5인분 이상</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>선호 스타일</CardTitle>
            <CardDescription>오늘 어떤 요리를 원하시나요? (복수 선택 가능)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {preferenceOptions.map((preference) => (
                <div key={preference} className="flex items-center space-x-2">
                  <Checkbox
                    id={preference}
                    checked={context.preferences.includes(preference)}
                    onCheckedChange={() => togglePreference(preference)}
                  />
                  <Label htmlFor={preference} className="cursor-pointer">
                    {preference}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={onBack} className="flex-1">
            이전
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              context.ingredients.length === 0 ||
              !context.cookingTime ||
              !context.numberOfPeople
            }
            className="flex-1"
          >
            레시피 추천 받기
          </Button>
        </div>
      </div>
    </div>
  );
}
