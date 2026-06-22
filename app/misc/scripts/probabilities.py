from __future__ import annotations
from dataclasses import dataclass
from typing import Callable, Iterable, Mapping, Sequence
import math
import warnings
import numpy as np
from scipy import optimize, stats
from scipy.special import gamma as gamma_func
from scipy.special import erfinv

_EULER = 0.5772156649015323
_EPS = 1.0e-12

def _as_clean_array(
    x: Sequence[float],
    positive: bool = False
) -> np.ndarray:
    arr = np.asarray(x, dtype=float)
    arr = arr[np.isfinite(arr)]
    if positive:
        arr = arr[arr > 0]
    return arr

def _safe_std(x: np.ndarray) -> float:
    s = float(np.nanstd(x, ddof=1))
    return s if np.isfinite(s) and s > 0 else 1.0e-3

def _safe_var(x: np.ndarray) -> float:
    v = float(np.nanvar(x, ddof=1))
    return v if np.isfinite(v) and v > 0 else 1.0e-6

def _clip_prob(p):
    return np.clip(p, _EPS, 1.0 - _EPS)

def empirical_cdf_values(x: Sequence[float]) -> tuple[np.ndarray, np.ndarray]:
    """Return sorted x and empirical F(x_i) = rank / n."""
    arr = np.sort(_as_clean_array(x))
    n = len(arr)
    if n == 0:
        return arr, arr
    return arr, np.arange(1, n + 1, dtype=float) / n

## Initial values of parameters
# ---------------------------------------------------------------------

def startnorm(x: Sequence[float]) -> dict[str, float]:
    x = _as_clean_array(x)
    return {
        'mean': float(np.mean(x)),
        'sd': _safe_std(x)
    }

def startsnorm(x: Sequence[float]) -> dict[str, float]:
    x = _as_clean_array(x)
    return {
        'mean': float(np.mean(x)),
        'sd': _safe_std(x),
        'xi': 1.0
    }

def startlnorm(x: Sequence[float]) -> dict[str, float]:
    x = _as_clean_array(x, positive=True)
    m = float(np.mean(x))
    v = _safe_var(x)
    slog2 = math.log((v + m**2) / m**2)
    return {
        'meanlog': math.log(m) - slog2 / 2.0,
        'sdlog': math.sqrt(max(slog2, _EPS))
    }

def startgamma(x: Sequence[float]) -> dict[str, float]:
    x = _as_clean_array(x, positive=True)
    m = float(np.mean(x))
    v = _safe_var(x)
    return {
        'shape': max(m**2 / v, _EPS),
        'scale': max(v / m, _EPS)
    }

def startexp(x: Sequence[float]) -> dict[str, float]:
    x = _as_clean_array(x, positive=True)
    m = float(np.mean(x))
    return {
        'rate': max(1.0 / m, _EPS)
    }

def startweibull(x: Sequence[float]) -> dict[str, float]:
    x = _as_clean_array(x, positive=True)
    m = float(np.mean(x))
    s = _safe_std(x)
    shape = (0.9874 / max(s / m, _EPS)) ** 1.0983
    scale = m / gamma_func(1.0 + 1.0 / shape)
    return {
        'shape': max(float(shape), _EPS),
        'scale': max(float(scale), _EPS)
    }

def startgumbel(x: Sequence[float]) -> dict[str, float]:
    x = _as_clean_array(x)
    m = float(np.mean(x))
    s = _safe_std(x)
    scale = s * math.sqrt(6.0) / math.pi
    loc = m - _EULER * scale
    return {
        'loc': float(loc),
        'scale': max(float(scale), _EPS)
    }

def _wet_values(
    x: Sequence[float],
    thres: float = 1.0
) -> tuple[np.ndarray, float]:
    if thres == 0:
        thres = 1.0e-2
    arr = _as_clean_array(x)
    if len(arr) == 0:
        return arr, _EPS
    wet = arr[arr >= thres]
    prob = max(len(wet) / len(arr), 1.0e-6)
    return wet, prob

def startberngamma(
    x: Sequence[float],
    thres: float = 1.0
) -> dict[str, float]:
    wet, prob = _wet_values(x, thres)
    pars_c = {'shape': 1.0, 'scale': 1.0}
    pars = startgamma(wet) if len(wet) else pars_c
    return {'prob': prob, **pars}

