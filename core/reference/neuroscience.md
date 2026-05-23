<!--
SpiderBrain v3 © 2026 Perform Digital Pvt Ltd

Licensed under BUSL-1.1. Free for personal, educational, research, and open-source use. Forking and internal modification for research are permitted. Redistribution, hosted usage, commercial deployment, resale, sublicensing, or distribution of derivative works require a separate commercial license from Perform Digital Pvt Ltd.

Contact: contact@perform.digital
-->

# The neuroscience behind the spiderbrain

The spiderbrain is not a loose metaphor. Every construct in it maps onto a
real, documented feature of spider neuroanatomy or memory science. This file is
the grounding - read it once and the rest of the system explains itself.

## The problem: project Alzheimer's

Alzheimer's disease is, mechanically, a loss of **synapses** and the
progressive failure to **retrieve and link** memories. The brain still holds
fragments, but the connections that made them meaningful decay, and eventually
the map of the self is gone.

A large software project fails the same way. Knowledge of *why* a file exists,
*what* depends on it, and *what* a past decision was for lives in people's
heads. Between sessions - and between people - it evaporates. Dependencies are
implicit and undocumented, so they are silent synapses: when one decays, a
change in one place breaks another with no warning. The bigger the project, the
faster it forgets.

The spiderbrain is a **memory prosthesis** for the project. It does what a
treatment for Alzheimer's would do: externalise the memory so it cannot be
lost, make every synapse explicit so none can decay unnoticed, and consolidate
short-term work into durable long-term storage.

## Six findings, and what each one builds

### 1. The synganglion - one fused brain

