/**
 * WhatsApp Demo Dataset
 * A realistic, rich, and interactive simulated WhatsApp conversation dataset
 * encompassing group chats, personal chats, business accounts, media (images, voice notes, documents, locations, stickers, and quoted replies).
 */

const DEMO_CHATS = [
  {
    id: 'group_dev_team',
    jid: '15551234567-1609459200@g.us',
    name: 'Our Dev Team 🚀',
    isGroup: true,
    avatar: null,
    avatarColor: '#128c7e',
    pinned: true,
    unreadCount: 2,
    onlineStatus: 'Sarah, Alex, Ryan, Diana, You',
    about: 'Our Web & AI Engineering Team. Weekly standup every Monday at 9:00 AM.',
    participants: [
      { jid: '15551122334@s.whatsapp.net', name: 'Sarah Amanda (Lead UI)', color: '#e542a3' },
      { jid: '15552233445@s.whatsapp.net', name: 'Alex Turner (Backend)', color: '#1f7aec' },
      { jid: '15553344556@s.whatsapp.net', name: 'Ryan Cooper (DevOps)', color: '#00a884' },
      { jid: '15554455667@s.whatsapp.net', name: 'Diana Price (QA)', color: '#e2881a' }
    ],
    messages: [
      {
        id: 'msg_101',
        fromMe: false,
        senderJid: '15551122334@s.whatsapp.net',
        senderName: 'Sarah Amanda (Lead UI)',
        senderColor: '#e542a3',
        timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
        type: 'text',
        text: 'Hey team! The new WhatsApp DB Viewer design review is complete. It is crafted to look and feel just like authentic WhatsApp Web! 🎨✨',
        status: 2
      },
      {
        id: 'msg_102',
        fromMe: false,
        senderJid: '15552233445@s.whatsapp.net',
        senderName: 'Alex Turner (Backend)',
        senderColor: '#1f7aec',
        timestamp: Date.now() - 1000 * 60 * 60 * 4.8,
        type: 'text',
        text: 'Awesome Sarah! The Crypt12, Crypt14 & Crypt15 decryption algorithms run 100% inside the browser via WebCrypto API. Zero external server dependencies 👍',
        status: 2
      },
      {
        id: 'msg_103',
        fromMe: true,
        timestamp: Date.now() - 1000 * 60 * 60 * 4.5,
        type: 'text',
        text: 'Fantastic! So any SQLite msgstore.db database can be opened instantly and all user data stays 100% secure and private on their local machine.',
        status: 2 // double blue check
      },
      {
        id: 'msg_104',
        fromMe: false,
        senderJid: '15551122334@s.whatsapp.net',
        senderName: 'Sarah Amanda (Lead UI)',
        senderColor: '#e542a3',
        timestamp: Date.now() - 1000 * 60 * 60 * 4.2,
        type: 'image',
        text: 'Here is the mockup of the dark mode and light mode interfaces. The border radius and doodle background match the real app:',
        media: {
          url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23111b21"/><stop offset="100%" stop-color="%23202c33"/></linearGradient></defs><rect width="600" height="340" fill="url(%23g1)" rx="16"/><rect x="40" y="40" width="220" height="260" rx="12" fill="%23222e35" stroke="%2300a884" stroke-width="2"/><circle cx="80" cy="80" r="22" fill="%2300a884"/><text x="115" y="85" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="14">WhatsApp UI</text><rect x="60" y="125" width="180" height="36" rx="8" fill="%23005c4b"/><text x="75" y="148" fill="%23e9edef" font-family="sans-serif" font-size="12">Encrypted Message ✓✓</text><rect x="60" y="175" width="160" height="36" rx="8" fill="%23202c33"/><text x="75" y="198" fill="%23d1d7db" font-family="sans-serif" font-size="12">Incoming Reply</text><rect x="300" y="40" width="260" height="260" rx="12" fill="%23efeae2" stroke="%2325d366" stroke-width="2"/><rect x="320" y="125" width="220" height="42" rx="8" fill="%23d9fdd3"/><text x="335" y="152" fill="%23111b21" font-family="sans-serif" font-size="13">Native Light Mode Theme</text></svg>',
          caption: 'WhatsApp Web Mockup - Pixel Perfect Fidelity',
          size: '142 KB',
          filename: 'wa_viewer_preview.png'
        },
        status: 2
      },
      {
        id: 'msg_105',
        fromMe: false,
        senderJid: '15553344556@s.whatsapp.net',
        senderName: 'Ryan Cooper (DevOps)',
        senderColor: '#00a884',
        timestamp: Date.now() - 1000 * 60 * 60 * 3.5,
        type: 'audio',
        audioDuration: 28, // seconds
        status: 2,
        replyTo: {
          senderName: 'Sarah Amanda (Lead UI)',
          text: 'Here is the mockup of the dark mode and light mode interfaces...'
        }
      },
      {
        id: 'msg_106',
        fromMe: true,
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        type: 'text',
        text: 'Great! I also included In-Chat Search and conversation filters (All, Unread, Groups, Contacts).',
        status: 2
      },
      {
        id: 'msg_107',
        fromMe: false,
        senderJid: '15554455667@s.whatsapp.net',
        senderName: 'Diana Price (QA)',
        senderColor: '#e2881a',
        timestamp: Date.now() - 1000 * 60 * 25,
        type: 'document',
        media: {
          filename: 'WhatsApp_Parser_Test_Report_v2.pdf',
          size: '1.8 MB',
          ext: 'PDF'
        },
        text: 'Here is the test case checklist for modern and legacy SQLite schemas team 📄',
        status: 2
      },
      {
        id: 'msg_108',
        fromMe: false,
        senderJid: '15552233445@s.whatsapp.net',
        senderName: 'Alex Turner (Backend)',
        senderColor: '#1f7aec',
        timestamp: Date.now() - 1000 * 60 * 5,
        type: 'text',
        text: 'Ready for release! Users just need to upload their database file and key to start viewing chat history.',
        status: 1
      }
    ]
  },
  {
    id: 'chat_david',
    jid: '15552345678@s.whatsapp.net',
    name: 'David Miller',
    isGroup: false,
    phone: '+1 (555) 234-5678',
    avatar: null,
    avatarColor: '#25d366',
    pinned: true,
    unreadCount: 1,
    onlineStatus: 'online',
    about: 'Available on WhatsApp. Feel free to reach out!',
    messages: [
      {
        id: 'msg_201',
        fromMe: false,
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // yesterday
        type: 'text',
        text: 'Hey man, you asked for the WhatsApp database backup file yesterday, right? Do you still need it?',
        status: 2
      },
      {
        id: 'msg_202',
        fromMe: true,
        timestamp: Date.now() - 1000 * 60 * 60 * 23.5,
        type: 'text',
        text: 'Yes, absolutely! I want to inspect it with the new WA Viewer. You have the key file from /data/data/com.whatsapp/files/key, right?',
        status: 2
      },
      {
        id: 'msg_203',
        fromMe: false,
        timestamp: Date.now() - 1000 * 60 * 60 * 23,
        type: 'audio',
        audioDuration: 42,
        status: 2
      },
      {
        id: 'msg_204',
        fromMe: true,
        timestamp: Date.now() - 1000 * 60 * 60 * 22,
        type: 'text',
        text: 'Awesome, just listened to your voice note. It turns out ADB extraction is super straightforward.',
        status: 2,
        replyTo: {
          senderName: 'David Miller',
          text: 'Voice Note (0:42)'
        }
      },
      {
        id: 'msg_205',
        fromMe: false,
        timestamp: Date.now() - 1000 * 60 * 12,
        type: 'text',
        text: 'Great! Don\'t forget that when uploading on the web, it will prompt for the key if the database is crypt14.',
        status: 2
      }
    ]
  },
  {
    id: 'chat_emily',
    jid: '15558765432@s.whatsapp.net',
    name: 'Emily Watson',
    isGroup: false,
    phone: '+1 (555) 876-5432',
    avatar: null,
    avatarColor: '#8a3ffc',
    pinned: false,
    unreadCount: 0,
    onlineStatus: 'last seen today at 2:15 PM',
    about: 'Busy at work 💻 Do not disturb.',
    messages: [
      {
        id: 'msg_301',
        fromMe: false,
        timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
        type: 'text',
        text: 'Good morning! For our project presentation the day after tomorrow, the venue is confirmed at headquarters.',
        status: 2
      },
      {
        id: 'msg_302',
        fromMe: false,
        timestamp: Date.now() - 1000 * 60 * 60 * 47.5,
        type: 'location',
        location: {
          name: 'Our Tech Tower, 18th Floor',
          address: '100 Innovation Way, Tech District, Suite 1800',
          latitude: 37.7749,
          longitude: -122.4194
        },
        text: 'Headquarters Location',
        status: 2
      },
      {
        id: 'msg_303',
        fromMe: true,
        timestamp: Date.now() - 1000 * 60 * 60 * 46,
        type: 'text',
        text: 'Got it, Emily! I have noted the schedule and address. Thanks for the heads up!',
        status: 2
      },
      {
        id: 'msg_304',
        fromMe: false,
        timestamp: Date.now() - 1000 * 60 * 60 * 18,
        type: 'document',
        media: {
          filename: 'Partnership_Proposal_Q4_2026.pdf',
          size: '3.4 MB',
          ext: 'PDF'
        },
        text: 'Attached is the draft proposal for your review beforehand.',
        status: 2
      }
    ]
  },
  {
    id: 'group_family',
    jid: '15559988776-1582234567@g.us',
    name: 'Happy Family ❤️',
    isGroup: true,
    avatar: null,
    avatarColor: '#ff7eb6',
    pinned: false,
    unreadCount: 0,
    onlineStatus: 'Mom, Dad, Maya, You',
    about: 'Family is everything 💕',
    participants: [
      { jid: '15551111222@s.whatsapp.net', name: 'Mom', color: '#ff4d6d' },
      { jid: '15552222333@s.whatsapp.net', name: 'Dad', color: '#0077b6' },
      { jid: '15553333444@s.whatsapp.net', name: 'Maya', color: '#7209b7' }
    ],
    messages: [
      {
        id: 'msg_401',
        fromMe: false,
        senderJid: '15551111222@s.whatsapp.net',
        senderName: 'Mom',
        senderColor: '#ff4d6d',
        timestamp: Date.now() - 1000 * 60 * 60 * 30,
        type: 'text',
        text: 'Good morning everyone! Remember to eat breakfast. Wishing you all a productive and blessed day 🌸🙏',
        status: 2
      },
      {
        id: 'msg_402',
        fromMe: false,
        senderJid: '15553333444@s.whatsapp.net',
        senderName: 'Maya',
        senderColor: '#7209b7',
        timestamp: Date.now() - 1000 * 60 * 60 * 29,
        type: 'sticker',
        media: {
          url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="%23ffd166"/><circle cx="55" cy="65" r="10" fill="%23073b4c"/><circle cx="105" cy="65" r="10" fill="%23073b4c"/><path d="M 45 100 Q 80 140 115 100" stroke="%23d00000" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="40" cy="85" r="8" fill="%23ff758f"/><circle cx="120" cy="85" r="8" fill="%23ff758f"/></svg>',
          alt: 'Morning Sunshine Sticker'
        },
        status: 2
      },
      {
        id: 'msg_403',
        fromMe: true,
        timestamp: Date.now() - 1000 * 60 * 60 * 28,
        type: 'text',
        text: 'Thank you Mom! Looking forward to visiting this weekend!',
        status: 2
      }
    ]
  },
  {
    id: 'chat_delivery',
    jid: 'parcelnotif@s.whatsapp.net',
    name: 'Parcel Delivery Updates',
    isGroup: false,
    phone: 'Official Business Account',
    isVerified: true,
    avatar: null,
    avatarColor: '#42b549',
    pinned: false,
    unreadCount: 0,
    onlineStatus: 'Verified Official Business Account ✓',
    about: 'Automated package dispatch and transaction tracking alerts.',
    messages: [
      {
        id: 'msg_501',
        fromMe: false,
        timestamp: Date.now() - 1000 * 60 * 60 * 72,
        type: 'text',
        text: 'Your order #INV/20261012/XXI/987123 is out for delivery with our express courier. Estimated arrival today before 5:00 PM. Live tracking is available in your delivery app.',
        status: 2
      }
    ]
  }
];

if (typeof window !== 'undefined') {
  window.DEMO_CHATS = DEMO_CHATS;
}
