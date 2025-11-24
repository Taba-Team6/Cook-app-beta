import { useState, useEffect } from "react";
import { AlertCircle, X, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getExpiryNotifications } from "../utils/api";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  expiry_date: string;
  quantity: string;
  unit: string;
}

interface ExpiryNotificationsProps {
  onClose?: () => void;
}

export function ExpiryNotifications({ onClose }: ExpiryNotificationsProps) {
  const [notifications, setNotifications] = useState<{
    today: Ingredient[];
    one_day: Ingredient[];
    three_days: Ingredient[];
  }>({
    today: [],
    one_day: [],
    three_days: []
  });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    loadNotifications();
    
    // 1분마다 자동 새로고침
    const interval = setInterval(loadNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await getExpiryNotifications();
      setNotifications(response.notifications);
    } catch (error) {
      console.error("Failed to load expiry notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed([...dismissed, id]);
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diff = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return null;
  }

  // 해제되지 않은 알림만 필터링
  const activeToday = notifications.today.filter(i => !dismissed.includes(i.id));
  const activeOneDay = notifications.one_day.filter(i => !dismissed.includes(i.id));
  const activeThreeDays = notifications.three_days.filter(i => !dismissed.includes(i.id));

  if (activeToday.length === 0 && activeOneDay.length === 0 && activeThreeDays.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
      {/* 오늘 만료 (긴급) */}
      {activeToday.map((ingredient) => (
        <Alert key={ingredient.id} variant="destructive" className="pr-12 border-2 shadow-lg">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="flex items-center gap-2">
            <span className="font-bold">긴급!</span>
            <Badge variant="destructive">오늘 만료</Badge>
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-1">
              <p className="font-medium">{ingredient.name}</p>
              <p className="text-sm opacity-90">
                {ingredient.quantity} {ingredient.unit}
              </p>
              <p className="text-xs opacity-75">
                카테고리: {ingredient.category}
              </p>
            </div>
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => handleDismiss(ingredient.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}

      {/* 1일 이내 만료 */}
      {activeOneDay
        .filter(i => getDaysUntilExpiry(i.expiry_date) > 0) // 오늘 제외
        .map((ingredient) => (
        <Alert key={ingredient.id} className="pr-12 border-orange-500 bg-orange-50 border-2 shadow-lg">
          <Clock className="h-5 w-5 text-orange-600" />
          <AlertTitle className="flex items-center gap-2 text-orange-900">
            <span className="font-bold">주의!</span>
            <Badge className="bg-orange-600">1일 이내 만료</Badge>
          </AlertTitle>
          <AlertDescription className="mt-2 text-orange-900">
            <div className="space-y-1">
              <p className="font-medium">{ingredient.name}</p>
              <p className="text-sm opacity-90">
                {ingredient.quantity} {ingredient.unit}
              </p>
              <p className="text-xs opacity-75">
                만료일: {new Date(ingredient.expiry_date).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-orange-900"
            onClick={() => handleDismiss(ingredient.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}

      {/* 3일 이내 만료 */}
      {activeThreeDays
        .filter(i => {
          const days = getDaysUntilExpiry(i.expiry_date);
          return days > 1 && days <= 3;
        })
        .slice(0, 2) // 최대 2개만 표시
        .map((ingredient) => (
        <Alert key={ingredient.id} className="pr-12 border-yellow-500 bg-yellow-50 border-2 shadow-lg">
          <Clock className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="flex items-center gap-2 text-yellow-900">
            <span className="font-bold">알림</span>
            <Badge className="bg-yellow-600">
              {getDaysUntilExpiry(ingredient.expiry_date)}일 후 만료
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-2 text-yellow-900">
            <div className="space-y-1">
              <p className="font-medium">{ingredient.name}</p>
              <p className="text-sm opacity-90">
                {ingredient.quantity} {ingredient.unit}
              </p>
              <p className="text-xs opacity-75">
                만료일: {new Date(ingredient.expiry_date).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-yellow-900"
            onClick={() => handleDismiss(ingredient.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}

      {/* 전체 닫기 버튼 (많은 알림이 있을 때) */}
      {(activeToday.length + activeOneDay.length + activeThreeDays.length) > 3 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onClose}
        >
          모든 알림 닫기
        </Button>
      )}
    </div>
  );
}
