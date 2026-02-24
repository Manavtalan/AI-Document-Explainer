import { OfferLetterAnalysis } from "@/hooks/useOfferLetterStore";

interface Props {
  summary: OfferLetterAnalysis["total_compensation_summary"];
}

const Row = ({ label, value, sub, notes }: { label: string; value: string; sub?: string; notes?: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-border/30 last:border-b-0">
    <span className="text-sm font-medium text-foreground sm:w-40 flex-shrink-0">{label}</span>
    <div className="flex-1">
      <span className="text-sm text-foreground">{value}</span>
      {sub && <span className="block text-xs text-muted-foreground mt-0.5">{sub}</span>}
      {notes && notes !== "any relevant notes" && (
        <span className="block text-xs text-muted-foreground mt-0.5 italic">{notes}</span>
      )}
    </div>
  </div>
);

const CompensationSummary = ({ summary }: Props) => {
  return (
    <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden">
      <div className="border-l-4 border-primary p-6 md:p-8">
        <h2 className="text-xl font-serif font-semibold mb-6 flex items-center gap-2">
          💰 Total Compensation Summary
        </h2>

        <div className="space-y-0">
          <Row
            label="Base Salary"
            value={summary.base_salary?.annual || "Not specified"}
            sub={
              summary.base_salary?.monthly && summary.base_salary?.per_paycheck
                ? `${summary.base_salary.monthly}/mo · ${summary.base_salary.per_paycheck}`
                : undefined
            }
            notes={summary.base_salary?.notes}
          />
          <Row
            label="Equity"
            value={
              summary.equity?.type !== "None"
                ? `${summary.equity?.total_grant || ""} (${summary.equity?.type || ""})`
                : "None"
            }
            sub={
              summary.equity?.estimated_value
                ? `Est. value: ${summary.equity.estimated_value} · Year 1: ${summary.equity.year_1_value || "N/A"}`
                : undefined
            }
            notes={summary.equity?.notes}
          />
          <Row
            label="Signing Bonus"
            value={summary.signing_bonus?.amount || "None"}
            sub={summary.signing_bonus?.clawback || undefined}
            notes={summary.signing_bonus?.notes}
          />
          <Row
            label="Performance Bonus"
            value={summary.performance_bonus?.target || "None"}
            sub={summary.performance_bonus?.type || undefined}
            notes={summary.performance_bonus?.notes}
          />
          <Row
            label="Benefits"
            value={summary.benefits_estimate?.annual_value || "Not specified"}
            sub={summary.benefits_estimate?.breakdown || undefined}
            notes={summary.benefits_estimate?.notes}
          />
        </div>

        {/* Totals */}
        <div className="mt-6 pt-6 border-t-2 border-primary/20 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-serif font-semibold text-foreground">
              Total Year 1 Compensation
            </span>
            <span className="text-lg font-semibold text-primary">
              {summary.total_year_1 || "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Ongoing Annual</span>
            <span className="text-sm font-medium text-primary">
              {summary.total_annual_ongoing || "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompensationSummary;
