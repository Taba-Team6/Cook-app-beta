import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ChefHat, Clock } from "lucide-react";
import type { Recipe } from "./RecipeListPage";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SavedPageProps {
  savedRecipes?: Recipe[];
  onRecipeClick?: (id: string) => void;
  onRemoveSaved?: (recipe: Recipe) => void;
}

// ✅ 예시 이미지 방지
const isPlaceholderImage = (url?: string) => {
  if (!url) return true;
  if (url.includes("photo-1604908176997-1251884b08a3")) return true;
  return false;
};

export function SavedPage({
  savedRecipes = [],
  onRecipeClick,
}: SavedPageProps) {
  const fallbackImage =
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=225&fit=crop";

  const buildImageFromTitle = (title: string) => {
    const query = encodeURIComponent(`${title}, 음식, 요리, food, dish`);
    return `https://source.unsplash.com/featured/?${query}`;
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ✅ HEADER */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <ChefHat className="w-6 h-6" />
            </div>
            <h1>저장한 레시피</h1>
          </div>
          <p className="text-muted-foreground">
            나중에 다시 만들 요리 {savedRecipes.length}개
          </p>
        </div>

        {/* ✅ EMPTY STATE */}
        {savedRecipes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="mb-2">저장한 레시피가 없습니다</h3>
              <p className="text-muted-foreground">마음에 드는 레시피를 저장해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">

            {/* ✅ LIST UI (완료한 요리랑 100% 동일 구조) */}
            {savedRecipes.map((recipe) => {
              const title = recipe.name || "이름 없는 레시피";

              let imageSrc: string;
              if (
                recipe.image &&
                recipe.image.startsWith("http") &&
                !isPlaceholderImage(recipe.image)
              ) {
                imageSrc = recipe.image;
              } else {
                imageSrc = buildImageFromTitle(title);
              }

              return (
                <Card
                  key={recipe.id}
                  className="hover:border-primary/40 transition-all cursor-pointer rounded-2xl"
                  onClick={() => onRecipeClick?.(String(recipe.id))}
                >
                  <div className="flex items-center">


                    {/* ✅ LEFT IMAGE */}
                    <div className="w-28 h-24 rounded-l-xl overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={imageSrc}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* ✅ RIGHT CONTENT */}
                    <div className="flex-1">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg line-clamp-1">
                            {title}
                          </CardTitle>
                          <Badge variant="outline" className="bg-[#E07A5F]/10 text-[#E07A5F]">
                            저장됨
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 pb-3">
                        

                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <ChefHat className="w-4 h-4 text-primary" />
                          <span>저장된 레시피</span>
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
