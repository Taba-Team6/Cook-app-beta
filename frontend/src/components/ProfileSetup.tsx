import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

export interface UserProfile {
  preferredCuisines: string[];
  allergies: string[];
  availableTools: string[];
  dislikedIngredients: string[];
  cookingTime: string;
  servings: string;
  spiceLevel: string;
  restrictions: string[];
  healthConditions: string[];
}

interface ProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
  initialProfile?: UserProfile | null;
}

export function ProfileSetup({ onComplete, onBack, initialProfile }: ProfileSetupProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    preferredCuisines: [],
    allergies: [],
    availableTools: [],
    dislikedIngredients: [],
    cookingTime: "",
    servings: "",
    spiceLevel: "",
    restrictions: [],
    healthConditions: [],
  });

  const [allergyInput, setAllergyInput] = useState("");
  const [dislikedInput, setDislikedInput] = useState("");

  const cuisineOptions = ["한식", "양식", "중식", "일식", "동남아", "퓨전", "디저트", "베이커리"];
  
  const toolCategories = {
    "열원 기구": ["가스레인지", "인덕션", "전자레인지"],
    "조리 기구": ["냄비", "프라이팬", "웍(중화팬)", "압력솥", "찜기"],
    "전자 기기": ["오븐", "에어프라이어", "전기밥솥", "전기포트", "토스터기"],
    "믹싱 도구": ["믹서기", "블렌더", "푸드프로세서", "핸드믹서"],
    "기타 도구": ["슬로우쿠커", "전기그릴", "와플기", "샌드위치메이커"]
  };
  
  const restrictionOptions = ["채식주의", "비건", "할랄", "코셔", "글루텐 프리", "유당 불내증"];
  const healthConditionOptions = ["고혈압", "당뇨", "고지혈증", "신장 질환", "통풍", "없음"];

  const addAllergy = () => {
    if (allergyInput.trim() && !profile.allergies.includes(allergyInput.trim())) {
      setProfile({
        ...profile,
        allergies: [...profile.allergies, allergyInput.trim()],
      });
      setAllergyInput("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setProfile({
      ...profile,
      allergies: profile.allergies.filter((a) => a !== allergy),
    });
  };

  const addDisliked = () => {
    if (dislikedInput.trim() && !profile.dislikedIngredients.includes(dislikedInput.trim())) {
      setProfile({
        ...profile,
        dislikedIngredients: [...profile.dislikedIngredients, dislikedInput.trim()],
      });
      setDislikedInput("");
    }
  };

  const removeDisliked = (ingredient: string) => {
    setProfile({
      ...profile,
      dislikedIngredients: profile.dislikedIngredients.filter((i) => i !== ingredient),
    });
  };

  const toggleCuisine = (cuisine: string) => {
    setProfile({
      ...profile,
      preferredCuisines: profile.preferredCuisines.includes(cuisine)
        ? profile.preferredCuisines.filter((c) => c !== cuisine)
        : [...profile.preferredCuisines, cuisine],
    });
  };

  const toggleTool = (tool: string) => {
    setProfile({
      ...profile,
      availableTools: profile.availableTools.includes(tool)
        ? profile.availableTools.filter((t) => t !== tool)
        : [...profile.availableTools, tool],
    });
  };

  const toggleRestriction = (restriction: string) => {
    setProfile({
      ...profile,
      restrictions: profile.restrictions.includes(restriction)
        ? profile.restrictions.filter((r) => r !== restriction)
        : [...profile.restrictions, restriction],
    });
  };

  const toggleHealthCondition = (condition: string) => {
    setProfile({
      ...profile,
      healthConditions: profile.healthConditions.includes(condition)
        ? profile.healthConditions.filter((h) => h !== condition)
        : [...profile.healthConditions, condition],
    });
  };

  const handleSubmit = () => {
    onComplete(profile);
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="mb-2">요리 프로필 설정</h1>
          <p className="text-muted-foreground">
            당신에게 맞는 레시피를 추천하기 위해 몇 가지 정보를 알려주세요
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>요리 선호도</CardTitle>
            <CardDescription>평소 요리 스타일을 알려주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="time">선호하는 조리 시간</Label>
              <Select
                value={profile.cookingTime}
                onValueChange={(value) => setProfile({ ...profile, cookingTime: value })}
              >
                <SelectTrigger id="time">
                  <SelectValue placeholder="선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">15분 이내 (간단 요리)</SelectItem>
                  <SelectItem value="medium">15-30분 (일반 요리)</SelectItem>
                  <SelectItem value="long">30분-1시간 (정성 요리)</SelectItem>
                  <SelectItem value="any">상관없음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">주로 만드는 인분</Label>
              <Select
                value={profile.servings}
                onValueChange={(value) => setProfile({ ...profile, servings: value })}
              >
                <SelectTrigger id="servings">
                  <SelectValue placeholder="선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1인분</SelectItem>
                  <SelectItem value="2">2인분</SelectItem>
                  <SelectItem value="3-4">3-4인분</SelectItem>
                  <SelectItem value="5+">5인분 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spice">선호하는 매운맛 정도</Label>
              <Select
                value={profile.spiceLevel}
                onValueChange={(value) => setProfile({ ...profile, spiceLevel: value })}
              >
                <SelectTrigger id="spice">
                  <SelectValue placeholder="선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">안 매운맛</SelectItem>
                  <SelectItem value="mild">약간 매운맛</SelectItem>
                  <SelectItem value="medium">보통 매운맛</SelectItem>
                  <SelectItem value="hot">매운맛</SelectItem>
                  <SelectItem value="very-hot">아주 매운맛</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>선호 음식</CardTitle>
            <CardDescription>좋아하는 음식 종류를 선택해주세요 (복수 선택 가능)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cuisineOptions.map((cuisine) => (
                <div key={cuisine} className="flex items-center space-x-2">
                  <Checkbox
                    id={cuisine}
                    checked={profile.preferredCuisines.includes(cuisine)}
                    onCheckedChange={() => toggleCuisine(cuisine)}
                  />
                  <Label htmlFor={cuisine} className="cursor-pointer">
                    {cuisine}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>알러지 정보</CardTitle>
            <CardDescription>알러지가 있는 재료를 입력해주세요 (중요)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="예: 땅콩, 우유, 계란, 갑각류"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAllergy();
                  }
                }}
              />
              <Button type="button" onClick={addAllergy} variant="outline">
                추가
              </Button>
            </div>

            {profile.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((allergy) => (
                  <Badge key={allergy} variant="secondary" className="gap-1">
                    {allergy}
                    <button
                      onClick={() => removeAllergy(allergy)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>싫어하는 재료</CardTitle>
            <CardDescription>선호하지 않는 재료를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="예: 파, 고수, 셀러리"
                value={dislikedInput}
                onChange={(e) => setDislikedInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDisliked();
                  }
                }}
              />
              <Button type="button" onClick={addDisliked} variant="outline">
                추가
              </Button>
            </div>

            {profile.dislikedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.dislikedIngredients.map((ingredient) => (
                  <Badge key={ingredient} variant="outline" className="gap-1">
                    {ingredient}
                    <button
                      onClick={() => removeDisliked(ingredient)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>사용 가능한 조리 도구</CardTitle>
            <CardDescription>집에 있는 조리 도구를 선택해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(toolCategories).map(([category, tools]) => (
              <div key={category}>
                <h4 className="text-sm text-muted-foreground mb-3">{category}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {tools.map((tool) => (
                    <div key={tool} className="flex items-center space-x-2">
                      <Checkbox
                        id={tool}
                        checked={profile.availableTools.includes(tool)}
                        onCheckedChange={() => toggleTool(tool)}
                      />
                      <Label htmlFor={tool} className="cursor-pointer text-sm">
                        {tool}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>식단 제한 사항</CardTitle>
            <CardDescription>특별한 식단 제한이 있다면 선택해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {restrictionOptions.map((restriction) => (
                <div key={restriction} className="flex items-center space-x-2">
                  <Checkbox
                    id={restriction}
                    checked={profile.restrictions.includes(restriction)}
                    onCheckedChange={() => toggleRestriction(restriction)}
                  />
                  <Label htmlFor={restriction} className="cursor-pointer">
                    {restriction}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>건강 상태</CardTitle>
            <CardDescription>주의가 필요한 건강 상태를 선택해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {healthConditionOptions.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={profile.healthConditions.includes(condition)}
                    onCheckedChange={() => toggleHealthCondition(condition)}
                  />
                  <Label htmlFor={condition} className="cursor-pointer">
                    {condition}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={onBack} className="flex-1">
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
          >
            프로필 저장
          </Button>
        </div>
      </div>
    </div>
  );
}