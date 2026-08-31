IPO Tracker --- Visual Design Upgrade Specification

From polished SaaS dashboard → credible financial intelligence product

Version: 1.0
Scope: Visual/UI refinement only. Preserve existing product
functionality, data model, routes, interactions, and business logic
unless a visual change explicitly requires a UI-state adjustment.

1. Design Objective

The current IPO Tracker interface is already clean, consistent, and
visually polished. The goal of this pass is not to redesign the
product from scratch.

The objective is to move the visual system from approximately 7--8/10
to 9/10+ by making the interface:

more information-hierarchical

more financially credible

more typographically precise

more semantically expressive

less dependent on bordered cards

more efficient to scan

clearer about what the user should do next

Design north star

Every visual decision should make the next investment decision
faster, clearer, and more trustworthy.

The product should feel like:

Vercel/Geist restraint + Stripe precision + Linear information
hierarchy + financial-terminal numeric clarity + IPO Tracker's warm
orange identity.

Do not make it look like a generic fintech app, trading terminal, or
colorful consumer finance product.

2. Core Design Principles

2.1 Hierarchy over decoration

The UI currently gives too many elements similar visual weight.

From now on, establish this hierarchy:

What should I do?

Why should I do it?

What evidence supports the recommendation?

What financial constraint or risk matters?

Secondary metadata

The interface should never make the user hunt for the recommendation.

2.2 Reduce card dependency

Do not put every piece of information inside a bordered card.

Use cards when content needs:

containment

comparison

independent interaction

visual grouping

state separation

Use open sections for:

KPI groups

headings

simple metadata

supporting information

The visual system should feel lighter and more mature without becoming
sparse.

2.3 Orange is the brand, not the meaning of everything positive

The existing warm orange/coral brand color is good and should remain.

However, orange is currently used for too many semantic purposes.

Use:

Orange: brand, primary action, selected navigation, key
interaction

Green: positive financial outcome / successful gain

Amber: watch / uncertainty / caution

Red: negative financial outcome / avoid / over-allocation

Gray: neutral, inactive, secondary information

Do not make semantic states depend on orange.

2.4 Numbers should dominate labels

This is a financial intelligence product.

Users should be able to scan:

+8% · 212.14× · 2.9%

before reading:

GMP Premium · QIB Demand · Allotment Odds.

Labels provide context. Numbers provide the signal.

2.5 Calm, not flashy

Avoid:

gradients as decoration

excessive shadows

oversized illustrations

large colored backgrounds

excessive badges

excessive rounded containers

animation for purely decorative purposes

The product should communicate confidence through restraint.

3. Global Design System

3.1 Typography

Use one primary sans-serif typeface throughout the product.

Recommended hierarchy:

Token                          Size     Weight Use

Page Title                 28--32px        600 Main page heading
Section Title              18--20px        600 Major sections
Card Title                 15--16px        600 IPO/company titles
Body                           14px        400 Primary supporting copy
Body Medium                    14px        500 Important supporting copy
Caption                        12px   400--500 Metadata
Micro                      10--11px   500--600 Rare uppercase labels
KPI Number                 28--32px        600 Dashboard metrics
Large Financial Number     30--36px        600 Major monetary metrics

Typography rules

Do not use uppercase labels everywhere.

Reserve uppercase for short classifications such as BIDDING,
OPEN NOW, STATUS.

Prefer sentence case for normal labels:

Active / ongoing IPOs

QIB demand

Allotment odds

Available liquid cash

Increase contrast between primary and secondary text.

Avoid very light gray text for information users actually need.

Use tabular numerals for financial and comparative numbers where
supported.

Use a mono/technical typeface selectively for:

IPO symbols

timestamps

financial identifiers

dense numerical data

Do not make the whole product monospace.

4. Color Tokens

The following values are a starting point. If the existing codebase
already has equivalent tokens, consolidate rather than duplicate.

Neutral

text-primary:     #171717
text-secondary:   #5F6368
text-tertiary:    #8B9198

surface-page:     #FFFFFF
surface-subtle:   #FAFAFA
surface-muted:    #F5F6F7

