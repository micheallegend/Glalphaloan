// Device Notification service for G.L Alpha King Loans
// Supports native browser/mobile device notifications, service worker registration, and audio chime

export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Second tone (higher chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.debug('Audio chime notification omitted:', err);
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    // Legacy callback fallback
    return new Promise((resolve) => {
      Notification.requestPermission((status) => {
        resolve(status);
      });
    });
  }
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<void> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Notification Service Worker registered successfully');
    } catch (err) {
      console.warn('Failed to register Notification Service Worker:', err);
    }
  }
}

export async function sendDeviceNotification(title: string, body: string, tag?: string): Promise<boolean> {
  // Always trigger audio chime
  playNotificationSound();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body,
    icon: 'https://api.iconify.design/lucide:shield-check.svg?color=%23f59e0b',
    badge: 'https://api.iconify.design/lucide:bell.svg?color=%23f59e0b',
    tag: tag || `gl-loans-${Date.now()}`,
    renotify: true,
  };

  // Try service worker first (best for mobile devices / Android Chrome)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return true;
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback to standard window Notification
  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
    };
    return true;
  } catch (err) {
    console.warn('Device notification error:', err);
    return false;
  }
}
