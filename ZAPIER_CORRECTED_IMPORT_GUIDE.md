# Corrected Zapier Import Guide - Using Formatter by Zapier

## Step 1: Create New Zap in Zapier

1. **Go to Zapier.com** and log into your account
2. **Click "Create Zap"** in the top right
3. **Name your Zap**: "Architectural AI Insights - 3 Articles Daily"

## Step 2: Set Up Step 1 - Get AI News

### Configure Perplexity API Call
1. **Search for "Perplexity"** in the trigger/action search
2. **Select "Perplexity API"** as the action
3. **Configure the API call** with these settings:

```json
{
  "model": "sonar",
  "search_recency_filter": "day",
  "max_tokens": 1500,
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "ai_news_raw",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "items": {
            "type": "array",
            "minItems": 3,
            "maxItems": 3,
            "items": {
              "type": "object",
              "properties": {
                "title": {"type": "string"},
                "url": {"type": "string"},
                "source": {"type": "string"},
                "image": {"type": "string"},
                "summary": {"type": "string", "maxLength": 300}
              },
              "required": ["title", "url", "source", "summary"]
            }
          }
        },
        "required": ["items"]
      }
    }
  },
  "messages": [
    {
      "role": "system",
      "content": "You are a precise AI/LLM news editor. Find recent, credible AI/tech developments. Neutral tone. No fluff."
    },
    {
      "role": "user",
      "content": "From the last 24h, return 3 credible AI/tech developments. For each: title, url, source, image (og:image if confident or empty), summary (2-3 sentences). JSON only."
    }
  ]
}
```

## Step 3: Set Up Step 2 - Philosophical Analysis

### Add Another Perplexity API Call
1. **Click "+" to add another action**
2. **Search for "Perplexity"** again
3. **Select "Perplexity API"** as the action
4. **Configure with these settings**:

```json
{
  "model": "sonar",
  "max_tokens": 2000,
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "architectural_insights",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "title": {"type": "string"},
                "url": {"type": "string"},
                "source": {"type": "string"},
                "image": {"type": "string"},
                "summary": {"type": "string"},
                "architectural_insight": {"type": "string", "maxLength": 300},
                "philosophical_angle": {"type": "string", "maxLength": 400},
                "human_impact": {"type": "string", "maxLength": 300},
                "content_pillar": {"type": "string", "enum": ["ai-insights", "architecture", "philosophy"]},
                "tags": {"type": "array", "items": {"type": "string"}},
                "thinking_questions": {"type": "array", "items": {"type": "string"}}
              },
              "required": ["title", "url", "architectural_insight", "philosophical_angle", "human_impact", "content_pillar", "tags"]
            }
          }
        },
        "required": ["items"]
      }
    }
  },
  "messages": [
    {
      "role": "system",
      "content": "You are a systems architect and philosopher analyzing AI developments. Focus on architectural patterns, human implications, and philosophical questions. Connect technology to deeper themes about how we build, think, and relate to machines. Always consider: What does this reveal about system design? What are the human implications? What philosophical questions does this raise?"
    },
    {
      "role": "user",
      "content": "Analyze these AI/tech developments from an architectural and philosophical perspective: {{step1.items}}. For each item, provide: architectural_insight (what this reveals about system design), philosophical_angle (deeper meaning and implications), human_impact (how this changes us), content_pillar (categorize as ai-insights/architecture/philosophy), tags (relevant topics), thinking_questions (3 questions this raises)."
    }
  ]
}
```

## Step 4: Set Up Step 3 - Format Content (Article 1)

### Add Formatter by Zapier Action
1. **Click "+" to add another action**
2. **Search for "Formatter by Zapier"**
3. **Select "Text"** as the operation
4. **Configure with these settings**:
   - **Transform**: `{{step2.items[0].title}}`
   - **Find**: (leave empty)
   - **Replace**: Copy the entire markdown template below

```markdown
---
title: "{{step2.items[0].title}}"
description: "{{step2.items[0].architectural_insight}}"
pubDatetime: {{now}}
heroImage: "{{step2.items[0].image}}"
ogImage: "{{step2.items[0].image}}"
tags: {{step2.items[0].tags}}
content_pillar: "{{step2.items[0].content_pillar}}"
content_type: "ai-insight"
source_url: "{{step2.items[0].url}}"
source_name: "{{step2.items[0].source}}"
---

![{{step2.items[0].title}}]({{step2.items[0].image}})

_{{step2.items[0].architectural_insight}}_

## The Architectural Pattern

{{step2.items[0].architectural_insight}}

This development reveals something fundamental about how we architect systems in the age of AI. The underlying pattern here suggests a shift in how we think about...

## The Philosophical Angle

{{step2.items[0].philosophical_angle}}

What does this mean for our relationship with technology? How does this change the fundamental questions we ask about intelligence, creativity, and human agency?

## The Human Impact

{{step2.items[0].human_impact}}

As we integrate these capabilities into our daily lives, we're not just adopting new tools—we're reshaping what it means to be human in a world where machines can...

## Thinking Questions

{{step2.items[0].thinking_questions}}

---

**Source:** [{{step2.items[0].title}}]({{step2.items[0].url}}) via {{step2.items[0].source}}

*This analysis is part of our ongoing exploration of how AI developments reveal deeper patterns about system design, human nature, and the architecture of intelligence.*
```