border-default:   #E7E8EA
border-strong:    #D9DBDE

Brand

brand:            #E55C3D
brand-hover:      #D94F31
brand-soft:       #FFF1ED

Semantic

success:          #168A5B
success-soft:     #ECF8F2

warning:          #B7791F
warning-soft:     #FFF7E6

danger:           #C83B3B
danger-soft:      #FFF0F0

neutral:          #667085
neutral-soft:     #F4F5F6

Color rule

Never use a semantic color only through text color.

For important states, combine:

icon

label

subtle background or border

text

This ensures meaning remains scannable and accessible.

5. Surfaces, Borders, Radius and Shadows

Borders

Default:

1px solid #E7E8EA

Avoid dark gray borders.

Radius

Use a restrained radius system:

sm: 6px
md: 8px
lg: 12px
pill: 999px

Do not make every component 16--20px rounded.

Shadows

Default: none.

Use subtle elevation only for:

dropdowns

popovers

modals

floating actions

The main dashboard should rely primarily on whitespace and borders.

6. Spacing System

Use an 8px base rhythm.

4
8
12
16
20
24
32
40
48
64

Recommended page structure:

Page horizontal padding: 32--40px

Page title → description: 6--8px

Major section spacing: 32--40px

Card internal padding: 20--24px

Dense table row padding: 14--16px

KPI group spacing: 24--32px

Do not increase whitespace simply to make the interface feel premium.
This is an information-dense financial product.

7. GLOBAL NAVIGATION

Current state

The sidebar is already clean and should largely be preserved.

Changes

Logo

Keep:

IPO Tracker

Keep the small version marker if useful, but reduce its visual
prominence.

v2.0 should behave like metadata, not branding.

Navigation

Use:

14px text

medium weight for active/important states

neutral gray for inactive

brand orange only for active navigation

The active navigation treatment should be subtle:

soft brand background

brand text/icon

thin or no border

Avoid making the active item look like a large button.

Sidebar footer

The user profile and Sign Out section is fine.

Reduce visual competition with the main application.

8. PAGE 1 --- DASHBOARD

Purpose

This is the highest-priority page.

The dashboard should answer within 3--5 seconds:

How many IPOs need attention?

Which ones should I apply to?

Which ones should I avoid?

Why?

What is the current financial state?

8.1 Header

Current

Welcome back, Prabhat

Keep, but improve hierarchy

Page title:

Welcome back, Prabhat

Size: 28--30px
Weight: 600

Supporting text:

Here is your IPO decision brief for today.

Use 14px secondary text.

Avoid overly descriptive copy.

8.2 KPI area

Current KPI cards are too heavily contained.

Change to a lightweight KPI strip.

Recommended:

4                    2                  ₹0                  ₹0
Open IPOs            Upcoming           Invested             Realized profit

Numbers:

28--32px / 600

Labels:

12--13px / 500

Avoid four large bordered cards unless the product requires card
interaction.

Priority

Open IPOs and Realized profit are more decision-relevant than
Linked/secondary metadata.

Do not give all four identical visual weight if their importance
differs.

9. DASHBOARD --- IPO PIPELINE

This is the core product section.

Section header

Left:

IPO Pipeline

Right:

Last checked 31 Aug, 05:59:26 PM

Then:

Sync Market

Keep Grid/List toggle.

Important

The sync timestamp should look technical/secondary.

Use a subtle mono treatment for the timestamp.

9.1 Tabs

Current:

Recommended / Open Now / Upcoming / Closed

Keep the structure.

Change visual treatment:

Active tab: brand text + subtle brand-soft background

Inactive tabs: secondary gray

Counts: compact neutral pills

Avoid making the active tab look like a large CTA.

10. IPO CARD --- MOST IMPORTANT COMPONENT

The IPO card needs the largest visual improvement.

Current problem

The recommendation is buried inside the card.

New hierarchy

The eye should read:

IPO name → decision → reason → evidence → financial requirement

Structure

BIDDING                                      Closes 1 Sep

