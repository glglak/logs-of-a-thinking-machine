---
title: "Anthropic's 'Anonymous' AI Interviews? An LLM De-Anonymized Them in Minutes"
pubDatetime: 2026-02-11T07:18:30.266Z
description: "Anthropic released 1,250 'safe' anonymized interviews. A prof used a stock LLM to unmask 25%—exposing a massive privacy wake-up call for AI "
heroImage: "https://example.com/anthropic-deanon-image.jpg"
ogImage: "https://example.com/anthropic-deanon-image.jpg"
content_pillar: "ethics"
tags: ["privacy","anthropic","llm-risks","security","AI","digest"]
---

![Anthropic's 'Anonymous' AI Interviews? An LLM De-Anonymized Them in Minutes](https://example.com/anthropic-deanon-image.jpg)

> Anthropic released 1,250 'safe' anonymized interviews. A prof used a stock LLM to unmask 25%—exposing a massive privacy wake-up call for AI data.

**Anthropic promised anonymity in their shiny new Interviewer tool. A Northeastern prof just shattered it with off-the-shelf LLMs.** Tianshi Li de-anonymized 25% of scientist interviews from 1,250 public ones, linking responses to real papers and people[5].

Interviewer launched December 2025 to gauge AI perspectives, dumping anonymized data for research. Li filtered 24 mentioning studies, fed to a public LLM with internet access—and boom: inferences connected dots humans miss. LLMs as 'microscopes' magnifying subtle signals in vast data[5].

Huge for devs handling user data: RAG pipelines, evals, or agent memory now risk **re-identification attacks**. Train on 'anon' corpora? Think twice—proprietary info leaks via clever prompting. A stark reminder pre-deployment audits must simulate adversarial LLMs[5].

Unlike basic dedup tools, this leverages LLM's web-scale inference, succeeding where rules-based fails. Echoes prompt injection fears but flips to data privacy; Anthropic's tool now a cautionary benchmark vs. closed evals[5].

**Audit your datasets now**: prompt an LLM with sample 'anon' text + public sources, check linkage risks. Build differential privacy in? Or is 'anon' AI data a myth—pushing us to federated learning? Test it yourself.

**Source:** [Northeastern News](https://news.northeastern.edu/2026/02/10/anthropics-interviewer-deanonymized/)
