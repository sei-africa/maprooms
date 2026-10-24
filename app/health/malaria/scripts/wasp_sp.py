
import re

import numpy as np
import pandas as pd

from app.scripts.colorbar import check_invalid_colors
from app.scripts.imagepng import create_imagePng

from .wasp import (
    _arguments,
    _integer,
    WASP_Weighted_anomalies,
)


from .wasp_data import (
    get_wasp_xr_data,
    get_wasp_parameters,
)


def get_health_wasp_sp_data(params):
    arguments = _arguments(params)

    month = str(params["Date"])

    if not re.fullmatch(
        r"\d{4}-(0[1-9]|1[0-2])",
        month,
    ):
        raise ValueError("Select a valid ending month.")

    length = arguments["tscale"]

    ending = pd.Timestamp(f"{month}-01")
    beginning = ending - pd.DateOffset(
        months=length - 1
    )

    precip = get_wasp_xr_data(params)
    fitted = get_wasp_parameters(precip, params)

    selected = precip.sel(
        time=slice(beginning, ending)
    )

    if (
        selected.sizes["time"] != length
        or pd.Timestamp(selected.time.values[-1]) != ending
    ):
        raise ValueError(
            "The selected month has no complete accumulation window."
        )

    selected = selected.compute(scheduler="single-threaded")


    weighted = WASP_Weighted_anomalies(
        selected,
        fitted,
    )

    field = (
        weighted.sum("time", skipna=False)
        / fitted["normalization"]
    )

    field = (
        field.where(np.isfinite(field))
        .transpose("lat", "lon")
        .compute(scheduler="single-threaded")
    )

    if not np.isfinite(field.values).any():
        raise ValueError(
            "No valid WASP values for this month and calibration."
        )

    return {
        "lon": field.lon.values,
        "lat": field.lat.values,
        "data": field.values,
        "varid": "wasp",
        "longname": f"WASP-{length}",
        "units": "",
        "date": (
            f"{beginning:%Y-%m}–{ending:%Y-%m}; "
            # f"calibration "
            # f"{arguments['start_year']}–{arguments['end_year']}"
        ),
    }


def health_wasp_sp_data(params):
    colorbar = params["colorbar"]

    check = check_invalid_colors(colorbar)

    if check["status"] == -1:
        return check

    data = get_health_wasp_sp_data(params)


    # comparison_date = params.get("comparisonDate")

    # if comparison_date is not None:
    #     comparison_date = str(comparison_date).strip()

    #     if not re.fullmatch(
    #         r"\d{4}-(0[1-9]|1[0-2])",
    #         comparison_date,
    #     ):
    #         raise ValueError(
    #             "Select a valid comparison base month."
    #         )

    #     length = _arguments(params)["tscale"]

    #     # reference_start = pd.Timestamp(
    #     #     f"{comparison_date}-01"
    #     # )

    #     # reference_end = reference_start + pd.DateOffset(
    #     #     months=length - 1
    #     # )

    #     reference_end = pd.Timestamp(
    #         f"{comparison_date}-01"
    #     )

    #     reference_start = reference_end - pd.DateOffset(
    #         months=length - 1
    #     )

    #     # weuse exactly the same WASP calculation as the selected map.
    #     reference = get_health_wasp_sp_data({
    #         **params,
    #         "Date": reference_end.strftime("%Y-%m"),
    #     })

    #     if not (
    #         np.array_equal(data["lon"], reference["lon"])
    #         and np.array_equal(data["lat"], reference["lat"])
    #     ):
    #         raise ValueError(
    #             "Map and comparison grids do not match."
    #         )

    #     data["data"] = (
    #         data["data"] - reference["data"]
    #     )

    #     if not np.isfinite(data["data"]).any():
    #         raise ValueError(
    #             "No common valid cells for the map "
    #             "and comparison periods."
    #         )

    #     data["longname"] = (
    #         f"WASP-{length}: departure from comparison baseline"
    #     )

    #     data["date"] += (
    #         # f"; reference "
    #         # f"{reference_start:%Y-%m}–{reference_end:%Y-%m}"
    #         f"Base year: "
    #         f"{reference_start:%Y-%m}"
    #     )

    
    base_start = _integer(
        params, "comparisonStartYear", 1, 9998
    )
    base_end = _integer(
        params, "comparisonEndYear", base_start, 9998
    )
    start_month = _integer(
        params, "comparisonStartMonth", 1, 12
    )

    length = _arguments(params)["tscale"]
    reference_values = []

    for year in range(base_start, base_end + 1):
        reference_start = pd.Timestamp(
            year=year,
            month=start_month,
            day=1,
        )

        reference_end = reference_start + pd.DateOffset(
            months=length - 1
        )

        reference = get_health_wasp_sp_data({
            **params,
            "Date": reference_end.strftime("%Y-%m"),
        })

        if not (
            np.array_equal(data["lon"], reference["lon"])
            and np.array_equal(data["lat"], reference["lat"])
        ):
            raise ValueError(
                "Map and base-year grids do not match."
            )

        reference_values.append(reference["data"])

    baseline = np.mean(
        np.stack(reference_values),
        axis=0,
    )

    data["data"] = data["data"] - baseline

    if not np.isfinite(data["data"]).any():
        raise ValueError(
            "No common valid cells for the map and base years."
        )

    data["longname"] = (
        f"WASP-{length}: departure from base years"
    )

    data["date"] += (
        f"Base year: {base_start}–{base_end}, "
        f"starting {reference_start:%b}"
    )

    breaks = colorbar["break_cbar"]

    if breaks is None:
        breaks = [-3, -2, -1, 0, 1, 2, 3]

    color_args = {
        "breaks": breaks,
        "colors_ext": (
            list(colorbar["color_ext"])
            if colorbar["color_ext"] is not None
            else None
        ),
    }

    if colorbar["color_type"] == "preset":
        color_args["color_name"] = colorbar["color_cbar"]
    else:
        color_args["colors"] = colorbar["color_cbar"]

    result = create_imagePng(
        data,
        **color_args,
    )

    if result is None:
        return {
            "status": -1,
            "message": "Unable to render the WASP map.",
        }

    result["date"] = data["date"]
    result["ckeys"]["title"] = data["longname"]

    return {
        "status": 0,
        "data": result,
    }

