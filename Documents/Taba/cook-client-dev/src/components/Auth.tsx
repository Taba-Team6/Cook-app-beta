import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ChefHat, Mail, Lock, User } from "lucide-react";
import { signUp, login, setAuthToken } from "../utils/api";

interface AuthProps {
  onAuthSuccess: (userName: string) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- 로그인 ---------------- */
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

      if (!response || !response.user) {
        setError("로그인에 실패했습니다");
        setLoading(false);
        return;
      }

      if (response.token) setAuthToken(response.token);
      localStorage.removeItem("cooking_assistant_saved_recipes");

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
      setLoading(false);
    } catch (err: any) {
      console.error("Login error:", err);
      setError("로그인 중 오류가 발생했습니다");
      setLoading(false);
    }
  };

  /* ---------------- 회원가입 ---------------- */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
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

    setLoading(true);

    try {
      const result = await signUp(signupEmail, signupPassword, signupName);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const response = await login(signupEmail, signupPassword);

      if (!response || !response.user) {
        setError("회원가입은 완료되었으나 로그인에 실패했습니다.");
        setActiveTab("login");
        setLoading(false);
        return;
      }

      if (response.token) setAuthToken(response.token);
      localStorage.removeItem("cooking_assistant_saved_recipes");

      sessionStorage.setItem(
        "cooking_assistant_current_user",
        JSON.stringify({
          id: response.user.id,
          email: signupEmail,
          name: signupName,
        })
      );

      onAuthSuccess(signupName);
      setLoading(false);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "회원가입 중 오류가 발생했습니다");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full">
        
        {/* Header — 두 번째 스타일 적용 유지 */}
        <div className="text-center mb-8">
          <div 
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 relative"
            style={{
              background: "linear-gradient(135deg, #465940 0%, #5a6b4e 50%, #6a7d5e 100%)",
              boxShadow:
                "0 8px 20px rgba(70, 89, 64, 0.35), inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-3xl" />
            <ChefHat
              className="w-12 h-12 text-white relative z-10"
              style={{
                filter:
                  "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25))",
              }}
            />
          </div>

          <h1
            className="mb-2"
            style={{
              background: "linear-gradient(135deg, #465940 0%, #5a6b4e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "1.875rem",
              fontWeight: "700",
            }}
          >
            쿠킹 어시스턴트
          </h1>

          <p className="text-muted-foreground">AI가 도와주는 맞춤형 요리 가이드</p>
        </div>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={(v: "login" | "signup") => setActiveTab(v)}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</TabsTrigger>
          </TabsList>

          {/* ---------------- 로그인 폼 ---------------- */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>로그인</CardTitle>
                <CardDescription>계정에 로그인하여 맞춤 레시피를 확인하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  
                  {/* 이메일 */}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* 비밀번호 */}
                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* 오류 메시지 */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm rounded-lg whitespace-pre-line">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "로그인 중..." : "로그인"}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    계정이 없으신가요?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signup")}
                      className="text-primary hover:underline"
                    >
                      회원가입
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- 회원가입 폼 ---------------- */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>회원가입</CardTitle>
                <CardDescription>
                  새 계정을 만들어 요리 여정을 시작하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">

                  {/* 이름 */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">이름</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="홍길동"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* 이메일 */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* 비밀번호 */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">최소 6자 이상</p>
                  </div>

                  {/* 비밀번호 확인 */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">비밀번호 확인</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* 오류 */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm rounded-lg whitespace-pre-line">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "가입 중..." : "회원가입"}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    이미 계정이 있으신가요?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-primary hover:underline"
                    >
                      로그인
                    </button>
                  </div>

                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 하단 약관 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            회원가입을 진행하면 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다
          </p>
        </div>

      </div>
    </div>
  );
}
