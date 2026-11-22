"""Token Tracking Module for AyuLekha Clinical AI.

Tracks token consumption across:
1. Asking questions (Intake & SOCRATES interview)
2. Creating summary (PhysicianSummary structured generation)
3. Testing summary (Clinical evaluation benchmark)

Calculates the peak (maximum) tokens in any single call, sums all tokens,
and displays a live, formatted banner in the terminal.
"""
from __future__ import annotations

import threading
from typing import Any, Dict, Optional

from langchain_core.callbacks import BaseCallbackHandler


class TokenTracker:
    def __init__(self):
        self._lock = threading.Lock()
        self.questions_tokens: int = 0
        self.summary_tokens: int = 0
        self.testing_tokens: int = 0
        self.max_single_call_tokens: int = 0
        self.call_history: list[Dict[str, Any]] = []

        # Dual-Provider Token Tracking
        self.gemini_prompt_tokens: int = 0
        self.gemini_completion_tokens: int = 0
        self.gemini_total_tokens: int = 0
        self.gemini_calls_count: int = 0

        self.groq_prompt_tokens: int = 0
        self.groq_completion_tokens: int = 0
        self.groq_total_tokens: int = 0
        self.groq_calls_count: int = 0

    def reset(self):
        with self._lock:
            self.questions_tokens = 0
            self.summary_tokens = 0
            self.testing_tokens = 0
            self.max_single_call_tokens = 0
            self.call_history.clear()

            self.gemini_prompt_tokens = 0
            self.gemini_completion_tokens = 0
            self.gemini_total_tokens = 0
            self.gemini_calls_count = 0

            self.groq_prompt_tokens = 0
            self.groq_completion_tokens = 0
            self.groq_total_tokens = 0
            self.groq_calls_count = 0

    def get_provider_summary(self) -> Dict[str, Any]:
        """Return clean structured token breakdown by provider."""
        with self._lock:
            return {
                "gemini": {
                    "prompt_tokens": self.gemini_prompt_tokens,
                    "completion_tokens": self.gemini_completion_tokens,
                    "total_tokens": self.gemini_total_tokens,
                    "calls_count": self.gemini_calls_count,
                },
                "groq": {
                    "prompt_tokens": self.groq_prompt_tokens,
                    "completion_tokens": self.groq_completion_tokens,
                    "total_tokens": self.groq_total_tokens,
                    "calls_count": self.groq_calls_count,
                },
                "grand_total": (
                    self.gemini_total_tokens
                    + self.groq_total_tokens
                    if (self.gemini_total_tokens + self.groq_total_tokens) > 0
                    else (self.questions_tokens + self.summary_tokens + self.testing_tokens)
                ),
            }

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Estimate token count (approx. 4 characters per token for English/multilingual text)."""
        if not text:
            return 0
        cleaned = text.strip()
        chars = len(cleaned)
        return max(1, int(chars / 3.8))

    def record(
        self,
        stage: str,
        prompt_tokens: int,
        completion_tokens: int,
        details: str = "",
        model_name: str = "openai/gpt-oss-120b",
        provider: str = "groq",
    ) -> Dict[str, Any]:
        """Record an AI invocation's token usage with provider tagging and print the formatted report."""
        prompt_tokens = max(0, prompt_tokens)
        completion_tokens = max(0, completion_tokens)
        call_total = prompt_tokens + completion_tokens

        clean_provider = provider.lower().strip()
        if "gemini" in clean_provider or "google" in clean_provider or "flash" in model_name.lower():
            clean_provider = "gemini"
        else:
            clean_provider = "groq"

        with self._lock:
            self.max_single_call_tokens = max(self.max_single_call_tokens, call_total)
            stage_upper = stage.upper()
            if "QUESTION" in stage_upper or "INTAKE" in stage_upper:
                self.questions_tokens += call_total
                stage_label = "ASKING QUESTIONS (Interview Turns)"
            elif "SUMMARY" in stage_upper:
                self.summary_tokens += call_total
                stage_label = "CREATING SUMMARY (PhysicianSummary)"
            elif "TEST" in stage_upper or "EVAL" in stage_upper or "BENCH" in stage_upper:
                self.testing_tokens += call_total
                stage_label = "TESTING SUMMARY (Clinical Benchmarking)"
            else:
                self.questions_tokens += call_total
                stage_label = stage

            if clean_provider == "gemini":
                self.gemini_prompt_tokens += prompt_tokens
                self.gemini_completion_tokens += completion_tokens
                self.gemini_total_tokens += call_total
                self.gemini_calls_count += 1
            else:
                self.groq_prompt_tokens += prompt_tokens
                self.groq_completion_tokens += completion_tokens
                self.groq_total_tokens += call_total
                self.groq_calls_count += 1

            grand_total = (
                self.gemini_total_tokens
                + self.groq_total_tokens
                if (self.gemini_total_tokens + self.groq_total_tokens) > 0
                else (self.questions_tokens + self.summary_tokens + self.testing_tokens)
            )

            entry = {
                "stage": stage_label,
                "provider": clean_provider.upper(),
                "details": details,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "call_total": call_total,
                "max_single_call_tokens": self.max_single_call_tokens,
                "questions_tokens": self.questions_tokens,
                "summary_tokens": self.summary_tokens,
                "testing_tokens": self.testing_tokens,
                "gemini_total_tokens": self.gemini_total_tokens,
                "gemini_calls_count": self.gemini_calls_count,
                "groq_total_tokens": self.groq_total_tokens,
                "groq_calls_count": self.groq_calls_count,
                "grand_total": grand_total,
                "model": model_name,
            }
            self.call_history.append(entry)

        self._print_terminal_banner(entry)
        return entry

    def _print_terminal_banner(self, data: Dict[str, Any]) -> None:
        """Print the structured dual-provider token report in the terminal."""
        width = 76
        sep = "=" * width
        sub_sep = "-" * width

        provider_name = data.get("provider", "LLM")
        model_name = data.get("model", "")

        print("\n" + sep, flush=True)
        print("⚡ [AYULEKHA CLINICAL AI TOKEN CONSUMPTION REPORT]", flush=True)
        print(sub_sep, flush=True)
        print(f"  • Invocation Provider     : {provider_name} ({model_name})", flush=True)
        print(f"  • Current Stage           : {data['stage']}", flush=True)
        if data.get("details"):
            print(f"  • Operation Details       : {data['details']}", flush=True)
        print(
            f"  • Current Call Tokens     : {data['call_total']:,} tokens (Prompt: {data['prompt_tokens']:,}, Completion: {data['completion_tokens']:,})",
            flush=True,
        )
        print(sub_sep, flush=True)
        print(f"  • Peak (Max) Call Tokens  : {data['max_single_call_tokens']:,} tokens", flush=True)
        print(f"  • Asking Questions Sum    : {data['questions_tokens']:,} tokens", flush=True)
        print(f"  • Creating Summary Sum    : {data['summary_tokens']:,} tokens", flush=True)
        print(sub_sep, flush=True)
        print("  🔥 [DUAL-PROVIDER USAGE BREAKDOWN]", flush=True)
        print(
            f"  • Gemini Tokens Total     : {data.get('gemini_total_tokens', 0):,} tokens ({data.get('gemini_calls_count', 0)} call(s))",
            flush=True,
        )
        print(
            f"  • Groq Tokens Total       : {data.get('groq_total_tokens', 0):,} tokens ({data.get('groq_calls_count', 0)} call(s))",
            flush=True,
        )
        print(sub_sep, flush=True)
        print(
            f"  >>> CUMULATIVE GRAND TOTAL: {data['grand_total']:,} TOKENS UTILIZED <<<",
            flush=True,
        )
        print(sep + "\n", flush=True)


