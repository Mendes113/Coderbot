import { useState } from "react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const generateMock = (i: number, userId = 'dev-user') => ({
  id: `mock-${Date.now()}-${i}`,
  title: `Mensagem de teste ${i}`,
  content: `Conteúdo de teste ${i}`,
  type: 'info',
  read: false,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  recipient: userId,
  sender: 'system',
  expand: { sender: { id: 'system', name: 'Sistema', collectionId: 'users' } }
});

export default function NotificationsTest() {
  const [mocks, setMocks] = useState(() => [generateMock(1)]);
  const [userId] = useState('dev-user');

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Notification Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Use this page to test the NotificationCenter component locally. Click the button to add mock notifications.</p>
          </div>

          <div className="flex gap-2 mb-4">
            <Button onClick={() => setMocks(prev => [generateMock(prev.length + 1, userId), ...prev])}>Add Mock Notification</Button>
            <Button variant="outline" onClick={() => setMocks([])}>Clear</Button>
          </div>

          <div className="mb-6">
            <NotificationCenter userId={userId} mockMode mockNotifications={mocks} />
          </div>

          <div className="space-y-2">
            {mocks.map(m => (
              <div key={m.id} className="p-2 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{m.content}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
