"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import type { Repository } from "@/types/repository";
import { RepoForm } from "@/components/settings/repo-form";
import { RepoList } from "@/components/settings/repo-list";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RepositoriesSettingsPage() {
  const { data, isLoading, mutate } = useSWR<{ repositories: Repository[] }>(
    "/api/repositories",
    fetcher
  );
  const repos = data?.repositories;

  const { trigger: addRepo, isMutating: isAdding } = useSWRMutation(
    "/api/repositories",
    (url: string, { arg }: { arg: { owner: string; name: string } }) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to add repository");
        return r.json();
      })
  );

  async function handleAdd(owner: string, name: string) {
    await addRepo({ owner, name });
    mutate();
  }

  async function handleToggle(id: number, isActive: boolean) {
    await fetch(`/api/repositories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    mutate();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/repositories/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-text-primary font-sans">
        Repositories
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Manage the GitHub repositories tracked by this dashboard.
      </p>

      <div className="mt-6 space-y-6">
        <RepoForm onSubmit={handleAdd} isLoading={isAdding} />
        <RepoList
          repositories={repos ?? []}
          isLoading={isLoading}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
