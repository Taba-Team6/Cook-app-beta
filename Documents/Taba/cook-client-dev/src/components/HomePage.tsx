import { 
  Mic, Users, UserCircle, Sparkles,
  CookingPot, Soup, UtensilsCrossed, CakeSlice, Star, Utensils, Salad
} from "lucide-react";
import { UserProfile } from "./ProfileSetup";
import { Button } from "./ui/button";

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

/* ✅ 카테고리 유지 */
const categories = [
  { icon: Soup, name: "전체" },
  { icon: CookingPot, name: "국&찌개" },
  { icon: UtensilsCrossed, name: "반찬" },
  { icon: Utensils, name: "밥" },
  { icon: Salad, name: "일품" },
  { icon: CakeSlice, name: "후식" },
  { icon: Star, name: "기타" },
];

export function HomePage({
  onGetStarted,
  onVoiceAssistant,
  userName,
  onCommunityClick,
  userProfile,
  onCategoryClick,
  onIngredientsClick
}: HomePageProps) {

  const hasProfile = userProfile && (
    userProfile.preferredCuisines.length > 0 ||
    userProfile.availableTools.length > 0 
  );

  return (
    <div
      className="bg-background pt-16"
      style={{
        minHeight: "100dvh",
        paddingBottom: "140px",
      }}
    >
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* ✅ 환영 카드 */}
        <div
          className="relative mb-6 bg-card rounded-2xl p-6 flex items-center overflow-hidden"
          style={{
            minHeight: "180px",
            background: "linear-gradient(135deg, #ffffff 0%, #f6f7ef 100%)",
            boxShadow: "var(--shadow-3d-md)",
            border: "1px solid rgba(70, 89, 64, 0.15)",
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-t-2xl" />

          <div className="z-10">
            <h2 className="text-lg text-foreground mb-1">
              {userName ? `${userName}님, 안녕하세요!` : "안녕하세요!"}
            </h2>
            <p className="text-sm text-muted-foreground">
              오늘은 어떤 요리를 해볼까요?
            </p>
          </div>

          {/* ✅ 캐릭터 후광 */}
          <div
            style={{
              position: "absolute",
              right: "-10px",
              bottom: "-10px",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "radial-gradient(circle, #F5F3E8 0%, transparent 70%)",
              filter: "blur(20px)",
              zIndex: 0,
            }}
          />

          {/* ✅ 캐릭터 본체 */}
          <img
            src="/characters/mascot.png"
            alt="캐릭터"
            style={{
              position: "absolute",
              right: "-20px",
              bottom: "5px",
              transform: "translateY(30%)",
              width: "220px",
              height: "auto",
              pointerEvents: "none",
              userSelect: "none",
              zIndex: 1,
            }}
          />
        </div>

        {/* ✅ 프로필 미완성 안내 */}
        {!hasProfile && (
          <div 
            className="rounded-2xl p-4 mb-6"
            style={{
              background: "linear-gradient(135deg, #f5f3e8 0%, #ffffff 100%)",
              boxShadow: "0 6px 14px rgba(70,89,64,0.15)",
              border: "2px solid rgba(70, 89, 64, 0.2)"
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-foreground">
                프로필을 설정하고 맞춤 레시피를 받아보세요
              </p>
            </div>

            <Button
              onClick={onGetStarted}
              className="w-full text-white"
              style={{
                background: "linear-gradient(135deg, #465940 0%, #5a6b4e 100%)",
                boxShadow: "0 6px 14px rgba(70, 89, 64, 0.25)",
                border: "none"
              }}
            >
              프로필 설정하기
            </Button>
          </div>
        )}

        {/* ✅ AI 음성 가이드 */}
        <button
          onClick={onVoiceAssistant}
          className="w-full rounded-2xl p-5 flex items-center gap-4 mb-6"
          style={{
            background: "linear-gradient(135deg, #465940 0%, #5a6b4e 100%)",
            boxShadow: "0 10px 24px rgba(70,89,64,0.25)",
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Mic className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 text-left">
            <h3 className="text-white mb-1">AI 음성 가이드</h3>
            <p className="text-sm text-white/80">실시간으로 요리를 도와드려요</p>
          </div>
        </button>

        {/* ✅ 식재료 / 커뮤니티 */}
        <div className="grid grid-cols-2 gap-3 mb-8">

          {/* ✅ 식재료 */}
          <button
            onClick={onIngredientsClick}
            className="bg-card rounded-2xl p-4 transition-all group relative overflow-hidden"
            style={{
              boxShadow:
                "0 4px 8px rgba(70, 89, 64, 0.12), 0 8px 16px rgba(70, 89, 64, 0.08)",
              border: "1px solid rgba(70, 89, 64, 0.15)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                background:
                  "linear-gradient(135deg, #e8f2dd 0%, #d4e5c8 100%)",
              }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-foreground text-sm mb-1 text-left">식재료</h3>
            <p className="text-xs text-muted-foreground text-left">냉장고 관리</p>
          </button>

          {/* ✅ 커뮤니티 */}
          <button
            onClick={onCommunityClick}
            className="bg-card rounded-2xl p-4 transition-all group relative overflow-hidden"
            style={{
              boxShadow:
                "0 4px 8px rgba(70, 89, 64, 0.12), 0 8px 16px rgba(70, 89, 64, 0.08)",
              border: "1px solid rgba(70, 89, 64, 0.15)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                background:
                  "linear-gradient(135deg, #e8f2dd 0%, #d4e5c8 100%)",
              }}
            >
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-foreground text-sm mb-1 text-left">커뮤니티</h3>
            <p className="text-xs text-muted-foreground text-left">레시피 공유</p>
          </button>
        </div>

        {/* ✅ 카테고리 */}
        <div className="mt-6">
          <h2 className="text-lg mb-3 text-foreground">카테고리</h2>

          <div className="flex gap-3 overflow-x-auto py-1">
            {categories.map((category, idx) => {
              const Icon = category.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onCategoryClick?.(category.name)}
                  className="flex flex-col items-center justify-center rounded-xl bg-card flex-shrink-0"
                  style={{
                    width: "72px",
                    height: "72px",
                    boxShadow: "0 4px 10px rgba(70,89,64,0.12)",
                    border: "1px solid rgba(70,89,64,0.12)"
                  }}
                >
                  <Icon className="w-5 h-5 text-primary mb-1" />
                  <span className="text-[11px]">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
