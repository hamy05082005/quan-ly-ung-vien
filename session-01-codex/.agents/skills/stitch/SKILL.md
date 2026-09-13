---
name: stitch
description: "Use Google Stitch to generate UI from Vietnamese/English prompts or reference images, then hand off HTML to Codex."
metadata:
  author: mindx-creator
  version: "1.0.0"
  provider: codex
  source: adapted-from-claudekit-stitch
---

# Stitch → Codex Handoff

> [!IMPORTANT]
> Bộ công cụ lập trình với AI dành tặng học viên MindX cho khóa học Vibecode for Everyone. Bạn quan tâm vui lòng liên hệ mindx.edu.vn để nhận bộ tài liệu đầy đủ.
>
> © MindX Technology School — Vibecode Kit Engineer (Codex). Bản quyền thuộc **MindX Creator**. Chỉ phân phối cho học viên khóa Vibecode For Everyone. Không sao chép / bán lại / đăng công khai toàn bộ kit.

Course workflow for **Google Stitch** + **Codex**. Prefer the Stitch web app in class (simple). API scripts are optional for advanced students.

## Lab path (default)

1. Open [stitch.withgoogle.com](https://stitch.withgoogle.com) and sign in
2. Prompt in Vietnamese or English, or upload a screenshot/reference
3. Iterate until layout matches the idea (hero, sections, CTA)
4. **Export / Save as HTML** into the student project
5. Open project in Codex and refine with `vibe-build` / `frontend-design`

## Codex handoff prompt

```
Follow .agents/skills/stitch/SKILL.md
I exported Stitch HTML into the project.
Then follow .agents/skills/vibe-build/SKILL.md
Read @docs/design-guidelines.md
Adapt brand (logo, MindX-compatible colors if needed, Vietnamese copy), mobile-first.
```

## Rules

- Stitch output is a draft — always polish in Codex
- Do not invent product copy beyond what the student provides
- Do not connect database/deploy in Session 1
