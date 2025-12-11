import { useEffect, useState } from "react";
import { getPublicRecipes } from "../utils/api";
import {
  Bookmark,
  Soup,
  UtensilsCrossed,
  CookingPot,
  Salad,
  Utensils,
  CakeSlice,
  Star,
  Search
} from "lucide-react";

export interface Recipe {
  id: string;
  recipe_id?: string; // ✅ 이거 추가
  name: string;
  category: string | null;
  cooking_method: string | null;
  hashtags: string | null;
  ingredients_count: number;
  image?: string;
}

interface Props {
  initialCategory?: string;
  savedRecipes: Recipe[];
  onToggleSave: (recipe: Recipe) => void;
  onRecipeClick: (id: string) => void;
}

/* ✅ 홈화면과 동일 아이콘 + 카테고리 */
const CATEGORY_LIST = [
  { name: "전체", icon: Soup },
  { name: "반찬", icon: UtensilsCrossed },
  { name: "국&찌개", icon: CookingPot },
  { name: "일품", icon: Salad },
  { name: "밥", icon: Utensils },
  { name: "후식", icon: CakeSlice },
  { name: "기타", icon: Star },
];

export function RecipeListPage({
  savedRecipes,
  onToggleSave,
  onRecipeClick,
  initialCategory = "전체",
}: Props) {

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [search, setSearch] = useState("");
  const [limit] = useState(50);
  const [offset] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getPublicRecipes({
        category: selectedCategory === "전체" ? undefined : selectedCategory,
        search: search.length > 0 ? search : undefined,
        limit,
        offset,
      });

      setRecipes(res.recipes || []);
    } catch (err: any) {
      setError("레시피 목록을 불러오는 데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [selectedCategory, search]);

  const isSaved = (id: string) => {
    return savedRecipes.some((r) => r.id === id);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">

      <h2 className="text-2xl font-bold mb-4">레시피 목록</h2>

      {/* ✅ 카테고리 버튼 (올리브톤 + 아이콘 적용) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
    {CATEGORY_LIST.map((category, index) => {
        const isSelected = selectedCategory === category.name;
        const IconComponent = category.icon;

        return (
        <button
            key={index}
            onClick={() => setSelectedCategory(category.name)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-all flex items-center gap-1.5 relative ${
            isSelected
                ? "text-white"
                : "bg-card border text-foreground"
            }`}
            style={
            isSelected
                ? {
                    background:
                    "linear-gradient(135deg, #465940 0%, #5a6b4e 100%)",
                    boxShadow:
                    "0 3px 6px rgba(70, 89, 64, 0.25), 0 6px 12px rgba(70, 89, 64, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                }
                : {
                    border: "1px solid rgba(70, 89, 64, 0.2)",
                    boxShadow: "0 2px 4px rgba(70, 89, 64, 0.08)",
                }
            }
        >
            {/* ✅ 선택된 버튼 상단 하이라이트 */}
            {isSelected && (
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent rounded-t-full" />
            )}

            <IconComponent
            className="w-4 h-4 relative z-10"
            style={
                isSelected
                ? {
                    filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
                    }
                : {}
            }
            />

            <span className="relative z-10">
            {category.name}
            </span>
        </button>
        );
    })}
    </div>

      {/* ✅ 검색 */}
      <div
        className="mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{
            background: "linear-gradient(135deg, #f5f3e8 0%, #ffffff 100%)",
            boxShadow: "0 4px 10px rgba(70, 89, 64, 0.12)",
            border: "1px solid rgba(70, 89, 64, 0.2)",
        }}
        >
        {/* 🔍 아이콘 느낌 효과용 동그라미 */}
        <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
            background: "linear-gradient(135deg, #e8f2dd 0%, #d4e5c8 100%)",
            boxShadow:
                "0 2px 4px rgba(70, 89, 64, 0.15), inset 0 -1px 2px rgba(70, 89, 64, 0.1)",
            color: "#465940",
            fontWeight: 700,
            }}
        >
            <Search className="w-4 h-4 text-[#465940]" />
        </div>

        {/* ✅ 실제 검색 input */}
        <input
            type="text"
            placeholder="레시피 검색 (이름)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
            style={{
            fontSize: "0.95rem",
            }}
        />
        </div>

      {loading && <div className="text-center py-10 text-gray-500">불러오는 중...</div>}
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        {!loading && recipes.length === 0 && (
          <p className="text-center text-gray-500 col-span-full">
            해당 조건의 레시피가 없습니다.
          </p>
        )}

        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => onRecipeClick(recipe.id)}
            className="border rounded-xl p-4 bg-white shadow-lg flex flex-col transition-shadow duration-300 hover:shadow-xl cursor-pointer"
          >
            <div className="flex-1">

              {/* ✅ 이미지 + 북마크 */}
              <div className="w-full h-40 bg-gray-100 mb-3 rounded-lg overflow-hidden relative">
                {recipe.image && (
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                )}

                <button
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(recipe);
                  }}
                >
                  {isSaved(recipe.id) ? (
                    <Bookmark className="w-8 h-8" fill="#FACC15" stroke="#FACC15" />
                  ) : (
                    <Bookmark className="w-8 h-8 text-white" />
                  )}
                </button>
              </div>

              {/* ✅ 이름 */}
              <h3 className="text-lg font-bold mb-2 text-foreground">
                {recipe.name}
              </h3>

              <div className="flex flex-col gap-2">

                {/* ✅ 카테고리 / 조리법 */}
                <div className="flex justify-between items-center text-sm">
                  <span
                    className="inline-block px-2 py-1 rounded-full font-semibold text-xs"
                    style={{
                        background: "linear-gradient(135deg, #465940 0%, #5a6b4e 100%)",
                        color: "white",
                        boxShadow: "0 2px 4px rgba(70, 89, 64, 0.25)",
                    }}
                    >
                    {recipe.category || "카테고리 없음"}
                    </span>
                  <span className="text-gray-500 truncate text-xs">
                    조리법: {recipe.cooking_method || "정보 없음"}
                  </span>
                </div>

                {/* ✅ 해시태그 / 재료 */}
                <div className="flex justify-between items-center text-sm mt-1">
                  <p className="text-gray-600 truncate mr-2 text-xs">
                    {recipe.hashtags
                      ? `#${recipe.hashtags.split(",").map((tag) => tag.trim()).join(" #")}`
                      : "해시태그 없음"}
                  </p>
                  <p className="text-[#465940] font-bold flex-shrink-0 text-xs">
                    재료: {recipe.ingredients_count}개
                  </p>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
