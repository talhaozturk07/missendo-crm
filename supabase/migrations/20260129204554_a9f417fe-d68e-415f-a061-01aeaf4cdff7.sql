-- Insert Valentine's Day Template
INSERT INTO email_templates (
  organization_id,
  name,
  subject,
  content,
  variables,
  is_active
) VALUES (
  '1a4b5fa6-afa4-4843-a11a-d02cfbfa97f3',
  'Valentine''s Day - 10% Off Dental Treatments',
  'This Valentine''s Day, Fall in Love with Your Smile ✨',
  'Dear Miss Endo Family,

This Valentine''s Day, we are celebrating love in its most beautiful form — self-love, confidence, and renewal ✨

At Miss Endo, we believe every smile tells a story about how you feel inside. And you deserve to feel confident, radiant, and deeply loved — by yourself.

In collaboration with Dent X Clinic, we are pleased to share that Dent X Clinic is offering a limited Valentine seasonal courtesy savings of 10% on eligible dental treatments for a short time. Whether you have been thinking about a smile makeover, veneers, implants, or a complete dental transformation, this may be the perfect moment to begin your journey 🌟

As always, Miss Endo will personally coordinate every detail for you — from consultation to travel and logistics — so your experience feels seamless, private, and luxurious.

If this resonates with you, simply reply to this email or schedule a private consultation. We would love to guide you through your options with care and discretion 💫

With love,

Miss Endo Tourism LLC
9440 Santa Monica Blvd, Suite 301
Beverly Hills, CA 90210
📞 (424) 363-6927
✉️ info@missendo.com
🌐 www.missendo.com

---

Miss Endo Tourism LLC provides administrative, travel, and coordination services only and does not practice medicine or dentistry. All dental treatments, clinical decisions, and pricing are provided solely by Dent X Clinic and its licensed dental professionals. Any promotional pricing is offered by Dent X Clinic and is subject to clinic policies, availability, and individual medical eligibility.

Unsubscribe',
  ARRAY['name'],
  true
),
(
  '1a4b5fa6-afa4-4843-a11a-d02cfbfa97f3',
  'Welcome to Miss Endo - Your Journey Begins',
  'Welcome to Miss Endo, {{name}} ✨',
  'Dear {{name}},

Welcome to Miss Endo — where your smile transformation journey begins 🌟

We are thrilled to have you with us! At Miss Endo, we understand that choosing to enhance your smile is a deeply personal decision. That''s why we are committed to providing you with a premium, personalized experience every step of the way.

Here''s what you can expect from us:

✨ Personalized Consultation — We take the time to understand your goals and create a treatment plan tailored just for you.

🏥 World-Class Clinics — We partner with leading dental clinics in Turkey, known for excellence and innovation.

🛫 Seamless Travel Coordination — From flights to accommodations, we handle all the logistics so you can focus on your transformation.

💎 VIP Treatment — Enjoy luxury transfers, premium hotels, and dedicated support throughout your journey.

If you have any questions or would like to schedule a consultation, simply reply to this email or call us directly. We''re here to help!

Looking forward to being part of your smile journey,

Miss Endo Tourism LLC
9440 Santa Monica Blvd, Suite 301
Beverly Hills, CA 90210
📞 (424) 363-6927
✉️ info@missendo.com
🌐 www.missendo.com

Unsubscribe',
  ARRAY['name'],
  true
);