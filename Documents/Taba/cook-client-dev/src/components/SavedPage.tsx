import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bookmark, X } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import type { Recipe } from "./RecipeListPage";

interface SavedPageProps {
  savedRecipes?: Recipe[];
  onRecipeClick?: (id: string) => void;
  onRemoveSaved?: (recipe: Recipe) => void;
}

export function SavedPage({ savedRecipes = [], onRecipeClick, onRemoveSaved }: SavedPageProps) {
  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2">저장한 레시피</h1>
          <p className="text-muted-foreground">
            나중에 다시 만들고 싶은 레시피를 모아보세요
          </p>
        </div>

        {savedRecipes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRecipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => onRecipeClick?.(recipe.id)}
              >
                {/* 이미지 */}
                <div className="aspect-video relative bg-muted">
                  {recipe.image && (
                    <ImageWithFallback
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* 삭제 버튼 */}
                  <div className="absolute top-2 right-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-lg"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        onRemoveSaved?.(recipe);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* 저장됨 배지 */}
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-[#E07A5F] text-white">
                      <Bookmark className="w-3 h-3 mr-1 fill-current" />
                      저장됨
                    </Badge>
                  </div>
                </div>

                {/* 카드 내용 */}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{recipe.name}</CardTitle>

                    {/* 카테고리 */}
                    <Badge variant="secondary">
                      {recipe.category || "카테고리 없음"}
                    </Badge>
                  </div>

                  {/* cooking_method 대체 설명 */}
                  <CardDescription className="text-xs mt-1">
                    조리법: {recipe.cooking_method || "정보 없음"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {/* 해시태그 */}
                    <div className="truncate">
                      {recipe.hashtags
                        ? `#${recipe.hashtags
                            .split(",")
                            .map((t) => t.trim())
                            .join(" #")}`
                        : "해시태그 없음"}
                    </div>

                    {/* 재료 개수 */}
                    <div className="text-primary font-semibold">
                      재료 {recipe.ingredients_count}개
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2">저장한 레시피가 없습니다</h3>
              <p className="text-muted-foreground">
                마음에 드는 레시피를 저장해보세요
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
