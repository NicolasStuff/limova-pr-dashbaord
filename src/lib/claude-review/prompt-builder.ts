import type { ReviewFinding, ReviewScope } from "@/types/claude-review";

interface ScopeConfig {
  rulesDir: string;
  rootRules: string;
  ruleFiles: string[];
}

function getScopeConfig(repoBasePath: string, scope: ReviewScope): ScopeConfig {
  const scopeConfigs: Record<ReviewScope, ScopeConfig> = {
    api: {
      rulesDir: `${repoBasePath}/api/.claude/rules`,
      rootRules: `${repoBasePath}/.claude/rules/backend.md`,
      ruleFiles: [
        "typescript-rules.md",
        "naming-conventions.md",
        "best-practices.md",
        "api-decorator-rules.md",
        "dto-mapper-rules.md",
        "module-architecture-rules.md",
        "power-up-rules.md",
        "agent-rules.md",
        "storage-rules.md",
        "database-rules.md",
        "i18n-rules.md",
        "testing-rules.md",
        "code-review-process.md",
        "cache-rules.md",
      ],
    },
    client: {
      rulesDir: `${repoBasePath}/client/.claude/rules`,
      rootRules: `${repoBasePath}/.claude/rules/frontend.md`,
      ruleFiles: [
        "typescript-rules.md",
        "component-rules.md",
        "styling-rules.md",
        "api-client-rules.md",
      ],
    },
  };

  return scopeConfigs[scope];
}

const SCOPE_LABELS: Record<ReviewScope, string> = {
  api: "NestJS API",
  client: "Next.js Client",
};

const GROUPING_STRATEGY: Record<ReviewScope, string> = {
  api: `Par domaine fonctionnel :
   - Services + Controllers + DTOs d'un meme module ensemble
   - Entities + migrations d'un meme module ensemble
   - Tests avec leurs fichiers sources
   Couches : controllers/, dtos/, services/, entities/, migrations/, modules/power-up/, modules/agentic/, shared/, i18n/, *.spec.ts`,
  client: `Par domaine fonctionnel :
   - Composants + pages d'une meme feature ensemble
   - Hooks + stores lies ensemble
   - Styles associes
   Couches : pages/, components/, hooks/, api client/, utils/, styles/, tests/`,
};

const NO_CHECKOUT_CONSTRAINT = `
## REGLE ABSOLUE — INTERDICTION DE CHECKOUT

Tu ne dois JAMAIS executer :
- git checkout / git switch / git merge / git pull / git rebase

Le repertoire de travail DOIT rester sur la branche actuelle.
Pour lire le code source complet d'un fichier modifie dans la PR :
1. BRANCH=$(gh pr view <prNumber> --json headRefName -q .headRefName)
2. git fetch origin $BRANCH
3. git show origin/$BRANCH:<chemin/relatif/du/fichier>

JAMAIS de Read/Glob/Grep sur les fichiers source du projet.
Read est UNIQUEMENT autorise pour les fichiers de rules (.claude/rules/*.md, CLAUDE.md).
`;

const SCOPE_CONSTRAINT = `
## REGLE ABSOLUE — SCOPE LIMITE AU DIFF DE LA PR

Tu ne dois reviewer QUE les lignes modifiees dans le diff de cette PR.
- Utilise \`gh pr diff\` comme perimetre strict
- Ne commente JAMAIS du code qui existait avant cette PR
- Si une ligne n'apparait pas dans le diff (ni en \`+\` ni en \`-\`), elle est HORS SCOPE
- Les numeros de ligne dans tes findings doivent correspondre aux nouvelles lignes du fichier
- Si tu trouves un probleme dans du code preexistant, IGNORE-LE — c'est hors scope
`;

export interface BuildPromptParams {
  prNumber: number;
  scope: ReviewScope;
  repoBasePath: string;
  reviewerCount: "auto" | number;
  verifyImplementation: boolean;
  findingsFilePath: string;
  iteration: number;
}

