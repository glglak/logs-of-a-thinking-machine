---
title: "Microsoft’s Agent Lightning: Add Reinforcement Learning to Agents Without Rewriting Code"
pubDatetime: 2025-12-12T06:49:47.918Z
description: "Agent Lightning lets existing LLM-based agents learn via RL with minimal code changes, improving task accuracy across real workloads."
heroImage: "https://image.thum.io/get/width/1200/https://www.microsoft.com/en-us/research/blog/agent-lightning-adding-reinforcement-learning-to-ai-agents-without-code-rewrites/"
ogImage: "https://image.thum.io/get/width/1200/https://www.microsoft.com/en-us/research/blog/agent-lightning-adding-reinforcement-learning-to-ai-agents-without-code-rewrites/"
content_pillar: "research"
tags: ["AI","research","software-engineering","open-source","digest"]
---

![Microsoft’s Agent Lightning: Add Reinforcement Learning to Agents Without Rewriting Code](https://image.thum.io/get/width/1200/https://www.microsoft.com/en-us/research/blog/agent-lightning-adding-reinforcement-learning-to-ai-agents-without-code-rewrites/)

> Agent Lightning lets existing LLM-based agents learn via RL with minimal code changes, improving task accuracy across real workloads.

Microsoft Research Asia introduced Agent Lightning, an open-source framework that enables reinforcement learning (RL) for existing LLM-based agents without requiring major code rewrites by separating task execution from model training and assigning credit to individual LLM calls after task completion[2]. The core LightningRL algorithm performs hierarchical credit assignment: it evaluates how much each agent step contributed to the final outcome, assigns a reward to those steps, and then applies single-step RL algorithms (e.g., PPO or GRPO) to improve behavior. This design lets teams add online learning to agent stacks built with popular frameworks such as LangChain, AutoGen, and OpenAI Agents SDK with minimal integration friction[2].

Agent Lightning was evaluated on three real-world scenarios—text-to-SQL, retrieval-augmented multi-hop QA, and mathematical question solving with tool use—where it produced consistent performance gains by optimizing when and how agents call tools, compose queries, and revise outputs[2]. By making RL modular and compatible with common agent frameworks, Microsoft aims to enable continuous improvement of deployed agents and to provide a shared platform for experimenting with automatic prompt optimization and additional RL algorithms in future releases. The project is positioned for practitioners who need to make agents learn from experience without rebuilding their entire stack, addressing a key operational barrier to deploying adaptive agentic systems in production[2].

**Source:** [microsoft.com](https://www.microsoft.com/en-us/research/blog/agent-lightning-adding-reinforcement-learning-to-ai-agents-without-code-rewrites/)
