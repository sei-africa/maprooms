
import numpy as np
import xarray as xr

from app.dst_api.scripts.aggregate_data import (
    aggregate_climatology,
)

import os

from app.scripts.maproom_items import (
    parse_config_yaml_file,
)

CMST_HUMIDITY_SOURCE = 'mean_relative_humidity'

# CMST_PRODUCTS = {
#     'Annual_Sum': 'Number of suitable months',
#     'AllCondProb': 'Occurrence of all climate conditions',
#     'PcpnCondProb': 'Occurrence of precipitation above 80 mm',
#     'TempCondProb': 'Occurrence of temperature between 18°C and 32°C',
#     'RHCondProb': 'Occurrence of relative humidity above 60%',
# }


CMST_PRODUCTS = (
    'Annual_Sum',
    'AllCondProb',
    'PcpnCondProb',
    'TempCondProb',
    'RHCondProb',
)


CMST_CONDITIONS = (
    'AllCondProb',
    'PcpnCondProb',
    'TempCondProb',
    'RHCondProb',
)

def get_cmst_text():
    component_dir = os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )

    return parse_config_yaml_file(
        component_dir,
        'cmst.yaml',
    )
    
def cmst_conditions(data):
    rainfall = data['rainfall']
    temperature = data['temperature']
    humidity = data['humidity']

    valid_rain = np.isfinite(rainfall)
    valid_temp = np.isfinite(temperature)
    valid_humidity = np.isfinite(humidity)

    rain_condition = rainfall > 80

    temp_condition = (
        (temperature > 18)
        & (temperature < 32)
    )

    humidity_condition = humidity > 60

    return xr.Dataset({
        'PcpnCondProb': (
            rain_condition.astype(float)
            .where(valid_rain)
        ),
        'TempCondProb': (
            temp_condition.astype(float)
            .where(valid_temp)
        ),
        'RHCondProb': (
            humidity_condition.astype(float)
            .where(valid_humidity)
        ),
        'AllCondProb': (
            (
                rain_condition
                & temp_condition
                & humidity_condition
            )
            .astype(float)
            .where(
                valid_rain
                & valid_temp
                & valid_humidity
            )
        ),
    })


def cmst_compute_fields(data, min_year):
    conditions = cmst_conditions(data)

    def calculate_frequency(group):
        return aggregate_climatology(
            group,
            clim_fun='frequency',
            min_year=min_year,
            frequency_oper='>',
            frequency_thres=0.5,
            time_dim='time',
        )

    probabilities = (
        conditions
        .groupby('time.month')
        .map(calculate_frequency)
        .reindex(month=np.arange(1, 13))
    )

    common_valid = (
        np.isfinite(data['rainfall'])
        & np.isfinite(data['temperature'])
        & np.isfinite(data['humidity'])
    )

    def calculate_mean(group):
        return aggregate_climatology(
            group,
            clim_fun='mean',
            min_year=min_year,
            time_dim='time',
        )

    climatology = (
        data
        .where(common_valid)
        .groupby('time.month')
        .map(calculate_mean)
        .reindex(month=np.arange(1, 13))
    )

    climatological_conditions = cmst_conditions(
        climatology
    )

    annual_sum = climatological_conditions[
        'AllCondProb'
    ].sum(
        dim='month',
        skipna=False,
    )

    fields = probabilities.assign(
        Annual_Sum=annual_sum
    )

    fields.attrs['humidity_source'] = (
        CMST_HUMIDITY_SOURCE
    )

    return fields
