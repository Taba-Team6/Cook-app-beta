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
  difficulty: string;
  cookingTime: string;
  image: string;
  description: string;
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // 리뷰 데이터 준비
    const currentUser = localStorage.getItem("cooking_assistant_current_user");
    const user = currentUser ? JSON.parse(currentUser) : { name: "익명 사용자", id: "anonymous" };
    
    const newReview = {
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      rating,
      review,
      image: uploadedImage,
      userName: user.name,
      userInitial: user.name.charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    // 기존 리뷰 가져오기
    const savedReviews = localStorage.getItem("cooking_assistant_reviews");
    const reviews = savedReviews ? JSON.parse(savedReviews) : [];
    
    // 새 리뷰 추가
    reviews.unshift(newReview); // 최신 리뷰를 맨 앞에 추가
    
    // localStorage에 저장
    localStorage.setItem("cooking_assistant_reviews", JSON.stringify(reviews));
    
    console.log({
      recipeId: recipe.id,
      rating,
      review,
      image: uploadedImage
    });
    onSubmit();
  };

  const canSubmit = rating > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white pt-20 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 축하 메시지 */}
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
              ease: "easeInOut"
            }}
          >
            <PartyPopper className="w-20 h-20 mx-auto mb-4 text-[#E07A5F]" />
          </motion.div>
          <h1 className="mb-2">축하합니다!</h1>
          <p className="text-muted-foreground">
            {recipe.name}을(를) 성공적으로 완성하셨습니다!
          </p>
        </motion.div>

        {/* 리뷰 작성 카드 */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="mb-2">요리는 어떠셨나요?</h2>
              <p className="text-sm text-muted-foreground">
                경험을 공유해주시면 다른 분들께 큰 도움이 됩니다
              </p>
            </div>

            {/* 별점 */}
            <div>
              <label className="block mb-3">별점을 남겨주세요 *</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= (hoveredRating || rating)
                          ? "fill-[#F2CC8F] text-[#F2CC8F]"
                          : "text-gray-300"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center mt-2 text-sm text-muted-foreground">
                  {rating === 1 && "아쉬워요"}
                  {rating === 2 && "별로예요"}
                  {rating === 3 && "괜찮아요"}
                  {rating === 4 && "좋아요"}
                  {rating === 5 && "최고예요!"}
                </p>
              )}
            </div>

            {/* 리뷰 작성 */}
            <div>
              <label className="block mb-2">후기를 남겨주세요 (선택)</label>
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

            {/* 사진 업로드 */}
            <div>
              <label className="block mb-2">완성 사진 (선택)</label>
              <div className="space-y-3">
                {uploadedImage ? (
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
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
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#A5B68D] transition-colors bg-gray-50 hover:bg-gray-100">
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
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-[#A5B68D] hover:bg-[#8fa072]"
          >
            <Send className="w-5 h-5 mr-2" />
            후기 등록하기
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onSkip}
            className="w-full"
          >
            <Home className="w-5 h-5 mr-2" />
            다음에 작성하고 홈으로
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          * 별점은 필수입니다. 후기와 사진은 선택사항입니다.
        </p>
      </div>
    </div>
  );
}