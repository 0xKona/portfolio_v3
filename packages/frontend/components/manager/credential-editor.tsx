"use client";

import { TerminalInput, TerminalButton } from "@/components/ui";
import type { DemoCredential } from "@/types/schema";

interface CredentialEditorProps {
  credentials: DemoCredential[];
  onChange: (credentials: DemoCredential[]) => void;
}

const EMPTY_CREDENTIAL: DemoCredential = {
  name: "",
  desc: "",
  user: "",
  pass: "",
};

export function CredentialEditor({
  credentials,
  onChange,
}: CredentialEditorProps) {
  const updateCredential = (
    index: number,
    patch: Partial<DemoCredential>,
  ) => {
    onChange(
      credentials.map((cred, i) => (i === index ? { ...cred, ...patch } : cred)),
    );
  };

  const removeCredential = (index: number) => {
    onChange(credentials.filter((_, i) => i !== index));
  };

  const addCredential = () => {
    onChange([...credentials, { ...EMPTY_CREDENTIAL }]);
  };

  return (
    <div>
      <label className="block text-neutral-500 text-xs font-mono mb-2">
        demo credentials
      </label>

      {credentials.map((cred, index) => (
        <div key={index} className="border border-neutral-700 p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-500 text-xs font-mono">
              credential {index + 1}
            </span>
            <TerminalButton
              type="button"
              variant="ghost"
              onClick={() => removeCredential(index)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              × remove
            </TerminalButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TerminalInput
              label="name *"
              value={cred.name}
              onChange={(e) => updateCredential(index, { name: e.target.value })}
              placeholder="site access..."
            />
            <TerminalInput
              label="description"
              value={cred.desc ?? ""}
              onChange={(e) => updateCredential(index, { desc: e.target.value })}
              placeholder="required to access site..."
            />
            <TerminalInput
              label="user *"
              value={cred.user}
              onChange={(e) => updateCredential(index, { user: e.target.value })}
              placeholder="testing"
              autoComplete="off"
            />
            <TerminalInput
              label="pass *"
              value={cred.pass}
              onChange={(e) => updateCredential(index, { pass: e.target.value })}
              placeholder="testing"
              autoComplete="off"
            />
          </div>
        </div>
      ))}

      <TerminalButton
        type="button"
        variant="secondary"
        onClick={addCredential}
        prefix="+"
      >
        add credential ({credentials.length})
      </TerminalButton>
    </div>
  );
}