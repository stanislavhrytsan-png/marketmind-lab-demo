# MarketMind Lab: clickable demo

A front-end demo of MarketMind Lab, built from the design concept. It tells one connected story with the Alpine Oat Co. case: a student runs a conjoint analysis and interprets it with the AI tutor, then a professor sets up the assignment and reviews the submissions. The module library next to the story holds further modules on the company data of the same case. They are listed under "The further modules".

**The numbers are real, the AI tutor is not.** Every number on the screens is a result of the MarketMind Lab calculation engine on the fictional Alpine Oat Co. data. The engine calculated them once and wrote them into one file. The demo reads that file and does not run the engine itself. The AI tutor is still a script: no AI is called. There is no backend, no database and no login. The sections "Where the numbers come from" and "What is fake and what would be real" list this in detail.

**Live demo:** https://stanislavhrytsan-png.github.io/marketmind-lab-demo/

## Run the demo

You need Node.js 20.19 or newer.

```bash
cd demo
npm install
npm run dev
```

Then open the address shown in the terminal, normally http://localhost:5173, in Chrome.

- **Window size.** The demo is designed for a window 1440 px wide. In a narrower window the whole interface scales down to fit, so the layout stays the same. Mobile is not supported.
- **Start again.** Reload the page. Nothing is saved, so every reload starts the story from the beginning. The name block at the bottom left also has "Restart the demo".
- **Offline.** Fonts and data are bundled. Once `npm install` has run, the demo needs no internet.

### Build a static site

```bash
npm run build
```

The result is the folder `demo/dist`: plain static files with relative paths and hash URLs. It can be hosted as it is on Vercel, GitHub Pages or any web space, also in a subfolder. `npm run preview` serves the built site locally.

### The online version

The demo is published with GitHub Pages from the repository `stanislavhrytsan-png/marketmind-lab-demo`. This `demo` folder is that repository.

- Every push to the `main` branch rebuilds the site and publishes it. The recipe is `.github/workflows/deploy.yml`. Publishing takes about a minute.
- The page asks search engines not to list it, so people reach it only through the link.
- The repository is public: anyone can read the code and the example data.
- To take the site offline, open the repository on GitHub, go to Settings, then Pages, and choose "Unpublish site". Deleting the repository removes the site and the code.
- To publish a change:

```bash
git add -A
git commit -m "Describe the change"
git push
```

## The demo path, click by click

About 5 minutes. Each step says what to click and what to say. Start on the Course home with a fresh reload.

### 1. Course home

- **Say:** "This is what a student sees. The assignment in progress is on top, with its deadline, the step she is on and one next action. Every assignment shows which AI mode the professor chose."
- **Point at** the legend on the right: Off, Coach, Explain.
- **Click** "Case brief and data" in the sidebar.

### 2. Case brief and data

- **Say:** "The business question comes first, in the largest type. Then a summary of the data in four numbers and one plain sentence per variable. The raw table is one click away, but closed."
- **Optional:** open "Raw data table" at the bottom.
- **Click** "Set up conjoint analysis" in the card at the top right.

### 3. Conjoint setup

- **Say:** "Every setting says what it does and when to choose it, and the default is marked. The restriction is written as a sentence and shows how many products it removes. On the right, the run has a name before it starts."
- **Optional:** type your own label in "Your label". It shows up again in the run history.
- **Optional:** tick the third scenario in "Scenario batch". The card on the right now announces three runs. The demo only has results for the default settings, so click "Back to defaults".
- **Click** "Run 2 scenarios". The results open after about two seconds.

### 4. Conjoint results and market simulator

- **Say:** "Results come in layers: one headline, then the key results, then the simulator, and the details at the bottom. The headline states a finding, never the decision. The student still has to interpret."
- **In "Part-worths",** switch from "All respondents" to "Price-sensitive". **Say:** "The overall picture hides how different the segments are."
- **Scroll to the simulator.** Change "Price" from CHF 2.50 to CHF 1.90. The share rises from 45% to 59%. **Point at** the Health-focused column: it only moves from 86% to 92%. Price-sensitive jumps from 16% to 39%.
- **Optional:** click "By revenue" in "Best product search". The saved design at CHF 2.50 comes second, ahead of the same product at CHF 1.90: the lower price wins buyers but earns less.
- **Click** "Reset to saved design", scroll up and **click** "Compare".

### 5. Run history and compare

