# Reference Fixture: XLE Options Chain

## Purpose

This document captures a real options chain observed from Fidelity for use as a **reference fixture** within the Engineering Laboratory.

Unlike the synthetic engineering fixtures (Normal Market, Tie Scenario, Deep OTM), this dataset represents an observed market snapshot and serves as a stable reference for validating:

- Provider mapping
- Canonical domain model
- Delta matching
- Policy behavior
- UI rendering
- Future provider integrations

This document is **source material**. It should remain as close to the original capture as practical. The mock provider (`xle.json`) is derived from this document.

---

## Capture Metadata

| Field | Value |
|------|------|
| Source | Fidelity Investments |
| Underlying | XLE – Energy Select Sector SPDR Fund |
| Symbol | XLE |
| Underlying Price | **53.22** |
| Quote Time | 2026-07-02 4:10 PM ET |
| Capture Date | 2026-07-05 |
| Capture Method | Manual copy from Fidelity Options Chain |
| Purpose | Engineering reference fixture |

---

## Planned Fixture Coverage

Initial expirations to capture:

- Jul 10 2026 (5 DTE)
- Jul 17 2026 (12 DTE)
- Jul 24 2026 (19 DTE)
- Jul 31 2026 (26 DTE)
- Aug 07 2026 (33 DTE)

Fields intended for extraction:

- Strike
- Bid
- Ask
- Delta
- Open Interest
- Volume

Fields intentionally ignored (for now):

- Last
- Change
- Implied Volatility
- Action
- Histogram
- UI formatting

---

## Provenance

This file intentionally preserves the original Fidelity output.

It is **not** normalized.

Normalization occurs when generating:

```
options-prototype/src/providers/mock/data/xle.json
```

The Engineering Laboratory should always be able to trace a reference fixture back to its original observed source.

---

# Raw Fidelity Capture

Paste the Fidelity option chain below this line without modification.

---

