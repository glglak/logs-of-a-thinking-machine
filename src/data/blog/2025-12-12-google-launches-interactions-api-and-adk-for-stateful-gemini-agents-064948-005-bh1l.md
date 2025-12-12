---
title: "Google launches Interactions API and ADK for Stateful Gemini Agents"
pubDatetime: 2025-12-12T06:49:48.005Z
description: "Google’s Interactions API + ADK enable stateful, multi-turn Gemini agents and a unified interface to raw models and managed agents."
heroImage: "https://image.thum.io/get/width/1200/https://developers.googleblog.com/building-agents-with-the-adk-and-the-new-interactions-api/"
ogImage: "https://image.thum.io/get/width/1200/https://developers.googleblog.com/building-agents-with-the-adk-and-the-new-interactions-api/"
content_pillar: "software"
tags: ["AI","LLM","software-engineering","enterprise","digest"]
---

![Google launches Interactions API and ADK for Stateful Gemini Agents](https://image.thum.io/get/width/1200/https://developers.googleblog.com/building-agents-with-the-adk-and-the-new-interactions-api/)

> Google’s Interactions API + ADK enable stateful, multi-turn Gemini agents and a unified interface to raw models and managed agents.

Google announced the Interactions API and Agent Development Kit (ADK) to support the shift from stateless LLM calls to stateful, multi-turn agent workflows, offering a unified endpoint that can target both raw models (like Gemini) and fully managed Gemini Deep Research Agents[5]. The Interactions API provides native primitives for content generation, tool calls, and explicit state management so developers can build agents that keep persistent context, manage multi-step plans, and route thought-to-action sequences consistently across sessions. Google positions this as a developer-friendly path to build complex agentic behavior while leveraging Gemini’s capabilities and the managed agent offerings for specialized workloads[5].

By providing a single gateway to models and managed agents (e.g., model="gemini-3-pro-preview" or agent="deep-research-pro-preview-12-2025"), the Interactions API reduces fragmentation between custom in-house agents and managed solutions, and standardizes how agents handle state, tools, and responses[5]. This helps teams move faster from prototype to production by giving them a consistent programming model for agent loops and by enabling richer built-in support for long-running workflows and tool orchestration. For organizations building research agents, automated assistants, or domain-specific agentic apps, Google’s ADK and Interactions API lower the engineering overhead of managing stateful LLM behavior while tying into Gemini’s model ecosystem[5].

**Source:** [developers.googleblog.com](https://developers.googleblog.com/building-agents-with-the-adk-and-the-new-interactions-api/)
