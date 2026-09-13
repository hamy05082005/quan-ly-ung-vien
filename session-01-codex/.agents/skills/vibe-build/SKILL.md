---
name: vibe-build
description: "Build landing pages and web UI from natural-language prompts for Vibecode Codex students."
metadata:
  author: mindx-creator
  version: "3.0.0"
  provider: codex
---

# Vibe Build — Web UI

> [!IMPORTANT]
> Bộ công cụ lập trình với AI dành tặng học viên MindX cho khóa học Vibecode for Everyone. Bạn quan tâm vui lòng liên hệ mindx.edu.vn để nhận bộ tài liệu đầy đủ.
>
> © MindX Technology School — Vibecode Kit Engineer (Codex). Bản quyền thuộc **MindX Creator**. Chỉ phân phối cho học viên khóa Vibecode For Everyone. Không sao chép / bán lại / đăng công khai toàn bộ kit.

Implements web interfaces from **product docs**, not from memory. For zero-tech builders using **Codex**.

## Before writing code

Read (if present):

- `docs/project-overview-pdr.md`
- `docs/design-guidelines.md`
- `docs/data-schema.md` (when the app uses structured data)

If PRD is still a template, ask for: product name, primary user, main pages, and 3 acceptance criteria.

## Principles

1. Outcome over implementation — describe what the user sees
2. No fabricated product data
3. Mobile-first
4. Prefer existing stack; default HTML + Tailwind CDN if greenfield
5. Incremental — one section/feature per prompt

## Companion skills

| Need | Skill |
|------|-------|
| Gen UI from text/image | `stitch` |
| Visual polish | `frontend-design` |
| Colors / fonts / layout | `ui-ux-pro-max` |
| Logo / banner | `design` |
| Headlines / CTA | `copywriting` |
| Errors | `fix` |

## Sample prompt

```
Follow .agents/skills/vibe-build/SKILL.md
Read @docs/project-overview-pdr.md and @docs/design-guidelines.md
Feature: Build the landing page sections from the PRD. Mobile-first.
```
