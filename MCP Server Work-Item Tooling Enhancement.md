## MCP Server Work-Item Tooling Enhancement

### Summary

The MCP server’s current Azure DevOps (ADO) work-item tools are difficult for LLMs to use reliably. Tool descriptions are vague, metadata is inconsistent, and key work-item types (Epics, Features, Stories) lack first-class support. As a result, the LLM often selects incorrect tools, cannot reliably retrieve cycle-time or flow data, and delivers reduced overall effectiveness.

### Key Problems

* Tool descriptions lack clarity, leading to incorrect LLM tool selection.
* Core ADO work-item types (Epics, Features, Stories) are not consistently exposed as first-class tools.
* Critical metadata (created/closed dates, state transitions) is missing or inconsistent, blocking cycle-time and flow analysis.
* Output schemas vary across tools, increasing cognitive load and reducing LLM reasoning accuracy.

### Goals

* Provide first-class tooling for all major ADO work-item types.
* Expose complete, consistent metadata (including dates and state transitions).
* Improve tool descriptions so the LLM clearly understands when and how to use each tool.
* Preserve full backward compatibility with all 106 existing tools.

### Proposed Actions

1. Refine descriptions for the existing 106 tools with explicit purpose, inputs, outputs, and “use this when…” guidance.
2. Design and add any additional tools required to support:

   * First-class Epics, Features, and User Stories
   * Reliable access to cycle-time and flow metrics
   * Consistent schemas across all work-item tools
3. Introduce a lightweight response schema/convention to standardize both new and existing tool outputs.
4. Update documentation and the MCP capabilities manifest once enhancements are complete.

### Expected Outcomes

* More reliable LLM tool selection and reasoning.
* Easy retrieval of epics, features, stories, cycle times, and progress data.
* Consistent, predictable work-item tooling behavior.
* No breaking changes to existing integrations.
