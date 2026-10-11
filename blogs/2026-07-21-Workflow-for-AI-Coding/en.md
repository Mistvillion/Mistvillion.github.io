---
title: A Workflow for AI Coding
published: 2026-07-21
description: Notes from a talk by Matt Pocock on AI coding
category: Study Notes
---
Video: [Workflow for AI Coding](https://www.youtube.com/watch?v=-QFHIoCo-Ko&t=1060s)

This post summarizes a talk on AI coding that Matt Pocock gave in May 2026.

The video is a workshop-style talk on "AI Engineering". Matt's central argument is this: AI coding may look like an entirely new paradigm, but what actually makes it produce stable, high-quality results is still the fundamentals of traditional software engineering, such as breaking down tasks, clarifying requirements, feedback loops, test-driven development, modular design, code review and manual QA.

He pushes back on treating AI as a black-box compiler that "turns specs directly into code". Instead, he argues that developers should actively design the environment the AI works in: keep the context small, make requirements explicit, break large tasks into vertical slices that produce feedback, let the AI run autonomously at the stages where that makes sense, and keep a human involved in key judgment calls, taste, acceptance and architectural direction.

## 1. The Core Argument: AI Engineering Still Depends on Software Engineering Fundamentals

Matt opens the talk with his main thesis: people often say AI is a new paradigm, but they tend to overlook one fact. The software engineering principles that matter when working with humans matter just as much when working with AI, and arguably even more.

The reason is that an LLM is not an infinitely reliable "intelligent machine". It has very specific working limits. To get good code out of an AI, developers can't just throw a task at it. They need to treat it like a collaborator and design clear task boundaries, context, feedback mechanisms and acceptance criteria for it.

He stresses that AI coding is not about "letting AI replace software engineering". It is about turning software engineering practices into a process that the AI can execute, get feedback on and correct itself within.

## 2. Two Key Limitations of LLMs

### 1. The "Smart Zone" and the "Dumb Zone"

Citing Dex Horthy, Matt divides the context state of an LLM into the "smart zone" and the "dumb zone".

When a new AI session begins, the context is clean, the attention relationships are at their simplest, and the model usually performs at its best. As conversation, code, logs and history pile into the context, the number of relationships between tokens the model has to handle grows sharply, and reasoning quality drops. Past a certain point, the model starts making erratic or even dumb decisions.

Matt's rule of thumb is that even with today's 200K and 1M token context windows, the smart zone suitable for complex coding work is still roughly around 100K tokens. Very long contexts help with retrieval tasks, such as finding information in large amounts of text, but for coding they don't necessarily mean higher quality. A bigger context window sometimes just gives developers "more dumb zone".

So an important principle of AI engineering is: don't load a single AI session with an oversized task and an overly long history. Keep tasks small so that each piece of work happens inside the model's smart zone as much as possible.

### 2. LLM Context Is Limited

The second limitation is that LLM sessions keep losing state. Every time the context is cleared, the model goes back to the initial state defined by its system prompt. Developers often use context compaction to keep a summary of the history, but Matt is fairly cautious about it.

His view is that compaction turns a complex history of work into a summary, and that summary can carry stale information, noise and misunderstandings that later skew the model's judgment. He prefers designing the system so it can "restart cleanly": the AI starts each time from a small, stable system prompt, clear task files and the current state of the code, rather than relying on a long session history that keeps getting compacted.

This leads into the workflow that follows: capture important information as explicit artifacts, such as PRDs, issues, tests and code, instead of leaving it floating around in the chat context.

## 3. Workflow Overview

The AI engineering process Matt describes looks roughly like this:

1. Start from a vague idea.
2. Clarify requirements through "grill me"-style questioning, building a shared understanding between human and AI.
3. Turn that shared understanding into a PRD, which serves as the "destination document".
4. Break the PRD into independently executable issues, forming a kanban board with dependencies.
5. Prefer vertical slices over horizontal, layer-by-layer tasks.
6. Hand well-defined AFK tasks to AI agents.
7. Require the AI to use TDD and feedback loops during implementation.
8. Have the AI do an automated review in a fresh context, while humans still do the final QA and code review.
9. Problems found during QA flow back onto the kanban board as new issues.
10. Throughout the process, keep paying attention to the module shape of the codebase and its test boundaries.

The key to this process is not any particular tool, but putting "human judgment" and "AI execution" each where they work best.

## 4. Development Stages

### 4.1 Stage 1: Research and Prototyping

The talk points out that for complex tasks, you sometimes can't jump straight into implementation. Especially when requirements are unclear, or when third-party services, frontend interactions, product experience or architectural risk are involved, you need to do research or build a prototype first.

The goal of a prototype is not to produce final code but to generate early feedback. Frontend work, for example, relies heavily on human visual judgment. AI can observe a page through a browser or tools like Playwright, but it still struggles to build truly good frontends on its own inside a mature codebase. So Matt suggests having the AI generate a few clickable throwaway prototypes, letting a human pick a direction, and then bringing that choice back into the requirements discussion.

A prototype is an exploration tool and doesn't need to be as complete as a real feature. Its value lies in letting the team, domain experts or customers "get their hands on" the solution, so misunderstandings and deviations surface earlier.

### 4.2 Stage 2: The Grilling Session, Aligning with the AI First

The video puts a lot of emphasis on a skill called "grill me". Its job is to stop the AI from rushing into writing a plan and instead have it keep questioning the user until both sides reach a shared understanding.

Matt believes many AI coding failures come from "silent misunderstandings". The user assumes the AI understood, the AI behaves as if it understood, but the two were never actually aligned. Traditional plan mode tends to be too eager to produce a plan rather than clarify the problem first.

The core of the "grill me" prompt is: interview the user relentlessly, walk down the design decision tree asking about each branch in turn, ask only one question at a time, and offer the AI's recommended answer. This approach has several benefits:

1. It breaks vague requirements into concrete decisions.
2. It brings the user into key judgment calls in time.
3. It surfaces questions the user or customer hadn't thought of.
4. It produces a high-value conversation history that can be turned into documentation later.

Matt also points out that the grilling stage must be human-in-the-loop. It can't be fully AFK, because it involves judgment, preferences, business semantics and team consensus. The AI can ask good questions and recommend answers, but a human has to confirm them in the end.

### 4.3 Stage 3: Writing the PRD, Turning Alignment into a "Destination Document"

Once the grilling session ends, the conversation already holds a lot of high-value information. The next step is not to start writing code right away, but to condense that information into a product requirements document, or PRD.

Matt calls the PRD a "destination document". It answers the question "where are we ultimately going?" A PRD doesn't need to follow a fixed format, but the template he showed usually includes:

1. Problem statement: what problem the user or business currently faces.
2. Solution: how the feature solves that problem.
3. User stories: the feature's behavior described from the user's point of view.
4. Implementation decisions: key technical and product trade-offs.
5. Testing decisions: which behaviors need to be verified.
6. Out of scope: what will explicitly not be done this round.

He stresses that the value of a PRD is not in being "well written", but in preserving the shared understanding. It is a structured summary of the grilling session that came before.

Notably, Matt himself doesn't always review AI-generated PRDs word for word. His reasoning is that LLMs are good at summarizing, and after the grilling session he already shares an understanding with the AI, so the PRD is mostly a record of that design concept. He would rather save his energy for QA and code review later on.

This doesn't mean the PRD is unimportant. The point is not to put blind faith in the PRD, and not to get bogged down in polishing the document over and over. The PRD sets the direction; it is not the final quality guarantee.

### 4.4 Stage 4: Breaking the PRD into Issues, Not a Linear Multi-Phase Plan

Once there is a PRD, a common approach is to have the AI write a multi-phase plan, for example phase one for the database, phase two for the API, and phase three for the frontend. Matt doesn't think this is ideal.

He prefers to turn the PRD into a kanban board, that is, a set of issues with dependencies between them. Each issue should be something that can be picked up independently as far as possible, marked as to whether it is suitable for AFK execution and which tasks block it.

This has two important advantages:

1. Instead of a single-threaded linear plan, it is a directed acyclic graph that can be parallelized.
2. It lets multiple AI agents work in parallel wherever the dependencies allow.

For example, a task might require the schema and basic services to be done first; after that, two features that don't block each other can be implemented in parallel, followed by integration and polishing at the end. Compared with a linear "phase 1, phase 2, phase 3" process, a kanban board is better suited to parallel execution by AI agents.

### 4.5 Stage 5: Implementation by AI Agents, a.k.a. AFK Work

Once the PRD has been broken into a set of clear issues, the human can step away from hands-on implementation for a while and let AI agents work through the backlog. Matt calls this the "day shift" and the "night shift".

The human's day shift is: clarifying requirements, making decisions, designing tasks, arranging dependencies and defining acceptance criteria. The AI's night shift is: implementing the prepared issues automatically.

Matt demonstrated a loop called Ralph. It reads markdown issues from a local issues directory, reads the recent commit history, and then runs Claude Code to pick the next AFK task and implement it. You can run the loop once at first to watch how the AI behaves, and then gradually scale it up into a real automated loop.

The basic requirements of the Ralph prompt include:

1. Only work on tasks marked as AFK.
2. If there are no tasks left to do, output an explicit completion signal.
3. Pick the next task by priority.
4. Prioritize critical bugs, development infrastructure, vertical slices, quick wins and refactoring.
5. Explore the codebase.
6. Complete the task using TDD.
7. Run feedback loops such as tests and type checking.

Later on, Matt also showed a more advanced parallelization setup called Sand Castle. It is a TypeScript library that creates a git worktree for each issue and runs an agent inside a Docker sandbox. In this flow, a planner picks tasks that can run in parallel, implementers each implement one, a reviewer reviews the commits, and a merger merges the branches and resolves conflicts or test failures.

### 4.6 Stage 6: Manual QA and Code Review Are Still Essential

Although AI can implement tasks and even review its own code automatically, Matt stresses that human QA and code review are still needed in the end.

He suggests clearing the context and starting a fresh session when having the AI review code. If the implementation session is already close to the dumb zone, having the same context carry on with the review will produce a review of lower quality than the implementation. With a cleared context, the reviewer looks at the changes afresh from within the smart zone and is more likely to spot problems.

Still, automated review is only a preliminary check. Real QA still needs a human, especially for product experience, frontend visuals, interaction details, business sense and "taste".

In the demo, after the AI finished an issue, Matt manually opened the app, logged in as a student and tested the course completion flow. The page threw an error, probably because a new table was missing from the database and a migration needed to be run. This example shows that even when automated tests pass, real QA can still uncover problems in the integration environment or at runtime.

Matt believes the point of QA isn't only to find bugs, but to reapply human judgment, preferences and taste to the codebase. If everything from idea to prototype to implementation to QA is automated, the result can easily be an app that lacks taste, is low in quality, or simply isn't what was expected.

### 4.7 Stage 7: Designing the Codebase for AI

The second half of the video discusses a deeper issue: if a codebase is bad, AI will struggle to do good work in it too. As Matt puts it, "bad codebases produce bad agent output."

Drawing on John Ousterhout's ideas in *A Philosophy of Software Design*, he distinguishes between shallow modules and deep modules.

Shallow modules are usually lots of very small files or functions, where the interface is about as complex as the internals and modules are tangled up in each other's dependencies. Such codebases are unfriendly to AI, because the AI has a hard time understanding the dependency graph and judging where the test boundaries should be. The AI tends to wrap a test around every small function, leading to fragmented tests that can't really verify behavior across modules.

Deep modules are the opposite: they expose a simple, small and stable interface while containing a lot of functionality and complexity inside. Such modules are easier to test, because you can build a larger test boundary around the module's interface and verify meaningful behavior. They are also easier for callers to understand, because callers only need to know what the module does, not all the details inside it.

Matt suggests that developers pay particular attention to the "module map" when working with AI. At the PRD and issue stage, make it clear which modules will be created or modified, which ones should be deep modules, and roughly what their interfaces look like. This makes implementation easier for the AI and also lets humans stay in control of the shape of the codebase.

He offers a practical rule of thumb: humans design the module interfaces and the shape of the codebase, and AI can take care of the implementation inside the modules. That way developers don't have to remember every line, but they still understand which big pieces the system is made of, how those pieces interact and how they should be tested.

## 5. Key Technique: Use Vertical Slices, Not Horizontal Slices

One very important concept in the video is "tracer bullets", or "vertical slices".

Matt has observed that AI loves to code horizontally, layer by layer: first the database and schema, then the service layer, then the API, and finally the frontend. The problem is that you don't get complete feedback until very late. Until the first two or three phases are done, the developer can't verify whether the full user journey actually works.

He advocates breaking tasks into vertical slices: each slice cuts across the database, services, API, frontend or whatever other layers are needed, and even if the feature is very thin, it should produce an end-to-end result that is visible and testable.

The "tracer bullet" metaphor comes from tracer ammunition, which lets you see where you're shooting. In software development, it means giving every small step visible feedback, so the AI doesn't spend long stretches "coding blind" with no feedback.

## 6. TDD and Feedback Loops Set the Ceiling on AI Code Quality

Matt places great emphasis on the importance of TDD for AI agents. He believes that if a codebase lacks good feedback loops, it is very hard to get high-quality output from AI.

TDD stands for test-driven development, and its basic cycle is red, green, refactor:

1. Write a failing test first.
2. Confirm that the test really fails.
3. Write the minimal implementation that makes the test pass.
4. Refactor under the protection of the tests.

Matt thinks this approach suits AI especially well, because when an AI writes the full implementation first and adds tests afterwards, it often produces "cheating" tests or low-value tests. Having the AI write a failing test first and then implement code to make it pass, on the other hand, forces it to pin down the behavioral boundaries before writing the code.

In the example, the AI wrote tests for a gamification service. They first failed because the module didn't exist; the AI then implemented the service logic and ran the tests and type checks. In the end it produced a commit-ready implementation that passed both the tests and the TypeScript checks.

Matt sums it up by saying that the quality of the feedback loops essentially determines how good the code an AI can write will be. Tests, type checking, linting, a runnable local environment and observable frontend results are all the AI's "eyes". Without that feedback, the AI is coding blind.

## 7. Push vs. Pull: Getting AI to Follow Team Conventions

During the Q&A, someone asked how to get AI to write code that fits the team's style, library choices, security constraints and architectural conventions. Matt explained it in terms of two approaches: "push" and "pull".

Push means forcing information into the context, for example writing team conventions into CLAUDE.md so the agent sees them on every run. The downside is that it consumes tokens, and too many always-on instructions weigh down the context.

Pull means keeping conventions in the form of skills or documents that the AI reads on its own when it needs them. For example, a skill's description might tell the agent that it can load a particular set of conventions when it runs into a specific kind of task.

Matt's current practice is: for implementation agents, lean more on pull and let them read conventions when needed; for review agents, lean more on push and put the coding conventions, architectural constraints and security requirements directly into the reviewer's context so the reviewer can check against them.

He also mentioned that in his parallelized workflow he uses different models for different roles: implementation can use a model with a better cost and speed trade-off, while review uses a stronger model, because reviewing calls for better judgment.

## 8. On Keeping Documents and Documentation Rot

The video also discusses a practical question: should PRDs, plans and issues be kept in the repository long-term once they are done?

Matt is fairly cautious here. He worries about documentation rot: an old PRD stays in the repository, and weeks or months later the code structure, naming, requirements and user feedback have all changed, yet when the AI reads the old document again it treats it as authoritative context and gets misled.

So he leans toward not keeping these temporary planning documents in the codebase long-term. If you use GitHub issues, you can close the issue so it remains traceable but drops out of the current working context. This effectively gives the AI a visual and state signal: this work is done, and the old document should no longer be treated as the current truth.

## 9. How It Works in Team Collaboration

Someone asked whether this process is too tailored to solo development, given that real team environments are messier. Matt replied that going from idea to PRD, and from PRD to task breakdown, is exactly the area where the team should be involved anyway.

When questions come up during a grilling session that the developer can't answer, domain experts, product managers, other engineers or relevant stakeholders should be brought in. Some questions may call for building a prototype, researching third-party services, or confirming API contracts, security constraints or the direction of the user experience.

So the process is not strictly linear. In practice, you jump back and forth between ideas, prototypes, requirements, PRDs and issues. Only once the destination and the route are clear enough does it make sense to hand implementation over to AFK agents.

## 10. Summary

The core message of the video can be summed up like this: AI engineering is not about tossing a spec to a model and waiting for code to appear. It is about reorganizing the software engineering process so that AI works within clear boundaries, good feedback and the constraints of human judgment.

The key practices Matt recommends include:

1. Manage the context and keep the AI working in the smart zone as much as possible.
2. Don't rely on long sessions and repeated compaction; capture important information as clear artifacts instead.
3. Use a grilling session to align human and AI on requirements first.
4. Use a PRD to record the destination, but don't put blind faith in it.
5. Break the PRD into kanban issues with dependencies.
6. Use vertical slices to get early, end-to-end feedback.
7. Let AI carry out implementation tasks that are suitable for AFK work.
8. Constrain the AI with TDD, tests, type checking and runtime feedback.
9. Have the AI do automated review in a fresh context, then have humans do the final QA and code review.
10. Make the codebase itself better suited to AI work through deep modules, clear interfaces and good test boundaries.

Matt's closing advice is to go back to the classic books of traditional software engineering for methodology, such as *The Pragmatic Programmer*, *Refactoring* and *A Philosophy of Software Design*. These books long ago laid out many excellent software practices in clear language, and those principles remain very useful in the age of AI coding. They can even be turned directly into prompts, skills and agent workflows.
