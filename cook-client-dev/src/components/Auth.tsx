import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ChefHat, Mail, Lock, User } from "lucide-react";
import { signUp, login, setAuthToken, sendVerification } from "../utils/api";

interface AuthProps {
  onAuthSuccess: (userName: string) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  /* ---------- 로그인 ---------- */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  /* ---------- 회원가입 ---------- */
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const [signupEmailVerified, setSignupEmailVerified] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ✅ email-verified 페이지에서 돌아왔을 때 */
  useEffect(() => {
    const from = localStorage.getItem("verified_from");
    const email = localStorage.getItem("verified_email");

    if (from === "signup" && email) {
      setActiveTab("signup");
      setSignupEmail(email);
      setSignupEmailVerified(true);
      localStorage.removeItem("verified_from");
    }
  }, []);

  /* ---------- 로그인 ---------- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginEmail || !loginPassword) {
      setError("모든 필드를 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const response = await login(loginEmail, loginPassword);

      if (!response?.user) {
        setError("로그인에 실패했습니다");
        return;
      }

      if (response.token) setAuthToken(response.token);

      const userName = response.user.name || loginEmail.split("@")[0];
      sessionStorage.setItem(
        "cooking_assistant_current_user",
        JSON.stringify({
          id: response.user.id,
          email: loginEmail,
          name: userName,
        })
      );

      onAuthSuccess(userName);
    } catch {
      setError("로그인 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- 회원가입 ---------- */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !signupName ||
      !signupEmail ||
      !signupPassword ||
      !signupConfirmPassword
    ) {
      setError("모든 필드를 입력해주세요");
      return;
    }

    if (signupPassword.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    if (!signupEmailVerified) {
      setError("이메일 인증이 필요합니다.\n이메일 옆 '인증하기'를 눌러주세요.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(
        signupEmail,
        signupPassword,
        signupName
      );

      if (result?.error) {
        setError(result.error);
        return;
      }

      const response = await login(signupEmail, signupPassword);
      if (response.token) setAuthToken(response.token);

      sessionStorage.setItem(
        "cooking_assistant_current_user",
        JSON.stringify({
          id: response.user.id,
          email: signupEmail,
          name: signupName,
        })
      );

      onAuthSuccess(signupName);
    } catch {
      setError("회원가입 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          {/* 🔥 로고 (원래 있던 그거) */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto relative"
            style={{
              background:
                "linear-gradient(135deg, #465940 0%, #5a6b4e 50%, #6a7d5e 100%)",
              boxShadow:
                "0 8px 20px rgba(70, 89, 64, 0.35), inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.15)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-2xl" />
            <ChefHat
              className="w-10 h-10 text-white relative z-10"
              style={{
                filter:
                  "drop-shadow(0 2px 4px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
              }}
            />
          </div>

          <CardTitle className="text-2xl font-bold">쿠킹 메이트</CardTitle>
          <CardDescription>
            AI가 도와주는 맞춤형 요리 가이드
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v: "login" | "signup") => setActiveTab(v)}>
            <TabsList className="flex w-fit mx-auto mb-6">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            {/* 로그인 */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="이메일"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="비밀번호"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 whitespace-pre-line">
                    {error}
                  </p>
                )}

                <Button className="w-full" disabled={loading}>
                  로그인
                </Button>
              </form>
            </TabsContent>

            {/* 회원가입 */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="이메일"
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        setSignupEmailVerified(false);
                        localStorage.removeItem("verified_email");
                      }}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={sendingVerify || !signupEmail}
                    onClick={async () => {
                      try {
                        setSendingVerify(true);
                        await sendVerification(signupEmail);
                        setError(
                          "인증 메일을 보냈습니다.\n메일에서 인증 후 돌아오세요."
                        );
                      } finally {
                        setSendingVerify(false);
                      }
                    }}
                  >
                    인증하기
                  </Button>
                </div>

                



                {signupEmailVerified && (
                  <p className="text-sm text-green-600">✅ 인증되었습니다</p>
                )}

                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="이름"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="비밀번호"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    className="pl-10"
                    placeholder="비밀번호 확인"
                    value={signupConfirmPassword}
                    onChange={(e) =>
                      setSignupConfirmPassword(e.target.value)
                    }
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 whitespace-pre-line">
                    {error}
                  </p>
                )}

                <Button className="w-full" disabled={loading}>
                  회원가입
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}