export function buildInitialReviewPrompt(params: BuildPromptParams): string {
  const { prNumber, scope, repoBasePath, reviewerCount, verifyImplementation, findingsFilePath } = params;
  const config = getScopeConfig(repoBasePath, scope);
  const cwd = `${repoBasePath}/${scope}`;

  const reviewerInstruction = reviewerCount === "auto"
    ? `Auto-calcule le nombre de reviewers selon le nombre de fichiers modifies :
   - < 10 fichiers : 2 reviewers
   - 10-25 : 3-4 reviewers
   - 25-50 : 5-6 reviewers
   - 50-100 : 7-8 reviewers
   - 100+ : 10 reviewers`
    : `Utilise exactement ${reviewerCount} reviewers.`;

  const rulesListing = config.ruleFiles
    .map((f) => `  - ${config.rulesDir}/${f}`)
    .join("\n");

  const verifySection = verifyImplementation
    ? `
## Phase supplementaire : Verification d'implementation

Apres la review de code, effectue une verification d'implementation :
1. Identifie les librairies/APIs externes utilisees dans les fichiers modifies
2. Pour chaque librairie, utilise Context7 (resolve-library-id puis query-docs) pour recuperer la documentation officielle
3. Compare l'implementation reelle avec la documentation
4. Ajoute les findings de type Critical/Warning concernant :
   - Usage incorrect d'API
   - Methodes deprecated
   - Configuration manquante
   - Problemes de securite documentes
   - Mauvaises pratiques specifiques a la librairie
`
    : "";

  return `Tu es un lead reviewer senior pour le projet Limova (${SCOPE_LABELS[scope]}).

${SCOPE_CONSTRAINT}
${NO_CHECKOUT_CONSTRAINT}

## Ta mission

Orchestre une equipe de reviewers pour analyser la PR #${prNumber} de maniere exhaustive.
Tu es le LEAD : tu coordonnes, tu ne reviews PAS toi-meme.

## Repertoire de travail

Tu es dans : ${cwd}
Toutes les commandes gh et git doivent etre executees depuis CE repertoire.

## Phase 1 : Preparation

### 1.1 Collecter les infos PR
\`\`\`bash
cd ${cwd} && gh pr view ${prNumber}
cd ${cwd} && gh pr diff ${prNumber} --name-only
\`\`\`

### 1.2 Filtrer les fichiers
Exclure de la review :
- pnpm-lock.yaml, package-lock.json, yarn.lock
- node_modules/, dist/, .next/
- Fichiers .md (sauf CLAUDE.md et rules)
- Fichiers de config CI/CD (sauf si c'est le sujet de la PR)

### 1.3 Grouper les fichiers en batches
${GROUPING_STRATEGY[scope]}

Equilibrer la charge par volume de diff (lignes), pas juste par nombre de fichiers.

### 1.4 Nombre de reviewers
${reviewerInstruction}

### 1.5 Rules a charger
Chaque reviewer doit lire et appliquer les rules pertinentes pour ses fichiers :
${rulesListing}
  - ${config.rootRules}

Lis aussi le CLAUDE.md du scope : ${cwd}/CLAUDE.md

## Phase 2 : Spawner les reviewers

Cree une equipe (TeamCreate) de N reviewers. Chaque reviewer recoit :
- Sa liste de fichiers
- Le contexte PR (titre, auteur, description)
- Les rules pertinentes pour son batch
- L'instruction de ne reviewer QUE les modifications du diff

Chaque reviewer doit utiliser Opus 4.6 (model: opus).

### Prompt de chaque reviewer :
\`\`\`
Tu es le Reviewer {N} sur {total} d'une review parallele de la PR #${prNumber} sur Limova (${scope}).

${SCOPE_CONSTRAINT}
${NO_CHECKOUT_CONSTRAINT}

## Tes fichiers
{liste des fichiers du batch}

## Process
1. Lis le diff de la PR : cd ${cwd} && gh pr diff ${prNumber}
   Concentre-toi UNIQUEMENT sur tes fichiers.
2. Si tu as besoin du code complet d'un fichier, utilise :
     BRANCH=$(cd ${cwd} && gh pr view ${prNumber} --json headRefName -q .headRefName)
     cd ${cwd} && git fetch origin $BRANCH
     cd ${cwd} && git show origin/$BRANCH:<chemin/du/fichier>
     N'utilise JAMAIS Read pour lire des fichiers source — uniquement pour les rules.
3. Lis les rules listees.
4. Analyse le code en appliquant les rules comme checklist.
5. Verifie aussi :
   - Securite (auth, validation, secrets)
   - Performance (N+1, pagination, Promise.all)
   - Architecture (coherence patterns, pas de duplication)
   - Pas de type any (explicite ou implicite)
   - Pas de boucles for/while
   - Imports absolus (@/)
   - Catch blocks non vides

## Ton des commentaires
- Francais, naturel, direct, tutoyer l'auteur
- Jamais de reference aux "rules", "CLAUDE.md", "violation", ou "IA"
- Toujours proposer une solution

## Output
Pour CHAQUE probleme, produis un finding au format :
- id: hash unique (file-line-severity-debut_du_commentaire)
- file: chemin relatif a la racine du repo
- line: numero de ligne dans la NOUVELLE version du fichier
- severity: blocking | major | minor | cosmetic
- comment: commentaire en francais
- suggestion: code suggere (optionnel)
- diffContext: 3 lignes avant/apres la ligne concernee dans le diff
- iteration: 1

Envoie tes findings au lead une fois termine.
\`\`\`

## Phase 3 : Collecter et synthetiser

Attends que TOUS les reviewers terminent. Collecte leurs findings.

### 3.1 Deduplication
Fusionne les doublons (meme fichier, meme ligne, meme probleme).

### 3.2 Determiner le statut
- REQUEST_CHANGES : au moins un blocking ou major
- COMMENT : uniquement minor ou cosmetic
- APPROVE : aucun probleme

### 3.3 Rediger le review body
1. Un point positif sur la PR
2. Resume des problemes principaux
3. Patterns repetitifs (cross-cutting)
4. Nombre de reviewers et fichiers analyses

## Phase 4 : Ecrire les findings

Ecris le fichier JSON des findings :
\`\`\`bash
cat > ${findingsFilePath} << 'FINDINGS_EOF'
[
  {
    "id": "unique-hash",
    "file": "src/path/to/file.ts",
    "line": 42,
    "severity": "major",
    "comment": "Commentaire en francais...",
    "suggestion": "Code suggere...",
    "diffContext": "@@ -40,6 +40,8 @@\\n context lines...",
    "iteration": 1
  }
]
FINDINGS_EOF
\`\`\`

IMPORTANT : Le fichier DOIT etre un JSON valide. Si aucun probleme trouve, ecris \`[]\`.
N'inclus que les findings NEW — pas de doublons.
Chaque finding doit avoir un "id" unique genere par hash de file+line+severity+50 premiers caracteres du commentaire.

NE POSTE RIEN SUR GITHUB. Le dashboard s'en charge.

${verifySection}

## Phase 5 : Nettoyage

Nettoie l'equipe une fois termine.

## Rappel final

${SCOPE_CONSTRAINT}

ultrathink

Maintenant, execute cette review.`;
}

