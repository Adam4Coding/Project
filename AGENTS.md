# AGENTS.md

## Cursor Cloud specific instructions

### Repository overview

This repository contains standalone data science scripts (Python and R). There is **no** Node.js, pnpm, or monorepo structure — it is a flat collection of individual analysis scripts.

| Script | Language | Key dependencies |
|---|---|---|
| `Momentum Stock Simulator` | Python | yfinance, pandas, numpy, matplotlib |
| `Python DNA Project` | Python | pandas, numpy, matplotlib, seaborn |
| `Python Movie Ratings` | Python | pandas, numpy, matplotlib, seaborn |
| `Volatility Project` | Python | yfinance, pandas, numpy, scikit-learn, matplotlib |
| `Medical Data Statistical Analysis` | R | Base R only (needs `medicaldata2.csv` data file) |

### Running scripts

- **Python scripts** — run with `MPLBACKEND=Agg python3 "<script name>"` (the `Agg` backend avoids errors in headless/CI environments).
- **R script** — run with `Rscript "Medical Data Statistical Analysis"`. Note: this script requires a `medicaldata2.csv` file in the working directory that is **not** included in the repo.
- **Movie Ratings script** — requires an `imdb_1000.csv` file in the working directory that is **not** included in the repo.
- Script filenames contain spaces and have no extensions; always quote them.

### Caveats

- The `yfinance` package fetches live market data; scripts using it (`Momentum Stock Simulator`, `Volatility Project`) require network access and may produce different numerical results on each run.
- `matplotlib` plots in headless environments need `MPLBACKEND=Agg` or `plt.switch_backend('Agg')` to avoid display errors.
