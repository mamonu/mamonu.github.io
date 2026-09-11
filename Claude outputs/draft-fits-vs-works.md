# What Fits and What Works

*The model I actually use on an 8 GB card is the one that doesn't fit on it.*

The instinct, when you have a small card, is to go shopping for the smallest possible version of the biggest possible model. It is a fun problem. There is a whole ecosystem of increasingly heroic compression built around it, and the ratios on offer are genuinely startling.

It is also the wrong first question, and it took me building a benchmark to work out why.

The model I run on this machine is gpt-oss-20b. It does not fit in 8 GB of VRAM. It generates at about eight tokens per second, which is not fast. It scores 29 out of 30 on my own code benchmark, which is the only number that has changed how I work.

Most of what I got wrong before that came down to misreading the quantisation label on a model file. So that is most of what this post is about.

## The box

A Dell OptiPlex 7060 SFF, an RTX A1000 with 8 GB of VRAM pulling around 50 W, and 48 GB of system RAM. WSL2 sees roughly 8.2 GB of that VRAM once the OS and display driver have taken their cut.

The 48 GB of system RAM turns out to matter more than the 8 GB of VRAM. That is not what I expected when I started.

## The model that doesn't fit

gpt-oss-20b is 21 billion parameters total with 3.6 billion active per token — a Mixture of Experts model. OpenAI targets it at 16 GB of memory.

Sixteen is larger than eight. It does not fit, and I am not going to pretend otherwise.

