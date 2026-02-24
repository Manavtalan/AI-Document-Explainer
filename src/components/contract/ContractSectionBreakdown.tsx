import { useState } from "react";
import { ChevronDown, Check, AlertTriangle, X, Minus } from "lucide-react";
import { ContractSection } from "@/hooks/useContractStore";

interface Props {
  sections: ContractSection[];
}

const statusConfig = {
  green: {
    border: "border-l-green-500",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: Check,
    label: "Standard",
  },
  yellow: {
    border: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    icon: AlertTriangle,
    label: "Caution",
  },
  red: {
    border: "border-l-red-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: X,
    label: "Risk",
  },
  missing: {
    border: "border-l-gray-400",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    icon: Minus,
    label: "Missing",
  },
};

const statusOrder = { red: 0, yellow: 1, missing: 2, green: 3 };

const SectionCard = ({ section }: { section: ContractSection }) => {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[section.status] || statusConfig.green;
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border bg-card overflow-hidden border-l-4 ${config.border}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-muted/30 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
            <Icon className="w-3 h-3" />
            {section.status_label || config.label}
          </span>
          <h3 className="font-medium text-foreground">{section.title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 md:px-5 pb-5 space-y-4 animate-fade-in">
          {section.original_text && section.original_text !== "Not found in contract" && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">What Your Contract Says:</p>
              <blockquote className="border-l-2 border-border pl-3 py-2 bg-muted/30 rounded-r-lg text-sm italic text-muted-foreground">
                {section.original_text}
              </blockquote>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">What This Means:</p>
            <p className="text-sm text-foreground leading-relaxed">{section.explanation}</p>
          </div>

          {section.key_figures && section.key_figures.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Key Figures:</p>
              <div className="flex flex-wrap gap-2">
                {section.key_figures.map((fig, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {fig}
                  </span>
                ))}
              </div>
            </div>
          )}

          {section.action_items && section.action_items.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Action Items:</p>
              <ul className="space-y-1.5">
                {section.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="w-4 h-4 mt-0.5 rounded border border-border flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ContractSectionBreakdown = ({ sections }: Props) => {
  const [allExpanded, setAllExpanded] = useState(false);

  const sorted = [...sections].sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-serif font-semibold">Section-by-Section Breakdown</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sections sorted by importance — issues first.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAllExpanded(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Expand All
          </button>
          <span className="text-xs text-muted-foreground">|</span>
          <button onClick={() => setAllExpanded(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
};

export default ContractSectionBreakdown;
