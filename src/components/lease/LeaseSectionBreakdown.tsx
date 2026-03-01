import { useState } from "react";
import { ChevronDown, Check, AlertTriangle, X, Minus, Lightbulb } from "lucide-react";
import { LeaseSection } from "@/hooks/useLeaseStore";

interface Props {
  sections: LeaseSection[];
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

const SectionCard = ({ section }: { section: LeaseSection }) => {
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
          {section.original_text && section.original_text !== "Not found in lease agreement" && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">What Your Lease Says:</p>
              <blockquote className="border-l-2 border-border pl-3 py-2 bg-muted/30 rounded-r-lg text-sm italic text-muted-foreground">
                {section.original_text}
              </blockquote>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">What This Means For You:</p>
            <p className="text-sm text-foreground leading-relaxed">{section.explanation}</p>
          </div>

          {section.key_figures && section.key_figures.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Key Figures:</p>
              <div className="flex flex-wrap gap-2">
                {section.key_figures.map((fig, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 font-medium">
                    {fig}
                  </span>
                ))}
              </div>
            </div>
          )}

          {section.tenant_tip && (
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
              <p className="text-xs font-medium text-teal-700 dark:text-teal-400 mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Tenant Tip:
              </p>
              <p className="text-sm text-teal-800 dark:text-teal-300">{section.tenant_tip}</p>
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

const LeaseSectionBreakdown = ({ sections }: Props) => {
  const [sortByImportance, setSortByImportance] = useState(true);

  const displayed = sortByImportance
    ? [...sections].sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3))
    : sections;

  const counts = {
    red: sections.filter((s) => s.status === "red").length,
    yellow: sections.filter((s) => s.status === "yellow").length,
    missing: sections.filter((s) => s.status === "missing").length,
    green: sections.filter((s) => s.status === "green").length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h2 className="text-lg font-serif font-semibold">Section-by-Section Breakdown</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sections.length} sections analyzed · {counts.red} risks · {counts.yellow} cautions · {counts.missing} missing · {counts.green} standard
          </p>
        </div>
        <button
          onClick={() => setSortByImportance(!sortByImportance)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sort: {sortByImportance ? "By Importance" : "As Written"}
        </button>
      </div>

      <div className="space-y-3">
        {displayed.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
};

export default LeaseSectionBreakdown;
