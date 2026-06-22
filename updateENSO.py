from app.misc.scripts.enso_update import *

def main():
    sep = ''.join(['-'] * 60)

    print(f'{sep}\n Updating NOAA CPC Oceanic Niño Index (ONI)')
    update_enso_oni_cpc('oni')

    print(f'{sep}\n Updating NOAA CPC Relative Oceanic Niño Index (RONI)')
    update_enso_oni_cpc('roni')

    print(f'{sep}\n Updating NOAA CPC Weekly OISST.v2.1')
    update_enso_oisstv21_cpc('weekly')

    print(f'{sep}\n Updating NOAA CPC Monthly OISST.v2.1')
    update_enso_oisstv21_cpc('monthly')

    print(f'{sep}\n Updating NOAA CPC Monthly ERSST v5')
    update_enso_ersstv5_cpc_monthly()

    print(f'{sep}\n Updating NOAA NCEI Monthly ERSST v5')
    update_enso_ersst_ncei(5)

    print(f'{sep}\n Updating NOAA NCEI Monthly ERSST v6')
    update_enso_ersst_ncei(6)

    print(f'{sep}\n Updating NOAA NCEI Monthly Indian Ocean Dipole (IOD) computed with ERSST v5')
    update_iod_ersst_ncei(5)

    print(f'{sep}\n Updating NOAA NCEI Monthly Indian Ocean Dipole (IOD) computed with ERSST v6')
    update_iod_ersst_ncei(6)

    print(f'{sep}\n Updating NOAA CPC ENSO Probabilities and Strength Probabilities')
    update_enso_probabilities()

if __name__ == '__main__':
    main()
