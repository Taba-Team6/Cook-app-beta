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
import { getSavedRecipes, saveRecipe,removeSavedRecipe } from "../utils/api";
import { getCompletedRecipeById } from "../utils/api";


function HideOnErrorImage({
  src,
  alt,
  className,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [error, setError] = useState(false);

  // src가 없거나 에러 발생하면 아무것도 렌더링하지 않음
  if (!src || error) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...rest}
    />
  );
}


// =======================
// 타입 정의 (DB 기준)
export interface CommunityReview {
  id: string;
  recipe_id: string;
  recipe_name: string;
  rating: number;
  review: string;
  image_url: string | null;
  user_name: string;
  user_initial: string;
  created_at: string;

  bookmark_count?: number;
  recipe_image?: string | null;
  comment_count?: number; // ✅ 추가
}

interface Comment {
  id: string;
  review_id: string;
  user_name: string;
  user_initial: string;
  text: string;
  created_at: string;
}

interface RecipeRanking {
  recipeId: string;
  recipeName: string;
  reviewCount: number;
  averageRating: number;
  rank: number;
}

// ✅ 새로 추가
interface CommunityPageProps {
  onGoToSaved?: () => void;
  onRefreshSaved?: () => void;   // ✅ 추가
}

// =======================
// 컴포넌트
export function CommunityPage({ onGoToSaved, onRefreshSaved }: CommunityPageProps) {
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "recent" | "popular" | "ranking">(
    "all"
  );
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());

  const currentUser = JSON.parse(
    sessionStorage.getItem("cooking_assistant_current_user") || "{}"
  );


  // =======================
  // 초기 로딩
  useEffect(() => {
    loadCommunity();
    loadSaved();
  }, []);

  // =======================
  // 커뮤니티 불러오기 (DB)
  const loadCommunity = async () => {
  try {
    const token = sessionStorage.getItem("cooking_assistant_auth_token");

    const res = await fetch("/api/community", {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    console.log("✅ 커뮤니티 응답 상태:", res.status);

    const data = await res.json();
    console.log("✅ 커뮤니티 데이터:", data);

    setReviews(data);
  } catch (err) {
    console.error("❌ 커뮤니티 불러오기 실패:", err);
  }
};


  // =======================
  // 댓글 불러오기
  const loadComments = async (reviewId: string) => {
    const token = sessionStorage.getItem("cooking_assistant_auth_token");

    const res = await fetch(
      `/api/community/${reviewId}/comments`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const data = await res.json();
    setComments((prev) => ({ ...prev, [reviewId]: data }));
  };

  // =======================
  // 🔄 댓글 폴링 (열려있는 댓글만 5초마다 갱신)
  // =======================
  useEffect(() => {
    // 1️⃣ 현재 열려 있는 리뷰 id들만 추출
    const openReviewIds = Object.entries(showComments)
      .filter(([_, isOpen]) => isOpen)
      .map(([reviewId]) => reviewId);

    // 댓글 열린 게 하나도 없으면 폴링 안 함
    if (openReviewIds.length === 0) return;

    const interval = setInterval(() => {
      openReviewIds.forEach((reviewId) => {
        loadComments(reviewId);
      });
    }, 5000); // ⏱ 5초마다

    // cleanup
    return () => clearInterval(interval);
  }, [showComments]);


  // =======================
  // 저장된 레시피 불러오기
  const loadSaved = async () => {
    const list = await getSavedRecipes();

    const ids = new Set<string>(
      list.map((r: { recipe_id: string }) => r.recipe_id)
    );

    setSavedRecipeIds(ids);
  };

  // =======================
// 시간 표시 (✅ KST/UTC 꼬임 방지)
// =======================
const parseApiDate = (value: string) => {
  if (!value) return new Date(NaN);

  // 1) 이미 ISO(Z/±hh:mm)면 그대로
  // 예: 2025-12-15T03:10:00.000Z / 2025-12-15T03:10:00+09:00
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }

  // 2) MySQL DATETIME 형태면 (타임존 없음) -> "UTC"로 간주해서 Z 붙임
  // 예: 2025-12-15 03:10:00  => 2025-12-15T03:10:00Z
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(value.replace(" ", "T") + "Z");
  }

  // 3) 그 외는 기본 파싱
  return new Date(value);
};

const getTimeAgo = (dateString: string) => {
  const now = Date.now();
  const past = parseApiDate(dateString).getTime();

  if (Number.isNaN(past)) return ""; // 혹시 이상하면 빈값

  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 30) return "방금 전";
  if (diffSec < 60) return `${diffSec}초 전`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "어제";
  if (diffDay < 7) return `${diffDay}일 전`;

  return parseApiDate(dateString).toLocaleDateString("ko-KR");
};


  // =======================
  // 댓글 토글
  const toggleComments = async (id: string) => {
    setShowComments((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!comments[id]) {
      await loadComments(id);
    }
  };

  // =======================
  // 댓글 추가
  const addComment = async (reviewId: string) => {
    const text = commentInput[reviewId];
    if (!text) return;

    const token = sessionStorage.getItem("cooking_assistant_auth_token");
    const currentUser = JSON.parse(
      sessionStorage.getItem("cooking_assistant_current_user") || "{}"
    );

    // ✅ 1. UI에 즉시 추가
    const tempComment: Comment = {
      id: "temp-" + Date.now(),
      review_id: reviewId,
      user_name: currentUser.name,
      user_initial: currentUser.name?.slice(0, 1) ?? "?",
      text,
      created_at: new Date().toISOString(),
    };

    setComments((prev) => ({
      ...prev,
      [reviewId]: [...(prev[reviewId] || []), tempComment],
    }));

    setCommentInput((prev) => ({ ...prev, [reviewId]: "" }));

    // ✅ 2. 서버 전송
    await fetch(`/api/community/${reviewId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        text,
        userName: currentUser.name,
        userInitial: currentUser.name?.slice(0, 1) ?? "?",
      }),
    });

    // ✅ 3. 서버 기준으로 다시 동기화 (id 보정)
    await loadComments(reviewId);

    // ✅ 댓글 수 +1 즉시 반영
    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId
          ? { ...r, comment_count: (r.comment_count ?? 0) + 1 }
          : r
      )
    );

  };


const handleDeleteComment = async (reviewId: string, commentId: string) => {
  if (!confirm("이 댓글을 삭제할까요?")) return;

  const token = sessionStorage.getItem("cooking_assistant_auth_token");

  try {
    await fetch(
      `/api/community/${reviewId}/comments/${commentId}`,
      {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    // ✅ 삭제 후 즉시 댓글 다시 불러오기
    await loadComments(reviewId);
  } catch (err) {
    console.error("❌ 댓글 삭제 실패:", err);
    alert("댓글 삭제에 실패했습니다.");
  }
  setReviews(prev =>
  prev.map(r =>
    r.id === reviewId
      ? { ...r, comment_count: Math.max((r.comment_count ?? 1) - 1, 0) }
      : r
  )
);
};



  // =======================
  // 레시피 저장


const handleSaveRecipe = async (review: CommunityReview) => {
  try {
    const alreadySaved = savedRecipeIds.has(review.recipe_id);

    // ✅ UI 북마크 수 즉시 반영
    setReviews((prev) =>
      prev.map((r) =>
        r.recipe_id === review.recipe_id
          ? {
              ...r,
              bookmark_count: alreadySaved
                ? (r.bookmark_count ?? 1) - 1
                : (r.bookmark_count ?? 0) + 1,
            }
          : r
      )
    );

    if (alreadySaved) {
      await removeSavedRecipe(review.recipe_id);
      } else {
    let imageFromRecipe: string | null = null;

    try {
      // ✅ completed_recipes에 있는 경우만 이미지 가져오기
      const recipeRes = await getCompletedRecipeById(review.recipe_id);

      imageFromRecipe =
        recipeRes?.recipe?.image ??
        recipeRes?.image ??
        null;
    } catch (err) {
      // ✅ 일반 레시피 / 완료 레시피 아닌 경우
      console.warn("⚠️ 완료 레시피 아님 → 이미지 없이 저장");
    }

    await saveRecipe({
      recipe_id: review.recipe_id,
      name: review.recipe_name,
      category: "기타",
      image: imageFromRecipe, // ✅ null 허용
      difficulty: null,
      cooking_time: null,
      description: review.review ?? null,
      ingredients: [],
      steps: [],
    });
  }

    await loadSaved();
    onRefreshSaved?.();
    window.dispatchEvent(new Event("savedRecipesUpdated"));
  } catch (err) {
    console.error("❌ 커뮤니티 저장 실패:", err);
    alert("저장 실패: 콘솔 확인");
  }
};






  // =======================
  // 랭킹 계산 (UI 유지)
  const calculateRankings = (): RecipeRanking[] => {
    const recipeMap = new Map<string, CommunityReview[]>();

    reviews.forEach((review) => {
      const existing = recipeMap.get(review.recipe_id) || [];
      recipeMap.set(review.recipe_id, [...existing, review]);
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
        recipeName: recipeReviews[0].recipe_name,
        reviewCount,
        averageRating,
        rank: 0,
      });
    });

    rankings.sort((a, b) => b.averageRating - a.averageRating);

    return rankings.map((r, i) => ({ ...r, rank: i + 1 }));
  };

  const filteredReviews = [...reviews].sort((a, b) => {
    // 🔹 인기순
    if (filter === "popular") {
      return (b.bookmark_count ?? 0) - (a.bookmark_count ?? 0);
    }

    // 🔹 전체: 최신순(created_at 내림차순)
    if (filter === "all") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    return 0;
  });



  const rankings = calculateRankings();

  const handleDeleteReview = async (reviewId: string) => {
  if (!confirm("정말 이 게시글을 삭제할까요?")) return;

  const token = sessionStorage.getItem("cooking_assistant_auth_token");

  try {
    const res = await fetch(
      `/api/community/${reviewId}`,
      {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!res.ok) throw new Error("삭제 실패");

    // ✅ UI 즉시 반영
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  } catch (err) {
    console.error("❌ 게시글 삭제 실패:", err);
    alert("삭제에 실패했습니다.");
  }
};


  // =======================
  // renderRankingView / renderReviewList
  // 👉 여기부터는 **네 UI 그대로 유지**
  // =======================

  const renderRankingView = () => {
    if (rankings.length === 0) {
      return (
        <Card className="border-0 shadow-sm rounded-3xl">
          <CardContent className="p-12 text-center">
            <Trophy className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <h3>아직 랭킹이 없습니다</h3>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {rankings.map((ranking) => (
          <Card key={ranking.recipeId} className="rounded-2xl shadow-sm">
            <CardContent className="p-5 flex justify-between">
              <div>
                <h3>{ranking.recipeName}</h3>
                <p className="text-sm text-muted-foreground">
                  리뷰 {ranking.reviewCount}개
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-accent text-accent" />
                {ranking.averageRating.toFixed(1)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderReviewList = () => {
    return (
      <div className="space-y-5">
        {filteredReviews.map((review) => {
          const reviewComments = comments[review.id] || [];
          const isCommentsOpen = showComments[review.id];
          const displayImage = review.image_url ?? review.recipe_image ?? null;

          return (
            <Card key={review.id} className="rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 pb-3">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {review.user_initial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{review.user_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getTimeAgo(review.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
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

                  <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full inline-block">
                    {review.recipe_name}
                  </div>

                  <p className="mt-3">{review.review}</p>
                </div>

                {displayImage && (
                  <HideOnErrorImage
  src={displayImage}
  alt="review"
  className="w-full h-72 object-cover"
/>

                )}


                <div className="p-5 border-t">
                  <div className="flex gap-5">
                    <button
                      onClick={() => toggleComments(review.id)}
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      <MessageCircle className="w-5 h-5" />
                      댓글 {review.comment_count ?? reviewComments.length}
                    </button>

                    <button
                      onClick={() => handleSaveRecipe(review)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-semibold transition-colors duration-200 ${
                        savedRecipeIds.has(review.recipe_id)
                          ? "text-green-700"  // ✅ 초록색 강조
                          : "text-gray-400 hover:text-green-700"
                      }`}
                    >
                      <Bookmark
                        className={`w-5 h-5 transition-all duration-200 ${
                          savedRecipeIds.has(review.recipe_id)
                            ? "stroke-green-700 fill-green-700"  // ✅ 아이콘도 초록
                            : "stroke-gray-400"
                        }`}
                    />
                      저장 {review.bookmark_count ?? 0}
                    </button>

                    {review.user_name ===
                      JSON.parse(
                        sessionStorage.getItem("cooking_assistant_current_user") || "{}"
                      )?.name && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="flex items-center gap-2 text-red-500"
                      >
                        ❌ 삭제
                      </button>
                    )}
                  </div>

                  {isCommentsOpen && (
                    <div className="mt-4 space-y-3">
                      {reviewComments.map((c) => (
                        <div key={c.id} className="flex gap-2 items-start">
                          <Avatar>
                            <AvatarFallback>{c.user_initial}</AvatarFallback>
                          </Avatar>

                          <div className="bg-muted p-3 rounded-xl flex-1 relative">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-sm">{c.user_name}</p>

                              {/* ✅ 댓글 삭제 버튼 (본인만 클릭 가능하게 하려면 추가 조건 가능) */}
                              {c.user_name === currentUser?.name && (
                                <button
                                  onClick={() => handleDeleteComment(review.id, c.id)}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  삭제
                                </button>
                              )}
                            </div>

                            <p className="text-xs whitespace-pre-wrap">{c.text}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={commentInput[review.id] || ""}
                          placeholder="댓글을 입력하세요..."
                          onChange={(e) =>
                            setCommentInput((prev) => ({
                              ...prev,
                              [review.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();          // 폼 submit / 줄바꿈 방지
                              addComment(review.id);       // ✅ Enter로 등록
                            }
                          }}
                          className="
                            border border-border 
                            bg-muted/40 
                            focus:bg-background
                            focus:ring-2 focus:ring-primary
                            focus:border-primary
                            rounded-xl
                            shadow-sm
                          "
                        />
                        <Button onClick={() => addComment(review.id)}>
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

  // =======================
  // JSX
  return (
    <div className="min-h-screen bg-background pt-16 pb-24">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-8 flex items-start gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">쿠킹 커뮤니티</h2>
            <p className="text-sm text-muted-foreground mt-1">
              요리 후기와 꿀팁을 공유하고, 다른 사람의 레시피도 구경해보세요!
            </p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              ※ 후기를 작성하려면 직접 요리를 완료해야 해요.<br />
              AI 요리 보조를 통해 요리를 완료하면 글쓰기 기능이 열립니다.
            </p>
          </div>
        </div>

        {/* 필터 버튼 */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setFilter("all")}
            className={
              filter === "all"
                ? "bg-primary text-white"
                : "bg-muted text-foreground"
            }
          >
            전체
          </Button>

          <Button
            onClick={() => setFilter("popular")}
            className={
              filter === "popular"
                ? "bg-primary text-white"
                : "bg-muted text-foreground"
            }
          >
            인기순
          </Button>
        </div>


        {filter === "ranking" ? renderRankingView() : renderReviewList()}
      </div>
    </div>
  );
}
