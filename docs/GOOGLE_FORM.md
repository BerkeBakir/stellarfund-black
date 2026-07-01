# StellarFund — Mainnet User Onboarding Google Form (Level 6)

Create a Google Form with the fields below, share the link with **mainnet** users,
then export responses to Excel (Responses tab → Google Sheets → File → Download →
`.xlsx`), save it to `docs/feedback/` and link the exported sheet in the README.

> **Level 6 requires** collecting wallet address, email, name, and a product
> rating/feedback, exporting to Excel, linking it in the README, and outlining the
> next-phase improvements **with git commit links** in the README improvement section.
>
> Tip: turn on "Collect email addresses" in Form Settings, and make wallet +
> rating required. The wallet address lets reviewers match each response to real
> on-chain activity on the public `/proof` board.

## Fields

1. **Stellar wallet address** — short answer, **required**
   - EN: "Your Stellar wallet address (the one you connected to StellarFund)"
   - TR: "Stellar cüzdan adresin (StellarFund'a bağladığın)"
   - Validation: response must contain `G` and be 56 chars (regex `^G[A-Z2-7]{55}$`).

2. **Email** — short answer (or the built-in email collection), **required**
   - EN: "Email" · TR: "E-posta"

3. **Name** — short answer
   - EN: "Your name (or nickname)" · TR: "Adın (ya da takma adın)"

4. **Rate the product** — linear scale 1–5, **required**
   - EN: "How would you rate StellarFund overall?" (1 = poor, 5 = excellent)
   - TR: "StellarFund'ı genel olarak nasıl puanlarsın?" (1 = kötü, 5 = mükemmel)

5. **What worked well?** — paragraph
   - EN: "What did you like? What worked smoothly?"
   - TR: "Neyi beğendin? Ne sorunsuz çalıştı?"

6. **What should we improve?** — paragraph
   - EN: "What was confusing or missing? What should we fix or add?"
   - TR: "Ne kafa karıştırıcıydı veya eksikti? Neyi düzeltmeli/eklemeliyiz?"

7. **Which feature do you want next?** — multiple choice
   - Options: Campaign comments & updates · Email/app notifications · Creator profiles ·
     More categories & search · Mobile app · Mainnet (real money) · Other
   - EN: "Which feature would you most want next?"
   - TR: "Bir sonraki olarak en çok hangi özelliği istersin?"

8. **Did your transaction succeed on-chain?** — yes/no
   - EN: "Were you able to contribute (transaction succeeded)?"
   - TR: "Katkı yapabildin mi (işlem başarılı oldu mu)?"

## After collecting

- Export to `.xlsx` and commit it to `docs/feedback/` (or link a public Sheet).
- The README "Feedback-driven improvements" section maps each common theme to a
  shipped change + its git commit link.
