// DRAFT legal copy for the US launch. Must be reviewed by counsel before release (plan §9).
export const LEGAL_VERSION = '2026-10-30';

export const LEGAL: Record<string, { title: string; sections: [string, string][] }> = {
  terms: {
    title: 'Terms of Use',
    sections: [
      ['Entertainment only', 'Fortune Muse readings, greetings, daily cards and all other content are for entertainment purposes only. They are not predictions and are not financial, investment, medical, psychological or legal advice. Do not make important decisions based on them.'],
      ['Who can use Fortune Muse', 'You must be 18 or older and located in the United States. By creating an account you confirm both.'],
      ['AI-generated content', 'Readings are written by an AI system in the voice of fictional characters. Fortune spirits are original characters and are not real people or deities.'],
      ['Purchases', 'Readings cost between $3 and $5 plus any applicable sales tax and are charged once per reading. A reading is digital content delivered immediately after payment. If a reading fails to generate, you are refunded automatically. You can request a refund for other problems from Readings & receipts; we review every request.'],
      ['Daily draw', 'The daily draw is free, once per day, and never requires a purchase. Rewards are virtual items with no cash value and cannot be transferred, sold or exchanged for money. Odds are shown on the draw screen.'],
      ['Rooms and conduct', 'Same-question rooms close and their messages are deleted 24 hours after they open. Be kind. Do not harass, threaten, share hate, sexual content, spam, scams, or anyone’s contact or payment details. We may remove content and restrict or suspend accounts that break these rules. Reported messages are kept for moderation.'],
      ['Your account', 'You can download your data or delete your account at any time in Settings.'],
      ['Changes and contact', 'We may update these terms and will tell you in the app when we do. Questions: support@fortunemuse.app.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      ['What we collect', 'Your email, password (stored as a one-way hash), country, time zone, optional gender and age range, your avatar, the questions you ask, your readings, feedback you choose to share, room messages, reports, and purchase records. Payments are processed by Stripe; we never see your full card number.'],
      ['Spirit memory', 'If memory is on, fortune spirits remember only what you type in the feedback box after a reading. They never infer or invent anything about you. You can view, delete, or turn off memory in Settings. Deleted memories are removed immediately and purged from backups within 24 hours. Memory is used only to personalize your own experience — never for advertising and never shared.'],
      ['How we use AI', 'Your question and, if memory is on, your own recent feedback are sent to our AI provider to generate your reading. They are not used to train public models.'],
      ['Rooms', 'Other people in a room see your account name and avatar, never your email. Room messages are deleted when the room closes after 24 hours, except messages that were reported, which moderators keep to review.'],
      ['We do not sell your data', 'We do not sell or share your personal information for cross-context behavioral advertising. You can still send a “Do not sell or share” request from Settings at any time.'],
      ['Your rights', 'Depending on your state (for example California, Colorado, Connecticut, Virginia and others), you can request access to, correction of, deletion of, or a copy of your information, and opt out of sale or sharing. Use Settings or email privacy@fortunemuse.app. We respond within 45 days and will not discriminate against you for using these rights.'],
      ['Retention', 'We keep your data while your account is open. When you delete your account we delete your personal data; purchase records are kept without your name as required for tax and accounting.'],
      ['Children', 'Fortune Muse is for adults 18+. We do not knowingly collect data from anyone under 18; if we learn we have, we delete it.'],
      ['Contact', 'privacy@fortunemuse.app'],
    ],
  },
};