def startbernexp(
    x: Sequence[float],
    thres: float = 1.0
) -> dict[str, float]:
    wet, prob = _wet_values(x, thres)
    pars_c = {'rate': 1.0}
    pars = startexp(wet) if len(wet) else pars_c
    return {'prob': prob, **pars}

def startbernlnorm(
    x: Sequence[float],
    thres: float = 1.0
) -> dict[str, float]:
    wet, prob = _wet_values(x, thres)
    pars_c = {'meanlog': 0.0, 'sdlog': 1.0}
    pars = startlnorm(wet) if len(wet) else pars_c
    return {'prob': prob, **pars}

def startbernweibull(
    x: Sequence[float],
    thres: float = 1.0
) -> dict[str, float]:
    wet, prob = _wet_values(x, thres)
    pars_c = {'shape': 1.0, 'scale': 1.0}
    pars = startweibull(wet) if len(wet) else pars_c
    return {'prob': prob, **pars}

## Skew Normal distribution definition
# ---------------------------------------------------------------------

def heaviside_fun(x, a: float = 0.0):
    return (np.sign(np.asarray(x) - a) + 1.0) / 2.0

def dsnorm(x, mean: float = 0.0, sd: float = 1.0, xi: float = 1.5, log: bool = False):
    x = (np.asarray(x, dtype=float) - mean) / sd
    m1 = 2.0 / math.sqrt(2.0 * math.pi)
    mu = m1 * (xi - 1.0 / xi)
    sigma = math.sqrt((1.0 - m1**2) * (xi**2 + 1.0 / xi**2) + 2.0 * m1**2 - 1.0)
    z = x * sigma + mu
    Xi = xi ** np.sign(z)
    g = 2.0 / (xi + 1.0 / xi)
    denst = g * stats.norm.pdf(z / Xi)
    out = denst * sigma / sd
    return np.log(np.maximum(out, _EPS)) if log else out

def psnorm(q, mean: float = 0.0, sd: float = 1.0, xi: float = 1.5):
    q = (np.asarray(q, dtype=float) - mean) / sd
    m1 = 2.0 / math.sqrt(2.0 * math.pi)
    mu = m1 * (xi - 1.0 / xi)
    sigma = math.sqrt((1.0 - m1**2) * (xi**2 + 1.0 / xi**2) + 2.0 * m1**2 - 1.0)
    z = q * sigma + mu
    Xi = xi ** np.sign(z)
    g = 2.0 / (xi + 1.0 / xi)
    return heaviside_fun(z) - np.sign(z) * g * Xi * stats.norm.cdf(-np.abs(z) / Xi)

def qsnorm(p, mean: float = 0.0, sd: float = 1.0, xi: float = 1.5):
    p = _clip_prob(np.asarray(p, dtype=float))
    m1 = 2.0 / math.sqrt(2.0 * math.pi)
    mu = m1 * (xi - 1.0 / xi)
    sigma = math.sqrt((1.0 - m1**2) * (xi**2 + 1.0 / xi**2) + 2.0 * m1**2 - 1.0)
    g = 2.0 / (xi + 1.0 / xi)
    sig = np.sign(p - 0.5)
    sig[sig == 0] = 1
    Xi = xi ** sig
    pp = (heaviside_fun(p - 0.5) - sig * p) / (g * Xi)
    quant = (-sig * stats.norm.ppf(_clip_prob(pp), scale=Xi) - mu) / sigma
    return quant * sd + mean

def rsnorm(n: int, mean: float = 0.0, sd: float = 1.0, xi: float = 1.5):
    weight = xi / (xi + 1.0 / xi)
    z = np.random.uniform(-weight, 1.0 - weight, size=n)
    Xi = xi ** np.sign(z)
    rand = -np.abs(np.random.normal(size=n)) / Xi * np.sign(z)
    m1 = 2.0 / math.sqrt(2.0 * math.pi)
    mu = m1 * (xi - 1.0 / xi)
    sigma = math.sqrt((1.0 - m1**2) * (xi**2 + 1.0 / xi**2) + 2.0 * m1**2 - 1.0)
    rand = (rand - mu) / sigma
    return rand * sd + mean

def skewness_v(x: Sequence[float]) -> float:
    x = _as_clean_array(x)
    n = len(x)
    if n == 0:
        return np.nan
    xc = x - np.mean(x)
    den = np.sum(xc**2) ** 1.5
    return float(np.sqrt(n) * np.sum(xc**3) / den) if den > 0 else 0.0

