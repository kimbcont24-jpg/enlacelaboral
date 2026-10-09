import { createContext, useContext, useState, type ReactNode } from "react";

import { ApplyDialog } from "@/components/site/ApplyDialog";
import type { Vacante } from "@/lib/vacantes";

const ApplyContext = createContext<(job: Vacante) => void>(() => {});

export function useApply() {
  return useContext(ApplyContext);
}

export function ApplyProvider({ children }: { children: ReactNode }) {
  const [job, setJob] = useState<Vacante | null>(null);
  return (
    <ApplyContext.Provider value={setJob}>
      {children}
      <ApplyDialog job={job} onClose={() => setJob(null)} />
    </ApplyContext.Provider>
  );
}
