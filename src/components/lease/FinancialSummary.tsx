import { LeaseAnalysis } from "@/hooks/useLeaseStore";

interface Props {
  summary: LeaseAnalysis["financial_summary"];
  landlordName: string;
  propertyAddress: string;
  leaseType: string;
}

const Row = ({ label, value, notes, highlight }: { label: string; value: string; notes?: string; highlight?: boolean }) => (
  <div className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-border/30 last:border-b-0 ${highlight ? "bg-primary/5 -mx-2 px-2 rounded-lg" : ""}`}>
    <span className={`text-sm font-medium sm:w-48 flex-shrink-0 ${highlight ? "text-primary" : "text-foreground"}`}>{label}</span>
    <div className="flex-1">
      <span className={`text-sm ${highlight ? "font-semibold text-primary" : "text-foreground"}`}>{value}</span>
      {notes && notes !== "any relevant notes" && notes !== "N/A" && (
        <span className="block text-xs text-muted-foreground mt-0.5 italic">{notes}</span>
      )}
    </div>
  </div>
);

const FinancialSummary = ({ summary, landlordName, propertyAddress, leaseType }: Props) => {
  return (
    <div className="rounded-2xl border border-teal-500/30 bg-card overflow-hidden">
      <div className="border-l-4 border-teal-500 p-6 md:p-8">
        <h2 className="text-xl font-serif font-semibold mb-6 flex items-center gap-2">
          🏠 Financial Summary — Total Lease Cost
        </h2>

        {/* Monthly Costs */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Monthly Costs</h3>
          <Row
            label="Monthly Rent"
            value={summary.monthly_rent?.amount || "Not specified"}
            notes={`Due: ${summary.monthly_rent?.due_date || "N/A"} · Payment: ${summary.monthly_rent?.payment_methods || "N/A"}`}
          />
        </div>

        {/* Move-In Costs */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Move-In Costs</h3>
          <Row label="First Month's Rent" value={summary.move_in_costs?.first_month || "N/A"} />
          <Row label="Security Deposit" value={summary.security_deposit?.amount || "N/A"} notes={summary.security_deposit?.refund_conditions} />
          {summary.move_in_costs?.last_month && summary.move_in_costs.last_month !== "N/A" && summary.move_in_costs.last_month !== "Not required" && (
            <Row label="Last Month's Rent" value={summary.move_in_costs.last_month} />
          )}
          {summary.additional_deposits?.pet_deposit && summary.additional_deposits.pet_deposit !== "N/A" && summary.additional_deposits.pet_deposit !== "None" && (
            <Row label="Pet Deposit" value={summary.additional_deposits.pet_deposit} />
          )}
          {summary.move_in_costs?.other_fees && summary.move_in_costs.other_fees !== "N/A" && summary.move_in_costs.other_fees !== "None" && summary.move_in_costs.other_fees !== "$0" && (
            <Row label="Other Fees" value={summary.move_in_costs.other_fees} />
          )}
          <Row label="Total Move-In" value={summary.move_in_costs?.total_move_in || "N/A"} highlight />
        </div>

        {/* Total Lease Commitment */}
        <div className="mt-6 pt-6 border-t-2 border-teal-500/20 space-y-2">
          <Row label={`Total Rent (${summary.total_lease_cost?.lease_term || "N/A"})`} value={summary.total_lease_cost?.total_rent || "N/A"} />
          <Row label="Total Deposits & Fees" value={summary.total_lease_cost?.total_deposits || "N/A"} />
          <div className="mt-3 p-4 rounded-xl bg-teal-500/10 flex justify-between items-center">
            <span className="font-serif font-semibold text-foreground">Grand Total Commitment</span>
            <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
              {summary.total_lease_cost?.grand_total_commitment || "—"}
            </span>
          </div>
          {summary.total_lease_cost?.notes && summary.total_lease_cost.notes !== "any relevant notes" && (
            <p className="text-xs text-muted-foreground italic mt-2">{summary.total_lease_cost.notes}</p>
          )}
        </div>

        {/* Late Fees & Rent Increases */}
        <div className="mt-4 pt-4 border-t border-border/30 space-y-1">
          {summary.late_fees?.late_fee_amount && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Late fee:</span> {summary.late_fees.late_fee_amount}
              {summary.late_fees.grace_period && ` (grace period: ${summary.late_fees.grace_period})`}
            </p>
          )}
          {summary.rent_increases?.allowed === "Yes" && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Rent increases:</span> {summary.rent_increases.terms}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