Priority Jewels IPO
PRIORITYJ

NO — AVOID
Real-time demand below threshold

GMP Premium      QIB Demand       Allotment Odds
+8%              1.68×            2.6%

2 mandatory checks failed · 3/8 checks passed

₹15,000 / lot                         View details →

10.1 IPO title

Name:

15--16px / 600

Symbol:

11--12px / mono / tertiary

Close date:

12px / secondary

Do not make the date compete with the company name.

10.2 Recommendation block

This is the most important part.

YES

✓ YES — APPLY

Use:

green text

subtle green background

green icon

MAYBE

△ MAYBE — WATCH

Use:

amber

subtle amber background

NO

× NO — AVOID

Use:

restrained red

subtle red background

The recommendation should visually dominate the supporting metrics.

10.3 Reason

Use:

Reason: Real-time demand below threshold

Reason: should be 12px / 600.

Explanation should be 12--13px / secondary.

Do not make the reason look like an error message.

10.4 Metrics

Use three equal columns.

Labels:

12px / secondary

Numbers:

18--20px / 600

Example:

GMP Premium       QIB Demand        Allotment Odds
+8%               212.14×           2.9%

Do not use uppercase unless there is a strong reason.

10.5 Rule result

Current:

2 mandatory failed · 3/8 checks passed

Make this more explicit:

2 mandatory checks failed · 3 of 8 checks passed

Use 12px.

For positive cards:

0 mandatory checks failed · 7 of 8 checks passed

10.6 Footer

Left:

₹15,000 / lot

Right:

View details →

The price should be stronger than the link.

Use brand orange only on the action.

11. DASHBOARD --- LOWER CONTENT

Cumulative Profit Growth

This should be a true analytical section, not an empty decorative chart
container.

Heading:

Cumulative profit

Secondary control:

₹0 Total gain

Chart:

use thin line

subtle grid

minimal axes

no unnecessary decoration

tooltips on interaction

clearly distinguish positive/negative regions if applicable

If there is insufficient historical data, show an intentional empty
state rather than a large empty chart.

Example:

No realized gains yet

Complete your first IPO cycle to start tracking cumulative profit.

Allocation Win Rate

Current donut is visually weak.

If the value is 0%, do not display a large empty donut as the primary
visual.

Prefer:

0%

Allocation win rate

Then a subtle progress/ring treatment.

As data increases, the visualization can become more prominent.

12. PAGE 2 --- BACKTEST ENGINE

This is currently the strongest page.

Use it as the visual reference for the rest of the application.

Header

Backtest Engine

28--30px / 600

Description:

Adjust parameters to evaluate historical IPO decisions against simulated allocation outcomes.

Primary CTA:

Run backtest

Brand orange.

13. BACKTEST KPI STRIP

Current cards are acceptable but can be lighter.

Show:

Past 3 Years
21 Listings
86%

with supporting labels.

For the win rate:

86%

should be the dominant number.

Secondary:

12 wins · 6 avoided losses

Use semantic colors only where helpful.

14. BACKTEST SETTINGS

Current:

Simulator Settings (GMP & Subscription Thresholds)

is too visually flat.

Make it a collapsible configuration section.

Header:

Simulator settings

Supporting:

GMP & subscription thresholds

Show an expand/collapse affordance.

When open:

grouped controls

explicit units

clear defaults

short explanatory descriptions

Avoid hiding important configuration behind vague labels.

15. BACKTEST RESULTS TABLE

Keep the table structure. It is strong.

Columns:

Company

Listing date

Est. GMP

Listing gain

Decision

Outcome

Typography

Company:

14px / 600

Symbol:

11px / mono / tertiary

Date:

13px / tabular numerals

Financial values:

13--14px / tabular numerals

Decision:

compact semantic pill

Outcome:

12px / 600

Decision semantics

Use:

YES --- APPLY

green

NO --- AVOID

red/neutral-red

Do not use brand orange for all decisions.

Outcome semantics

Successful gain:

green

Avoided loss:

green

Avoided gain:

neutral gray

Actual loss:

