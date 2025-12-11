import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Star, Upload, Home, Send, PartyPopper } from "lucide-react";
import { motion } from "motion/react";

interface Recipe {
  id: string;
  name: string;
  category: string;
  difficulty?: string | null;
  cookingTime?: number | string | null;
  image?: string | null;
  description?: string | null;
}

interface RecipeReviewProps {
  recipe: Recipe;
  onSubmit: () => void;
  onSkip: () => void;
}

export function RecipeReview({ recipe, onSubmit, onSkip }: RecipeReviewProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ✅ DB로 실제 저장
  const handleSubmit = async () => {
    if (rating === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const currentUser = sessionStorage.getItem(
        "cooking_assistant_current_user"
      );
      const user = currentUser ? JSON.parse(currentUser) : { name: "익명" };

      const token = sessionStorage.getItem(
        "cooking_assistant_auth_token"
      );

      const res = await fetch("http://localhost:3001/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipeId: recipe.id,
          recipeName: recipe.name,
          rating,
          review: review.trim() === "" ? "맛있게 먹었습니다!" : review,
          imageUrl: uploadedImage ?? recipe.image ?? null,
          userName: user.name,
          userInitial: user.name[0],
        }),
      });

      if (!res.ok) throw new Error("커뮤니티 저장 실패");

      onSubmit(); // ✅ 홈으로 이동
    } catch (err) {
      console.error("❌ 리뷰 저장 실패:", err);
      alert("리뷰 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = rating > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white pt-20 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* 🎉 예전 축하 영역 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 1,
              ease: "easeInOut",
            }}
          >
            <PartyPopper className="w-20 h-20 mx-auto mb-4 text-[#E07A5F]" />
          </motion.div>
          <h1 className="mb-2">축하합니다!</h1>
          <p className="text-muted-foreground">
            {recipe.name}을(를) 성공적으로 완성하셨습니다!
          </p>
        </motion.div>

        {/* ✅ 예전 카드 스타일 유지 */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-6">

            {/* ⭐ 별점 */}
            <div>
              <label className="block mb-3">별점을 남겨주세요 *</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= (hoveredRating || rating)
                          ? "fill-[#F2CC8F] text-[#F2CC8F]"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* ✍️ 후기 입력 */}
            <div>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="요리 과정이나 맛에 대한 솔직한 후기를 남겨주세요..."
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {review.length}/500
              </p>
            </div>

            {/* 📸 사진 업로드 */}
            <div>
              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2"
                  >
                    삭제
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer">
                  <Upload className="w-10 h-10 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">클릭하여 사진 업로드</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

          </CardContent>
        </Card>

        {/* ✅ 예전 2버튼 구조 그대로 */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
          >
            <Send className="w-5 h-5 mr-2" />
            후기 등록하기
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onSkip}
          >
            <Home className="w-5 h-5 mr-2" />
            다음에 작성하고 홈으로
          </Button>
        </div>

      </div>
    </div>
  );
}
