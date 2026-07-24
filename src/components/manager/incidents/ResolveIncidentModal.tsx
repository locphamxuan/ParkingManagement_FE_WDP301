import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { managerApi, type ViolationType } from '@/services/manager/managerApi';

export interface ResolveIncidentTarget {
  _id: string;
  code?: string;
  type?: string;
  note?: string;
  target?: string;
  slot?: { code?: string } | null;
  reportedBy?: { fullName?: string } | null;
  status?: string;
  violatorPlate?: string;
  plateAccountFound?: boolean | null;
  penaltyFee?: number | null;
  paymentMethod?: string | null;
  resolutionNote?: string;
}

export type ResolveIncidentStatus = 'open' | 'investigating' | 'escalated' | 'penalty_pending' | 'resolved' | 'closed';

export interface ResolveIncidentPayload {
  status?: ResolveIncidentStatus;
  resolutionNote: string;
  violatorPlate?: string;
  /** Chỉ DUYỆT số tiền — không thu ngay, không chọn phương thức thanh toán ở đây.
   * Staff thu thật + chọn phương thức lúc check-out xe vi phạm tại cổng. */
  action?: 'penalize_violator';
  penaltyFee?: number;
}

interface ResolveIncidentModalProps {
  /** staff không được set phí phạt (rule: chỉ manager) — ẩn toàn bộ phần "Penalize Violator". */
  role: 'staff' | 'manager';
  /** Cần để tra bảng giá vi phạm (chỉ dùng khi role='manager'). */
  buildingId: string;
  incident: ResolveIncidentTarget;
  saving: boolean;
  message: { type: 'ok' | 'err'; text: string } | null;
  onClose: () => void;
  onSubmit: (payload: ResolveIncidentPayload) => void;
}

/**
 * Modal xử lý sự cố dùng chung Staff/Manager. Incident `escalated` (biển vi phạm
 * không có account trong building) → staff chỉ xem read-only, chỉ manager xử lý được.
 */
