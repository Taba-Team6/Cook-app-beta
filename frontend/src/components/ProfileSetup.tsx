import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

export interface UserProfile {
  preferredCuisines: string[];
  allergies: string[];
  availableTools: string[];
  dislikedIngredients: string[];
  restrictions: string[];
  healthConditions: string[];
}

interface ProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
  initialProfile?: UserProfile | null;
}

export function ProfileSetup({ onComplete, onBack, initialProfile }: ProfileSetupProps) {
  const [profile, setProfile] = useState<UserProfile>(
    initialProfile || {
      preferredCuisines: [],
      allergies: [],
      availableTools: [],
      dislikedIngredients: [],
      restrictions: [],
      healthConditions: [],
    }
  );

  const [allergyInput, setAllergyInput] = useState("");
  const [dislikedInput, setDislikedInput] = useState("");

  // 🔥 빠른 선택용 추천 리스트 (그대로 유지)
  const recommendedAllergies = [
    "땅콩", "우유", "계란", "밀", "새우", "게", "고등어", "오징어", "호두", "메밀",
  ];

  const recommendedDislikes = [
    "고수", "파", "양파", "마늘", "버섯", "셀러리", "피망", "가지",
  ];

  const allIngredients = [
    // ===== 채소류 =====
    "파","대파","쪽파","실파","양파","적양파","마늘","다진마늘",
    "생강","다진생강","파프리카",
    "피망","버섯","표고버섯","느타리버섯","양송이버섯","새송이버섯",
    "팽이버섯","만가닥버섯","목이버섯","가지","오이","애호박","단호박",
    "당근","고구마","감자","감자전분","연근","우엉","토란","무","순무","비트",
    "배추","양배추","적채","상추","깻잎","치커리","로메인","샐러리","미나리",
    "콩나물","숙주나물","시금치","부추","브로콜리","아스파라거스",
    "옥수수","파슬리","바질","민트","로즈마리","딜","케일",

    // ===== 고기류 =====
    "돼지고기","삼겹살","목살","앞다리살","뒷다리살","갈비","등심",
    "소고기","소불고기","국거리","양지","우둔살",
    "닭고기","닭가슴살","닭다리살","닭날개","닭발","오리고기","양고기",
    "베이컨","햄","소시지","후랑크소시지","스팸",

    // ===== 해산물 =====
    "새우","대하","흰새우","손질새우","오징어","한치","문어","낙지","쭈꾸미",
    "홍합","바지락","모시조개","키조개","성게","해삼","전복","고등어","연어",
    "참치","참돔","광어","명태","대구","꽁치","날치알","연어알",

    // ===== 달걀/유제품 =====
    "계란","달걀","메추리알","우유","두유","연유","생크림","휘핑크림",
    "요거트","버터","무염버터","가염버터","치즈","모짜렐라치즈","체다치즈",
    "파마산치즈","리코타치즈","크림치즈","그릭요거트",

    // ===== 콩/두부/가공식품 =====
    "두부","연두부","순두부","콩","검은콩","팥","강낭콩",
    "병아리콩","렌틸콩","낫토","비엔나소시지","어묵","유부","햄",

    // ===== 곡물/면/빵 =====
    "쌀","찹쌀","현미","흑미","귀리","보리","수수","기장","퀴노아",
    "밀가루","강력분","중력분","박력분","튀김가루","부침가루","빵가루",
    "스파게티면","파스타면","펜네","링귀니","푸실리","우동면","소바면",
    "라면사리","당면","쫄면","냉면","메밀면","칼국수면","떡국떡",
    "가래떡","식빵","바게트","또띠야",

    // ===== 과일류 =====
    "사과","배","바나나","딸기","블루베리","라즈베리","오렌지","귤","레몬",
    "라임","키위","복숭아","자두","망고","파인애플","수박","메론","아보카도",
    "포도",

    // ===== 건어물 =====
    "멸치","디포리","황태","북어채","건새우","다시멸치","다시마","김","파래",
    "쵸고기","볶음멸치",

    // ===== 장류/양념 =====
    "고추장","된장","간장","쌈장","초장","식초","양조식초","사과식초",
    "진간장","국간장","참기름","들기름","식용유","카놀라유","올리브유",
    "버터","마가린","고춧가루","청양고춧가루","설탕","흑설탕","꿀",
    "소금","후추","다진마늘","마늘가루","양파가루","고기양념","핫소스",
    "칠리소스","스리라차","굴소스","굴소스","불고기양념","카레가루",
    "태국고추","피시소스","간마늘","다진생강",

    // ===== 소스류 =====
    "케첩","마요네즈","머스타드","스테이크소스","바베큐소스","핫소스",
    "크림소스","토마토소스","알프레도소스","페스토","간장소스","칠리오일",

    // ===== 베이킹 재료 =====
    "베이킹파우더","베이킹소다","바닐라익스트랙","코코아파우더","설탕시럽",
    "초콜릿칩","화이트초콜릿","다크초콜릿","아몬드가루","코코넛가루",
    "마카다미아","캐슈넛","피칸","호두","땅콩",

    // ===== 기타 =====
    "김치","묵","순대","떡","탕수육소스","부침가루","쯔유","폰즈","유자청",
    "매실청","생강청","골뱅이","닭육수","사골육수","야채스톡"
  ];


  // 🔥 자동완성 필터링: "입력값 포함된 모든 재료"
  const filteredAllergySuggestions = allIngredients.filter((item) =>
    allergyInput && item.toLowerCase().includes(allergyInput.toLowerCase())
  );

  const filteredDislikeSuggestions = allIngredients.filter((item) =>
    dislikedInput && item.toLowerCase().includes(dislikedInput.toLowerCase())
  );

  const cuisineOptions = ["한식", "양식", "중식", "일식", "기타"];

  const toolCategories = {
    "열원": ["가스레인지", "인덕션", "전자레인지"],
    "필수 조리도구": ["냄비", "프라이팬", "오븐", "에어프라이어", "전기밥솥"],
    "가공 도구": ["믹서기", "블렌더", "푸드프로세서"],
  };


  const restrictionOptions = ["채식주의", "비건", "글루텐 프리", "유당 불내증","저염식"];
  const healthConditionOptions = ["고혈압", "당뇨", "고지혈증", "신장 질환", "통풍"];

  const addAllergy = (item?: string) => {
    const value = item ?? allergyInput.trim();
    if (value && !profile.allergies.includes(value)) {
      setProfile({ ...profile, allergies: [...profile.allergies, value] });
    }
    if (!item) setAllergyInput("");
  };

  const addDisliked = (item?: string) => {
    const value = item ?? dislikedInput.trim();
    if (value && !profile.dislikedIngredients.includes(value)) {
      setProfile({
        ...profile,
        dislikedIngredients: [...profile.dislikedIngredients, value],
      });
    }
    if (!item) setDislikedInput("");
  };

  const handleSubmit = () => {
    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6">

        <h1 className="mb-2">요리 프로필 설정</h1>
        <p className="text-muted-foreground mb-6">
          당신에게 맞는 레시피를 추천하기 위해 몇 가지 정보를 알려주세요.
        </p>

        {/* ------------------------------------------------------------- */}
        {/* 선호 음식 */}
        {/* ------------------------------------------------------------- */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>선호 음식</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cuisineOptions.map((cuisine) => (
                <label key={cuisine} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={profile.preferredCuisines.includes(cuisine)}
                    onCheckedChange={() =>
                      setProfile({
                        ...profile,
                        preferredCuisines: profile.preferredCuisines.includes(cuisine)
                          ? profile.preferredCuisines.filter((c) => c !== cuisine)
                          : [...profile.preferredCuisines, cuisine],
                      })
                    }
                  />
                  <span>{cuisine}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* 알러지 정보 */}
        {/* ------------------------------------------------------------- */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>알러지 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* 추천 리스트 */}
            <div className="flex flex-wrap gap-2">
              {recommendedAllergies.map((item) => {
                const isSelected = profile.allergies.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() =>
                      isSelected
                        ? setProfile({
                            ...profile,
                            allergies: profile.allergies.filter((a) => a !== item),
                          })
                        : addAllergy(item)
                    }
                    className={`px-3 py-1 rounded-full text-sm border ${
                      isSelected
                        ? "bg-primary text-white border-primary"
                        : "bg-white hover:bg-primary/10"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* 입력 + 자동완성 */}
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  placeholder="알러지 검색"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAllergy()}
                />
                <Button variant="outline" onClick={() => addAllergy()}>
                  추가
                </Button>
              </div>

              {/* 자동완성 */}
              {allergyInput && filteredAllergySuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10">
                  {filteredAllergySuggestions.map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-3 py-2 hover:bg-primary/10"
                      onClick={() => {
                        addAllergy(item);
                        setAllergyInput("");
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 선택된 알러지 */}
            {profile.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((item) => (
                  <Badge key={item} variant="secondary" className="gap-1">
                    {item}
                    <button
                      onClick={() =>
                        setProfile({
                          ...profile,
                          allergies: profile.allergies.filter((a) => a !== item),
                        })
                      }
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* 싫어하는 재료 */}
        {/* ------------------------------------------------------------- */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>싫어하는 재료</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* 추천 리스트 */}
            <div className="flex flex-wrap gap-2">
              {recommendedDislikes.map((item) => {
                const isSelected = profile.dislikedIngredients.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() =>
                      isSelected
                        ? setProfile({
                            ...profile,
                            dislikedIngredients: profile.dislikedIngredients.filter((d) => d !== item),
                          })
                        : addDisliked(item)
                    }
                    className={`px-3 py-1 rounded-full text-sm border ${
                      isSelected
                        ? "bg-primary text-white border-primary"
                        : "bg-white hover:bg-primary/10"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* 입력 + 자동완성 */}
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  placeholder="재료 검색"
                  value={dislikedInput}
                  onChange={(e) => setDislikedInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDisliked()}
                />
                <Button variant="outline" onClick={() => addDisliked()}>
                  추가
                </Button>
              </div>

              {/* 자동완성 */}
              {dislikedInput && filteredDislikeSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10">
                  {filteredDislikeSuggestions.map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-3 py-2 hover:bg-primary/10"
                      onClick={() => {
                        addDisliked(item);
                        setDislikedInput("");
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 선택된 재료 */}
            {profile.dislikedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.dislikedIngredients.map((item) => (
                  <Badge key={item} variant="outline" className="gap-1">
                    {item}
                    <button
                      onClick={() =>
                        setProfile({
                          ...profile,
                          dislikedIngredients: profile.dislikedIngredients.filter((d) => d !== item),
                        })
                      }
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* 조리도구 */}
        {/* ------------------------------------------------------------- */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>사용 가능한 조리도구</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(toolCategories).map(([category, tools]) => (
              <div key={category}>
                <h4 className="text-sm text-muted-foreground mb-2">{category}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {tools.map((tool) => (
                    <label key={tool} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={profile.availableTools.includes(tool)}
                        onCheckedChange={() =>
                          setProfile({
                            ...profile,
                            availableTools: profile.availableTools.includes(tool)
                              ? profile.availableTools.filter((t) => t !== tool)
                              : [...profile.availableTools, tool],
                          })
                        }
                      />
                      <span>{tool}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 식단 제한 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>식단 제한 사항</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {restrictionOptions.map((option) => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={profile.restrictions.includes(option)}
                    onCheckedChange={() =>
                      setProfile({
                        ...profile,
                        restrictions: profile.restrictions.includes(option)
                          ? profile.restrictions.filter((r) => r !== option)
                          : [...profile.restrictions, option],
                      })
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 건강 상태 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>건강 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {healthConditionOptions.map((option) => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={profile.healthConditions.includes(option)}
                    onCheckedChange={() =>
                      setProfile({
                        ...profile,
                        healthConditions: profile.healthConditions.includes(option)
                          ? profile.healthConditions.filter((h) => h !== option)
                          : [...profile.healthConditions, option],
                      })
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={onBack} className="flex-1">
            취소
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            프로필 저장
          </Button>
        </div>

      </div>
    </div>
  );
}
