"use client";

import { activateMockSession, authProviders } from "@/lib/auth";
import type { AuthProviderId } from "@/lib/auth";
import { getAuthMode } from "@/lib/auth-mode";
import { Boxes, CheckCircle2, GitBranch, Github, KeyRound, LockKeyhole, Network, Rocket, Server, ShieldCheck, SquareStack, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signIn as signInAuth } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

type PlatformNode = {
  id: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  x: number;
  y: number;
  delay: string;
};

type PlatformEdge = {
  id: string;
  path: string;
  delay: string;
};

const platformNodes: PlatformNode[] = [
  { id: "github", title: "GitHub", detail: "Repository event", icon: Github, x: 18, y: 8, delay: "0s" },
  { id: "api", title: "Platform API", detail: "Intent captured", icon: Workflow, x: 56, y: 18, delay: "0.6s" },
  { id: "policies", title: "Policies", detail: "Guardrails applied", icon: ShieldCheck, x: 27, y: 32, delay: "1.2s" },
  { id: "gitops", title: "GitOps", detail: "Desired state", icon: GitBranch, x: 61, y: 45, delay: "1.8s" },
  { id: "argocd", title: "ArgoCD", detail: "Sync engine", icon: Network, x: 23, y: 58, delay: "2.4s" },
  { id: "kubernetes", title: "Kubernetes", detail: "Runtime control", icon: Boxes, x: 57, y: 70, delay: "3s" },
  { id: "services", title: "Services", detail: "Team workloads", icon: Server, x: 17, y: 82, delay: "3.6s" },
  { id: "production", title: "Production", detail: "Healthy release", icon: Rocket, x: 60, y: 88, delay: "4.2s" }
];

const platformEdges: PlatformEdge[] = [
  { id: "github-api", path: "M206 78 C286 82 340 112 420 142", delay: "0s" },
  { id: "api-policies", path: "M446 170 C382 196 312 206 258 252", delay: "0.6s" },
  { id: "policies-gitops", path: "M282 280 C360 302 402 326 458 360", delay: "1.2s" },
  { id: "gitops-argocd", path: "M450 388 C372 410 306 430 238 456", delay: "1.8s" },
  { id: "argocd-kubernetes", path: "M264 484 C338 500 410 522 462 548", delay: "2.4s" },
  { id: "kubernetes-services", path: "M454 576 C370 602 292 624 206 646", delay: "3s" },
  { id: "services-production", path: "M228 674 C314 700 406 712 476 720", delay: "3.6s" }
];

const operatingSignals = [
  { label: "Policy posture", value: "Enforced", detail: "Admission and release checks active" },
  { label: "Delivery model", value: "GitOps", detail: "Every change reconciled from source" },
  { label: "Runtime scope", value: "Multi-team", detail: "Services, infra, releases, ownership" }
];

function nextPath() {
  if (typeof window === "undefined") {
    return "/dashboard";
  }

  return new URLSearchParams(window.location.search).get("next") || "/dashboard";
}

function ProviderIcon({ providerId }: { providerId: AuthProviderId }) {
  if (providerId === "github") {
    return <Github className="h-4 w-4" aria-hidden="true" />;
  }

  if (providerId === "email") {
    return <KeyRound className="h-4 w-4" aria-hidden="true" />;
  }

  return <LockKeyhole className="h-4 w-4" aria-hidden="true" />;
}

