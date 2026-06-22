import pandas as pd
from .sqlite import (tableLastRecords,
                     writeDataToTable,
                     readPandasDataFrame,
                     readENSOMonthlyDataFrame)
from .enso import (monthly_sst_products,
                   table_monthly_sst_products)

def _nino34_monthly_sst_mean(table, name):
    df = readENSOMonthlyDataFrame(
        table,
        ['year', 'month', '"sst_nino3.4"'],
        start='1991-01',
        end= '2020-12'
    )
    mean = (
        df.groupby('month')['sst_nino3.4']
        .mean().reset_index()
    )
    mean.columns = ['month', name]
    return mean

def climatology_nino34_monthly_sst():
    sst_prod = monthly_sst_products()
    clim = []
    for p in sst_prod:
        clim += [
            _nino34_monthly_sst_mean(p['table'], p['name'])
        ]

    df = (
        pd.concat([d.set_index('month') for d in clim], axis=1)
          .reset_index()
    )
    writeDataToTable(df, 'sst_climatology', 'replace')

def anomaly_nino34_monthly_sst_all(lastrows=4):
    sst_prod = monthly_sst_products()
    tmp = {}
    for p in sst_prod:
        dl = tableLastRecords(
            p['table'],
            ['year', 'month', '"sst_nino3.4"', '"anom_nino3.4"'],
            ['year', 'month'],
            lastrows
        )
        df = pd.DataFrame(dl)
        df = (
            df.sort_values(['year', 'month'])
              .reset_index(drop=True)
        )
        tmp[p['name']] = df

    clim = readPandasDataFrame('*', 'sst_climatology')

    for pr, df in tmp.items():
        df = df.merge(
            clim[['month', pr]],
            on='month',
            how='left'
        )
        df['canom_nino3.4'] = (
            df['sst_nino3.4'] - df[pr]
        ).round(2)
        tmp[pr] = df.drop(columns=[pr])

    return tmp

def anomaly_nino34_monthly_sst(sst_product, lastrows=2, compute=False):
    table = table_monthly_sst_products(sst_product)

    if compute:
        clim = readPandasDataFrame(
            ['month', sst_product],
            'sst_climatology'
        )
        dl = tableLastRecords(
            table,
            ['year', 'month', '"sst_nino3.4"'],
            ['year', 'month'],
            lastrows
        )
        df = pd.DataFrame(dl)
        df = (
            df.sort_values(['year', 'month'])
              .reset_index(drop=True)
        )
        df = df.merge(
            clim[['month', sst_product]],
            on='month',
            how='left'
        )
        df['anom_nino3.4'] = (
            df['sst_nino3.4'] - df[sst_product]
        ).round(2)
        df = df.drop(
            columns=['sst_nino3.4', sst_product]
        )
    else:
        dl = tableLastRecords(
            table,
            ['year', 'month', '"anom_nino3.4"'],
            ['year', 'month'],
            lastrows
        )
        df = pd.DataFrame(dl)
        df = (
            df.sort_values(['year', 'month'])
              .reset_index(drop=True)
        )
    return df


# anomaly_nino34_monthly_sst_all(2)
# anomaly_nino34_monthly_sst('oisstv21_cpc')
# anomaly_nino34_monthly_sst('oisstv21_cpc', 2, True)
# anomaly_nino34_monthly_sst('ersstv5_cpc', 2, True)

