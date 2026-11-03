// DRAFT legal copy for the US launch. Must be reviewed by counsel before release (plan §9).
export const LEGAL_VERSION = '2026-11-02';

export const LEGAL: Record<string, { title: string; sections: [string, string][] }> = {
  terms: {
    title: 'Terms of Use',
    sections: [
      ['Entertainment only', 'ORACLE ONE readings, greetings, daily cards and all other content are for entertainment purposes only. They are not predictions and are not financial, investment, medical, psychological or legal advice. Do not make important decisions based on them.'],
      ['Who can use ORACLE ONE', 'You must be 18 or older and located in the United States. By creating an account you confirm both.'],
      ['AI-generated content', 'Virtual coins generate an I Ching hexagram using a published three-coin method. Basic meanings are original editorial reflections. Personalized interpretations and follow-up answers are AI-generated. This service does not have supernatural predictive ability.'],
      ['Purchases', 'Basic hexagrams and editorial reflections are free, subject to reasonable usage limits. An optional personalized deep reading costs $2.99 plus applicable sales tax, charged once with no subscription. The price is shown before checkout. Legacy readings retain their recorded price. Delivery starts after payment confirmation. If delivery fails after retries, an automatic refund is initiated; payment-provider processing can take additional time. You can request a refund for other problems from Readings & receipts; we review every request.'],
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
      ['Spirit memory', 'Memory is off for new accounts unless you choose to enable it. When enabled, it stores only the reflections you explicitly share. They never infer or invent anything about you. You can view, delete, or turn off memory in Settings. Deleted memories are removed from the active database immediately. Backup retention depends on the deployed backup policy. Memory is used to personalize your experience, not for advertising. Authorized memory quotations may be sent to the configured AI provider when producing an interpretation.'],
      ['How we use AI', 'Your question and, if memory is on, your own recent feedback are sent to our AI provider to generate your reading. Provider processing and retention depend on the provider and the terms configured for the deployed service. Do not include account numbers or identifying details in your question.'],
      ['Rooms', 'Other people in a room see your account name and avatar, never your email. Room messages are deleted when the room closes after 24 hours, except messages that were reported, which moderators keep to review.'],
      ['We do not sell your data', 'We do not sell or share your personal information for cross-context behavioral advertising. You can still send a “Do not sell or share” request from Settings at any time.'],
      ['Your rights', 'Depending on your state (for example California, Colorado, Connecticut, Virginia and others), you can request access to, correction of, deletion of, or a copy of your information, and opt out of sale or sharing. Use Settings or email privacy@fortunemuse.app. We respond within 45 days and will not discriminate against you for using these rights.'],
      ['Retention', 'Saved readings are kept while your account is open or until you delete them. Guest and temporary readings expire after 24 hours and their personal content is removed by the periodic cleanup task. Temporary readings are excluded from the journal and cross-reading memory. Necessary purchase records remain separate. When you delete your account we delete your personal data; purchase records are kept without your name as required for tax and accounting.'],
      ['Children', 'ORACLE ONE is for adults 18+. We do not knowingly collect data from anyone under 18; if we learn we have, we delete it.'],
      ['Contact', 'privacy@fortunemuse.app'],
    ],
  },
};
