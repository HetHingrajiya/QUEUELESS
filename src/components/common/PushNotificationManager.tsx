"use client";
import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        setSubscription(sub);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!publicVapidKey) {
        console.error("VAPID public key not found");
        return;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      
      setSubscription(sub);
      setIsSubscribed(true);
      
      // Send to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub })
      });
      
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
    }
  }

  if (!isSupported) return null;

  return (
    <button 
      onClick={subscribeToPush}
      disabled={isSubscribed}
      className={`flex items-center space-x-2 text-sm px-3 py-1.5 rounded-md border ${
        isSubscribed 
          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default' 
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer'
      }`}
    >
      {isSubscribed ? <Bell size={16} /> : <BellOff size={16} />}
      <span>{isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}</span>
    </button>
  );
}
