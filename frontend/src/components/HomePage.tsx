import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ChefHat, Mic, Sparkles, Users, UserCircle, MessageCircle, Star, TrendingUp } from "lucide-react";
import { UserProfile } from "./ProfileSetup";

interface HomePageProps {
  onGetStarted: () => void;
  onVoiceAssistant: () => void;
  onLogout?: () => void;
  userName?: string;
  onCommunityClick?: () => void;
  userProfile?: UserProfile | null;
  onCategoryClick?: (category: string) => void;
  onIngredientsClick?: () => void;
}

const categories = [
  { icon: "🍚", name: "한식", color: "#A5B68D" },
  { icon: "🍝", name: "양식", color: "#E07A5F" },
  { icon: "🥟", name: "중식", color: "#F2CC8F" },
  { icon: "🍱", name: "일식", color: "#F4F1DE" },
  { icon: "🍽️", name: "기타", color: "#A5B68D" },
];

export function HomePage({ onGetStarted, onVoiceAssistant, onLogout, userName, onCommunityClick, userProfile, onCategoryClick, onIngredientsClick }: HomePageProps) {

  // 프로필이 완성되었는지 확인 (최소한 하나의 필드라도 입력되어 있으면 프로필이 있다고 간주)
  const hasProfile = userProfile && (
    userProfile.preferredCuisines.length > 0 ||
    userProfile.availableTools.length > 0 ||
    userProfile.cookingTime ||
    userProfile.servings ||
    userProfile.spiceLevel
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-background pb-24 pt-20">
      {/* Welcome Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-muted-foreground text-sm mb-1">안녕하세요 👋</p>
            <h2 className="text-foreground">{userName || "요리를 시작해볼까요?"}</h2>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-[#A5B68D] to-[#E07A5F] rounded-full flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* 프로필 미입력 시 안내 카드 */}
        {!hasProfile && (
          <Card className="border-2 border-[#E07A5F] bg-gradient-to-br from-[#E07A5F]/5 to-[#E07A5F]/10 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#E07A5F]/20 rounded-full flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-[#E07A5F]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-foreground mb-1">프로필을 설정해주세요</h3>
                  <p className="text-sm text-muted-foreground">
                    더 정확한 맞춤 레시피 추천을 받을 수 있어요
                  </p>
                </div>
              </div>
              <Button
                onClick={onGetStarted}
                className="w-full bg-[#E07A5F] hover:bg-[#c96a50] text-white"
              >
                <UserCircle className="w-4 h-4 mr-2" />
                프로필 입력하러 가기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card 
            className="border-0 shadow-sm bg-gradient-to-br from-[#A5B68D] to-[#A5B68D]/80 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={onVoiceAssistant}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white mb-1">AI 음성</h3>
              <p className="text-xs text-white/80">실시간 가이드</p>
            </CardContent>
          </Card>

          <Card 
            className="border-0 shadow-sm bg-gradient-to-br from-[#E07A5F] to-[#E07A5F]/80 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={onIngredientsClick}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white mb-1">식재료 관리</h3>
              <p className="text-xs text-white/80">냉장고 확인</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground">카테고리</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category, index) => (
            <button
              key={index}
              onClick={() => onCategoryClick?.(category.name)}
              className="flex-shrink-0 flex flex-col items-center gap-2 min-w-[70px] py-2"
            >
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                style={{ backgroundColor: category.color + "20" }}
              >
                <span className="text-2xl">{category.icon}</span>
              </div>
              <span className="text-xs text-foreground">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Community Stats */}
      <div className="px-4 mb-6">
        <Card 
          className="border-0 shadow-sm bg-gradient-to-br from-[#A5B68D] to-[#C9A86A] cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={onCommunityClick}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white mb-1">쿠킹 커뮤니티</h3>
                <p className="text-sm text-white/80">다른 요리사들의 레시피를 둘러보세요</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}