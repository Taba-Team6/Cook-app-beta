import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChefHat, User, Settings, LogOut, Moon, Sun, ArrowLeft } from "lucide-react";

interface TopNavBarProps {
  isAuthenticated: boolean;
  userName?: string;
  onLogout: () => void;
  onProfileClick: () => void;
  onLogoClick: () => void;
  onSearch?: (query: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function TopNavBar({
  isAuthenticated,
  userName,
  onLogout,
  onProfileClick,
  onLogoClick,
  onSearch,
  isDarkMode,
  onToggleDarkMode,
  showBackButton = false,
  onBackClick,
}: TopNavBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // 스크롤 다운
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // 스크롤 업
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* 1행: 브랜드 & 계정 */}
      <div className="h-16 px-4 flex items-center justify-between">
        {/* 왼쪽: 뒤로가기 버튼 또는 로고 */}
        <div className="flex items-center gap-2">
          {showBackButton && onBackClick ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackClick}
              className="rounded-full"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : null}
          
          {/* 로고 */}
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="hidden sm:block">쿠킹 어시스턴트</span>
          </button>
        </div>

        {/* 우측: 로그인 상태 */}
        <div className="flex items-center gap-2">
          {/* 다크모드 토글 */}
          {onToggleDarkMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDarkMode}
              className="rounded-full"
              aria-label="다크모드 토글"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm">{userName}</p>
                    <p className="text-xs text-muted-foreground">쿠킹 어시스턴트</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onProfileClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>프로필 설정</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={onProfileClick}>
              <User className="w-4 h-4 mr-2" />
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}