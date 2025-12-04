import { useState, useEffect } from "react";
import { Auth } from "./components/Auth";
import { HomePage } from "./components/HomePage";
import { ProfileSetup, UserProfile } from "./components/ProfileSetup";
import { ProfileComplete } from "./components/ProfileComplete";
import { IngredientsInput, CookingContext } from "./components/IngredientsInput";
import { Feedback } from "./components/Feedback";
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
import { getCurrentUser, setAuthToken, removeAuthToken, updateProfile, saveRecipe, removeSavedRecipe, getSavedRecipes} from "./utils/api";

// [NEW IMPORT] FoodRecipe 컴포넌트와 FullRecipe 타입을 임포트
import { FoodRecipe, FullRecipe } from "./components/FoodRecipe"; 
import { OnboardingGuide } from "./components/OnboardingGuide";

// [MODIFIED] AppStep에 'full-recipe' 추가
type AppStep = "auth" | "home" | "profile" | "profile-complete" | "ingredients" | "recommendations" | "recipe" | "feedback" | "voice-assistant" | "ingredient-check" | "cooking-in-progress" | "recipe-list" | "saved" | "mypage" | "ingredients-management" | "account-settings" | "recipe-review" | "community" | "completed-recipes" | "full-recipe";

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
    difficulty?: string;     
    cookingTime?: number;    
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
	const [showOnboarding, setShowOnboarding] = useState(false);

    // [NEW STATE] 전체 레시피 페이지에 보여줄 레시피 ID
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    // [NEW STATE] AI 요리보조에 전달할 전체 레시피 데이터
    const [selectedFullRecipe, setSelectedFullRecipe] = useState<FullRecipe | null>(null); 


	// Check if user has an active session
	useEffect(() => {
	const checkSession = async () => {
		try {
		const storedUser = sessionStorage.getItem("cooking_assistant_current_user");
					
		if (storedUser) {
			const cachedUser = JSON.parse(storedUser);
						
			try {
			const response = await getCurrentUser();  // { user, profile }

			if (response && response.user) {
				// 백엔드에서 받은 최신 정보 기준으로 세팅
				const user = {
				...cachedUser,
				...response.user,
				};

				setCurrentUser(user);
				setIsAuthenticated(true);
				setCurrentStep("home");
				try {
				const list = await getSavedRecipes();
				setSavedRecipes(list);
				localStorage.setItem("cooking_assistant_saved_recipes", JSON.stringify(list));
				} catch (e) {
				console.error("Failed to load saved recipes from server:", e);
				}

				// 세션에도 다시 저장 (혹시 구조 바뀌었을 때)
				sessionStorage.setItem(
				"cooking_assistant_current_user",
				JSON.stringify(user)
				);
			}
			} catch (error) {
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

	useEffect(() => {
        if (isAuthenticated && currentStep === "home" && currentUser) {
            const key = `cooking_assistant_onboarding_shown_${currentUser.id}`;
            const flag = localStorage.getItem(key);

            if (flag !== "true") {
                setShowOnboarding(true);
            }
        }
    }, [isAuthenticated, currentStep, currentUser]);

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

	const handleAuthSuccess = async (userName: string) => {
  	const user = sessionStorage.getItem("cooking_assistant_current_user");
  	if (user) {
    setCurrentUser(JSON.parse(user));
  	}
  	setIsAuthenticated(true);
  	setPageHistory([]);
  	setCurrentStep("home");

  	// 🔹 로그인 직후에도 DB에서 저장 레시피 가져오기
  	try {
    	const list = await getSavedRecipes();
    	setSavedRecipes(list);
    	localStorage.setItem("cooking_assistant_saved_recipes", JSON.stringify(list));
  		} catch (e) {
    	console.error("Failed to load saved recipes after login:", e);
  		}
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
    // 1) Update frontend state
    setUserProfile(profile);

    // 2) Save to localStorage
    localStorage.setItem("cooking_assistant_user_profile", JSON.stringify(profile));

    // 3) Save to DB (백엔드)
    updateProfile({
      allergies: profile.allergies,
      preferences: profile,
    })
      .then(() => {
        console.log("프로필이 DB에 성공적으로 저장되었습니다.");
      })
      .catch((err) => {
        console.error("프로필 DB 저장 실패:", err);
      });

    // 4) Navigate back
    handleBackNavigation();
  };

	const handleQuickRecommendation = () => {
		setCookingContext(null);
		navigateToStep("recommendations");
	};

	const handleDetailedRecommendation = () => {
		navigateToStep("ingredients");
	};

	const handleOnboardingFinish = () => {
        setShowOnboarding(false);
        if (currentUser) {
            const key = `cooking_assistant_onboarding_shown_${currentUser.id}`;
            localStorage.setItem(key, "true");
        }
    };

	const handleIngredientsComplete = (context: CookingContext) => {
		setCookingContext(context);
		navigateToStep("recommendations");
	};

    // [NEW HANDLER] 레시피 목록에서 클릭 시 전체 상세 페이지로 이동
    const handleRecipeClick = (recipeId: string) => {
        setSelectedRecipeId(recipeId); // ID 저장
        setSelectedRecipe(null); // 혹시 모를 충돌 방지
        setSelectedFullRecipe(null); // 전체 레시피 데이터 초기화
        navigateToStep("full-recipe"); // 새 페이지로 이동
    };

    // [NEW HANDLER] FoodRecipe에서 "AI 요리보조 시작" 클릭 시 호출
    const handleStartCookingAssistant = (recipe: FullRecipe) => {
        setSelectedFullRecipe(recipe);
        navigateToStep("voice-assistant"); // VoiceAssistant로 이동
    };

	// DB 상세 조회 API 함수 (기존 로직 유지, 새 흐름에서는 사용되지 않음)
	async function fetchRecipeDetail(id: string): Promise<RecipeDetailData> {
		const response = await fetch(`http://localhost:3001/api/recipes/detail/${id}`);
		if (!response.ok) throw new Error("Failed to fetch recipe detail");
		return response.json();
	}
    
    // (기존의 handleRecipeSelect, handleRecipeSelectForCheck 함수는 새로운 handleRecipeClick으로 대체되었습니다.)

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
        setSelectedFullRecipe(null); // AI 보조 단독 시작 시 초기화
		navigateToStep("voice-assistant");
	};

	// ✅ 문제점 2 해결: VoiceAssistant에서 선택된 레시피를 ID 기반으로 상세 조회하여 이동
	const handleVoiceRecipeSelect = async (recipe: any) => {
		// GPT 레시피는 DB에 없으므로 fetchRecipeDetail 사용 금지
		// 대신 AI 레시피를 RecipeDetailData 구조로 변환해서 저장

		const converted: RecipeDetailData = {
			id: "ai-" + Date.now(), // 가짜 ID 생성
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
			steps: recipe.steps ?? [],
            // 🔥 nn 브랜치의 추가 필드를 반영합니다.
            difficulty: recipe.difficulty ?? "보통",
            cookingTime: recipe.cookingTime ?? 10,
		};

		setSelectedRecipe(converted);
		// 바로 리뷰 페이지로 이동 (기존 로직 유지)
		navigateToStep("recipe-review");
	};

	const handleReviewSubmit = () => {
		setSelectedRecipe(null);
        setSelectedFullRecipe(null); // 전체 레시피 초기화
		setPageHistory([]); // 리뷰 제출 후 히스토리 초기화
		setCurrentStep("home");
	};

	const handleReviewSkip = () => {
		setSelectedRecipe(null);
        setSelectedFullRecipe(null); // 전체 레시피 초기화
		setPageHistory([]); // 리뷰 스킵 후 히스토리 초기화
		setCurrentStep("home");
	};

	// 레시피 저장/저장 해제 핸들러
	const handleToggleSaveRecipe = async (recipe: RecipeListRecipe) => {
	const isSaved = savedRecipes.some(r => r.id === recipe.id);

	// 1) 프론트/로컬 상태는 기존 그대로 먼저 업데이트
	let updatedSavedRecipes: RecipeListRecipe[];
	if (isSaved) {
		updatedSavedRecipes = savedRecipes.filter(r => r.id !== recipe.id);
		console.log("❌ 레시피 저장 해제 (프론트):", recipe.name);
	} else {
		updatedSavedRecipes = [recipe, ...savedRecipes];
		console.log("✅ 레시피 저장 (프론트):", recipe.name);
	}

	setSavedRecipes(updatedSavedRecipes);
	localStorage.setItem(
		"cooking_assistant_saved_recipes",
		JSON.stringify(updatedSavedRecipes)
	);
	window.dispatchEvent(new Event("savedRecipesUpdated"));

	// 2) 백엔드(DB)와 동기화
	try {
		if (isSaved) {
		// 삭제: DELETE /api/saved-recipes/:id
		await removeSavedRecipe(recipe.id);
		console.log("✅ DB에서 저장 해제 완료:", recipe.id);
		} else {
		// 저장: POST /api/saved-recipes
		await saveRecipe({
			// 백엔드 컨트롤러가 요구할 만한 최소한의 필드들
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
		console.log("✅ DB에 저장 완료:", recipe.id);
		}
	} catch (error) {
		console.error("❌ DB 저장/삭제 중 오류:", error);
		// 필요하면 여기에서 토스트 띄우기
		// toast.error("서버와 동기화 중 오류가 발생했습니다.");
	}
	};

	// 네비게이션 바 표시 여부 결정
	const shouldShowNavigation = isAuthenticated && currentStep !== "auth" && !showOnboarding;

	// 하단 네비게이션 활성 탭 결정
	const getActiveBottomTab = () => {
		switch (currentStep) {
			case "home":
				return "home";
			case "recipe-list":
			case "full-recipe": // [MODIFIED] 새 스텝 추가
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
				<>	// Fragment 시작
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

				{/* 🔥 nn 브랜치에서 추가된 온보딩 가이드 */}
				{showOnboarding && (
					<OnboardingGuide onFinish={handleOnboardingFinish} />
				)}
				</> // Fragment 끝
			)}

			{currentStep === "voice-assistant" && isAuthenticated && (
				<VoiceAssistant 
					onRecipeSelect={handleVoiceRecipeSelect}
					onBack={handleBackNavigation}
					userProfile={userProfile}
                    // [NEW PROP] AI 요리보조 시작 시 레시피 컨텍스트 제공
                    initialRecipeContext={selectedFullRecipe} 
				/>
			)}
            
            {/* [NEW STEP] 레시피 전체 상세 페이지 */}
            {currentStep === "full-recipe" && selectedRecipeId && (
                <FoodRecipe
                    // [MODIFIED] FoodRecipe 컴포넌트가 useParams 대신 prop으로 ID를 받도록 가정하고 구현
                    recipeId={selectedRecipeId}
                    onStartCookingAssistant={handleStartCookingAssistant}
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
					onRecipeClick={handleRecipeClick} // [MODIFIED] 새로운 핸들러 사용
					initialCategory={selectedCategory}
					savedRecipes={savedRecipes}
					onToggleSave={handleToggleSaveRecipe}
				/>
			)}

			{currentStep === "saved" && (
  			<SavedPage savedRecipes={savedRecipes}
    		// SavedPage는 id를 넘겨주니까 그대로 id를 받으면 됨
    		onRecipeClick={(id) => handleRecipeClick(id)}
    		// 또는 더 간단히: onRecipeClick={handleRecipeClick}
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
					onRecipeClick={handleRecipeClick} // [MODIFIED] 새로운 핸들러 사용, ID 전달
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