What makes it work anyway is that an MoE model only needs a fraction of itself for any given token. The full expert pool can live in system RAM while the GPU handles whatever is actually in use. That is the problem [FreeToken](https://mamonu.hashnode.dev/running-large-moe-llms-on-modest-hardware-with-freetoken) is built around, and it is roughly what LM Studio is doing when you hand it a layer-offload setting.

On this machine it generates at about 8 tok/s, and the output is consistently good.

## Reading the label

If you download GGUF files you have seen this ladder, roughly worst to best and smallest to largest:

`Q2_K` · `Q3_K_S` · `Q3_K_M` · `Q3_K_L` · `Q4_0` · `Q4_K_S` · `Q4_1` · `Q4_K_M` · `Q5_0` · `Q5_1` · `Q5_K_S` · `Q5_K_M` · `Q6_K` · `Q8_0` · `F16`

Three different things are encoded in those names.

**The number is the target bit width.** Q4 is about four bits per weight against F16's sixteen, so roughly a quarter of the size. The real figure is always somewhat higher than the headline, because every scheme stores scaling metadata alongside the weights. Exact sizes vary by architecture, so treat any bits-per-weight claim as approximate until you measure the file.

**`_K` means K-quants, and its absence means legacy.** `Q4_0`, `Q4_1`, `Q5_0` and `Q5_1` are the older formats: a block of weights, one scale, uniformly applied, the same treatment everywhere in the network. K-quants are smarter about where the bits go, allocating precision per tensor type — more for the parts of the network that are sensitive to rounding, less for the parts that tolerate it.

This is why the ladder is not strictly monotonic in file size. `Q5_K_S` sits above `Q5_1` on quality while often being the *smaller* file. That is the entire pitch for K-quants: more quality per byte. Choosing between a legacy quant and a K-quant of similar size, take the K-quant.

**`_S`, `_M`, `_L` are small, medium and large** variants within a family — how many tensors get the more generous treatment. `Q4_K_M` is the conventional sweet spot and a sensible default when you have no other information.

Where to sit, in practice:

| Range | What to expect |
|---|---|
| `Q8_0`, `Q6_K` | Effectively indistinguishable from full precision. Use if you have the room. |
| `Q5_K_M`, `Q4_K_M` | The working range. Degradation exists but is hard to notice on ordinary tasks. |
| `Q3_K_*` | Noticeably worse. Acceptable if the alternative is not running the model at all. |
| `Q2_K` | Last resort. Expect instruction-following and long-form coherence to go first. |

The failure mode as you descend is not that the model gets uniformly dumber. It gets *unreliable* — mostly fine, then suddenly not, on inputs that look no harder than the ones it just handled. Averages hide that. A model that is excellent most of the time and stuck in a loop the rest of it is not something you can leave running against a task queue overnight, and no single quality score will tell you which one you have.

## Beyond the ladder

The GGUF ladder is not the only game.

**I-quants** (`IQ2_XXS`, `IQ3_XXS`, `IQ4_XS` and friends) use a different codebook plus an importance matrix — an *imatrix*, produced by running calibration text through the model and recording which weights actually matter. At the low end they deliver meaningfully better quality per bit than the equivalent K-quant. The costs: someone has to generate the imatrix, results depend on what that calibration data contained, and inference can be slower on some hardware because decoding is more involved.

**MXFP4** is what gpt-oss-20b ships as, and it is a different kind of thing. Each weight is a 4-bit float — one sign bit, two exponent bits, one mantissa bit — and every block of 32 elements shares a single 8-bit power-of-two scale. That works out to 4.25 bits per weight, and because the scale is a power of two, dequantising is a bit-shift rather than a multiply.

The interesting property is granularity. Traditional INT4 approaches often use one scale across an entire output channel, which can be thousands of elements, so a single outlier weight drags the scale for everything around it. Rescaling every 32 elements keeps outliers local.

But the part that actually matters is *when* the quantisation happened. MXFP4 was applied to the MoE weights as part of post-training, and OpenAI's published evaluations were run at MXFP4. It is not a lossy transformation applied afterwards to a model trained at higher precision — it is the format the model was finished in. When you download it you are getting what was measured, which is a meaningfully different proposition from downloading somebody's `Q4_K_M` repack of something else.

**Other families**, briefly, since GGUF is not the only ecosystem:

- **GPTQ** — post-training, layer by layer, using second-order information to decide rounding. Common on GPU inference stacks.
- **AWQ** — activation-aware: identifies the small fraction of weights that matter most to activations and protects them. Generally strong at 4-bit.
- **EXL2 / EXL3** — variable bitrate within a single model; you ask for an average bits-per-weight and the quantiser distributes it. Popular with ExLlama.
- **NF4** — the 4-bit normal-float format from QLoRA, built on the assumption that weights are roughly normally distributed. Mostly seen in fine-tuning.
- **Ternary / BitNet-style** — weights restricted to −1, 0, +1, around 1.58 bits per weight.

That last one is worth dwelling on, because it is where the arithmetic gets seductive. Sub-2-bit formats promise enormous models on small cards, and the headline ratios are real. The catch is that these approaches work properly when the model is *trained* that way from the start. Crushing a conventionally-trained model down to one or two bits after the fact is a different and far less forgiving operation, and the published quality figure for such a build is usually an average across benchmarks — which, as above, is exactly the statistic that hides whether the thing falls over.

The general rule, and the one I would tattoo on the inside of my eyelids: quantisation-aware beats post-hoc, and the further down you push, the more that gap matters.

## One more axis: the KV cache

Weight quantisation is not the only place bits get saved, and the two are easy to confuse.

The KV cache stores information about tokens already processed so the model does not recompute everything for every new token. It grows with context length, and on a small card it is often what actually pushes you into an out-of-memory error — you load fine, chat fine, and then die forty thousand tokens into a long session.

llama.cpp can quantise it independently of the weights:

```
llama-cli -m model.gguf -fa -ctk q4_0 -ctv q4_0 -ngl 99
```

`-fa` enables Flash Attention, which is required for this form of cache quantisation. `-ctk` and `-ctv` set the Key and Value cache formats. `-ngl 99` puts as many layers on the GPU as will go.

LM Studio exposes the same two settings on the model-load screen, where they are off by default. If quality degrades on very long prompts, the Key cache is the more sensitive of the two, so `-ctk f16 -ctv q4_0` is a reasonable middle ground — compress the Values, leave the Keys alone.

## Serving it

LM Studio's server is the best way I have found to run gpt-oss-20b day to day. The GUI is fine for loading a model and poking at it, but the server is what makes it something your other tools can talk to — it speaks the OpenAI API, so anything expecting that endpoint works unmodified.

If you are running it under WSL2 and want to reach it from other machines on your network, I wrote the networking side up separately: [Exposing an LM Studio Server Running in WSL2 to Your LAN](https://mamonu.hashnode.dev/exposing-an-lm-studio-server-running-in-wsl2-to-your-lan).

Two settings beyond the cache options above:

**Layer offload** is the most important lever on a card this size. Too few layers on the GPU wastes it; too many and you hit OOM partway through a long generation rather than at load time, which is a worse way to find out.

**Sampling defaults** are worth checking rather than assuming. GGUF files carry their own default temperature, top-k and top-p in metadata, and those do not always match the settings the model was evaluated under. Look at what the file says, then look up what the publisher used.

[TODO: your actual LM Studio settings — layer count, context length, cache quant — and whether tok/s differed against FreeToken.]

## Measuring instead of guessing

None of the above tells you whether a model is any good at your work. That needs measuring, which is why I built [little-llms-bench](https://mamonu.hashnode.dev/trusting-local-llms-with-code-building-little-llms-bench): thirty tasks, twenty Python and ten Bash, graded by execution rather than by asking another model for its opinion. Twelve easy, thirteen medium, five hard.

| Model | Easy (12) | Medium (13) | Hard (5) | Total |
|---|---|---|---|---|
| gpt-oss-20b | 12 / 12 | 12 / 13 | 5 / 5 | **29 / 30 (96.7%)** |
| gemini-3.5-flash-lite | 11 / 12 | 12 / 13 | 3 / 5 | 26 / 30 (86.7%) |
| qwen2.5-coder-7b-instruct (Q5_K_M) | 10 / 12 | 8 / 13 | 4 / 5 | 22 / 30 (73.3%) |
| qwen2.5-1.5b-instruct (Q4_K_M) | 8 / 12 | 3 / 13 | 0 / 5 | 11 / 30 (36.7%) |

gpt-oss-20b swept the hard tier — the O(n) sliding-window maximum with a hidden timing check on a 200,000-element array, the decorator factory, the expression parser forbidden from touching `eval()`. Its single failure was a medium Bash parameter-expansion question.

Note the quant labels in that table. The 7B is a `Q5_K_M` and the 1.5B a `Q4_K_M` — both sensible positions on the ladder, neither handicapped by its quantisation. They lost on capability, not on bits. Choosing a good quant does not rescue a model that was not going to manage the task anyway, and that cuts both ways: it is not usually the quantisation that is letting you down.

Worth being honest about cost, too: 24 minutes 56 seconds for the full suite on the 20B, against 12 minutes 12 seconds for Gemini 3.5 Flash-Lite and 28 minutes for the 7B. The 20B is not fast. It is correct, which for overnight work matters more.

## Check the file before you trust it

Two habits, both cheap.

**Read the chat template.** A normal one is a few hundred bytes to a few KB of Jinja wrapping messages in role markers. Some publishers ship much larger ones carrying reasoning scaffolds, tool protocols or standing instructions. That is behaviour, it executes on every single request, and you should know what it says before you deploy it.

**Measure the parameter count and bits per weight from the file itself**, not from the filename. A GGUF header gives you tensor shapes and offsets, and the gaps between consecutive offsets give you real byte counts per tensor. That means you get a correct bits-per-weight figure even for a quantisation type the script has never heard of — no type table required, which matters because new formats appear faster than tooling catches up.

```python
#!/usr/bin/env python3
"""Read a GGUF header: metadata, parameter count, and real bits per weight."""
import os
import struct
import sys
from collections import Counter

# ggml type id -> name. Unknown ids still work; sizes come from offsets.
GGML_TYPES = {
    0: "F32", 1: "F16", 2: "Q4_0", 3: "Q4_1", 6: "Q5_0", 7: "Q5_1",
    8: "Q8_0", 9: "Q8_1", 10: "Q2_K", 11: "Q3_K", 12: "Q4_K", 13: "Q5_K",
    14: "Q6_K", 15: "Q8_K", 16: "IQ2_XXS", 17: "IQ2_XS", 18: "IQ3_XXS",
    19: "IQ1_S", 20: "IQ4_NL", 21: "IQ3_S", 22: "IQ2_S", 23: "IQ4_XS",
    24: "I8", 25: "I16", 26: "I32", 27: "I64", 28: "F64", 29: "IQ1_M",
    30: "BF16", 34: "TQ1_0", 35: "TQ2_0", 39: "MXFP4",
}

SCALARS = {0: "B", 1: "b", 2: "H", 3: "h", 4: "I", 5: "i",
           6: "f", 7: "?", 10: "Q", 11: "q", 12: "d"}

class Reader:
    def __init__(self, f):
        self.f = f

    def num(self, fmt):
        return struct.unpack("<" + fmt, self.f.read(struct.calcsize(fmt)))[0]

    def string(self):
        return self.f.read(self.num("Q")).decode("utf-8", "replace")

    def value(self, type_id):
        if type_id == 8:                      # string
            return self.string()
        if type_id == 9:                      # array
            elem = self.num("I")
            return [self.value(elem) for _ in range(self.num("Q"))]
        return self.num(SCALARS[type_id])     # fixed-width scalar

def read_gguf(path):
    f = open(path, "rb")
    r = Reader(f)
    if f.read(4) != b"GGUF":
        raise SystemExit(f"{path}: not a GGUF file")

    version, n_tensors, n_kv = r.num("I"), r.num("Q"), r.num("Q")

    meta = {}
    for _ in range(n_kv):
        key = r.string()
        meta[key] = r.value(r.num("I"))

    tensors = []
    for _ in range(n_tensors):
        name = r.string()
        dims = [r.num("Q") for _ in range(r.num("I"))]
        type_id, offset = r.num("I"), r.num("Q")
        count = 1
        for d in dims:
            count *= d
        tensors.append({"name": name, "dims": dims, "type": type_id,
                        "offset": offset, "count": count})

    # Tensor data is aligned after the header; sizes come from offset gaps.
    align = meta.get("general.alignment", 32)
    start = f.tell()
    if start % align:
        start += align - (start % align)
    end_of_data = os.path.getsize(path) - start

    tensors.sort(key=lambda t: t["offset"])
    for i, t in enumerate(tensors):
        nxt = tensors[i + 1]["offset"] if i + 1 < len(tensors) else end_of_data
        t["nbytes"] = nxt - t["offset"]

    return version, meta, tensors

def main(path):
    version, meta, tensors = read_gguf(path)
    size = os.path.getsize(path)
    params = sum(t["count"] for t in tensors)

    print(f"{os.path.basename(path)}")
    print(f"  gguf v{version}   {len(tensors)} tensors   {len(meta)} metadata keys")
    print(f"  {params:,} params ({params / 1e9:.2f}B)")
    print(f"  {size:,} bytes ({size / 2**30:.2f} GiB)")
    print(f"  {size * 8 / params:.3f} bits per weight overall\n")

    arch = meta.get("general.architecture", "?")
    print(f"  architecture : {arch}")
    for key in ("general.name", "general.size_label",
                f"{arch}.block_count", f"{arch}.context_length",
                f"{arch}.embedding_length"):
        if key in meta:
            print(f"  {key:<24}: {meta[key]}")

    template = meta.get("tokenizer.chat_template", "")
    if template:
        note = "  <- unusually large; read it before deploying" if len(template) > 12000 else ""
        print(f"  chat_template chars      : {len(template):,}{note}")

    print("\n  per quant type:")
    counts, sizes, weights = Counter(), Counter(), Counter()
    for t in tensors:
        name = GGML_TYPES.get(t["type"], f"UNKNOWN({t['type']})")
        counts[name] += 1
        sizes[name] += t["nbytes"]
        weights[name] += t["count"]

    for name, n in counts.most_common():
        bpw = sizes[name] * 8 / weights[name] if weights[name] else 0
        print(f"    {name:<16} {n:>4} tensors  {weights[name] / 1e9:>7.3f}B params  "
              f"{bpw:>6.3f} bpw")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
```

To check the method, run it against files whose bit width you already know. `Q4_1` should come out at 5.000 bpw, `BF16` at 16.000, `F32` at 32.000. If those land exactly, the unknown rows in the same file can be trusted.

[TODO: paste the output for a model you are happy to show — gpt-oss-20b would make the point nicely.]

## What I would do first now

Pick the model by measured capability on tasks you actually care about, then work out how to serve it. Not the other way round.

Hunting for the largest model that fits optimises for a number that appears nowhere in your actual work. Nobody's workload is "parameters resident in VRAM". Mine is "does the generated Python pass its tests", and I had no way to answer that until I built something that could.

If you have 8 GB and you want local code generation: run gpt-oss-20b with the expert pool in system RAM, serve it through LM Studio, accept eight tokens per second, and spend the time you would otherwise have spent hunting exotic quantisations on writing tests for the output instead.

And if you are choosing a quant for something else: start at `Q4_K_M`, move up to `Q5_K_M` or `Q6_K` if the memory is there, and treat anything below `Q3` as a compromise you should be able to justify out loud.
