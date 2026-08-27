// Browser Notification Utility for Stoque+
// Handles native OS/Browser notifications for background tabs

const PREF_KEY = 'stoque_browser_notifications_enabled';

/**
 * Checks if Notification API is supported in the current environment
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets current browser notification permission
 */
export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests browser notification permission
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setBrowserNotificationsEnabled(true);
    }
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return Notification.permission;
  }
}

/**
 * Checks if browser notifications are enabled by user preference
 */
export function isBrowserNotificationsEnabled(): boolean {
  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  const pref = localStorage.getItem(PREF_KEY);
  return pref === null ? true : pref === 'true';
}

/**
 * Sets user preference for browser notifications
 */
export function setBrowserNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(PREF_KEY, String(enabled));
}

/**
 * Plays a subtle, pleasing dual-tone chime using Web Audio API
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2 (Harmonic chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignore audio errors on autoplay restrictions
  }
}

interface BrowserNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  data?: any;
  playSound?: boolean;
  onClick?: () => void;
}

/**
 * Sends a native browser notification
 */
export function sendBrowserNotification({
  title,
  body,
  tag,
  icon = '/favicon.svg',
  data,
  playSound = true,
  onClick
}: BrowserNotificationOptions): Notification | null {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  if (!isBrowserNotificationsEnabled()) {
    return null;
  }

  try {
    if (playSound) {
      playNotificationSound();
    }

    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: tag || `stoque-${Date.now()}`,
      data
    });

    notification.onclick = () => {
      try {
        window.focus();
      } catch {
        // Ignore focus errors
      }
      if (onClick) {
        onClick();
      }
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Error dispatching browser notification:', error);
    return null;
  }
}

/**
 * Specific notification for new Shipment Created
 */
export function notifyShipmentCreated(shipment: any, onNavigate?: () => void) {
  const code = shipment?.id ? String(shipment.id).slice(0, 8).toUpperCase() : 'Novo';
  const typeStr = shipment?.type ? `(${shipment.type})` : '';
  sendBrowserNotification({
    title: '📦 Novo Carregamento Criado',
    body: `Carregamento #${code} ${typeStr} gerado e pronto para operação.`,
    tag: `shipment-${shipment?.id || Date.now()}`,
    onClick: onNavigate
  });
}

/**
 * Specific notification for Pending Approval
 */
export function notifyPendingApproval(request: any, onNavigate?: () => void) {
  const requester = request?.requested_by || request?.requestedBy || 'Operador';
  const reason = request?.reason ? `\nMotivo: ${request.reason}` : '';
  sendBrowserNotification({
    title: '⏳ Nova Solicitação de Aprovação',
    body: `Solicitação enviada por ${requester}.${reason}`,
    tag: `approval-${request?.id || Date.now()}`,
    onClick: onNavigate
  });
}

/**
 * Specific notification for Pending Analysis
 */
export function notifyPendingAnalysis(item: any, onNavigate?: () => void) {
  const loading = item?.loading_id ? `Carregamento #${item.loading_id}` : 'Novo pallet';
  const op = item?.origin_op ? ` (OP: ${item.origin_op})` : '';
  sendBrowserNotification({
    title: '🔍 Novo Pallet Aguardando Análise',
    body: `${loading}${op} recebido e pronto para inspeção e conferência.`,
    tag: `analysis-${item?.id || Date.now()}`,
    onClick: onNavigate
  });
}

/**
 * Specific notification for Completed Movement
 */
export function notifyMovementDone(entry: any, onNavigate?: () => void) {
  const desc = entry?.description || entry?.type || 'Movimentação realizada';
  const palletInfo = entry?.palletNumber ? `Pallet: #${entry.palletNumber}` : '';
  const opInfo = entry?.op ? ` | OP: ${entry.op}` : '';
  
  sendBrowserNotification({
    title: '🔄 Nova Movimentação Realizada',
    body: `${desc} ${palletInfo}${opInfo}`.trim(),
    tag: `movement-${entry?.id || Date.now()}`,
    onClick: onNavigate
  });
}
