import { useEffect, useState } from "react";
import { getPublicRecipes } from "../utils/api";

export interface Recipe {
  id: string;
  name: string;
  category: string | null;
  cooking_method: string | null;
  hashtags: string | null;
  ingredients_count: number;
  image?: string; // 이미지 필드 포함
}

interface Props {
  initialCategory?: string;
  savedRecipes: Recipe[];
  onToggleSave: (recipe: Recipe) => void;
  onRecipeClick: (id: string) => void;
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

      <div className="grid grid-cols-2 gap-4"> {/* 2*n 배열을 위해 grid 변경 */}
        {!loading && recipes.length === 0 && (
          <p className="text-center text-gray-500 col-span-full">해당 조건의 레시피가 없습니다.</p>
        )}

        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            // 기존 flex-row에서 flex-col로 변경, 그림자 강하게
            className="border rounded-xl p-4 bg-white shadow-lg flex flex-col transition-shadow duration-300 hover:shadow-xl"
          >
            {/* 레시피 상세 페이지 이동을 위한 클릭 영역 */}
            <div className="flex-1 cursor-pointer" onClick={() => onRecipeClick(recipe.id)}>
              
              {/* 1. 사진 (Image) */}
              {recipe.image && (
                  <div className="w-full h-40 bg-gray-100 mb-3 rounded-lg overflow-hidden">
                      <img 
                          src={recipe.image} 
                          alt={recipe.name} 
                          className="w-full h-full object-cover"
                      />
                  </div>
              )}

              {/* 2. 레시피 이름 (Name) */}
              <h3 className="text-lg font-bold mb-2 text-foreground">{recipe.name}</h3>

              <div className="flex flex-col gap-2">
                  {/* 3. (카테고리, 조리법) - 같은 줄 */}
                  <div className="flex justify-between items-center text-sm">
                      <span className="inline-block px-2 py-1 rounded-full bg-orange-100 text-orange-600 font-semibold text-xs flex-shrink-0 mr-2">
                          {recipe.category || "카테고리 없음"}
                      </span>
                      <span className="text-gray-500 truncate text-xs">
                          조리법: {recipe.cooking_method || "정보 없음"}
                      </span>
                  </div>

                  {/* 4. (해시태그, 재료개수) - 같은 줄 */}
                  <div className="flex justify-between items-center text-sm mt-1">
                      <p className="text-gray-600 truncate mr-2 text-xs">
                          {/* Non-null assertion (!) 추가하여 타입스크립트 오류 해결 */}
                          {recipe.hashtags ? `#${recipe.hashtags!.split(',').map(tag => tag.trim()).join(' #')}` : "해시태그 없음"}
                      </p>
                      <p className="text-indigo-600 font-bold flex-shrink-0 text-xs">
                          재료: {recipe.ingredients_count}개
                      </p>
                  </div>
              </div>
            </div>

            {/* 저장 버튼 (클릭 영역과 분리) */}
            <div className="flex justify-end pt-3 border-t mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 레시피 항목 클릭 이벤트 방지
                  onToggleSave(recipe);
                }}
                className="px-3 py-1 rounded border text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {isSaved(recipe.id) ? "저장됨" : "저장"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}