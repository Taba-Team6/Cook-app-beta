import { useState, useEffect } from "react";
import { Auth } from "./components/Auth";
import { HomePage } from "./components/HomePage";
import { ProfileSetup, UserProfile } from "./components/ProfileSetup";
import { ProfileComplete } from "./components/ProfileComplete";
import { IngredientsInput, CookingContext } from "./components/IngredientsInput";
import { RecipeRecommendation } from "./components/RecipeRecommendation";
import { RecipeDetail } from "./components/RecipeDetail";
import { Feedback } from "./components/Feedback";
import { VoiceAssistant } from "./components/VoiceAssistant";
import { RecipeIngredientCheck } from "./components/RecipeIngredientCheck";
import { CookingInProgress } from "./components/CookingInProgress";
import { RecipeReview } from "./components/RecipeReview";
import { TopNavBar } from "./components/TopNavBar";
import { BottomNavBar } from "./components/BottomNavBar";
import { RecipeListPage } from "./components/RecipeListPage";
import type { Recipe as RecipeListRecipe } from "./types/recipe";
import { SavedPage } from "./components/SavedPage";
import { MyPage } from "./components/MyPage";
import { IngredientsManagement } from "./components/IngredientsManagement";
import { AccountSettings } from "./components/AccountSettings";
import { CommunityPage } from "./components/CommunityPage";
import { CompletedRecipesPage } from "./components/CompletedRecipesPage";
import type { Recipe } from "./types/recipe";
import { createClient } from "./utils/supabase/client";
import { setAuthToken, removeAuthToken } from "./utils/api";

type AppStep = "auth" | "home" | "profile" | "profile-complete" | "ingredients" | "recommendations" | "recipe" | "feedback" | "voice-assistant" | "ingredient-check" | "cooking-in-progress" | "recipe-list" | "saved" | "mypage" | "ingredients-management" | "account-settings" | "recipe-review" | "community" | "completed-recipes";

