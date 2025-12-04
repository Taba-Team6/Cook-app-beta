import { useState, useEffect } from "react";
import { Auth } from "./components/Auth";
import { HomePage } from "./components/HomePage";
import { ProfileSetup, UserProfile } from "./components/ProfileSetup";
import { ProfileComplete } from "./components/ProfileComplete";
import { VoiceAssistant } from "./components/VoiceAssistant";
import { RecipeReview } from "./components/RecipeReview";
import { TopNavBar } from "./components/TopNavBar";
import { BottomNavBar } from "./components/BottomNavBar";
import { RecipeListPage, type Recipe as RecipeListRecipe } from "./components/RecipeListPage";
import { SavedPage } from "./components/SavedPage";
import { MyPage } from "./components/MyPage";
import { IngredientsManagement } from "./components/IngredientsManagement";
import { AccountSettings } from "./components/AccountSettings";
import { CommunityPage } from "./components/CommunityPage";
import { CompletedRecipesPage } from "./components/CompletedRecipesPage";

// ⭐ FoodRecipe / FullRecipe (첫 번째 코드에서 사용)
import { FoodRecipe, FullRecipe } from "./components/FoodRecipe";

// ⭐ OnboardingGuide (두 번째 코드에서 가져온 부분)
import { OnboardingGuide } from "./components/OnboardingGuide";

import {
  getCurrentUser,
  removeAuthToken,
  updateProfile,
  saveRecipe,
  removeSavedRecipe,
  getSavedRecipes,
} from "./utils/api";

type AppStep =
  | "auth"
  | "home"
  | "profile"
  | "profile-complete"
  | "ingredients"
  | "recommendations"
  | "recipe"
  | "feedback"
  | "voice-assistant"
  | "ingredient-check"
  | "cooking-in-progress"
  | "recipe-list"
  | "saved"
  | "mypage"
  | "ingredients-management"
  | "account-settings"
  | "recipe-review"
  | "community"
  | "completed-recipes"
  | "full-recipe";

interface RecipeDetailData {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  category: string;
  cooking_method: string | null;
  hashtags: string | null;
  ingredients: { name: string; amount: string }[];
  steps: string[];
}

