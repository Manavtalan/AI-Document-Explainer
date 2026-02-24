import { ContractAnalysis } from "@/hooks/useContractStore";

interface Props {
  summary: ContractAnalysis["key_terms_summary"];
  partyA: string;
  partyB: string;
}

const Row = ({ label, value, notes }: { label: string; value: string; notes?: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-border/30 last:border-b-0">
    <span className="text-sm font-medium text-foreground sm:w-44 flex-shrink-0">{label}</span>
    <div className="flex-1">
      <span className="text-sm text-foreground">{value}</span>
      {notes && notes !== "any relevant notes" && notes !== "N/A" && (
        <span className="block text-xs text-muted-foreground mt-0.5 italic">{notes}</span>
      )}
    </div>
  </div>
);

const KeyTermsSummary = ({ summary, partyA, partyB }: Props) => {
  return (
    <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden">
      <div className="border-l-4 border-primary p-6 md:p-8">
        <h2 className="text-xl font-serif font-semibold mb-6 flex items-center gap-2">
          📋 Key Terms Summary
        </h2>

        <div className="space-y-0">
          <Row label="Party A" value={partyA || "Not specified"} />
          <Row label="Party B" value={partyB || "Not specified"} />
          <Row
            label="Contract Value"
            value={summary.contract_value?.amount || "Not specified"}
            notes={summary.contract_value?.notes}
          />
          <Row
            label="Payment Terms"
            value={summary.payment_schedule?.terms || "Not specified"}
            notes={summary.payment_schedule?.notes}
          />
          <Row
            label="Effective Date"
            value={summary.effective_date?.date || "Not specified"}
            notes={summary.effective_date?.notes}
          />
          <Row
            label="Termination Date"
            value={summary.termination_date?.date || "Not specified"}
            notes={summary.termination_date?.notes}
          />
          <Row
            label="Governing Law"
            value={summary.governing_law?.jurisdiction || "Not specified"}
            notes={summary.governing_law?.notes}
          />
        </div>
      </div>
    </div>
  );
};

export default KeyTermsSummary;