def snorm_shape(x: Sequence[float]) -> float:
    s = skewness_v(x)
    s2 = abs(s) ** (2.0 / 3.0)
    denom = s2 + ((4.0 - math.pi) / 2.0) ** (2.0 / 3.0)
    if denom <= 0:
        return 1.0
    delta = math.sqrt((math.pi / 2.0) * s2 / denom)
    return max(delta / math.sqrt(max(1.0 - delta**2, _EPS)), _EPS)

## Gumbel distribution definition
# ---------------------------------------------------------------------

def dgumbel(x, loc: float = 0.0, scale: float = 1.0, log: bool = False):
    z = (np.asarray(x, dtype=float) - loc) / scale
    d = -math.log(scale) - z - np.exp(-z)
    return d if log else np.exp(d)

def pgumbel(q, loc: float = 0.0, scale: float = 1.0, lower_tail: bool = True):
    z = (np.asarray(q, dtype=float) - loc) / scale
    p = np.exp(-np.exp(-z))
    return p if lower_tail else 1.0 - p

def qgumbel(p, loc: float = 0.0, scale: float = 1.0, lower_tail: bool = True):
    p = _clip_prob(np.asarray(p, dtype=float))
    if not lower_tail:
        p = 1.0 - p
    return loc - scale * np.log(-np.log(p))

def rgumbel(n: int, loc: float = 0.0, scale: float = 1.0):
    return loc - scale * np.log(np.random.exponential(size=n))

## Bernoulli mixture distributions
# ---------------------------------------------------------------------

def _bern_cdf(q, prob: float, base_cdf: Callable[[np.ndarray], np.ndarray]):
    q = np.asarray(q, dtype=float)
    out = np.where(q < 0, 0.0, (1.0 - prob) + prob * base_cdf(q))
    return np.clip(out, 0.0, 1.0)

def _bern_pdf(x, prob: float, base_pdf: Callable[[np.ndarray], np.ndarray]):
    x = np.asarray(x, dtype=float)
    return np.where(x <= 0, 1.0 - prob, prob * base_pdf(x))

def pberngamma(q, prob: float, shape: float, scale: float):
    return _bern_cdf(q, prob, lambda z: stats.gamma.cdf(z, a=shape, scale=scale))

def dberngamma(x, prob: float, shape: float, scale: float):
    return _bern_pdf(x, prob, lambda z: stats.gamma.pdf(z, a=shape, scale=scale))

def pbernexp(q, prob: float, rate: float):
    return _bern_cdf(q, prob, lambda z: stats.expon.cdf(z, scale=1.0 / rate))

def dbernexp(x, prob: float, rate: float):
    return _bern_pdf(x, prob, lambda z: stats.expon.pdf(z, scale=1.0 / rate))

def pbernlnorm(q, prob: float, meanlog: float, sdlog: float):
    return _bern_cdf(q, prob, lambda z: stats.lognorm.cdf(z, s=sdlog, scale=np.exp(meanlog)))

def dbernlnorm(x, prob: float, meanlog: float, sdlog: float):
    return _bern_pdf(x, prob, lambda z: stats.lognorm.pdf(z, s=sdlog, scale=np.exp(meanlog)))

def pbernweibull(q, prob: float, shape: float, scale: float):
    return _bern_cdf(q, prob, lambda z: stats.weibull_min.cdf(z, c=shape, scale=scale))

def dbernweibull(x, prob: float, shape: float, scale: float):
    return _bern_pdf(x, prob, lambda z: stats.weibull_min.pdf(z, c=shape, scale=scale))

## Distribution registry
# ---------------------------------------------------------------------

@dataclass(frozen=True)
class DistributionSpec:
    name: str
    longname: str
    param_names: tuple[str, ...]
    start: Callable[..., dict[str, float]]
    pdf: Callable[..., np.ndarray]
    cdf: Callable[..., np.ndarray]
    ppf: Callable[..., np.ndarray]
    positive_only: bool = False
    bernoulli: bool = False

