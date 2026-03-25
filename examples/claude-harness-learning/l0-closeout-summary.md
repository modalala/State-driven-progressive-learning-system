# L0 Closeout Summary

Date: 2026-03-22
Lesson: L0
Status: Completed

## Summary

L0 closed with three core takeaways:

1. Start from the docs outline and repository overview, then load resources by lesson instead of preloading all page bodies. This keeps context focused and prevents retrieval noise.
2. The model is not the harness. The model decides what to do next. The harness provides tools, execution environment, permissions, safety checks, and result feedback.
3. The minimal agent loop is already enough to form a real coding agent: user message in, model response out, tool calls executed, tool results fed back, loop until the model stops.

## Code Mapping

Source files:

- `resources/code-snippets/learn-claude-code/README.md`
- `resources/code-snippets/learn-claude-code/agents/s01_agent_loop.py`
- `resources/code-snippets/learn-claude-code/docs/en/s01-the-agent-loop.md`

Key implementation points in `s01_agent_loop.py`:

- Tool definition: lines 43-51
- Tool execution and safety boundary: lines 54-64
- Main agent loop and `stop_reason` gate: lines 68-88

## Boundary Explanation

In plain language:

- The model is the one making decisions.
- The harness is the workspace and machinery around it.
- A shell script with some control flow is not the agent itself. It is only part of the environment that lets the model act.

## Docs vs Code

Official docs are better for understanding concepts, boundaries, and intended workflows.
Code examples are better for locating where those ideas actually land in implementation.
You need both to avoid confusing architecture vocabulary with running code structure.

## Questions Carried into L1

1. How does tool schema shape the model's tool-calling behavior?
2. Why split capabilities into multiple tools instead of exposing only one general shell tool?
3. How should dispatch and tool-result writeback be structured once multiple tools exist?

## Diagram

```mermaid
graph TB
    subgraph l0["L0 Closeout"]
        docs["Docs Strategy<br/>outline first<br/>load by lesson"]
        boundary["Boundary Model<br/>model decides<br/>harness provides environment"]
        code["Minimal Agent Loop<br/>messages + tools + tool_result"]
    end

    user["User Task"] --> msg["Append user message"]
    msg --> llm["LLM call<br/>messages + tools"]
    llm --> assistant["Append assistant response"]

    assistant --> decision{"stop_reason<br/>equals tool_use?"}
    decision -->|No| answer["Return final text"]
    decision -->|Yes| dispatch["Execute tool call"]

    dispatch --> guard["Harness guardrails<br/>danger check<br/>timeout<br/>cwd"]
    guard --> result["Build tool_result"]
    result --> feedback["Append tool_result as user content"]
    feedback --> llm

    docs -.-> code
    boundary -.-> dispatch
    boundary -.-> feedback
    code -.-> decision

    classDef learn fill:#e7f5ff,stroke:#1971c2,color:#0b2239
    classDef flow fill:#fff4e6,stroke:#e67700,color:#5f370e
    classDef end fill:#d3f9d8,stroke:#2f9e44,color:#173b1a
    classDef warn fill:#ffe3e3,stroke:#c92a2a,color:#5c1f1f

    class docs,boundary,code learn
    class user,msg,llm,assistant,dispatch,result,feedback flow
    class answer end
    class decision,guard warn
```
