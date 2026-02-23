import { NextResponse } from "next/server";
import { exec } from "child_process";
import { platform } from "os";

export async function POST() {
  const os = platform();

  let command: string;
  if (os === "darwin") {
    command = `osascript -e 'POSIX path of (choose folder with prompt "Sélectionner le dossier du monorepo")'`;
  } else if (os === "linux") {
    command = `zenity --file-selection --directory --title="Sélectionner le dossier du monorepo" 2>/dev/null`;
  } else {
    return NextResponse.json(
      { error: "OS non supporté pour la sélection de dossier" },
      { status: 400 }
    );
  }

  try {
    const path = await new Promise<string>((resolve, reject) => {
      exec(command, { timeout: 60000 }, (error, stdout) => {
        if (error) {
          reject(new Error("Sélection annulée"));
          return;
        }
        resolve(stdout.trim().replace(/\/$/, ""));
      });
    });

    return NextResponse.json({ path });
  } catch {
    return NextResponse.json({ cancelled: true }, { status: 200 });
  }
}