DISTRIBUTIONS: dict[str, DistributionSpec] = {
    'norm': DistributionSpec(
        'norm', 'Normal', ('mean', 'sd'), startnorm,
        lambda x, mean, sd: stats.norm.pdf(x, loc=mean, scale=sd),
        lambda q, mean, sd: stats.norm.cdf(q, loc=mean, scale=sd),
        lambda p, mean, sd: stats.norm.ppf(p, loc=mean, scale=sd),
    ),
    'lnorm': DistributionSpec(
        'lnorm', 'Log-Normal', ('meanlog', 'sdlog'), startlnorm,
        lambda x, meanlog, sdlog: stats.lognorm.pdf(x, s=sdlog, scale=np.exp(meanlog)),
        lambda q, meanlog, sdlog: stats.lognorm.cdf(q, s=sdlog, scale=np.exp(meanlog)),
        lambda p, meanlog, sdlog: stats.lognorm.ppf(p, s=sdlog, scale=np.exp(meanlog)),
        positive_only=True,
    ),
    'snorm': DistributionSpec(
        'snorm', 'Skew Normal', ('mean', 'sd', 'xi'), startsnorm,
        dsnorm, psnorm, qsnorm,
    ),
    'gamma': DistributionSpec(
        'gamma', 'Gamma', ('shape', 'scale'), startgamma,
        lambda x, shape, scale: stats.gamma.pdf(x, a=shape, scale=scale),
        lambda q, shape, scale: stats.gamma.cdf(q, a=shape, scale=scale),
        lambda p, shape, scale: stats.gamma.ppf(p, a=shape, scale=scale),
        positive_only=True,
    ),
    'exp': DistributionSpec(
        'exp', 'Exponential', ('rate',), startexp,
        lambda x, rate: stats.expon.pdf(x, scale=1.0 / rate),
        lambda q, rate: stats.expon.cdf(q, scale=1.0 / rate),
        lambda p, rate: stats.expon.ppf(p, scale=1.0 / rate),
        positive_only=True,
    ),
    'weibull': DistributionSpec(
        'weibull', 'Weibull', ('shape', 'scale'), startweibull,
        lambda x, shape, scale: stats.weibull_min.pdf(x, c=shape, scale=scale),
        lambda q, shape, scale: stats.weibull_min.cdf(q, c=shape, scale=scale),
        lambda p, shape, scale: stats.weibull_min.ppf(p, c=shape, scale=scale),
        positive_only=True,
    ),
    'gumbel': DistributionSpec(
        'gumbel', 'Gumbel', ('loc', 'scale'), startgumbel,
        dgumbel, pgumbel, qgumbel,
    ),
    'berngamma': DistributionSpec(
        'berngamma', 'Bernoulli-Gamma', ('prob', 'shape', 'scale'), startberngamma,
        dberngamma, pberngamma,
        lambda p, prob, shape, scale: np.where(
            p <= 1 - prob, 0.0, stats.gamma.ppf((p - (1 - prob)) / prob, a=shape, scale=scale)
        ),
        bernoulli=True,
    ),
    'bernexp': DistributionSpec(
        'bernexp', 'Bernoulli-Exponential', ('prob', 'rate'), startbernexp,
        dbernexp, pbernexp,
        lambda p, prob, rate: np.where(
            p <= 1 - prob, 0.0, stats.expon.ppf((p - (1 - prob)) / prob, scale=1.0 / rate)
        ),
        bernoulli=True,
    ),
    'bernlnorm': DistributionSpec(
        'bernlnorm', 'Bernoulli-Log-Normal', ('prob', 'meanlog', 'sdlog'), startbernlnorm,
        dbernlnorm, pbernlnorm,
        lambda p, prob, meanlog, sdlog: np.where(
            p <= 1 - prob, 0.0, stats.lognorm.ppf((p - (1 - prob)) / prob, s=sdlog, scale=np.exp(meanlog))
        ),
        bernoulli=True,
    ),
    'bernweibull': DistributionSpec(
        'bernweibull', 'Bernoulli-Weibull', ('prob', 'shape', 'scale'), startbernweibull,
        dbernweibull, pbernweibull,
        lambda p, prob, shape, scale: np.where(
            p <= 1 - prob, 0.0, stats.weibull_min.ppf((p - (1 - prob)) / prob, c=shape, scale=scale)
        ),
        bernoulli=True,
    ),
}

## Fitting empirical distributions to theoretical models
# ---------------------------------------------------------------------

