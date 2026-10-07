import webpush from 'web-push';
import { User } from '@/models/User';

// Configure Web Push with VAPID keys
webpush.setVapidDetails(
  'mailto:admin@queueless.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function sendWebPush(userId: string, title: string, body: string, url: string = '/') {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscription) {
      console.log('No push subscription found for user', userId);
      return false;
    }

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/icon-192x192.png' // Replace with your actual icon path
    });

    await webpush.sendNotification(user.pushSubscription, payload);
    return true;
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Subscription has expired or is no longer valid
      console.log('Push subscription expired for user', userId);
      await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
    } else {
      console.error('Error sending web push:', error);
    }
    return false;
  }
}