export function ResolveIncidentModal({ role, buildingId, incident, saving, message, onClose, onSubmit }: ResolveIncidentModalProps) {
  const isEscalatedReadonly = role === 'staff' && incident.status === 'escalated';

  const resolvedDefaultStatus = (s?: string): ResolveIncidentStatus =>
    s === 'open' || s === 'investigating' || !s ? 'resolved' : (s as ResolveIncidentStatus);

  const [status, setStatus] = useState<ResolveIncidentStatus>(resolvedDefaultStatus(incident.status));
  const [resolutionNote, setResolutionNote] = useState(incident.resolutionNote || '');
  const [violatorPlate, setViolatorPlate] = useState(incident.violatorPlate || '');
  const [penalizeViolator, setPenalizeViolator] = useState(false);
  const [penaltyFee, setPenaltyFee] = useState('');
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);

  // Reset lại khi mở incident khác.
  useEffect(() => {
    setStatus(resolvedDefaultStatus(incident.status));
    setResolutionNote(incident.resolutionNote || '');
    setViolatorPlate(incident.violatorPlate || '');
    setPenalizeViolator(false);
    setPenaltyFee('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incident._id]);

  // Bảng giá vi phạm — chỉ manager mới duyệt phạt được nên chỉ fetch cho role đó.
  useEffect(() => {
    if (role !== 'manager' || !buildingId) return;
    managerApi.violationTypes.list(buildingId, true)
      .then((res) => setViolationTypes(res.data.items ?? []))
      .catch(() => setViolationTypes([]));
  }, [role, buildingId]);

  const handleEscalate = () => {
    onSubmit({ status: 'escalated', resolutionNote: resolutionNote.trim() || 'Escalated to manager for review.' });
  };

  // type khớp 1 ViolationType đã cấu hình → phí bị ép theo bảng giá, không cho nhập tay
  // (chặn manager set phí tuỳ tiện). Chỉ 'other' (hoặc type không còn khớp bảng giá,
  // vd incident cũ) mới cần/được nhập tay.
  const matchedViolationType = violationTypes.find((v) => v.code === incident.type) ?? null;
  const requiresManualFee = incident.type === 'other' || !matchedViolationType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ResolveIncidentPayload = {
      status,
      resolutionNote: resolutionNote.trim(),
      violatorPlate: violatorPlate.trim() || undefined,
    };
    if (penalizeViolator) {
      payload.action = 'penalize_violator';
      // Chỉ gửi penaltyFee khi cần nhập tay — type đã khớp bảng giá thì để BE tự áp
      // đúng ViolationType.fee (gửi lên cũng bị BE bỏ qua, nhưng không gửi cho rõ ràng).
      if (requiresManualFee && penaltyFee.trim()) payload.penaltyFee = Number(penaltyFee);
    }
    onSubmit(payload);
  };

  // Hiện phần "Approve Penalty" khi type khớp bảng giá vi phạm HOẶC là 'other' — các
  // loại sự cố tự thân (vehicle_damaged, facility_issue...) không có khái niệm phạt.
  const canPenalize = Boolean(matchedViolationType) || incident.type === 'other';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">Resolve Incident {incident.code}</h3>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Reporter: {incident.reportedBy?.fullName || 'User'}</p>

        {message && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-bold ${message.type === 'ok' ? 'bg-emerald-50 border-emerald-250 text-emerald-800' : 'bg-rose-50 border-rose-250 text-rose-800'}`}>
            {message.text}
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2 text-xs">
          <div>
            <span className="text-slate-450 font-bold block uppercase tracking-wider text-[9px] mb-1">Customer Description</span>
            <p className="text-slate-800 font-semibold italic bg-white p-2.5 rounded-xl border border-slate-100">{incident.note || '(No descriptive note provided)'}</p>
          </div>
          {incident.target && (
            <div className="flex justify-between pt-1">
              <span className="text-slate-550 font-semibold">Incident Target (Plate/Zone)</span>
              <span className="font-extrabold font-mono text-slate-800">{incident.target}</span>
            </div>
          )}
          {incident.slot?.code && (
            <div className="flex justify-between">
              <span className="text-slate-550 font-semibold">Related Slot</span>
              <span className="font-extrabold text-blue-600">Slot {incident.slot.code}</span>
            </div>
          )}
          {incident.plateAccountFound !== undefined && incident.plateAccountFound !== null && (
            <div className="flex justify-between">
              <span className="text-slate-550 font-semibold">Violator Plate Account</span>
              <span className={`font-extrabold ${incident.plateAccountFound ? 'text-emerald-600' : 'text-amber-600'}`}>
                {incident.plateAccountFound ? 'Registered in this building' : 'Not registered — manager only'}
              </span>
            </div>
          )}
          {incident.penaltyFee != null && (
            <div className="flex justify-between pt-1 border-t border-slate-100">
              <span className="text-slate-550 font-semibold">
                {incident.status === 'penalty_pending' ? 'Penalty approved (awaiting checkout)' : 'Penalty collected'}
              </span>
              <span className="font-extrabold text-rose-600">
                {incident.penaltyFee.toLocaleString('en-US')} VND
                {incident.paymentMethod ? ` (${incident.paymentMethod})` : ''}
              </span>
            </div>
          )}
        </div>

        {isEscalatedReadonly ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800">
            This incident was auto-escalated — the violator plate has no registered account in this building.
            Only a manager can resolve or penalize it. You can view details but not take action here.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Incident Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ResolveIncidentStatus)}
                disabled={penalizeViolator}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="investigating">Investigating</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              {penalizeViolator && (
                <p className="text-[10px] text-slate-400 font-semibold">
                  Approving a penalty moves the incident to "Penalty Pending" until a staff member collects it at check-out.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Resolution Note</label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe details of the resolution/investigation..."
                className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            {role === 'manager' && canPenalize && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="penalize"
                    checked={penalizeViolator}
                    onChange={(e) => setPenalizeViolator(e.target.checked)}
                    className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="penalize" className="text-xs font-black text-rose-800 select-none">
                    Approve Penalty Fee for Offending Vehicle
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold">
                  This only approves the amount — a staff member collects it (cash or wallet, their choice) when the
                  vehicle checks out at the gate. The incident stays open until then.
                </p>

                {penalizeViolator && (
                  <div className="grid gap-3 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black tracking-wider text-rose-600 block mb-1">Violator Plate</label>
                        <Input
                          placeholder="E.g. 59G2-038.80"
                          value={violatorPlate}
                          onChange={(e) => setViolatorPlate(e.target.value)}
                          className="h-9 rounded-lg border-rose-200 bg-white text-xs font-bold text-slate-800"
                          required={penalizeViolator}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black tracking-wider text-rose-600 block mb-1">Fine Amount (VND)</label>
                        {requiresManualFee ? (
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={penaltyFee}
                            onChange={(e) => setPenaltyFee(e.target.value)}
                            className="h-9 rounded-lg border-rose-200 bg-white text-xs font-bold text-slate-800"
                            required
                          />
                        ) : (
                          <div className="h-9 flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700">
                            {matchedViolationType?.fee.toLocaleString('en-US')} VND (from price list)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2.5">
              {role === 'staff' && (
                <Button
                  type="button"
                  onClick={handleEscalate}
                  disabled={saving}
                  variant="outline"
                  className="h-10 px-4 rounded-xl border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100"
                >
                  Escalate to Manager
                </Button>
              )}
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="h-10 px-5 rounded-xl border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : 'Apply Resolution'}
              </Button>
            </div>
          </form>
        )}

        {isEscalatedReadonly && (
          <div className="pt-4 flex justify-end">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="h-10 px-5 rounded-xl border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