function PlatformExecutionGraph() {
  return (
    <div className="nexus-topology relative min-h-[520px] overflow-hidden border-y border-slate-200 bg-white sm:min-h-[620px] lg:h-screen lg:min-h-[680px] lg:border-x">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 text-[0.68rem] font-semibold uppercase text-slate-500 sm:px-6">
        <span>Engineering Topology</span>
        <span className="inline-flex items-center gap-2 text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Executing
        </span>
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 720 780" role="img" aria-label="Animated platform execution flow from GitHub to production">
        <defs>
          <pattern id="nexus-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
          <filter id="nexus-pulse-soften" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="720" height="780" fill="#ffffff" />
        <rect width="720" height="780" fill="url(#nexus-grid)" opacity="0.72" />
        <path d="M116 740 L640 64" stroke="#0f172a" strokeOpacity="0.04" strokeWidth="120" />
        {platformEdges.map((edge) => (
          <g key={edge.id}>
            <path d={edge.path} fill="none" stroke="#cbd5e1" strokeLinecap="round" strokeWidth="2" />
            <path
              className="nexus-topology-flow"
              d={edge.path}
              fill="none"
              stroke="#0f172a"
              strokeLinecap="round"
              strokeWidth="2.5"
              style={{ "--flow-delay": edge.delay } as CSSProperties}
            />
            <circle className="nexus-topology-pulse" r="4.5" fill="#0f172a" filter="url(#nexus-pulse-soften)" style={{ "--flow-delay": edge.delay } as CSSProperties}>
              <animateMotion dur="5.6s" begin={edge.delay} repeatCount="indefinite" path={edge.path} />
            </circle>
          </g>
        ))}
      </svg>

      <div className="absolute inset-0 pt-12">
        {platformNodes.map((node) => {
          const Icon = node.icon;

          return (
            <div
              key={node.id}
              className="nexus-topology-node group absolute w-[154px] rounded-md border border-slate-200 bg-white px-3 py-3 text-left transition duration-300 hover:-translate-y-0.5 hover:border-slate-400"
              style={{ left: `${node.x}%`, top: `${node.y}%`, "--node-delay": node.delay } as CSSProperties}
            >
              <div className="flex items-start gap-3">
                <span className="nexus-topology-node-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-900">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-950">{node.title}</span>
                  <span className="mt-1 block text-[0.7rem] font-medium leading-4 text-slate-500">{node.detail}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/90 px-4 py-3 sm:px-6">
        <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
          {operatingSignals.map((signal) => (
            <div key={signal.label} className="min-w-0">
              <p className="font-semibold text-slate-950">{signal.value}</p>
              <p className="mt-0.5 truncate">{signal.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const authMode = getAuthMode();
  const mockMode = authMode === "mock";

  function signIn(provider: AuthProviderId = "email") {
    if (!mockMode) {
      void signInAuth("github", { callbackUrl: nextPath() });
      return;
    }

    activateMockSession("user-avery", provider);
    router.replace(nextPath());
  }

  const visibleProviders = mockMode ? authProviders : authProviders.filter((provider) => provider.id === "github");

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <section className="mx-auto grid min-h-screen max-w-[1440px] grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] lg:grid-rows-1">
        <div className="flex min-h-[600px] flex-col px-5 py-5 sm:px-8 lg:min-h-screen lg:px-10 lg:py-7 xl:px-14">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                <SquareStack className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-slate-950">Nexus</p>
                <p className="text-xs font-medium text-slate-500">Internal Developer Platform</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 text-xs font-semibold text-slate-600 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Production-grade workflows
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center py-9 lg:py-8">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-semibold uppercase text-slate-500">Platform operating layer</p>
              <h1 className="font-heading text-5xl font-semibold leading-[0.96] text-slate-950 sm:text-6xl lg:text-[4.6rem]">
                Ship infrastructure like product.
              </h1>
              
            </div>

            <form
              className="mt-7 max-w-xl border border-slate-200 bg-white p-3.5 sm:p-4"
              onSubmit={(event) => {
                event.preventDefault();
                signIn("email");
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Workspace access</p>
                <span className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  SSO ready
                </span>
              </div>

              {mockMode ? (
                <div className="mt-4 grid gap-3">
                  <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                    Email
                    <input className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200" defaultValue="avery.morgan@example.com" type="email" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                    Password
                    <input className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200" defaultValue="development-password" type="password" />
                  </label>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <label className="inline-flex items-center gap-2 font-medium text-slate-700">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300" defaultChecked />
                      Remember me
                    </label>
                    <Link href="/login" className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-950">
                      Forgot password
                    </Link>
                  </div>
                  <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300">
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    Sign in
                  </button>
                </div>
              ) : null}

              {mockMode ? (
                <div className="my-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-[0.68rem] font-semibold uppercase text-slate-500">or</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              ) : null}

              <div className={mockMode ? "grid gap-2" : "mt-3 grid gap-2"}>
                {visibleProviders.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => signIn(provider.id)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <ProviderIcon providerId={provider.id} />
                    {provider.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-2 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                <p>{mockMode ? "Local access is scoped by the selected development identity." : "GitHub identity maps to team ownership, environment permissions, and policy posture."}</p>
              </div>
            </form>

            <div className="mt-6 grid max-w-2xl gap-3 border-t border-slate-200 pt-5 sm:grid-cols-3">
              {operatingSignals.map((signal) => (
                <div key={signal.label} className="min-w-0">
                  <p className="text-[0.68rem] font-semibold uppercase text-slate-500">{signal.label}</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-950">{signal.value}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{signal.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 sm:px-8 lg:px-0 lg:pb-0">
          <PlatformExecutionGraph />
        </div>
      </section>
    </main>
  );
}
