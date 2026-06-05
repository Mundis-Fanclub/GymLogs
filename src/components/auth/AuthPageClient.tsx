"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Apple, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { Logo } from "@/components/brand/Logo";
import { useAppPreferences } from "@/components/providers/AppPreferencesProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "sign-in" | "sign-up";
type OAuthIntent = "google" | "apple";

type AuthPageClientProps = {
  mode: AuthMode;
  onboarding: boolean;
  redirectUrl: string;
  initialStrategy?: string;
};

const COPY = {
  de: {
    eyebrow: "GymLogs Konto",
    signUpTitle: "Erstelle deinen Account",
    signInTitle: "Willkommen zurück",
    signUpDescription: "Speichere dein Onboarding, deine Workouts und deinen Feed in einem Profil.",
    signInDescription: "Melde dich an und wir bringen dich direkt zurück in deinen Flow.",
    google: "Mit Google fortfahren",
    apple: "Mit Apple fortfahren",
    divider: "oder mit E-Mail",
    email: "E-Mail-Adresse",
    password: "Passwort",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort ausblenden",
    create: "Account erstellen",
    signIn: "Einloggen",
    creating: "Account wird erstellt...",
    signingIn: "Einloggen...",
    verifyTitle: "E-Mail bestätigen",
    verifyDescription: "Wir haben dir einen 6-stelligen Code geschickt.",
    code: "Bestätigungscode",
    verify: "Code bestätigen",
    verifying: "Wird bestätigt...",
    resend: "Code erneut senden",
    sentAgain: "Code erneut gesendet.",
    already: "Du hast schon einen Account?",
    noAccount: "Noch keinen Account?",
    goSignIn: "Einloggen",
    goSignUp: "Registrieren",
    backOnboarding: "Zurück zum Onboarding",
    secure: "Geschützt mit Clerk. Deine Onboarding-Daten bleiben lokal gespeichert, bis du eingeloggt bist.",
    captchaHint: "Der Sicherheitscheck erscheint nur, wenn Clerk ihn für deine Umgebung verlangt.",
    oauthStarting: "Weiterleitung wird vorbereitet...",
    oauthError: "Diese Login-Methode ist in Clerk noch nicht konfiguriert oder konnte nicht gestartet werden.",
    completeUnsupported: "Dieser Login benötigt einen zusätzlichen Schritt. Bitte nutze aktuell E-Mail und Passwort.",
    duplicateEmail: "Diese E-Mail existiert schon. Bitte melde dich stattdessen an.",
    genericError: "Das hat noch nicht geklappt. Prüfe deine Angaben und versuche es erneut.",
  },
  en: {
    eyebrow: "GymLogs account",
    signUpTitle: "Create your account",
    signInTitle: "Welcome back",
    signUpDescription: "Save your onboarding, workouts, and feed in one profile.",
    signInDescription: "Sign in and we will take you straight back into your flow.",
    google: "Continue with Google",
    apple: "Continue with Apple",
    divider: "or use email",
    email: "Email address",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    create: "Create account",
    signIn: "Sign in",
    creating: "Creating account...",
    signingIn: "Signing in...",
    verifyTitle: "Verify your email",
    verifyDescription: "We sent you a 6-digit code.",
    code: "Verification code",
    verify: "Verify code",
    verifying: "Verifying...",
    resend: "Send code again",
    sentAgain: "Code sent again.",
    already: "Already have an account?",
    noAccount: "No account yet?",
    goSignIn: "Sign in",
    goSignUp: "Sign up",
    backOnboarding: "Back to onboarding",
    secure: "Secured with Clerk. Your onboarding data stays local until you are signed in.",
    captchaHint: "The security check only appears when Clerk requires it for your environment.",
    oauthStarting: "Preparing redirect...",
    oauthError: "This login method is not configured in Clerk yet or could not be started.",
    completeUnsupported: "This login needs one extra step. Please use email and password for now.",
    duplicateEmail: "This email already exists. Please sign in instead.",
    genericError: "That did not work yet. Check your details and try again.",
  },
} as const;

