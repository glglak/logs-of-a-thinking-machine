---
title: "Penn AI Just Dropped $1.3M to Build the Ultimate Molecule-Designing LLM (And It's Open Source)"
pubDatetime: 2026-01-31T06:57:59.613Z
description: "Imagine an LLM that doesn't just chat about molecules—it designs them from 3D structures. Penn's dropping a massive open dataset to make it "
heroImage: "https://research.upenn.edu/wp-content/uploads/2026/01/apexmol-molecule-llm.jpg"
ogImage: "https://research.upenn.edu/wp-content/uploads/2026/01/apexmol-molecule-llm.jpg"
content_pillar: "research"
tags: ["llm","biotech","open source","drug discovery","multimodal","AI","digest"]
---

![Penn AI Just Dropped $1.3M to Build the Ultimate Molecule-Designing LLM (And It's Open Source)](https://research.upenn.edu/wp-content/uploads/2026/01/apexmol-molecule-llm.jpg)

> Imagine an LLM that doesn't just chat about molecules—it designs them from 3D structures. Penn's dropping a massive open dataset to make it real.

Ever stared at a protein structure wondering, 'What if I tweaked this atom?' Drug discovery has been bottlenecked by that exact pain point for decades. Today, Penn AI announced funding for **ApexMol**, a groundbreaking agentic LLM that fuses natural language with 3D molecular geometry to reason, predict, and *design* biomolecules.[3]

Here's what happened: Cesar de la Fuente's team at Penn snagged part of a $1.3M award package (including $450K direct grants plus HPC resources). They're building on their ApexOracle work by creating **BioChemInstruct**, a monster open dataset with *12 million* paired examples of molecular structures and scientific text from Protein Data Bank, PubChem, AlphaFold, and more. This trains a unified LLM treating text and 3D coords as one sequence—enabling queries like 'Design an antibiotic binding to this protein pocket' with actual geometry-aware outputs.[3]

For developers and bio researchers, this is huge: Current tools like AlphaFold predict structures, but generating novel drugs? That's where LLMs fall flat without spatial smarts. ApexMol targets molecule generation, binding pose estimation, and drug repurposing—benchmarked on real science tasks. Open-sourcing the data/tools means you can fine-tune for your lab's threats, accelerating discovery without Big Pharma budgets.[3]

Compare to closed systems like Schrödinger or even OpenAI's bio plugins: ApexMol's multi-modal (text+3D) approach crushes 1D SMILES strings, and the scale dwarfs existing datasets. It's not hype—prior ApexOracle already showed gains in antibiotics.[3]

**Try it now:** Watch Penn's repo for BioChemInstruct release (imminent post-funding). Fork it, plug into your PyTorch/Hugging Face pipeline, and prototype drug designs this weekend. Question is: Will indie researchers beat pharma to the next blockbuster?

**Source:** [Penn AI](https://research.upenn.edu/news/penn-ai-announces-the-2026-discovering-the-future-of-ai-award-recipients/)