- **Say:** "Every run has an ID, a label, a time and its settings in one line. Here are the two runs I just created. Identical settings fade back, the one changed setting is marked, and one sentence says what changed."
- **Tick** "Hide what is identical".
- **Optional:** tick SEG-02 and SEG-03 in the list. This is the comparison from the concept: two segments stay the same, one splits in two. Here it is Health-focused that splits.
- **Click** "Interpretation" in the sidebar.

### 6. Interpretation with the AI tutor

- **Say:** "This is the core idea. The student writes her own interpretation first. The plate on top shows which mode the professor chose and why. And she is told that the professor can read her text and the conversation."
- **Coach mode (already active):** read the coach's question aloud. Click "Ask for a hint". Then click the reply field, which inserts Lea's next answer, and send it. **Say:** "The coach asks and gives hints. It never writes the conclusion."
- **In the strip "Demo control",** click "Explain". The explanation is locked. Click "Submit interpretation": now the full explanation appears.
- **In "Demo control",** click "Off". No AI at all. The interpretation box stays.
- **Say:** "The strip called Demo control is not part of the product. A student cannot change the mode."

### 7. Professor: assignment setup

- **Click** the name block at the bottom left, then "Prof. Elena Marti".
- **Say:** "Four decisions: case, modules, deadline, and how much help the AI may give. The last one is what no other tool offers."
- **Click** the "Explain" card, then "Coach" again. The preview on the right shows what students will see. Change a word in "Your reason": it changes on the plate too.
- **Click** "Publish to 46 students".

### 8. Professor: submissions review

- **Click** "Submissions" in the sidebar.
- **Say:** "First the whole class: the three most common mistakes, with counts, so I know what to reteach. Then one student: her own reasoning, the runs she cites, her conversation with the coach, and feedback that the AI drafted."
- **Click** "Edit comment" to show that the draft can be changed, then "Approve and send to Lea". The numbers on top change.
- **Closing line:** "The professor grades the student's thinking, not a chatbot's."

### If there is time

"Segmentation" and "Positioning" in the sidebar open three more screens. They are view-only: you can read them, open the details and hover the charts, but not change settings. On the positioning map the three switches under "Show on the map" work.

The further modules each take one to two minutes. Their click paths are in the next section.

### Good to know while presenting

- The student story starts just before the conjoint run. The three conjoint runs appear in the run history when you press "Run 2 scenarios". The runs of the further modules are there from the start: in the story they come from the weekly exercises in October.
- The two professor screens show the same assignment at two other moments: before it is published, and after the deadline.
- A control that answers "Not part of this demo" exists in the concept but is not built here.

## The further modules

The modules below work with records the company keeps itself: sales, prices, customers. Each one follows the same pattern as the conjoint results: one headline, the key results, a card "Watch out" with a trap the engine found in the data, details on demand, and the AI tutor in Coach mode at the end. Where the arithmetic is simple, the student can change a number and the browser calculates the answer with the engine's formula. "Open setup" under the run name shows every setting with the engine's own texts on what it does and when to choose it.

Start each path with a click on the module in the sidebar.

### Forecasting

- **Say:** "A new product first. The headline is a finding, not a decision: the subscription is heading for about 59,400 households."
- **Point at** the card "Watch out". **Say:** "The engine found this trap, and the screen keeps it in view. After 4 quarters the same model said 429,910 subscribers by the end of 2025. In reality there were 55,250."
- **In "What if",** drag "Imitation (q)" to the left. The curve flattens and the peak moves to the right. **Say:** "The estimate is the engine's. The curve for other values is calculated in the browser, with the engine's formula."
- **Optional:** choose "Typical durable product" under "Start from". The curve of a similar product replaces the estimate.
- **Scroll to "Interpretation".** Click the reply field, then send. **Say:** "The student's own reading comes first. The coach answers with a question."
- **Optional:** click "Existing product" at the top, then "Vanilla 1 L". Two methods are almost level, and the screen says that a narrow win proves little.

### Price optimization

- **Say:** "Ten prices were tested in stores. The engine fits three forms of demand curve and reads the best price from the one that fits best: profit is highest at about CHF 2.47."
- **Point at** the card "Watch out". **Say:** "Two curves fit the tests equally well and agree on the price. The third fits worse and recommends CHF 1.90. If the best curve is right, that price gives away 28% of the profit. The engine's own warning is quoted under the table."
- **In "What if",** drag "Unit cost" to the right: the best price rises. Then drag "Your price" away from the best price: the last number says how much profit that costs.
- **Optional:** click "From the conjoint study" at the top. The same question, answered with the market simulator of the conjoint study: CHF 3.16. Two sources, two answers, and the screen says what each one measures.

