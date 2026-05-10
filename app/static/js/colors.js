class ColorInterpolator {
    constructor(colors, positions, mode = 'hsl') {
        //mode: 'hsl' or 'rgb'
        if (colors.length !== positions.length)
            throw new Error('Colors and positions must have the same length.');
        this.colors = colors;
        this.positions = positions;
        this.mode = mode.toLowerCase();
    }

    getColor(pos) {
        const minP = Math.min(...this.positions);
        const maxP = Math.max(...this.positions);
        if (pos <= minP) return this.colors[this.positions.indexOf(minP)];
        if (pos >= maxP) return this.colors[this.positions.indexOf(maxP)];

        for (let i = 0; i < this.positions.length - 1; i++) {
            const p1 = this.positions[i];
            const p2 = this.positions[i + 1];
            if ((pos <= p1 && pos >= p2) || (pos >= p1 && pos <= p2)) {
                const t = (pos - p2) / (p1 - p2);
                const c1 = this.hexToRgb(this.colors[i]);
                const c2 = this.hexToRgb(this.colors[i + 1]);

                if (this.mode === 'hsl') {
                    const hsl1 = this.rgbToHsl(c1);
                    const hsl2 = this.rgbToHsl(c2);
                    let h = hsl1.h + t * (hsl2.h - hsl1.h);
                    let s = hsl1.s + t * (hsl2.s - hsl1.s);
                    let l = hsl1.l + t * (hsl2.l - hsl1.l);
                    // Hue wrap-around
                    if (Math.abs(hsl2.h - hsl1.h) > 180) {
                        if (hsl2.h > hsl1.h) h += 360;
                        else h -= 360;
                    }
                    h = (h + 360) % 360;
                    return this.rgbToHex(...this.hslToRgb({ h, s, l }));
                } else {
                    const r = Math.round(c1.r + t * (c2.r - c1.r));
                    const g = Math.round(c1.g + t * (c2.g - c1.g));
                    const b = Math.round(c1.b + t * (c2.b - c1.b));
                    return this.rgbToHex(r, g, b);
                }
            }
        }
        return this.colors[this.colors.length - 1];
    }

    hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
        const num = parseInt(hex, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    rgbToHsl({ r, g, b }) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) h = s = 0;
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h *= 60;
        }
        return { h, s, l };
    }

    hslToRgb({ h, s, l }) {
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r, g, b;
        if (h < 60)[r, g, b] = [c, x, 0];
        else if (h < 120)[r, g, b] = [x, c, 0];
        else if (h < 180)[r, g, b] = [0, c, x];
        else if (h < 240)[r, g, b] = [0, x, c];
        else if (h < 300)[r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];
        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    }
}

function getColorsPosition(colors) {
    const length = colors.length
    return generateSequence01(length);
}

function plottyAddColorScales() {
    // const endpoint = createEndpoint(
    //     'misc',
    //     'maproom_colors'
    // );
    // // const endpoint = '/maproom_colors';
    // $.getJSON(endpoint, (json) => {
    $.getJSON('/maproom_colors', (json) => {
        for (const key in json) {
            json[key]
            plotty.addColorScale(
                key,
                json[key].colors,
                getColorsPosition(json[key].colors)
            );
        }
    });
}

function formatColorsChart(n, color_name) {
    const cInterp = new ColorInterpolator(
        plotty.colorscales[color_name].colors,
        plotty.colorscales[color_name].positions
    );
    const pos = generateSequence01(n);
    return pos.map(x => cInterp.getColor(x));
}