interface CompletedRecipe extends RecipeDetailData {
  completedAt: string;
}

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>("auth");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetailData | null>(
    null
  );

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedFullRecipe, setSelectedFullRecipe] =
    useState<FullRecipe | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [pageHistory, setPageHistory] = useState<AppStep[]>([]);
  const [completedRecipes, setCompletedRecipes] = useState<CompletedRecipe[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [savedRecipes, setSavedRecipes] = useState<RecipeListRecipe[]>([]);

  // ⭐ 추가: 첫 로그인 온보딩 상태
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ------------------------------
  //   세션 확인 로직
  // ------------------------------
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = sessionStorage.getItem(
          "cooking_assistant_current_user"
        );

        if (storedUser) {
          const cachedUser = JSON.parse(storedUser);

          try {
            const response = await getCurrentUser();

            if (response && response.user) {
              const user = { ...cachedUser, ...response.user };

              setCurrentUser(user);
              setIsAuthenticated(true);
              setCurrentStep("home");

              try {
                const list = await getSavedRecipes();
                setSavedRecipes(list);
                localStorage.setItem(
                  "cooking_assistant_saved_recipes",
                  JSON.stringify(list)
                );
              } catch (e) {
                console.error("Failed to load saved recipes:", e);
              }

              sessionStorage.setItem(
                "cooking_assistant_current_user",
                JSON.stringify(user)
              );
            }
          } catch (error) {
            sessionStorage.removeItem("cooking_assistant_current_user");
            removeAuthToken();
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  // ------------------------------
  // ⭐ 첫 로그인 온보딩 체크
  // ------------------------------
  useEffect(() => {
    if (isAuthenticated && currentStep === "home" && currentUser) {
      const key = `cooking_assistant_onboarding_shown_${currentUser.id}`;
      const flag = localStorage.getItem(key);

      if (flag !== "true") {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, currentStep, currentUser]);

  const handleOnboardingFinish = () => {
    setShowOnboarding(false);
    if (currentUser) {
      const key = `cooking_assistant_onboarding_shown_${currentUser.id}`;
      localStorage.setItem(key, "true");
    }
  };
  // ------------------------------
  //   다크모드 / 프로필 / 저장데이터 로드
  // ------------------------------
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("cooking_assistant_dark_mode");
    if (savedDarkMode === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    const savedProfile = localStorage.getItem(
      "cooking_assistant_user_profile"
    );
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    }

    const savedCompleted = localStorage.getItem(
      "cooking_assistant_completed_recipes"
    );
    if (savedCompleted) {
      try {
        setCompletedRecipes(JSON.parse(savedCompleted));
      } catch (error) {
        console.error("Failed to load completed recipes:", error);
      }
    }

    const savedRecipesData = localStorage.getItem(
      "cooking_assistant_saved_recipes"
    );
    if (savedRecipesData) {
      try {
        setSavedRecipes(JSON.parse(savedRecipesData));
      } catch (error) {
        console.error("Failed to load saved recipes:", error);
      }
    }

    const handleSavedRecipesUpdate = () => {
      const data = localStorage.getItem("cooking_assistant_saved_recipes");
      if (data) {
        try {
          setSavedRecipes(JSON.parse(data));
        } catch (e) {
          console.error("Fail reload saved recipes:", e);
        }
      }
    };

    window.addEventListener("savedRecipesUpdated", handleSavedRecipesUpdate);
    return () => {
      window.removeEventListener(
        "savedRecipesUpdated",
        handleSavedRecipesUpdate
      );
    };
  }, []);

  // ------------------------------
  //   네비게이션 / 뒤로가기 처리
  // ------------------------------
  const navigateToStep = (newStep: AppStep, addToHistory = true) => {
    if (
      addToHistory &&
      currentStep !== "auth" &&
      currentStep !== newStep
    ) {
      setPageHistory((prev) => [...prev, currentStep]);
    }
    setCurrentStep(newStep);
  };

  const handleBackNavigation = () => {
    if (pageHistory.length > 0) {
      const prev = pageHistory[pageHistory.length - 1];
      setPageHistory((prevHist) => prevHist.slice(0, -1));
      setCurrentStep(prev);
    } else {
      setCurrentStep("home");
    }
  };

  // ------------------------------
  //   로그인 / 로그아웃
  // ------------------------------
  const handleAuthSuccess = async () => {
    const user = sessionStorage.getItem("cooking_assistant_current_user");
    if (user) setCurrentUser(JSON.parse(user));

    setIsAuthenticated(true);
    setPageHistory([]);
    setCurrentStep("home");

    try {
      const list = await getSavedRecipes();
      setSavedRecipes(list);
      localStorage.setItem(
        "cooking_assistant_saved_recipes",
        JSON.stringify(list)
      );
    } catch (err) {
      console.error("Failed to load saved recipes:", err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("cooking_assistant_current_user");
    localStorage.removeItem("cooking_assistant_user_profile");
    removeAuthToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserProfile(null);
    setSelectedRecipe(null);
    setPageHistory([]);
    setCurrentStep("auth");
  };

  // ------------------------------
  //   프로필 완료
  // ------------------------------
  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem(
      "cooking_assistant_user_profile",
      JSON.stringify(profile)
    );

    updateProfile({
      allergies: profile.allergies,
      preferences: profile,
    }).catch((err) => console.error("프로필 저장 실패:", err));

    handleBackNavigation();
  };

  // ------------------------------
  //   레시피 상세/전체 페이지
  // ------------------------------
  const handleRecipeClick = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setSelectedRecipe(null);
    setSelectedFullRecipe(null);
    navigateToStep("full-recipe");
  };

  const handleStartCookingAssistant = (recipe: FullRecipe) => {
    setSelectedFullRecipe(recipe);
    navigateToStep("voice-assistant");
  };

  // ------------------------------
  //   GPT로부터 선택된 레시피 처리
  // ------------------------------
  const handleVoiceRecipeSelect = async (recipe: any) => {
    const converted: RecipeDetailData = {
      id: "ai-" + Date.now(),
      name: recipe.recipeName ?? "AI 추천 레시피",
      image: null,
      description: recipe.description ?? null,
      category: "AI 추천",
      cooking_method: null,
      hashtags: null,
      ingredients:
        recipe.ingredients?.map((i: any) => ({
          name: i.name,
          amount: i.amount,
        })) ?? [],
      steps: recipe.steps ?? [],
    };

    setSelectedRecipe(converted);
    navigateToStep("recipe-review");
  };

  // ------------------------------
  //   레시피 완료/리뷰
  // ------------------------------
  const handleCookingComplete = () => {
    if (selectedRecipe) {
      const already = completedRecipes.some(
        (r) =>
          r.id === selectedRecipe.id &&
          new Date(r.completedAt).toDateString() ===
            new Date().toDateString()
      );

      if (!already) {
        const done: CompletedRecipe = {
          ...selectedRecipe,
          completedAt: new Date().toISOString(),
        };
        const updated = [done, ...completedRecipes];

        setCompletedRecipes(updated);
        localStorage.setItem(
          "cooking_assistant_completed_recipes",
          JSON.stringify(updated)
        );
      }
    }
    navigateToStep("feedback");
  };

  const handleReviewSubmit = () => {
    setSelectedRecipe(null);
    setSelectedFullRecipe(null);
    setPageHistory([]);
    setCurrentStep("home");
  };

  const handleReviewSkip = handleReviewSubmit;

  // ------------------------------
  //   레시피 저장 / 해제
  // ------------------------------
  const handleToggleSaveRecipe = async (recipe: RecipeListRecipe) => {
    const exists = savedRecipes.some((r) => r.id === recipe.id);
    let updated: RecipeListRecipe[];

    if (exists) {
      updated = savedRecipes.filter((r) => r.id !== recipe.id);
      await removeSavedRecipe(recipe.id);
    } else {
      updated = [recipe, ...savedRecipes];
      await saveRecipe({
        recipe_id: recipe.id,
        name: recipe.name,
        category: recipe.category ?? null,
        image: (recipe as any).image ?? null,
        difficulty: null,
        cooking_time: null,
        description: null,
        ingredients: null,
        steps: null,
      });
    }

    setSavedRecipes(updated);
    localStorage.setItem(
      "cooking_assistant_saved_recipes",
      JSON.stringify(updated)
    );
    window.dispatchEvent(new Event("savedRecipesUpdated"));
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem(
      "cooking_assistant_dark_mode",
      newMode ? "true" : "false"
    );
  };

  // ------------------------------
  //   네비게이션 바 / 하단바 표시 기준
  // ------------------------------
  const shouldShowNavigation =
    isAuthenticated && currentStep !== "auth" && !showOnboarding;

  const getActiveBottomTab = () => {
    switch (currentStep) {
      case "home":
        return "home";
      case "recipe-list":
      case "full-recipe":
        return "recipe";
      case "voice-assistant":
      case "ingredient-check":
      case "cooking-in-progress":
        return "ai";
      case "ingredients-management":
        return "ingredients";
      case "mypage":
      case "profile":
      case "account-settings":
      case "saved":
      case "completed-recipes":
        return "mypage";
      default:
        return "home";
    }
  };

  const shouldShowBackButton =
    currentStep !== "home" && currentStep !== "auth";

  // ------------------------------
  //   렌더링
  // ------------------------------
  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------
          상단 네비게이션 바
      ------------------------------ */}
      {shouldShowNavigation && (
        <TopNavBar
          isAuthenticated={isAuthenticated}
          userName={currentUser?.name}
          onLogout={handleLogout}
          onProfileClick={() => navigateToStep("mypage")}
          onLogoClick={() => {
            setPageHistory([]);
            setCurrentStep("home");
          }}
          onSearch={(q) => console.log("Search:", q)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          showBackButton={shouldShowBackButton}
          onBackClick={handleBackNavigation}
        />
      )}

      {/* ------------------------------
          메인 컨텐츠
      ------------------------------ */}
      <main className="pb-24">
        {/* 로그인 */}
        {currentStep === "auth" && !isAuthenticated && (
          <Auth onAuthSuccess={handleAuthSuccess} />
        )}

        {/* 홈 */}
        {currentStep === "home" && isAuthenticated && (
          <>
            <HomePage
              onGetStarted={() => navigateToStep("profile")}
              onVoiceAssistant={() => navigateToStep("voice-assistant")}
              onLogout={handleLogout}
              userName={currentUser?.name}
              onCommunityClick={() => navigateToStep("community")}
              userProfile={userProfile}
              onCategoryClick={(category) => {
                setSelectedCategory(category);
                navigateToStep("recipe-list");
              }}
              onIngredientsClick={() =>
                navigateToStep("ingredients-management")
              }
            />

            {/* ⭐ 온보딩 가이드 */}
            {showOnboarding && (
              <OnboardingGuide onFinish={handleOnboardingFinish} />
            )}
          </>
        )}

        {/* 음성 어시스턴트 */}
        {currentStep === "voice-assistant" && isAuthenticated && (
          <VoiceAssistant
            onRecipeSelect={handleVoiceRecipeSelect}
            onBack={handleBackNavigation}
            userProfile={userProfile}
            initialRecipeContext={selectedFullRecipe}
          />
        )}

        {/* 전체 레시피 상세 페이지 */}
        {currentStep === "full-recipe" && selectedRecipeId && (
          <FoodRecipe
            recipeId={selectedRecipeId}
            onStartCookingAssistant={handleStartCookingAssistant}
            onBack={handleBackNavigation} 
          />
        )}

        {/* 프로필 설정 */}
        {currentStep === "profile" && isAuthenticated && (
          <ProfileSetup
            onComplete={handleProfileComplete}
            onBack={handleBackNavigation}
            initialProfile={userProfile}
          />
        )}

        {/* 프로필 완료 */}
        {currentStep === "profile-complete" && userProfile && (
          <ProfileComplete
            profile={userProfile}
            onQuickRecommendation={() => navigateToStep("recommendations")}
            onDetailedRecommendation={() => navigateToStep("ingredients")}
            onBack={handleBackNavigation}
          />
        )}

        {/* 레시피 리스트 */}
        {currentStep === "recipe-list" && (
          <RecipeListPage
            onRecipeClick={handleRecipeClick}
            initialCategory={selectedCategory}
            savedRecipes={savedRecipes}
            onToggleSave={handleToggleSaveRecipe}
          />
        )}

        {/* 저장한 레시피 */}
        {currentStep === "saved" && (
          <SavedPage
            savedRecipes={savedRecipes}
            onRecipeClick={(id) => handleRecipeClick(id)}
            onRemoveSaved={handleToggleSaveRecipe}
          />
        )}

        {/* 마이페이지 */}
        {currentStep === "mypage" && (
          <MyPage
            userName={currentUser?.name}
            onProfileEdit={() => navigateToStep("profile")}
            onAccountSettings={() => navigateToStep("account-settings")}
            onSavedRecipes={() => navigateToStep("saved")}
            onCompletedRecipes={() => navigateToStep("completed-recipes")}
            completedRecipesCount={completedRecipes.length}
            savedRecipesCount={savedRecipes.length}
          />
        )}

        {/* 재료 관리 */}
        {currentStep === "ingredients-management" && (
          <IngredientsManagement />
        )}

        {/* 계정 설정 */}
        {currentStep === "account-settings" && (
          <AccountSettings onBack={handleBackNavigation} />
        )}

        {/* 리뷰 */}
        {currentStep === "recipe-review" &&
          isAuthenticated &&
          selectedRecipe && (
            <RecipeReview
              recipe={selectedRecipe}
              onSubmit={handleReviewSubmit}
              onSkip={handleReviewSkip}
            />
          )}

        {/* 커뮤니티 */}
        {currentStep === "community" && <CommunityPage />}

        {/* 완료한 레시피 목록 */}
        {currentStep === "completed-recipes" && (
          <CompletedRecipesPage
            completedRecipes={completedRecipes}
            onRecipeClick={(recipe) => handleRecipeClick(recipe.id)}
          />
        )}
      </main>

      {/* ------------------------------
          하단 네비게이션 바
      ------------------------------ */}
      {shouldShowNavigation && (
        <BottomNavBar
          activeTab={getActiveBottomTab()}
          onHomeClick={() => {
            setPageHistory([]);
            setCurrentStep("home");
          }}
          onRecipeClick={() => navigateToStep("recipe-list")}
          onAIClick={() => navigateToStep("voice-assistant")}
          onIngredientsClick={() =>
            navigateToStep("ingredients-management")
          }
          onMyPageClick={() => navigateToStep("mypage")}
        />
      )}
    </div>
  );
}