function getClerkError(error: unknown, fallback: string, duplicateEmail: string) {
  if (typeof error === "object" && error !== null && "errors" in error) {
    const errors = (error as { errors?: Array<{ longMessage?: string; message?: string; code?: string }> }).errors;
    const first = errors?.[0];
    if (first?.code === "form_identifier_exists") {
      return duplicateEmail;
    }
    return first?.longMessage ?? first?.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function strategyFor(provider: OAuthIntent) {
  return provider === "google" ? "oauth_google" : "oauth_apple";
}

export function AuthPageClient({ mode, onboarding, redirectUrl, initialStrategy }: AuthPageClientProps) {
  const router = useRouter();
  const { locale } = useAppPreferences();
  const copy = COPY[locale];
  const signIn = useSignIn();
  const signUp = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOAuthStarting, setIsOAuthStarting] = useState<OAuthIntent | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const oauthStartedRef = useRef(false);

  const isReady = signIn.isLoaded && signUp.isLoaded;
  const otherModeHref = useMemo(() => {
    const base = mode === "sign-up" ? "/sign-in" : "/sign-up";
    return onboarding ? `${base}?onboarding=1` : base;
  }, [mode, onboarding]);

  const completeAuth = useCallback(async (createdSessionId: string | null) => {
    if (!createdSessionId) {
      setError(copy.completeUnsupported);
      return;
    }
    const setActive = mode === "sign-up" ? signUp.setActive : signIn.setActive;
    if (!setActive) {
      setError(copy.genericError);
      return;
    }
    await setActive({ session: createdSessionId });
    router.push(redirectUrl);
    router.refresh();
  }, [copy.completeUnsupported, copy.genericError, mode, redirectUrl, router, signIn.setActive, signUp.setActive]);

  const startOAuth = useCallback(async (provider: OAuthIntent) => {
    if (!isReady) return;
    setError(null);
    setNotice(null);
    setIsOAuthStarting(provider);
    try {
      const params = {
        strategy: strategyFor(provider),
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectUrl,
        continueSignIn: true,
        continueSignUp: true,
      } as const;

      if (mode === "sign-up") {
        await signUp.signUp.authenticateWithRedirect(params);
      } else {
        await signIn.signIn.authenticateWithRedirect(params);
      }
    } catch (authError) {
      setError(getClerkError(authError, copy.oauthError, copy.duplicateEmail));
      setIsOAuthStarting(null);
    }
  }, [copy.duplicateEmail, copy.oauthError, isReady, mode, redirectUrl, signIn.signIn, signUp.signUp]);

  useEffect(() => {
    if (oauthStartedRef.current || !isReady) return;
    if (initialStrategy !== "google" && initialStrategy !== "apple") return;
    oauthStartedRef.current = true;
    void startOAuth(initialStrategy);
  }, [initialStrategy, isReady, startOAuth]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady) return;
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      if (mode === "sign-in") {
        const result = await signIn.signIn.create({
          identifier: email,
          password,
          strategy: "password",
        });
        if (result.status === "complete") {
          await completeAuth(result.createdSessionId);
          return;
        }
        setError(copy.completeUnsupported);
        return;
      }

      const result = await signUp.signUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === "complete") {
        await completeAuth(result.createdSessionId);
        return;
      }

      await signUp.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setNeedsVerification(true);
    } catch (authError) {
      setError(getClerkError(authError, copy.genericError, copy.duplicateEmail));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signUp.isLoaded) return;
    setError(null);
    setNotice(null);
    setIsVerifying(true);

    try {
      const result = await signUp.signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await completeAuth(result.createdSessionId);
        return;
      }
      setError(copy.completeUnsupported);
    } catch (authError) {
      setError(getClerkError(authError, copy.genericError, copy.duplicateEmail));
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    if (!signUp.isLoaded) return;
    setError(null);
    setNotice(null);
    try {
      await signUp.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setNotice(copy.sentAgain);
    } catch (authError) {
      setError(getClerkError(authError, copy.genericError, copy.duplicateEmail));
    }
  };

  const title = needsVerification ? copy.verifyTitle : mode === "sign-up" ? copy.signUpTitle : copy.signInTitle;
  const description = needsVerification ? copy.verifyDescription : mode === "sign-up" ? copy.signUpDescription : copy.signInDescription;
  const primaryLabel = mode === "sign-up" ? copy.create : copy.signIn;
  const busyLabel = mode === "sign-up" ? copy.creating : copy.signingIn;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_color-mix(in_oklch,var(--primary)_24%,transparent),transparent_34rem),var(--background)] px-4 py-6 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size={88} priority alt="Logged" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{copy.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-normal text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>

        <section className="rounded-lg border border-border bg-card/95 p-4 shadow-2xl shadow-black/30 backdrop-blur">
          {!needsVerification ? (
            <>
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-start rounded-lg text-base"
                  disabled={!isReady || Boolean(isOAuthStarting)}
                  onClick={() => startOAuth("google")}
                >
                  {isOAuthStarting === "google" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="grid size-5 place-items-center rounded-full border border-border text-xs font-black">G</span>
                  )}
                  {isOAuthStarting === "google" ? copy.oauthStarting : copy.google}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-start rounded-lg text-base"
                  disabled={!isReady || Boolean(isOAuthStarting)}
                  onClick={() => startOAuth("apple")}
                >
                  {isOAuthStarting === "apple" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Apple className="h-5 w-5" />}
                  {isOAuthStarting === "apple" ? copy.oauthStarting : copy.apple}
                </Button>
              </div>

              <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {copy.divider}
                <span className="h-px flex-1 bg-border" />
              </div>

              <form className="grid gap-3" onSubmit={handleEmailSubmit}>
                <label className="grid gap-1.5 text-sm font-medium">
                  {copy.email}
                  <Input
                    type="email"
                    autoComplete="email"
                    className="h-12 rounded-lg bg-background/70"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  {copy.password}
                  <span className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                      className="h-12 rounded-lg bg-background/70 pr-11"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                {mode === "sign-up" && (
                  <div className="grid gap-2">
                    <div id="clerk-captcha" className="min-h-0" />
                    <p className="text-xs leading-5 text-muted-foreground">{copy.captchaHint}</p>
                  </div>
                )}

                {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm leading-5 text-destructive">{error}</p>}
                {notice && <p className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm leading-5 text-primary"><CheckCircle2 className="h-4 w-4" />{notice}</p>}

                <Button type="submit" className="mt-1 h-12 w-full rounded-lg text-base" disabled={!isReady || isSubmitting || Boolean(isOAuthStarting)}>
                  {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
                  {isSubmitting ? busyLabel : primaryLabel}
                </Button>
              </form>
            </>
          ) : (
            <form className="grid gap-3" onSubmit={handleVerify}>
              <label className="grid gap-1.5 text-sm font-medium">
                {copy.code}
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="h-12 rounded-lg bg-background/70 text-center text-lg tracking-[0.2em]"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  maxLength={12}
                  required
                />
              </label>
              {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm leading-5 text-destructive">{error}</p>}
              {notice && <p className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm leading-5 text-primary"><CheckCircle2 className="h-4 w-4" />{notice}</p>}
              <Button type="submit" className="h-12 w-full rounded-lg text-base" disabled={isVerifying || !code.trim()}>
                {isVerifying && <Loader2 className="h-5 w-5 animate-spin" />}
                {isVerifying ? copy.verifying : copy.verify}
              </Button>
              <Button type="button" variant="ghost" className="h-11 w-full rounded-lg" onClick={resendCode}>
                {copy.resend}
              </Button>
            </form>
          )}

          <div className="mt-4 border-t border-border pt-4 text-center text-sm text-muted-foreground">
            {mode === "sign-up" ? copy.already : copy.noAccount}{" "}
            <Link className="font-semibold text-primary hover:underline" href={otherModeHref}>
              {mode === "sign-up" ? copy.goSignIn : copy.goSignUp}
            </Link>
          </div>
        </section>

        <div className="grid gap-3 text-center">
          {onboarding && (
            <Link className="inline-flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground" href="/onboarding">
              <ArrowLeft className="h-4 w-4" />
              {copy.backOnboarding}
            </Link>
          )}
          <p className="flex items-start justify-center gap-2 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{copy.secure}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
