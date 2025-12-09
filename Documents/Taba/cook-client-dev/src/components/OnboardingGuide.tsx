import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface OnboardingGuideProps {
  onFinish: () => void; // 온보딩 종료 시 호출
}

interface Slide {
  id: number;
  title: string;
  description: string;
  image?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "나만의 요리 도우미",
    description: "취향과 재료 기반으로 맞춤 레시피를 추천해드려요.",
    image: "/onboarding/test.png", // ✅ 이런 식으로
  },
  {
    id: 2,
    title: "냉장고 속 재료 관리",
    description: "현재 보유 재료를 등록하고 자동으로 요리 추천을 받아보세요.",
    //image: "/onboarding/step1.png", // ✅ 이런 식으로
  },
  {
    id: 3,
    title: "실시간 AI 음성 가이드",
    description: "요리 중에도 음성으로 단계별 실시간 안내를 받을 수 있어요.",
    //image: "/onboarding/step1.png", // ✅ 이런 식으로
  },
  {
    id: 4,
    title: "레시피 저장 · 완료 기록",
    description: "마음에 드는 레시피를 저장하거나, 요리를 완료하면 기록돼요.",
    //image: "/onboarding/step1.png", // ✅ 이런 식으로
  },
  {
    id: 5,
    title: "쿠킹 커뮤니티",
    description: "다른 사용자들의 레시피와 노하우를 공유해보세요.",
    //image: "/onboarding/step1.png", // ✅ 이런 식으로
  },
];

export function OnboardingGuide({ onFinish }: OnboardingGuideProps) {
  const [current, setCurrent] = useState(0);
  const isLast = current === slides.length - 1; // ⭐ 마지막 슬라이드 여부

  const next = () => {
    if (current < slides.length - 1) setCurrent((c) => c + 1);
    else onFinish();
  };

  const prev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const skip = () => {
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40">
      {/* 전체 화면을 감싸는 래퍼 */}
      <div className="relative w-full h-full">
        {/* 상단 건너뛰기 버튼 */}
        <div className="absolute top-4 right-4 z-[10000]">
          <button
            onClick={skip}
            className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-md"
          >
            건너뛰기
          </button>
        </div>

        {/* 실제 온보딩 이미지 자리 (전체 화면 꽉 차게) */}
        <div className="w-full h-full">
            {slides[current].image ? (
                <img
                src={slides[current].image}
                alt={slides[current].title}
                className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full bg-black/70 flex items-center justify-center text-sm text-white/80">
                이미지 들어갈 자리 (풀스크린)
                </div>
            )}
        </div>



        {/* 하단 텍스트 + 컨트롤 */}
        <div className="absolute inset-x-0 bottom-0">
        <div className="w-full bg-white/95 backdrop-blur-sm rounded-t-3xl px-6 pt-5 pb-8 text-black shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
            {/* 제목/설명 */}
            <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">
                {slides[current].title}
            </h2>
            <p className="text-xs text-muted-foreground">
                {slides[current].description}
            </p>
            </div>

            {/* 컨트롤 영역 */}
            {!isLast ? (
              // 👉 마지막 슬라이드가 아닐 때: 이전 / 점 / 다음
              <div className="mt-5 flex items-center justify-between text-xs">
                {/* ⭐ 왼쪽: 이전 버튼 (첫 슬라이드에서는 투명하게 처리해서 자리만 유지) */}
                {current > 0 ? (
                  <button
                    onClick={prev}
                    className="px-1 py-2 text-black font-semibold flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>이전</span>
                  </button>
                ) : (
                  <div className="px-1 py-2 opacity-0 flex items-center gap-1">
                    <ChevronLeft className="w-3 h-3" />
                    <span>이전</span>
                  </div>
                )}

                {/* 가운데: 페이지 인디케이터 */}
                <div className="flex items-center gap-2">
                  {slides.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all ${
                        i === current
                          ? "bg-black w-4 h-2"
                          : "bg-black/30 w-2 h-2"
                      }`}
                    />
                  ))}
                </div>

                {/* 오른쪽: 다음 버튼 */}
                <button
                    onClick={next}
                    className="px-1 py-2 text-black font-semibold flex items-center gap-1"
                    >
                    <span>다음</span>
                    <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              // 👉 마지막 슬라이드: 점 + 큰 "시작하기" 버튼
              <div className="mt-5 space-y-4">
                <div className="flex justify-center gap-2">
                  {slides.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all ${
                        i === current
                          ? "bg-black w-4 h-2"
                          : "bg-black/30 w-2 h-2"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={onFinish}
                  className="w-full py-3 rounded-full text-base font-semibold"
                >
                  시작하기
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
