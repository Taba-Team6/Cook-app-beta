import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bookmark, Clock, TrendingUp } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export interface Recipe {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  time: string;
  image: string;
  description: string;
  cookingTime?: string;
  servings?: string;
  tags?: string[];
}

interface RecipeListPageProps {
  onRecipeClick?: (recipe: Recipe) => void;
  initialCategory?: string;
  savedRecipes?: Recipe[];
  onToggleSave?: (recipe: Recipe) => void;
}

export function RecipeListPage({ onRecipeClick, initialCategory = "전체", savedRecipes = [], onToggleSave }: RecipeListPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // initialCategory가 변경되면 selectedCategory 업데이트
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // 레시피가 저장되어 있는지 확인
  const isRecipeSaved = (recipeId: string) => {
    return savedRecipes.some(r => r.id === recipeId);
  };

  const categories = [
    { icon: "⭐", name: "전체", color: "#3A3A3A" },
    { icon: "🍚", name: "한식", color: "#A5B68D" },
    { icon: "🍝", name: "양식", color: "#E07A5F" },
    { icon: "🥟", name: "중식", color: "#F2CC8F" },
    { icon: "🍱", name: "일식", color: "#F4F1DE" },
    { icon: "🍽️", name: "기타", color: "#A5B68D" },
  ];

  const allRecipes: Recipe[] = [
    {
      id: "1",
      name: "김치볶음밥",
      category: "한식",
      difficulty: "쉬움",
      time: "20분",
      cookingTime: "20분",
      servings: "2인분",
      image: "https://images.unsplash.com/photo-1744870132190-5c02d3f8d9f9?w=400&h=225&fit=crop",
      description: "간단하고 빠르게 만들 수 있는 한국의 대표 요리",
      tags: ["한식", "간편식", "볶음밥"]
    },
    {
      id: "2",
      name: "스파게티 까르보나라",
      category: "양식",
      difficulty: "보통",
      time: "30분",
      cookingTime: "30분",
      servings: "2인분",
      image: "https://images.unsplash.com/photo-1588013273468-315fd88ea34c?w=400&h=225&fit=crop",
      description: "크리미한 소스가 일품인 이탈리아 파스타",
      tags: ["양식", "파스타", "크림"]
    },
    {
      id: "3",
      name: "된장찌개",
      category: "한식",
      difficulty: "쉬움",
      time: "25분",
      cookingTime: "25분",
      servings: "2인분",
      image: "https://images.unsplash.com/photo-1665395876131-7cf7cb099a51?w=400&h=225&fit=crop",
      description: "구수한 맛이 일품인 한국 전통 찌개",
      tags: ["한식", "찌개", "전통"]
    },
    {
      id: "4",
      name: "치킨 샐러드",
      category: "기타",
      difficulty: "쉬움",
      time: "15분",
      cookingTime: "15분",
      servings: "1인분",
      image: "https://images.unsplash.com/photo-1729719930828-6cd60cb7d10f?w=400&h=225&fit=crop",
      description: "신선한 채소와 닭가슴살로 만드는 건강 요리",
      tags: ["샐러드", "건강식", "다이어트"]
    },
    {
      id: "5",
      name: "오므라이스",
      category: "양식",
      difficulty: "보통",
      time: "25분",
      cookingTime: "25분",
      servings: "2인분",
      image: "https://images.unsplash.com/photo-1743148509702-2198b23ede1c?w=400&h=225&fit=crop",
      description: "부드러운 계란과 볶음밥의 조화",
      tags: ["양식", "계란", "볶음밥"]
    },
    {
      id: "6",
      name: "비빔밥",
      category: "한식",
      difficulty: "보통",
      time: "35분",
      cookingTime: "35분",
      servings: "2인분",
      image: "https://images.unsplash.com/photo-1718777791239-c473e9ce7376?w=400&h=225&fit=crop",
      description: "다양한 나물과 고기가 어우러진 영양 만점 한 그릇 요리",
      tags: ["한식", "비빔밥", "영양식"]
    },
    {
      id: "7",
      name: "토마토 파스타",
      category: "양식",
      difficulty: "쉬움",
      time: "20분",
      cookingTime: "20분",
      servings: "2인분",
      image: "https://images.unsplash.com/photo-1751151497799-8b4057a2638e?w=400&h=225&fit=crop",
      description: "신선한 토마토로 만드는 상큼한 파스타",
      tags: ["양식", "파스타", "토마토"]
    },
    {
      id: "8",
      name: "새우볶음밥",
      category: "중식",
      difficulty: "보통",
      time: "25분",
      cookingTime: "25분",
      servings: "2인분",
      image: "https://images.unsplash.com/photo-1747228469026-7298b12d9963?w=400&h=225&fit=crop",
      description: "통통한 새우가 들어간 고소한 볶음밥",
      tags: ["중식", "볶음밥", "새우"]
    },
    {
      id: "9",
      name: "연어초밥",
      category: "일식",
      difficulty: "어려움",
      time: "40분",
      cookingTime: "40분",
      servings: "2인분",
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=225&fit=crop",
      description: "신선한 연어로 만드는 정통 일본 초밥",
      tags: ["일식", "초밥", "연어"]
    },
    {
      id: "10",
      name: "규동",
      category: "일식",
      difficulty: "보통",
      time: "30분",
      cookingTime: "30분",
      servings: "2인분",
      image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=225&fit=crop",
      description: "달콤짭짤한 소고기 덮밥",
      tags: ["일식", "덮밥", "소고기"]
    },
    {
      id: "11",
      name: "마파두부",
      category: "중식",
      difficulty: "보통",
      time: "30분",
      cookingTime: "30분",
      servings: "2인분",
      image: "https://images.unsplash.com/photo-1672732608910-ffe083446f9f?w=400&h=225&fit=crop",
      description: "얼얼한 맛이 일품인 사천식 두부 요리",
      tags: ["중식", "두부", "매운맛"]
    }
  ];

  // 카테고리별 레시피 필터링
  const filteredRecipes = selectedCategory === "전체" 
    ? allRecipes 
    : allRecipes.filter(recipe => recipe.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 카테고리 섹션 */}
        <div className="mb-8">
          <h2 className="mb-4">카테고리</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category.name)}
                className="flex-shrink-0 flex flex-col items-center gap-2 min-w-[70px] py-2"
              >
                <div 
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all ${
                    selectedCategory === category.name 
                      ? 'scale-110 ring-2 ring-offset-1' 
                      : 'hover:scale-105'
                  }`}
                  style={{ 
                    backgroundColor: category.color + (selectedCategory === category.name ? "" : "20"),
                    ringColor: selectedCategory === category.name ? category.color : undefined
                  }}
                >
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <span className={`text-xs transition-all ${
                  selectedCategory === category.name ? 'font-semibold' : ''
                }`}>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 레시피 목록 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2>{selectedCategory} 레시피</h2>
            <Badge variant="secondary" className="ml-2">{filteredRecipes.length}개</Badge>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRecipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-primary/40"
                onClick={() => onRecipeClick?.(recipe)}
              >
                <div className="aspect-video relative bg-muted">
                  <ImageWithFallback
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                  {/* 저장하기 버튼 */}
                  <Button
                    size="icon"
                    variant="secondary"
                    className={`absolute top-2 right-2 w-9 h-9 rounded-full shadow-lg backdrop-blur-sm transition-all ${
                      isRecipeSaved(recipe.id) 
                        ? 'bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white' 
                        : 'bg-white/90 hover:bg-white text-gray-700'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave?.(recipe);
                    }}
                  >
                    <Bookmark className={`w-4 h-4 ${isRecipeSaved(recipe.id) ? 'fill-current' : ''}`} />
                  </Button>
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
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {recipe.time}
                    </div>
                    <div>📊 {recipe.difficulty}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