### Predictive modeling

- **Say:** "Last year 5,000 customers got a letter about the subscription. The engine learned from 3,500 of them who responds, and tested the model on the other 1,500. The best-rated tenth responds 3.2 times as often as the average."
- **Point at** the card "Watch out". **Say:** "This is the classic trap. The model is right about 86.0% of the customers, which sounds good. But saying 'nobody responds' is right about 85.7%. The table shows what happens when the threshold moves: the more responders the model finds, the worse its hit rate looks."
- **In "What if",** drag "Cost per contact" to the right. Fewer customers are worth a letter. **Say:** "The question for a manager is not the hit rate. It is how many letters to send. At CHF 2.50 a letter and CHF 30 per new subscriber, the best half of a list of 50,000 earns CHF 107,500."
- **Optional:** click "Decision tree" at the top: the second model on the same customers, with its rules in the details.

### Customer lifetime value

- **Say:** "What is a subscriber worth over the whole relationship? The engine estimates the retention rate of each segment from the cohort data. All current subscribers together are worth CHF 1,682,511."
- **Point at** the first card. **Say:** "A new Health-focused subscriber is worth more than seven times the cost of winning one. A new Price-sensitive subscriber is worth CHF 143 and costs CHF 160 to win."
- **Point at** the card "Watch out". **Say:** "A company that uses one retention rate for all subscribers would not see this. With one rate the same subscriber seems worth CHF 201. The disloyal leave first, so the average rate even seems to rise with age."
- **In "What if",** the formula starts from the Price-sensitive subscriber. Drag "Retention rate per year" to the right until the value passes the acquisition cost. **Say:** "The retention rate moves the value far more than the discount rate."

### Resource allocation

- **Say:** "Nobody has data on what sales would be at every level of advertising. But a regional manager can answer four questions. The engine draws a response curve through the four answers and searches for the best split. Split differently, the same budget earns 9.6% more profit."
- **Point at** the first card. **Say:** "Basel gets nothing. That is a result, not an error: its curve is flat, and its advertising costs more than the margin it brings in."
- **Point at** the card "Watch out". **Say:** "The split is only as good as the answers. One answer that is 2% off can move a quarter of a region's budget."
- **Point at** "Is the budget itself right?". **Say:** "Asked whether more money would pay, the engine stops at CHF 1,132,000 and leaves the rest."
- **In "What if",** click "Best split (RA-01)", then drag one slider. **Say:** "At the best split, one more franc earns the same in every region. Any move away from it costs profit."

## Where the numbers come from

The calculation engine is in the folder `engine`, next to this one. One command runs it on the Alpine Oat Co. data and writes everything the demo shows into `src/data/engine_results.json`:

```bash
cd ../engine && .venv/bin/python -m marketmind.export_demo
```

- **Real runs only.** The file holds the eight runs of the assignment (SEG-01 to SEG-04, POS-01 and CJ-01 to CJ-03) and the runs of the further modules: FC-01 to FC-04 (forecasting), PR-01 to PR-04 (price optimization), TG-01 and TG-02 (predictive modeling), LV-01 and LV-02 (customer lifetime value) and RA-01 and RA-02 (resource allocation). Each one is a real run of the engine with the settings the demo names.
- **The engine's own words.** The file also holds the engine's description of every setting of the further modules (what it does, when to choose it), and the warnings and reading notes of each result. The setup screens and the notes marked "The engine says" show them word for word.
- **Texts follow the numbers.** Sentences that quote a number are built from the file: in `src/data/alpineOat.ts` for the assignment, and in one data file per further module (for example `src/data/forecasting.ts`). This covers the tutor scripts, Lea's texts and the feedback draft. A text cannot disagree with a chart.
- **Do not edit the file by hand.** Change the engine or its data, then run the export again.

Three checks keep the demo and the engine together:

