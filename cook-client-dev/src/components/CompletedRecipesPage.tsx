import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ChefHat, Clock, User } from "lucide-react";
import type { Recipe } from "../types/recipe";
import type { CompletedRecipe } from "../utils/api";
import { ImageWithFallback } from "./figma/ImageWithFallback";


// GPT가 준 이미지가 "예시용" 혹은 이상한지 판단
const isPlaceholderImage = (url?: string) => {
  if (!url) return true;

  // GPT 프롬프트에 넣어둔 예시 URL을 그대로 쓰는 경우 방지
  if (url.includes("photo-1604908176997-1251884b08a3")) return true;

  // 필요하면 이런 패턴들 더 추가 가능
  // if (url.includes("some-other-sample-id")) return true;

  return false;
};


interface CompletedRecipesPageProps {
  completedRecipes: CompletedRecipe[];
  onRecipeClick?: (recipe: CompletedRecipe) => void;
}

const formatDate = (dateString: string) => {
  // 🔥 UTC로 들어온 걸 KST로 강제 보정
  const date = new Date(dateString);
  const kstTime = date.getTime() + 9 * 60 * 60 * 1000;

  const now = Date.now();
  const diffSec = Math.floor((now - kstTime) / 1000);

  if (diffSec < 30) return "방금 전";
  if (diffSec < 60) return `${diffSec}초 전`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "어제";
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;

  return new Date(kstTime).toLocaleDateString("ko-KR");
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

        {/* HEADER */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {/* 왼쪽: 아이콘 + 타이틀 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <ChefHat className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-semibold leading-none">
                완료한 요리
              </h1>
            </div>
            {/* 오른쪽: 완료한 레시피 개수 */}
            <Badge
              className="
                flex items-center
                h-9
                px-4
                text-sm
                font-semibold
                rounded-full

                !bg-[#4f5f45]
                !text-white

                !border-0
                shadow-sm
              "
            >
              완료한 레시피 {completedRecipes.length}개
            </Badge>
          </div>

            {/* 설명은 따로 */}
            <p className="text-muted-foreground">
              요리를 다시 진행하고 싶다면 선택해보세요. AI 요리 보조가 바로 실행됩니다.
            </p>
          </div>

        {/* EMPTY STATE */}
        {completedRecipes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="mb-2">아직 완료한 요리가 없습니다</h3>
              <p className="text-muted-foreground">첫 번째 요리를 완성해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">

            {/* LIST */}
            {completedRecipes.map((recipe, index) => {
              const r = recipe as CompletedRecipe & { recipeName?: string };
              const title = r.name || r.recipeName || "이름 없는 레시피";

              // ✅ 두 번째 코드의 이미지 처리 로직 완전 반영
              let imageSrc: string;
              if (
                recipe.image &&
                recipe.image.startsWith("http") &&
                !isPlaceholderImage(recipe.image)
              ) {
                imageSrc = recipe.image;
              } else if (title && title !== "이름 없는 레시피") {
                imageSrc = buildImageFromTitle(title);
              } else {
                imageSrc = fallbackImage;
              }

              return (
                <Card
                  key={recipe.id}
                  className="hover:border-primary/40 transition-all cursor-pointer rounded-2xl"
                  onClick={() => onRecipeClick?.(recipe)}
                >
                  <div className="flex items-center">


                    {/* ✅ LEFT IMAGE (기존 ImageWithFallback 유지) */}
                    <div className="w-28 h-24 rounded-l-xl overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={imageSrc}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>


                    {/* ✅ RIGHT CARD CONTENT (디자인 유지) */}
                    <div className="flex-1">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg line-clamp-1">
                            {title}
                          </CardTitle>
                          <Badge variant="outline" className="bg-primary/5">
                            완료
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 pb-3">
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
