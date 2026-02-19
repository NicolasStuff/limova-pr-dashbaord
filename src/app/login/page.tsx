type LoginError =
  | "invalid_email"
  | "invalid_domain"
  | "magic_link_invalid"
  | "send_failed";

type LoginStatus = "magic_link_sent";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: LoginError;
    status?: LoginStatus;
  }>;
}) {
  const { error, status } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-text-muted">
            Mission Control
          </div>
          <h1 className="font-mono text-4xl font-bold tracking-tight text-text-primary">
            Limova
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            Dashboard de suivi des Pull Requests
          </p>
        </div>

        <div className="rounded-xl border border-border bg-bg-surface p-8">
          {status === "magic_link_sent" && (
            <div className="mb-6 rounded-lg border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
              Un lien de connexion vient d&apos;être envoyé par email.
            </div>
          )}

          {error === "invalid_email" && (
            <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
              Veuillez saisir une adresse email valide.
            </div>
          )}

          {error === "invalid_domain" && (
            <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
              Seules les adresses email se terminant par @limova.ai sont autorisées.
            </div>
          )}

          {error === "magic_link_invalid" && (
            <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
              Ce lien de connexion est invalide ou expiré.
            </div>
          )}

          {error === "send_failed" && (
            <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
              Impossible d&apos;envoyer l&apos;email de connexion. Veuillez réessayer.
            </div>
          )}

          <form action="/api/auth/login" method="POST" className="space-y-4">
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
              Adresse email professionnelle
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="vous@limova.ai"
              className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-blue"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-accent-blue px-4 py-3 font-medium text-white transition-colors hover:bg-accent-blue/90"
            >
              Envoyer un Magic Link
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted">
          Authentification requise via lien magique (@limova.ai uniquement)
        </p>
      </div>
    </div>
  );
}
