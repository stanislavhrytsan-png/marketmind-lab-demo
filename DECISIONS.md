# Decisions made while building all modules into the demo

You were not available, so I chose the simplest reasonable option each time something was open. Every choice is listed here with the reason. Tell me which ones you want changed.

Brief: `MarketMind Lab demo all modules prompt.md`. Session start: Thu 19 Nov 2026, 15:50 CET. This file grows with every module, and it is committed together with that module.

## Before the first module

1. **I build on the published state.** My commits sit on top of the published commit `19be820`, so a normal `git push` will publish them when you decide to.
2. **Nothing is pushed or deployed.** Both repositories are committed after every module, as the brief asks.
3. **No independent reviews,** as the brief asks.

## How the nine modules fit into the demo

4. **The runs of the new modules are "weekly exercises".** The assignment in the story covers segmentation, positioning and conjoint analysis. The new modules work with the company data of the same case, so their runs appear in the same run history, dated in October and early November, before the assignment. They are there from the start of the demo. Only the three conjoint runs still appear when you press "Run 2 scenarios".
5. **One results screen per module, built by hand, and one setup screen for all of them.** The results screen follows the pattern of the conjoint results: run header, then numbered layers (Headline, Key results, What if, Details, Interpretation). The setup screen is one generic screen that reads the engine's description of each setting. It shows the steps of the module and the inputs from `MODULES.md`, and every setting with the engine's own "what it does" and "when to choose" texts, also for every option of a choice. It is view-only, like the segmentation setup. Reason: the brief asks for the engine's texts, and one generic screen guarantees that no text is retyped.
6. **"Watch out" is the pattern for a teaching trap.** A white card with an amber edge and a tag "Watch out": one plain sentence as the title, a short explanation, then the evidence (a chart or a table). Where the engine has its own warning for the case, it is quoted word for word under "The engine says".
7. **The trap numbers come from runs on the case data, not from the validation on 50 data sets.** Example: the validation says that the Bass model was usable in 6 of 50 cases with 4 quarters. The demo shows what happens on the Alpine Oat data itself: with 4 quarters the engine finds no market potential, and the forecast is 678% too high. Reason: the brief says every number must come from the export, and a run on the case is what a student would see.
8. **The AI tutor sits at the end of each results screen,** as a layer "Interpretation". It opens with the same mode plate as the tutor panel (Coach mode, "set by Prof. Marti for the weekly exercises"). The student's own reading comes first, as a text box with a scripted note. Then one coach question, one student reply (a click inserts it, as in the tutor panel) and one closing question. No hints here, to keep the exchange short. "Write interpretation" in the run header scrolls to it.
9. **The module is called "Forecasting",** not "Bass forecasting" as in the concept, because the engine's module also covers smoothing for existing products.
10. **The professor's module list shows every module that is built.** Only the three modules of the assignment are ticked. The sentence about modules "in development" counts down by itself.
11. **The filter of the run history becomes a list to pick from** as soon as there are more than four modules. Chips for twelve modules would fill five lines.

## Engine: the export

12. **The new modules are exported by a new file,** `marketmind/export_demo_modules.py`, called from `export_demo.py`. The existing part of the file is unchanged, so the existing screens read exactly what they read before. The new part is under `modules`, and the engine's description of the settings under `settings_help`.
13. **Numbers of the new modules are rounded to nine significant digits,** not to six decimals. Reason: the browser repeats some calculations and must match the engine within 0.1%. Six decimals are too few for a small number such as p = 0.0000931.
14. **The export also holds the engine's texts:** the description of every setting, and the `warnings` and `how_to_read` of each result. The demo shows them word for word. All other sentences stay in the demo.
15. **Three small sums are done in the export, not in the demo,** so that the demo only formats numbers: the 95% range of an estimate (the estimate plus and minus 1.96 standard errors), the forecast added up over the next 12 months, and the sales of the 12 months before.

## Demo: shared building blocks

16. **The new line charts are plain SVG** (`src/components/plot.tsx`), not Recharts. Reason: full control over the style of the concept (quiet grid, values in ink, one tooltip for the whole app), and they stay sharp at any window width. The existing charts are untouched. Bars with labels still use the existing bar component.
17. **Hovering a line chart shows one tooltip for the whole period** (a hairline plus all values of that quarter or month), so the pointer never has to hit a thin line. Every chart also has a table in "Details".
18. **Colours.** No new colours for the interface. In the new charts, data the company recorded is ink, the engine's estimate is slate, and anything that is "yours" (your what-if values, the best method, the best price) is the primary colour. The three segment colours stay reserved for the three segments. Two later modules need more: I checked a four-colour set for the network communities and a red and green pair for sentiment with the palette validator (colour-blind separation and contrast) before building anything. They are noted with those modules.
19. **Sliders are the browser's own range control** in the primary colour. The concept has no slider. The native control works with the keyboard and needs no extra code.
20. **Code layout.** One data file per module (`src/data/forecasting.ts`), one file per calculation in the browser (`src/lib/forecasting.ts`) with its check against the engine next to it, and `src/lib/checks.ts` as the list of everything `npm run check` compares. `src/data/library.ts` brings all modules and runs together.

## Module 1: Forecasting

21. **Two screens with a switch:** "New product" (the Bass model, run FC-01) and "Existing product" (four methods compared, runs FC-02 to FC-04, one per sales series). The coach exchange is on the first.
22. **Four real runs.** FC-01: `fit_bass` on the 12 quarters of the Home subscription, all settings at their defaults. FC-02 to FC-04: `compare_forecast_methods` on Original 1 L, Vanilla 1 L and Chocolate 250 ml, defaults, 12 months kept aside. The switch at the top of the second screen changes the series, and with it the run.
23. **What the browser calculates:** the Bass curve for any p, q and m (three sliders), its peak and its total. `npm run check` compares it with the engine on 16 curves: the estimate, the six what-if cases of the engine (p, q and m each 20% up and down), the four estimates from the first quarters, and the five analogies. The smoothing methods are not recalculated in the browser.
24. **Analogies.** The list "Start from" holds the engine's five example products. Their p and q are per year, and the data is per quarter, so they are divided by 4, as the engine does with `periods_per_year`. The engine's own note says that the values are illustrations. It is printed under the chart.
25. **The first trap: an early forecast.** A chart with the four forecasts (from 4, 6, 8 and 12 quarters) against what really happened, and a table: market potential, forecast for the end of 2025, and how far off it was (+678%, −22%, +7%). The forecast from 4 quarters leaves the chart on purpose.
26. **The second trap: a narrow win.** On two of the three sales series the best method is ahead by less than 3%. A table across the three runs says so, with the engine's sentence on luck.
27. **Smoothing weights of zero (open question 11) are explained, not hidden.** For Original 1 L the best weights are all 0. The screen says in one sentence that this is a result, not an error, and what it means for the forecast. The example series was not changed.
28. **A line chart of sales does not start at zero** on the second screen. Monthly sales move between 120 and 180, and from zero the differences between the methods would be invisible. Bars always start at zero.
