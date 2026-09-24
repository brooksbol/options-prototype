# Wheelwright Private Beta / Trusted Evaluator Discovery

**Date:** September 24, 2026  
**Status:** Durable discovery / why-state supporting `PL-BETA-01`; not legal advice and not implementation authority  
**Trigger:** Principal discussion of allowing a very small number of trusted friends/family with varied financial/trading experience to use Wheelwright against their own portfolios and provide real feedback.

---

## Purpose

Preserve the actual intended external-use model before account creation or multi-user implementation turns it into an accidental or reconstructed product story.

The intended model is a **closed, invitation-only private beta / trusted evaluator program** for software testing and learning. It is not an advisory, brokerage, managed-account, public SaaS, or commercial distribution program.

## Principal intent

The Principal wants a small number of trusted people of varying experience levels to use Wheelwright as real operators and enter a feedback loop.

Concrete initial specimens discussed:

- **Jeff** — financially sophisticated (CFO), but not specifically an options trader.
- **Daniel** — an experienced trader in another market (Pokémon cards), but not an options trader.

The diversity is intentional. Wheelwright should be understandable and useful without requiring every evaluator to share the Principal's options-specific knowledge. Questions, confusion, bugs, and requested capabilities are evidence about the Product.

## Intended evaluator loop

The desired loop is:

> trusted evaluator → private-beta invitation/acceptance → own Wheelwright account → own Fidelity CSV import → Wheelwright analysis/recommendations → evaluator independently decides what to do → evaluator reports bugs/questions/feature requests/usability feedback → Product learning

Evaluators may:

- create/use their own Wheelwright accounts;
- upload their own Fidelity CSVs and portfolio information;
- inspect Wheelwright's analysis, ranked candidates, recommendations, explanations, and other decision-support output;
- ask how Wheelwright works or why it produced a result;
- report defects;
- request feature enhancements;
- identify confusing terminology, missing explanations, or usability problems;
- provide general Product feedback.

The Principal may explain Wheelwright's calculations, policy, terminology, behavior, and software-generated results and may use evaluator feedback to improve the Product.

## Investment-decision boundary

The intended boundary is:

> **Wheelwright analyzes. The evaluator decides and executes.**

For this private beta:

- Wheelwright remains decision-support software and does not execute trades.
- The evaluator retains control of the brokerage account and independently chooses whether to trade.
- The Principal does not receive trading authority or custody.
- The Principal is not undertaking to manage the evaluator's portfolio or determine personal suitability.
- A discussion explaining why Wheelwright ranked/recommended something is Product/software support; the beta is not intended to become a recurring personalized portfolio-management service supplied by the Principal.
- Fidelity CSV import is an evaluator-controlled data-ingestion mechanism; evaluators should not provide brokerage passwords/credentials to the Principal.

Wheelwright's use of the term **recommendation** should remain truthful. The Product need not pretend it does not recommend. The relevant distinction is between a recommendation produced by Wheelwright's governed software policy and a representation that the Principal personally determined a transaction is suitable for a particular evaluator.

## Compensation / commercial boundary

Current Principal intent:

- no charge for private-beta access;
- no subscription;
- no advisory fee;
- no percentage of gains/profits;
- no referral or brokerage compensation;
- no other economic benefit tied to an evaluator's trading activity;
- no present plan to commercialize Wheelwright.

If those facts change materially, the private-beta posture must be reconsidered rather than silently extending this record.

## Relationship to the Principal's LLCs

The Principal may use Wheelwright internally for capital management in an LLC that owns/manages the Principal's own capital.

That fact is distinct from Wheelwright being a business, product, service, DBA, or advisory activity of that LLC.

Current intent is therefore:

- existing portfolio-management LLCs may use Wheelwright as an internal tool;
- private-beta access is not represented as a service of those LLCs;
- the existing LLCs do not become private-beta providers merely because their capital is analyzed with Wheelwright;
- no Wheelwright LLC is planned.

This is a factual/product-boundary record, not a legal conclusion about entity treatment.

## Private-beta opt-in / paper trail

Before provisioning an outside evaluator, the Principal wants a durable affirmative record that the person knowingly joined the private beta under its stated terms.

