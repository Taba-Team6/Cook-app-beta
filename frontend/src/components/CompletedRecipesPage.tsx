import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ChefHat, Clock, User } from "lucide-react";
import type { Recipe } from "./RecipeRecommendation";

interface CompletedRecipe extends Recipe {
  completedAt: string;
}

interface CompletedRecipesPageProps {
  completedRecipes: CompletedRecipe[];
  onRecipeClick?: (recipe: Recipe) => void;
}

export function CompletedRecipesPage({ completedRecipes, onRecipeClick }: CompletedRecipesPageProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "오늘";
    } else if (diffDays === 1) {
      return "어제";
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}주 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
            {completedRecipes.map((recipe, index) => (
              <Card
                key={`${recipe.id}-${index}`}
                className="hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => onRecipeClick?.(recipe)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{recipe.name}</CardTitle>
                        <Badge variant="outline" className="bg-primary/5">
                          완료
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {recipe.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {recipe.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{recipe.cookingTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{recipe.servings}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">🔥</span>
                          <span>{recipe.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <ChefHat className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary">
                      {formatDate(recipe.completedAt)}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
