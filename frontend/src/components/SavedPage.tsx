import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bookmark, Clock, X } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import type { Recipe } from "./RecipeListPage";

interface SavedPageProps {
  savedRecipes?: Recipe[];
  onRecipeClick?: (recipe: Recipe) => void;
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
                onClick={() => onRecipeClick?.(recipe)}
              >
                <div className="aspect-video relative bg-muted">
                  <ImageWithFallback
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSaved?.(recipe);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-[#E07A5F] text-white">
                      <Bookmark className="w-3 h-3 mr-1 fill-current" />
                      저장됨
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{recipe.name}</CardTitle>
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
