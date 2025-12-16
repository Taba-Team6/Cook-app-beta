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
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle>이메일 인증 완료 🎉</CardTitle>
            <CardDescription>
              이제 로그인하실 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={onGoLogin}>
              로그인 하러가기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
