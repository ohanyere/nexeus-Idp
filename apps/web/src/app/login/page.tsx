import { authProviders } from "@/lib/auth";
import { SquareStack } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_420px]">
        <div className="hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <SquareStack className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-ink">Nexus Platform</h1>
              <p className="text-sm text-muted">Internal Developer Platform</p>
            </div>
          </div>
          <p className="mt-8 max-w-xl text-3xl font-semibold leading-tight text-slate-950">
            Sign in to manage services, teams, releases, and platform access from one enterprise workspace.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 text-sm text-slate-700">
            <p className="rounded-md border border-line bg-white p-3">Mock authentication today, provider-ready architecture for GitHub, Google, Microsoft Entra ID, Keycloak, and Okta tomorrow.</p>
            <p className="rounded-md border border-line bg-white p-3">Permissions, teams, and environment access drive what users see inside the portal.</p>
          </div>
        </div>

        <form className="console-panel rounded-md p-5">
          <div className="mb-5 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white">
                <SquareStack className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-semibold text-ink">Nexus Platform</h1>
                <p className="text-xs text-muted">Internal Developer Platform</p>
              </div>
            </div>
          </div>
          <h2 className="font-heading text-xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use mock credentials or a mocked enterprise provider.</p>

          <div className="mt-5 grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-slate-800">
              Email
              <input className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" defaultValue="avery.morgan@example.com" type="email" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-800">
              Password
              <input className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" defaultValue="mock-password" type="password" />
            </label>
            <div className="flex items-center justify-between gap-3 text-xs">
              <label className="inline-flex items-center gap-2 font-medium text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-line" defaultChecked />
                Remember me
              </label>
              <Link href="/login" className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-2">Forgot password</Link>
            </div>
            <Link href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
              Sign In
            </Link>
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-2">
            {authProviders.map((provider) => (
              <Link key={provider.id} href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-canvas">
                {provider.label}
              </Link>
            ))}
          </div>
        </form>
      </section>
    </main>
  );
}