@dataclass
class FittedDistribution:
    name: str
    longname: str
    params: dict[str, float]
    method: str
    success: bool
    objective: float

    @property
    def spec(self) -> DistributionSpec:
        return DISTRIBUTIONS[self.name]

    def pdf(self, x):
        return self.spec.pdf(np.asarray(x, dtype=float), **self.params)

    def cdf(self, q):
        return self.spec.cdf(np.asarray(q, dtype=float), **self.params)

    def ppf(self, p):
        return self.spec.ppf(_clip_prob(np.asarray(p, dtype=float)), **self.params)

    def exceedance(self, x):
        return 100.0 * (1.0 - self.cdf(x))

def _bounds_for(spec: DistributionSpec) -> list[tuple[float | None, float | None]]:
    bounds = []
    for p in spec.param_names:
        if p == 'prob':
            bounds.append((1.0e-6, 1.0 - 1.0e-6))
        elif p in {'sd', 'sdlog', 'shape', 'scale', 'rate', 'xi'}:
            bounds.append((1.0e-6, None))
        else:
            bounds.append((None, None))
    return bounds

def _pack_params(spec: DistributionSpec, params: Mapping[str, float]) -> np.ndarray:
    return np.array([params[k] for k in spec.param_names], dtype=float)

def _unpack_params(spec: DistributionSpec, theta: Sequence[float]) -> dict[str, float]:
    return {k: float(v) for k, v in zip(spec.param_names, theta)}

def _negative_log_likelihood(spec: DistributionSpec, x: np.ndarray, pars: dict[str, float]) -> float:
    dens = np.asarray(spec.pdf(x, **pars), dtype=float)
    if not np.all(np.isfinite(dens)):
        return np.inf
    return float(-np.sum(np.log(np.maximum(dens, _EPS))))

def _raw_moment(order: int, spec: DistributionSpec, pars: dict[str, float]) -> float:
    if spec.name == 'norm':
        mean, sd = pars['mean'], pars['sd']
        if order == 1:
            return mean
        if order == 2:
            return sd**2 + mean**2
    if spec.name == 'lnorm':
        return math.exp(order * (pars['meanlog'] + 0.5 * order * pars['sdlog'] ** 2))
    if spec.name == 'gamma':
        return pars['scale'] ** order * gamma_func(order + pars['shape']) / gamma_func(pars['shape'])
    if spec.name == 'exp':
        scale = 1.0 / pars['rate']
        return scale**order * gamma_func(1.0 + order)
    if spec.name == 'weibull':
        return pars['scale'] ** order * gamma_func(1.0 + order / pars['shape'])
    if spec.name == 'gumbel':
        if order == 1:
            return pars['loc'] + _EULER * pars['scale']
        if order == 2:
            return (math.pi * pars['scale']) ** 2 / 6.0 + (pars['loc'] + _EULER * pars['scale']) ** 2
    # fallback: numerical quadrature via quantiles
    probs = np.linspace(0.001, 0.999, 999)
    return float(np.mean(spec.ppf(probs, **pars) ** order))

def _gof_statistics(x: np.ndarray, cdf_vals: np.ndarray, n_params: int) -> dict[str, float]:
    x = np.sort(x)
    n = len(x)
    p = _clip_prob(np.sort(cdf_vals))
    i = np.arange(1, n + 1, dtype=float)

    ks = float(np.max(np.maximum(i / n - p, p - (i - 1) / n)))
    cvm = float(1.0 / (12.0 * n) + np.sum((p - (2.0 * i - 1.0) / (2.0 * n)) ** 2))
    ad = float(-n - np.sum((2.0 * i - 1.0) * (np.log(p) + np.log(1.0 - p[::-1]))) / n)

    return {'ad': ad, 'ks': ks, 'cvm': cvm}

