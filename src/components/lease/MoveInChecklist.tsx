import { useState } from "react";
import { Check, Copy, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Props {
  items: string[];
  propertyAddress: string;
}

const MoveInChecklist = ({ items, propertyAddress }: Props) => {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleCopy = () => {
    const text = items.map((item, i) => `${checked.has(i) ? "✅" : "☐"} ${item}`).join("\n");
    navigator.clipboard.writeText(`Move-In Checklist — ${propertyAddress}\n\n${text}`);
    toast({ title: "Checklist copied to clipboard!" });
  };

  const handlePrint = () => {
    const printContent = `
      <html><head><title>Move-In Checklist — ${propertyAddress}</title>
      <style>body{font-family:system-ui;padding:40px;max-width:600px;margin:0 auto}
      h1{font-size:18px;margin-bottom:4px}p{color:#666;font-size:13px;margin-bottom:24px}
      li{list-style:none;padding:8px 0;border-bottom:1px solid #eee;font-size:14px}
      li::before{content:"☐ ";font-size:16px}</style></head>
      <body><h1>Move-In Checklist</h1><p>${propertyAddress}</p>
      <ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="rounded-2xl border border-teal-500/30 bg-teal-50/50 dark:bg-teal-900/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
            ✅ Your Move-In Checklist
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {checked.size}/{items.length} completed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-border mb-4">
        <div
          className="h-2 rounded-full bg-teal-500 transition-all duration-300"
          style={{ width: `${items.length > 0 ? (checked.size / items.length) * 100 : 0}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i}>
            <button
              onClick={() => toggle(i)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                checked.has(i) ? "bg-teal-100/50 dark:bg-teal-900/20" : "hover:bg-card"
              }`}
            >
              <span
                className={`w-5 h-5 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  checked.has(i)
                    ? "bg-teal-500 border-teal-500 text-white"
                    : "border-border"
                }`}
              >
                {checked.has(i) && <Check className="w-3 h-3" />}
              </span>
              <span className={`text-sm ${checked.has(i) ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MoveInChecklist;
