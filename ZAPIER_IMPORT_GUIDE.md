# How to Import the Enhanced Zapier Automation

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

## Step 4: Set Up Step 3 - Generate Content

### Add Code by Zapier Action
1. **Click "+" to add another action**
2. **Search for "Code by Zapier"**
3. **Select "Run Python"**
4. **Add this Python code**:

```python
import json
from datetime import datetime

def main(input_data):
    # Get the analyzed items from step 2
    items = input_data.get('items', [])
    
    generated_content = []
    
    for item in items:
        # Generate markdown content for each item
        content = f"""---
title: "{item.get('title', '')}"
description: "{item.get('architectural_insight', '')}"
pubDatetime: {datetime.now().isoformat()}
heroImage: "{item.get('image', '')}"
ogImage: "{item.get('image', '')}"
tags: {json.dumps(item.get('tags', []))}
content_pillar: "{item.get('content_pillar', 'ai-insights')}"
content_type: "ai-insight"
source_url: "{item.get('url', '')}"
source_name: "{item.get('source', '')}"
---

![{item.get('title', '')}]({item.get('image', '')})

_{item.get('architectural_insight', '')}_

## The Architectural Pattern

{item.get('architectural_insight', '')}

This development reveals something fundamental about how we architect systems in the age of AI. The underlying pattern here suggests a shift in how we think about...

## The Philosophical Angle

{item.get('philosophical_angle', '')}

What does this mean for our relationship with technology? How does this change the fundamental questions we ask about intelligence, creativity, and human agency?

## The Human Impact

{item.get('human_impact', '')}

As we integrate these capabilities into our daily lives, we're not just adopting new tools—we're reshaping what it means to be human in a world where machines can...

## Thinking Questions

"""
        
        # Add thinking questions
        thinking_questions = item.get('thinking_questions', [])
        for question in thinking_questions:
            content += f"- {question}\n"
        
        content += f"""
---

**Source:** [{item.get('title', '')}]({item.get('url', '')}) via {item.get('source', '')}

*This analysis is part of our ongoing exploration of how AI developments reveal deeper patterns about system design, human nature, and the architecture of intelligence.*
"""
        
        generated_content.append({
            'title': item.get('title', ''),
            'content': content,
            'filename': f"{datetime.now().strftime('%Y-%m-%d')}-{item.get('title', '').lower().replace(' ', '-').replace(':', '')}.md"
        })
    
    return {
        'generated_content': generated_content,
        'count': len(generated_content)
    }
```

## Step 5: Set Up Step 4 - Create GitHub Files

### Add GitHub Action
1. **Click "+" to add another action**
2. **Search for "GitHub"**
3. **Select "Create File"**
4. **Configure with these settings**:
   - **Repository**: `glglak/logs-of-a-thinking-machine`
   - **File Path**: `src/data/blog/{{filename}}`
   - **File Content**: `{{content}}`
   - **Commit Message**: `Add AI insight: {{title}}`

## Step 6: Set Up Scheduling

### Configure Trigger
1. **Go back to the trigger section**
2. **Search for "Schedule"**
3. **Select "Schedule by Zapier"**
4. **Set to run daily** at your preferred time (e.g., 9:00 AM)

## Step 7: Test and Activate

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
