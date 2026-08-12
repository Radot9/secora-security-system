import { ActivityItem } from "@/types/activity";
import { AnimatedDialog } from "@/app/components/ui/AnimatedDialog";

interface VisitorDetailsModalProps {
 visitor: ActivityItem | null;
 visitorStatusConfig: {
 title: string;
 message: string;
 color: string;
 };
 StatusIcon: React.ElementType;
 onClose: () => void;
}

export default function VisitorDetailsModal({
 visitor,
 visitorStatusConfig,
 StatusIcon,
 onClose,
}: VisitorDetailsModalProps) {
 if (!visitor) return null;

 return (
 <AnimatedDialog
 open={Boolean(visitor)}
 onClose={onClose}
 labelledBy="visitor-details-title"
 surfaceClassName="max-w-lg p-5 sm:p-6"
 >
 <div className="text-center">
 <div
 className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ${visitorStatusConfig.color}`}
 >
 <StatusIcon className="h-10 w-10" />
 </div>

 <h2 id="visitor-details-title" className="mt-4 text-2xl font-bold">
 {visitorStatusConfig.title}
 </h2>

 <p className="mt-2 text-sm text-muted-foreground">
 {visitorStatusConfig.message}
 </p>
 </div>

 <div className="mt-8 overflow-hidden rounded-2xl border border-border">
 <div className="divide-y divide-border">

 <DetailRow label="Visitor" value={visitor.visitor_name} />

 <DetailRow
 label="Phone Number"
 value={visitor.visitor_phone || "N/A"}
 />

 <DetailRow
 label="Plate Number"
 value={visitor.plate_number || "N/A"}
 />

 <DetailRow
 label="Resident"
 value={visitor.resident_name || "N/A"}
 />

 <DetailRow
 label="Entry Time"
 value={
 visitor.entry_time
 ? new Date(visitor.entry_time).toLocaleString()
 : "Not entered"
 }
 />
 <DetailRow label="Checked In By" value={visitor.checked_in_by_name || "Not recorded"} />

 <DetailRow
 label="Exit Time"
 value={
 visitor.exit_time
 ? new Date(visitor.exit_time).toLocaleString()
 : "Still inside"
 }
 />
 <DetailRow label="Checked Out By" value={visitor.checked_out_by_name || "Not recorded"} />

 <DetailRow
 label="Expires"
 value={
 visitor.expires_at
 ? new Date(visitor.expires_at).toLocaleString()
 : "N/A"
 }
 />
 </div>
 </div>

 <button
 type="button"
 onClick={onClose}
 className="apple-primary-button mt-6 w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
 >
 Close
 </button>
 </AnimatedDialog>
 );
}

interface DetailRowProps {
 label: string;
 value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
 return (
 <div className="px-5 py-4">
 <p className="text-sm text-muted-foreground">{label}</p>
 <p className="mt-1 font-semibold">{value}</p>
 </div>
 );
}