red

The key distinction:

"Avoided loss" is a successful decision outcome even though no money
was made.

The UI should communicate this clearly.

16. PAGE 3 --- FAMILY ROTATOR

Purpose

This page is about capital deployment and account orchestration.

Therefore the hierarchy should prioritize:

available capital

allocated capital

capacity per PAN

account status

operational details

17. FAMILY ROTATOR --- KPI AREA

Current order gives every KPI equal weight.

Change hierarchy to:

Primary

Available liquid cash

₹1,00,000

Secondary

Total capital pool

₹1,00,000

Supporting

3 members

3 linked accounts

The financial numbers should be visually stronger.

18. FAMILY ROTATOR --- PAN TABLE

Heading:

PAN slots & credentials

Primary CTA:

+ Add member

Table columns:

Member profile

ASBA netbanking

Capital limit

Active status

Actions

Keep the current table style.

Member profile

Name:

14px / 600

Relationship:

11px / uppercase / brand only if useful

Avoid overusing orange.

PAN

Keep masked.

Use mono.

Capital limit

Use tabular numerals.

Status

IDLE

Neutral pill.

When actively used:

ACTIVE

Brand or green depending on meaning.

19. FAMILY ROTATOR --- CAPITAL ALLOCATION

This is where the current UI has a significant hierarchy/state issue.

The screenshot shows:

Active Allocations: ₹1,05,000 / ₹1,00,000

This is an over-allocation of ₹5,000.

That must not look like normal information.

The component should explicitly show:

Over-allocated by ₹5,000

Use a restrained danger treatment.

Example:

Capital allocation

Allocated
₹1,05,000

Available
₹1,00,000

⚠ Over-allocated by ₹5,000

Then show the individual allocations.

The system should make the problem obvious before the user performs
another action.

20. FAMILY ROTATOR --- ASBA BLOCK HISTORY

Current empty state is too passive.

Heading:

ASBA block history

If empty:

No active ASBA blocks

Deploy a bid from the IPO Tracker to see blocked amounts here.

Keep it compact.

Do not allocate excessive vertical space to an empty state.

21. PAGE 4 --- LOGIN / ENTRY EXPERIENCE

The visual design is already attractive.

However, this page should feel trustworthy rather than promotional.

Current concern

The large:

+34.2%

and:

₹9,633 Est. Gain

can make a financial product feel like it is promising returns.

Reduce the marketing emphasis.

22. LOGIN --- LEFT PANEL

Headline:

IPO Tracker

Subheadline:

Systematic IPO decision-making

Supporting copy:

Analyze subscription signals, GMP trends, historical outcomes, and account capacity without relying on emotional bidding decisions.

Then show three concise proof points:

8 quantitative rules

Historical backtesting

Multi-PAN allocation planning

This is more credible than leading with estimated gains.

23. LOGIN --- GRAPH

Keep the graph if desired.

But frame it as evidence:

GMP premium trend

Secondary:

Illustrative market signal

Avoid making a projected return look like a guaranteed result.

If the graph is based on real data, label the time period and
methodology appropriately.

24. LOGIN --- FORM

The right-side form is structurally good.

Keep:

Sign In

Create Account

Email

Password

Sign In Securely

Button:

Brand orange/coral.

Do not make the button excessively saturated or shadow-heavy.

25. GUEST ACCESS

The guest mode is a good product idea.

Make it visually secondary.

Heading:

Guest access

Copy:

Explore the dashboard without creating an account.

Input:

Your name

CTA:

Explore

The guest section should not visually compete with authentication.

26. COMPONENT-SPECIFIC RULES

Buttons

Primary:

brand orange

white text

14px / 600

8px radius

moderate height

Secondary:

white background

border

dark text

Tertiary:

text only

Do not use orange on every button.

Pills

Use pills for:

status

decisions

compact classification

Do not use pills for ordinary text.

Tooltips

Use for:

unfamiliar financial metrics

methodology

rule explanations

Do not put explanations directly into every card.

Icons

Use one icon family consistently.

Recommended characteristics:

