import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MASTER_EMAIL = "pauloroberto5002@gmail.com";
const MASTER_PASSWORD = "Byd@67501388@Byd";

function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [tab, setTab] = useState<"entrar" | "cadastrar">("entrar");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    email: "",
    password: "",
    confirmPassword: "",
    twoFactor: false,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (
      loginForm.email === MASTER_EMAIL &&
      loginForm.password === MASTER_PASSWORD
    ) {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem(
        "masterUser",
        JSON.stringify({
          email: MASTER_EMAIL,
          name: "Paulo Roberto",
          role: "admin",
        }),
      );
      toast.success("Bem-vindo, Paulo! Acesso administrador.");
      setLoading(false);
      onLogin();
      return;
    }

    if (!loginForm.email || !loginForm.password) {
      toast.error("Preencha e-mail e senha");
      setLoading(false);
      return;
    }

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", loginForm.email);
    toast.success("Login realizado com sucesso!");
    setLoading(false);
    onLogin();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", registerForm.email);
    localStorage.setItem("userName", registerForm.name);
    toast.success("Conta criada com sucesso!");
    setLoading(false);
    onLogin();
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.18 0.055 240) 0%, oklch(0.25 0.065 240) 50%, oklch(0.22 0.05 240) 100%)",
      }}
    >
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(var(--accent))" }}
          >
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wide">
            ContaFácil ERP
          </span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Contabilidade inteligente
            <br />
            <span style={{ color: "oklch(var(--accent))" }}>
              sem complicação
            </span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Leia PDFs, imagens e documentos automaticamente. Gere Livro Diário,
            Razão, Balanço e DRE com um clique.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Lançamentos automáticos por IA",
              "Organização por cliente e ano",
              "Relatórios prontos para licitação",
              "100% web — sem instalação",
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 text-sm text-white/80"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "oklch(var(--accent))" }}
                />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs">
          © {new Date().getFullYear()} ContaFácil ERP. Desenvolvido com
          caffeine.ai
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(var(--accent))" }}
            >
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <span className="text-white text-lg font-bold">ContaFácil ERP</span>
          </div>

          <Card className="shadow-2xl border-0">
            <CardHeader className="pb-2 pt-6 px-6">
              <CardTitle className="text-lg font-semibold text-foreground">
                Acesse sua conta
              </CardTitle>
              <CardDescription className="text-xs">
                Sistema de contabilidade inteligente
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as "entrar" | "cadastrar")}
              >
                <TabsList className="w-full mb-5">
                  <TabsTrigger
                    value="entrar"
                    data-ocid="login.entrar.tab"
                    className="flex-1 text-xs"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger
                    value="cadastrar"
                    data-ocid="login.cadastrar.tab"
                    className="flex-1 text-xs"
                  >
                    Cadastrar
                  </TabsTrigger>
                </TabsList>

                {/* LOGIN TAB */}
                <TabsContent value="entrar">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium">E-mail *</Label>
                      <Input
                        data-ocid="login.email.input"
                        type="email"
                        className="h-9 text-xs mt-1"
                        placeholder="seu@email.com"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm((p) => ({ ...p, email: e.target.value }))
                        }
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Senha *</Label>
                      <div className="relative mt-1">
                        <Input
                          data-ocid="login.password.input"
                          type={showPass ? "text" : "password"}
                          className="h-9 text-xs pr-9"
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) =>
                            setLoginForm((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPass ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      data-ocid="login.submit.submit_button"
                      className="w-full h-9 text-xs bg-primary text-white mt-1"
                      disabled={loading}
                    >
                      {loading && (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      )}
                      Entrar
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-2 text-[10px] text-muted-foreground">
                          ou
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      data-ocid="login.google.button"
                      variant="outline"
                      className="w-full h-9 text-xs gap-2"
                      onClick={() => toast.info("Google login em breve")}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <title>Google</title>
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Entrar com Google
                    </Button>
                  </form>
                </TabsContent>

                {/* REGISTER TAB */}
                <TabsContent value="cadastrar">
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">
                        Nome Completo *
                      </Label>
                      <Input
                        data-ocid="register.name.input"
                        className="h-9 text-xs mt-1"
                        placeholder="Seu nome completo"
                        value={registerForm.name}
                        onChange={(e) =>
                          setRegisterForm((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">CPF *</Label>
                        <Input
                          data-ocid="register.cpf.input"
                          className="h-9 text-xs mt-1"
                          placeholder="000.000.000-00"
                          value={registerForm.cpf}
                          onChange={(e) =>
                            setRegisterForm((p) => ({
                              ...p,
                              cpf: maskCPF(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">
                          Nascimento
                        </Label>
                        <Input
                          data-ocid="register.birth.input"
                          type="date"
                          className="h-9 text-xs mt-1"
                          value={registerForm.birthDate}
                          onChange={(e) =>
                            setRegisterForm((p) => ({
                              ...p,
                              birthDate: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">E-mail *</Label>
                      <Input
                        data-ocid="register.email.input"
                        type="email"
                        className="h-9 text-xs mt-1"
                        placeholder="seu@email.com"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Senha *</Label>
                      <div className="relative mt-1">
                        <Input
                          data-ocid="register.password.input"
                          type={showPass ? "text" : "password"}
                          className="h-9 text-xs pr-9"
                          placeholder="Min. 8 caracteres"
                          value={registerForm.password}
                          onChange={(e) =>
                            setRegisterForm((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPass ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">
                        Confirmar Senha *
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          data-ocid="register.confirm.input"
                          type={showConfirm ? "text" : "password"}
                          className="h-9 text-xs pr-9"
                          placeholder="Repita a senha"
                          value={registerForm.confirmPassword}
                          onChange={(e) =>
                            setRegisterForm((p) => ({
                              ...p,
                              confirmPassword: e.target.value,
                            }))
                          }
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirm ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-xs font-medium">
                          Autenticação em dois fatores
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Receba código por e-mail a cada login
                        </p>
                      </div>
                      <Switch
                        data-ocid="register.twofactor.switch"
                        checked={registerForm.twoFactor}
                        onCheckedChange={(v) =>
                          setRegisterForm((p) => ({ ...p, twoFactor: v }))
                        }
                      />
                    </div>
                    <Button
                      type="submit"
                      data-ocid="register.submit.submit_button"
                      className="w-full h-9 text-xs bg-primary text-white"
                      disabled={loading}
                    >
                      {loading && (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      )}
                      Criar Conta
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-[11px] text-white/40 mt-4">
            Ao entrar, você concorda com os Termos de Uso e Política de
            Privacidade
          </p>
        </div>
      </div>
    </div>
  );
}
