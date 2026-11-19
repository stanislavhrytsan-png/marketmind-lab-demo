# MarketMind Lab: clickable demo

A front-end demo of MarketMind Lab, built from the design concept. It tells one connected story with the Alpine Oat Co. case: a student runs a conjoint analysis and interprets it with the AI tutor, then a professor sets up the assignment and reviews the submissions.

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

### Good to know while presenting

- The student story starts just before the conjoint run. Until you press "Run 2 scenarios", the run history holds 5 runs. After that it holds 8.
- The two professor screens show the same assignment at two other moments: before it is published, and after the deadline.
- A control that answers "Not part of this demo" exists in the concept but is not built here.

## Where the numbers come from

The calculation engine is in the folder `engine`, next to this one. One command runs it on the Alpine Oat Co. data and writes everything the demo shows into `src/data/engine_results.json`:

```bash
cd ../engine && .venv/bin/python -m marketmind.export_demo
```

- **Eight real runs.** The file holds the eight runs of the run history: SEG-01 to SEG-04, POS-01 and CJ-01 to CJ-03. Each one is a real run of the engine with the settings the demo names.
- **Texts follow the numbers.** Sentences that quote a number are built from the file in `src/data/alpineOat.ts`. This covers the tutor script, Lea's texts and the feedback draft. A text cannot disagree with a chart.
- **Do not edit the file by hand.** Change the engine or its data, then run the export again.

Three checks keep the demo and the engine together:

| Check | What it tells you |
|---|---|
| `python -m marketmind.export_demo --check` in the engine folder | Whether the file is still exactly what the engine gives. The engine's test suite runs the same check. |
| `npm run check` in this folder | Whether the simulator in the browser gives the engine's shares (within 0.1 percentage points) and the engine's best products, and whether the presenting script above quotes the engine's numbers. |
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
| Other modules | The 9 "coming soon" modules are names in the navigation. The engine already calculates them. | Built into the interface one by one. |

Controls that the concept shows but the demo does not build answer with "Not part of this demo" when clicked. Examples: Export as Python or R, Add level, Add attribute, Add restriction, Add design, Pin another result, the datasets "Brand perceptions" and "Conjoint choices", Ideal points on the map, Prepare a recap for the next lecture, Compare drafts, Discard draft, Save as draft, the quiz and feedback buttons on the course home, and the help button.

## Where things are

```
demo/
  src/
    data/engine_results.json  the engine's results, written by the engine's export command
    data/alpineOat.ts      all texts of the demo, and how the engine's numbers reach the screens
    lib/conjoint.ts        the simulator arithmetic (utility, logit shares, importance, search)
    lib/                   demo state (which runs exist, run labels), window scaling
    components/            reusable components that follow the style guide
      ui.tsx               buttons, cards, tags, run tag, AI mode chip, option card, details
      Shell.tsx            sidebar, top bar, page frame
      results.tsx          run header, depth rail, importance table, segment size bar
      charts.tsx           Recharts: part-worths and bar charts
      PerceptualMap.tsx    Recharts: the positioning map
      Dendrogram.tsx       the segmentation tree (plain SVG)
      tutor.tsx            mode plate and AI tutor panel
    screens/student/       one file per student screen
    screens/professor/     one file per professor screen
  scripts/
    check-engine-numbers.mjs  what `npm run check` runs
```

Built with React, Vite, TypeScript, Tailwind CSS and Recharts. The colours, type sizes and spacing in `src/index.css` are the tokens of the concept's style guide.

To change a text, edit `src/data/alpineOat.ts`. To change a number, change the engine and run the export again (see "Where the numbers come from"). In development mode the browser console shows a warning if the simulator and the engine disagree.

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