1.5--2px stroke

simple geometry

no decorative icon backgrounds unless semantically useful

Decision icons should be standardized:

✓ Apply
△ Watch
× Avoid

Use the same icon language across dashboard, backtest and detail pages.

27. Data Visualization Rules

Charts should communicate information, not decorate empty space.

Use:

minimal axes

restrained grid lines

clear labels

tooltips

semantic positive/negative states

accessible contrast

Avoid:

unnecessary legends

excessive gradients

3D charts

decorative fills

multiple competing colors

If there is no data, use a deliberate empty state.

28. Responsive Behavior

Desktop is the primary current layout, but components should degrade
predictably.

Desktop

3-column IPO cards where appropriate.

Tablet

2-column.

Mobile

1-column.

For metric groups:

Desktop:

GMP | QIB | Odds

Mobile:

stack or 2+1 layout depending on width.

Do not simply shrink typography to fit.

29. What NOT to Change

Do not remove the following strengths:

warm orange brand identity

restrained white/gray visual language

left navigation

generous but controlled whitespace

clean borders

strong table structure

recommendation concept

Grid/List IPO pipeline

multi-PAN concept

backtest engine

overall calm aesthetic

This is a refinement, not a visual reset.

30. Priority Order for Implementation

Implement in this order.

P0 --- Critical

Strengthen IPO recommendation hierarchy.

Establish semantic YES / MAYBE / NO colors.

Fix Family Rotator over-allocation visual state.

Strengthen numerical typography.

Reduce excessive card nesting.

Make Dashboard answer "what should I do?" immediately.

P1 --- High impact

Create global typography tokens.

Create global color tokens.

Standardize decision/status components.

Improve KPI hierarchy.

Improve Dashboard chart/empty states.

Improve Login trust/credibility.

P2 --- Refinement

Standardize iconography.

Improve mono/tabular number usage.

Refine spacing.

Refine border/radius values.

Improve table micro-interactions.

Add polished hover/focus states.

31. Acceptance Criteria

The implementation should satisfy these questions.

Dashboard

Can a user identify the recommended action within 3 seconds?

Is the recommendation more visually prominent than the supporting
metrics?

Are metrics easy to scan?

Is orange being used primarily as brand/action color?

Does the page feel less like a collection of cards?

Backtest

Is 86% immediately visible as the primary result?

Can the user scan the table quickly?

Are successful and avoided outcomes semantically clear?

Are numbers aligned and easy to compare?

Family Rotator

Is available capital visually prominent?

Is over-allocation impossible to miss?

Can users scan member → bank → limit → status quickly?

Login

Does the product feel trustworthy rather than promotional?

Is the methodology more prominent than projected gain?

Is guest access clearly secondary?

32. Final Visual QA Checklist

Before considering the redesign complete, inspect every page at 100%
zoom and ask:

Typography

Are headings clearly differentiated?

Are secondary labels too light?

Are numbers visually dominant?

Are uppercase labels being overused?

Are monetary values aligned?

Color

Does orange still feel special?

Are success/warning/danger states semantic?

Are any two semantic states visually ambiguous?

Is anything colored simply because it needs decoration?

Hierarchy

Can I tell what matters first?

Can I tell what action is expected?

Is supporting information visually subordinate?

Are containers creating unnecessary hierarchy?

Density

Is there too much empty space?

Could related information be grouped without adding another card?

Can a user scan the page faster than before?

Trust

Does the UI feel precise?

Does it feel financially responsible?

Does anything look like a promise of returns?

Are warnings appropriately prominent?

33. Definition of "9/10"

Do not interpret 9/10 as:

More gradients + more shadows + more rounded cards + more visual
decoration.

A 9/10 implementation should instead feel:

quiet

precise

fast to scan

semantically clear

financially credible

consistent

intentional

The user should feel that the product has already decided what deserves
their attention.

That is the primary design upgrade.

34. One-line Design Principle for the Agent

Reduce visual noise, strengthen decision hierarchy, make numbers
authoritative, reserve color for meaning, and use containment only
when it improves comprehension.