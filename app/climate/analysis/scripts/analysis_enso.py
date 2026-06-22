from app.dst_api.scripts.dates import add_months
from app.misc.scripts.enso_update import read_enso_probabilities
from app.misc.scripts.enso import (read_enso_oni_cpc,
                                   read_enso_data_monthly,
                                   enso_alert_classification)
from app.scripts.dial_plot import draw_dial_image

def climate_analysis_enso_alert_dial(params):
    fcst = read_enso_probabilities()
    issue_date = fcst['probabilities']['issued_date']
    issue_date = issue_date.strftime('%Y-%m')

    month_oni = add_months(issue_date, -3)
    oni_df = read_enso_oni_cpc('oni', month=month_oni)

    month_anom = add_months(issue_date, -2)
    anom_df = read_enso_data_monthly(
        'oisstv21_cpc',
        ['year', 'month', '"anom_nino3.4"'],
        start=month_anom
    )

    enso_alert = enso_alert_classification(
        fcst['probabilities'],
        fcst['strengths'],
        oni_df['anom'].round(1).to_numpy(),
        anom_df['anom_nino3.4'].round(1).to_numpy()
    )

    img_png = draw_dial_image(
        enso_alert,
        params,
        figsize=(8.6, 6.2)
    )
    data = {
        'issue_date': issue_date,
        'png': img_png
    }
    return {'status': 0, 'data': data}