```
Skip to Main Content.
Fidelity.com Home
CUSTOMER SERVICE	PROFILE	OPEN AN ACCOUNT	FIDELITY ASSISTANT	LOG OUT

Accounts & Trade
Planning & Advice
News & Research
Products
Why Fidelity
Research > Content and data provided by various third parties and Fidelity Investments –Terms of Use. Opens in a new window.
Options
Print Help/Glossary
New! Options analysis and research page

Fidelity's latest lineup of powerful options trading and research tools in one place, with knowledge and skill-building learning resources. Switch to the new experience.
Quotes & ToolsMarket OverviewTrading Ideas
Fidelity Learning Center | Coaching Sessions
Option Chain  Key Statistics  IV Index  Option Quote & Chart  Probability Calculator  P/L Calculator  Market Commentary

State Street Energy Select Sector SPDR ETF
$53.22  up 0.41 (0.78%)
AS OF 4:10:00PM ET 07/02/2026
More Quote Information
Option Strategy Builder
Strategy
Enter an underlying symbol and select a strategy to display the corresponding option criteria.
Calls & Puts
Strikes
10
Volume
All
Open Int
All
 
Weekly
Histogram
 View Demo View Demo | Settings
View All Expiration Dates
JUL 10 (W)
JUL 17
JUL 24 (W)
JUL 31 (W)
AUG 07 (W)
AUG 14 (W)
AUG 21
SEP 18
SEP 30 (Q)
OCT 16
NOV 20
DEC 18
DEC 31 (Q)
JAN 15 2027
MAR 19
MAR 31 (Q)
JUN 17
JUN 30 (Q)
DEC 17
JAN 21 2028
DEC 15
Apply Reset
Expand All|Collapse All
Last	Change	Bid	Ask	Volume	Open Int	Imp Vol	Delta	Action	Strike	Action	Last	Change	Bid	Ask	Volume	Open Int	Imp Vol	Delta
Last	Change	Bid	Ask	Volume	Open Int	Imp Vol	Delta	Action	Strike	Action	Last	Change	Bid	Ask	Volume	Open Int	Imp Vol	Delta
CALLS	Jul 10 '26 (5 days)	PUTS
2.05	0.00	2.18	2.64	
0
1
29.93 %	0.932	
Open or Close Menu.
51	
Open or Close Menu.
0.12	0.00	0.04	0.18	
0
1,152
24.24 %	-0.0676
2.85	0.00	1.75	2.06	
0
2
25.09 %	0.881	
Open or Close Menu.
51.5	
Open or Close Menu.
0.18	0.00	0.06	1.15	
0
571
41.39 %	-0.1186
1.48	0.00	1.35	1.65	
0
17
24.20 %	0.8042	
Open or Close Menu.
52	
Open or Close Menu.
0.27	0.00	0.18	0.34	
0
2,218
22.61 %	-0.1953
1.15	0.00	1.01	1.27	
0
159
23.60 %	0.6988	
Open or Close Menu.
52.5	
Open or Close Menu.
0.41	0.00	0.30	0.46	
0
910
21.57 %	-0.3007
0.80	0.00	0.68	0.93	
0
132
22.30 %	0.5681	
Open or Close Menu.
53	
Open or Close Menu.
0.61	0.00	0.47	0.72	
0
4,956
22.03 %	-0.4314
0.59	0.00	0.39	0.79	
0
147
23.14 %	0.4252	
Open or Close Menu.
53.5	
Open or Close Menu.
0.81	0.00	0.69	1.07	
0
174
22.89 %	-0.5744
0.39	0.00	0.34	0.48	
0
456
23.45 %	0.2937	
Open or Close Menu.
54	
Open or Close Menu.
1.08	0.00	0.82	1.31	
0
418
18.36 %	-0.706
0.26	0.00	0.16	0.30	
0
286
21.86 %	0.1871	
Open or Close Menu.
54.5	
Open or Close Menu.
1.57	0.00	1.38	1.69	
0
87
22.15 %	-0.8127
0.15	0.00	0.12	0.20	
0
532
22.99 %	0.1098	
Open or Close Menu.
55	
Open or Close Menu.
1.94	0.00	1.78	2.12	
0
197
22.61 %	-0.8901
0.10	0.00	0.04	0.13	
0
401
22.32 %	0.0595	
Open or Close Menu.
55.5	
Open or Close Menu.
2.51	0.00	2.02	2.57	
0
41
--	-0.9406
CALLS	Jul 17 '26 (12 days)	PUTS
3.30	0.00	3.25	3.60	
0
737
25.69 %	0.917	
Open or Close Menu.
50	
Open or Close Menu.
0.14	0.00	0.12	0.16	
0
22,169
25.49 %	-0.0832
2.51	0.00	2.36	2.71	
0
454
23.94 %	0.8427	
Open or Close Menu.
51	
Open or Close Menu.
0.29	0.00	0.21	0.48	
0
6,348
27.05 %	-0.1578
1.73	0.00	1.50	1.93	
0
1,745
22.00 %	0.7221	
Open or Close Menu.
52	
Open or Close Menu.
0.47	0.00	0.39	0.55	
0
14,168
23.00 %	-0.2791
1.35	0.00	1.40	1.57	
0
88
24.47 %	0.6454	
Open or Close Menu.
52.5	
Open or Close Menu.
0.63	0.00	0.46	0.74	
0
1,147
21.95 %	-0.3564
1.07	0.00	0.93	1.31	
0
1,102
22.59 %	0.5601	
Open or Close Menu.
53	
Open or Close Menu.
0.80	0.00	0.65	0.94	
0
6,308
21.58 %	-0.4426
0.73	0.00	0.67	1.09	
0
244
22.81 %	0.4701	
Open or Close Menu.
53.5	
Open or Close Menu.
1.06	0.00	0.92	1.23	
0
113
22.22 %	-0.5336
0.66	0.00	0.45	0.75	
0
4,310
21.07 %	0.3828	
Open or Close Menu.
54	
Open or Close Menu.
1.50	0.00	1.22	1.54	
0
10,318
22.47 %	-0.6221
0.49	0.00	0.41	0.58	
0
592
22.63 %	0.3026	
Open or Close Menu.
54.5	
Open or Close Menu.
1.80	0.00	1.55	2.12	
0
38
25.62 %	-0.7038
0.36	0.00	0.29	0.44	
0
31,454
22.77 %	0.2321	
Open or Close Menu.
55	
Open or Close Menu.
2.11	0.00	1.92	2.28	
0
41,545
23.00 %	-0.7759
0.21	0.00	0.19	0.30	
0
2,090
22.26 %	0.1728	
Open or Close Menu.
55.5	
Open or Close Menu.
2.11	0.00	2.21	2.67	
0
2
20.90 %	-0.8369
CALLS	Jul 24 '26 (19 days)	PUTS
2.57	0.00	2.51	3.10	
0
5
26.86 %	0.7983	
Open or Close Menu.
51	
Open or Close Menu.
0.42	0.00	0.25	0.50	
0
4,151
23.17 %	-0.2018
0.00	0.00	0.00	0.00	
0
0
--	0.7457	
Open or Close Menu.
51.5	
Open or Close Menu.
0.00	0.00	0.00	0.00	
0
0
--	-0.2547
2.45	0.00	1.78	2.30	
0
4
25.16 %	0.6864	
Open or Close Menu.
52	
Open or Close Menu.
0.68	0.00	0.55	0.75	
0
122
22.95 %	-0.3144
0.00	0.00	0.00	0.00	
0
0
--	0.6214	
Open or Close Menu.
52.5	
Open or Close Menu.
0.00	0.00	0.00	0.00	
0
0
--	-0.3799
1.27	0.00	1.19	1.52	
0
92
23.20 %	0.5525	
Open or Close Menu.
53	
Open or Close Menu.
1.17	0.00	0.90	1.23	
0
221
23.08 %	-0.4495
1.07	0.00	0.94	1.27	
0
16
23.13 %	0.4817	
Open or Close Menu.
53.5	
Open or Close Menu.
1.35	0.00	1.13	1.47	
0
22
22.71 %	-0.5209
0.80	0.00	0.75	0.95	
0
25
22.32 %	0.4124	
Open or Close Menu.
54	
Open or Close Menu.
1.64	0.00	1.22	1.77	
0
135
20.91 %	-0.5912
0.64	0.00	0.54	0.87	
0
20
23.06 %	0.3465	
Open or Close Menu.
54.5	
Open or Close Menu.
1.97	0.00	1.53	2.05	
0
69
20.29 %	-0.6581
0.48	0.00	0.39	0.70	
0
339
22.90 %	0.2857	
Open or Close Menu.
55	
Open or Close Menu.
2.32	0.00	2.05	2.47	
0
212
22.81 %	-0.7199
0.43	0.00	0.30	0.50	
0
33
22.43 %	0.2312	
Open or Close Menu.
55.5	
Open or Close Menu.
2.94	0.00	2.39	2.82	
0
14
22.00 %	-0.7757
CALLS	Jul 31 '26 (26 days)	PUTS
5.10	0.00	4.30	4.90	
0
1
26.71 %	0.8987	
Open or Close Menu.
49	
Open or Close Menu.
0.22	0.00	0.02	0.34	
0
20
24.36 %	-0.1016
3.60	0.00	3.40	3.90	
0
11
23.49 %	0.8419	
Open or Close Menu.
50	
Open or Close Menu.
0.36	0.00	0.30	0.48	
0
950
26.04 %	-0.1589
2.61	0.00	2.64	3.10	
0
8
23.59 %	0.7657	
Open or Close Menu.
51	
Open or Close Menu.
0.55	0.00	0.33	0.72	
0
137
23.86 %	-0.2358
2.05	0.00	1.94	2.37	
0
51
23.12 %	0.6699	
Open or Close Menu.
52	
Open or Close Menu.
0.84	0.00	0.50	0.89	
0
137
21.24 %	-0.3328
1.55	0.00	1.36	1.75	
0
144
22.89 %	0.557	
Open or Close Menu.
53	
Open or Close Menu.
1.27	0.00	1.02	1.38	
0
749
22.88 %	-0.4476
1.23	0.00	1.14	1.50	
0
31
23.13 %	0.4965	
Open or Close Menu.
53.5	
Open or Close Menu.
1.69	0.00	1.23	1.58	
0
529
22.10 %	-0.5093
1.00	0.00	0.89	1.26	
0
203
22.72 %	0.4362	
Open or Close Menu.
54	
Open or Close Menu.
1.79	0.00	1.40	1.88	
0
76
21.33 %	-0.571
0.91	0.00	0.70	1.09	
0
25
22.95 %	0.3776	
Open or Close Menu.
54.5	
Open or Close Menu.
2.44	0.00	1.66	2.36	
0
246
22.34 %	-0.6312
0.69	0.00	0.54	0.92	
0
990
22.98 %	0.3219	
Open or Close Menu.
55	
Open or Close Menu.
2.40	0.00	2.17	2.62	
0
91
23.21 %	-0.6887
0.55	0.00	0.40	0.69	
0
133
22.13 %	0.2701	
Open or Close Menu.
55.5	
Open or Close Menu.
2.37	0.00	2.55	2.97	
0
7
23.29 %	-0.7425
CALLS	Aug 07 '26 (33 days)	PUTS
0.00	0.00	2.79	3.40	
0
0
25.35 %	0.7487	
Open or Close Menu.
51	
Open or Close Menu.
0.62	0.00	0.53	0.72	
0
33
23.34 %	-0.2523
0.00	0.00	2.30	2.90	
0
0
22.64 %	0.7045	
Open or Close Menu.
51.5	
Open or Close Menu.
0.00	0.00	0.54	0.88	
0
0
22.18 %	-0.2971
2.34	0.00	2.10	2.54	
0
1
23.42 %	0.6568	
Open or Close Menu.
52	
Open or Close Menu.
1.07	0.00	0.80	1.08	
0
61
23.13 %	-0.3454
1.90	0.00	1.80	2.39	
0
6
24.56 %	0.6065	
Open or Close Menu.
52.5	
Open or Close Menu.
1.17	0.00	0.96	1.29	
0
1
22.89 %	-0.3964
1.60	0.00	1.53	2.03	
0
9
23.90 %	0.5543	
Open or Close Menu.
53	
Open or Close Menu.
1.43	0.00	1.22	1.50	
0
27
23.02 %	-0.4496
1.50	0.00	1.19	1.80	
0
2
23.34 %	0.5011	
Open or Close Menu.
53.5	
Open or Close Menu.
1.84	0.00	1.47	1.74	
0
6
22.91 %	-0.5037
1.21	0.00	1.06	1.45	
0
53
23.08 %	0.4487	
Open or Close Menu.
54	
Open or Close Menu.
1.75	0.00	1.72	2.14	
0
28
23.61 %	-0.5572
1.10	0.00	0.87	1.33	
0
4
23.74 %	0.3979	
Open or Close Menu.
54.5	
Open or Close Menu.
0.00	0.00	2.02	2.30	
0
0
22.47 %	-0.6092
0.84	0.00	0.69	1.00	
0
7
22.47 %	0.3496	
Open or Close Menu.
55	
Open or Close Menu.
2.45	0.00	2.27	2.83	
0
8
23.48 %	-0.6589
0.74	0.00	0.64	1.03	
0
14
24.83 %	0.3043	
Open or Close Menu.
55.5	
Open or Close Menu.
3.00	0.00	2.65	3.15	
0
0
23.48 %	-0.7056
CALLS	Aug 14 '26 (40 days)	PUTS
CALLS	Aug 21 '26 (47 days)	PUTS
CALLS	Sep 18 '26 (75 days)	PUTS
CALLS	Sep 30 '26 (87 days)	PUTS
 in the money
-- not available
Options trading entails significant risk and is not appropriate for all investors. Prior to trading options, you must receive a copy of Characteristics and Risks of Standardized Options Opens in a new window., which is available from Fidelity Investments, and be approved for options trading. Supporting documentation for any claims, if applicable, will be furnished upon request.
There are additional costs associated with option strategies that call for multiple purchases and sales of options, such as spreads, straddles, and collars, as compared with a single option trade.
Greeks are mathematical calculations used to determine the effect of various factors on options.
For options traded on an Exchange, Fidelity will attempt to show better price indications and provide better fills for your orders than those available by trading in the individual legs.
Certain market conditions may impact eligibility for NBBO pricing, including orders entered during fast market conditions, orders entered when a security has halted trading, and orders entered when circumstances result in a non-firm quote condition.
News, commentary, data, charts, research reports, ratings and analyst opinions and other information provided on this page are provided by third-parties unaffiliated with Fidelity and are intended for research purposes to help self-directed investors evaluate many types of securities. All information supplied or obtained from this page is for informational purposes only and should not be considered investment advice or guidance, an offer of or a solicitation of an offer to buy or sell a security, or a recommendation or endorsement by Fidelity of any security or investment strategy. Fidelity does not endorse or adopt any particular investment strategy, any analyst opinion/rating/report or any approach to evaluating individual securities. Fidelity makes no guarantees that information supplied is accurate, complete, or timely, and does not provide any warranties regarding results obtained from its use.
Fidelity Investments
© 1998 - 2018 FMR LLC.
All rights reserved.
Terms of UsePrivacySecuritySite Map
Give Feedback
```