interface CompletedRecipe extends Recipe {
  completedAt: string;
}

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>("auth");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cookingContext, setCookingContext] = useState<CookingContext | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [pageHistory, setPageHistory] = useState<AppStep[]>([]);
  const [completedRecipes, setCompletedRecipes] = useState<CompletedRecipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [savedRecipes, setSavedRecipes] = useState<RecipeListRecipe[]>([]);

  const [quickRecipes, setQuickRecipes] = useState<Recipe[]>([]); // 레시피창 상단 메뉴 바로가기용
  const [voiceInitialRecipe, setVoiceInitialRecipe] = useState<Recipe | null>(null); // AI 조리 시작 시 사용할 레시피

  // Check if user has an active session
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setIsCheckingSession(false);
          return;
        }

        if (session && session.user) {
          // Store auth token
          setAuthToken(session.access_token);

          // Get user info
          const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User';
          
          const user = {
            id: session.user.id,
            email: session.user.email || '',
            name: userName,
          };

          setCurrentUser(user);
          sessionStorage.setItem("cooking_assistant_current_user", JSON.stringify(user));
          setIsAuthenticated(true);
          setCurrentStep("home");
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();

    // Set up auth state listener
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        handleLogout();
      } else if (event === 'SIGNED_IN' && session) {
        setAuthToken(session.access_token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load dark mode preference and user profile
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("cooking_assistant_dark_mode");
    if (savedDarkMode === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    // Load user profile from localStorage
    const savedProfile = localStorage.getItem("cooking_assistant_user_profile");
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    }

    // Load completed recipes from localStorage
    const savedCompletedRecipes = localStorage.getItem("cooking_assistant_completed_recipes");
    if (savedCompletedRecipes) {
      try {
        const recipes = JSON.parse(savedCompletedRecipes);
        setCompletedRecipes(recipes);
      } catch (error) {
        console.error("Failed to load completed recipes:", error);
      }
    }

    // Load saved recipes from localStorage
    const savedRecipesData = localStorage.getItem("cooking_assistant_saved_recipes");
    if (savedRecipesData) {
      try {
        const recipes = JSON.parse(savedRecipesData);
        setSavedRecipes(recipes);
      } catch (error) {
        console.error("Failed to load saved recipes:", error);
      }
    }

    // Listen for saved recipes updates from other components
    const handleSavedRecipesUpdate = () => {
      const updatedData = localStorage.getItem("cooking_assistant_saved_recipes");
      if (updatedData) {
        try {
          const recipes = JSON.parse(updatedData);
          setSavedRecipes(recipes);
        } catch (error) {
          console.error("Failed to reload saved recipes:", error);
        }
      }
    };

    window.addEventListener("savedRecipesUpdated", handleSavedRecipesUpdate);
    
    return () => {
      window.removeEventListener("savedRecipesUpdated", handleSavedRecipesUpdate);
    };
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("cooking_assistant_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("cooking_assistant_dark_mode", "false");
    }
  };

  // 페이지 전환 헬퍼 함수 - 히스토리에 현재 페이지 추가 후 이동
  const navigateToStep = (newStep: AppStep, addToHistory: boolean = true) => {
    if (addToHistory && currentStep !== "auth" && currentStep !== newStep) {
      setPageHistory(prev => [...prev, currentStep]);
    }
    setCurrentStep(newStep);
  };

  // 뒤로가기 핸들러 - 히스토리 스택에서 이전 페이지로 이동
  const handleBackNavigation = () => {
    if (pageHistory.length > 0) {
      const previousStep = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentStep(previousStep);
    } else {
      // 히스토리가 없으면 홈으로
      setCurrentStep("home");
    }
  };

  const handleAuthSuccess = (userName: string) => {
    const user = localStorage.getItem("cooking_assistant_current_user");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setIsAuthenticated(true);
    setPageHistory([]); // 로그인 시 히스토리 초기화
    setCurrentStep("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("cooking_assistant_current_user");
    localStorage.removeItem("cooking_assistant_user_profile");
    removeAuthToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserProfile(null);
    setCookingContext(null);
    setSelectedRecipe(null);
    setPageHistory([]); // 로그아웃 시 히스토리 초기화
    setCurrentStep("auth");
  };

  const handleGetStarted = () => {
    navigateToStep("profile");
  };

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    // Save profile to localStorage
    localStorage.setItem("cooking_assistant_user_profile", JSON.stringify(profile));
    // 프로필 저장 후 이전 페이지로 이동
    handleBackNavigation();
  };

  const handleQuickRecommendation = () => {
    setCookingContext(null);
    navigateToStep("recommendations");
  };

  const handleDetailedRecommendation = () => {
    navigateToStep("ingredients");
  };

  const handleIngredientsComplete = (context: CookingContext) => {
    setCookingContext(context);
    navigateToStep("recommendations");
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    navigateToStep("recipe");
  };

  const handleCompletedRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    navigateToStep("ingredient-check");
  };

  // 🔥 완료한 요리에서 "메뉴 바로가기" 흐름용
  const handleCompletedRecipeQuickNav = (recipe: Recipe) => {
    // 1) 메뉴 바로가기 목록에 추가
    setQuickRecipes((prev) => {
      const exists = prev.some(
        (r) => (r.id && r.id === recipe.id) || r.recipeName === recipe.recipeName
      );
      return exists ? prev : [recipe, ...prev];
    });

    // 2) 나중에 VoiceAssistant 시작할 때 이 레시피로 시작할 수 있게 저장
    setVoiceInitialRecipe(recipe);

    // 3) 레시피 목록 페이지로 이동 (여기서 상단에 메뉴 바로가기 버튼이 보이게 됨)
    navigateToStep("voice-assistant");
  };


  const handleCookingComplete = () => {
    // 완료한 레시피 저장 (중복 체크)
    if (selectedRecipe) {
      // 이미 완료한 레시피인지 확인
      const isAlreadyCompleted = completedRecipes.some(
        recipe => recipe.id === selectedRecipe.id && 
        new Date(recipe.completedAt).toDateString() === new Date().toDateString()
      );
      
      if (!isAlreadyCompleted) {
        const completedRecipe: CompletedRecipe = {
          ...selectedRecipe,
          completedAt: new Date().toISOString(),
        };
        const updatedCompletedRecipes = [completedRecipe, ...completedRecipes];
        setCompletedRecipes(updatedCompletedRecipes);
        localStorage.setItem("cooking_assistant_completed_recipes", JSON.stringify(updatedCompletedRecipes));
        console.log("✅ 레시피 완료 저장:", completedRecipe.name, "총", updatedCompletedRecipes.length, "개");
      } else {
        console.log("⚠️ 오늘 이미 완료한 레시피:", selectedRecipe.name);
      }
    }
    navigateToStep("feedback");
  };

  const handleFeedbackComplete = () => {
    setSelectedRecipe(null);
    setPageHistory([]); // 피드백 완료 후 히스토리 초기화
    setCurrentStep("home");
  };

  const handleBackToHome = () => {
    setPageHistory([]); // 홈으로 갈 때는 히스토리 초기화
    setCurrentStep("home");
  };

  const handleAddIngredientsFromRecommendation = () => {
    navigateToStep("ingredients");
  };

  const handleVoiceAssistant = () => {
    setVoiceInitialRecipe(null);
    navigateToStep("voice-assistant");
  };

  const handleVoiceRecipeSelect = (recipe: Recipe) => {
  setSelectedRecipe(recipe);

  // ✅ 1) 완료한 요리에 추가 (오늘 이미 완료했다면 중복 방지)
  const todayStr = new Date().toDateString();
  const isAlreadyCompleted = completedRecipes.some(
    (r) =>
      (r.id && r.id === recipe.id) || // id가 있으면 id 기준
      (r.recipeName === recipe.recipeName && new Date(r.completedAt).toDateString() === todayStr)
  );

  if (!isAlreadyCompleted) {
    const completedRecipe: CompletedRecipe = {
      ...recipe,
      completedAt: new Date().toISOString(),
    };
    const updated = [completedRecipe, ...completedRecipes];
    setCompletedRecipes(updated);
    localStorage.setItem(
      "cooking_assistant_completed_recipes",
      JSON.stringify(updated)
    );
    console.log("✅ 레시피 완료 저장 (AI 음성):", completedRecipe.recipeName || completedRecipe.name);
  } else {
    console.log("⚠️ 오늘 이미 완료한 레시피 (AI 음성):", recipe.recipeName || recipe.name);
  }

  // ✅ 2) 레시피창 상단 메뉴 바로가기 버튼 목록에도 추가
  setQuickRecipes((prev) => {
    const exists = prev.some(
      (r) => (r.id && r.id === recipe.id) || r.recipeName === recipe.recipeName
    );
    return exists ? prev : [recipe, ...prev];
  });

  // ✅ 3) 요리 끝나고 나서 리뷰 페이지로 이동 (기존 흐름 유지)
  navigateToStep("recipe-review");
};


  const handleIngredientCheckConfirm = () => {
    // 완료한 레시피 저장 (중복 체크)
    if (selectedRecipe) {
      // 이미 완료한 레시피인지 확인
      const isAlreadyCompleted = completedRecipes.some(
        recipe => recipe.id === selectedRecipe.id && 
        new Date(recipe.completedAt).toDateString() === new Date().toDateString()
      );
      
      if (!isAlreadyCompleted) {
        const completedRecipe: CompletedRecipe = {
          ...selectedRecipe,
          completedAt: new Date().toISOString(),
        };
        const updatedCompletedRecipes = [completedRecipe, ...completedRecipes];
        setCompletedRecipes(updatedCompletedRecipes);
        localStorage.setItem("cooking_assistant_completed_recipes", JSON.stringify(updatedCompletedRecipes));
        console.log("✅ 레시피 완료 저장 (AI 음성):", completedRecipe.name, "총", updatedCompletedRecipes.length, "개");
      } else {
        console.log("⚠️ 오늘 이미 완료한 레시피:", selectedRecipe.name);
      }
    }
    navigateToStep("recipe-review");
  };

  const handleCookingInProgressComplete = () => {
    // 완료한 레시피 저장 (중복 체크)
    if (selectedRecipe) {
      // 이미 완료한 레시피인지 확인
      const isAlreadyCompleted = completedRecipes.some(
        recipe => recipe.id === selectedRecipe.id && 
        new Date(recipe.completedAt).toDateString() === new Date().toDateString()
      );
      
      if (!isAlreadyCompleted) {
        const completedRecipe: CompletedRecipe = {
          ...selectedRecipe,
          completedAt: new Date().toISOString(),
        };
        const updatedCompletedRecipes = [completedRecipe, ...completedRecipes];
        setCompletedRecipes(updatedCompletedRecipes);
        localStorage.setItem("cooking_assistant_completed_recipes", JSON.stringify(updatedCompletedRecipes));
        console.log("✅ 레시피 완료 저장 (조리중):", completedRecipe.name, "총", updatedCompletedRecipes.length, "개");
      } else {
        console.log("⚠️ 오늘 이미 완료한 레시피:", selectedRecipe.name);
      }
    }
    navigateToStep("feedback");
  };

  const handleReviewSubmit = () => {
    setSelectedRecipe(null);
    setPageHistory([]); // 리뷰 제출 후 히스토리 초기화
    setCurrentStep("home");
  };

  const handleReviewSkip = () => {
    setSelectedRecipe(null);
    setPageHistory([]); // 리뷰 스킵 후 히스토리 초기화
    setCurrentStep("home");
  };

  // 레시피 저장/저장 해제 핸들러
  const handleToggleSaveRecipe = (recipe: RecipeListRecipe) => {
    const isSaved = savedRecipes.some(r => r.id === recipe.id);
    
    let updatedSavedRecipes: RecipeListRecipe[];
    if (isSaved) {
      // 이미 저장된 레시피면 제거
      updatedSavedRecipes = savedRecipes.filter(r => r.id !== recipe.id);
      console.log("❌ 레시피 저장 해제:", recipe.name);
    } else {
      // 저장되지 않은 레시피면 추가
      updatedSavedRecipes = [recipe, ...savedRecipes];
      console.log("✅ 레시피 저장:", recipe.name);
    }
    
    setSavedRecipes(updatedSavedRecipes);
    localStorage.setItem("cooking_assistant_saved_recipes", JSON.stringify(updatedSavedRecipes));
    // 이벤트 발생시켜 다른 컴포넌트에게 알림
    const event = new Event("savedRecipesUpdated");
    window.dispatchEvent(event);
  };

  // 네비게이션 바 표시 여부 결정
  const shouldShowNavigation = isAuthenticated && currentStep !== "auth";

  // 하단 네비게이션 활성 탭 결정
  const getActiveBottomTab = () => {
    switch (currentStep) {
      case "home":
        return "home";
      case "recipe-list":
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

  // 뒤로가기 버튼 표시 여부 결정
  const shouldShowBackButton = currentStep !== "home" && currentStep !== "auth";

  // 🔥 레시피창 상단 메뉴 바로가기 버튼 클릭 → AI 조리 단계로 진입
  const handleQuickRecipeStart = (recipe: Recipe) => {
    setVoiceInitialRecipe(recipe);
    navigateToStep("voice-assistant");
  };


  return (
    <div className="min-h-screen bg-background">
      {/* 상단 네비게이션 바 */}
      {shouldShowNavigation && (
        <TopNavBar
          isAuthenticated={isAuthenticated}
          userName={currentUser?.name}
          onLogout={handleLogout}
          onProfileClick={() => navigateToStep("mypage")}
          onLogoClick={handleBackToHome}
          onSearch={(query) => console.log("Search:", query)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          showBackButton={shouldShowBackButton}
          onBackClick={handleBackNavigation}
        />
      )}

      {/* 메인 컨텐츠 */}
      {currentStep === "auth" && !isAuthenticated && (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}

      {currentStep === "home" && isAuthenticated && (
        <HomePage 
          onGetStarted={handleGetStarted} 
          onVoiceAssistant={handleVoiceAssistant}
          onLogout={handleLogout} 
          userName={currentUser?.name}
          onCommunityClick={() => navigateToStep("community")}
          userProfile={userProfile}
          onCategoryClick={(category) => {
            setSelectedCategory(category);
            navigateToStep("recipe-list");
          }}
          onIngredientsClick={() => navigateToStep("ingredients-management")}
        />
      )}

      {currentStep === "voice-assistant" && isAuthenticated && (
        <VoiceAssistant 
          onRecipeSelect={handleVoiceRecipeSelect}
          onBack={handleBackNavigation}
          initialRecipe={voiceInitialRecipe}
          userProfile={userProfile}   // ⭐ 추가됨
        />
      )}

      {currentStep === "ingredient-check" && isAuthenticated && selectedRecipe && (
        <RecipeIngredientCheck
          recipe={selectedRecipe}
          userProfile={userProfile}
          onConfirm={handleIngredientCheckConfirm}
          onBack={handleBackNavigation}
        />
      )}

      {currentStep === "cooking-in-progress" && isAuthenticated && selectedRecipe && (
        <CookingInProgress
          recipe={{ ...selectedRecipe, cookingTime: String(selectedRecipe.cookingTime) }}
          onComplete={handleCookingInProgressComplete}
          onBack={handleBackNavigation}
        />
      )}

      {currentStep === "profile" && isAuthenticated && (
        <ProfileSetup 
          onComplete={handleProfileComplete} 
          onBack={handleBackNavigation}
          initialProfile={userProfile}
        />
      )}

      {currentStep === "profile-complete" && userProfile && (
        <ProfileComplete
          profile={userProfile}
          onQuickRecommendation={handleQuickRecommendation}
          onDetailedRecommendation={handleDetailedRecommendation}
          onBack={handleBackNavigation}
        />
      )}

      {currentStep === "ingredients" && userProfile && (
        <IngredientsInput onComplete={handleIngredientsComplete} onBack={handleBackNavigation} />
      )}

      {currentStep === "recommendations" && userProfile && (
        <RecipeRecommendation
          profile={userProfile}
          context={cookingContext || undefined}
          onSelectRecipe={handleRecipeSelect}
          onBack={handleBackNavigation}
          onAddIngredients={!cookingContext ? handleAddIngredientsFromRecommendation : undefined}
        />
      )}

      {currentStep === "recipe" && selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onComplete={handleCookingComplete}
          onBack={handleBackNavigation}
        />
      )}

      {currentStep === "feedback" && selectedRecipe && (
        <Feedback recipe={selectedRecipe} onComplete={handleFeedbackComplete} />
      )}

      {currentStep === "recipe-list" && (
        <RecipeListPage 
          onRecipeClick={handleCompletedRecipeClick}
          initialCategory={selectedCategory}
          savedRecipes={savedRecipes}
          onToggleSave={handleToggleSaveRecipe}
          quickRecipes={quickRecipes}
          onQuickRecipeClick={handleQuickRecipeStart}
        />
      )}

      {currentStep === "saved" && (
        <SavedPage 
          savedRecipes={savedRecipes}
          onRecipeClick={handleCompletedRecipeClick}
          onRemoveSaved={handleToggleSaveRecipe}
        />
      )}

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

      {currentStep === "ingredients-management" && (
        <IngredientsManagement />
      )}

      {currentStep === "account-settings" && (
        <AccountSettings onBack={handleBackNavigation} />
      )}

      {currentStep === "recipe-review" && isAuthenticated && selectedRecipe && (
        <RecipeReview
          recipe={selectedRecipe}
          onSubmit={handleReviewSubmit}
          onSkip={handleReviewSkip}
        />
      )}

      {currentStep === "community" && (
        <CommunityPage />
      )}

      {currentStep === "completed-recipes" && (
        <CompletedRecipesPage 
          completedRecipes={completedRecipes}
          onRecipeClick={handleCompletedRecipeQuickNav}
        />
      )}

      {/* 하단 네비게이션 바 */}
      {shouldShowNavigation && (
        <BottomNavBar
          activeTab={getActiveBottomTab()}
          onHomeClick={handleBackToHome}
          onRecipeClick={() => navigateToStep("recipe-list")}
          onAIClick={handleVoiceAssistant}
          onIngredientsClick={() => navigateToStep("ingredients-management")}
          onMyPageClick={() => navigateToStep("mypage")}
        />
      )}
    </div>
  );
}
