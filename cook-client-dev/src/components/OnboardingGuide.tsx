import { useState, useEffect } from "react";
import { getPublicRecipes } from "../utils/api";
import { ChevronLeft, ChevronRight, X, Sparkles, ChefHat, Refrigerator, Mic, BookOpen, Home, UtensilsCrossed, Bot, User, Search, Bell, TrendingUp, Heart, Plus, CookingPot, Pizza, Utensils, Fish, Users, Calendar, Clock, Flame, Salad, Soup, StarHalf, Star, CakeSlice } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingGuideProps {
  onComplete: () => void;
  onSkip: () => void;
}

const onboardingSlides = [
  {
    id: 1,
    type: "welcome",
    title: "환영합니다!",
    subtitle: "AI 쿠킹 어시스턴트",
    description: "검색·음성가이드·재료 관리까지\n한 곳에서",
  },
  {
    id: 2,
    type: "home",
    title: "홈 화면",
    description: "원하는 기능을 선택하고 요리를 시작해보세요",
  },
  {
    id: 3,
    type: "recipe",
    title: "레시피 탐색",
    description: "다양한 레시피를 검색하고 저장",
  },
  {
    id: 4,
    type: "ai",
    title: "AI 음성 가이드",
    description: "손은 요리에, 설명은 AI에게 맡기세요",
  },
  {
    id: 5,
    type: "ingredients",
    title: "냉장고 관리",
    description: "식재료를 스마트하게 관리",
  }
];