For the initial tiny cohort, **manual email is intentionally sufficient**. No acceptance subsystem is required merely to support two evaluators.

Candidate intake sequence:

1. Principal sends an invitation/account-creation email identifying Wheelwright as a private beta / experimental software evaluation.
2. The email includes or links the then-current **Wheelwright Private Beta Software Evaluation Agreement** and identifies its version.
3. The invitee affirmatively replies that they reviewed and accept that version and wish to participate.
4. Only after acceptance does the Principal provision/activate the account.
5. Invitation + affirmative reply are retained as the acceptance record.

The email exchange itself may be the paper trail. At this scale, manual operation is a feature, not a deficiency.

If evaluator count later makes manual administration burdensome, automated click-through/versioned acceptance can be considered separately.

## Candidate agreement/disclosure content

The future agreement should accurately describe actual Product behavior and relationship. Candidate subjects include:

- experimental/private-beta status;
- no-charge evaluation license;
- purpose: testing, evaluation, bug reporting, feature development, and usability feedback;
- software may analyze portfolio state and produce ranked/recommended securities/options transactions using software-defined rules;
- software may contain defects, stale/incomplete data, calculation errors, or incorrect assumptions;
- evaluator independently evaluates and executes investment decisions;
- no trading authority, custody, brokerage, managed-account, fiduciary, or personal-suitability undertaking by the Principal;
- no compensation;
- assumption of investment risk / appropriate warranty and liability terms;
- confidentiality/privacy and handling of imported portfolio data;
- right to use evaluator bug reports, feature suggestions, and other feedback in Wheelwright;
- termination/revocation of private-beta access;
- agreement versioning and retained acceptance evidence.

Exact legal language requires appropriate legal review before being treated as legally sufficient. This record captures Product/operating intent, not a lawyer-reviewed agreement.

## Product-learning value

The private beta is valuable because evaluators can falsify assumptions the Principal cannot easily see while operating software built around his own workflow.

Examples:

- a financially sophisticated non-options specialist may expose unexplained options semantics;
- a trader from another domain may expose where trading intuition transfers or fails;
- questions such as "why is this #1?" can reveal Explanation defects even when the recommendation calculation is correct;
- feature requests can expose missing operator jobs;
- CSV/import failures and account-specific behavior provide real portfolio-state specimens.

Do not over-coach evaluators merely to make the Product appear understandable. Confusion is Product evidence when safe use permits observation.

## Guardrails / non-decisions

This discovery does **not** authorize or establish:

- public signup or public distribution;
- charging users;
- investment-adviser or brokerage activity;
- trade execution, custody, or discretionary authority;
- receipt/storage of brokerage passwords;
- a Wheelwright LLC;
- use of an existing portfolio LLC as the beta provider;
- automated onboarding merely because private beta exists;
- any claim that a disclaimer or agreement eliminates regulatory or civil liability;
- any legal conclusion that Wheelwright or the Principal is exempt from a particular law;
- implementation of multi-user auth/account isolation;
- implementation of new recommendation behavior.

## Change triggers

Revisit this operating/legal boundary before materially expanding the beta if any of the following becomes true:

- compensation or economic benefit is introduced;
- access becomes public or broadly solicited;
- evaluator population grows materially beyond a small trusted cohort;
- the Principal begins routinely making personalized portfolio decisions rather than explaining/supporting Wheelwright;
- Wheelwright gains brokerage execution authority, custody, credential handling, or automated order placement;
- an LLC or other entity begins offering/branding Wheelwright as its service;
- evaluator portfolio data moves from local/user-controlled handling into new server-side persistence or sharing arrangements.

## Why this record exists

The Principal explicitly wants real trusted users to exercise Wheelwright and provide feedback before the Product is mature. That external use creates Product, privacy/security, operating-model, and legal-boundary questions that should not be reconstructed later from implementation artifacts.

The desired state is deliberately modest:

> **Two trusted people can be invited manually, accept explicit private-beta terms by email, use their own accounts/data, make their own decisions, and give the Principal Product feedback.**

That is the baseline this discovery preserves.
