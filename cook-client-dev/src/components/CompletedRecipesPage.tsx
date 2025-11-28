import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ChefHat, Clock, User } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Recipe } from "../types/recipe";

// GPT가 준 이미지가 "예시용" 혹은 이상한지 판단
const isPlaceholderImage = (url?: string) => {
  if (!url) return true;

  // GPT 프롬프트에 넣어둔 예시 URL을 그대로 쓰는 경우 방지
  if (url.includes("photo-1604908176997-1251884b08a3")) return true;

  // 필요하면 이런 패턴들 더 추가 가능
  // if (url.includes("some-other-sample-id")) return true;

  return false;
};

// 레시피 이름으로 Unsplash 대표 이미지 생성
const buildImageFromTitle = (title: string) => {
  // 제목 기반으로 검색 태그 구성 (한식/요리/food 등)
  const query = encodeURIComponent(`${title}, 음식, 요리, food, dish`);
  return `https://source.unsplash.com/featured/?${query}`;
};

interface CompletedRecipe {
  id: string;
  name: string;
  recipeName?: string;
  image: string | null;
  description: string | null;
  category: string;
  cooking_method: string | null;
  hashtags: string | null;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  completedAt: string;
  cookingTime?: number | string;
  servings?: number | string;
  difficulty?: string;
}


interface CompletedRecipesPageProps {
  completedRecipes: CompletedRecipe[];
  onRecipeClick?: (recipe: CompletedRecipe) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return date.toLocaleDateString("ko-KR");
};

export function CompletedRecipesPage({
  completedRecipes,
  onRecipeClick,
}: CompletedRecipesPageProps) {
  const fallbackImage =
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=225&fit=crop";
  
  const buildImageFromTitle = (title: string) => {
    const query = encodeURIComponent(`${title}, 음식, 요리, food, dish`);
    return `https://source.unsplash.com/featured/?${query}`;
  };


  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 상단 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <ChefHat className="w-6 h-6" />
            </div>
            <h1>완료한 요리</h1>
          </div>
          <p className="text-muted-foreground">
            지금까지 완료한 {completedRecipes.length}개의 레시피
          </p>
        </div>

        {/* 비어 있을 때 */}
        {completedRecipes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="mb-2">아직 완료한 요리가 없습니다</h3>
              <p className="text-muted-foreground">
                첫 번째 요리를 완성해보세요!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {completedRecipes.map((recipe, index) => {
              const title =
                recipe.name || recipe.recipeName || "이름 없는 레시피";

              let imageSrc: string;

              if (recipe.image && recipe.image.startsWith("http")) {
                imageSrc = recipe.image;
              } else if (title && title !== "이름 없는 레시피") {
                imageSrc = buildImageFromTitle(title);
              } else {
                imageSrc = fallbackImage;
              }

              return (
                <Card
                  key={`${title}-${recipe.completedAt}-${index}`}
                  className="hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => onRecipeClick?.(recipe)}
                >
                  <div className="flex">
                    {/* 왼쪽 요리 사진 */}
                    <div className="w-28 h-24 rounded-l-xl overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={imageSrc}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 오른쪽 정보 */}
                    <div className="flex-1">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          {/* 🔥 메뉴 이름만 */}
                          <CardTitle className="text-lg line-clamp-1">
                            {title}
                          </CardTitle>
                          <Badge variant="outline" className="bg-primary/5">
                            완료
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 pb-3">
                        {/* 시간/인분/난이도는 있을 때만 보여주기 (없으면 깔끔히 숨김) */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {recipe.cookingTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {typeof recipe.cookingTime === "number"
                                  ? `${recipe.cookingTime}분`
                                  : recipe.cookingTime}
                              </span>
                            </div>
                          )}

                          {recipe.servings && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{recipe.servings}</span>
                            </div>
                          )}
                          {recipe.difficulty && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">🔥</span>
                              <span>{recipe.difficulty}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <ChefHat className="w-4 h-4 text-primary" />
                          <span>{formatDate(recipe.completedAt)}</span>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
