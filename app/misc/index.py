from flask import Blueprint, request, send_file
from flask import current_app as app
import json
import os
import io
from pypdf import PdfReader, PdfWriter
from app.scripts._colors import COLORS_MAPROOM
from app.scripts.subdivision import get_subdivisions_data
from app.scripts.colorbar import matplotlib_invalid_colors
from app.scripts.imagepng import raster_colorbar_imagePng
from .scripts.sqlite import getDataTemporalCoverage

misc = Blueprint(
    'misc',
    __name__,
    static_folder='static',
    static_url_path='/static/misc',
)

@misc.route('/map_subdivisions_data')
def map_subdivisions_data():
    sub_data = get_subdivisions_data()
    return json.dumps(sub_data)

@misc.route('/maproom_colors')
def maproom_colors():
    return json.dumps(COLORS_MAPROOM)

@misc.route('/preview_user_colobar', methods=['POST'])
def preview_user_colobar():
    params = request.get_json()
    user_col = matplotlib_invalid_colors(
        params['color_cbar']
    )
    if user_col is not None:
        return json.dumps(
                {
                    'status': -1,
                    'colors': user_col
                }
            )

    cbar_png = raster_colorbar_imagePng(
        params['color_cbar']
    )
    return json.dumps(
            {
                'status': 0,
                'colors': cbar_png
            }
        )

@misc.route('/enso_system_alert')
def enso_system_alert():
    pdf_file = 'apcc_enso_alert_criteria.pdf'
    pdf_path = os.path.join(misc.root_path, 'static', 'pdfs', pdf_file)

    reader = PdfReader(pdf_path)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    # Custom browser tab title
    writer.add_metadata({
        '/Title': 'ENSO Alert System'
    })

    pdf_buffer = io.BytesIO()
    writer.write(pdf_buffer)
    pdf_buffer.seek(0)

    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=False,
        download_name='enso_system_alert.pdf'
    )

# @misc.route('/enso_system_alert')
# def enso_system_alert():
#     pdf_file = 'apcc_enso_alert_criteria.pdf'
#     pdf_path = os.path.join(misc.root_path, 'static', 'pdfs', pdf_file)
#     return send_file(
#         pdf_path,
#         mimetype='application/pdf',
#         as_attachment=False,
#         download_name='enso_system_alert.pdf'
#     )

@misc.route('/enso_temporal_coverage', methods=['POST'])
def enso_temporal_coverage():
    params = request.get_json()
    obj = getDataTemporalCoverage(params['table'], params['parent'])
    return json.dumps(obj)
