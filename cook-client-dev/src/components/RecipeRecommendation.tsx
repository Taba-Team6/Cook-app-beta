import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Clock, Users, ChefHat, Flame, Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { CookingContext } from "./IngredientsInput";
import type { UserProfile } from "./ProfileSetup";

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  cookingTime: number;
  servings: number;
  difficulty: string;
  calories: number;
  ingredients: { name: string; amount: string; hasIt: boolean }[];
  steps: string[];
  tips: string[];
  nutrition: { protein: number; carbs: number; fat: number };
}

interface RecipeRecommendationProps {
  profile: UserProfile;
  context?: CookingContext;
  onSelectRecipe: (recipe: Recipe) => void;
  onBack: () => void;
  onAddIngredients?: () => void;
}

export function RecipeRecommendation({
  profile,
  context,
  onSelectRecipe,
  onBack,
  onAddIngredients,
}: RecipeRecommendationProps) {
  // Mock recipe generation based on profile and optional ingredients
  const generateRecipes = (): Recipe[] => {
    const hasIngredient = (ing: string) => 
      context?.ingredients.some(i => i.includes(ing) || ing.includes(i)) ?? true;

    const recipes: Recipe[] = [];

    // Recipe 1: 김치볶음밥
    if (hasIngredient("김치") || hasIngredient("쌀") || hasIngredient("달걀")) {
      recipes.push({
        id: "1",
        name: "김치볶음밥",
        description: "간단하고 맛있는 한식 대표 요리",
        image: "https://images.unsplash.com/photo-1642339800099-921df1a0a958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMGJvd2x8ZW58MXx8fHwxNzYyNjc1OTQyfDA&ixlib=rb-4.1.0&q=80&w=1080",
        cookingTime: 20,
        servings: 2,
        difficulty: "초급",
        calories: 450,
        ingredients: [
          { name: "김치", amount: "1컵", hasIt: hasIngredient("김치") },
          { name: "밥", amount: "2공기", hasIt: hasIngredient("쌀") || hasIngredient("밥") },
          { name: "달걀", amount: "2개", hasIt: hasIngredient("달걀") },
          { name: "식용유", amount: "2큰술", hasIt: hasIngredient("식용유") },
          { name: "참기름", amount: "1작은술", hasIt: hasIngredient("참기름") },
          { name: "김가루", amount: "약간", hasIt: false },
        ],
        steps: [
          "팬에 식용유를 두르고 중불로 가열합니다",
          "김치를 잘게 썰어 팬에 넣고 볶습니다",
          "김치가 익으면 밥을 넣고 함께 볶습니다",
          "밥알이 풀어지면 참기름을 넣고 섞습니다",
          "프라이팬을 따로 준비해 계란후라이를 만듭니다",
          "접시에 볶음밥을 담고 계란후라이를 올립니다",
          "김가루를 뿌려 완성합니다"
        ],
        tips: [
          "김치는 너무 묵은 것보다 적당히 익은 것이 좋습니다",
          "밥은 찬밥을 사용하면 더 잘 볶아집니다",
          "마지막에 참기름을 넣으면 고소한 향이 납니다"
        ],
        nutrition: { protein: 15, carbs: 65, fat: 18 },
      });
    }

    // Recipe 2: 된장찌개
    if (hasIngredient("된장") || hasIngredient("두부") || hasIngredient("감자")) {
      recipes.push({
        id: "2",
        name: "된장찌개",
        description: "구수하고 건강한 한식 국물 요리",
        image: "https://images.unsplash.com/photo-1740727665746-cfe80ababc23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwY29va2luZyUyMHByZXBhcmF0aW9ufGVufDF8fHx8MTc2Mjc0OTY1M3ww&ixlib=rb-4.1.0&q=80&w=1080",
        cookingTime: 30,
        servings: 3,
        difficulty: "초급",
        calories: 180,
        ingredients: [
          { name: "된장", amount: "2큰술", hasIt: hasIngredient("된장") },
          { name: "두부", amount: "1/2모", hasIt: hasIngredient("두부") },
          { name: "감자", amount: "1개", hasIt: hasIngredient("감자") },
          { name: "양파", amount: "1/2개", hasIt: hasIngredient("양파") },
          { name: "대파", amount: "1대", hasIt: hasIngredient("대파") },
          { name: "마늘", amount: "3쪽", hasIt: hasIngredient("마늘") },
          { name: "고추", amount: "1개", hasIt: hasIngredient("고추") },
        ],
        steps: [
          "감자와 양파는 한입 크기로 썰어줍니다",
          "냄비에 물 4컵을 넣고 끓입니다",
          "물이 끓으면 된장을 풀어줍니다",
          "감자, 양파, 마늘을 넣고 끓입니다",
          "감자가 익으면 두부를 넣습니다",
          "대파와 고추를 썰어 넣습니다",
          "한소끔 더 끓인 후 완성합니다"
        ],
        tips: [
          "멸치육수를 사용하면 더 깊은 맛이 납니다",
          "된장은 체에 거르면 더 부드러운 국물이 됩니다",
          "취향에 따라 청양고추를 넣으면 얼큰합니다"
        ],
        nutrition: { protein: 12, carbs: 20, fat: 8 },
      });
    }

    // Recipe 3: 토마토 파스타
    if (hasIngredient("토마토") || hasIngredient("면") || hasIngredient("마늘")) {
      recipes.push({
        id: "3",
        name: "토마토 파스타",
        description: "상큼하고 건강한 이탈리안 요리",
        image: "https://images.unsplash.com/photo-1651697347337-0d018decfad4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb29raW5nJTIwa2l0Y2hlbiUyMGZyZXNoJTIwdmVnZXRhYmxlc3xlbnwxfHx8fDE3NjI3NDk2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
        cookingTime: 25,
        servings: 2,
        difficulty: "중급",
        calories: 520,
        ingredients: [
          { name: "스파게티 면", amount: "200g", hasIt: hasIngredient("면") },
          { name: "토마토", amount: "4개", hasIt: hasIngredient("토마토") },
          { name: "마늘", amount: "5쪽", hasIt: hasIngredient("마늘") },
          { name: "올리브유", amount: "3큰술", hasIt: hasIngredient("식용유") },
          { name: "양파", amount: "1/2개", hasIt: hasIngredient("양파") },
          { name: "바질", amount: "약간", hasIt: false },
          { name: "소금", amount: "약간", hasIt: true },
        ],
        steps: [
          "냄비에 물을 끓이고 소금을 넣어 면을 삶습니다",
          "토마토는 십자로 칼집을 내어 데친 후 껍질을 벗깁니다",
          "토마토를 잘게 다집니다",
          "팬에 올리브유를 두르고 마늘을 볶습니다",
          "양파를 넣고 투명해질 때까지 볶습니다",
          "다진 토마토를 넣고 중불에서 끓입니다",
          "소금으로 간을 맞춥니다",
          "삶은 면을 소스에 넣고 버무립니다",
          "접시에 담고 바질을 올려 완성합니다"
        ],
        tips: [
          "면은 알덴테(약간 쫄깃한 상태)로 삶는 것이 좋습니다",
          "면 삶은 물을 조금 넣으면 소스가 더 잘 어울립니다",
          "파르메산 치즈를 뿌리면 더 맛있습니다"
        ],
        nutrition: { protein: 18, carbs: 75, fat: 16 },
      });
    }

    // Add more recipes based on user preferences
    if (profile.preferredCuisines.includes("한식")) {
      if (!recipes.some(r => r.id === "5")) {
        recipes.push({
          id: "5",
          name: "비빔밥",
          description: "건강하고 영양 만점 한식",
          image: "https://images.unsplash.com/photo-1713047203705-44dd7d762d0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBiaWJpbWJhcCUyMGZvb2R8ZW58MXx8fHwxNzYyNzQ2NDM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
          cookingTime: 25,
          servings: 2,
          difficulty: profile.cookingLevel === "beginner" ? "초급" : "중급",
          calories: 480,
          ingredients: [
            { name: "밥", amount: "2공기", hasIt: hasIngredient("쌀") || hasIngredient("밥") },
            { name: "시금치", amount: "100g", hasIt: hasIngredient("시금치") },
            { name: "당근", amount: "1/2개", hasIt: hasIngredient("당근") },
            { name: "콩나물", amount: "100g", hasIt: hasIngredient("콩나물") },
            { name: "달걀", amount: "2개", hasIt: hasIngredient("달걀") },
            { name: "고추장", amount: "2큰술", hasIt: hasIngredient("고추장") },
            { name: "참기름", amount: "1큰술", hasIt: hasIngredient("참기름") },
          ],
          steps: [
            "시금치, 당근, 콩나물을 각각 데쳐서 준비합니다",
            "달걀을 부쳐서 채를 썰어줍니다",
            "그릇에 밥을 담고 준비한 나물들을 예쁘게 올립니다",
            "고추장과 참기름을 넣습니다",
            "잘 비벼서 먹습니다"
          ],
          tips: [
            "나물은 각각 소금과 참기름으로 간을 해두면 좋습니다",
            "취향에 따라 육회나 소고기를 추가해도 맛있습니다"
          ],
          nutrition: { protein: 18, carbs: 68, fat: 14 },
        });
      }
    }

    if (profile.preferredCuisines.includes("양식")) {
      if (!recipes.some(r => r.id === "6")) {
        recipes.push({
          id: "6",
          name: "크림 파스타",
          description: "부드럽고 고소한 크림 파스타",
          image: "https://images.unsplash.com/photo-1760390952135-12da7267ff8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhbXklMjBwYXN0YSUyMGRpc2h8ZW58MXx8fHwxNzYyNjk0NDc4fDA&ixlib=rb-4.1.0&q=80&w=1080",
          cookingTime: 20,
          servings: 2,
          difficulty: "중급",
          calories: 650,
          ingredients: [
            { name: "스파게티 면", amount: "200g", hasIt: hasIngredient("면") },
            { name: "생크림", amount: "200ml", hasIt: hasIngredient("우유") || hasIngredient("생크림") },
            { name: "마늘", amount: "3쪽", hasIt: hasIngredient("마늘") },
            { name: "양파", amount: "1/2개", hasIt: hasIngredient("양파") },
            { name: "버터", amount: "30g", hasIt: hasIngredient("버터") },
            { name: "파르메산 치즈", amount: "50g", hasIt: hasIngredient("치즈") },
          ],
          steps: [
            "면을 삶아줍니다",
            "팬에 버터를 녹이고 마늘과 양파를 볶습니다",
            "생크림을 넣고 끓입니다",
            "파르메산 치즈를 넣고 녹입니다",
            "삶은 면을 넣고 버무립니다",
            "후추를 뿌려 완성합니다"
          ],
          tips: [
            "생크림 대신 우유를 사용할 수 있지만 농도가 묽습니다",
            "베이컨이나 버섯을 추가하면 더 맛있습니다"
          ],
          nutrition: { protein: 22, carbs: 72, fat: 28 },
        });
      }
    }

    if (profile.dietaryGoals === "healthy-eating" || profile.dietaryGoals === "low-carb") {
      if (!recipes.some(r => r.id === "7")) {
        recipes.push({
          id: "7",
          name: "샐러드 볼",
          description: "신선하고 건강한 샐러드",
          image: "https://images.unsplash.com/photo-1649531794884-b8bb1de72e68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxhZCUyMGJvd2wlMjBoZWFsdGh5fGVufDF8fHx8MTc2MjczODM2Nnww&ixlib=rb-4.1.0&q=80&w=1080",
          cookingTime: 15,
          servings: 1,
          difficulty: "초급",
          calories: 280,
          ingredients: [
            { name: "양상추", amount: "100g", hasIt: hasIngredient("양상추") },
            { name: "토마토", amount: "1개", hasIt: hasIngredient("토마토") },
            { name: "닭가슴살", amount: "100g", hasIt: hasIngredient("닭고기") },
            { name: "오이", amount: "1/2개", hasIt: hasIngredient("오이") },
            { name: "올리브유", amount: "2큰술", hasIt: hasIngredient("식용유") },
            { name: "레몬", amount: "1/2개", hasIt: hasIngredient("레몬") },
          ],
          steps: [
            "닭가슴살을 삶아서 찢어줍니다",
            "야채들을 씻어서 먹기 좋은 크기로 자릅니다",
            "볼에 모든 재료를 담습니다",
            "올리브유와 레몬즙으로 드레싱을 만듭니다",
            "드레싱을 뿌려 완성합니다"
          ],
          tips: [
            "닭가슴살 대신 삶은 계란을 사용해도 좋습니다",
            "견과류를 추가하면 식감이 좋아집니다"
          ],
          nutrition: { protein: 28, carbs: 12, fat: 15 },
        });
      }
    }

    // Default recipes if not enough matches
    if (recipes.length < 3) {
      const defaultRecipes = [
        {
          id: "4",
          name: "계란볶음밥",
          description: "누구나 쉽게 만들 수 있는 간단한 요리",
          image: "https://images.unsplash.com/photo-1642339800099-921df1a0a958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMGJvd2x8ZW58MXx8fHwxNzYyNjc1OTQyfDA&ixlib=rb-4.1.0&q=80&w=1080",
          cookingTime: 15,
          servings: 1,
          difficulty: "초급",
          calories: 380,
          ingredients: [
            { name: "밥", amount: "1공기", hasIt: true },
            { name: "달걀", amount: "2개", hasIt: hasIngredient("달걀") },
            { name: "식용유", amount: "2큰술", hasIt: hasIngredient("식용유") },
            { name: "소금", amount: "약간", hasIt: true },
            { name: "후추", amount: "약간", hasIt: true },
          ],
          steps: [
            "달걀을 풀어 소금으로 간합니다",
            "팬에 기름을 두르고 달걀을 부어 스크램블합니다",
            "밥을 넣고 함께 볶습니다",
            "소금과 후추로 간을 맞춥니다",
            "접시에 담아 완성합니다"
          ],
          tips: [
            "찬밥을 사용하면 더 잘 볶아집니다",
            "취향에 따라 간장을 넣어도 좋습니다"
          ],
          nutrition: { protein: 14, carbs: 55, fat: 12 },
        },
        {
          id: "8",
          name: "라면 업그레이드",
          description: "간단하지만 특별한 라면 요리",
          image: "https://images.unsplash.com/photo-1740727665746-cfe80ababc23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwY29va2luZyUyMHByZXBhcmF0aW9ufGVufDF8fHx8MTc2Mjc0OTY1M3ww&ixlib=rb-4.1.0&q=80&w=1080",
          cookingTime: 10,
          servings: 1,
          difficulty: "초급",
          calories: 420,
          ingredients: [
            { name: "라면", amount: "1개", hasIt: true },
            { name: "달걀", amount: "1개", hasIt: hasIngredient("달걀") },
            { name: "대파", amount: "약간", hasIt: hasIngredient("대파") },
            { name: "치즈", amount: "1장", hasIt: hasIngredient("치즈") },
          ],
          steps: [
            "물을 끓입니다",
            "라면과 스프를 넣습니다",
            "대파를 송송 썰어 넣습니다",
            "달걀을 넣습니다",
            "불을 끄고 치즈를 올려 완성합니다"
          ],
          tips: [
            "치즈를 넣으면 국물이 부드러워집니다",
            "김치를 추가하면 더 맛있습니다"
          ],
          nutrition: { protein: 12, carbs: 58, fat: 16 },
        },
      ];

      defaultRecipes.forEach(recipe => {
        if (!recipes.some(r => r.id === recipe.id)) {
          recipes.push(recipe);
        }
      });
    }

    return recipes;
  };

  const recipes = generateRecipes();

  const getMissingIngredients = (recipe: Recipe) => {
    return recipe.ingredients.filter(ing => !ing.hasIt);
  };

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1>추천 레시피</h1>
          <p className="text-muted-foreground mt-2">
            {context 
              ? `${profile.name}님의 재료와 상황에 맞는 레시피를 찾았습니다`
              : `${profile.name}님의 프로필을 기반으로 추천 레시피를 준비했습니다`
            }
          </p>
          {!context && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm">
                💡 보유하신 재료를 입력하시면 더 정확한 레시피를 추천해드립니다.
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {recipes.map((recipe) => {
            const missingIngredients = getMissingIngredients(recipe);
            
            return (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <ImageWithFallback
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 text-green-700">
                      {recipe.difficulty}
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle>{recipe.name}</CardTitle>
                  <CardDescription>{recipe.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span>{recipe.cookingTime}분</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-green-600" />
                      <span>{recipe.servings}인분</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-green-600" />
                      <span>{recipe.calories}kcal</span>
                    </div>
                  </div>

                  {missingIngredients.length > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm mb-2">
                        <strong>부족한 재료:</strong>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {missingIngredients.map(ing => (
                          <Badge key={ing.name} variant="outline" className="text-xs">
                            {ing.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-green-600 fill-green-600" />
                      <p className="text-sm">모든 재료 보유 중!</p>
                    </div>
                  )}

                  <Button
                    onClick={() => onSelectRecipe(recipe)}
                    className="w-full"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    요리 시작하기
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1 md:flex-none">
            {context ? "재료 다시 입력하기" : "이전"}
          </Button>
          {!context && onAddIngredients && (
            <Button onClick={onAddIngredients} className="flex-1 md:flex-none">
              재료 입력하고 더 정확한 추천받기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
