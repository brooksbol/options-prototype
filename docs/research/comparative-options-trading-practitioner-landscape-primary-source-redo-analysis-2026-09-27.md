# Comparative Options-Trading Practitioner Landscape — Primary-Source Redo Analysis

**Date:** 2026-09-27  
**Status:** Research analysis / reconciliation evidence only.  
**Authority:** Non-authoritative. This document does **not** promote the underlying research findings to Product policy, architecture, implementation authority, trading policy, or a governed Operating Program.  
**Source artifact:** `docs/research/comparative-options-trading-practitioner-landscape-primary-source-redo-2026-09-27.md`

This is now a **real research artifact**, not reconnaissance. The difference in epistemic quality is striking. The completion gate alone tells the story: ~97 substantive primary items, ~26 hours of practitioner speech, plus full study articles and practitioner-written material, with six corpora passing the bounded-profile gate, InTheMoney passing with a stated temporal gap, and tastylive explicitly remaining only partially sufficient.

Several things jump out.

First, the redo did exactly what we wanted it to do: **it changed conclusions rather than merely adding citations.** H4 is genuinely falsified for the observed 2020–2023 period. InTheMoney repeatedly says the objective is premium/income and avoiding assignment; the acquisition-first interpretation came from one 2026 description rather than observed teaching. That's a textbook demonstration of why we imposed the primary-corpus gate.

Second, **false consensus is turning into a major finding in its own right.** “Be the casino” is particularly good. Option Alpha means repeated positive-EV operation; Freudberg applies it even to a directional debit spread; Lakha explicitly rejects the model; Bassman uses “casino” as a strategy description. The report's conclusion that the phrase itself establishes essentially nothing shared is much better supported now.

Third, H9 failing is more interesting than if it had survived. The proposed master variable—objective—couldn't explain practitioners with the same objective but radically different operating systems, nor different objectives converging on similar constructions. The replacement hypothesis of **evidence culture × lineage × commercial-product shape × tenor/risk topology** is much richer, while the report correctly labels that replacement as inference rather than established fact.

Fourth, the empirical section gives us a much sharper question than “does selling options work?” The evidence is separating into something like:

- **Index variance premium:** comparatively strong evidence.
- **Unconditional single-name variance premium:** much weaker.
- **Conditional selection of rich single-name volatility:** meaningful evidence, but highly cost-sensitive.
- **Retail strategy P&L:** not interchangeable with VRP evidence because unhedged strategies also contain equity drift and other exposures.

That's an extremely important distinction. The report explicitly warns against using retail backtests as evidence of VRP or VRP papers as evidence for a particular retail strategy's P&L.

And the commission correction is exactly the kind of research hygiene we needed. The 20.77% number is now properly bounded: independent spintwig backtester, 54 variants / 170,500+ trades, but the underlying commission schedule, denominator, slippage treatment and variant dispersion aren't available. So it's evidence that friction can be material, **not a universal empirical constant**.

There's an even more consequential observation buried in the cost synthesis: **none of these corpora was found to model commissions + slippage + bid/ask realistically together in its flagship backtests.** That's a much more defensible finding than simply saying “costs matter.”

The report also answers our earlier question about where to point Muse next. Its own backlog converges remarkably well with the vectors we were discussing: close tastylive's primary-source gap; inspect the foundational VRP papers directly; recover the spintwig cost model; independently audit Option Alpha's backtesting claims; adjudicate earnings/skew/jump evidence; and, most interesting to me, investigate **sequential portfolio-level accounting**, which the study identifies as the genuine landscape-wide missing conversation.

That last one is potentially enormous. Almost everyone is talking in **trade units**, while the thing an operator ultimately experiences is a **capital-constrained portfolio evolving through time**. Trade expectancy, overlapping obligations, correlated drawdowns, assignment, capital occupation, redeployment, path dependence, friction and opportunity cost interact. The report found fragments of those ideas but no corpus really closing the loop.

So I would not immediately commission “more practitioner research.” We have enough practitioner diversity now to expose the major fractures. The marginal information value is probably moving toward the other vectors we identified—particularly **primary academic literature, strategy-index histories, actual portfolio-level empirical behavior, and professional/institutional volatility practice**.

One thing I would preserve very carefully: **don't overwrite history conceptually.** The provisional reconnaissance was wrong in useful ways. This redo is powerful partly because we can see precisely what primary observation corrected. The final report's “What the Reconnaissance Got Wrong” section is therefore not cleanup; it's evidence about the reliability of the research method itself.

This has moved us beyond “we researched some options YouTubers.” We now have the beginnings of an **empirical epistemology for the options domain**: distinguish doctrine from lineage, vocabulary from behavior, practitioner evidence from empirical evidence, gross edge from executable edge, and population-specific evidence from unjustified generalization.

That's worth preserving.

## Preservation boundary

This analysis is deliberately preserved separately from the source artifact. It interprets the research; it does not modify or re-grade the source report. Neither this analysis nor the source report changes the Principal-ratified bounded production Console rules, authorizes a new Operating Program, changes architecture, or grants implementation authority.
