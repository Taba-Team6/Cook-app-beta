import { useState, useEffect } from "react";
import { Auth } from "./components/Auth";
import { HomePage } from "./components/HomePage";
import { ProfileSetup, UserProfile } from "./components/ProfileSetup";
import { ProfileComplete } from "./components/ProfileComplete";
import { IngredientsInput, CookingContext } from "./components/IngredientsInput";
//import { RecipeRecommendation } from "./components/RecipeRecommendation";
//import { RecipeDetail } from "./components/RecipeDetail";
import { Feedback } from "./components/Feedback";
import { VoiceAssistant } from "./components/VoiceAssistant";
//import { RecipeIngredientCheck } from "./components/RecipeIngredientCheck";
//import { CookingInProgress } from "./components/CookingInProgress";
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
//import type { Recipe } from "./components/RecipeRecommendation"; // VoiceAssistant에서 레시피 목록용으로 잠시 유지
import { getCurrentUser, setAuthToken, removeAuthToken } from "./utils/api";

type AppStep = "auth" | "home" | "profile" | "profile-complete" | "ingredients" | "recommendations" | "recipe" | "feedback" | "voice-assistant" | "ingredient-check" | "cooking-in-progress" | "recipe-list" | "saved" | "mypage" | "ingredients-management" | "account-settings" | "recipe-review" | "community" | "completed-recipes";

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

// ✅ 문제점 1 해결: CompletedRecipe 타입을 RecipeDetailData 확장형으로 변경
interface CompletedRecipe extends RecipeDetailData {
  completedAt: string;
}

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>("auth");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cookingContext, setCookingContext] = useState<CookingContext | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetailData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [pageHistory, setPageHistory] = useState<AppStep[]>([]);
  const [completedRecipes, setCompletedRecipes] = useState<CompletedRecipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [savedRecipes, setSavedRecipes] = useState<RecipeListRecipe[]>([]);

  // Check if user has an active session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we have a stored auth token
        const storedUser = sessionStorage.getItem("cooking_assistant_current_user");
        
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          // Verify token with backend
          try {
            const response = await getCurrentUser();
            
            if (response && response.user) {
              setCurrentUser(response.user);
              setIsAuthenticated(true);
              setCurrentStep("home");
            }
          } catch (error) {
            // Token invalid, clear session
            console.error('Session verification failed:', error);
            sessionStorage.removeItem("cooking_assistant_current_user");
            removeAuthToken();
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
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
    const user = sessionStorage.getItem("cooking_assistant_current_user");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setIsAuthenticated(true);
    setPageHistory([]); // 로그인 시 히스토리 초기화
    setCurrentStep("home");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("cooking_assistant_current_user");
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

  // 1. 레시피 상세 페이지 (RecipeDetail)를 바로 보여주기 위한 핸들러 (추천 페이지에서 사용)
  const handleRecipeSelect = async (recipeId: string) => {
    try {
      const detail = await fetchRecipeDetail(recipeId);
      setSelectedRecipe(detail);
      navigateToStep("recipe");
    } catch (error) {
      console.error("Failed to load recipe detail:", error);
    }
  };


  // DB 상세 조회 API 함수
  async function fetchRecipeDetail(id: string): Promise<RecipeDetailData> {
    const response = await fetch(`http://localhost:3001/api/recipes/detail/${id}`);
    if (!response.ok) throw new Error("Failed to fetch recipe detail");
    return response.json();
  }

  // 2. 레시피 상세 조회 후 재료 확인 페이지 (RecipeIngredientCheck)로 이동하는 핸들러
  // ✅ 문제점 2 해결: RecipeListPage, SavedPage, CompletedRecipesPage에서 사용하도록 통합
  const handleRecipeSelectForCheck = async (recipeId: string) => {
    try {
      const detail = await fetchRecipeDetail(recipeId);
      setSelectedRecipe(detail);
      navigateToStep("ingredient-check");
    } catch (error) {
      console.error("Failed to load recipe detail for check:", error);
    }
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
          // ✅ CompletedRecipe가 RecipeDetailData를 확장하도록 수정했으므로 안전함
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
    navigateToStep("voice-assistant");
  };

  // ✅ 문제점 2 해결: VoiceAssistant에서 선택된 레시피를 ID 기반으로 상세 조회하여 이동
  const handleVoiceRecipeSelect = async (recipe: any) => {
    // GPT 레시피는 DB에 없으므로 fetchRecipeDetail 사용 금지
    // 대신 AI 레시피를 RecipeDetailData 구조로 변환해서 저장

    const converted: RecipeDetailData = {
      id: "ai-" + Date.now(),  // 가짜 ID 생성
      name: recipe.recipeName ?? "AI 추천 레시피",
      image: null,
      description: recipe.description ?? null,
      category: "AI 추천",
      cooking_method: null,
      hashtags: null,
      ingredients: recipe.ingredients?.map((i: any) => ({
        name: i.name,
        amount: i.amount,
      })) ?? [],
      steps: recipe.steps ?? []
    };

    setSelectedRecipe(converted);

    // 바로 리뷰 페이지로 이동
    navigateToStep("recipe-review");
  };


  /*const handleIngredientCheckConfirm = () => {
    // 완료한 레시피 저장 로직은 조리 완료 시점에 한 번만 실행되도록, 여기서는 생략하고 바로 다음 단계로 이동
    // navigateToStep("cooking-in-progress"); // 일반적인 흐름
    navigateToStep("recipe-review"); // 임시로 리뷰 페이지로 바로 이동
  };*/
  
  // RecipeIngredientCheck 컴포넌트 내에서 조리 시작 버튼을 누르면 이 함수 호출
  /*const handleStartCooking = () => {
    navigateToStep("cooking-in-progress");
  };*/

  /*const handleCookingInProgressComplete = () => {
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
  };*/

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
          userProfile={userProfile}
        />
      )}

      

      {/* ✅ selectedRecipe 타입: RecipeDetailData */}
      

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

    

      

      {currentStep === "feedback" && selectedRecipe && (
        <Feedback recipe={selectedRecipe} onComplete={handleFeedbackComplete} />
      )}

      {currentStep === "recipe-list" && (
        <RecipeListPage 
          onRecipeClick={(recipe) => handleRecipeSelectForCheck(recipe.id)} // ✅ 핸들러 변경
          initialCategory={selectedCategory}
          savedRecipes={savedRecipes}
          onToggleSave={handleToggleSaveRecipe}
        />
      )}

      {currentStep === "saved" && (
        <SavedPage 
          savedRecipes={savedRecipes}
          onRecipeClick={(recipe) => handleRecipeSelectForCheck(recipe)}// ✅ 핸들러 변경
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
          recipe={selectedRecipe} // ✅ selectedRecipe 타입: RecipeDetailData
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
          onRecipeClick={(recipe) => handleRecipeSelectForCheck(recipe.id)} // ✅ 핸들러 변경
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