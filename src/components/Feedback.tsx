import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Star, ThumbsUp, Home } from "lucide-react";
import type { Recipe } from "./RecipeRecommendation";

interface FeedbackProps {
  recipe: Recipe;
  onComplete: () => void;
}

export function Feedback({ recipe, onComplete }: FeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [timeRating, setTimeRating] = useState([3]);
  const [difficultyRating, setDifficultyRating] = useState([3]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const feedbackTags = [
    "맛있었어요",
    "쉬웠어요",
    "어려웠어요",
    "시간이 오래 걸렸어요",
    "빠르게 완성했어요",
    "재료가 부족했어요",
    "다시 만들고 싶어요",
    "가족이 좋아했어요",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag]
    );
  };

  const handleSubmit = () => {
    // In a real app, this would send feedback to the backend
    console.log({
      recipe: recipe.id,
      rating,
      timeRating: timeRating[0],
      difficultyRating: difficultyRating[0],
      tags: selectedTags,
      comment,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="pt-12 pb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ThumbsUp className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="mb-4">피드백 감사합니다!</h2>
            <p className="text-muted-foreground mb-8">
              소중한 의견을 바탕으로 더 나은 레시피를 추천해드리겠습니다.
              <br />
              계속해서 맛있는 요리를 즐겨보세요!
            </p>
            <Button onClick={onComplete} size="lg">
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1>요리 피드백</h1>
          <p className="text-muted-foreground mt-2">
            {recipe.name} 요리는 어떠셨나요? 피드백을 남겨주세요
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>전체 만족도</CardTitle>
            <CardDescription>별을 클릭하여 평가해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-center py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-muted-foreground">
                {rating === 5
                  ? "최고예요! 🎉"
                  : rating === 4
                  ? "좋아요! 😊"
                  : rating === 3
                  ? "괜찮아요"
                  : rating === 2
                  ? "아쉬워요"
                  : "개선이 필요해요"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>상세 평가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>조리 시간</Label>
                <span className="text-sm text-muted-foreground">
                  {timeRating[0] === 1
                    ? "너무 길었어요"
                    : timeRating[0] === 2
                    ? "조금 길었어요"
                    : timeRating[0] === 3
                    ? "적당했어요"
                    : timeRating[0] === 4
                    ? "빨랐어요"
                    : "매우 빨랐어요"}
                </span>
              </div>
              <Slider
                value={timeRating}
                onValueChange={setTimeRating}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>난이도</Label>
                <span className="text-sm text-muted-foreground">
                  {difficultyRating[0] === 1
                    ? "매우 쉬웠어요"
                    : difficultyRating[0] === 2
                    ? "쉬웠어요"
                    : difficultyRating[0] === 3
                    ? "적당했어요"
                    : difficultyRating[0] === 4
                    ? "어려웠어요"
                    : "매우 어려웠어요"}
                </span>
              </div>
              <Slider
                value={difficultyRating}
                onValueChange={setDifficultyRating}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>요리 경험</CardTitle>
            <CardDescription>해당하는 항목을 모두 선택해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {feedbackTags.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  />
                  <Label htmlFor={tag} className="cursor-pointer">
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>추가 의견</CardTitle>
            <CardDescription>더 나은 레시피를 위한 의견을 자유롭게 남겨주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="예: 소스가 너무 짰어요, 양념을 줄이면 좋을 것 같아요"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-32"
            />
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={rating === 0}
          size="lg"
          className="w-full"
        >
          피드백 제출하기
        </Button>

        {rating === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            * 별점을 선택해주세요
          </p>
        )}
      </div>
    </div>
  );
}
