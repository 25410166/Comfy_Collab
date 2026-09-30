---
name: verify-before-done
description: Use this skill to ensure code works practically before declaring a task complete.
---

# Verify Before Done

## Use this skill when
- You have completed implementing a feature or fixing a bug.
- The user expects the system to be in a working state.

## Do not use this skill when
- You are in the middle of a multi-step plan and just completing one sub-task.

## Process
1. **Run the Code**: Do not assume the code works just because it looks correct. Run it.
2. **End-to-End Test**: For this project, this means sending a sample workflow to the ComfyUI endpoint and verifying an image is successfully generated and retrieved.
3. **Check Logs**: Review server logs or Colab notebook outputs to ensure no hidden errors exist.
4. **Report**: Only declare the task "Done" after successful verification.

## Checklist
- [ ] Code is executed in the actual environment.
- [ ] A sample image generation is successfully completed.
- [ ] Logs show no errors.
