import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { 
  User, 
  Settings, 
  ChefHat, 
  Heart, 
  Bookmark, 
  TrendingUp,
  Bell,
  Shield,
  HelpCircle,
  UserCog
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
  savedRecipesCount = 0
}: MyPageProps) {
  const stats = [
    { label: "완료한 요리", value: completedRecipesCount, icon: <ChefHat className="w-5 h-5" />, onClick: onCompletedRecipes },
    { label: "저장", value: savedRecipesCount, icon: <Bookmark className="w-5 h-5" />, onClick: onSavedRecipes },
  ];

  return (
    <div className="min-h-screen bg-background pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 프로필 섹션 */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h2 className="mb-1">{userName}</h2>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <Button onClick={onAccountSettings} variant="outline" className="w-full md:w-40">
                  <UserCog className="w-4 h-4 mr-2" />
                  개인정보 설정
                </Button>
                <Button onClick={onProfileEdit} className="w-full md:w-40">
                  <Settings className="w-4 h-4 mr-2" />
                  프로필 수정
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card 
              key={stat.label}
              className={stat.onClick ? "cursor-pointer hover:border-primary/40 transition-all" : ""}
              onClick={stat.onClick}
            >
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
                  {stat.icon}
                </div>
                <p className="text-2xl mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}