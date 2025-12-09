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

  // === 스크롤 기능(첫 번째 코드의 기능 유지) ===
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // 스크롤 다운 → 숨기기
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true); // 스크롤 업 → 보이기
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{
        background:
          "linear-gradient(180deg, #FDFBF0 0%, #FDFBF0 85%, rgba(253, 251, 240, 0.9) 100%)",
        boxShadow:
          "0 4px 12px rgba(70, 89, 64, 0.08), 0 8px 24px rgba(70, 89, 64, 0.05)",
        borderBottom: "1px solid rgba(70, 89, 64, 0.1)",
      }}
    >
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        {/* === 왼쪽 영역: 뒤로가기 or 로고 === */}
        <div className="flex items-center gap-3">
          {showBackButton && onBackClick ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackClick}
              className="hover:bg-primary/10 transition-colors rounded-xl"
              style={{
                boxShadow: "0 2px 4px rgba(70, 89, 64, 0.1)",
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <button
              onClick={onLogoClick}
              className="flex items-center gap-2.5 hover:opacity-80 transition-all relative px-3 py-2 rounded-xl"
              style={{
                boxShadow: "0 2px 6px rgba(70, 89, 64, 0.1)",
              }}
            >
              {/* 3D 느낌 로고 (두 번째 코드 스타일 적용) */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center relative"
                style={{
                  background:
                    "linear-gradient(135deg, #465940 0%, #5a6b4e 50%, #6a7d5e 100%)",
                  boxShadow:
                    "0 3px 8px rgba(70, 89, 64, 0.35), inset 0 1px 3px rgba(255, 255, 255, 0.25), inset 0 -1px 3px rgba(0,0,0,0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl" />
                <ChefHat
                  className="w-6 h-6 text-white relative z-10"
                  style={{
                    filter:
                      "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25))",
                  }}
                />
              </div>

              {/* 로고 텍스트 */}
              <div className="flex flex-col items-start">
                <span
                  className="leading-tight"
                  style={{
                    background: "linear-gradient(135deg, #465940 0%, #5a6b4e 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  쿠킹 어시스턴트
                </span>
                <span
                  className="text-xs leading-tight hidden sm:block"
                  style={{ color: "#7A8D6E", fontWeight: 500 }}
                >
                  AI 요리 비서
                </span>
              </div>
            </button>
          )}
        </div>

        {/* === 오른쪽 영역: 다크모드 / 로그인 / 메뉴 === */}
        <div className="flex items-center gap-2">
          {onToggleDarkMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDarkMode}
              className="rounded-xl hover:bg-muted"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-xl hover:bg-muted"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground rounded-xl">
                      {userName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
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
            <Button
              variant="outline"
              onClick={onProfileClick}
              className="rounded-xl"
            >
              <User className="w-4 h-4 mr-2" />
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