def fit_distribution(
    x: Sequence[float],
    distr: str,
    method: str = 'mle',
    *,
    thres: float = 1.0,
    mge_stat: str = 'ad',
) -> FittedDistribution | None:
    """Fit a single distribution."""
    if distr not in DISTRIBUTIONS:
        raise ValueError(f'Unknown distribution: {distr}')

    method = method.lower()
    if method not in {'mle', 'mme', 'qme', 'mge', 'mse'}:
        raise ValueError('method must be one of: mle, mme, qme, mge, mse')

    spec = DISTRIBUTIONS[distr]
    x = _as_clean_array(x)
    if len(x) == 0:
        return None

    if spec.positive_only and np.any(x <= 0):
        warnings.warn(f'Values must be positive for "{distr}". Skipping this distribution.')
        return None

    start = spec.start(x, thres=thres) if spec.bernoulli else spec.start(x)
    theta0 = _pack_params(spec, start)
    bounds = _bounds_for(spec)

    xs, ecdf = empirical_cdf_values(x)
    n = len(xs)

    def objective(theta):
        pars = _unpack_params(spec, theta)
        try:
            if method == 'mle':
                val = _negative_log_likelihood(spec, x, pars)
            elif method == 'mme':
                orders = np.arange(1, len(spec.param_names) + 1)
                empirical = np.array([np.mean(x**o) for o in orders])
                theoretical = np.array([_raw_moment(int(o), spec, pars) for o in orders])
                scale = np.maximum(np.abs(empirical), 1.0)
                val = np.sum(((theoretical - empirical) / scale) ** 2)
            elif method == 'qme':
                probs = np.linspace(0.1, 0.9, len(spec.param_names))
                empirical_q = np.quantile(x, probs)
                theoretical_q = spec.ppf(probs, **pars)
                scale = np.maximum(np.abs(empirical_q), 1.0)
                val = np.sum(((theoretical_q - empirical_q) / scale) ** 2)
            elif method == 'mge':
                cdf_vals = spec.cdf(xs, **pars)
                val = _gof_statistics(xs, cdf_vals, len(spec.param_names))[mge_stat]
            else:  # mse
                cdf_vals = spec.cdf(xs, **pars)
                val = np.mean((cdf_vals - ecdf) ** 2)
            return float(val) if np.isfinite(val) else np.inf
        except Exception:
            return np.inf

    result = optimize.minimize(
        objective,
        theta0,
        method='Nelder-Mead',
        options={'maxiter': 5000, 'xatol': 1.0e-8, 'fatol': 1.0e-8},
    )

    # A bounded clean-up step helps keep scale/rate/shape/prob positive.
    try:
        result2 = optimize.minimize(
            objective,
            result.x if result.success else theta0,
            method='L-BFGS-B',
            bounds=bounds,
            options={'maxiter': 5000},
        )
        if result2.fun <= result.fun or not result.success:
            result = result2
    except Exception:
        pass

    if not np.isfinite(result.fun):
        return None

    pars = _unpack_params(spec, result.x)
    return FittedDistribution(
        name=spec.name,
        longname=spec.longname,
        params=pars,
        method=method,
        success=bool(result.success),
        objective=float(result.fun),
    )

def fit_distributions(
    x: Sequence[float],
    distr: Iterable[str] = ('norm', 'snorm', 'lnorm', 'gamma', 'exp', 'weibull', 'gumbel'),
    method: str = 'mle',
    *,
    thres: float = 1.0,
    mge_stat: str = 'ad',
) -> list[FittedDistribution]:
    """Fit several distributions and return all successful fits."""
    fits = []
    for dm in distr:
        try:
            fit = fit_distribution(
                x, dm, method=method, thres=thres, mge_stat=mge_stat
            )
            if fit is not None:
                fits.append(fit)
        except Exception as exc:
            print(f'ERROR: Distribution ({dm}); {exc}')
    return fits

def gof_statistics(fit: FittedDistribution, x: Sequence[float]) -> dict[str, float]:
    """Return AD, KS, CVM, AIC and BIC for a fitted distribution."""
    x = np.sort(_as_clean_array(x))
    n = len(x)
    cdf_vals = fit.cdf(x)
    stats_ = _gof_statistics(x, cdf_vals, len(fit.params))

    nll = _negative_log_likelihood(fit.spec, x, fit.params)
    k = len(fit.params)
    stats_['aic'] = 2.0 * k + 2.0 * nll
    stats_['bic'] = math.log(n) * k + 2.0 * nll
    return stats_

def select_best_distribution(
    fits: Sequence[FittedDistribution],
    x: Sequence[float],
    gof_stat: str = 'ad',
) -> tuple[FittedDistribution, dict[str, dict[str, float]]]:
    """Select the fitted distribution with the lowest requested GOF criterion."""
    if not fits:
        raise ValueError('No fitted distributions were provided.')
    gof_stat = gof_stat.lower()
    all_gof = {fit.name: gof_statistics(fit, x) for fit in fits}
    selected = min(fits, key=lambda fit: all_gof[fit.name][gof_stat])
    return selected, all_gof

## Empirical and smoothed probability-of-exceedance curves
# ---------------------------------------------------------------------

