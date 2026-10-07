from datetime import datetime

def format_tseries_dates(dates_l, time_res):
    if time_res == 'monthly':
        tmp = [
                datetime.strptime(t, '%Y%m')
                for t in dates_l
            ]
        res = [t.strftime('%Y-%m-16') for t in tmp]
    elif time_res == 'dekadal':
        y = [s[:4] for s in dates_l]
        m = [s[4:6] for s in dates_l]
        dk = [s[6:] for s in dates_l]
        dy = [
                '01' if d == '1'
                else 
                '11' if d == '2'
                else
                '21'
                for d in dk
            ]
        res = ['-'.join(l) for l in zip(y, m, dy)]
    elif time_res == 'seasonal':
        def _format_seasonal_date(date):
            seas = date.split('_')
            m1 = datetime.strptime(seas[0], '%Y-%m')
            m2 = datetime.strptime(seas[1], '%Y-%m')
            month = m2.month - m1.month
            year = m2.year - m1.year
            n_month = year * 12 + month + 1
            mf = n_month // 2 + 1
            yr = m1.year + (m1.month + mf - 1) // 12
            mo = (m1.month + mf - 1) % 12
            if mo == 0:
                mo = 12
            dy = 1 if n_month % 2 == 0 else 16
            return f'{yr}-{mo:02}-{dy:02}'

        res = [_format_seasonal_date(d) for d in dates_l]
    elif time_res == 'daily':
        def _format_dailyseason_date(date):
            seas = date.split('_')
            d1 = datetime.strptime(seas[0], '%Y-%m-%d')
            d2 = datetime.strptime(seas[1], '%Y-%m-%d')
            m = d1 + (d2 - d1) / 2
            return m.strftime('%Y-%m-%d')

        res = [_format_dailyseason_date(d) for d in dates_l]
    else:
        res = None

    return res