export function buildIterationPrompt(
  params: BuildPromptParams,
  existingFindings: ReviewFinding[]
): string {
  const { prNumber, scope, repoBasePath, reviewerCount, findingsFilePath, iteration } = params;
  const config = getScopeConfig(repoBasePath, scope);
  const cwd = `${repoBasePath}/${scope}`;

  const reviewerInstruction = reviewerCount === "auto"
    ? "Auto-calcule le nombre de reviewers (meme logique que precedemment)."
    : `Utilise exactement ${reviewerCount} reviewers.`;

  const rulesListing = config.ruleFiles
    .map((f) => `  - ${config.rulesDir}/${f}`)
    .join("\n");

  const existingFindingsJson = JSON.stringify(existingFindings, null, 2);

  return `Tu es un lead reviewer senior effectuant la PASSE #${iteration} sur la PR #${prNumber} (${SCOPE_LABELS[scope]}).

${SCOPE_CONSTRAINT}
${NO_CHECKOUT_CONSTRAINT}

## Contexte

Des reviewers precedents ont deja identifie ${existingFindings.length} problemes lors des passes precedentes.

## Findings existants (NE PAS REPETER)

\`\`\`json
${existingFindingsJson}
\`\`\`

## Ta mission

Trouver les problemes que les passes precedentes ont MANQUES.
- NE REPETE PAS les findings ci-dessus
- Cherche des angles differents : securite, edge cases, performance, patterns cross-cutting
- Si tu ne trouves RIEN de nouveau, ecris un fichier findings vide : []
- SEULS les changements du diff de la PR sont dans le scope

## Repertoire de travail
${cwd}

## Rules a appliquer
${rulesListing}
  - ${config.rootRules}

## Process

1. Relis le diff : cd ${cwd} && gh pr diff ${prNumber}
2. Compare chaque modification avec les findings existants
3. Cherche ce qui a ete manque :
   - Problemes de securite subtils
   - Edge cases non couverts
   - Violations de patterns non detectees
   - Problemes de performance caches
   - Incoherences architecturales
4. ${reviewerInstruction}
5. Orchestre les reviewers de la meme maniere que la premiere passe

## Output

Ecris UNIQUEMENT les NOUVEAUX findings dans :
\`\`\`bash
cat > ${findingsFilePath} << 'FINDINGS_EOF'
[... uniquement les NOUVEAUX findings, iteration: ${iteration} ...]
FINDINGS_EOF
\`\`\`

Si rien de nouveau, ecris :
\`\`\`bash
cat > ${findingsFilePath} << 'FINDINGS_EOF'
[]
FINDINGS_EOF
\`\`\`

NE POSTE RIEN SUR GITHUB.

${SCOPE_CONSTRAINT}

Maintenant, effectue cette re-review en cherchant ce qui a ete manque.`;
}
