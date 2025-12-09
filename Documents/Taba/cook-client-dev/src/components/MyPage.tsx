import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Settings,
  ChefHat,
  Bookmark,
  UserCog,
  Sparkles,
} from "lucide-react";

interface MyPageProps {
  userName?: string;
  onProfileEdit: () => void;
  onAccountSettings?: () => void;
  onSavedRecipes?: () => void;
  onCompletedRecipes?: () => void;
  completedRecipesCount?: number;
  savedRecipesCount?: number;
}

export function MyPage({
  userName = "사용자",
  onProfileEdit,
  onAccountSettings,
  onSavedRecipes,
  onCompletedRecipes,
  completedRecipesCount = 0,
  savedRecipesCount = 0,
}: MyPageProps) {
  const stats = [
    {
      label: "완료한 요리",
      value: completedRecipesCount,
      icon: <ChefHat className="w-6 h-6 text-primary" />,
      onClick: onCompletedRecipes,
    },
    {
      label: "저장",
      value: savedRecipesCount,
      icon: <Bookmark className="w-6 h-6 text-primary" />,
      onClick: onSavedRecipes,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 pt-16">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">마이페이지</h1>
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* ✅ 프로필 카드 (요리 초보자 멘트 제거됨) */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{userName}</h2>
                {/* ❌ 요리 초보자 텍스트 삭제 */}
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={onAccountSettings}>
                <UserCog className="w-4 h-4 mr-2" />
                개인정보
              </Button>

              <Button onClick={onProfileEdit}>
                <Settings className="w-4 h-4 mr-2" />
                프로필 수정
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ✅ 나의 활동 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">나의 활동</h2>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, i) => (
              <Card
                key={i}
                className="cursor-pointer hover:border-primary/40 transition-all"
                onClick={stat.onClick}
              >
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    {stat.icon}
                  </div>

                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ❌ 레벨 시스템 카드 완전 삭제 */}
      </div>
    </div>
  );
}
