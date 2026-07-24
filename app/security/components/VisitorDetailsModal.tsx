import { ActivityItem } from "@/types/activity";

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
 <div
 className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
 onClick={onClose}
 >
 <div
 className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-card p-6"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="text-center">
 <div
 className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ${visitorStatusConfig.color}`}
 >
 <StatusIcon className="h-10 w-10" />
 </div>

 <h2 className="mt-4 text-2xl font-bold">
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
 onClick={onClose}
 className="mt-6 w-full rounded-2xl bg-primary/100 px-4 py-3 font-semibold text-primary-foreground"
 >
 Close
 </button>
 </div>
 </div>
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