## Step 5: Set Up Step 4 - Format Content (Article 2)

### Add Another Formatter by Zapier Action
1. **Click "+" to add another action**
2. **Search for "Formatter by Zapier"** again
3. **Select "Text"** as the operation
4. **Configure with these settings**:
   - **Transform**: `{{step2.items[1].title}}`
   - **Find**: (leave empty)
   - **Replace**: Copy the same markdown template but replace all `[0]` with `[1]`

## Step 6: Set Up Step 5 - Format Content (Article 3)

### Add Another Formatter by Zapier Action
1. **Click "+" to add another action**
2. **Search for "Formatter by Zapier"** again
3. **Select "Text"** as the operation
4. **Configure with these settings**:
   - **Transform**: `{{step2.items[2].title}}`
   - **Find**: (leave empty)
   - **Replace**: Copy the same markdown template but replace all `[0]` with `[2]`

## Step 7: Set Up Step 6 - Create GitHub File (Article 1)

### Add GitHub Action
1. **Click "+" to add another action**
2. **Search for "GitHub"**
3. **Select "Create File"**
4. **Configure with these settings**:
   - **Repository**: `glglak/logs-of-a-thinking-machine`
   - **File Path**: `src/data/blog/{{now}}-{{step2.items[0].title}}.md`
   - **File Content**: `{{step3.transformed}}`
   - **Commit Message**: `Add AI insight: {{step2.items[0].title}}`

## Step 8: Set Up Step 7 - Create GitHub File (Article 2)

### Add Another GitHub Action
1. **Click "+" to add another action**
2. **Search for "GitHub"** again
3. **Select "Create File"**
4. **Configure with these settings**:
   - **Repository**: `glglak/logs-of-a-thinking-machine`
   - **File Path**: `src/data/blog/{{now}}-{{step2.items[1].title}}.md`
   - **File Content**: `{{step4.transformed}}`
   - **Commit Message**: `Add AI insight: {{step2.items[1].title}}`

## Step 9: Set Up Step 8 - Create GitHub File (Article 3)

### Add Another GitHub Action
1. **Click "+" to add another action**
2. **Search for "GitHub"** again
3. **Select "Create File"**
4. **Configure with these settings**:
   - **Repository**: `glglak/logs-of-a-thinking-machine`
   - **File Path**: `src/data/blog/{{now}}-{{step2.items[2].title}}.md`
   - **File Content**: `{{step5.transformed}}`
   - **Commit Message**: `Add AI insight: {{step2.items[2].title}}`

## Step 10: Set Up Scheduling

### Configure Trigger
1. **Go back to the trigger section**
2. **Search for "Schedule"**
3. **Select "Schedule by Zapier"**
4. **Set to run daily** at your preferred time (e.g., 9:00 AM)

## Step 11: Test and Activate

### Test the Zap
1. **Click "Test"** on each step
2. **Verify the data flow** between steps
3. **Check that GitHub files are created** correctly
4. **Review the generated content** for quality

### Activate the Zap
1. **Click "Turn on Zap"**
2. **Monitor the first few runs**
3. **Adjust settings** if needed

## Expected Results

### Daily Output
- **3 AI insight articles** per day
- **Philosophical analysis** of each development
- **Architectural insights** connecting to broader themes
- **Human impact** considerations
- **Thinking questions** for deeper reflection

### Content Quality
- **Consistent structure** across all articles
- **Thoughtful analysis** beyond surface-level news
- **Architectural perspective** on AI developments
- **Philosophical depth** in human implications

## Troubleshooting

### Common Issues
1. **Perplexity API limits**: Check your API usage and limits
2. **GitHub permissions**: Ensure Zapier has write access to your repo
3. **Content quality**: Monitor and refine the prompts if needed
4. **Scheduling**: Verify the trigger is set correctly

### Optimization Tips
1. **Monitor content quality** for the first week
2. **Adjust prompts** based on output quality
3. **Fine-tune pillar categorization** if needed
4. **Add more specific tags** for better organization

## Cost Considerations

### Zapier Pricing
- **Free tier**: 100 tasks/month (enough for daily runs)
- **Starter tier**: $20/month for 750 tasks/month
- **Professional tier**: $50/month for 2,000 tasks/month

### Perplexity API Costs
- **Sonar model**: ~$0.01 per request
- **Daily cost**: ~$0.06 (3 articles × 2 API calls)
- **Monthly cost**: ~$1.80

### Total Monthly Cost
- **Zapier**: $20 (Starter tier)
- **Perplexity**: ~$2
- **Total**: ~$22/month for 3 articles daily

This gives you a fully automated system that generates 3 thoughtful, architectural, philosophical articles about AI developments every day! 🚀
