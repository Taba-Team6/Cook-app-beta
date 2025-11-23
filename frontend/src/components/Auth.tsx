import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ChefHat, Mail, Lock, User } from "lucide-react";
import { createClient } from "../utils/supabase/client";
import { signUp, setAuthToken } from "../utils/api";

interface AuthProps {
  onAuthSuccess: (userName: string) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!loginEmail || !loginPassword) {
      setError("모든 필드를 입력해주세요");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (signInError) {
        console.log('Login error:', signInError);
        setError("이메일 또는 비밀번호가 일치하지 않습니다");
        setLoading(false);
        return;
      }

      if (!data.session || !data.user) {
        setError("로그인에 실패했습니다");
        setLoading(false);
        return;
      }

      // Store auth token
      setAuthToken(data.session.access_token);

      // Store user info in session storage
      const userName = data.user.user_metadata?.name || loginEmail.split('@')[0];
      sessionStorage.setItem("cooking_assistant_current_user", JSON.stringify({
        id: data.user.id,
        email: loginEmail,
        name: userName,
      }));

      onAuthSuccess(userName);
      setLoading(false);
    } catch (err: any) {
      console.error('Login error in catch block:', err);
      setError("로그인 중 오류가 발생했습니다");
      setLoading(false);
    }
  };

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
      // Call backend signup endpoint
      const result = await signUp(signupEmail, signupPassword, signupName);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Now sign in the user
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: signupEmail,
        password: signupPassword,
      });

      if (signInError || !data.session) {
        setError("회원가입은 완료되었으나 로그인에 실패했습니다. 다시 로그인해주세요.");
        setLoading(false);
        setActiveTab("login");
        return;
      }

      // Store auth token
      setAuthToken(data.session.access_token);

      // Store user info in session storage
      sessionStorage.setItem("cooking_assistant_current_user", JSON.stringify({
        id: data.user.id,
        email: signupEmail,
        name: signupName,
      }));

      onAuthSuccess(signupName);
      setLoading(false);
    } catch (err: any) {
      console.error('Signup error in catch block:', err);
      setError(err.message || "회원가입 중 오류가 발생했습니다");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ChefHat className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="mb-2">쿠킹 어시스턴트</h1>
          <p className="text-muted-foreground">
            AI가 도와주는 맞춤형 요리 가이드
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>로그인</CardTitle>
                <CardDescription>
                  계정에 로그인하여 맞춤 레시피를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="example@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">이름</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="홍길동"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="example@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">최소 6자 이상</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">비밀번호 확인</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            회원가입을 진행하면 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  );
}