def ecdf_ts(x: Sequence[float]) -> dict[str, np.ndarray] | None:
    """Empirical ECDF probability of exceeding: y = 100 * (1 - F(x))."""
    arr = _as_clean_array(x)
    if len(arr) == 0:
        return None
    sx, ecdf = empirical_cdf_values(arr)
    return {'x': sx, 'y': 100.0 * (1.0 - ecdf)}

def _kde_density_grid(x: np.ndarray, adj: float = 1.0, xmin: float | None = None, xmax: float | None = None, n: int = 512):
    if len(np.unique(x)) < 2:
        raise ValueError('At least two unique values are needed for KDE smoothing.')
    kde = stats.gaussian_kde(x)
    kde.set_bandwidth(kde.factor * adj)
    if xmin is None:
        xmin = float(np.min(x))
    if xmax is None:
        xmax = float(np.max(x))
    grid = np.linspace(xmin, xmax, n)
    dens = kde(grid)
    return grid, dens

def ecdf_smooth_v1(x: Sequence[float], adj: float = 1.0, n: int = 512) -> dict[str, np.ndarray] | None:
    """Smoothed ECDF version 1 using a KDE and normalized cumulative density."""
    arr = _as_clean_array(x)
    if len(arr) == 0:
        return None
    ex = 0.05 * (np.max(arr) - np.min(arr))
    grid, dens = _kde_density_grid(arr, adj=adj, xmin=float(np.min(arr) - ex), xmax=float(np.max(arr) + ex), n=n)
    cdf = np.cumsum(dens) / np.sum(dens)
    return {'x': grid, 'y': 100.0 * (1.0 - cdf)}

def ecdf_smooth_v2(
    x: Sequence[float],
    adj: float = 1.0,
    extend: bool = False,
    n: int = 512,
) -> dict[str, np.ndarray] | None:
    """Smoothed ECDF version 2 using trapezoidal integration of a KDE."""
    arr = _as_clean_array(x)
    if len(arr) == 0:
        return None

    grid, dens = _kde_density_grid(arr, adj=adj, n=n)
    dx = np.diff(grid)
    dx = np.r_[dx[0], dx, dx[-1]]
    left = np.r_[0.0, dens]
    right = np.r_[dens, 0.0]
    area = dx * (left + right) / 2.0
    cdf_ext = np.cumsum(area)
    cdf_ext = cdf_ext / cdf_ext[-1]

    if extend:
        xout = np.r_[grid[0] - dx[0], grid, grid[-1] + dx[-1]]
        y = np.r_[0.0, cdf_ext]
    else:
        xout = grid
        y = cdf_ext[:-1]

    return {'x': xout, 'y': 100.0 * (1.0 - y)}

## Kernel density estimate
# ---------------------------------------------------------------------

def kde_ts(
    x: Sequence[float],
    adj: float = 1.0,
    n: int = 512,
) -> dict[str, np.ndarray] | None:
    arr = _as_clean_array(x)
    if len(arr) == 0:
        return None

    mn = float(np.min(arr))
    mx = float(np.max(arr))
    ex = (mx - mn) * 0.1
    mn = mn - ex
    mx = mx + ex

    grid, dens = _kde_density_grid(
        arr, adj=adj, xmin=mn, xmax=mx, n=n
    )
    return {'x': grid, 'y': dens}

## DL CDF and PDF curve
# ---------------------------------------------------------------------

def dl_cdf_erfinv(x, n=500):
    prob = np.linspace(0.0001, 0.9999, n)
    stdvar = 1.0 - prob

    # Normal quantile using erf inverse:
    # q = mean + std * sqrt(2) * erfinv(2*p - 1)
    z = np.sqrt(2.0) * erfinv(2.0 * stdvar - 1.0)

    x = x[~np.isnan(x)]
    mean = np.mean(x)
    std = np.std(x, ddof=0)
    cdf = mean + std * z
    return {'x': cdf, 'y': 100 * prob}

def dl_pdf_erfinv(x, n=500):
    x = x[~np.isnan(x)]
    mean = np.mean(x)
    std = np.std(x, ddof=0)

    prob = np.linspace(0.0001, 0.9999, n)
    # z = erfinv(1.0 - 2.0 * prob)
    z = erfinv(2.0 * prob - 1.0)
    v = mean + std * np.sqrt(2.0) * z
    pdf = np.exp(-(z ** 2)) / np.sqrt(np.pi)
    return {'x': v, 'y': pdf}
