# BOOT.md

Add short, explicit instructions for what OpenClaw should do on startup (enable `hooks.internal.enabled`).
If the task sends a message, use the message tool and then reply with NO_REPLY.
For image understanding, use only the configured image model from `agents.defaults.imageModel.primary`.
Do not hardcode alternate image models like `openai/gpt-4.1-mini` or `google/gemini-*`.
If calling the `image` tool explicitly, omit the `model` field unless a deployment-specific override is documented.
Never use `dall-e-3` for image understanding; it is generation-only.

If the user attached an image and asks to modify it or create a variant based on it, use skill **upx5-image-generation** `edit.mjs` with that file as `--image`. Do not use generation-from-text-only for that case.

For **/limits**: reply with (1) billing/renewal info (days left, balance, amount needed, shortfall — from billing-status or state file) and (2) Codex limits by running once `node <skill-dir>/scripts/get-limits.mjs` (upx5-limits). Include both blocks in one answer.
