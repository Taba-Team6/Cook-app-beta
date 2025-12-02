import { useEffect, useState } from "react";
// [수정] useParams, useNavigate 대신 Prop 기반으로 변경
import { getFullRecipeDetail } from "../utils/api";
import { Button } from "../components/ui/button"; // button 컴포넌트가 있다고 가정합니다.
import { Loader2, Zap } from "lucide-react"; // 아이콘 컴포넌트가 있다고 가정합니다.

// 백엔드의 GET /recipes/full/:id API 응답에 맞춰 타입 정의
interface Step {
    step: number;
    text: string;
    image: string | null;
}

export interface FullRecipe {
    id: string;
    name: string;
    category: string | null;
    cooking_method: string | null;
    image_small: string | null;
    image_large: string | null;
    info_weight: string | null;  // 중량(1인분)
    calories: string | null;     // 열량
    carbs: string | null;        // 탄수화물
    protein: string | null;      // 단백질
    fat: string | null;          // 지방
    sodium: string | null;       // 나트륨
    hashtags: string | null;
    ingredients_details: string | null; // 재료정보
    sodium_tip: string | null;    // 저감 조리법 TIP
    steps: Step[];
}

interface FoodRecipeProps {
    // [수정] App.tsx에서 ID를 Prop으로 받습니다.
    recipeId: string;
    // AI 요리보조 페이지로 레시피 데이터를 가지고 이동하는 함수를 prop으로 받습니다.
    onStartCookingAssistant: (recipe: FullRecipe) => void;
    // 오류 처리나 취소 시 이전 페이지로 돌아가기 위한 Prop 추가
    onBack: () => void;
}

// [수정] props에 recipeId와 onBack 추가
export function FoodRecipe({ recipeId, onStartCookingAssistant, onBack }: FoodRecipeProps) {
    
    // useParams 제거
    const id = recipeId; 
    
    const [recipe, setRecipe] = useState<FullRecipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError("레시피 ID가 유효하지 않습니다.");
            setLoading(false);
            return;
        }

        const fetchRecipe = async () => {
            try {
                setLoading(true);
                // 새로 구현한 전체 레시피 조회 API 호출
                const fullRecipe = await getFullRecipeDetail(id);
                setRecipe(fullRecipe);
            } catch (err: any) {
                setError(err.message || "레시피 상세 정보를 불러오는 데 실패했습니다.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [id]);

    const handleStartAssistant = () => {
        if (recipe) {
            // 부모 컴포넌트에 레시피 정보를 전달하고 AI 모드로 전환 요청
            onStartCookingAssistant(recipe);
            // 라우팅은 App.tsx에서 처리합니다.
        }
    };

    if (loading) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 text-center text-gray-500">
                <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
                <p>레시피를 불러오는 중입니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 text-center text-red-500">
                <h2 className="text-xl font-bold mb-4">오류 발생</h2>
                <p>{error}</p>
                {/* [수정] onBack prop 사용 */}
                <Button onClick={onBack} className="mt-4">이전으로 돌아가기</Button> 
            </div>
        );
    }

    if (!recipe) {
        return (
            <div className="max-w-xl mx-auto px-4 py-12 text-center text-gray-500">
                <p>해당 레시피를 찾을 수 없습니다.</p>
                {/* [수정] onBack prop 사용 */}
                <Button onClick={onBack} className="mt-4">이전으로 돌아가기</Button>
            </div>
        );
    }

    // 빈 값 처리 헬퍼 함수
    const renderValue = (value: string | number | null | undefined, unit: string = '') => {
        return value ? `${value}${unit}` : '정보 없음';
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 bg-white shadow-lg min-h-screen">
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold text-gray-900">{recipe.name}</h1>
                <Button 
                    onClick={handleStartAssistant} 
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-transform transform hover:scale-105"
                >
                    <Zap className="h-5 w-5 mr-2" />
                    AI 요리보조 시작
                </Button>
            </div>

            {/* 메인 이미지 */}
            {recipe.image_large && (
                <div className="w-full h-80 bg-gray-100 rounded-xl overflow-hidden mb-6">
                    <img 
                        src={recipe.image_large} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            
            <div className="space-y-8">
                {/* 레시피 개요 */}
                <section className="p-4 border-b">
                    <h2 className="text-xl font-bold mb-3 text-orange-600">개요</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                        <div><span className="font-semibold">카테고리:</span> {renderValue(recipe.category)}</div>
                        <div><span className="font-semibold">조리 방법:</span> {renderValue(recipe.cooking_method)}</div>
                        <div><span className="font-semibold">해시태그:</span> {renderValue(recipe.hashtags, '').split(',').map(tag => tag.trim()).filter(tag => tag).join(', ')}</div>
                    </div>
                </section>

                {/* 영양 정보 (빈 값일 경우 섹션 숨기지 않고 "정보 없음" 표시) */}
                <section className="p-4 border-b">
                    <h2 className="text-xl font-bold mb-3 text-orange-600">영양 정보 (1인분)</h2>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
                        <div><span className="font-semibold">중량:</span> {renderValue(recipe.info_weight)}</div>
                        <div><span className="font-semibold">열량:</span> {renderValue(recipe.calories, 'kcal')}</div>
                        <div><span className="font-semibold">탄수화물:</span> {renderValue(recipe.carbs, 'g')}</div>
                        <div><span className="font-semibold">단백질:</span> {renderValue(recipe.protein, 'g')}</div>
                        <div><span className="font-semibold">지방:</span> {renderValue(recipe.fat, 'g')}</div>
                        <div><span className="font-semibold">나트륨:</span> {renderValue(recipe.sodium, 'mg')}</div>
                    </div>
                </section>
                
                {/* 재료 정보 */}
                <section className="p-4 border-b">
                    <h2 className="text-xl font-bold mb-3 text-orange-600">재료</h2>
                    <p className="whitespace-pre-wrap text-gray-700">{renderValue(recipe.ingredients_details, '재료 정보가 없습니다.')}</p>
                </section>

                {/* 조리 순서 */}
                <section className="p-4">
                    <h2 className="text-xl font-bold mb-4 text-orange-600">조리 순서</h2>
                    <ol className="space-y-6">
                        {recipe.steps.length > 0 ? (
                            recipe.steps.map((step) => (
                                <li key={step.step} className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Step {step.step}</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{step.text}</p>
                                    {/* DB에 이미지 경로는 없으므로 해당 필드는 사용하지 않습니다. */}
                                </li>
                            ))
                        ) : (
                            <p className="text-gray-500">조리 순서 정보가 없습니다.</p>
                        )}
                    </ol>
                </section>
                
                {/* 저감 조리법 TIP */}
                {recipe.sodium_tip && (
                    <section className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                        <h2 className="text-xl font-bold mb-3 text-yellow-800">🧂 저감 조리법 TIP</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{recipe.sodium_tip}</p>
                    </section>
                )}

            </div>
            
            {/* 하단 AI 요리보조 버튼 (스크롤 시에도 접근 용이하도록 하단 고정 고려 가능) */}
             <div className="mt-10 text-center">
                <Button 
                    onClick={handleStartAssistant} 
                    className="w-full max-w-sm bg-red-500 hover:bg-red-600 text-white font-bold py-3 text-lg rounded-full shadow-xl transition-all"
                >
                    <Zap className="h-6 w-6 mr-3" />
                    AI 요리보조 시작하기
                </Button>
            </div>
        </div>
    );
}