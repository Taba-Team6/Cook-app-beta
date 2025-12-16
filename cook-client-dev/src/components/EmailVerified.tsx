import { useEffect } from "react"; // ✅ (1) 맨 위 import에 추가
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";

export function EmailVerified({
  onGoLogin,
}: {
  onGoLogin: () => void;
}) {

  // ✅ (2) return 바로 위에 추가 (여기가 정확한 위치)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (email) {
      localStorage.setItem("verified_email", email);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle>이메일 인증 완료 🎉</CardTitle>
            <CardDescription>이제 로그인하실 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
                className="w-full"
                onClick={() => {
                    localStorage.setItem("verified_from", "signup");
                    onGoLogin();
                }}
                >
                회원가입 계속하기
                </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
