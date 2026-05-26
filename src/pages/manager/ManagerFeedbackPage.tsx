import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { managerApi } from '@/services/managerApi';

export function ManagerFeedbackPage() {
  const { session } = useAuth();
  const { selectedBuilding, selectedBuildingId, setSelectedBuildingId, buildings, isLoading, error } = useManagerBuildings();
  const [feedbacks, setFeedbacks] = useState<Array<{ _id: string; subject?: string; status?: string; createdAt?: string; comment?: string }>>([]);
  const [responseText, setResponseText] = useState('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadFeedbacks = useCallback(async () => {
    if (!selectedBuildingId || !session?.token) {
      setFeedbacks([]);
      return;
    }

    try {
      const items = await managerApi.listFeedbacks(selectedBuildingId, session.token);
      setFeedbacks(items);
      if (items.length > 0 && !selectedFeedbackId) {
        setSelectedFeedbackId(items[0]._id);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to load feedbacks.');
    }
  }, [selectedBuildingId, session?.token, selectedFeedbackId]);

  useEffect(() => {
    void loadFeedbacks();
  }, [loadFeedbacks]);

  const selectedFeedback = feedbacks.find((item) => item._id === selectedFeedbackId) ?? null;

  const sendResponse = useCallback(async () => {
    if (!selectedBuildingId || !selectedFeedbackId || !session?.token || !responseText.trim()) {
      setNotice('Please select feedback and enter a reply.');
      return;
    }
    setIsSaving(true);
    setNotice(null);

    try {
      await managerApi.respondFeedback(selectedBuildingId, selectedFeedbackId, { response: responseText.trim() }, session.token);
      setResponseText('');
      setNotice('Response sent successfully.');
      await loadFeedbacks();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to send response.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedBuildingId, selectedFeedbackId, responseText, session?.token, loadFeedbacks]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading buildings...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : buildings.length === 0 ? (
            <p>No buildings to view feedback.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-700">Building</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400"
                  value={selectedBuildingId}
                  onChange={(event) => setSelectedBuildingId(event.target.value)}
                >
                  {buildings.map((building) => (
                    <option key={building._id} value={building._id}>
                      {building.name || building.code || 'Unnamed building'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700">Selected feedback</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400"
                  value={selectedFeedbackId}
                  onChange={(event) => setSelectedFeedbackId(event.target.value)}
                >
                  {feedbacks.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.subject || item.comment || item._id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFeedback ? (
        <Card>
          <CardHeader>
            <CardTitle>Feedback details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-slate-900">Subject</p>
              <p className="text-sm text-slate-600">{selectedFeedback.subject || 'No subject'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Content</p>
              <p className="text-sm text-slate-600">{selectedFeedback.comment || 'No content'}</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-slate-600">Manager response</label>
              <textarea
                value={responseText}
                onChange={(event) => setResponseText(event.target.value)}
                className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400"
                placeholder="Enter response to customer..."
              />
            </div>
            {notice ? <p className="text-sm text-slate-700">{notice}</p> : null}
            <Button onClick={sendResponse} disabled={isSaving || !responseText.trim()}>
              {isSaving ? 'Sending...' : 'Send response'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
