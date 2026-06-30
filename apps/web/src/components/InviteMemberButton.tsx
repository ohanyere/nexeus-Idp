"use client";

import { useMockSession } from "@/components/MockSessionContext";
import { mockRoles, teams } from "@/lib/mock-data";
import type { MockRole } from "@/lib/mock-data";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

export function InviteMemberButton({ teamId }: { teamId?: string }) {
  const { can, selectedRole } = useMockSession();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<MockRole>("Developer");
  const [selectedTeamId, setSelectedTeamId] = useState(teamId ?? teams[0].id);
  const team = teams.find((candidate) => candidate.id === selectedTeamId) ?? teams[0];
  const permissionSummary = useMemo(() => {
    if (role === "Viewer") {
      return "Read-only access with cost visibility.";
    }

    if (role === "Developer") {
      return "Create services and deploy to dev/stage.";
    }

    if (role === "Team Lead") {
      return "Team deployment, approval, rollback, and team management access.";
    }

    if (role === "Platform Engineer") {
      return "Infrastructure, deployment, policy, template, and audit access.";
    }

    return "Full platform administration.";
  }, [role]);

  if (!can("manage teams")) {
    return null;
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800">
        Invite Member
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <section className="w-full max-w-lg overflow-hidden rounded-md border border-line bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-line bg-canvas px-5 py-4">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Invite member</h2>
                <p className="mt-1 text-sm text-muted">Mock invitation only. No email or identity provider call is made.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-slate-700 hover:bg-canvas" aria-label="Close invite modal">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-4 px-5 py-5">
              <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                Email
                <input className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200" placeholder="teammate@example.com" type="email" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                Role
                <select value={role} onChange={(event) => setRole(event.target.value as MockRole)} className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-slate-400">
                  {mockRoles.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-800">
                Team
                <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-slate-400">
                  {teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <div className="rounded-md border border-line bg-canvas p-3 text-sm">
                <p className="font-semibold text-ink">Permission Summary</p>
                <p className="mt-1 text-muted">{permissionSummary}</p>
                <p className="mt-2 text-xs text-muted">{team.name} · requested by {selectedRole}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                Send mock invitation
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
