import { useEffect, useState } from "react";
import { getPublicRecipes } from "../utils/api";

export interface Recipe {
  id: string;
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
  onRecipeClick: (id: string) => void;     // ← 수정됨
}

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

  const CATEGORY_LIST = ["전체", "반찬", "국/찌개", "일품", "후식", "밥", "기타"];

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

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CATEGORY_LIST.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="레시피 검색 (이름)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      {loading && <div className="text-center py-10 text-gray-500">불러오는 중...</div>}
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      <div className="flex flex-col gap-4">
        {!loading && recipes.length === 0 && (
          <p className="text-center text-gray-500">해당 조건의 레시피가 없습니다.</p>
        )}

        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="border rounded-xl p-4 bg-white shadow-sm flex items-start"
          >
            {/* ------------------------------- */}
            {/* 핵심 수정 : 여기서 recipe 전체 → id만 전달 */}
            {/* ------------------------------- */}
            <div className="flex-1" onClick={() => onRecipeClick(recipe.id)}>
              <h3 className="text-lg font-semibold">{recipe.name}</h3>

              {recipe.category && (
                <span className="inline-block mt-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {recipe.category}
                </span>
              )}

              <p className="text-sm text-gray-500 mt-2">
                조리법: {recipe.cooking_method || "정보 없음"}
              </p>

              <p className="text-sm text-gray-500">
                재료 개수: {recipe.ingredients_count}
              </p>
            </div>

            <button
              onClick={() => onToggleSave(recipe)}
              className="ml-3 px-3 py-1 rounded border text-sm"
            >
              {isSaved(recipe.id) ? "저장됨" : "저장"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
