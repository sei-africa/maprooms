import numpy as np
import statsmodels.api as sm
# from scipy.stats import linregress

def linear_model(x, y):
    if np.ptp(y) == 0:
        eps = abs(y[0]) * 1e-6 if y[0] != 0 else 1e-6
        y = y + np.random.normal(0, eps, size=y.shape)

    X = sm.add_constant(x)
    model = sm.OLS(y, X, missing='drop').fit()
    coeffs = {
        'slope': model.params[1],
        'std_error_slope': model.bse[1],
        't_value_slope': model.tvalues[1],
        'p_value_slope': model.pvalues[1],
        'intercept': model.params[0],
        'std_error_intercept': model.bse[0],
        't_value_intercept': model.tvalues[0],
        'p_value_intercept': model.pvalues[0],
        'r_squared': model.rsquared,
        'adj_r_squared': model.rsquared_adj,
        'sigma': np.sqrt(model.mse_resid),
        'f_statistic': model.fvalue
    }

    return {
        k: float(np.round(v, 6))
        for k, v in coeffs.items()
    }