export function OnboardingGuide({ onComplete, onSkip }: OnboardingGuideProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 400 : -400,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -400 : 400,
      opacity: 0,
    }),
  };

  const currentSlideData = onboardingSlides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-background px-3 py-4">
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={onSkip}
          size="sm"
          className="h-9 px-3 rounded-full bg-primary text-white hover:bg-primary/90 shadow-md text-xs"
        >
          건너뛰기
        </Button>
      </div>

      {/* 핸드폰 화면 컨테이너 */}
      <div className="h-full max-w-[420px] mx-auto flex flex-col items-center justify-center bg-background px-4 pt-6 pb-4">
        {/* 제목 */}
        <div className="text-center mb-4 mt-4">
          <h2 className="text-2xl text-foreground mb-2">{currentSlideData.title}</h2>
          {/* 첫 페이지가 아니면 subtitle 보여주기 */}
          {currentSlide !== 0 && (
            <p className="text-muted-foreground">{currentSlideData.description}</p>
  )}
        </div>

        {/* 핸드폰 목업 */}
        <div className="w-full max-w-[380px] mx-auto mb-6">
          {/* 슬라이드 컨텐츠 */}
          <div className="relative rounded-3xl overflow-hidden bg-background" style={{
            // 화면이 클 땐 650px까지, 작을 땐 화면 높이의 70%까지만
            height: 'min(620px, 70vh)',
            boxShadow: '0 20px 60px rgba(70, 89, 64, 0.3), 0 0 0 1px rgba(70, 89, 64, 0.1)',
            border: '8px solid #2D2D2D'
          }}>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                {currentSlideData.type === "welcome" && (
                  <WelcomeScreen data={currentSlideData} />
                )}
                {currentSlideData.type === "home" && (
                  <HomeScreen />
                )}
                {currentSlideData.type === "recipe" && (
                  <RecipeScreen />
                )}
                {currentSlideData.type === "ai" && (
                  <AIScreen />
                )}
                {currentSlideData.type === "ingredients" && (
                  <IngredientsScreen />
                )}
              </motion.div>
            </AnimatePresence>

            {/* 노치 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#2D2D2D] rounded-b-2xl z-50" />
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div className="w-full max-w-md space-y-6">
          {/* 인디케이터 */}
          <div className="flex justify-center gap-2">
            {onboardingSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'w-10 h-2.5 bg-primary'
                    : 'w-2.5 h-2.5 bg-border hover:bg-primary/50'
                }`}
              />
            ))}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex gap-3 px-4">
            {currentSlide > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1 h-11 text-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              className={`h-11 text-sm ${
                currentSlide > 0 ? 'flex-1' : 'w-full'
              }`}
              style={{
                background: 'linear-gradient(135deg, #465940 0%, #5a6b4e 100%)',
                boxShadow: '0 4px 6px rgba(70, 89, 64, 0.3), 0 8px 16px rgba(70, 89, 64, 0.15)',
              }}
            >
              {currentSlide === onboardingSlides.length - 1 ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  시작하기
                </>
              ) : (
                <>
                  다음
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 환영 화면
function WelcomeScreen({ data }: any) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-background">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8"
        style={{
          background: 'linear-gradient(135deg, #465940 0%, #5a6b4e 100%)',
          boxShadow: '0 8px 20px rgba(70, 89, 64, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <ChefHat className="w-14 h-14 text-white" style={{
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))'
        }} />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-3xl text-foreground mb-3 text-center"
      >
        {data.subtitle}
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-muted-foreground text-center whitespace-pre-line mb-12"
      >
        {data.description}
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex gap-6 mt-6"
      >
        {[
          { icon: BookOpen, label: "레시피", color: "#465940" },
          { icon: Mic, label: "AI 가이드", color: "#5a6b4e" },
          { icon: Refrigerator, label: "냉장고", color: "#6a7d5e" }
        ].map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #e8f2dd 0%, #d4e5c8 100%)',
              boxShadow: '0 2px 4px rgba(106, 125, 94, 0.15), inset 0 -1px 2px rgba(106, 125, 94, 0.1)'
            }}>
              <item.icon className="w-7 h-7" style={{ color: item.color }} />
            </div>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// 홈 화면 목업
function HomeScreen() {
  return (
    <div className="h-full bg-background pt-8 pb-16 px-4 overflow-hidden">
      {/* 환영 메시지 카드 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-4 bg-card rounded-2xl p-4 relative"
        style={{
          boxShadow: "var(--shadow-3d-md)",
          border: "1px solid rgba(70, 89, 64, 0.15)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-t-2xl" />
        <h3 className="text-foreground mb-0.5">안녕하세요!</h3>
        <p className="text-sm text-muted-foreground">
          오늘은 어떤 요리를 해볼까요?
        </p>
      </motion.div>

      {/* AI 음성 가이드 버튼 */}
      <motion.button
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full rounded-2xl p-4 flex items-center gap-3 mb-3 relative"
        style={{
          background: "linear-gradient(135deg, #465940 0%, #5a6b4e 100%)",
          boxShadow:
            "0 6px 12px rgba(70, 89, 64, 0.25), 0 12px 24px rgba(70, 89, 64, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative"
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left relative z-10">
          <h4 className="text-white text-sm mb-0.5">AI 음성 가이드</h4>
          <p className="text-xs text-white/80">실시간으로 요리를 도와드려요</p>
        </div>
        <Sparkles className="w-4 h-4 text-white/60 relative z-10" />
      </motion.button>

      {/* 식재료 / 커뮤니티 카드 */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-2 mb-4"
      >
        <div
          className="bg-card rounded-2xl p-3"
          style={{
            boxShadow: "0 4px 8px rgba(70, 89, 64, 0.12)",
            border: "1px solid rgba(70, 89, 64, 0.15)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
            style={{
              background: "linear-gradient(135deg, #e8f2dd 0%, #d4e5c8 100%)",
            }}
          >
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <h4 className="text-foreground text-xs mb-0.5">식재료</h4>
          <p className="text-[10px] text-muted-foreground">냉장고 관리</p>
        </div>

        <div
          className="bg-card rounded-2xl p-3"
          style={{
            boxShadow: "0 4px 8px rgba(70, 89, 64, 0.12)",
            border: "1px solid rgba(70, 89, 64, 0.15)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
            style={{
              background: "linear-gradient(135deg, #e8f2dd 0%, #d4e5c8 100%)",
            }}
          >
            <Users className="w-4 h-4 text-primary" />
          </div>
          <h4 className="text-foreground text-xs mb-0.5">커뮤니티</h4>
          <p className="text-[10px] text-muted-foreground">레시피 공유</p>
        </div>
      </motion.div>

      {/* 카테고리 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-foreground">카테고리</h3>
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>

        <div className="grid grid-cols-5 gap-2">
          {[
            { icon: CookingPot, name: "한식" },
            { icon: Pizza, name: "양식" },
            { icon: Utensils, name: "중식" },
            { icon: Fish, name: "일식" },
            { icon: ChefHat, name: "기타" },
          ].map((cat, idx) => (
            <div
              key={idx}
              className="bg-card rounded-xl p-2"
              style={{
                boxShadow: "0 3px 6px rgba(70, 89, 64, 0.1)",
                border: "1px solid rgba(70, 89, 64, 0.12)",
              }}
            >
              <div className="w-full aspect-square flex items-center justify-center mb-1.5 relative">
                <div className="absolute inset-0 bg-primary/5 rounded-lg" />
                <cat.icon className="w-5 h-5 text-primary relative z-10" />
              </div>
              <span className="text-[10px] text-foreground text-center block">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}


// 레시피 화면
function RecipeScreen() {
  type RecipePreview = {
    id: string;
    name: string;
    category: string | null;
    cooking_method: string | null;
    hashtags: string | null;
    ingredients_count: number;
    image?: string | null;
  };

  const [recipes, setRecipes] = useState<RecipePreview[]>([]);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await getPublicRecipes({ limit: 4, offset: 0 });
        setRecipes(res.recipes || []);
      } catch (e) {
        console.error("Recipe preview error:", e);
      }
    };
    fetchPreview();
  }, []);

  const CATEGORY_LIST = [
    { name: "전체", icon: Soup },
    { name: "반찬", icon: UtensilsCrossed },
    { name: "국&찌개", icon: CookingPot },
    { name: "일품", icon: Salad },
    { name: "밥", icon: Utensils },
    { name: "후식", icon: CakeSlice },
    { name: "기타", icon: Star },
  ];

  const fallbackRecipes: RecipePreview[] = [
    {
      id: "1",
      name: "김치찌개",
      category: "국&찌개",
      cooking_method: "끓이기",
      hashtags: "매콤,칼칼함",
      ingredients_count: 8,
      image: null,
    },
    {
      id: "2",
      name: "계란말이",
      category: "반찬",
      cooking_method: "지지기",
      hashtags: "간단요리",
      ingredients_count: 5,
      image: null,
    },
  ];

  const display = recipes.length > 0 ? recipes : fallbackRecipes;

  return (
    <div className="h-full bg-background overflow-hidden flex justify-center">
      {/* 🔹 상단 여백은 그대로, 안쪽 요소들만 간격 조정 */}
      <div className="w-full max-w-[360px] pt-4 pb-6 px-4">
        {/* 레시피 목록 타이틀 - 아래 여백 넉넉하게 */}
        <motion.h2
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg font-semibold mb-2"
        >
          레시피 목록
        </motion.h2>

        {/* 카테고리 - 위아래 조금 숨 쉬게 */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide"
        >
          {CATEGORY_LIST.map((cat, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm bg-card border flex items-center gap-1"
              style={{
                border: "1px solid rgba(70, 89, 64, 0.2)",
                boxShadow: "0 2px 4px rgba(70, 89, 64, 0.08)",
              }}
            >
              <cat.icon className="w-4 h-4" />
              <span className="text-xs">{cat.name}</span>
            </div>
          ))}
        </motion.div>

        {/* 검색창 - 세로 길이 더 줄이고, 아래 여백도 넉넉하게 */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl px-3 py-1 flex items-center gap-2 mb-4"
          style={{
            background: "linear-gradient(135deg, #f5f3e8 0%, #ffffff 100%)",
            boxShadow: "0 4px 10px rgba(70, 89, 64, 0.12)",
            border: "1px solid rgba(70, 89, 64, 0.2)",
          }}
        >
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #e8f2dd 0%, #d4e5c8 100%)",
              boxShadow:
                "0 2px 4px rgba(70, 89, 64, 0.15), inset 0 -1px 2px rgba(70, 89, 64, 0.1)",
            }}
          >
            <Search className="w-4 h-4 text-[#465940]" />
          </div>
          <input
            type="text"
            disabled
            placeholder="레시피 검색 (이름)"
            className="flex-1 outline-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground"
          />
        </motion.div>

        {/* 레시피 카드 영역 - 여기는 이전 디자인 그대로 */}
        <div className="grid grid-cols-2 gap-4 pb-16">
          {display.map((recipe, idx) => (
            <div
              key={idx}
              className="border rounded-xl p-3 bg-white shadow-md flex flex-col"
              style={{
                border: "1px solid rgba(70, 89, 64, 0.15)",
              }}
            >
              {/* 이미지 */}
              <div
                className="w-full rounded-lg overflow-hidden mb-3"
                style={{
                  height: "95px",
                  backgroundColor: "#f3f3f3",
                }}
              >
                {recipe.image && (
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* 텍스트 영역 */}
              <h3 className="text-sm font-semibold mb-1 truncate text-foreground">
                {recipe.name}
              </h3>

              <div className="flex items-center justify-between mb-1">
                <span
                  className="inline-block px-2 py-1 rounded-full text-[10px] font-semibold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #465940 0%, #5a6b4e 100%)",
                    boxShadow: "0 2px 4px rgba(70, 89, 64, 0.25)",
                  }}
                >
                  {recipe.category || "카테고리 없음"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground truncate">
                조리법: {recipe.cooking_method || "정보 없음"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {recipe.hashtags
                  ? `#${recipe.hashtags
                      .split(",")
                      .map((t) => t.trim())
                      .join(" #")}`
                  : ""}
              </p>
              <p className="text-xs font-bold text-[#465940] mt-1">
                재료 {recipe.ingredients_count}개
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// AI 화면
// AI 화면
function AIScreen() {
  return (
    <div className="h-full relative overflow-hidden" style={{
      background: '#F7F6EE'
    }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative z-10 pt-12 pb-4 px-4 h-full flex flex-col">
        {/* AI 아바타 */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex justify-center mb-6 relative"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center relative" style={{
            background: 'linear-gradient(135deg, #e8f2dd 0%, #d4e5c8 100%)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
          }}>
            <Bot className="w-12 h-12 text-primary" />
          </div>
        </motion.div>

        {/* 대화 예시 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 mb-6 px-2"
        >
          {/* assistant 메시지 1 */}
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-[#DDE4D3] flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>

            <div className="max-w-[75%]">
              <div className="inline-block rounded-2xl rounded-bl-sm bg-white border border-gray-200 px-4 py-3 text-sm text-foreground shadow-sm whitespace-pre-line">
                김치볶음밥 재료 목록입니다.{"\n"}
                - 밥{"\n"}
                - 김치{"\n"}
                - 대파
              </div>
            </div>
          </div>

          {/* user 메시지 1 */}
          <div className="flex items-start justify-end gap-2">
            <div className="max-w-[75%] flex justify-end">
              <div className="inline-block rounded-2xl rounded-br-sm bg-[#FEE500] px-4 py-3 text-sm text-black shadow-sm whitespace-pre-line">
                나 대파가 없어
              </div>
            </div>

            <div className="w-7 h-7 rounded-full bg-[#FEE500] flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-black" />
            </div>
          </div>

          {/* assistant 메시지 2 */}
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-[#DDE4D3] flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>

            <div className="max-w-[75%]">
              <div className="inline-block rounded-2xl rounded-bl-sm bg-white border border-gray-200 px-4 py-3 text-sm text-foreground shadow-sm whitespace-pre-line">
                좋아요, 3분 타이머를 시작했어요.{"\n"}
                볶는 동안 불은 중약불로 유지해주세요.
              </div>
            </div>
          </div>

          {/* user 메시지 2 */}
          <div className="flex items-start justify-end gap-2">
            <div className="max-w-[75%] flex justify-end">
              <div className="inline-block rounded-2xl rounded-br-sm bg-[#FEE500] px-4 py-3 text-sm text-black shadow-sm whitespace-pre-line">
                응, 타이머 끝나면{"\n"}
                다음 단계도 알려줘
              </div>
            </div>

            <div className="w-7 h-7 rounded-full bg-[#FEE500] flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-black" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


// 냉장고 화면
function IngredientsScreen() {
  return (
    <div className="h-full bg-background pt-8 pb-4 px-4 overflow-hidden">
      <h3 className="text-foreground mb-1">냉장고 관리</h3>
      <p className="text-sm text-muted-foreground mb-4">식재료를 스마트하게 관리하세요</p>

      {/* 추가 버튼 */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl p-3 flex items-center justify-between mb-3 relative"
        style={{
          background: 'linear-gradient(135deg, #465940 0%, #5a6b4e 100%)',
          boxShadow: '0 4px 8px rgba(70, 89, 64, 0.2)'
        }}
      >
        <span className="text-white text-sm">식재료 추가하기</span>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </div>

        {/* 설명 포인터 */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full ml-2 z-10">
          <div className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-lg relative">
            재료 등록
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rotate-45" />
          </div>
        </div>
      </motion.div>

      {/* 유통기한 알림 */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-orange-50 rounded-xl p-3 mb-3 relative"
        style={{ border: '1px solid rgba(249, 115, 22, 0.2)' }}
      >
        <div className="flex items-start gap-2">
          <Bell className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-foreground text-sm mb-0.5">유통기한 임박</p>
            <p className="text-xs text-muted-foreground">우유가 3일 후 만료됩니다</p>
          </div>
        </div>

        {/* 설명 포인터 */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full mr-2 z-10">
          <div className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-lg relative">
            유통기한 알림
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rotate-45" />
          </div>
        </div>
      </motion.div>

      {/* 식재료 목록 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-2 mb-3"
      >
        {[
          { name: "양파", expiry: "2일 남음" },
          { name: "당근", expiry: "5일 남음" },
          { name: "감자", expiry: "7일 남음" }
        ].map((item, idx) => (
          <div key={idx} className="bg-card rounded-xl p-3 flex items-center justify-between" style={{
            boxShadow: 'var(--shadow-3d-sm)',
            border: '1px solid rgba(70, 89, 64, 0.15)'
          }}>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #e8f2dd 0%, #d4e5c8 100%)'
              }}>
                <Refrigerator className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-foreground text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.expiry}</p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        ))}
      </motion.div>

      {/* 추천 레시피 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl p-3 relative"
        style={{
          background: 'linear-gradient(135deg, #465940 0%, #5a6b4e 100%)',
          boxShadow: '0 4px 8px rgba(70, 89, 64, 0.2)'
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-white" />
          <span className="text-white text-sm">이 재료로 만들 수 있어요</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/10 rounded-lg p-2 text-center">
            <p className="text-xs text-white">된장찌개</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-lg p-2 text-center">
            <p className="text-xs text-white">카레</p>
          </div>
        </div>

        {/* 설명 포인터 */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-10">
          <div className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-lg relative">
            재료 기반 추천
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-primary rotate-45" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

