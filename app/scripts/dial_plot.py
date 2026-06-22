import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Wedge, Circle, FancyBboxPatch
from .imagepng import render_image_png

plt.switch_backend('Agg')

def draw_dial_image(data_class, params, figsize=(8.6, 6.2)):
    score = data_class['score']
    nb_class = len(data_class['definition'])

    text_col = 'black'
    if 'theme' in params:
        if params['theme'] == 'dark':
            text_col = 'white'

    # Circles
    center = (0, 0)
    radius = 1.0
    width = 0.5
    angles = np.linspace(180, 0, nb_class + 1)
    mid_angles = (angles[:-1] + angles[1:]) / 2

    # Arrow
    arrow_radius = 0.83
    arrow_theta = np.deg2rad(mid_angles[score])
    arrow_tip_x = arrow_radius * np.cos(arrow_theta)
    arrow_tip_y = arrow_radius * np.sin(arrow_theta)

    # Labels
    label_radius = 1.05
    label_theta = np.deg2rad(mid_angles)
    label_x = label_radius * np.cos(label_theta)
    label_y = label_radius * np.sin(label_theta)
    label_r = mid_angles - 90

    # Title label
    title_radius = 1.18
    title_left_x = title_radius * np.cos(np.deg2rad(135))
    title_left_y = title_radius * np.sin(np.deg2rad(135))
    title_left_r = 135 - 90
    title_right_x = title_radius * np.cos(np.deg2rad(45))
    title_right_y = title_radius * np.sin(np.deg2rad(45))
    title_right_r = 45 - 90

    #######
    fig, ax = plt.subplots(figsize=figsize)
    ax.set_aspect('equal')
    ax.axis('off')

    for i in range(nb_class):
        color = data_class['definition'][i]['color']
        wedge = Wedge(
            center,
            radius,
            angles[i + 1],
            angles[i],
            width=width,
            facecolor=color,
            edgecolor='white',
            linewidth=2,
        )
        ax.add_patch(wedge)

    mid_circle = Wedge(center, 0.26, 0, 180, facecolor='#b8b8b8')
    ax.add_patch(mid_circle)

    ax.arrow(
        0,
        0,
        arrow_tip_x,
        arrow_tip_y,
        width=0.018,
        head_width=0.09,
        head_length=0.13,
        length_includes_head=True,
        color='black',
    )

    arrow_circle = Circle(center, radius=0.025, color='black')
    ax.add_patch(arrow_circle)

    for i in range(nb_class):
        label_text = data_class['definition'][i]['label']
        ax.text(
            label_x[i],
            label_y[i],
            label_text,
            fontsize=13,
            color=text_col,
            ha='center',
            va='center',
            rotation=label_r[i],
            rotation_mode='anchor',
            transform_rotates_text=True
        )

    if 'left_title' in data_class:
        ax.text(
            title_left_x,
            title_left_y,
            data_class['left_title'],
            fontsize=16,
            weight='bold',
            color=text_col,
            ha='center',
            va='center',
            rotation=title_left_r,
            rotation_mode='anchor'
        )

    if 'right_title' in data_class:
        ax.text(
            title_right_x,
            title_right_y,
            data_class['right_title'],
            fontsize=16,
            weight='bold',
            color=text_col,
            ha='center',
            va='center',
            rotation=title_right_r,
            rotation_mode='anchor'
        )

    status_color = data_class['definition'][score]['color']
    bar = FancyBboxPatch(
        (-0.92, -0.23),
        1.84,
        0.16,
        boxstyle='round,pad=0.02,rounding_size=0.10',
        linewidth=0,
        facecolor=status_color,
    )
    ax.add_patch(bar)

    status_text = data_class['definition'][score]['state']
    status_text_col = 'black' if score == 3 else text_col
    ax.text(
        0,
        -0.15,
        status_text,
        fontsize=22,
        color=status_text_col,
        ha='center',
        va='center'
    )

    is_ymin = False
    if 'left_text' in data_class:
        is_ymin = True
        left_text = data_class['left_text']
        ax.text(
            -1.0,
            -0.35,
            left_text,
            fontsize=12,
            color=text_col,
            ha='left'
        )

    if 'right_text' in data_class:
        is_ymin = True
        right_text = data_class['right_text']
        ax.text(
            1.0,
            -0.35,
            right_text,
            fontsize=12,
            color=text_col,
            ha='right'
        )

    ymin = -0.4 if is_ymin else -0.3
    ax.set_xlim(-1.15, 1.15)
    ax.set_ylim(ymin, 1.15)

    return render_image_png(plt)