| Check | What it tells you |
|---|---|
| `python -m marketmind.export_demo --check` in the engine folder | Whether the file is still exactly what the engine gives. The engine's test suite runs the same check. |
| `npm run check` in this folder | Whether everything the browser calculates is what the engine gives: the market simulator (shares within 0.1 percentage points, the same best products) and the what-if views of the further modules (within 0.1% of the engine's value). And whether the presenting scripts above quote the engine's numbers. The list of checks is in `src/lib/checks.ts`. |
| `npm run build` | Whether the data file still fits the screens. |

## What is fake and what would be real

| Part | In this demo | In the real product |
|---|---|---|
| Data | Summary numbers of the engine's example data: 300 respondents, invented for the case. The raw table shows the first six rows. The survey itself is not in the demo. | Real survey data per case. Summary and raw table come from the data. |
| Segmentation and positioning | Real results of the engine, calculated before and read from a file. The screens are view-only. | Clustering and the perceptual map are calculated when the student runs them, with the settings the student picked. |
| Conjoint estimation | "Run 2 scenarios" waits about two seconds and opens results the engine calculated before. The part-worths are the engine's estimates from the choice tasks. Only the default settings can be run. | Part-worths are estimated when the student presses Run, for the settings the student picked. |
| Market simulator | Real arithmetic in the browser, on the engine's part-worths and with the engine's rule. A product's utility is the sum of its levels' part-worths. Shares follow the logit rule inside each segment and are then weighted by segment size (38%, 34%, 28%). The same product gets the same share as in the engine. | The same arithmetic, plus the first choice rule and several designs at once. |
| Importance, most preferred level, best product search | Calculated in the browser from the same part-worths. The search really checks all 96 allowed products. "By revenue" is share times price. | The same. |
| Run history | 8 runs, each a real run of the engine, calculated before. The 3 conjoint runs appear when you press Run. Dates and labels are part of the story. Labels can be edited, until the next reload. | Every run is stored with its settings and results. |
| Compare | The settings table is worked out from the two runs. Result comparisons exist for three pairs: CJ-01 with CJ-02, CJ-02 with CJ-03, SEG-02 with SEG-03. Their sentences are fixed, their numbers come from the engine. | Any two runs of a module can be compared, settings and results. |
| AI tutor | No AI. Fixed text: the coach's questions, three hints, the replies that a click inserts, and one explanation. Only the numbers in these texts come from the engine. The mode switch is a demo control. | A language model that reacts to what the student wrote, inside the limits of the mode the professor set. |
| Interpretation | The text box works and counts words. Nothing is saved or sent. | Saved, submitted and visible to the professor. |
| Assignment setup | The choices change the preview. "Publish" changes nothing outside this screen. | Creates the assignment for the class and locks the AI mode. |
| Submissions review | One student is filled in (Lea Brunner). The class numbers, the common mistakes and the feedback draft are fixed text with the engine's numbers. "Approve" only changes the counters. | All submissions, mistakes found across the class, an AI draft per student, sent after approval. |
| Accounts | No login. The name block at the bottom left switches between student and professor. | Accounts and roles. |
| Forecasting | Real results of the engine, calculated before: the Bass model on 12 quarters of sales, the same model from the first 4, 6 and 8 quarters, and four methods compared on three sales series. The what-if view draws the Bass curve for other values in the browser, with the engine's formula. The setup screens are view-only. | Estimated when the student presses Run, on the data and with the settings the student picked. |
| Price optimization | Real results of the engine, calculated before: three forms of demand curve fitted to the price tests of three products, the best price of each, and a demand curve from the conjoint study. The what-if view moves along the engine's curves in the browser: another unit cost, another form, another price. | Fitted when the student presses Run, on the data and with the settings the student picked. |
| Predictive modeling | Real results of the engine, calculated before: a logistic regression and a decision tree, fitted on 3,500 customers of a past campaign and tested on 1,500 others, with the gains and lift table and the table of right and wrong predictions at four thresholds. The what-if view repeats only the arithmetic of the campaign in the browser: profit by depth for another cost, margin or list size. | Fitted when the student presses Run. New customers are scored with the stored model. |
| Customer lifetime value | Real results of the engine, calculated before: the retention rate of each segment from six yearly cohorts, the value of 3,882 current subscribers per segment, and the same with one retention rate for everyone. The what-if view applies the engine's formula in the browser to another margin, retention rate, discount rate, acquisition cost or payment convention. | Calculated when the student presses Run, on the cohort data and the customers of the case. |
| Resource allocation | Real results of the engine, calculated before: a response curve per region from four judgments, the best split of the budget, the best split for 17 other budgets, and the split again with one judgment changed by 2%. The what-if view values a split of your own in the browser, with the engine's curves. The search for the best split is not repeated in the browser. | The student enters the judgments, and the engine searches when Run is pressed. |
| AI tutor in the further modules | One short scripted exchange per module, in Coach mode. Fixed text with the engine's numbers. | A language model, inside the limits of the mode the professor set. |
| Modules marked "coming soon" | Names in the navigation. The engine already calculates them. | Built into the interface one by one. |

Controls that the concept shows but the demo does not build answer with "Not part of this demo" when clicked. Examples: Export as Python or R, Add level, Add attribute, Add restriction, Add design, Pin another result, the datasets "Brand perceptions" and "Conjoint choices", Ideal points on the map, Prepare a recap for the next lecture, Compare drafts, Discard draft, Save as draft, the quiz and feedback buttons on the course home, and the help button.

## Where things are

```
demo/
  src/
    data/engine_results.json  the engine's results, written by the engine's export command
    data/alpineOat.ts      the texts of the assignment, and how the engine's numbers reach its screens
    data/forecasting.ts    one data file per further module (forecasting, pricing, ...): its texts, runs, setup and tutor script
    data/moduleKit.ts      what the further modules share: settings help of the engine, setup, tutor script
    data/library.ts        all modules and all runs in one place
    lib/conjoint.ts        the simulator arithmetic (utility, logit shares, importance, search)
    lib/forecasting.ts     one file per calculation in the browser (forecasting, pricing, ...), each with its check against the engine
    lib/checks.ts          the list of everything `npm run check` compares
    lib/                   demo state (which runs exist, run labels), number formats, chart scales, window scaling
    components/            reusable components that follow the style guide
      ui.tsx               buttons, cards, tags, run tag, AI mode chip, option card, details
      Shell.tsx            sidebar, top bar, page frame
      results.tsx          run header, depth rail, importance table, segment size bar
      charts.tsx           Recharts: part-worths and bar charts
      plot.tsx             plain SVG: the line, point and column charts of the further modules
      module.tsx           headline, numbers, the "Watch out" card, slider, and the tutor card of the further modules
      PerceptualMap.tsx    Recharts: the positioning map
      Dendrogram.tsx       the segmentation tree (plain SVG)
      tutor.tsx            mode plate and AI tutor panel
    screens/student/       one file per student screen
    screens/professor/     one file per professor screen
    screens/modules/       the screens of the further modules, and one setup screen for all of them
  scripts/
    check-engine-numbers.mjs  what `npm run check` runs
```

Built with React, Vite, TypeScript, Tailwind CSS and Recharts. The colours, type sizes and spacing in `src/index.css` are the tokens of the concept's style guide.

To change a text, edit `src/data/alpineOat.ts` or the data file of the module. To change a number, change the engine and run the export again (see "Where the numbers come from"). In development mode the browser console shows a warning if a calculation in the browser and the engine disagree.

## Where the demo differs from the concept screens

- **One timeline.** The 11 concept screens show different moments. The demo starts just before the conjoint run, so a few texts differ, for example the "next step" card on the case brief.
- **Compare for the conjoint runs.** The concept only draws the comparison of two segmentation runs. The comparison of CJ-01 and CJ-02 is new content in the same layout.
- **Demo control and role switch.** The strip above the AI tutor and the menu on the name block exist only in the demo.
- **Off and Explain modes.** The concept draws the tutor panel in Coach mode only. The other two modes follow the style guide's mode plate.
- **Positioning.** The cards sit to the right of the map, as the concept report describes. In the concept image they are stacked below it.
- **Hints.** The coach conversation starts with 0 of 3 hints used, so that every hint you ask for is visible.
- **Small additions that make the path clickable.** "Open setup" next to a run's summary, "Reset to saved design" in the simulator, and "Back to defaults" on the conjoint setup.
- **Case brief.** One extra line says that the case is fictional and all numbers are invented.
- **The engine's variables.** The concept draws 8 basis variables on a scale from 1 to 7 and 6 descriptors. The demo shows the engine's data: 10 basis variables on a scale from 0 to 9 and 4 descriptors. The layout is the same.
- **The engine's numbers.** All numbers differ from the concept images, because they are now calculated. Two things changed with them: in the comparison of SEG-02 and SEG-03 it is Health-focused that splits, and on the positioning map the labels sit where the calculated map leaves room.
- **Submissions.** The student list shows all students when the screen opens. The concept highlights "To review" but lists everyone.
- **The further modules.** The concept draws three modules and lists nine as "coming soon". Their screens are new. They reuse the patterns of the concept: run header, depth rail, guided settings, the mode plate. Three things are new: the card "Watch out", sliders, and line charts.
- **Run history.** With more than four modules the filter is a list to pick from. The concept draws chips, which do not fit twelve modules.