# Singleton token tracker
tracker = TokenTracker()


class TokenTrackingCallback(BaseCallbackHandler):
    """LangChain callback that captures usage_metadata from LLM responses."""

    def __init__(
        self,
        stage: str = "QUESTION",
        details: str = "",
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
    ):
        super().__init__()
        self.stage = stage
        self.details = details
        self.provider = provider
        self.model_name = model_name

    def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        prompt_tokens = 0
        completion_tokens = 0
        detected_model = self.model_name or "openai/gpt-oss-120b"
        detected_provider = self.provider or "groq"

        # Attempt to inspect usage metadata from Groq
        if hasattr(response, "llm_output") and isinstance(response.llm_output, dict):
            token_usage = response.llm_output.get("token_usage") or {}
            prompt_tokens = token_usage.get("prompt_tokens", 0)
            completion_tokens = token_usage.get("completion_tokens", 0)
            m_name = response.llm_output.get("model_name")
            if m_name:
                detected_model = m_name

        if not prompt_tokens and not completion_tokens:
            for gen_list in getattr(response, "generations", []):
                for gen in gen_list:
                    msg = getattr(gen, "message", None)
                    if msg:
                        usage = getattr(msg, "usage_metadata", None) or {}
                        if usage:
                            prompt_tokens = usage.get("input_tokens", 0)
                            completion_tokens = usage.get("output_tokens", 0)
                            break
                        res_meta = getattr(msg, "response_metadata", None) or {}
                        t_usage = res_meta.get("token_usage") or {}
                        if t_usage:
                            prompt_tokens = t_usage.get("prompt_tokens", 0)
                            completion_tokens = t_usage.get("completion_tokens", 0)
                            m = res_meta.get("model_name") or res_meta.get("model")
                            if m:
                                detected_model = m
                            break

        if "gemini" in detected_model.lower() or "google" in detected_model.lower():
            detected_provider = "gemini"

        # Fallback to text estimation if API usage metadata was not returned
        if not prompt_tokens and not completion_tokens:
            full_text = ""
            for gen_list in getattr(response, "generations", []):
                for gen in gen_list:
                    full_text += getattr(gen, "text", "")
            completion_tokens = tracker.estimate_tokens(full_text)
            prompt_tokens = max(40, completion_tokens * 2)

        tracker.record(
            stage=self.stage,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            details=self.details,
            provider=detected_provider,
            model_name=detected_model,
        )
