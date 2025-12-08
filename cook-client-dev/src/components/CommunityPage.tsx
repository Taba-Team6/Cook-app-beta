import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Star,
  MessageCircle,
  Clock,
  Users,
  Trophy,
  Award,
  Medal,
  Bookmark,
  Send,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface CommunityReview {
  id: string;
  recipeId: string;
  recipeName: string;
  rating: number;
  review: string;
  image: string | null;
  userName: string;
  userInitial: string;
  createdAt: string;
}

interface Comment {
  id: string;
  reviewId: string;
  userName: string;
  userInitial: string;
  text: string;
  createdAt: string;
}

interface RecipeRanking {
  recipeId: string;
  recipeName: string;
  reviewCount: number;
  averageRating: number;
  rank: number;
}

export function CommunityPage() {
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "recent" | "popular" | "ranking">(
    "all"
  );
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());

  // -----------------------------
  // 초기 데이터 로딩 (A 버전 로직 유지)
  // -----------------------------
  useEffect(() => {
    // Load reviews from localStorage
    const savedReviews = localStorage.getItem("cooking_assistant_reviews");
    if (savedReviews) {
      const parsedReviews = JSON.parse(savedReviews);
      setReviews(parsedReviews);
    } else {
      // 샘플 데이터 추가 (처음 방문 시)
      const sampleReviews: CommunityReview[] = [
        {
          id: "sample_1",
          recipeId: "kimchi_jjigae",
          recipeName: "김치찌개",
          rating: 5,
          review:
            "처음 만들어봤는데 정말 맛있어요! AI 가이드 덕분에 쉽게 따라할 수 있었습니다. 다음에는 돼지고기를 더 넣어봐야겠어요.",
          image:
            "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800",
          userName: "요리초보",
          userInitial: "요",
          createdAt: new Date(
            Date.now() - 2 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "sample_2",
          recipeId: "carbonara",
          recipeName: "까르보나라",
          rating: 4,
          review:
            "크림 소스가 너무 맛있었어요! 베이컨 대신 팬체타를 사용했더니 더 고급스러운 맛이 났습니다.",
          image:
            "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800",
          userName: "파스타러버",
          userInitial: "파",
          createdAt: new Date(
            Date.now() - 5 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "sample_3",
          recipeId: "bibimbap",
          recipeName: "비빔밥",
          rating: 5,
          review:
            "집에서 비빔밥 만들어 먹으니 너무 좋네요. 야채도 신선하고 고추장 양념장이 일품이었습니다!",
          image: null,
          userName: "건강요리",
          userInitial: "건",
          createdAt: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];
      localStorage.setItem(
        "cooking_assistant_reviews",
        JSON.stringify(sampleReviews)
      );
      setReviews(sampleReviews);
    }

    // Load comments from localStorage
    const savedComments = localStorage.getItem("cooking_assistant_comments");
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }

    // Load saved recipes to check which ones are saved
    loadSavedRecipes();

    // Listen for saved recipes updates
    const handleSavedRecipesUpdate = () => {
      loadSavedRecipes();
    };
    window.addEventListener("savedRecipesUpdated", handleSavedRecipesUpdate);

    return () => {
      window.removeEventListener(
        "savedRecipesUpdated",
        handleSavedRecipesUpdate
      );
    };
  }, []);

  const loadSavedRecipes = () => {
    const savedRecipes = JSON.parse(
      localStorage.getItem("cooking_assistant_saved_recipes") || "[]"
    );

    // id를 string으로 통일
    const savedIds: Set<string> = new Set(
      savedRecipes.map((r: any) => String(r.id))
    );
    setSavedRecipeIds(savedIds);
  };

  // -----------------------------
  // 시간 표시 유틸 (A 버전 유지)
  // -----------------------------
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - past.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}주 전`;
  };

  // -----------------------------
  // 댓글 토글 / 추가 (A 버전 유지)
  // -----------------------------
  const toggleComments = (reviewId: string) => {
    setShowComments((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const addComment = (reviewId: string) => {
    const commentText = commentInput[reviewId]?.trim();
    if (!commentText) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      reviewId,
      userName: "나",
      userInitial: "나",
      text: commentText,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    localStorage.setItem(
      "cooking_assistant_comments",
      JSON.stringify(updatedComments)
    );

    setCommentInput((prev) => ({ ...prev, [reviewId]: "" }));
  };

  const getReviewComments = (reviewId: string) => {
    return comments.filter((c) => c.reviewId === reviewId);
  };

  // -----------------------------
  // 레시피 ID 매핑 (A 버전 유지)
  // -----------------------------
  const getActualRecipeId = (reviewRecipeId: string): string | null => {
    const recipeMapping: Record<string, string> = {
      // 문자열 형식 ID
      kimchi_jjigae: "3",
      carbonara: "2",
      bibimbap: "6",
      kimchi_bokkeumbap: "1",
      omurice: "5",
      tomato_pasta: "7",
      shrimp_fried_rice: "8",
      salmon_sushi: "9",
      gyudon: "10",
      mapo_tofu: "11",
      chicken_salad: "4",
      // 숫자 형식 ID (직접 매핑)
      "1": "1",
      "2": "2",
      "3": "3",
      "4": "4",
      "5": "5",
      "6": "6",
      "7": "7",
      "8": "8",
      "9": "9",
      "10": "10",
      "11": "11",
    };

    return recipeMapping[reviewRecipeId] || null;
  };

  const isRecipeSaved = (reviewRecipeId: string): boolean => {
    const actualRecipeId = getActualRecipeId(reviewRecipeId);
    return actualRecipeId ? savedRecipeIds.has(actualRecipeId) : false;
  };

  // -----------------------------
  // 레시피 저장 로직 (A 버전 그대로)
  // -----------------------------
  const saveRecipe = (review: CommunityReview) => {
    try {
      const recipeMapping: Record<string, any> = {
        // 문자열 형식 ID
        kimchi_jjigae: { id: "3", name: "된장찌개" },
        carbonara: { id: "2", name: "스파게티 까르보나라" },
        bibimbap: { id: "6", name: "비빔밥" },
        kimchi_bokkeumbap: { id: "1", name: "김치볶음밥" },
        omurice: { id: "5", name: "오므라이스" },
        tomato_pasta: { id: "7", name: "토마토 파스타" },
        shrimp_fried_rice: { id: "8", name: "새우볶음밥" },
        salmon_sushi: { id: "9", name: "연어초밥" },
        gyudon: { id: "10", name: "규동" },
        mapo_tofu: { id: "11", name: "마파두부" },
        chicken_salad: { id: "4", name: "치킨 샐러드" },
        // 숫자 형식 ID (직접 매핑)
        "1": { id: "1", name: "김치볶음밥" },
        "2": { id: "2", name: "스파게티 까르보나라" },
        "3": { id: "3", name: "된장찌개" },
        "4": { id: "4", name: "치킨 샐러드" },
        "5": { id: "5", name: "오므라이스" },
        "6": { id: "6", name: "비빔밥" },
        "7": { id: "7", name: "토마토 파스타" },
        "8": { id: "8", name: "새우볶음밥" },
        "9": { id: "9", name: "연어초밥" },
        "10": { id: "10", name: "규동" },
        "11": { id: "11", name: "마파두부" },
      };

      const allRecipes = [
        {
          id: "1",
          name: "김치볶음밥",
          category: "한식",
          difficulty: "쉬움",
          time: "20분",
          cookingTime: "20분",
          servings: "2인분",
          image:
            "https://images.unsplash.com/photo-1744870132190-5c02d3f8d9f9?w=400&h=225&fit=crop",
          description: "간단하고 빠르게 만들 수 있는 한국의 대표 요리",
          tags: ["한식", "간편식", "볶음밥"],
        },
        {
          id: "2",
          name: "스파게티 까르보나라",
          category: "양식",
          difficulty: "보통",
          time: "30분",
          cookingTime: "30분",
          servings: "2인분",
          image:
            "https://images.unsplash.com/photo-1588013273468-315fd88ea34c?w=400&h=225&fit=crop",
          description: "크리미한 소스가 일품인 이탈리아 파스타",
          tags: ["양식", "파스타", "크림"],
        },
        {
          id: "3",
          name: "된장찌개",
          category: "한식",
          difficulty: "쉬움",
          time: "25분",
          cookingTime: "25분",
          servings: "2인분",
          image:
            "https://images.unsplash.com/photo-1665395876131-7cf7cb099a51?w=400&h=225&fit=crop",
          description: "구수한 맛이 일품인 한국 전통 찌개",
          tags: ["한식", "찌개", "전통"],
        },
        {
          id: "4",
          name: "치킨 샐러드",
          category: "기타",
          difficulty: "쉬움",
          time: "15분",
          cookingTime: "15분",
          servings: "1인분",
          image:
            "https://images.unsplash.com/photo-1729719930828-6cd60cb7d10f?w=400&h=225&fit=crop",
          description: "신선한 채소와 닭가슴살로 만드는 건강 요리",
          tags: ["샐러드", "건강식", "다이어트"],
        },
        {
          id: "5",
          name: "오므라이스",
          category: "양식",
          difficulty: "보통",
          time: "25분",
          cookingTime: "25분",
          servings: "2인분",
          image:
            "https://images.unsplash.com/photo-1743148509702-2198b23ede1c?w=400&h=225&fit=crop",
          description: "부드러운 계란과 볶음밥의 조화",
          tags: ["양식", "계란", "볶음밥"],
        },
        {
          id: "6",
          name: "비빔밥",
          category: "한식",
          difficulty: "보통",
          time: "35분",
          cookingTime: "35분",
          servings: "2인분",
          image:
            "https://images.unsplash.com/photo-1718777791239-c473e9ce7376?w=400&h=225&fit=crop",
          description:
            "다양한 나물과 고기가 어우러진 영양 만점 한 그릇 요리",
          tags: ["한식", "비빔밥", "영양식"],
        },
        {
          id: "7",
          name: "토마토 파스타",
          category: "양식",
          difficulty: "쉬움",
          time: "20분",
          cookingTime: "20분",
          servings: "2인분",
          image:
            "https://images.unsplash.com/photo-1751151497799-8b4057a2638e?w=400&h=225&fit=crop",
          description: "신선한 토마토로 만드는 상큼한 파스타",
          tags: ["양식", "파스타", "토마토"],
        },
        {
          id: "8",
          name: "새우볶음밥",
          category: "중식",
          difficulty: "보통",
          time: "25분",
          cookingTime: "25분",
          servings: "2인분",
          image:
            "https://images.unsplash.com/photo-1747228469026-7298b12d9963?w=400&h=225&fit=crop",
          description: "통통한 새우가 들어간 고소한 볶음밥",
          tags: ["중식", "볶음밥", "새우"],
        },
        {
          id: "9",
          name: "연어초밥",
          category: "일식",
          difficulty: "어려움",
          time: "40분",
          cookingTime: "40분",
          servings: "2인분",
          image:
            "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=225&fit=crop",
          description: "신선한 연어로 만드는 정통 일본 초밥",
          tags: ["일식", "초밥", "연어"],
        },
        {
          id: "10",
          name: "규동",
          category: "일식",
          difficulty: "보통",
          time: "30분",
          cookingTime: "30분",
          servings: "2인분",
          image:
            "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=225&fit=crop",
          description: "달콤짭짤한 소고기 덮밥",
          tags: ["일식", "덮밥", "소고기"],
        },
        {
          id: "11",
          name: "마파두부",
          category: "중식",
          difficulty: "보통",
          time: "30분",
          cookingTime: "30분",
          servings: "2인분",
          image:
            "https://images.unsplash.com/photo-1672732608910-ffe083446f9f?w=400&h=225&fit=crop",
          description: "얼얼한 맛이 일품인 사천식 두부 요리",
          tags: ["중식", "두부", "매운맛"],
        },
      ];

      const savedRecipes = JSON.parse(
        localStorage.getItem("cooking_assistant_saved_recipes") || "[]"
      );

      const mappedRecipe = recipeMapping[review.recipeId];
      if (!mappedRecipe) {
        console.error("Unknown recipe ID:", review.recipeId);
        return;
      }

      const fullRecipe = allRecipes.find((r) => r.id === mappedRecipe.id);
      if (!fullRecipe) {
        console.error("Recipe not found:", mappedRecipe.id);
        return;
      }

      if (savedRecipes.some((r: any) => r.id === fullRecipe.id)) {
        return;
      }

      savedRecipes.push(fullRecipe);
      localStorage.setItem(
        "cooking_assistant_saved_recipes",
        JSON.stringify(savedRecipes)
      );

      window.dispatchEvent(new Event("savedRecipesUpdated"));
    } catch (error) {
      console.error("Error saving recipe:", error);
    }
  };

  // -----------------------------
  // 랭킹 계산 (A 버전 유지)
  // -----------------------------
  const calculateRankings = (): RecipeRanking[] => {
    const recipeMap = new Map<string, CommunityReview[]>();

    reviews.forEach((review) => {
      const existing = recipeMap.get(review.recipeId) || [];
      recipeMap.set(review.recipeId, [...existing, review]);
    });

    const rankings: RecipeRanking[] = [];
    recipeMap.forEach((recipeReviews, recipeId) => {
      const reviewCount = recipeReviews.length;
      const totalRating = recipeReviews.reduce(
        (sum, r) => sum + r.rating,
        0
      );
      const averageRating = totalRating / reviewCount;

      rankings.push({
        recipeId,
        recipeName: recipeReviews[0].recipeName,
        reviewCount,
        averageRating,
        rank: 0,
      });
    });

    const maxReviewCount = Math.max(...rankings.map((r) => r.reviewCount), 1);

    const rankingsWithScore = rankings.map((r) => ({
      ...r,
      score:
        ((r.averageRating / 5) * 0.7) +
        ((r.reviewCount / maxReviewCount) * 0.3),
    }));

    rankingsWithScore.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.averageRating !== a.averageRating)
        return b.averageRating - a.averageRating;
      return b.reviewCount - a.reviewCount;
    });

    let currentRank = 1;
    for (let i = 0; i < rankingsWithScore.length; i++) {
      if (
        i > 0 &&
        Math.abs(rankingsWithScore[i].score - rankingsWithScore[i - 1].score) <
          0.001
      ) {
        rankingsWithScore[i].rank = rankingsWithScore[i - 1].rank;
      } else {
        rankingsWithScore[i].rank = currentRank;
      }
      currentRank++;
    }

    return rankingsWithScore;
  };

  const filteredReviews = [...reviews].sort((a, b) => {
    if (filter === "recent") {
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    if (filter === "popular") {
      return b.rating - a.rating;
    }
    return 0;
  });

  const rankings = calculateRankings();

  // -----------------------------
  // Ranking View (B 스타일)
  // -----------------------------
  const renderRankingView = () => {
    if (rankings.length === 0) {
      return (
        <Card className="border-0 shadow-sm rounded-3xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-foreground mb-2">아직 랭킹이 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              요리를 완성하고 리뷰를 남기면 랭킹이 표시됩니다!
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {/* 랭킹 헤더 */}
        <div className="bg-primary rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <h2 className="text-xl">레시피 랭킹</h2>
              <p className="text-sm text-white/80">평점과 리뷰 수 기준</p>
            </div>
          </div>
        </div>

        {/* 랭킹 목록 */}
        {rankings.map((ranking) => {
          const getRankIcon = () => {
            if (ranking.rank === 1)
              return <Trophy className="w-6 h-6 text-[#FFD700]" />;
            if (ranking.rank === 2)
              return <Award className="w-6 h-6 text-[#C0C0C0]" />;
            if (ranking.rank === 3)
              return <Medal className="w-6 h-6 text-[#CD7F32]" />;
            return null;
          };

          const getRankBgColor = () => {
            if (ranking.rank === 1) return "bg-[#FFD700]/10";
            if (ranking.rank === 2) return "bg-[#C0C0C0]/10";
            if (ranking.rank === 3) return "bg-[#CD7F32]/10";
            return "bg-card";
          };

          return (
            <Card
              key={ranking.recipeId}
              className={`border-0 shadow-sm rounded-2xl ${getRankBgColor()}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {/* 순위 */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                    {getRankIcon() || (
                      <span className="text-white text-xl">
                        {ranking.rank}
                      </span>
                    )}
                  </div>

                  {/* 레시피 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-foreground mb-2 truncate">
                      {ranking.recipeName}
                    </h3>

                    <div className="flex items-center gap-4 flex-wrap">
                      {/* 평균 평점 */}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-secondary text-secondary" />
                        <span className="text-sm text-foreground">
                          {ranking.averageRating.toFixed(1)}
                        </span>
                      </div>

                      {/* 별점 표시 */}
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.round(ranking.averageRating)
                                ? "fill-accent text-accent"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>

                      {/* 리뷰 수 */}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{ranking.reviewCount}개</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // -----------------------------
  // Review List View (B 스타일)
  // -----------------------------
  const renderReviewList = () => {
    if (filteredReviews.length === 0) {
      return (
        <Card className="border-0 shadow-sm rounded-3xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-foreground mb-2">아직 리뷰가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              첫 번째로 요리를 완성하고 리뷰를 남겨보세요!
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-5">
        {filteredReviews.map((review) => {
          const reviewComments = getReviewComments(review.id);
          const isCommentsOpen = showComments[review.id];

          return (
            <Card
              key={review.id}
              className="border-0 shadow-sm rounded-3xl overflow-hidden"
            >
              <CardContent className="p-0">
                {/* User Info */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-11 h-11">
                        <AvatarFallback className="bg-primary text-white rounded-2xl">
                          {review.userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-foreground">
                          {review.userName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeAgo(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "fill-accent text-accent"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recipe Name */}
                  <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full mb-3">
                    <p className="text-sm">{review.recipeName}</p>
                  </div>

                  {/* Review Text */}
                  {review.review && (
                    <p className="text-sm text-foreground mb-3 leading-relaxed">
                      {review.review}
                    </p>
                  )}
                </div>

                {/* Review Image */}
                {review.image && (
                  <div className="w-full">
                    <ImageWithFallback
                      src={review.image}
                      alt={`${review.recipeName} 완성 사진`}
                      className="w-full h-72 object-cover"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="p-5 pt-4 border-t border-border/40">
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => toggleComments(review.id)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>
                        댓글{" "}
                        {reviewComments.length > 0 &&
                          `(${reviewComments.length})`}
                      </span>
                    </button>
                    <button
                      onClick={() => saveRecipe(review)}
                      className={`flex items-center gap-2 text-sm transition-colors ${
                        isRecipeSaved(review.recipeId)
                          ? "text-accent"
                          : "text-muted-foreground hover:text-accent"
                      }`}
                    >
                      <Bookmark
                        className={`w-5 h-5 ${
                          isRecipeSaved(review.recipeId) ? "fill-accent" : ""
                        }`}
                      />
                      <span>
                        {isRecipeSaved(review.recipeId)
                          ? "저장됨"
                          : "레시피 저장"}
                      </span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {isCommentsOpen && (
                    <div className="mt-5 pt-5 border-t border-border/40">
                      {/* Comments List */}
                      {reviewComments.length > 0 && (
                        <div className="space-y-4 mb-4">
                          {reviewComments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="w-9 h-9 flex-shrink-0">
                                <AvatarFallback className="bg-accent text-white rounded-xl text-xs">
                                  {comment.userInitial}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 bg-muted rounded-2xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm text-foreground">
                                    {comment.userName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {getTimeAgo(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground">
                                  {comment.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="댓글을 입력하세요..."
                          value={commentInput[review.id] || ""}
                          onChange={(e) =>
                            setCommentInput((prev) => ({
                              ...prev,
                              [review.id]: e.target.value,
                            }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addComment(review.id);
                            }
                          }}
                          className="flex-1 rounded-xl"
                        />
                        <Button
                          onClick={() => addComment(review.id)}
                          size="sm"
                          className="rounded-xl"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // -----------------------------
  // JSX 반환 (B 스타일 레이아웃)
  // -----------------------------
  return (
    <div className="min-h-screen bg-background pt-16 pb-24">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="mb-1">쿠킹 커뮤니티</h2>
              <p className="text-sm text-muted-foreground">
                레시피 후기를 공유하고 소통해요
              </p>
            </div>
          </div>
        </div>

        {/* 필터 버튼 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="rounded-full flex-shrink-0 shadow-sm"
          >
            전체
          </Button>
          <Button
            variant={filter === "recent" ? "default" : "outline"}
            onClick={() => setFilter("recent")}
            className="rounded-full flex-shrink-0 shadow-sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            최신순
          </Button>
          <Button
            variant={filter === "popular" ? "default" : "outline"}
            onClick={() => setFilter("popular")}
            className="rounded-full flex-shrink-0 shadow-sm"
          >
            <Star className="w-4 h-4 mr-2" />
            인기순
          </Button>
          <Button
            variant={filter === "ranking" ? "default" : "outline"}
            onClick={() => setFilter("ranking")}
            className="rounded-full flex-shrink-0 shadow-sm"
          >
            <Trophy className="w-4 h-4 mr-2" />
            레시피 랭킹
          </Button>
        </div>

        {/* 메인 컨텐츠 */}
        {filter === "ranking" ? renderRankingView() : renderReviewList()}
      </div>
    </div>
  );
}
