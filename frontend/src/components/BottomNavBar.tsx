import { Home, FileText, Bot, Package, User } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface BottomNavBarProps {
  activeTab: string;
  onHomeClick: () => void;
  onRecipeClick: () => void;
  onAIClick: () => void;
  onIngredientsClick: () => void;
  onMyPageClick: () => void;
}

export function BottomNavBar({
  activeTab,
  onHomeClick,
  onRecipeClick,
  onAIClick,
  onIngredientsClick,
  onMyPageClick,
}: BottomNavBarProps) {
  const navItems: NavItem[] = [
    {
      id: "home",
      label: "홈",
      icon: <Home className="w-6 h-6" />,
      onClick: onHomeClick,
    },
    {
      id: "recipe",
      label: "레시피",
      icon: <FileText className="w-6 h-6" />,
      onClick: onRecipeClick,
    },
    {
      id: "ai",
      label: "AI",
      icon: <Bot className="w-6 h-6" />,
      onClick: onAIClick,
    },
    {
      id: "ingredients",
      label: "식재료",
      icon: <Package className="w-6 h-6" />,
      onClick: onIngredientsClick,
    },
    {
      id: "mypage",
      label: "MY",
      icon: <User className="w-6 h-6" />,
      onClick: onMyPageClick,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="h-14 px-2 flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[48px] min-h-[48px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <div className={`transition-transform ${isActive ? "scale-110" : ""}`}>
                {item.icon}
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}