Spiders have the most centralised nervous system of any arthropod. The entire
central nervous system is fused into a single mass - the **synganglion** -
packed into the cephalothorax, formed from two ganglia welded around the
esophagus.
→ **The spiderbrain is one folder.** A project's memory is a single, central
organ, not scattered notes. `synganglion.json` is the fused graph.
_Sources: [Biology Insights](https://biologyinsights.com/the-spider-brain-and-its-complex-nervous-system/),
[ScienceDirect - Supraesophageal Ganglion](https://www.sciencedirect.com/topics/agricultural-and-biological-sciences/supraesophageal-ganglion)._

### 2. Two halves - order and movement

The **supraesophageal ganglion** (above the gut) is smaller, wired straight to
the eyes, and does sensory and higher processing - *order and structure*. The
**subesophageal ganglion** (below) is larger and drives the eight legs and the
palps - *movement*.
→ **`spideyorder.md`** ranks every node by webscore (the structural map).
**`spideymove.md`** ranks every node by recency (what is moving now). A query
reads both halves at once.
_Sources: [Biology Insights](https://biologyinsights.com/the-spider-brain-and-its-complex-nervous-system/)._

### 3. The brain overflows into the legs

Quesada et al. (2011), Smithsonian Tropical Research Institute, published in
*Arthropod Structure & Development*: in the smallest spiders the CNS fills
**~80% of the body cavity and spills into ~25% of the leg volume**. The smaller
the spider relative to its task, the proportionally larger the brain.
→ **For a super-large project, the memory layer must be proportionally large
and distributed into the limbs.** The brain is not a central blob - docs live
inside every feature cluster (`pigi/`, `blogs/`, `admin/`, …). It reaches into
every leg.
_Sources: [Smithsonian Insider](https://insider.si.edu/2011/12/brains-of-tiny-spiders-fill-their-body-cavities-and-legs-smithsonian-researchers-find/),
[ScienceDaily](https://www.sciencedaily.com/releases/2011/12/111212124707.htm)._

### 4. The web is the spider's outsourced mind

Japyassú & Laland (2017), *Animal Cognition*, "Extended spider cognition": an
orb web is not just a trap - it is an **external cognitive system**. The spider
outsources memory and problem-solving into the silk. This is "extended
cognition" (Clark & Chalmers, 1998) made literal: thinking that happens outside
the skull.
→ **This is the whole thesis.** The spiderbrain folder *is* the web -
externalised project memory that survives context resets. Webscores and webmaps
are silk: cognition the project no longer has to hold in its head.
_Sources: [Quanta - "A Mind Made Out of Silk"](https://www.quantamagazine.org/the-thoughts-of-a-spiderweb-20170523/),
[Extended spider cognition (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5394149/)._

### 5. Tension tells the spider where to strike

Prey vibrations travel down the radial threads to the hub; the spider tunes
each thread's tension and reads which thread "rings" to localise prey,
decomposing the signal into the web's vibration modes.
→ **`webscore` is thread tension.** A query surfaces the node that rings
loudest = high webscore × recently moved. Importance and freshness, together.
_Sources: [Oxford - signal threads](https://www.ox.ac.uk/news/science-blog/good-vibrations-spider-signal-threads-reveal-remote-sensing-design-secrets),
[Prey localization via modal vibration (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9646800/)._

### 6. Portia plans the route before it moves

Portia jumping spiders - a brain the size of a sesame seed - execute winding
detours in two phases: a **scanning phase** (survey from a fixed vantage, pick
an unbroken path and intermediate goals) and a **locomotory phase** (execute
the detour). They mentally rehearse a route before committing to it.
→ **Before editing, the brain scans.** Read the node's cluster webmap, look at
its dependents, predict the cascade and the effort - *then* move. Plan a change
ahead of making it.
_Sources: [National Geographic](https://www.nationalgeographic.com/animals/article/160121-jumping-spiders-animals-science),
[Portia detour study (JEB)](https://journals.biologists.com/jeb/article/222/15/jeb203463/223379/Portia-s-capacity-to-decide-whether-a-detour-is)._

## The consolidation parallel

One more piece of memory science completes the design. During sleep, the
**hippocampus** replays the day's experience and transfers it into long-term
**neocortical** storage - short-term working memory is consolidated into
durable memory, and the slate is cleared for the next day.

→ **`cephalothorax/` is the hippocampus** - the volatile working set of the
current session. **`movemap.md` is the neocortex** - permanent long-term
storage. **`consolidate.mjs` is sleep** - run at deploy, it folds the session's
hot files into the movemap and clears the cephalothorax. A spiderbrain that is
never consolidated is a brain that never sleeps; it will not remember the day.

## The full mapping

| Spider biology / memory science | Spiderbrain construct | Role |
|---|---|---|
| Synganglion (fused CNS) | the `spiderbrain/` folder | one central memory organ |
| Supraesophageal ganglion | `spideyorder.md` | nodes ranked by webscore |
| Subesophageal ganglion | `spideymove.md` | nodes ranked by recency |
| Brain overflowing into the legs | per-cluster subfolders | memory distributed into every limb |
| The web (extended cognition) | webmaps + webscores | outsourced project memory |
| Thread tension | `webscore` | how hard a node rings; blast radius |
| Prey-vibration localisation | query = webscore × recency | surface what matters AND moves |
| Portia's scan-then-move detour | scan dependents before editing | plan a change ahead |
| Cephalothorax (where the CNS sits) | `cephalothorax/` | the session's hot-file working set |
| Hippocampus → neocortex in sleep | `cephalothorax` → `movemap` | short-term consolidated to long-term |
| Moulting | `molt.mjs` | shed indexing that no longer fits |
| Prey | the goal in `spiderbrain.config.json` | what every webscore is judged against |

## Cortical rhythms - the theta-gamma layer

The spider gave the brain its **structure** - the web, the synganglion, the
distributed anatomy. The cortex gives it **rhythm**.

In the hippocampus and cortex during memory work, a slow **theta** rhythm
(~4–8 Hz) and a fast **gamma** rhythm (~30–100 Hz) are coupled: the phase of
theta dictates the amplitude of gamma - phase-amplitude coupling. Theta is the
carrier; gamma rides it. Recall replays a theta-nested sequence of gamma cycles
- theta supplies the order and the frame, gamma the fast content. It is
laminar: slow rhythms run deep, gamma in the superficial layers; the deep
layers set the tempo the superficial layers execute on.

→ A **master** is theta: slow, governing. A cluster of **gamma** executors runs
fast beneath it. Together they are a **column**. `webscore` is mass; `amplitude`
is mass modulated by the master's phase.

One fact closes the loop with the project's mission: **reduced theta-gamma
coupling is a documented signature of Alzheimer's.** A project whose clusters
have drifted out of phase with their masters - changed independently, the
coupling lost - carries the same fingerprint. The column layer measures it.

spiderBrain uses two bands, theta and gamma - right for medium-to-large
projects. The full cortical spectrum has five (gamma, beta, alpha, theta,
delta); a future **spiderWaveBrain** would layer all five, a node migrating
down the bands as it stabilises. That is a separate, larger model.
